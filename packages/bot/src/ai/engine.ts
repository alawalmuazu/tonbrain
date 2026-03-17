// TonBrain Bot — Gemini AI Conversation Engine
import { GoogleGenerativeAI, type GenerativeModel, type Content } from '@google/generative-ai';
import { SYSTEM_PROMPT, FUNCTION_DESCRIPTIONS } from './prompts.js';
import type { TonService } from '../services/ton.js';
import type { BotDatabase } from '../utils/db.js';
import { formatTON, formatAddress } from '../utils/format.js';

export interface AIResponse {
  text: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

/**
 * AIEngine — Gemini-powered conversation engine with function calling.
 * 
 * Routes natural language to TON blockchain operations:
 * "What's my balance?" → check_balance → formatted response
 * "Send 1 TON to EQ..." → confirms transaction details
 * "Show my NFTs" → get_nfts → gallery response
 */
export class AIEngine {
  private model: GenerativeModel;
  private tonService: TonService;
  private db: BotDatabase;

  constructor(apiKey: string, tonService: TonService, db: BotDatabase) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    });
    this.tonService = tonService;
    this.db = db;
  }

  /**
   * Process a user message and return an AI response
   */
  async chat(userId: number, message: string): Promise<string> {
    try {
      // Get conversation history
      const history = this.db.getRecentConversations(userId, 10);
      const user = this.db.getUser(userId);
      
      // Build context
      const context = this.buildContext(userId, user);
      const fullMessage = `${context}\n\nUser message: ${message}`;

      // Save user message
      this.db.addConversation(userId, 'user', message);

      // Convert history to Gemini format
      const contents: Content[] = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));

      // Start chat
      const chat = this.model.startChat({
        history: contents,
      });

      // Get AI response
      const result = await chat.sendMessage(fullMessage);
      let responseText = result.response.text();

      // Check if the AI wants to call a function
      const functionMatch = this.detectFunctionIntent(message);
      if (functionMatch) {
        const functionResult = await this.executeFunction(userId, functionMatch.name, functionMatch.args);
        // Send function result back to AI for natural language formatting
        const followUp = await chat.sendMessage(
          `Function ${functionMatch.name} returned:\n${JSON.stringify(functionResult, null, 2)}\n\nFormat this result nicely for the user in Telegram markdown.`
        );
        responseText = followUp.response.text();
      }

      // Save assistant response
      this.db.addConversation(userId, 'assistant', responseText);

      return responseText;
    } catch (error) {
      console.error('AI Engine error:', error);
      return '❌ Sorry, I encountered an error processing your message. Please try again or use a command like /balance.';
    }
  }

  /**
   * Build context string with user session data
   */
  private buildContext(userId: number, user: any): string {
    const address = this.tonService.getAddress(userId);
    const hasWallet = this.tonService.hasWallet(userId);

    return [
      `[Session Context]`,
      `User: ${user?.firstName ?? 'Unknown'}`,
      `Wallet: ${hasWallet ? formatAddress(address ?? '') : 'Not connected'}`,
      `Network: ${user?.network ?? 'testnet'}`,
      `Has Wallet: ${hasWallet}`,
    ].join('\n');
  }

  /**
   * Simple intent detection for function calling
   */
  private detectFunctionIntent(message: string): { name: string; args: Record<string, unknown> } | null {
    const lower = message.toLowerCase();

    // Balance check
    if (lower.match(/\b(balance|how much|funds|holdings)\b/)) {
      return { name: 'check_balance', args: {} };
    }

    // Transaction history
    if (lower.match(/\b(transactions?|history|recent|activity)\b/)) {
      return { name: 'get_transactions', args: { limit: 10 } };
    }

    // NFTs
    if (lower.match(/\b(nft|collectible|collection)\b/)) {
      return { name: 'get_nfts', args: {} };
    }

    // DNS resolution
    const domainMatch = lower.match(/(\w+\.(ton|t\.me))/);
    if (domainMatch) {
      return { name: 'resolve_domain', args: { domain: domainMatch[1] } };
    }

    // Swap
    if (lower.match(/\b(swap|exchange|trade|convert)\b/)) {
      return { name: 'get_swap_quote', args: {} };
    }

    return null;
  }

  /**
   * Execute a detected function
   */
  private async executeFunction(userId: number, name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'check_balance': {
        const balance = await this.tonService.getBalance(userId);
        const jettons = await this.tonService.getJettons(userId);
        return { tonBalance: balance, jettons };
      }
      case 'get_transactions': {
        const txs = await this.tonService.getTransactions(userId, (args.limit as number) ?? 10);
        return { transactions: txs };
      }
      case 'get_nfts': {
        const nfts = await this.tonService.getNFTs(userId);
        return { nfts, count: nfts.length };
      }
      case 'resolve_domain': {
        const address = await this.tonService.resolveDNS(userId, args.domain as string);
        return { domain: args.domain, resolvedAddress: address };
      }
      case 'create_invoice': {
        const address = this.tonService.getAddress(userId);
        if (!address) return { error: 'No wallet connected' };
        const invoice = this.tonService.invoices.create({
          recipient: address,
          amount: args.amount as string,
          description: args.description as string,
        });
        return invoice;
      }
      case 'get_swap_quote': {
        return { message: 'Swap quotes require specific token addresses. Please specify which tokens to swap.' };
      }
      default:
        return { error: `Unknown function: ${name}` };
    }
  }
}
