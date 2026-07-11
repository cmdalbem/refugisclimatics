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

// Must match --sheet-min / --sheet-peek / --sheet-sliver in index.css.
const SHEET_MIN_PX = 32;
const SHEET_PEEK_PX = 240;
const SHEET_SLIVER_PX = 100;

function computeSnapPoints(): (string | number)[] {
  return [
    `${SHEET_MIN_PX}px`,
    `${SHEET_PEEK_PX}px`,
    `${window.innerHeight - SHEET_SLIVER_PX}px`,
  ];
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
  const [activeSnapPoint, setActiveSnapPoint] = useState<string | number | null>(
    () => `${SHEET_PEEK_PX}px`,
  );

  useEffect(() => {
    const onResize = () => setSnapPoints(computeSnapPoints());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const expandedSnapPoint = snapPoints[snapPoints.length - 1] ?? null;
  const isSheetExpanded = activeSnapPoint === expandedSnapPoint;

  useEffect(() => {
    if (!isMobile || activeSnapPoint == null) return;
    const px =
      typeof activeSnapPoint === 'number'
        ? activeSnapPoint
        : parseInt(String(activeSnapPoint), 10);
    if (!Number.isNaN(px)) {
      document.documentElement.style.setProperty('--sheet-visible', `${px}px`);
    }
  }, [isMobile, activeSnapPoint]);

  useEffect(() => {
    if (!isMobile || isSheetExpanded) return;
    document.getElementById('shelter-list')?.scrollTo(0, 0);
  }, [isMobile, isSheetExpanded]);

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
        autoFocus={false}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
      >
        <Drawer.Content
          id="sidebar"
          className={isSheetExpanded ? 'sheet-expanded' : 'sheet-peek'}
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">Llista de refugis climàtics</Drawer.Title>
          <Drawer.Handle className="sheet-handle" />
          {content}
        </Drawer.Content>
      </Drawer.Root>
    );
  }

  return <aside id="sidebar">{content}</aside>;
}
