import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
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
  const [dismissed, setDismissed] = useState(
    () => !ALWAYS_SHOW_FOR_TESTING && localStorage.getItem(STORAGE_KEY) === '1',
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !dismissed) setOpen(true);
  }, [ready, dismissed]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && !ALWAYS_SHOW_FOR_TESTING) {
      localStorage.setItem(STORAGE_KEY, '1');
      setDismissed(true);
    }
  };

  if (!ALWAYS_SHOW_FOR_TESTING && dismissed) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="welcome-modal-overlay" />
        <Dialog.Content className="welcome-modal" aria-describedby={undefined}>
          <div className="welcome-modal-panel">
            <Dialog.Close type="button" className="welcome-modal-close" aria-label={t('welcomeModal.close')}>
              <PinIcon name="x" size={16} />
            </Dialog.Close>

            <header className="welcome-modal-header">
              <img className="welcome-modal-logo" src="/official-logo.png" alt="" width={80} height={80} />
              <div className="welcome-modal-intro">
                <Dialog.Title asChild>
                  <LogoTitle id="welcome-modal-title" />
                </Dialog.Title>
              </div>
            </header>

            <div className="welcome-modal-content">
              <div className="welcome-modal-body">
                <p>{t('welcomeModal.lead')}</p>
                <p className="welcome-modal-variety">
                  {t('welcomeModal.variety')}
                  <span className="welcome-modal-typologies-hint"> {t('welcomeModal.typologiesHint')}</span>
                </p>

                <Tooltip.Provider delayDuration={0} disableHoverableContent skipDelayDuration={0}>
                  <ul className="welcome-modal-typologies" aria-label={t('welcomeModal.typologiesLabel')}>
                    {TYPOLOGIES.map(typology => {
                      const label = t(`typology.${typology}`, { defaultValue: typology });

                      return (
                        <li key={typology} className="welcome-modal-typology">
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <button
                                type="button"
                                className="welcome-modal-typology-trigger"
                                aria-label={label}
                              >
                                <PinIcon
                                  name={TYPOLOGY_ICONS[typology] ?? DEFAULT_ICON}
                                  size={20}
                                  className="welcome-modal-typology-icon"
                                />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="pill-tooltip welcome-modal-typology-tooltip"
                                side="top"
                                sideOffset={6}
                                collisionPadding={12}
                              >
                                <p className="pill-tooltip-text">{label}</p>
                                <Tooltip.Arrow asChild>
                                  <span className="pill-tooltip-arrow">
                                    <span className="pill-tooltip-arrow-shape" aria-hidden="true" />
                                  </span>
                                </Tooltip.Arrow>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </li>
                      );
                    })}
                  </ul>
                </Tooltip.Provider>

                <p>{t('welcomeModal.access')}</p>
              </div>

              <footer className="welcome-modal-footer">
                <Dialog.Close type="button" className="pill active welcome-modal-dismiss">
                  {t('welcomeModal.dismiss')}
                </Dialog.Close>
                <p className="welcome-modal-disclaimer">
                  <Trans
                    i18nKey="welcomeModal.disclaimer"
                    components={{
                      officialLink: (
                        <a
                          className="welcome-modal-disclaimer-link"
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
