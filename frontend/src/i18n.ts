import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import taTranslations from './locales/ta.json';
import enTranslations from './locales/en.json';

const resources = {
    en: {
        translation: enTranslations
    },
    ta: {
        translation: taTranslations
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
