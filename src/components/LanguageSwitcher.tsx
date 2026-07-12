import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '../i18n';

const LANGUAGE_LABELS: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  ca: 'CA',
  es: 'ES',
  en: 'EN',
  'pt-BR': 'PT',
};

interface Props {
  variant?: 'default' | 'on-gradient' | 'mobile';
}

function resolveLanguage(language: string): (typeof SUPPORTED_LANGUAGES)[number] {
  return SUPPORTED_LANGUAGES.find(code => language === code || language.startsWith(`${code}-`)) ?? 'ca';
}

export default function LanguageSwitcher({ variant = 'default' }: Props) {
  const { i18n, t } = useTranslation();
  const currentLanguage = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);

  if (variant === 'mobile') {
    return (
      <div className="language-switcher language-switcher--mobile">
        <select
          className="language-switcher-select"
          aria-label={t('languageSwitcher.ariaLabel')}
          value={currentLanguage}
          onChange={event => i18n.changeLanguage(event.target.value)}
        >
          {SUPPORTED_LANGUAGES.map(code => (
            <option key={code} value={code}>
              {LANGUAGE_LABELS[code]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      className={`language-switcher language-switcher--${variant}`}
      role="group"
      aria-label={t('languageSwitcher.ariaLabel')}
    >
      {SUPPORTED_LANGUAGES.map(code => (
        <button
          key={code}
          type="button"
          className={`language-option${currentLanguage === code ? ' active' : ''}`}
          onClick={() => i18n.changeLanguage(code)}
        >
          {LANGUAGE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
