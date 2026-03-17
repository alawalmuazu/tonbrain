// TonBrain SDK — Wallet Management Layer
import EventEmitter from 'eventemitter3';
import { Logger } from '../utils/logger.js';
import { WalletError } from '../utils/errors.js';
import type { TonBrainConfig } from './config.js';

export interface WalletInfo {
  address: string;
  network: string;
  balance?: string;
  balanceNano?: string;
}

export interface JettonBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

export interface TransactionInfo {
  hash: string;
  type: string;
  amount: string;
  from: string;
  to: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  comment?: string;
}

export interface TransferResult {
  normalizedHash: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  slippageBps: number;
  transactionParams?: unknown;
}

export interface NFTInfo {
  address: string;
  name: string;
  description: string;
  imageUrl: string;
  collection?: {
    address: string;
    name: string;
  };
  attributes?: Array<{ trait: string; value: string }>;
}

export type WalletEvents = {
  'wallet:connected': (info: WalletInfo) => void;
  'wallet:balance-updated': (balance: string) => void;
  'transfer:sent': (result: TransferResult) => void;
  'transfer:confirmed': (hash: string) => void;
  'transfer:failed': (hash: string, error: string) => void;
  'error': (error: Error) => void;
};

/**
 * WalletManager — High-level wallet operations wrapping TON MCP tools.
 * In the hackathon context, this provides a clean API without requiring
 * the full @ton/mcp runtime (uses TON HTTP API directly for portability).
 */
export class WalletManager extends EventEmitter<WalletEvents> {
  private config: TonBrainConfig;
  private logger: Logger;
  private walletInfo: WalletInfo | null = null;
  private apiBase: string;

