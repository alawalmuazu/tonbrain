// TonBrain SDK — Error Types

export class TonBrainError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'TonBrainError';
    this.code = code;
    this.details = details;
  }
}

export class WalletError extends TonBrainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WALLET_ERROR', details);
    this.name = 'WalletError';
  }
}

export class TransferError extends TonBrainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TRANSFER_ERROR', details);
    this.name = 'TransferError';
  }
}

export class PaymentError extends TonBrainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', details);
    this.name = 'PaymentError';
  }
}

export class CoordinationError extends TonBrainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'COORDINATION_ERROR', details);
    this.name = 'CoordinationError';
  }
}

export class ConfigError extends TonBrainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}
