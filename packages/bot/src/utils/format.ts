// TonBrain Bot — Production-Grade Message Templates (HTML)
// All messages use HTML parse_mode for reliability

/**
 * Escape special HTML characters to prevent injection
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Format a TON address for display (shortened)
 */
export function formatAddress(address: string, chars: number = 6): string {
  if (!address || address.length < chars * 2) return escapeHtml(address);
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/**
 * Format TON amount with diamond emoji
 */
export function formatTON(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `💎 <b>${num.toFixed(4)} TON</b>`;
}

/**
 * Format USD value
 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format timestamp to readable date
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Progress bar visual
 */
export function progressBar(current: number, max: number, length: number = 10): string {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ═══════════════════════════════════════════════════
// MESSAGE TEMPLATES
// ═══════════════════════════════════════════════════

/**
 * Welcome message — sent with the branded banner photo
 */
export function welcomeMessage(firstName: string): string {
  return [
    `🧠 <b>Welcome to TonBrain, ${escapeHtml(firstName)}!</b>`,
    ``,
    `Your AI-powered assistant for the <b>TON blockchain</b>.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `💎 <b>Wallet</b> — Check balances, manage tokens`,
    `💸 <b>Send</b> — Transfer TON and Jettons`,
    `🔄 <b>Swap</b> — Trade tokens via DEX`,
    `🖼 <b>NFTs</b> — Browse your collections`,
    `📊 <b>Portfolio</b> — Full asset overview`,
    `📄 <b>Invoice</b> — Create payment requests`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<i>💡 Use the menu buttons below, commands, or just chat with me naturally!</i>`,
    ``,
    `⚡️ <b>Quick Start:</b>`,
    `/wallet — Connect your wallet`,
    `/balance — Check your TON balance`,
    `/help — See all commands`,
  ].join('\n');
}

/**
 * Help overview — categorized with rich formatting
 */
export function helpMessage(): string {
  return [
    `🧠 <b>TonBrain — Command Reference</b>`,
    ``,
    `━━━━━ 💼 <b>Wallet</b> ━━━━━`,
    `/wallet — View wallet address & QR`,
    `/balance — TON & token balances`,
    ``,
    `━━━━━ 💸 <b>Transfers</b> ━━━━━`,
    `/send — Send TON or tokens`,
    `/invoice — Create payment request`,
    ``,
    `━━━━━ 🔄 <b>Trading</b> ━━━━━`,
    `/swap — Swap tokens via DEX`,
    ``,
    `━━━━━ 📦 <b>Assets</b> ━━━━━`,
    `/nfts — Browse your NFTs`,
    `/portfolio — Full portfolio overview`,
    ``,
    `━━━━━ ⚙️ <b>Settings</b> ━━━━━`,
    `/network — Switch mainnet/testnet`,
    `/clear — Clear chat history`,
    `/about — Bot info & version`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🤖 <b>AI Chat</b> — Just type naturally!`,
    `<i>"What's my balance?"</i>`,
    `<i>"Send 0.5 TON to EQ…"</i>`,
    `<i>"Show my NFTs"</i>`,
    ``,
    `<i>Built for TON AI Agent Hackathon 🏆</i>`,
  ].join('\n');
}

/**
 * Wallet setup — onboarding flow for new users
 */
export function walletSetupMessage(): string {
  return [
    `💼 <b>Wallet Setup</b>`,
    ``,
    `You don't have a wallet connected yet.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<b>Step 1:</b> Get a TON wallet`,
    `   • <a href="https://t.me/wallet">@wallet</a> — Telegram's built-in wallet`,
    `   • <a href="https://tonkeeper.com">Tonkeeper</a> — Popular TON wallet`,
    ``,
    `<b>Step 2:</b> Copy your wallet address`,
    `   It starts with <code>EQ</code> or <code>UQ</code>`,
    ``,
    `<b>Step 3:</b> Paste it here`,
    `   Just send me the address as a message!`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<i>💡 Your keys stay with you — TonBrain only reads public data from the blockchain.</i>`,
  ].join('\n');
}

/**
 * Wallet connected confirmation
 */
export function walletConnectedMessage(address: string, balance: string): string {
  return [
    `✅ <b>Wallet Connected!</b>`,
    ``,
    `📍 <code>${escapeHtml(address)}</code>`,
    `💎 Balance: <b>${balance} TON</b>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `You're all set! Here's what you can do:`,
    ``,
    `• /balance — Detailed token breakdown`,
    `• /portfolio — Full asset overview`,
    `• /send — Transfer TON`,
    ``,
    `<i>Or just ask me anything in natural language!</i>`,
  ].join('\n');
}

/**
 * Wallet info — for already-connected users
 */
export function walletInfoMessage(address: string, balance: string, network: string): string {
  return [
    `💼 <b>Your Wallet</b>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📍 <b>Address:</b>`,
    `<code>${escapeHtml(address)}</code>`,
    ``,
    `💎 <b>Balance:</b> ${balance} TON`,
    `🌐 <b>Network:</b> ${network}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n');
}

/**
 * Balance overview
 */
export function balanceOverviewMessage(
  tonBalance: string,
  jettons: Array<{ symbol: string; balance: string; decimals: number }>,
): string {
  const lines = [
    `💎 <b>Balance Overview</b>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<b>TON:</b> ${tonBalance} TON`,
    ``,
  ];

  if (jettons.length > 0) {
    lines.push(`<b>Tokens:</b>`);
    for (const j of jettons.slice(0, 10)) {
      const humanBalance = (Number(j.balance) / Math.pow(10, j.decimals)).toFixed(4);
      lines.push(`   • <b>${escapeHtml(j.symbol)}</b>: ${humanBalance}`);
    }
    if (jettons.length > 10) {
      lines.push(`   <i>…and ${jettons.length - 10} more</i>`);
    }
  } else {
    lines.push(`<i>No tokens found</i>`);
  }

  lines.push(``, `━━━━━━━━━━━━━━━━━━━━━━━━`);
  return lines.join('\n');
}

/**
 * Portfolio overview
 */
export function portfolioMessage(
  tonBalance: string,
  jettonCount: number,
  nftCount: number,
  recentTxs: Array<{ type: string; amount: string; timestamp: number }>,
): string {
  const lines = [
    `📊 <b>Portfolio Overview</b>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `💎 <b>TON:</b> ${tonBalance} TON`,
    `🪙 <b>Tokens:</b> ${jettonCount}`,
    `🖼 <b>NFTs:</b> ${nftCount}`,
    ``,
  ];

  if (recentTxs.length > 0) {
    lines.push(`━━━━━ 📜 <b>Recent Activity</b> ━━━━━`);
    lines.push(``);
    for (const tx of recentTxs) {
      const emoji = tx.type === 'incoming' ? '📥' : '📤';
      lines.push(`${emoji} ${tx.amount} TON — ${formatTime(tx.timestamp)}`);
    }
  }

  lines.push(``, `━━━━━━━━━━━━━━━━━━━━━━━━`);
  return lines.join('\n');
}

/**
 * About / bot info — with contest details
 */
export function aboutMessage(): string {
  return [
    `🧠 <b>TonBrain v1.0.0</b>`,
    `<i>The Native AI Agent Framework for TON</i>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🏆 <b>TON AI Agent Hackathon 2026</b>`,
    `💰 Prize Pool: <b>$20,000</b> ($10K/track)`,
    `📅 Deadline: <b>March 25, 2026 UTC</b>`,
    ``,
    `━━━━━ <b>Our Tracks</b> ━━━━━`,
    `🏗 <b>Track 1</b> — Agent Infrastructure`,
    `   <code>tonbrain-sdk</code> — Open-source SDK`,
    `   <code>tonbrain-mcp</code> — 13 MCP tools for Claude/Cursor`,
    `🤖 <b>Track 2</b> — User-Facing Agent`,
    `   <code>tonbrain-bot</code> — This Telegram bot`,
    ``,
    `━━━━━ <b>Tech Stack</b> ━━━━━`,
    `⚡ Gemini 2.0 Flash — AI Engine`,
    `🔌 MCP Protocol — 13 Claude/Cursor tools`,
    `💎 TON API — Blockchain Data`,
    `📱 Grammy — Telegram Framework`,
    `📘 TypeScript — Type-Safe Monorepo`,
    ``,
    `━━━━━ <b>Links</b> ━━━━━`,
    `🏆 <a href="https://identityhub.app/contests/ai-hackathon">Contest Page</a>`,
    `📖 <a href="https://docs.ton.org/ecosystem/ai/mcp">TON MCP Docs</a>`,
    `📊 <a href="https://identityhub.app/leaderboard">Leaderboard</a>`,
    `💎 <a href="https://ton.org">TON Foundation</a>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `<i>Filling the gap: The AI agent framework TON has been missing 🚀</i>`,
  ].join('\n');
}

/**
 * Demo message — showcase all capabilities at a glance
 */
export function demoMessage(): string {
  return [
    `🧠 <b>TonBrain Demo — What I Can Do</b>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `💬 <b>Natural Language AI</b>`,
    `   Just chat! I understand requests like:`,
    `   <i>"What's my balance?"</i>`,
    `   <i>"Show me my NFTs"</i>`,
    `   <i>"Send 0.5 TON to alice.ton"</i>`,
    ``,
    `💼 <b>Wallet Management</b>`,
    `   Connect any TON wallet by pasting`,
    `   your address (EQ… or UQ…)`,
    ``,
    `💎 <b>Balance & Portfolio</b>`,
    `   TON + Jetton tokens + NFTs`,
    `   Transaction history & analytics`,
    ``,
    `💸 <b>Send & Receive</b>`,
    `   Transfer TON with confirmation`,
    `   Create invoices with deep links`,
    ``,
    `🔄 <b>Token Swaps</b>`,
    `   DEX quotes via aggregators`,
    `   Best rates across DeDust & STON.fi`,
    ``,
    `🖼 <b>NFT Gallery</b>`,
    `   Browse collections, view metadata`,
    ``,
    `🌐 <b>TON DNS</b>`,
    `   Resolve .ton domains to addresses`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🔌 <b>MCP Server</b>`,
    `   13 tools for Claude Desktop, Cursor, VS Code`,
    `   Wallet, payments, escrow, agent coordination`,
    `   One-line setup: <code>npx tonbrain-mcp</code>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<b>Try it:</b> Type <i>"check my balance"</i> or use /wallet`,
    ``,
    `<i>Powered by Gemini AI + TON Blockchain + MCP</i>`,
  ].join('\n');
}

/**
 * Error message with recovery hint
 */
export function errorMessage(error: string, hint?: string): string {
  const lines = [
    `❌ <b>Something went wrong</b>`,
    ``,
    `<i>${escapeHtml(error)}</i>`,
  ];

  if (hint) {
    lines.push(``, `💡 <b>Try:</b> ${hint}`);
  }

  return lines.join('\n');
}

/**
 * Format a transaction for display
 */
export function formatTransaction(tx: {
  type: string;
  amount: string;
  from?: string;
  to?: string;
  timestamp: number;
  status: string;
}): string {
  const emoji = tx.type === 'incoming' ? '📥' : '📤';
  const statusEmoji = tx.status === 'completed' ? '✅' : tx.status === 'pending' ? '⏳' : '❌';
  return `${emoji} ${tx.amount} TON ${statusEmoji} — ${formatTime(tx.timestamp)}`;
}

/**
 * Loading message
 */
export function loadingMessage(action: string): string {
  return `⏳ <i>${escapeHtml(action)}…</i>`;
}

/**
 * No wallet connected warning
 */
export function noWalletMessage(): string {
  return [
    `⚠️ <b>No wallet connected</b>`,
    ``,
    `Use /wallet to connect your TON wallet first.`,
  ].join('\n');
}

/**
 * Send instructions
 */
export function sendInstructionsMessage(): string {
  return [
    `💸 <b>Send TON</b>`,
    ``,
    `Tell me what you'd like to send:`,
    ``,
    `<i>"Send 1.5 TON to EQ…"</i>`,
    `<i>"Transfer 0.1 TON to alice.ton"</i>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📍 <b>Address:</b> recipient's TON address`,
    `💎 <b>Amount:</b> amount in TON`,
    `💬 <b>Comment:</b> (optional) memo`,
  ].join('\n');
}

/**
 * Swap instructions
 */
export function swapInstructionsMessage(): string {
  return [
    `🔄 <b>Token Swap</b>`,
    ``,
    `Tell me what you'd like to swap:`,
    ``,
    `<i>"Swap 1 TON for USDT"</i>`,
    `<i>"Exchange 100 USDT to TON"</i>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `<i>Best quotes from DEX aggregators.</i>`,
  ].join('\n');
}

/**
 * Invoice creation instructions
 */
export function invoiceInstructionsMessage(): string {
  return [
    `📄 <b>Create Invoice</b>`,
    ``,
    `Tell me the payment details:`,
    ``,
    `<i>"Create invoice for 2 TON — AI translation"</i>`,
    `<i>"Invoice 0.5 TON for logo design"</i>`,
  ].join('\n');
}

/**
 * Network selection info
 */
export function networkMessage(currentNetwork: string): string {
  return [
    `🌐 <b>Network Selection</b>`,
    ``,
    `Current: <b>${escapeHtml(currentNetwork)}</b>`,
    ``,
    `Choose your network:`,
  ].join('\n');
}
