import { useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shelterNetworkUrl, TYPOLOGY_ICONS, DEFAULT_ICON } from '../constants';
import LogoTitle from './LogoTitle';
import PinIcon from './PinIcon';

const STORAGE_KEY = 'welcome-dismissed';
// TODO: set back to false before shipping
const ALWAYS_SHOW_FOR_TESTING = true;

const TYPOLOGIES = Object.keys(TYPOLOGY_ICONS).sort((a, b) => a.localeCompare(b, 'es'));

interface Props {
  ready: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function WelcomeModal({ ready, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dismissedRef = useRef(
    !ALWAYS_SHOW_FOR_TESTING && localStorage.getItem(STORAGE_KEY) === '1',
  );

  useEffect(() => {
    if (!ready || dismissedRef.current) {
      onOpenChange?.(false);
      return;
    }
    dialogRef.current?.showModal();
    onOpenChange?.(true);
  }, [ready, onOpenChange]);

  const handleClose = () => {
    if (!ALWAYS_SHOW_FOR_TESTING) {
      localStorage.setItem(STORAGE_KEY, '1');
      dismissedRef.current = true;
    }
    onOpenChange?.(false);
  };

  const dismiss = () => {
    dialogRef.current?.close();
  };

  if (!ALWAYS_SHOW_FOR_TESTING && dismissedRef.current) return null;

  return (
    <dialog
      ref={dialogRef}
      className="welcome-modal"
      onClose={handleClose}
      onCancel={dismiss}
      aria-labelledby="welcome-modal-title"
    >
      <div className="welcome-modal-panel">
        <button
          type="button"
          className="welcome-modal-close"
          onClick={dismiss}
          aria-label={t('welcomeModal.close')}
        >
          <PinIcon name="x" size={16} />
        </button>

        <header className="welcome-modal-header">
          <img className="welcome-modal-logo" src="/official-logo.png" alt="" width={80} height={80} />
          <div className="welcome-modal-intro">
            <LogoTitle id="welcome-modal-title" />
          </div>
        </header>

        <div className="welcome-modal-body">
          <p>{t('welcomeModal.lead')}</p>
          <p>{t('welcomeModal.spaces')}</p>

          <ul className="welcome-modal-typologies" aria-label={t('welcomeModal.typologiesLabel')}>
            {TYPOLOGIES.map(typology => (
              <li key={typology} className="welcome-modal-typology">
                <PinIcon
                  name={TYPOLOGY_ICONS[typology] ?? DEFAULT_ICON}
                  size={20}
                  className="welcome-modal-typology-icon"
                />
                <span className="sr-only">
                  {t(`typology.${typology}`, { defaultValue: typology })}
                </span>
              </li>
            ))}
          </ul>

          <p>{t('welcomeModal.access')}</p>
        </div>

        <footer className="welcome-modal-footer">
          <button type="button" className="pill active welcome-modal-dismiss" onClick={dismiss}>
            {t('welcomeModal.dismiss')}
          </button>
          <p className="welcome-modal-disclaimer">
            <Trans
              i18nKey="welcomeModal.disclaimer"
              components={{
                officialLink: (
                  <a
                    href={shelterNetworkUrl(i18n.language)}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            />
          </p>
        </footer>
      </div>
    </dialog>
  );
}
