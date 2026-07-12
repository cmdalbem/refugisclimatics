import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type MutableRefObject,
} from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { Shelter } from '../types';
import type { LocationStatus } from '../types';
import {
  MAPBOX_TOKEN,
  MAP_STYLE,
  MAP_BASEMAP_IMPORT_ID,
  mapBasemapConfigForTheme,
  mapCustomAttribution,
  MAP_CENTER,
  MAP_ZOOM,
  LABEL_ZOOM_THRESHOLD,
  MAP_FLY_PADDING,
  MAP_FLY_PADDING_MOBILE_DRAWER,
  DRAWER_TRANSITION_MS,
  TYPOLOGY_ICONS,
  DEFAULT_ICON,
  DEFAULT_MARKER_COLOR,
} from '../constants';
import { distanceColor, shelterGradientKm, shelterId } from '../utils/distance';
import { buildDisplayCoordinateMap } from '../utils/displayCoordinates';
import { markerImageId, ensureMarkerImages, getMapThemeColors } from '../utils/markers';
import { getCurrentTheme, useTheme } from '../hooks/useTheme';
import { useIsMobile } from '../hooks/useIsMobile';
import FilterBar from './FilterBar';
import MapLocationButton from './MapLocationButton';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface Props {
  shelters: Shelter[];
  userLocation: [number, number] | null;
  activeTypology: string;
  activeShelterId: string | null;
  drawerOpen: boolean;
  locationStatus: LocationStatus;
  locationStatusText: string;
  onLocationButtonClick: () => void;
  onShelterClick: (shelter: Shelter) => void;
  onMapClick: () => void;
  onTypologyChange: (typology: string) => void;
}

/** Space above the peeking sheet taken by map controls (location btn + filter bar + gaps). */
const MOBILE_MAP_CONTROLS_OFFSET = 12 + 44 + 8 + 44 + 16;

function getSheetVisiblePx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--sheet-visible').trim();
  const px = parseInt(raw, 10);
  return Number.isNaN(px) ? 240 : px;
}

function getMapFlyPadding(isMobile: boolean): mapboxgl.PaddingOptions {
  if (!isMobile) return MAP_FLY_PADDING;

  const sheetPx = getSheetVisiblePx();
  return {
    ...MAP_FLY_PADDING_MOBILE_DRAWER,
    bottom: sheetPx + MOBILE_MAP_CONTROLS_OFFSET,
  };
}

function flyMapTo(
  map: mapboxgl.Map,
  center: [number, number],
  zoom: number,
  isMobile: boolean,
) {
  map.resize();
  map.flyTo({
    center,
    zoom,
    padding: getMapFlyPadding(isMobile),
    essential: true,
  });
}

export interface MapViewHandle {
  flyToLocation: (loc: [number, number]) => void;
}

function shelterMarkerColor(shelter: Shelter, userLocation: [number, number] | null): string {
  const km = shelterGradientKm(shelter, userLocation);
  if (km === null) return DEFAULT_MARKER_COLOR;
  return distanceColor(km);
}

interface FeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: Record<string, string>;
  }>;
}

function buildUserLocationGeoJSON(location: [number, number] | null): FeatureCollection {
  if (!location) return { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: location },
        properties: {},
      },
    ],
  };
}

function applyMapTheme(map: mapboxgl.Map) {
  const { markerStroke, labelHalo, userCore, userStroke, userHaloOpacity } = getMapThemeColors();

  if (map.getLayer('shelter-marker-highlight')) {
    map.setPaintProperty('shelter-marker-highlight', 'circle-stroke-color', markerStroke);
  }
  if (map.getLayer('shelter-markers')) {
    map.setPaintProperty('shelter-markers', 'icon-halo-color', markerStroke);
  }
  if (map.getLayer('shelter-labels')) {
    map.setPaintProperty('shelter-labels', 'text-halo-color', labelHalo);
  }
  if (map.getLayer('user-location-halo')) {
    map.setPaintProperty('user-location-halo', 'circle-color', userCore);
    map.setPaintProperty('user-location-halo', 'circle-opacity', userHaloOpacity);
    map.setPaintProperty('user-location-halo', 'circle-emissive-strength', 1);
  }
  if (map.getLayer('user-location-dot')) {
    map.setPaintProperty('user-location-dot', 'circle-color', userCore);
    map.setPaintProperty('user-location-dot', 'circle-stroke-color', userStroke);
    map.setPaintProperty('user-location-dot', 'circle-emissive-strength', 1);
  }
}

