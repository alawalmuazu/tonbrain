// TonBrain Bot — Entry Point (Production)
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load .env from monorepo root (two levels up from packages/bot/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(__dirname, '..', '..', '..', '.env');
const localEnv = resolve(process.cwd(), '.env');
config({ path: existsSync(rootEnv) ? rootEnv : localEnv });

import { createBot } from './bot.js';

// ── Validate Environment ──
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required. Get one from @BotFather on Telegram.');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is required. Get one from https://aistudio.google.com/apikey');
  process.exit(1);
}

// ── Create & Start Bot ──
console.log(`
╔══════════════════════════════════════════╗
║         🧠 TonBrain Bot v1.0.0          ║
║    AI Agent for TON Blockchain           ║
║    Powered by Gemini + TON MCP           ║
╚══════════════════════════════════════════╝
`);

const { bot, db } = createBot({
  telegramToken: TELEGRAM_BOT_TOKEN,
  geminiApiKey: GEMINI_API_KEY,
  network: (process.env.NETWORK as 'mainnet' | 'testnet') ?? 'testnet',
  databasePath: process.env.DATABASE_PATH ?? './data/tonbrain.db',
  toncenterApiKey: process.env.TONCENTER_API_KEY,
});

// ── Set bot profile information ──
async function setupBotProfile() {
  try {
    // Set commands for Telegram menu
    await bot.api.setMyCommands([
      { command: 'start', description: '🚀 Start TonBrain' },
      { command: 'wallet', description: '💼 View/setup wallet' },
      { command: 'balance', description: '💎 Check balance' },
      { command: 'send', description: '💸 Send TON/tokens' },
      { command: 'swap', description: '🔄 Swap tokens' },
      { command: 'nfts', description: '🖼 View NFTs' },
      { command: 'portfolio', description: '📊 Portfolio overview' },
      { command: 'invoice', description: '📄 Create invoice' },
      { command: 'network', description: '🌐 Switch network' },
      { command: 'about', description: 'ℹ️ About TonBrain' },
      { command: 'demo', description: '🎯 See all capabilities' },
      { command: 'connect', description: '🔗 Connect wallet (TON Connect)' },
      { command: 'mcp', description: '🔌 MCP integration status' },
      { command: 'help', description: '❓ Show help' },
      { command: 'clear', description: '🗑 Clear history' },
    ]);
    console.log('✅ Bot commands registered');

    // Set bot description (shown when user opens bot for first time)
    await bot.api.setMyDescription(
      '🧠 TonBrain — AI-Powered TON Wallet Assistant\n\n' +
      'Manage your TON wallet, swap tokens, view NFTs, and more using natural language.\n\n' +
      'Powered by Google Gemini AI + TON Blockchain.\n\n' +
      '🏆 Built for TON AI Agent Hackathon 2026'
    );
    console.log('✅ Bot description set');

    // Set short description (shown in profile)
    await bot.api.setMyShortDescription(
      '🧠 AI Wallet Assistant for TON Blockchain — Powered by Gemini'
    );
    console.log('✅ Bot short description set');

  } catch (error) {
    console.error('⚠️ Bot profile setup warning:', error);
  }
}

setupBotProfile();

// Start polling
bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot started: @${botInfo.username}`);
    console.log(`🌐 Network: ${process.env.NETWORK ?? 'testnet'}`);
    console.log(`📡 Polling for messages...`);
    console.log(`\n💡 Send /start to your bot on Telegram to begin!\n`);
  },
});

// ── Health HTTP Server (for Render/Koyeb free tier) ──
import { createServer } from 'http';
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const healthServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    bot: 'TonBrain v1.0.0',
    network: process.env.NETWORK ?? 'testnet',
    uptime: Math.floor(process.uptime()),
  }));
});
healthServer.listen(PORT, () => {
  console.log(`🩺 Health server on port ${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down...');
  healthServer.close();
  bot.stop();
  db.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
