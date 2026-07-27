import {
  APP_PAGE_TITLE,
  APP_TITLE,
  DEFAULT_OG_IMAGE,
  META_DESCRIPTION,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_URL,
} from '../constants';
import type { Shelter } from '../types';
import { formatLocation } from './distance';
import { shelterPath } from './slug';

export interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
}

function setMetaAttr(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonicalUrl(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

function setOgImageDimensions(width?: number, height?: number) {
  const widthEl = document.querySelector('meta[property="og:image:width"]');
  const heightEl = document.querySelector('meta[property="og:image:height"]');

  if (width != null && height != null) {
    setMetaAttr('property', 'og:image:width', String(width));
    setMetaAttr('property', 'og:image:height', String(height));
    return;
  }

  widthEl?.remove();
  heightEl?.remove();
}

export function applyPageMeta(meta: PageMeta) {
  document.title = meta.title;
  setCanonicalUrl(meta.url);
  setMetaAttr('name', 'description', meta.description);
  setMetaAttr('property', 'og:title', meta.title);
  setMetaAttr('property', 'og:description', meta.description);
  setMetaAttr('property', 'og:url', meta.url);
  setMetaAttr('property', 'og:image', meta.image);
  setMetaAttr('name', 'twitter:title', meta.title);
  setMetaAttr('name', 'twitter:description', meta.description);
  setMetaAttr('name', 'twitter:image', meta.image);
  setOgImageDimensions(meta.imageWidth, meta.imageHeight);
}

export function homePageMeta(): PageMeta {
  return {
    title: APP_PAGE_TITLE,
    description: META_DESCRIPTION,
    url: `${SITE_URL}/`,
    image: DEFAULT_OG_IMAGE,
    imageWidth: OG_IMAGE_WIDTH,
    imageHeight: OG_IMAGE_HEIGHT,
  };
}

export function shelterPageMeta(shelter: Shelter): PageMeta {
  const name = shelter.name ?? APP_TITLE;
  const location = formatLocation(shelter);
  let description = `${name} — refugi climàtic a Barcelona.`;
  if (location) description += ` ${location}.`;
  description += ' Horaris, ubicació i com arribar-hi.';
  if (description.length > 160) description = `${description.slice(0, 157)}...`;

  const image = shelter.image_url?.trim() || DEFAULT_OG_IMAGE;
  const useDefaultImage = !shelter.image_url?.trim();

  return {
    title: `${name} — ${APP_TITLE}`,
    description,
    url: `${SITE_URL}${shelterPath(shelter)}`,
    image,
    ...(useDefaultImage
      ? { imageWidth: OG_IMAGE_WIDTH, imageHeight: OG_IMAGE_HEIGHT }
      : {}),
  };
}
