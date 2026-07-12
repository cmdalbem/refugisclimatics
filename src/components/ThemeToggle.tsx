import { useTranslation } from 'react-i18next';

import { useTheme } from '../hooks/useTheme';

interface Props {
  variant?: 'default' | 'on-gradient' | 'mobile';
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function ThemeToggle({ variant = 'default' }: Props) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${variant}`}
      onClick={toggleTheme}
      aria-label={isDark ? t('themeToggle.toLight') : t('themeToggle.toDark')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
