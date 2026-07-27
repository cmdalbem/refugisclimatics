import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { APP_PAGE_TITLE } from '../constants';
import ca from './locales/ca.json';
import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

const STORAGE_KEY = 'lang';
export const SUPPORTED_LANGUAGES = ['ca', 'es', 'en', 'pt-BR'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function matchSupportedLanguage(language: string): SupportedLanguage | null {
  const exact = SUPPORTED_LANGUAGES.find(code => language === code);
  if (exact) return exact;

  const base = language.split('-')[0];
  if (base === 'pt') return 'pt-BR';

  return SUPPORTED_LANGUAGES.find(code => code === base || code.startsWith(`${base}-`)) ?? null;
}

export function resolveLanguage(language: string): SupportedLanguage {
  return matchSupportedLanguage(language) ?? 'en';
}

function getInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }

  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const candidate of candidates) {
    const matched = matchSupportedLanguage(candidate);
    if (!matched) continue;
    // Barcelona context: Spanish browser locale → Catalan by default
    return matched === 'es' ? 'ca' : matched;
  }

  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    ca: { translation: ca },
    es: { translation: es },
    en: { translation: en },
    'pt-BR': { translation: ptBR },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', lng => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;
document.title = APP_PAGE_TITLE;

export default i18n;
