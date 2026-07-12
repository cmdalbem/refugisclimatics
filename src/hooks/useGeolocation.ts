import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { LocationStatus } from '../types';

type GeolocationErrorReason = 'unavailable' | 'denied' | null;

interface GeolocationState {
  location: [number, number] | null;
  status: LocationStatus;
  statusText: string;
  requestLocation: () => void;
}

export function useGeolocation(): GeolocationState {
  const { t } = useTranslation();
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [errorReason, setErrorReason] = useState<GeolocationErrorReason>(null);

  const statusText = useMemo(() => {
    switch (status) {
      case 'idle':
        return t('geolocation.idle');
      case 'loading':
        return t('geolocation.loading');
      case 'active':
        return accuracy !== null
          ? t('geolocation.activeWithAccuracy', { accuracy })
          : t('geolocation.activeNoAccuracy');
      case 'error':
        return errorReason === 'unavailable'
          ? t('geolocation.unavailable')
          : t('geolocation.denied');
      default:
        return t('geolocation.idle');
    }
  }, [status, accuracy, errorReason, t]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorReason('unavailable');
      return;
    }
    setStatus('loading');
    setErrorReason(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null);
        setStatus('active');
        setErrorReason(null);
      },
      () => {
        setStatus('error');
        setErrorReason('denied');
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
          setErrorReason('denied');
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
