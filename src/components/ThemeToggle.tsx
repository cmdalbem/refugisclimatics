import { MoonIcon } from '@phosphor-icons/react/dist/csr/Moon';
import { SunIcon } from '@phosphor-icons/react/dist/csr/Sun';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../hooks/useTheme';

interface Props {
  variant?: 'default' | 'on-gradient' | 'mobile';
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
      {isDark ? (
        <SunIcon size={20} weight="regular" aria-hidden />
      ) : (
        <MoonIcon size={20} weight="regular" aria-hidden />
      )}
    </button>
  );
}
