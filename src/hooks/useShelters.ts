import { useEffect, useState } from 'react';
import type { Shelter } from '../types';
import sheltersUrl from '../../data/shelters.json?url';

export function useShelters() {
  const [shelters, setShelters] = useState<Shelter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(sheltersUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load shelters (${res.status})`);
        return res.json() as Promise<Shelter[]>;
      })
      .then(data => {
        if (!cancelled) setShelters(data);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shelters');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { shelters, loading: shelters === null && error === null, error };
}