function setupUserLocation(map: mapboxgl.Map, location: [number, number] | null) {
  const { userCore, userStroke, userHaloOpacity } = getMapThemeColors();

  map.addSource('user-location', {
    type: 'geojson',
    data: buildUserLocationGeoJSON(location),
  });

  map.addLayer({
    id: 'user-location-halo',
    type: 'circle',
    source: 'user-location',
    paint: {
      'circle-radius': 14,
      'circle-color': userCore,
      'circle-opacity': userHaloOpacity,
      'circle-emissive-strength': 1,
      'circle-stroke-width': 0,
    },
  });

  map.addLayer({
    id: 'user-location-dot',
    type: 'circle',
    source: 'user-location',
    paint: {
      'circle-radius': 6,
      'circle-color': userCore,
      'circle-stroke-width': 2,
      'circle-stroke-color': userStroke,
      'circle-emissive-strength': 1,
    },
  });
}

function setShelterFeatureState(
  map: mapboxgl.Map,
  id: string | null,
  state: Record<string, boolean>,
) {
  if (!id || !map.getSource('shelters')) return;
  try {
    map.setFeatureState({ source: 'shelters', id }, state);
  } catch {
    // Feature may not be loaded yet.
  }
}

function applySelectedShelterState(map: mapboxgl.Map, shelterKey: string | null, previousKey: string | null) {
  if (previousKey) setShelterFeatureState(map, previousKey, { selected: false });
  if (shelterKey) setShelterFeatureState(map, shelterKey, { selected: true });
}

function applyHoveredShelterState(map: mapboxgl.Map, shelterKey: string | null, previousKey: string | null) {
  if (previousKey) setShelterFeatureState(map, previousKey, { hover: false });
  if (shelterKey) setShelterFeatureState(map, shelterKey, { hover: true });
}

function buildGeoJSON(
  shelters: Shelter[],
  userLocation: [number, number] | null,
  noName: string,
): FeatureCollection {
  const displayCoords = buildDisplayCoordinateMap(shelters);

  return {
    type: 'FeatureCollection',
    features: shelters
      .filter(s => typeof s.lat === 'number' && typeof s.lon === 'number')
      .map(s => {
        const icon = TYPOLOGY_ICONS[s.typology ?? ''] ?? DEFAULT_ICON;
        const color = shelterMarkerColor(s, userLocation);
        const coordinates = displayCoords.get(shelterId(s)) ?? [s.lon!, s.lat!];
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates },
          properties: {
            name: s.name ?? noName,
            typology: s.typology ?? '',
            marker_image: markerImageId(icon, color),
            marker_color: color,
            shelter_key: shelterId(s),
          },
        };
      }),
  };
}

function buildMarkerCombos(
  shelters: Shelter[],
  userLocation: [number, number] | null,
): Map<string, { icon: string; color: string }> {
  const combos = new Map<string, { icon: string; color: string }>();
  shelters.forEach(s => {
    if (typeof s.lat !== 'number' || typeof s.lon !== 'number') return;
    const icon = TYPOLOGY_ICONS[s.typology ?? ''] ?? DEFAULT_ICON;
    const color = shelterMarkerColor(s, userLocation);
    combos.set(markerImageId(icon, color), { icon, color });
  });
  return combos;
}

const SHELTER_INTERACTIVE_LAYERS = ['shelter-markers', 'shelter-labels'] as const;

