import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '../i18n';

const LANGUAGE_LABELS: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  ca: 'CAT',
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

  return (
    <div className={`language-switcher language-switcher--${variant}`}>
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
