import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { languageStorage } from '@/lib/storage';

import en from './en.json';
import ta from './ta.json';

const stored = languageStorage.get();
const deviceLang = Localization.getLocales()[0]?.languageCode;
const fallbackLng = stored ?? (deviceLang === 'ta' ? 'ta' : 'en');

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    lng: fallbackLng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export { i18n };