async function setupMapSources(
  map: mapboxgl.Map,
  shelters: Shelter[],
  userLocation: [number, number] | null,
  noName: string,
) {
  const { markerStroke, labelHalo } = getMapThemeColors();

  await ensureMarkerImages(map, buildMarkerCombos(shelters, userLocation));

  map.addSource('shelters', {
    type: 'geojson',
    data: buildGeoJSON(shelters, userLocation, noName),
    promoteId: 'shelter_key',
  });

  map.addLayer({
    id: 'shelter-marker-highlight',
    type: 'circle',
    source: 'shelters',
    paint: {
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        20,
        ['boolean', ['feature-state', 'hover'], false],
        17,
        0,
      ],
      'circle-color': ['get', 'marker_color'],
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.22,
        ['boolean', ['feature-state', 'hover'], false],
        0.14,
        0,
      ],
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        2,
        ['boolean', ['feature-state', 'hover'], false],
        1.5,
        0,
      ],
      'circle-stroke-color': markerStroke,
      'circle-stroke-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.9,
        ['boolean', ['feature-state', 'hover'], false],
        0.55,
        0,
      ],
    },
  });

  map.addLayer({
    id: 'shelter-markers',
    type: 'symbol',
    source: 'shelters',
    layout: {
      'icon-image': ['get', 'marker_image'],
      'icon-size': 1,
      'icon-allow-overlap': ['step', ['zoom'], false, LABEL_ZOOM_THRESHOLD, true],
      'icon-padding': 0,
    },
    paint: {
      'icon-halo-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        3,
        ['boolean', ['feature-state', 'hover'], false],
        2,
        0,
      ],
      'icon-halo-color': markerStroke,
    },
  });

  map.addLayer({
    id: 'shelter-labels',
    type: 'symbol',
    source: 'shelters',
    minzoom: LABEL_ZOOM_THRESHOLD,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 1.5,
      'text-justify': 'auto',
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-color': ['get', 'marker_color'],
      'text-halo-color': labelHalo,
      'text-halo-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        3,
        ['boolean', ['feature-state', 'hover'], false],
        2.5,
        2,
      ],
    },
  });

  setupUserLocation(map, userLocation);
}

function bindShelterLayerClicks(
  map: mapboxgl.Map,
  onShelterClickRef: MutableRefObject<(shelter: Shelter) => void>,
  sheltersRef: MutableRefObject<Shelter[]>,
) {
  const handleShelterFeatureClick = (
    e: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] },
  ) => {
    const shelterKey = e.features?.[0]?.properties?.shelter_key;
    const shelter = sheltersRef.current.find(s => shelterId(s) === shelterKey);
    if (shelter) onShelterClickRef.current(shelter);
  };

  SHELTER_INTERACTIVE_LAYERS.forEach(layer => {
    map.on('click', layer, handleShelterFeatureClick);
  });
}

async function refreshShelterMarkers(
  map: mapboxgl.Map,
  shelters: Shelter[],
  userLocation: [number, number] | null,
  noName: string,
) {
  const source = map.getSource('shelters') as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;

  await ensureMarkerImages(map, buildMarkerCombos(shelters, userLocation));
  source.setData(buildGeoJSON(shelters, userLocation, noName));
}

async function syncMapTheme(
  map: mapboxgl.Map,
  theme: 'light' | 'dark',
  shelters: Shelter[],
  userLocation: [number, number] | null,
  noName: string,
) {
  const { lightPreset, theme: colorTheme } = mapBasemapConfigForTheme(theme);
  map.setConfigProperty(MAP_BASEMAP_IMPORT_ID, 'lightPreset', lightPreset);
  map.setConfigProperty(MAP_BASEMAP_IMPORT_ID, 'theme', colorTheme);
  await refreshShelterMarkers(map, shelters, userLocation, noName);
  applyMapTheme(map);
}

