// TonBrain SDK — Main Exports
// The complete AI Agent Infrastructure SDK for TON Blockchain

// Core
export { TonBrainAgent } from './core/agent.js';
export { WalletManager } from './core/wallet.js';
export { loadConfig, ConfigSchema } from './core/config.js';
export type { TonBrainConfig } from './core/config.js';
export type {
  WalletInfo,
  JettonBalance,
  TransactionInfo,
  TransferResult,
  SwapQuote,
  NFTInfo,
} from './core/wallet.js';

// Payments
export { EscrowManager } from './payments/escrow.js';
export { InvoiceManager } from './payments/invoice.js';
export { PaymentSplitter } from './payments/split.js';
export type { EscrowPayment, EscrowState } from './payments/escrow.js';
export type { Invoice, InvoiceStatus } from './payments/invoice.js';
export type { PaymentSplit, SplitRecipient } from './payments/split.js';

// Coordination
export { AgentRegistry } from './coordination/registry.js';
export { AgentProtocol } from './coordination/protocol.js';
export { TaskRouter } from './coordination/router.js';
export type { AgentRegistration, AgentCapability } from './coordination/registry.js';
export type { AgentMessage, TaskRequest, TaskResponse, PaymentTerms } from './coordination/protocol.js';
export type { RoutedTask } from './coordination/router.js';

// Utils
export { Logger } from './utils/logger.js';
export {
  TonBrainError,
  WalletError,
  TransferError,
  PaymentError,
  CoordinationError,
  ConfigError,
} from './utils/errors.js';
