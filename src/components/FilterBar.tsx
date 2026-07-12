import * as Tooltip from '@radix-ui/react-tooltip';
import type { Shelter } from '../types';
import { useTranslation } from 'react-i18next';
import { TYPOLOGY_ICONS, DEFAULT_ICON, microrefugisFaqUrl } from '../constants';
import PinIcon from './PinIcon';

const MICROREFUGIS_TYPOLOGY = 'Microrefugis';

interface Props {
  shelters: Shelter[];
  activeTypology: string;
  onTypologyChange: (typology: string) => void;
}

export default function FilterBar({ shelters, activeTypology, onTypologyChange }: Props) {
  const { t, i18n } = useTranslation();
  const mappable = shelters.filter(
    s => typeof s.lat === 'number' && typeof s.lon === 'number',
  );
  const typologyCounts: Record<string, number> = {};
  mappable.forEach(s => {
    if (s.typology) typologyCounts[s.typology] = (typologyCounts[s.typology] ?? 0) + 1;
  });
  const typologies = Object.keys(typologyCounts).sort(
    (a, b) => typologyCounts[b] - typologyCounts[a],
  );

  return (
    <Tooltip.Provider delayDuration={250}>
      <div id="filter-bar">
        <ul id="typology-list">
          <li
            className={`pill${activeTypology === '' ? ' active' : ''}`}
            onClick={() => onTypologyChange('')}
          >
            <span>{t('filterBar.all')}</span>
            <span className="pill-count">{mappable.length}</span>
          </li>
          {typologies.map(typology => {
            const iconName = TYPOLOGY_ICONS[typology] ?? DEFAULT_ICON;
            const isMicrorefugis = typology === MICROREFUGIS_TYPOLOGY;
            const isActive = activeTypology === typology;
            const pillClassName = `pill${isActive ? ' active' : ''}`;

            if (isMicrorefugis) {
              return (
                <Tooltip.Root key={typology}>
                  <Tooltip.Trigger asChild>
                    <li
                      className={pillClassName}
                      onClick={() => onTypologyChange(typology)}
                    >
                      <PinIcon name={iconName} size={15} />
                      <span>{t(`typology.${typology}`, { defaultValue: typology })}</span>
                      <span className="pill-info" aria-hidden="true">
                        i
                      </span>
                      <span className="pill-count">{typologyCounts[typology]}</span>
                    </li>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="pill-tooltip"
                      side="top"
                      sideOffset={8}
                      collisionPadding={12}
                    >
                      <p className="pill-tooltip-text">{t('typologyTooltip.microrefugis')}</p>
                      <a
                        className="pill-tooltip-link"
                        href={microrefugisFaqUrl(i18n.language)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('typologyTooltip.microrefugisFaqLink')}
                      </a>
                      <Tooltip.Arrow asChild>
                        <span className="pill-tooltip-arrow">
                          <span className="pill-tooltip-arrow-shape" aria-hidden="true" />
                        </span>
                      </Tooltip.Arrow>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            }

            return (
              <li
                key={typology}
                className={pillClassName}
                onClick={() => onTypologyChange(typology)}
              >
                <PinIcon name={iconName} size={15} />
                <span>{t(`typology.${typology}`, { defaultValue: typology })}</span>
                <span className="pill-count">{typologyCounts[typology]}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </Tooltip.Provider>
  );
}
