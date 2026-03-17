// TonBrain Bot — Production-Grade Callback & Message Handlers
import type { Context } from 'grammy';
import type { TonService } from '../services/ton.js';
import type { BotDatabase } from '../utils/db.js';
import type { AIEngine } from '../ai/engine.js';
import {
  mainMenuKeyboard,
  walletKeyboard,
  backKeyboard,
  welcomeKeyboard,
  onboardingKeyboard,
  settingsKeyboard,
  networkKeyboard,
} from '../utils/keyboard.js';
import {
  helpMessage,
  aboutMessage,
  walletSetupMessage,
  walletConnectedMessage,
  noWalletMessage,
  errorMessage,
  formatAddress,
  formatTime,
} from '../utils/format.js';

/**
 * Register callback query handlers for inline buttons
 */
export function registerCallbacks(
  bot: any,
  tonService: TonService,
  db: BotDatabase,
): void {

  // ── Menu navigation ──
  bot.callbackQuery('action:menu', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🧠 <b>TonBrain Menu</b>\n\nWhat would you like to do?`,
      { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() }
    );
  });

  bot.callbackQuery('action:connect_wallet', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(walletSetupMessage(), {
      parse_mode: 'HTML',
      reply_markup: onboardingKeyboard(),
    });
  });

  bot.callbackQuery('action:balance', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from!.id;
    if (!tonService.hasWallet(userId)) {
      await ctx.editMessageText(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }
    try {
      const { balance } = await tonService.getBalance(userId);
      await ctx.editMessageText(
        `💎 <b>Balance:</b> ${balance} TON`,
        { parse_mode: 'HTML', reply_markup: backKeyboard() }
      );
    } catch {
      await ctx.editMessageText(
        errorMessage('Could not fetch balance', 'Try again in a moment or use /balance'),
        { parse_mode: 'HTML', reply_markup: backKeyboard() }
      );
    }
  });

  bot.callbackQuery('action:help', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(helpMessage(), {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    });
  });

  bot.callbackQuery('action:about', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(aboutMessage(), {
      parse_mode: 'HTML',
      reply_markup: backKeyboard(),
    });
  });

  bot.callbackQuery('action:settings', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    const user = db.getUser(ctx.from!.id);
    await ctx.editMessageText(
      [
        `⚙️ <b>Settings</b>`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `🌐 <b>Network:</b> ${user?.network ?? 'testnet'}`,
        `🗂 <b>History:</b> Use Clear History to reset`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: settingsKeyboard() }
    );
  });

  bot.callbackQuery('action:network', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    const user = db.getUser(ctx.from!.id);
    await ctx.editMessageText(
      [
        `🌐 <b>Network Selection</b>`,
        ``,
        `Current: <b>${user?.network ?? 'testnet'}</b>`,
        ``,
        `Choose your network:`,
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: networkKeyboard() }
    );
  });

  bot.callbackQuery('action:clear_history', async (ctx: Context) => {
    await ctx.answerCallbackQuery({ text: 'History cleared!' });
    db.clearConversations(ctx.from!.id);
    await ctx.editMessageText(
      `🗑 <b>History cleared.</b>\n\nStart fresh!`,
      { parse_mode: 'HTML', reply_markup: backKeyboard() }
    );
  });

  // ── Specific action callbacks that trigger commands ──
  bot.callbackQuery('action:send', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    if (!tonService.hasWallet(ctx.from!.id)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }
    await ctx.reply(
      [
        `💸 <b>Send TON</b>`,
        ``,
        `Tell me what you'd like to send:`,
        ``,
        `<i>"Send 1.5 TON to EQ…"</i>`,
        `<i>"Transfer 0.1 TON to alice.ton"</i>`,
      ].join('\n'),
      { parse_mode: 'HTML' }
    );
  });

  bot.callbackQuery('action:swap', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    if (!tonService.hasWallet(ctx.from!.id)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }
    await ctx.reply(
      [
        `🔄 <b>Token Swap</b>`,
        ``,
        `Tell me what you'd like to swap:`,
        ``,
        `<i>"Swap 1 TON for USDT"</i>`,
      ].join('\n'),
      { parse_mode: 'HTML' }
    );
  });

  bot.callbackQuery('action:nfts', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    if (!tonService.hasWallet(ctx.from!.id)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }
    const nfts = await tonService.getNFTs(ctx.from!.id);
    if (nfts.length === 0) {
      await ctx.reply(
        `🖼 <b>Your NFTs</b>\n\n<i>No NFTs found.</i>`,
        { parse_mode: 'HTML', reply_markup: backKeyboard() }
      );
    } else {
      let msg = `🖼 <b>Your NFTs</b> (${nfts.length})\n\n`;
      for (const nft of nfts.slice(0, 5)) {
        msg += `• <b>${nft.name}</b>\n`;
      }
      await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: backKeyboard() });
    }
  });

  bot.callbackQuery('action:portfolio', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    if (!tonService.hasWallet(ctx.from!.id)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }
    const userId = ctx.from!.id;
    const { balance } = await tonService.getBalance(userId);
    const jettons = await tonService.getJettons(userId);
    const nfts = await tonService.getNFTs(userId);
    await ctx.reply(
      [
        `📊 <b>Portfolio Overview</b>`,
        ``,
        `💎 <b>TON:</b> ${balance} TON`,
        `🪙 <b>Tokens:</b> ${jettons.length}`,
        `🖼 <b>NFTs:</b> ${nfts.length}`,
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: backKeyboard() }
    );
  });

  bot.callbackQuery('action:invoice', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    if (!tonService.hasWallet(ctx.from!.id)) {
      await ctx.reply(noWalletMessage(), { parse_mode: 'HTML' });
      return;
    }
    await ctx.reply(
      [
        `📄 <b>Create Invoice</b>`,
        ``,
        `Tell me the payment details:`,
        ``,
        `<i>"Create invoice for 2 TON — AI translation"</i>`,
      ].join('\n'),
      { parse_mode: 'HTML' }
    );
  });

  // ── Network selection ──
  bot.callbackQuery(/^network:/, async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    const network = ctx.callbackQuery!.data!.split(':')[1];
    await ctx.editMessageText(
      `✅ Network switched to <b>${network}</b>`,
      { parse_mode: 'HTML', reply_markup: backKeyboard() }
    );
  });

  // ── Wallet callbacks ──
  bot.callbackQuery('wallet:balance', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from!.id;
    try {
      const { balance } = await tonService.getBalance(userId);
      await ctx.editMessageText(
        `💎 <b>Balance:</b> ${balance} TON`,
        { parse_mode: 'HTML', reply_markup: walletKeyboard() }
      );
    } catch {
      await ctx.editMessageText(
        errorMessage('Balance fetch failed', 'Try /balance'),
        { parse_mode: 'HTML', reply_markup: backKeyboard() }
      );
    }
  });

  bot.callbackQuery('wallet:copy', async (ctx: Context) => {
    const address = tonService.getAddress(ctx.from!.id);
    await ctx.answerCallbackQuery({
      text: address ? `Address: ${address}` : 'No wallet connected',
      show_alert: true,
    });
  });

  bot.callbackQuery('wallet:history', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from!.id;
    const txs = await tonService.getTransactions(userId, 5);

    if (txs.length === 0) {
      await ctx.editMessageText(
        `📜 <b>Transaction History</b>\n\n<i>No transactions found.</i>`,
        { parse_mode: 'HTML', reply_markup: walletKeyboard() }
      );
      return;
    }

    let msg = `📜 <b>Recent Transactions</b>\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const tx of txs) {
      const emoji = tx.type === 'incoming' ? '📥' : '📤';
      msg += `${emoji} ${tx.amount} TON — ${new Date(tx.timestamp * 1000).toLocaleDateString()}\n`;
    }

    await ctx.editMessageText(msg, {
      parse_mode: 'HTML',
      reply_markup: walletKeyboard(),
    });
  });

  // ── No-op for display-only buttons ──
  bot.callbackQuery('noop', async (ctx: Context) => {
    await ctx.answerCallbackQuery();
  });

  // ── Catch-all ──
  bot.callbackQuery(/.*/, async (ctx: Context) => {
    await ctx.answerCallbackQuery({ text: '⏳ Processing…' });
  });
}

/**
 * Register the natural language message handler
 */
export function registerMessageHandler(
  bot: any,
  tonService: TonService,
  db: BotDatabase,
  aiEngine: AIEngine,
): void {

  bot.on('message:text', async (ctx: Context) => {
    const userId = ctx.from!.id;
    const text = ctx.message!.text!;

    // Ensure user exists
    db.upsertUser({
      telegramId: userId,
      username: ctx.from!.username ?? null,
      firstName: ctx.from!.first_name,
    });

    // Check if user is trying to set a wallet address
    if (text.match(/^(EQ|UQ|0:)[A-Za-z0-9_-]{46,}$/)) {
      try {
        await ctx.replyWithChatAction('typing');
        await tonService.setUserWallet(userId, text.trim());
        db.setWalletAddress(userId, text.trim());
        const { balance } = await tonService.getBalance(userId);
        await ctx.reply(
          walletConnectedMessage(text.trim(), balance),
          { parse_mode: 'HTML', reply_markup: mainMenuKeyboard() }
        );
      } catch (error) {
        await ctx.reply(
          errorMessage('Invalid wallet address', 'Please check the address and try again.'),
          { parse_mode: 'HTML' }
        );
      }
      return;
    }

    // Send to AI engine for natural language processing
    try {
      await ctx.replyWithChatAction('typing');
      const response = await aiEngine.chat(userId, text);
      await ctx.reply(response, {
        parse_mode: 'HTML',
        reply_markup: backKeyboard(),
      });
    } catch (error) {
      console.error('Message handler error:', error);
      await ctx.reply(
        errorMessage(
          'I couldn\'t process your message',
          'Try using a command like /help or rephrase your question.'
        ),
        { parse_mode: 'HTML' }
      );
    }
  });
}
