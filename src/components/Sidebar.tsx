import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import type { Shelter } from '../types';
import type { LocationStatus } from '../types';
import ShelterList from './ShelterList';
import { useIsMobile } from '../hooks/useIsMobile';

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

// Must match --sheet-peek / --sheet-sliver in index.css.
const SHEET_PEEK_PX = 240;
const SHEET_SLIVER_PX = 100;

function computeSnapPoints(): (string | number)[] {
  return [`${SHEET_PEEK_PX}px`, `${window.innerHeight - SHEET_SLIVER_PX}px`];
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
  const isMobile = useIsMobile();
  const [snapPoints, setSnapPoints] = useState(computeSnapPoints);
  const [activeSnapPoint, setActiveSnapPoint] = useState<string | number | null>(snapPoints[0]);

  useEffect(() => {
    const onResize = () => setSnapPoints(computeSnapPoints());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const content = (
    <>
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
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Root
        defaultOpen
        modal={false}
        dismissible={false}
        handleOnly
        autoFocus={false}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
      >
        <Drawer.Content id="sidebar" aria-describedby={undefined}>
          <Drawer.Title className="sr-only">Llista de refugis climàtics</Drawer.Title>
          <Drawer.Handle className="sheet-handle" />
          {content}
        </Drawer.Content>
      </Drawer.Root>
    );
  }

  return <aside id="sidebar">{content}</aside>;
}
