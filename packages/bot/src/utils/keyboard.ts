// TonBrain Bot — Production-Grade Inline Keyboards
import { InlineKeyboard } from 'grammy';

/**
 * Main menu keyboard — primary navigation grid
 */
export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('💎 Balance', 'action:balance')
    .text('💸 Send', 'action:send')
    .row()
    .text('🔄 Swap', 'action:swap')
    .text('🖼 NFTs', 'action:nfts')
    .row()
    .text('📊 Portfolio', 'action:portfolio')
    .text('📄 Invoice', 'action:invoice')
    .row()
    .text('⚙️ Settings', 'action:settings')
    .text('❓ Help', 'action:help');
}

/**
 * Welcome keyboard — menu + web app row
 */
export function welcomeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('💼 Connect Wallet', 'action:connect_wallet')
    .text('❓ Help', 'action:help')
    .row()
    .text('💎 Balance', 'action:balance')
    .text('💸 Send', 'action:send')
    .row()
    .text('🔄 Swap', 'action:swap')
    .text('🖼 NFTs', 'action:nfts')
    .row()
    .text('📊 Portfolio', 'action:portfolio')
    .text('📄 Invoice', 'action:invoice')
    .row()
    .text('ℹ️ About TonBrain', 'action:about');
}

/**
 * Wallet options keyboard
 */
export function walletKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('💎 Check Balance', 'wallet:balance')
    .text('📋 Copy Address', 'wallet:copy')
    .row()
    .text('📜 Transaction History', 'wallet:history')
    .row()
    .text('🔙 Main Menu', 'action:menu');
}

/**
 * Onboarding keyboard — guide new users
 */
export function onboardingKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .url('📱 Get @wallet', 'https://t.me/wallet')
    .url('💎 Get Tonkeeper', 'https://tonkeeper.com')
    .row()
    .text('🔙 Main Menu', 'action:menu');
}

/**
 * Confirm action keyboard
 */
export function confirmKeyboard(actionId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Confirm', `confirm:${actionId}`)
    .text('❌ Cancel', `cancel:${actionId}`);
}

/**
 * Network selection keyboard
 */
export function networkKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🧪 Testnet', 'network:testnet')
    .text('🌐 Mainnet', 'network:mainnet')
    .row()
    .text('🔙 Main Menu', 'action:menu');
}

/**
 * Back button only
 */
export function backKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔙 Main Menu', 'action:menu');
}

/**
 * Pagination keyboard for lists
 */
export function paginationKeyboard(page: number, totalPages: number, prefix: string): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (page > 1) kb.text('⬅️ Prev', `${prefix}:page:${page - 1}`);
  kb.text(`${page}/${totalPages}`, 'noop');
  if (page < totalPages) kb.text('Next ➡️', `${prefix}:page:${page + 1}`);
  kb.row().text('🔙 Main Menu', 'action:menu');
  return kb;
}

/**
 * Send confirmation keyboard
 */
export function sendConfirmKeyboard(txId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Send Now', `send:confirm:${txId}`)
    .text('❌ Cancel', `send:cancel:${txId}`);
}

/**
 * Settings keyboard
 */
export function settingsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🌐 Change Network', 'action:network')
    .row()
    .text('🗑 Clear History', 'action:clear_history')
    .row()
    .text('ℹ️ About', 'action:about')
    .row()
    .text('🔙 Main Menu', 'action:menu');
}
