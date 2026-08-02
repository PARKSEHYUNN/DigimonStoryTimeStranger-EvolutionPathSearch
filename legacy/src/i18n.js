// src/i18n.js

// 모듈 선언
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import koTranslations from './locales/ko.json';
import jaTranslations from './locales/ja.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ko: {
        translation: koTranslations,
      },
      ja: {
        translation: jaTranslations,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ko', 'ja'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'cookie', 'path'],
      caches: ['localStorage'],
    },
  });

export default i18n;
