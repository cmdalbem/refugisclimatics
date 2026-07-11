import { useState, useCallback, useEffect } from 'react';
import type { LocationStatus } from '../types';

interface GeolocationState {
  location: [number, number] | null;
  status: LocationStatus;
  statusText: string;
  requestLocation: () => void;
}

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [statusText, setStatusText] = useState('Localitza\'t per ordenar per distància');

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

  // Auto-locate only when permission was granted previously — never trigger
  // the browser prompt on first visit (state "prompt").
  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions?.query) return;

    let cancelled = false;

    navigator.permissions
      .query({ name: 'geolocation' })
      .then(result => {
        if (cancelled) return;
        if (result.state === 'granted') {
          requestLocation();
        } else if (result.state === 'denied') {
          setStatus('error');
          setStatusText('Activa la ubicació per ordenar per distància');
        }
      })
      .catch(() => {
        // Permissions API unavailable — stay idle until the user taps the button.
      });

    return () => {
      cancelled = true;
    };
  }, [requestLocation]);

  return { location, status, statusText, requestLocation };
}
