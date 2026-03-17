// TonBrain Bot — JSON File Database (no native deps needed)
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

export interface UserSession {
  telegramId: number;
  username: string | null;
  firstName: string;
  walletAddress: string | null;
  network: string;
  createdAt: number;
  lastActiveAt: number;
  preferences: string;
}

interface ConversationEntry {
  telegramId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

interface TransactionEntry {
  telegramId: number;
  type: string;
  amount: string | null;
  token: string;
  toAddress: string | null;
  txHash: string | null;
  status: string;
  createdAt: number;
}

interface DBData {
  users: Record<string, UserSession>;
  conversations: ConversationEntry[];
  transactions: TransactionEntry[];
}

/**
 * Simple JSON file-based database.
 * Avoids native compilation issues with better-sqlite3 on Windows.
 * Suitable for hackathon demo — production would use a real DB.
 */
export class BotDatabase {
  private dbPath: string;
  private data: DBData;

  constructor(dbPath: string = './data/tonbrain.json') {
    this.dbPath = dbPath;
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.data = this.load();
  }

  private load(): DBData {
    try {
      if (existsSync(this.dbPath)) {
        return JSON.parse(readFileSync(this.dbPath, 'utf-8'));
      }
    } catch { /* start fresh */ }
    return { users: {}, conversations: [], transactions: [] };
  }

  private save(): void {
    writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // ── User Operations ──

  getUser(telegramId: number): UserSession | null {
    return this.data.users[String(telegramId)] ?? null;
  }

  upsertUser(user: Partial<UserSession> & { telegramId: number; firstName: string }): void {
    const key = String(user.telegramId);
    const existing = this.data.users[key];
    this.data.users[key] = {
      telegramId: user.telegramId,
      username: user.username ?? existing?.username ?? null,
      firstName: user.firstName,
      walletAddress: user.walletAddress ?? existing?.walletAddress ?? null,
      network: user.network ?? existing?.network ?? 'testnet',
      createdAt: existing?.createdAt ?? Date.now(),
      lastActiveAt: Date.now(),
      preferences: existing?.preferences ?? '{}',
    };
    this.save();
  }

  setWalletAddress(telegramId: number, address: string): void {
    const key = String(telegramId);
    if (this.data.users[key]) {
      this.data.users[key].walletAddress = address;
      this.save();
    }
  }

  // ── Conversation Operations ──

  addConversation(telegramId: number, role: 'user' | 'assistant', content: string): void {
    this.data.conversations.push({
      telegramId,
      role,
      content,
      createdAt: Date.now(),
    });
    // Keep max 500 conversations total to prevent file bloat
    if (this.data.conversations.length > 500) {
      this.data.conversations = this.data.conversations.slice(-400);
    }
    this.save();
  }

  getRecentConversations(telegramId: number, limit: number = 20): Array<{ role: string; content: string }> {
    return this.data.conversations
      .filter(c => c.telegramId === telegramId)
      .slice(-limit)
      .map(c => ({ role: c.role, content: c.content }));
  }

  clearConversations(telegramId: number): void {
    this.data.conversations = this.data.conversations.filter(c => c.telegramId !== telegramId);
    this.save();
  }

  // ── Transaction Operations ──

  addTransaction(params: {
    telegramId: number;
    type: string;
    amount?: string;
    token?: string;
    toAddress?: string;
    txHash?: string;
    status?: string;
  }): void {
    this.data.transactions.push({
      telegramId: params.telegramId,
      type: params.type,
      amount: params.amount ?? null,
      token: params.token ?? 'TON',
      toAddress: params.toAddress ?? null,
      txHash: params.txHash ?? null,
      status: params.status ?? 'pending',
      createdAt: Date.now(),
    });
    this.save();
  }

  getRecentTransactions(telegramId: number, limit: number = 10): TransactionEntry[] {
    return this.data.transactions
      .filter(t => t.telegramId === telegramId)
      .slice(-limit);
  }

  // ── Stats ──

  getStats(): { totalUsers: number; totalConversations: number; totalTransactions: number } {
    return {
      totalUsers: Object.keys(this.data.users).length,
      totalConversations: this.data.conversations.length,
      totalTransactions: this.data.transactions.length,
    };
  }

  close(): void {
    this.save();
  }
}
