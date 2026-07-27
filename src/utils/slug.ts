import type { Shelter } from '../types';
import { shelterId } from './distance';

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function shelterSlug(shelter: Shelter): string {
  return slugify(shelter.name || shelterId(shelter));
}

export function shelterPath(shelter: Shelter): string {
  return `/refugi/${shelterSlug(shelter)}`;
}
