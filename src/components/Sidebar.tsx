import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { useTranslation } from 'react-i18next';
import type { Shelter } from '../types';
import type { LocationStatus } from '../types';
import { APP_TITLE } from '../constants';
import ShelterList from './ShelterList';
import LanguageSwitcher from './LanguageSwitcher';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  shelters: Shelter[];
  loading?: boolean;
  activeTypology: string;
  activeShelterId: string | null;
  userLocation: [number, number] | null;
  locationStatus: LocationStatus;
  locationStatusText: string;
  onLocationButtonClick: () => void;
}

// Must match --sheet-min / --sheet-peek / --sheet-sliver in index.css.
const SHEET_MIN_PX = 28;
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
  loading = false,
  activeTypology,
  activeShelterId,
  userLocation,
  locationStatus,
  locationStatusText,
  onLocationButtonClick,
}: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [snapPoints, setSnapPoints] = useState(computeSnapPoints);
  const [activeSnapPoint, setActiveSnapPoint] = useState<string | number | null>(
    () => `${SHEET_PEEK_PX}px`,
  );

  useEffect(() => {
    const onResize = () => setSnapPoints(computeSnapPoints());
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
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

  // When expanded, the list scrolls — but a downward pull at scroll-top should
  // collapse the sheet (vaul) instead of being eaten by the browser (modal={false}).
  useEffect(() => {
    if (!isMobile || !isSheetExpanded) return;
    const list = document.getElementById('shelter-list');
    if (!list) return;

    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y == null) return;
      if (list.scrollTop <= 0 && y - startY > 0) {
        e.preventDefault();
      }
    };

    list.addEventListener('touchstart', onTouchStart, { passive: true });
    list.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      list.removeEventListener('touchstart', onTouchStart);
      list.removeEventListener('touchmove', onTouchMove);
    };
  }, [isMobile, isSheetExpanded]);

  const content = (
    <>
      <header className="panel-header">
        <div className="logo-block">
          <div>
            <h1>{APP_TITLE}</h1>
            <p id="subtitle">{t('sidebar.subtitle')}</p>
            <LanguageSwitcher variant="on-gradient" />
          </div>
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
        loading={loading}
        activeTypology={activeTypology}
        activeShelterId={activeShelterId}
        userLocation={userLocation}
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
        scrollLockTimeout={100}
        snapPoints={snapPoints}
        fadeFromIndex={0}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
      >
        <Drawer.Content
          id="sidebar"
          className={isSheetExpanded ? 'sheet-expanded' : 'sheet-peek'}
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">{t('sidebar.listTitle')}</Drawer.Title>
          <Drawer.Handle className="sheet-handle" />
          {content}
        </Drawer.Content>
      </Drawer.Root>
    );
  }

  return <aside id="sidebar">{content}</aside>;
}
