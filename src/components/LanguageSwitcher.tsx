import { useTranslation } from 'react-i18next';

import { resolveLanguage, SUPPORTED_LANGUAGES } from '../i18n';

const LANGUAGE_LABELS: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  ca: 'CAT',
  es: 'ES',
  en: 'EN',
  'pt-BR': 'PT',
};

interface Props {
  variant?: 'default' | 'on-gradient' | 'mobile';
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3 12h18M12 3c2.5 2.8 3.75 5.8 3.75 9S14.5 18.2 12 21c-2.5-2.8-3.75-5.8-3.75-9S9.5 5.8 12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LanguageSwitcher({ variant = 'default' }: Props) {
  const { i18n, t } = useTranslation();
  const currentLanguage = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <div className={`language-switcher language-switcher--${variant}`}>
      <GlobeIcon />
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
