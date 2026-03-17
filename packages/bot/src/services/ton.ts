// TonBrain Bot — TON Service Layer
import { WalletManager, type TonBrainConfig, EscrowManager, InvoiceManager, PaymentSplitter } from 'tonbrain-sdk';

/**
 * TonService — Singleton wrapper around SDK wallet and payment features
 * for the Telegram bot. Manages per-user wallet instances.
 */
export class TonService {
  private wallets: Map<number, WalletManager> = new Map();
  private config: TonBrainConfig;
  public readonly invoices: InvoiceManager;
  public readonly splitter: PaymentSplitter;

  constructor(config: TonBrainConfig) {
    this.config = config;
    this.invoices = new InvoiceManager();
    this.splitter = new PaymentSplitter();
  }

  /**
   * Get or create a wallet manager for a user
   */
  getWallet(userId: number, address?: string): WalletManager {
    if (!this.wallets.has(userId)) {
      const wallet = new WalletManager(this.config);
      if (address) {
        wallet.initialize(address);
      }
      this.wallets.set(userId, wallet);
    }
    return this.wallets.get(userId)!;
  }

  /**
   * Set the wallet address for a user
   */
  async setUserWallet(userId: number, address: string): Promise<WalletManager> {
    const wallet = new WalletManager(this.config);
    await wallet.initialize(address);
    this.wallets.set(userId, wallet);
    return wallet;
  }

  /**
   * Get TON balance for a user
   */
  async getBalance(userId: number): Promise<{ balance: string; balanceNano: string }> {
    const wallet = this.wallets.get(userId);
    if (!wallet) return { balance: '0', balanceNano: '0' };
    return wallet.getBalance();
  }

  /**
   * Get all jetton balances
   */
  async getJettons(userId: number) {
    const wallet = this.wallets.get(userId);
    if (!wallet) return [];
    return wallet.getJettons();
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId: number, limit?: number) {
    const wallet = this.wallets.get(userId);
    if (!wallet) return [];
    return wallet.getTransactions(undefined, limit);
  }

  /**
   * Get NFTs
   */
  async getNFTs(userId: number) {
    const wallet = this.wallets.get(userId);
    if (!wallet) return [];
    return wallet.getNFTs();
  }

  /**
   * Resolve a TON DNS domain
   */
  async resolveDNS(userId: number, domain: string): Promise<string | null> {
    const wallet = this.wallets.get(userId);
    if (!wallet) return null;
    return wallet.resolveDNS(domain);
  }

  /**
   * Get user's wallet address
   */
  getAddress(userId: number): string | null {
    const wallet = this.wallets.get(userId);
    return wallet?.getAddress() ?? null;
  }

  /**
   * Check if user has a connected wallet
   */
  hasWallet(userId: number): boolean {
    const wallet = this.wallets.get(userId);
    return wallet?.isConnected() ?? false;
  }
}
