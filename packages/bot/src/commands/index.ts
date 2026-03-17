// TonBrain Bot — Production-Grade Command Handlers
import { InputFile } from 'grammy';
import type { Context } from 'grammy';
import type { TonService } from '../services/ton.js';
import type { TonConnectService } from '../services/tonconnect.js';
import type { MCPClientService } from '../services/mcpclient.js';
import type { BotDatabase } from '../utils/db.js';
import {
  welcomeMessage,
  helpMessage,
  walletSetupMessage,
  walletInfoMessage,
  balanceOverviewMessage,
  portfolioMessage,
  sendInstructionsMessage,
  swapInstructionsMessage,
  invoiceInstructionsMessage,
  networkMessage,
  aboutMessage,
  demoMessage,
  noWalletMessage,
  loadingMessage,
  formatTON,
  formatAddress,
  formatTransaction,
} from '../utils/format.js';
import {
  welcomeKeyboard,
  mainMenuKeyboard,
  walletKeyboard,
  onboardingKeyboard,
  backKeyboard,
  networkKeyboard,
} from '../utils/keyboard.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WELCOME_IMAGE = resolve(__dirname, '..', '..', 'assets', 'welcome.png');

/**
 * Register all bot command handlers
 */
export function registerCommands(
  bot: any,
  tonService: TonService,
  db: BotDatabase,
  tonConnect: TonConnectService,
  mcpClient: MCPClientService,
): void {

  // ── /start — Branded welcome with photo ──
  bot.command('start', async (ctx: Context) => {
    const from = ctx.from!;
    db.upsertUser({
      telegramId: from.id,
      username: from.username ?? null,
      firstName: from.first_name,
    });

    try {
      // Send branded welcome banner + rich HTML text
      await ctx.replyWithPhoto(new InputFile(WELCOME_IMAGE), {
        caption: welcomeMessage(from.first_name),
        parse_mode: 'HTML',
        reply_markup: welcomeKeyboard(),
      });
    } catch (error) {
      // Fallback to text-only if image fails
      console.error('Failed to send welcome image:', error);
      await ctx.reply(welcomeMessage(from.first_name), {
        parse_mode: 'HTML',
        reply_markup: welcomeKeyboard(),
      });
    }
  });

  // ── /help ──
  bot.command('help', async (ctx: Context) => {
    await ctx.reply(helpMessage(), {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    });
  });

  // ── /wallet ──
  bot.command('wallet', async (ctx: Context) => {
    const user = db.getUser(ctx.from!.id);
    const address = tonService.getAddress(ctx.from!.id);

    if (!address || !tonService.hasWallet(ctx.from!.id)) {
      await ctx.reply(walletSetupMessage(), {
        parse_mode: 'HTML',
        reply_markup: onboardingKeyboard(),
      });
      return;
    }

    await ctx.replyWithChatAction('typing');
    const { balance } = await tonService.getBalance(ctx.from!.id);

    await ctx.reply(
      walletInfoMessage(address, balance, user?.network ?? 'testnet'),
      {
        parse_mode: 'HTML',
        reply_markup: walletKeyboard(),
      }
    );
  });

  // ── /balance ──
  bot.command('balance', async (ctx: Context) => {
    const userId = ctx.from!.id;

    if (!tonService.hasWallet(userId)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }

    await ctx.replyWithChatAction('typing');

    const { balance } = await tonService.getBalance(userId);
    const jettons = await tonService.getJettons(userId);

    await ctx.reply(balanceOverviewMessage(balance, jettons), {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    });
  });

  // ── /send ──
  bot.command('send', async (ctx: Context) => {
    const userId = ctx.from!.id;

    if (!tonService.hasWallet(userId)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }

    await ctx.reply(sendInstructionsMessage(), { parse_mode: 'HTML' });
  });

  // ── /swap ──
  bot.command('swap', async (ctx: Context) => {
    const userId = ctx.from!.id;

    if (!tonService.hasWallet(userId)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }

    await ctx.reply(swapInstructionsMessage(), { parse_mode: 'HTML' });
  });

  // ── /nfts ──
  bot.command('nfts', async (ctx: Context) => {
    const userId = ctx.from!.id;

    if (!tonService.hasWallet(userId)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }

    await ctx.replyWithChatAction('typing');
    const nfts = await tonService.getNFTs(userId);

    if (nfts.length === 0) {
      await ctx.reply(
        [
          `🖼 <b>Your NFTs</b>`,
          ``,
          `<i>No NFTs found in your wallet.</i>`,
          ``,
          `Browse collections on <a href="https://getgems.io">Getgems</a>`,
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: backKeyboard() }
      );
      return;
    }

    let msg = `🖼 <b>Your NFTs</b> (${nfts.length})\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const nft of nfts.slice(0, 5)) {
      msg += `• <b>${nft.name}</b>`;
      if (nft.collection) msg += ` — ${nft.collection.name}`;
      msg += `\n  <code>${formatAddress(nft.address)}</code>\n\n`;
    }

    if (nfts.length > 5) {
      msg += `<i>…and ${nfts.length - 5} more</i>`;
    }

    await ctx.reply(msg, {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    });
  });

  // ── /portfolio ──
  bot.command('portfolio', async (ctx: Context) => {
    const userId = ctx.from!.id;

    if (!tonService.hasWallet(userId)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }

    await ctx.replyWithChatAction('typing');

    const { balance } = await tonService.getBalance(userId);
    const jettons = await tonService.getJettons(userId);
    const nfts = await tonService.getNFTs(userId);
    const txs = await tonService.getTransactions(userId, 5);

    await ctx.reply(
      portfolioMessage(balance, jettons.length, nfts.length, txs),
      {
        parse_mode: 'HTML',
        reply_markup: backKeyboard(),
      }
    );
  });

  // ── /invoice ──
  bot.command('invoice', async (ctx: Context) => {
    const userId = ctx.from!.id;
    const address = tonService.getAddress(userId);

    if (!address || !tonService.hasWallet(userId)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }

    await ctx.reply(invoiceInstructionsMessage(), { parse_mode: 'HTML' });
  });

  // ── /network ──
  bot.command('network', async (ctx: Context) => {
    const user = db.getUser(ctx.from!.id);
    await ctx.reply(
      networkMessage(user?.network ?? 'testnet'),
      {
        parse_mode: 'HTML',
        reply_markup: networkKeyboard(),
      }
    );
  });

  // ── /about ──
  bot.command('about', async (ctx: Context) => {
    await ctx.reply(aboutMessage(), {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    });
  });

  // ── /demo ──
  bot.command('demo', async (ctx: Context) => {
    await ctx.reply(demoMessage(), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(),
    });
  });

  // ── /connect — TON Connect wallet connection ──
  bot.command('connect', async (ctx: Context) => {
    const userId = ctx.from!.id;
    const session = tonConnect.getSession(userId);

    if (session) {
      await ctx.reply(
        [
          `🔗 <b>Wallet Connected</b>`,
          ``,
          `📱 App: <b>${session.walletApp}</b>`,
          `📍 Address: <code>${session.walletAddress}</code>`,
          `🕐 Connected: ${new Date(session.connectedAt).toLocaleDateString()}`,
          ``,
          `<i>Send /wallet to view balance or /disconnect to remove.</i>`,
        ].join('\n'),
        { parse_mode: 'HTML' }
      );
      return;
    }

    const links = tonConnect.generateConnectLink(userId);

    await ctx.reply(
      [
        `🔗 <b>Connect Your Wallet</b>`,
        ``,
        `Choose your wallet app to connect:`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📱 <b>Tonkeeper</b> — <a href="${links.tonkeeperLink}">Open Tonkeeper</a>`,
        `📱 <b>MyTonWallet</b> — <a href="${links.myTonWalletLink}">Open MyTonWallet</a>`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `💡 Or paste your wallet address (EQ… or UQ…) to connect manually.`,
        ``,
        `<i>Powered by TON Connect 2.0 — non-custodial, secure</i>`,
      ].join('\n'),
      { parse_mode: 'HTML', link_preview_options: { is_disabled: true } }
    );
  });

  // ── /mcp — MCP integration status ──
  bot.command('mcp', async (ctx: Context) => {
    const mcpStatus = mcpClient.getStatus();
    const features = (mcpStatus.features as string[]) || [];

    await ctx.reply(
      [
        `🔌 <b>MCP Integration Status</b>`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📡 <b>@ton/mcp</b> (Consumer)`,
        `   Status: ${mcpStatus.available ? '✅ Connected' : '⚠️ Offline'}`,
        `   Network: <code>${mcpStatus.network}</code>`,
        `   Server: <code>${mcpStatus.server}</code>`,
        `   Features: ${features.length}`,
        ``,
        `   ${features.map(f => `• ${f}`).join('\n   ')}`,
        ``,
        `🔧 <b>tonbrain-mcp</b> (Provider)`,
        `   Tools: <b>13</b>`,
        `   Transport: stdio / HTTP`,
        `   Setup: <code>npx tonbrain-mcp</code>`,
        ``,
        `   🔑 Wallet (5 tools)`,
        `   💰 Payments (4 tools)`,
        `   🤖 Coordination (4 tools)`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `<i>TonBrain: bidirectional MCP — consumes AND produces</i>`,
      ].join('\n'),
      { parse_mode: 'HTML' }
    );
  });

  // ── /clear ──
  bot.command('clear', async (ctx: Context) => {
    db.clearConversations(ctx.from!.id);
    await ctx.reply('🗑 <b>Conversation history cleared.</b>\n\nStart fresh!', {
      parse_mode: 'HTML',
    });
  });
}
