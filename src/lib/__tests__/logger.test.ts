import { beforeEach, describe, expect, it, vi } from 'vitest';

const { terminal } = vi.hoisted(() => ({
  terminal: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('virtual:terminal', () => ({
  terminal,
}));

import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes debug messages to console.debug and falls back to terminal.log', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.debug('hello', { id: 1 });

    expect(debugSpy).toHaveBeenCalledWith('🔒', 'hello', { id: 1 });
    expect(terminal.log).toHaveBeenCalledWith('hello', { id: 1 });
    expect(terminal.info).not.toHaveBeenCalled();
    expect(terminal.warn).not.toHaveBeenCalled();
    expect(terminal.error).not.toHaveBeenCalled();
  });

  it('writes info messages to console.info and terminal.info', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('saved', 123);

    expect(infoSpy).toHaveBeenCalledWith('ℹ️', 'saved', 123);
    expect(terminal.info).toHaveBeenCalledWith('saved', 123);
    expect(terminal.log).not.toHaveBeenCalled();
  });
});
