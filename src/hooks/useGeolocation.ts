import { useState, useEffect, useCallback } from 'react';
import type { LocationStatus } from '../types';

interface GeolocationState {
  location: [number, number] | null;
  status: LocationStatus;
  statusText: string;
  requestLocation: () => void;
}

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [statusText, setStatusText] = useState('Localitzant-te...');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setStatusText('Geolocalització no disponible');
      return;
    }
    setStatus('loading');
    setStatusText('Localitzant-te...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation([pos.coords.longitude, pos.coords.latitude]);
        const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
        setStatus('active');
        setStatusText(
          accuracy ? `Ubicat · precisió ${accuracy} m` : 'Ubicat · ordenats per distància',
        );
      },
      () => {
        setStatus('error');
        setStatusText('Activa la ubicació per ordenar per distància');
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { location, status, statusText, requestLocation };
}
