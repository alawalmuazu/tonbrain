// TonBrain SDK — Main Agent Class
import EventEmitter from 'eventemitter3';
import { Logger } from '../utils/logger.js';
import { loadConfig, type TonBrainConfig } from './config.js';
import { WalletManager } from './wallet.js';
import { EscrowManager } from '../payments/escrow.js';
import { InvoiceManager } from '../payments/invoice.js';
import { PaymentSplitter } from '../payments/split.js';
import { AgentRegistry } from '../coordination/registry.js';
import { AgentProtocol } from '../coordination/protocol.js';
import { TaskRouter } from '../coordination/router.js';

export interface TonBrainEvents {
  'ready': () => void;
  'error': (error: Error) => void;
}

/**
 * TonBrainAgent — The unified AI Agent SDK for TON blockchain.
 * 
 * This is the main entry point for developers building AI agents on TON.
 * It provides:
 * 
 * 🔑 **Wallet Management** — Create, import, and manage TON wallets
 * 💰 **Payment Flows** — Escrow, invoicing, and payment splitting
 * 🤖 **Agent Coordination** — Multi-agent registry, routing, and communication
 * 🔗 **TON Integration** — Balance queries, transfers, swaps, NFTs, DNS
 * 
 * Built for the TON AI Agent Hackathon to fill the "missing native
 * AI agent framework for TON" gap identified in the ecosystem.
 * 
 * @example
 * ```typescript
 * import { TonBrainAgent } from 'tonbrain-sdk';
 * 
 * const agent = new TonBrainAgent({ network: 'testnet' });
 * await agent.initialize();
 * 
 * // Check balance
 * const balance = await agent.wallet.getBalance();
 * 
 * // Create an invoice
 * const invoice = agent.invoices.create({
 *   recipient: 'EQ...',
 *   amount: '1.5',
 *   description: 'AI translation service',
 * });
 * 
 * // Register as an agent
 * agent.registry.register({
 *   name: 'TranslatorBot',
 *   description: 'AI translation agent',
 *   walletAddress: agent.wallet.getAddress(),
 *   capabilities: [{
 *     name: 'translate',
 *     description: 'Translate text between languages',
 *     costPerCall: '0.01',
 *   }],
 * });
 * ```
 */
export class TonBrainAgent extends EventEmitter<TonBrainEvents> {
  public readonly config: TonBrainConfig;
  public readonly wallet: WalletManager;
  public readonly escrow: EscrowManager;
  public readonly invoices: InvoiceManager;
  public readonly splitter: PaymentSplitter;
  public readonly registry: AgentRegistry;
  public readonly protocol: AgentProtocol;
  public readonly router: TaskRouter;

  private logger: Logger;
  private initialized = false;

  constructor(configOverrides?: Partial<TonBrainConfig>) {
    super();
    this.config = loadConfig(configOverrides);
    this.logger = new Logger('TonBrainAgent');

    // Initialize subsystems
    this.wallet = new WalletManager(this.config);
    this.escrow = new EscrowManager(this.wallet);
    this.invoices = new InvoiceManager();
    this.splitter = new PaymentSplitter();
    this.registry = new AgentRegistry();
    this.protocol = new AgentProtocol(`agent-${Date.now()}`);
    this.router = new TaskRouter(this.registry, this.protocol, this.escrow);
  }

  /**
   * Initialize the agent — connect wallet and prepare subsystems
   */
  async initialize(address?: string): Promise<void> {
    if (this.initialized) return;

    this.logger.info('🧠 Initializing TonBrain Agent...', {
      network: this.config.network,
    });

    try {
      // Initialize wallet
      await this.wallet.initialize(address);

      this.initialized = true;
      this.logger.info('✅ TonBrain Agent ready', {
        network: this.config.network,
        address: this.wallet.getAddress(),
      });

      this.emit('ready');
    } catch (error) {
      this.logger.error('❌ Initialization failed', { error: String(error) });
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Get a comprehensive status report
   */
  getStatus(): Record<string, unknown> {
    return {
      initialized: this.initialized,
      network: this.config.network,
      wallet: {
        address: this.wallet.getAddress(),
        connected: this.wallet.isConnected(),
      },
      registry: this.registry.getStats(),
      router: this.router.getStats(),
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down TonBrain Agent...');
    this.initialized = false;
  }

  isReady(): boolean {
    return this.initialized;
  }
}
