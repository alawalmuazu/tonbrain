// TonBrain SDK — Escrow Payment Flow
import { Logger } from '../utils/logger.js';
import { PaymentError } from '../utils/errors.js';
import type { WalletManager } from '../core/wallet.js';
import { randomUUID } from 'crypto';

export type EscrowState = 'created' | 'funded' | 'released' | 'refunded' | 'disputed' | 'expired';

export interface EscrowPayment {
  id: string;
  state: EscrowState;
  payer: string;
  payee: string;
  amount: string;
  token: 'TON' | string; // TON or Jetton address
  description: string;
  createdAt: number;
  expiresAt: number;
  fundedTxHash?: string;
  releaseTxHash?: string;
  refundTxHash?: string;
  metadata?: Record<string, unknown>;
}

interface EscrowTransitions {
  [key: string]: EscrowState[];
}

const VALID_TRANSITIONS: EscrowTransitions = {
  created: ['funded', 'expired'],
  funded: ['released', 'refunded', 'disputed'],
  disputed: ['released', 'refunded'],
  released: [],
  refunded: [],
  expired: [],
};

/**
 * EscrowManager — Manages escrow payment flows for agent-to-agent transactions.
 * 
 * Flow: create → fund → release/refund
 * 
 * This enables trustless agent-to-agent payments on TON:
 * 1. Agent A creates an escrow request
 * 2. Agent A funds the escrow (TON or Jettons locked)
 * 3. Agent B completes the task
 * 4. Agent A releases payment to Agent B (or refunds if task fails)
 * 
 * In production, this would use a smart contract for on-chain escrow.
 * For the hackathon, we implement the state machine and coordination logic.
 */
export class EscrowManager {
  private escrows: Map<string, EscrowPayment> = new Map();
  private logger: Logger;

  constructor(private wallet: WalletManager) {
    this.logger = new Logger('Escrow');
  }

  /**
   * Create a new escrow payment
   */
  create(params: {
    payer: string;
    payee: string;
    amount: string;
    token?: string;
    description: string;
    expiresInMinutes?: number;
    metadata?: Record<string, unknown>;
  }): EscrowPayment {
    const escrow: EscrowPayment = {
      id: randomUUID(),
      state: 'created',
      payer: params.payer,
      payee: params.payee,
      amount: params.amount,
      token: params.token ?? 'TON',
      description: params.description,
      createdAt: Date.now(),
      expiresAt: Date.now() + (params.expiresInMinutes ?? 60) * 60 * 1000,
      metadata: params.metadata,
    };

    this.escrows.set(escrow.id, escrow);
    this.logger.info(`Escrow created: ${escrow.id}`, {
      amount: escrow.amount,
      token: escrow.token,
    });

    return escrow;
  }

  /**
   * Mark escrow as funded (payer has sent funds)
   */
  async fund(escrowId: string, txHash: string): Promise<EscrowPayment> {
    const escrow = this.getEscrow(escrowId);
    this.transition(escrow, 'funded');
    escrow.fundedTxHash = txHash;
    this.logger.info(`Escrow funded: ${escrowId}`, { txHash });
    return escrow;
  }

  /**
   * Release funds to the payee (task completed successfully)
   */
  async release(escrowId: string): Promise<EscrowPayment> {
    const escrow = this.getEscrow(escrowId);
    this.transition(escrow, 'released');

    // In production, this would trigger the smart contract release
    this.logger.info(`Escrow released: ${escrowId} → ${escrow.payee}`, {
      amount: escrow.amount,
    });

    return escrow;
  }

  /**
   * Refund the payer (task failed or cancelled)
   */
  async refund(escrowId: string): Promise<EscrowPayment> {
    const escrow = this.getEscrow(escrowId);
    this.transition(escrow, 'refunded');

    this.logger.info(`Escrow refunded: ${escrowId} → ${escrow.payer}`, {
      amount: escrow.amount,
    });

    return escrow;
  }

  /**
   * Raise a dispute on escrow
   */
  dispute(escrowId: string): EscrowPayment {
    const escrow = this.getEscrow(escrowId);
    this.transition(escrow, 'disputed');
    this.logger.warn(`Escrow disputed: ${escrowId}`);
    return escrow;
  }

  /**
   * Get escrow by ID
   */
  getEscrow(id: string): EscrowPayment {
    const escrow = this.escrows.get(id);
    if (!escrow) {
      throw new PaymentError(`Escrow not found: ${id}`, { escrowId: id });
    }
    return escrow;
  }

  /**
   * List all escrows, optionally filtered by state
   */
  listEscrows(filter?: { state?: EscrowState; payer?: string; payee?: string }): EscrowPayment[] {
    let results = Array.from(this.escrows.values());

    if (filter?.state) results = results.filter(e => e.state === filter.state);
    if (filter?.payer) results = results.filter(e => e.payer === filter.payer);
    if (filter?.payee) results = results.filter(e => e.payee === filter.payee);

    return results;
  }

  /**
   * Check and expire old escrows
   */
  expireStale(): number {
    let count = 0;
    for (const escrow of this.escrows.values()) {
      if (escrow.state === 'created' && Date.now() > escrow.expiresAt) {
        escrow.state = 'expired';
        count++;
        this.logger.info(`Escrow expired: ${escrow.id}`);
      }
    }
    return count;
  }

  private transition(escrow: EscrowPayment, to: EscrowState): void {
    const allowed = VALID_TRANSITIONS[escrow.state];
    if (!allowed || !allowed.includes(to)) {
      throw new PaymentError(
        `Invalid escrow transition: ${escrow.state} → ${to}`,
        { escrowId: escrow.id, from: escrow.state, to }
      );
    }
    escrow.state = to;
  }
}
