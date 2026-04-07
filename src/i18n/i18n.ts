import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';
import he from './locales/he.json';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'language';

function loadLanguage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  } catch {
    return 'en';
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      he: { translation: he },
    },
    lng: loadLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    logger.info('i18n initialized successfully');
  })
  .catch((error) => {
    logger.error('i18n initialization failed', error);
  });

export const LANGUAGES = ['en', 'ru', 'he'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  ru: 'RU',
  he: 'HE',
};

export { i18n, STORAGE_KEY };
