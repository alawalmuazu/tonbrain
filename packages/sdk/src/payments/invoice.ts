// TonBrain SDK — Invoice Generation
import { Logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export type InvoiceStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

export interface Invoice {
  id: string;
  status: InvoiceStatus;
  recipient: string;
  amount: string;
  token: 'TON' | string;
  description: string;
  memo: string;
  createdAt: number;
  expiresAt: number;
  paidAt?: number;
  paidTxHash?: string;
  deepLink: string;
  metadata?: Record<string, unknown>;
}

/**
 * InvoiceManager — Generate payment invoices with TON deep links.
 * 
 * Creates invoices that can be shared via Telegram with one-tap payment links.
 * Supports both TON and Jetton payments. Integrates with TON Pay SDK
 * for direct on-chain payments bypassing Telegram Stars commissions.
 */
export class InvoiceManager {
  private invoices: Map<string, Invoice> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Invoice');
  }

  /**
   * Create a new payment invoice
   */
  create(params: {
    recipient: string;
    amount: string;
    token?: string;
    description: string;
    expiresInMinutes?: number;
    metadata?: Record<string, unknown>;
  }): Invoice {
    const id = randomUUID();
    const memo = `tonbrain-inv-${id.slice(0, 8)}`;

    // Generate TON deep link for easy payment
    const deepLink = this.generateDeepLink(params.recipient, params.amount, memo);

    const invoice: Invoice = {
      id,
      status: 'pending',
      recipient: params.recipient,
      amount: params.amount,
      token: params.token ?? 'TON',
      description: params.description,
      memo,
      createdAt: Date.now(),
      expiresAt: Date.now() + (params.expiresInMinutes ?? 1440) * 60 * 1000,
      deepLink,
      metadata: params.metadata,
    };

    this.invoices.set(id, invoice);
    this.logger.info(`Invoice created: ${id}`, {
      amount: invoice.amount,
      recipient: invoice.recipient,
    });

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  markPaid(invoiceId: string, txHash: string): Invoice {
    const invoice = this.getInvoice(invoiceId);
    if (invoice.status !== 'pending') {
      throw new Error(`Cannot mark ${invoice.status} invoice as paid`);
    }
    invoice.status = 'paid';
    invoice.paidAt = Date.now();
    invoice.paidTxHash = txHash;
    this.logger.info(`Invoice paid: ${invoiceId}`, { txHash });
    return invoice;
  }

  /**
   * Cancel an invoice
   */
  cancel(invoiceId: string): Invoice {
    const invoice = this.getInvoice(invoiceId);
    if (invoice.status !== 'pending') {
      throw new Error(`Cannot cancel ${invoice.status} invoice`);
    }
    invoice.status = 'cancelled';
    this.logger.info(`Invoice cancelled: ${invoiceId}`);
    return invoice;
  }

  /**
   * Get invoice by ID
   */
  getInvoice(id: string): Invoice {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    return invoice;
  }

  /**
   * Find invoice by memo (for matching incoming transactions)
   */
  findByMemo(memo: string): Invoice | undefined {
    return Array.from(this.invoices.values()).find(inv => inv.memo === memo);
  }

  /**
   * List invoices with optional filters
   */
  listInvoices(filter?: { status?: InvoiceStatus; recipient?: string }): Invoice[] {
    let results = Array.from(this.invoices.values());
    if (filter?.status) results = results.filter(i => i.status === filter.status);
    if (filter?.recipient) results = results.filter(i => i.recipient === filter.recipient);
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Generate Telegram-friendly invoice message
   */
  formatMessage(invoice: Invoice): string {
    const statusEmoji = {
      pending: '⏳',
      paid: '✅',
      expired: '⏰',
      cancelled: '❌',
    };

    return [
      `${statusEmoji[invoice.status]} **Invoice #${invoice.id.slice(0, 8)}**`,
      ``,
      `💎 **Amount:** ${invoice.amount} ${invoice.token}`,
      `📝 **Description:** ${invoice.description}`,
      `📮 **Recipient:** \`${invoice.recipient.slice(0, 8)}...${invoice.recipient.slice(-6)}\``,
      `⏰ **Expires:** ${new Date(invoice.expiresAt).toLocaleString()}`,
      ``,
      invoice.status === 'pending' ? `💳 [Pay Now](${invoice.deepLink})` : '',
    ].filter(Boolean).join('\n');
  }

  /**
   * Generate a ton:// deep link for payment
   */
  private generateDeepLink(address: string, amount: string, memo: string): string {
    const amountNano = Math.floor(Number(amount) * 1e9);
    return `ton://transfer/${address}?amount=${amountNano}&text=${encodeURIComponent(memo)}`;
  }

  /**
   * Expire stale invoices
   */
  expireStale(): number {
    let count = 0;
    for (const invoice of this.invoices.values()) {
      if (invoice.status === 'pending' && Date.now() > invoice.expiresAt) {
        invoice.status = 'expired';
        count++;
      }
    }
    return count;
  }
}
