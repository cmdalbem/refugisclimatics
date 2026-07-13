import {
  APP_TITLE,
  META_DESCRIPTION,
  SITE_URL,
} from '../constants';
import type { Shelter } from '../types';
import { shelterPath } from './slug';

const SCRIPT_ID = 'jsonld-page';

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: APP_TITLE,
    description: META_DESCRIPTION,
    inLanguage: 'ca',
  };
}

function itemListNode(shelters: Shelter[]) {
  const items = shelters.filter(
    shelter => typeof shelter.lat === 'number' && typeof shelter.lon === 'number',
  );

  return {
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#shelter-list`,
    name: 'Refugis climàtics de Barcelona',
    numberOfItems: items.length,
    itemListElement: items.map((shelter, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: shelter.name,
      url: `${SITE_URL}${shelterPath(shelter)}`,
    })),
  };
}

function placeNode(shelter: Shelter) {
  const name = shelter.name ?? APP_TITLE;
  const url = `${SITE_URL}${shelterPath(shelter)}`;
  let description = `${name} — refugi climàtic a Barcelona.`;

  if (shelter.opening_hours_raw?.length) {
    const hoursText = shelter.opening_hours_raw
      .map(([period, days, hours]) => [period, days, hours].filter(Boolean).join(': '))
      .join('; ');
    if (hoursText) description += ` Horaris: ${hoursText}`;
  }

  const place: Record<string, unknown> = {
    '@type': 'Place',
    '@id': `${url}#place`,
    name,
    url,
    description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };

  const image = shelter.image_url?.trim();
  if (image) place.image = image;

  if (typeof shelter.lat === 'number' && typeof shelter.lon === 'number') {
    place.geo = {
      '@type': 'GeoCoordinates',
      latitude: shelter.lat,
      longitude: shelter.lon,
    };
  }

  const address: Record<string, string> = {
    addressLocality: 'Barcelona',
    addressCountry: 'ES',
  };
  if (shelter.address) address.streetAddress = shelter.address;
  if (shelter.neighborhood) address.addressNeighborhood = shelter.neighborhood;
  if (shelter.district) address.addressRegion = shelter.district;

  if (shelter.address || shelter.neighborhood || shelter.district) {
    place.address = { '@type': 'PostalAddress', ...address };
  }

  return place;
}

function setJsonLd(data: object) {
  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  document.getElementById(SCRIPT_ID)?.remove();
}

export function applyStructuredData(
  shelters: Shelter[] | null,
  activeShelter: Shelter | null,
) {
  if (!shelters) {
    removeJsonLd();
    return;
  }

  const graph = [websiteNode(), activeShelter ? placeNode(activeShelter) : itemListNode(shelters)];

  setJsonLd({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}
