import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import { APP_PAGE_TITLE, APP_TITLE } from './constants';
import { useGeolocation } from './hooks/useGeolocation';
import { useIsMobile } from './hooks/useIsMobile';
import { useShelters } from './hooks/useShelters';
import { shelterId } from './utils/distance';
import { shelterPath, shelterSlug } from './utils/slug';
import type { Shelter } from './types';
import Sidebar from './components/Sidebar';
import DetailDrawer from './components/DetailDrawer';
import type { MapViewHandle } from './components/MapView';
import LanguageSwitcher from './components/LanguageSwitcher';

const MapView = lazy(() => import('./components/MapView'));

function AppShell() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { shelters, loading: sheltersLoading, error: sheltersError } = useShelters();
  const isMobile = useIsMobile();
  const [mapReady, setMapReady] = useState(false);

  const { location: userLocation, status: locationStatus, statusText, requestLocation } =
    useGeolocation();

  const [activeTypology, setActiveTypology] = useState('');

  const mapViewRef = useRef<MapViewHandle>(null);

  useEffect(() => {
    void import('./components/MapView');
  }, []);

  useEffect(() => {
    if (!shelters) return;
    if (!isMobile) {
      setMapReady(true);
      return;
    }
    const id = requestIdleCallback(() => setMapReady(true), { timeout: 1500 });
    return () => cancelIdleCallback(id);
  }, [shelters, isMobile]);

  const slugMap = useMemo(() => {
    const map = new Map<string, Shelter>();
    shelters?.forEach(s => map.set(shelterSlug(s), s));
    return map;
  }, [shelters]);

  const activeShelter = useMemo(
    () => (slug ? slugMap.get(slug) ?? null : null),
    [slug, slugMap],
  );

  const activeShelterId = activeShelter ? shelterId(activeShelter) : null;

  useEffect(() => {
    document.title = activeShelter
      ? `${activeShelter.name ?? APP_TITLE} — ${APP_TITLE}`
      : APP_PAGE_TITLE;
  }, [activeShelter]);

  const openShelter = useCallback(
    (shelter: Shelter) => {
      if (shelterSlug(shelter) !== slug) navigate(shelterPath(shelter));
    },
    [navigate, slug],
  );

  const closeShelter = useCallback(() => {
    if (slug) navigate('/');
  }, [navigate, slug]);

  const handleLocationButtonClick = useCallback(() => {
    if (userLocation) {
      mapViewRef.current?.flyToLocation(userLocation);
    } else {
      requestLocation();
    }
  }, [userLocation, requestLocation]);

  return (
    <div id="app" className={activeShelter ? 'drawer-open' : ''}>
      <div id="mobile-header">
        <div id="mobile-brand">
          <img src="/logo.png" alt="" width="32" height="32" />
          <span>{APP_TITLE}</span>
        </div>
        <LanguageSwitcher variant="mobile" />
      </div>

      {sheltersError ? (
        <p className="app-load-error">{sheltersError}</p>
      ) : (
        <>
          <Sidebar
            shelters={shelters ?? []}
            loading={sheltersLoading}
            activeTypology={activeTypology}
            activeShelterId={activeShelterId}
            userLocation={userLocation}
            locationStatus={locationStatus}
            locationStatusText={statusText}
            onLocationButtonClick={handleLocationButtonClick}
          />

          <DetailDrawer
            shelter={activeShelter}
            userLocation={userLocation}
            onClose={closeShelter}
          />

          <Suspense fallback={<main id="map-area" className="map-loading" aria-hidden="true" />}>
            {shelters && mapReady && (
              <MapView
                ref={mapViewRef}
                shelters={shelters}
                userLocation={userLocation}
                activeTypology={activeTypology}
                activeShelterId={activeShelterId}
                drawerOpen={!!activeShelter}
                locationStatus={locationStatus}
                locationStatusText={statusText}
                onLocationButtonClick={handleLocationButtonClick}
                onShelterClick={openShelter}
                onMapClick={closeShelter}
                onTypologyChange={setActiveTypology}
              />
            )}
          </Suspense>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />} />
      <Route path="/refugi/:slug" element={<AppShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
