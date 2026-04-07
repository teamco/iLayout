import { terminal } from 'virtual:terminal';

import {
  ELogLevels,
  ELogIcons,
  type ILogger,
  type TLogMethod,
  type TLoggerProps,
} from './types/loggerType';

const LOG_METHODS = Object.values(ELogLevels) as TLogMethod[];

const isLogMethod = (value: string): value is TLogMethod =>
  LOG_METHODS.includes(value as TLogMethod);

const getConsoleMethod = (echo: Console, level: TLogMethod) =>
  typeof echo[level] === 'function'
    ? echo[level].bind(echo)
    : echo.log.bind(echo);

const getTerminalMethod = (level: TLogMethod) => {
  const terminalLevel: Exclude<TLogMethod, 'debug'> | 'log' =
    level === ELogLevels.DEBUG ? ELogLevels.LOG : level;
  return terminal[terminalLevel];
};

const monitor = (props: TLoggerProps) => {
  const { type = ELogLevels.INFO, args = [], echo = console } = props;
  const level = type.toLowerCase();

  // Validate log level
  if (!isLogMethod(level)) {
    throw new Error(
      `Invalid log type: ${type}. Must be one of ${Object.values(ELogLevels).join(', ')}.`,
    );
  }

  const icon = ELogIcons[level];
  getConsoleMethod(echo, level)(icon, ...args);
  getTerminalMethod(level)(...args);
};

export const logger: ILogger = {
  debug: (message, ...meta) =>
    monitor({ type: ELogLevels.DEBUG, args: [message, ...meta] }),
  log: (message, ...meta) =>
    monitor({ type: ELogLevels.LOG, args: [message, ...meta] }),
  info: (message, ...meta) =>
    monitor({ type: ELogLevels.INFO, args: [message, ...meta] }),
  warn: (message, ...meta) =>
    monitor({ type: ELogLevels.WARN, args: [message, ...meta] }),
  error: (message, ...meta) =>
    monitor({ type: ELogLevels.ERROR, args: [message, ...meta] }),
};