function applyTypologyFilter(map: mapboxgl.Map, activeTypology: string) {
  if (!map.getLayer('shelter-markers')) return;
  const filter = activeTypology ? ['==', ['get', 'typology'], activeTypology] : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.setFilter('shelter-marker-highlight', filter as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.setFilter('shelter-markers', filter as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.setFilter('shelter-labels', filter as any);
}

const MapView = forwardRef<MapViewHandle, Props>(function MapView(
  {
    shelters,
    userLocation,
    activeTypology,
    activeShelterId,
    drawerOpen,
    locationStatus,
    locationStatusText,
    onLocationButtonClick,
    onShelterClick,
    onMapClick,
    onTypologyChange,
  },
  ref,
) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const noName = t('shelterList.noName');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const attributionControlRef = useRef<mapboxgl.AttributionControl | null>(null);
  const mapContentReadyRef = useRef(false);
  const prevThemeRef = useRef(theme);
  const activeTypologyRef = useRef(activeTypology);

  // Keep latest values accessible in stable event listeners without re-binding
  const sheltersRef = useRef(shelters);
  const userLocationRef = useRef(userLocation);
  const onShelterClickRef = useRef(onShelterClick);
  const onMapClickRef = useRef(onMapClick);
  const activeShelterIdRef = useRef(activeShelterId);
  const hoveredShelterKeyRef = useRef<string | null>(null);
  const selectedShelterKeyRef = useRef<string | null>(null);
  const prevDrawerOpenRef = useRef(drawerOpen);
  const hasCenteredOnUserRef = useRef(false);

  sheltersRef.current = shelters;
  userLocationRef.current = userLocation;
  onShelterClickRef.current = onShelterClick;
  onMapClickRef.current = onMapClick;
  activeShelterIdRef.current = activeShelterId;
  activeTypologyRef.current = activeTypology;

  const syncMapContent = async (map: mapboxgl.Map) => {
    await setupMapSources(map, sheltersRef.current, userLocationRef.current, noName);
    bindShelterLayerClicks(map, onShelterClickRef, sheltersRef);
    applyTypologyFilter(map, activeTypologyRef.current);
    applySelectedShelterState(map, activeShelterIdRef.current, null);
    selectedShelterKeyRef.current = activeShelterIdRef.current;
    applyHoveredShelterState(map, hoveredShelterKeyRef.current, null);
    mapContentReadyRef.current = true;
  };

  const centerMapOnUser = (map: mapboxgl.Map, location: [number, number]) => {
    if (hasCenteredOnUserRef.current) return;
    hasCenteredOnUserRef.current = true;
    flyMapTo(map, location, Math.max(map.getZoom(), 14), isMobile);
  };

  useImperativeHandle(ref, () => ({
    flyToLocation(loc) {
      const map = mapRef.current;
      if (!map) return;
      flyMapTo(map, loc, Math.max(map.getZoom(), 14), isMobile);
    },
  }), [isMobile]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      config: {
        [MAP_BASEMAP_IMPORT_ID]: mapBasemapConfigForTheme(getCurrentTheme()),
      },
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      attributionControl: false,
    });
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    map.on('load', () => {
      void syncMapContent(map).then(() => {
        const currentLocation = userLocationRef.current;
        if (currentLocation) centerMapOnUser(map, currentLocation);
      });
    });

    map.on('mousemove', e => {
      if (!map.getLayer('shelter-markers')) return;
      const features = map.queryRenderedFeatures(e.point, { layers: [...SHELTER_INTERACTIVE_LAYERS] });
      const nextKey = (features[0]?.properties?.shelter_key as string | undefined) ?? null;
      if (nextKey === hoveredShelterKeyRef.current) return;

      applyHoveredShelterState(map, nextKey, hoveredShelterKeyRef.current);
      hoveredShelterKeyRef.current = nextKey;
      map.getCanvas().style.cursor = nextKey ? 'pointer' : '';
    });

    map.on('mouseleave', () => {
      applyHoveredShelterState(map, null, hoveredShelterKeyRef.current);
      hoveredShelterKeyRef.current = null;
      map.getCanvas().style.cursor = '';
    });

    map.on('click', e => {
      const onShelter = map.queryRenderedFeatures(e.point, { layers: [...SHELTER_INTERACTIVE_LAYERS] }).length;
      if (!onShelter) onMapClickRef.current();
    });

    return () => {
      resizeObserver.disconnect();
      if (attributionControlRef.current && mapRef.current === map) {
        try {
          map.removeControl(attributionControlRef.current);
        } catch {
          // Control may already be removed during HMR.
        }
        attributionControlRef.current = null;
      }
      mapRef.current = null;
      map.remove();
      mapContentReadyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || prevThemeRef.current === theme) return;

    prevThemeRef.current = theme;

    const run = () => {
      void syncMapTheme(
        map,
        theme,
        sheltersRef.current,
        userLocationRef.current,
        noName,
      ).then(() => {
        applySelectedShelterState(map, activeShelterIdRef.current, null);
        selectedShelterKeyRef.current = activeShelterIdRef.current;
        applyHoveredShelterState(map, hoveredShelterKeyRef.current, null);
      });
    };

    if (map.isStyleLoaded()) {
      run();
    } else {
      map.once('style.load', run);
    }

    return () => {
      if (mapRef.current !== map) return;
      map.off('style.load', run);
    };
  }, [theme, noName]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncAttribution = () => {
      if (attributionControlRef.current) {
        map.removeControl(attributionControlRef.current);
      }
      const control = new mapboxgl.AttributionControl({
        customAttribution: mapCustomAttribution(t('map.attribution')),
      });
      map.addControl(control, 'bottom-right');
      attributionControlRef.current = control;
    };

    if (map.isStyleLoaded()) {
      syncAttribution();
    } else {
      map.once('load', syncAttribution);
    }

    return () => {
      if (mapRef.current !== map) {
        attributionControlRef.current = null;
        return;
      }
      map.off('load', syncAttribution);
      if (attributionControlRef.current) {
        map.removeControl(attributionControlRef.current);
        attributionControlRef.current = null;
      }
    };
  }, [t, i18n.language]);

  // Refresh GeoJSON when shelters, user location, or labels change
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource('shelters') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    void refreshShelterMarkers(map!, shelters, userLocation, noName).then(() => {
      selectedShelterKeyRef.current = null;
      applySelectedShelterState(map!, activeShelterIdRef.current, null);
      selectedShelterKeyRef.current = activeShelterIdRef.current;
      applyHoveredShelterState(map!, hoveredShelterKeyRef.current, null);
    });
  }, [shelters, userLocation, noName]);

  // Highlight selected shelter on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource('shelters')) return;
    applySelectedShelterState(map, activeShelterId, selectedShelterKeyRef.current);
    selectedShelterKeyRef.current = activeShelterId;
  }, [activeShelterId]);

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource('user-location') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(buildUserLocationGeoJSON(userLocation));
  }, [userLocation]);

  // Center on user once geolocation resolves (often after map init)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation || hasCenteredOnUserRef.current) return;

    const center = () => centerMapOnUser(map, userLocation);
    if (map.isStyleLoaded()) {
      center();
    } else {
      map.once('load', center);
    }

    return () => {
      if (mapRef.current !== map) return;
      map.off('load', center);
    };
  }, [userLocation]);

  // Update layer filter when active typology changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyTypologyFilter(map, activeTypology);
  }, [activeTypology]);

  // Fly to newly selected shelter after layout settles
  useEffect(() => {
    if (!activeShelterId) {
      prevDrawerOpenRef.current = false;
      return;
    }

    const map = mapRef.current;
    const shelter = shelters.find(s => shelterId(s) === activeShelterId);
    if (!map || !shelter || typeof shelter.lon !== 'number' || typeof shelter.lat !== 'number') return;

    const center: [number, number] = [shelter.lon, shelter.lat];
    const zoom = Math.max(map.getZoom(), 16);
    const drawerJustOpened = drawerOpen && !prevDrawerOpenRef.current;
    prevDrawerOpenRef.current = drawerOpen;

    let cancelled = false;
    const run = () => {
      if (!cancelled) flyMapTo(map, center, zoom, isMobile);
    };

    if (drawerJustOpened) {
      const timer = window.setTimeout(run, DRAWER_TRANSITION_MS);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    const frame = requestAnimationFrame(() => requestAnimationFrame(run));
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [activeShelterId, shelters, drawerOpen, isMobile]);

  return (
    <main id="map-area">
      <div ref={containerRef} id="map" />
      <div id="map-controls">
        <MapLocationButton
          status={locationStatus}
          statusText={locationStatusText}
          onClick={onLocationButtonClick}
        />
        <FilterBar
          shelters={shelters}
          activeTypology={activeTypology}
          onTypologyChange={onTypologyChange}
        />
      </div>
    </main>
  );
});

export default MapView;
