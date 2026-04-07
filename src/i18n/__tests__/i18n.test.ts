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
    const getItemSpy = vi
      .spyOn(localStorage, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage unavailable');
      });

    const { i18n } = await importI18nModule();

    expect(getItemSpy).toHaveBeenCalledWith('language');
    expect(i18n.language).toBe('en');
    expect(i18n.t('layout.editMode')).toBe('Edit Mode');
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
