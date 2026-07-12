import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '../i18n';

const LANGUAGE_LABELS: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  ca: 'CA',
  es: 'ES',
  en: 'EN',
  'pt-BR': 'PT',
};

interface Props {
  variant?: 'default' | 'on-gradient';
}

export default function LanguageSwitcher({ variant = 'default' }: Props) {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

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
          className={`language-option${current.startsWith(code) ? ' active' : ''}`}
          onClick={() => i18n.changeLanguage(code)}
        >
          {LANGUAGE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
