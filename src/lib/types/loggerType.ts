export enum ELogIcons {
  debug = '🔒', // 0x1f512
  log = '🚀', // 0x1f680
  info = 'ℹ️', // Direct emoji string
  warn = '⚠️', // 0x26a0 + 0xfe0f
  error = '🔥', // 0x1f525
}

export enum ELogLevels {
  DEBUG = 'debug',
  LOG = 'log',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export type TLogMethod = 'debug' | 'log' | 'info' | 'warn' | 'error';
export type TLogArgs = unknown[];

export type TLoggerProps = {
  type?: ELogLevels;
  echo?: Console;
  args?: TLogArgs;
};

export interface ILogger {
  debug(message: string, ...meta: TLogArgs): void;
  log(message: string, ...meta: TLogArgs): void;
  info(message: string, ...meta: TLogArgs): void;
  warn(message: string, ...meta: TLogArgs): void;
  error(message: string, ...meta: TLogArgs): void;
}
