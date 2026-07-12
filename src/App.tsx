import { useCallback, useMemo, useRef, useState } from 'react';

import { APP_TITLE } from './constants';
import { useGeolocation } from './hooks/useGeolocation';
import { shelterId } from './utils/distance';
import type { Shelter } from './types';
import rawSheltersData from '../data/shelters.json';
import Sidebar from './components/Sidebar';
import DetailDrawer from './components/DetailDrawer';
import MapView, { type MapViewHandle } from './components/MapView';
import LanguageSwitcher from './components/LanguageSwitcher';

const shelters = rawSheltersData as Shelter[];

export default function App() {
  const { location: userLocation, status: locationStatus, statusText, requestLocation } =
    useGeolocation();

  const [activeShelterId, setActiveShelterId] = useState<string | null>(null);
  const [activeTypology, setActiveTypology] = useState('');

  const mapViewRef = useRef<MapViewHandle>(null);

  const activeShelter = useMemo(
    () => (activeShelterId ? (shelters.find(s => shelterId(s) === activeShelterId) ?? null) : null),
    [activeShelterId, shelters],
  );

  const openShelter = useCallback((shelter: Shelter) => {
    setActiveShelterId(shelterId(shelter));
  }, []);

  const closeShelter = useCallback(() => {
    setActiveShelterId(null);
  }, []);

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
          <img src="/logo.png" alt="" />
          <span>{APP_TITLE}</span>
        </div>
        <LanguageSwitcher variant="mobile" />
      </div>

      <Sidebar
        shelters={shelters}
        activeTypology={activeTypology}
        activeShelterId={activeShelterId}
        userLocation={userLocation}
        locationStatus={locationStatus}
        locationStatusText={statusText}
        onShelterClick={openShelter}
        onLocationButtonClick={handleLocationButtonClick}
      />

      <DetailDrawer
        shelter={activeShelter}
        userLocation={userLocation}
        onClose={closeShelter}
      />

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
    </div>
  );
}
