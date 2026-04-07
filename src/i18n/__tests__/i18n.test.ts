import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const importI18nModule = async () => {
  vi.resetModules();
  return import('../i18n');
};

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to English when no language is stored', async () => {
    const { i18n, STORAGE_KEY } = await importI18nModule();

    expect(STORAGE_KEY).toBe('language');
    expect(i18n.language).toBe('en');
    expect(i18n.t('common.save')).toBe('Save');
  });

  it('initializes using the saved language from localStorage', async () => {
    localStorage.setItem('language', 'he');

    const { i18n } = await importI18nModule();

    expect(i18n.language).toBe('he');
    expect(i18n.t('common.save')).toBe('שמור');
  });

  it('falls back to English when localStorage access throws', async () => {
    vi.resetModules();
    const originalLocalStorage = globalThis.localStorage;

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...originalLocalStorage,
        getItem: vi.fn(() => {
          throw new Error('storage unavailable');
        }),
      },
    });

    try {
      const { i18n } = await import('../i18n');

      expect(i18n.language).toBe('en');
      expect(i18n.t('layout.editMode')).toBe('Edit Mode');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: originalLocalStorage,
      });
    }
  });

  it('exports the supported languages and short labels', async () => {
    const { LANGUAGES, LANGUAGE_LABELS } = await importI18nModule();

    expect(LANGUAGES).toEqual(['en', 'ru', 'he']);
    expect(LANGUAGE_LABELS).toEqual({
      en: 'EN',
      ru: 'RU',
      he: 'HE',
    });
  });
});
