// TonBrain Bot — Main Bot Setup (Production)
import { Bot } from 'grammy';
import { loadConfig } from 'tonbrain-sdk';
import { TonService } from './services/ton.js';
import { TonConnectService } from './services/tonconnect.js';
import { MCPClientService } from './services/mcpclient.js';
import { BotDatabase } from './utils/db.js';
import { AIEngine } from './ai/engine.js';
import { registerCommands } from './commands/index.js';
import { registerCallbacks, registerMessageHandler } from './handlers/index.js';

export interface BotConfig {
  telegramToken: string;
  geminiApiKey: string;
  network?: 'mainnet' | 'testnet';
  databasePath?: string;
  toncenterApiKey?: string;
}

/**
 * Create and configure the TonBrain Telegram bot
 */
export function createBot(config: BotConfig) {
  // Initialize Grammy bot
  const bot = new Bot(config.telegramToken);

  // Initialize SDK config
  const sdkConfig = loadConfig({
    network: config.network ?? 'testnet',
    toncenterApiKey: config.toncenterApiKey,
  });

  // Initialize services
  const db = new BotDatabase(config.databasePath ?? './data/tonbrain.db');
  const tonService = new TonService(sdkConfig);
  const tonConnect = new TonConnectService();
  const mcpClient = new MCPClientService(config.network ?? 'testnet');
  const aiEngine = new AIEngine(config.geminiApiKey, tonService, db);

  // Register all handlers
  registerCommands(bot, tonService, db, tonConnect, mcpClient);
  registerCallbacks(bot, tonService, db);
  registerMessageHandler(bot, tonService, db, aiEngine);

  // Global error handler — catches all unhandled errors gracefully
  bot.catch((err: any) => {
    const ctx = err.ctx;
    const e = err.error;
    console.error(`❌ Bot error for update ${ctx?.update?.update_id}:`, e);

    // Try to notify the user gracefully
    try {
      if (ctx?.chat?.id) {
        ctx.reply(
          '❌ <b>Something went wrong</b>\n\n<i>Please try again or use /help for available commands.</i>',
          { parse_mode: 'HTML' }
        ).catch(() => {});
      }
    } catch {
      // Silently ignore if we can't respond
    }
  });

  return { bot, db, tonService, tonConnect, mcpClient, aiEngine };
}
