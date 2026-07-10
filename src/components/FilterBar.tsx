import { LayoutGrid } from 'lucide-react';
import type { Shelter } from '../types';
import { TYPOLOGY_ICONS, DEFAULT_ICON } from '../constants';
import { ICON_COMPONENTS } from '../utils/iconRegistry';

interface Props {
  shelters: Shelter[];
  activeTypology: string;
  onTypologyChange: (typology: string) => void;
}

export default function FilterBar({ shelters, activeTypology, onTypologyChange }: Props) {
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
    <div id="filter-bar">
      <ul id="typology-list">
        <li
          className={`pill${activeTypology === '' ? ' active' : ''}`}
          onClick={() => onTypologyChange('')}
        >
          <LayoutGrid size={15} />
          <span>Tots</span>
          <span className="pill-count">{mappable.length}</span>
        </li>
        {typologies.map(typology => {
          const iconName = TYPOLOGY_ICONS[typology] ?? DEFAULT_ICON;
          const Icon = ICON_COMPONENTS[iconName] ?? ICON_COMPONENTS[DEFAULT_ICON];
          return (
            <li
              key={typology}
              className={`pill${activeTypology === typology ? ' active' : ''}`}
              onClick={() => onTypologyChange(typology)}
            >
              {Icon && <Icon size={15} />}
              <span>{typology}</span>
              <span className="pill-count">{typologyCounts[typology]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