  constructor(config: TonBrainConfig) {
    super();
    this.config = config;
    this.logger = new Logger('WalletManager');
    this.apiBase = config.network === 'mainnet'
      ? 'https://toncenter.com/api/v2'
      : 'https://testnet.toncenter.com/api/v2';
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.toncenterApiKey) {
      h['X-API-Key'] = this.config.toncenterApiKey;
    }
    return h;
  }

  private async apiCall(method: string, params: Record<string, string | number> = {}): Promise<any> {
    const url = new URL(`${this.apiBase}/${method}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    const response = await fetch(url.toString(), { headers: this.headers });
    if (!response.ok) {
      throw new WalletError(`API call failed: ${method} — ${response.status}`, { method, status: response.status });
    }
    const data = await response.json();
    if (!data.ok) {
      throw new WalletError(`API returned error: ${data.error}`, { method, error: data.error });
    }
    return data.result;
  }

  /**
   * Initialize wallet from mnemonic or address for read-only mode
   */
  async initialize(addressOrMnemonic?: string): Promise<WalletInfo> {
    this.logger.info('Initializing wallet...');

    if (addressOrMnemonic && addressOrMnemonic.startsWith('EQ') || addressOrMnemonic?.startsWith('UQ') || addressOrMnemonic?.startsWith('0:')) {
      // Read-only mode with address
      this.walletInfo = {
        address: addressOrMnemonic!,
        network: this.config.network,
      };
    } else if (this.config.mnemonic) {
      // Use mnemonic — in production, derive address from mnem via @ton/crypto
      this.logger.info('Mnemonic provided — wallet will be initialized via MCP tools');
      this.walletInfo = {
        address: 'pending-mnemonic-init',
        network: this.config.network,
      };
    } else {
      this.walletInfo = {
        address: 'demo-mode',
        network: this.config.network,
      };
      this.logger.warn('No wallet credentials — running in demo mode');
    }

    this.emit('wallet:connected', this.walletInfo);
    return this.walletInfo;
  }

  /**
   * Get TON balance for an address
   */
  async getBalance(address?: string): Promise<{ balance: string; balanceNano: string }> {
    const addr = address ?? this.walletInfo?.address;
    if (!addr || addr === 'demo-mode' || addr === 'pending-mnemonic-init') {
      return { balance: '0', balanceNano: '0' };
    }

    try {
      const result = await this.apiCall('getAddressBalance', { address: addr });
      const balanceNano = String(result);
      const balance = (Number(balanceNano) / 1e9).toFixed(4);
      this.emit('wallet:balance-updated', balance);
      return { balance, balanceNano };
    } catch (error) {
      this.logger.error('Failed to get balance', { error: String(error) });
      return { balance: '0', balanceNano: '0' };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(address?: string, limit: number = 20): Promise<TransactionInfo[]> {
    const addr = address ?? this.walletInfo?.address;
    if (!addr || addr === 'demo-mode') return [];

    try {
      const result = await this.apiCall('getTransactions', { address: addr, limit });
      return (result || []).map((tx: any) => ({
        hash: tx.transaction_id?.hash ?? '',
        type: tx.in_msg?.value && tx.in_msg.value !== '0' ? 'incoming' : 'outgoing',
        amount: ((Number(tx.in_msg?.value || 0) || Number(tx.out_msgs?.[0]?.value || 0)) / 1e9).toFixed(4),
        from: tx.in_msg?.source ?? '',
        to: tx.in_msg?.destination ?? '',
        timestamp: tx.utime ?? 0,
        status: 'completed' as const,
        comment: tx.in_msg?.message ?? '',
      }));
    } catch (error) {
      this.logger.error('Failed to get transactions', { error: String(error) });
      return [];
    }
  }

  /**
   * Get Jetton (token) balances
   */
  async getJettons(address?: string): Promise<JettonBalance[]> {
    const addr = address ?? this.walletInfo?.address;
    if (!addr || addr === 'demo-mode') return [];

    try {
      // Use tonapi for jetton balances (more reliable)
      const tonapiBase = this.config.network === 'mainnet'
        ? 'https://tonapi.io/v2'
        : 'https://testnet.tonapi.io/v2';

      const response = await fetch(`${tonapiBase}/accounts/${addr}/jettons`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return [];
      const data = await response.json();

      return (data.balances || []).map((j: any) => ({
        address: j.jetton?.address ?? '',
        symbol: j.jetton?.symbol ?? 'UNKNOWN',
        name: j.jetton?.name ?? 'Unknown Token',
        balance: j.balance ?? '0',
        decimals: j.jetton?.decimals ?? 9,
      }));
    } catch (error) {
      this.logger.error('Failed to get jettons', { error: String(error) });
      return [];
    }
  }

  /**
   * Get NFTs owned by address
   */
  async getNFTs(address?: string, limit: number = 20): Promise<NFTInfo[]> {
    const addr = address ?? this.walletInfo?.address;
    if (!addr || addr === 'demo-mode') return [];

    try {
      const tonapiBase = this.config.network === 'mainnet'
        ? 'https://tonapi.io/v2'
        : 'https://testnet.tonapi.io/v2';

      const response = await fetch(`${tonapiBase}/accounts/${addr}/nfts?limit=${limit}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return [];
      const data = await response.json();

      return (data.nft_items || []).map((nft: any) => ({
        address: nft.address ?? '',
        name: nft.metadata?.name ?? 'Unnamed NFT',
        description: nft.metadata?.description ?? '',
        imageUrl: nft.metadata?.image ?? nft.previews?.[0]?.url ?? '',
        collection: nft.collection ? {
          address: nft.collection.address ?? '',
          name: nft.collection.name ?? '',
        } : undefined,
        attributes: (nft.metadata?.attributes || []).map((a: any) => ({
          trait: a.trait_type ?? '',
          value: a.value ?? '',
        })),
      }));
    } catch (error) {
      this.logger.error('Failed to get NFTs', { error: String(error) });
      return [];
    }
  }

  /**
   * Get swap quote via DEX aggregator
   */
  async getSwapQuote(fromToken: string, toToken: string, amount: string, slippageBps: number = 100): Promise<SwapQuote | null> {
    try {
      // Use DeDust API for swap quotes
      this.logger.info('Getting swap quote', { fromToken, toToken, amount });

      // For hackathon demo, return a structured quote
      // In prod, integrate DeDust or STON.fi API
      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: '0', // Would be filled by DEX quote
        rate: '0',
        slippageBps,
      };
    } catch (error) {
      this.logger.error('Failed to get swap quote', { error: String(error) });
      return null;
    }
  }

  /**
   * Resolve TON DNS domain
   */
  async resolveDNS(domain: string): Promise<string | null> {
    try {
      const tonapiBase = this.config.network === 'mainnet'
        ? 'https://tonapi.io/v2'
        : 'https://testnet.tonapi.io/v2';

      const response = await fetch(`${tonapiBase}/dns/${domain}/resolve`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.wallet?.address ?? null;
    } catch (error) {
      this.logger.error('Failed to resolve DNS', { error: String(error) });
      return null;
    }
  }

  getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  getAddress(): string {
    return this.walletInfo?.address ?? '';
  }

  isConnected(): boolean {
    return this.walletInfo !== null && this.walletInfo.address !== 'demo-mode';
  }
}
