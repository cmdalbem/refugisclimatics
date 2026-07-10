import type { Shelter } from '../types';
import type { LocationStatus } from '../types';
import ShelterList from './ShelterList';

interface Props {
  shelters: Shelter[];
  activeTypology: string;
  activeShelterId: string | null;
  userLocation: [number, number] | null;
  locationStatus: LocationStatus;
  locationStatusText: string;
  onShelterClick: (shelter: Shelter) => void;
  onLocationButtonClick: () => void;
}

export default function Sidebar({
  shelters,
  activeTypology,
  activeShelterId,
  userLocation,
  locationStatus,
  locationStatusText,
  onShelterClick,
  onLocationButtonClick,
}: Props) {
  return (
    <aside id="sidebar">
      <header className="panel-header">
        <div className="logo-block">
          <h1>Refugis Climàtics</h1>
          <p id="subtitle">Refugis urbans per protegir-se de la calor.</p>
        </div>
      </header>

      <button
        type="button"
        className={`list-status status-${locationStatus}`}
        onClick={onLocationButtonClick}
      >
        {locationStatusText}
      </button>

      <ShelterList
        shelters={shelters}
        activeTypology={activeTypology}
        activeShelterId={activeShelterId}
        userLocation={userLocation}
        onShelterClick={onShelterClick}
      />
    </aside>
  );
}
