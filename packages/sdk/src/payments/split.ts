// TonBrain SDK — Payment Splitting
import { Logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export interface SplitRecipient {
  address: string;
  share: number; // Basis points (100 = 1%) or fixed amount depending on mode
  label?: string;
}

export interface PaymentSplit {
  id: string;
  totalAmount: string;
  token: 'TON' | string;
  mode: 'proportional' | 'fixed';
  recipients: Array<SplitRecipient & { calculatedAmount: string }>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  results?: Array<{ address: string; amount: string; txHash?: string; error?: string }>;
}

/**
 * PaymentSplitter — Split payments across multiple recipients.
 * 
 * Use cases:
 * - Revenue sharing between collaborating agents
 * - Multi-party service payment distribution
 * - Commission splits for marketplace transactions
 * - Team payouts and bounty distributions
 */
export class PaymentSplitter {
  private splits: Map<string, PaymentSplit> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('PaymentSplit');
  }

  /**
   * Create a proportional payment split (shares in basis points, must total 10000)
   */
  createProportional(params: {
    totalAmount: string;
    token?: string;
    recipients: SplitRecipient[];
  }): PaymentSplit {
    const totalShares = params.recipients.reduce((sum, r) => sum + r.share, 0);
    if (totalShares !== 10000) {
      throw new Error(`Shares must total 10000 bps (100%), got ${totalShares}`);
    }

    const total = Number(params.totalAmount);
    const split: PaymentSplit = {
      id: randomUUID(),
      totalAmount: params.totalAmount,
      token: params.token ?? 'TON',
      mode: 'proportional',
      recipients: params.recipients.map(r => ({
        ...r,
        calculatedAmount: ((total * r.share) / 10000).toFixed(4),
      })),
      status: 'pending',
      createdAt: Date.now(),
    };

    this.splits.set(split.id, split);
    this.logger.info(`Proportional split created: ${split.id}`, {
      recipients: split.recipients.length,
      total: params.totalAmount,
    });

    return split;
  }

  /**
   * Create a fixed-amount payment split
   */
  createFixed(params: {
    token?: string;
    recipients: Array<{ address: string; amount: string; label?: string }>;
  }): PaymentSplit {
    const totalAmount = params.recipients
      .reduce((sum, r) => sum + Number(r.amount), 0)
      .toFixed(4);

    const split: PaymentSplit = {
      id: randomUUID(),
      totalAmount,
      token: params.token ?? 'TON',
      mode: 'fixed',
      recipients: params.recipients.map(r => ({
        address: r.address,
        share: 0,
        label: r.label,
        calculatedAmount: r.amount,
      })),
      status: 'pending',
      createdAt: Date.now(),
    };

    this.splits.set(split.id, split);
    this.logger.info(`Fixed split created: ${split.id}`, {
      recipients: split.recipients.length,
      total: totalAmount,
    });

    return split;
  }

  /**
   * Execute the split (would trigger actual transfers in production)
   */
  async execute(splitId: string): Promise<PaymentSplit> {
    const split = this.getSplit(splitId);
    if (split.status !== 'pending') {
      throw new Error(`Cannot execute ${split.status} split`);
    }

    split.status = 'executing';
    this.logger.info(`Executing split: ${splitId}`);

    // In production, this would batch-send transactions
    split.results = split.recipients.map(r => ({
      address: r.address,
      amount: r.calculatedAmount,
      txHash: `pending-${randomUUID().slice(0, 8)}`,
    }));

    split.status = 'completed';
    split.completedAt = Date.now();
    this.logger.info(`Split completed: ${splitId}`);

    return split;
  }

  getSplit(id: string): PaymentSplit {
    const split = this.splits.get(id);
    if (!split) throw new Error(`Split not found: ${id}`);
    return split;
  }

  listSplits(): PaymentSplit[] {
    return Array.from(this.splits.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Format split details for display
   */
  formatSummary(split: PaymentSplit): string {
    const lines = [
      `💰 **Payment Split #${split.id.slice(0, 8)}**`,
      `Total: ${split.totalAmount} ${split.token} | Mode: ${split.mode}`,
      `Status: ${split.status}`,
      ``,
      ...split.recipients.map(r =>
        `  → ${r.label ?? r.address.slice(0, 10) + '...'}: ${r.calculatedAmount} ${split.token}${r.share ? ` (${(r.share / 100).toFixed(1)}%)` : ''}`
      ),
    ];
    return lines.join('\n');
  }
}
