// TonBrain SDK — Structured Logger

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

export class Logger {
  private context: string;
  private minLevel: LogLevel;

  private static readonly LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(context: string, minLevel: LogLevel = 'info') {
    this.context = context;
    this.minLevel = minLevel;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (Logger.LEVELS[level] < Logger.LEVELS[this.minLevel]) return;

    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level];
    const prefix = `${color}${BOLD}[${level.toUpperCase()}]${RESET} ${color}${timestamp}${RESET} ${BOLD}[${this.context}]${RESET}`;

    if (data && Object.keys(data).length > 0) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`, this.minLevel);
  }
}

export const rootLogger = new Logger('TonBrain');
