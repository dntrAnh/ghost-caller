'use client';

import { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';

import { buildJourneySegmentFeatureCollection } from '@/lib/map-demo/geojsonBuilder';
import type { JourneyLeg } from '@/types/mapDemo';
import type { MapOption } from '@/types/map-plan';

// ─── Map style (reused from MapCanvas in map-demo) ────────────────────────────

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    },
    labels: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'satellite' },
    { id: 'labels', type: 'raster', source: 'labels' },
  ],
};

// ─── GeoJSON source IDs ────────────────────────────────────────────────────────

const CONFIRMED_SOURCE = 'itinerary-confirmed-route';
const PREVIEW_SOURCE = 'itinerary-preview-route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive a sensible initial center from venues that have coordinates */
function deriveCenterAndZoom(
  confirmedVenues: MapOption[],
  candidateOptions: MapOption[],
): { center: [number, number]; zoom: number } {
  const all = [...confirmedVenues, ...candidateOptions].filter((v) => v.lat && v.lng);

  if (all.length === 0) {
    // Default to NYC midtown
    return { center: [-73.9857, 40.7484], zoom: 13 };
  }

  const lngs = all.map((v) => v.lng!);
  const lats = all.map((v) => v.lat!);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    zoom: 13.5,
  };
}

/** Build a straight-line FeatureCollection for confirmed legs that have no segments yet */
function buildConfirmedGeoJSON(legs: JourneyLeg[]) {
  if (legs.length === 0) {
    return { type: 'FeatureCollection' as const, features: [] };
  }

  // Use segment-level data so subway/bus/walk get different colours
  return buildJourneySegmentFeatureCollection(legs);
}

/** Build a dashed preview FeatureCollection for the current candidate hover leg */
function buildPreviewGeoJSON(leg: JourneyLeg | null) {
  if (!leg) {
    return { type: 'FeatureCollection' as const, features: [] };
  }

  return buildJourneySegmentFeatureCollection([leg]);
}

// ─── Custom marker DOM nodes ───────────────────────────────────────────────────

function makeConfirmedMarkerEl(label: string, color: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'itinerary-marker-confirmed';
  el.style.cssText = `
    width: 36px; height: 36px;
    border-radius: 50%;
    background: ${color};
    border: 3px solid #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff;
    cursor: pointer;
    pointer-events: auto;
  `;
  el.textContent = label;
  return el;
}

function makeCandidateMarkerEl(label: string, color: string, isActive: boolean): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'itinerary-marker-candidate';
  el.style.cssText = `
    width: ${isActive ? '34px' : '28px'};
    height: ${isActive ? '34px' : '28px'};
    border-radius: 50%;
    background: ${color}${isActive ? '' : 'bb'};
    border: ${isActive ? '3px' : '2px'} solid ${isActive ? '#fff' : color + '80'};
    box-shadow: ${isActive ? '0 2px 16px rgba(0,0,0,0.5)' : '0 1px 6px rgba(0,0,0,0.25)'};
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
    cursor: pointer;
    pointer-events: auto;
    transition: all 0.15s ease;
  `;
  el.textContent = label;
  return el;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ItineraryMapCanvasProps {
  /** Venues the user has already confirmed (in order) */
  confirmedVenues: MapOption[];
  /** Route legs between confirmed venues */
  confirmedLegs: JourneyLeg[];
  /** Options for the current step */
  currentOptions: MapOption[];
  /** The option the user is hovering / previewing (shows dashed route) */
  previewOption: MapOption | null;
  /** The transit leg for the preview option (null while loading or not yet fetched) */
  previewLeg: JourneyLeg | null;
  /** Called when the user clicks a candidate marker */
  onCandidateClick: (option: MapOption) => void;
  /** Neighborhood label shown as a badge */
  neighborhood: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ItineraryMapCanvas({
  confirmedVenues,
  confirmedLegs,
  currentOptions,
  previewOption,
  previewLeg,
  onCandidateClick,
  neighborhood,
}: ItineraryMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Keep refs for markers so we can remove/re-add them without full map re-init
  const confirmedMarkerRefs = useRef<Array<{ marker: unknown; remove: () => void }>>([]);
  const candidateMarkerRefs = useRef<Array<{ marker: unknown; remove: () => void }>>([]);

  // ── 1. Initialise map once ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let instance: MapLibreMap | null = null;

    const { center, zoom } = deriveCenterAndZoom(confirmedVenues, currentOptions);

    void import('maplibre-gl').then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      instance = new maplibregl.Map({
        container: containerRef.current,
        style: SATELLITE_STYLE,
        center,
        zoom,
        minZoom: 10,
        maxZoom: 18,
        pitch: 28,
        bearing: -5,
        attributionControl: false,
      });

      instance.on('load', () => {
        if (!instance) return;

        // Confirmed route source + layers (solid violet by segment mode)
        instance.addSource(CONFIRMED_SOURCE, {
          type: 'geojson',
          data: buildConfirmedGeoJSON(confirmedLegs),
        });

        instance.addLayer({
          id: 'confirmed-shadow',
          type: 'line',
          source: CONFIRMED_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#020617',
            'line-width': 9,
            'line-opacity': 0.6,
          },
        });

        instance.addLayer({
          id: 'confirmed-line',
          type: 'line',
          source: CONFIRMED_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#7c3aed'],
            'line-width': 5,
            'line-opacity': 0.95,
          },
        });

        // Preview route source + layers (dashed fuchsia)
        instance.addSource(PREVIEW_SOURCE, {
          type: 'geojson',
          data: buildPreviewGeoJSON(previewLeg),
        });

        instance.addLayer({
          id: 'preview-shadow',
          type: 'line',
          source: PREVIEW_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#020617',
            'line-width': 8,
            'line-opacity': 0.4,
          },
        });

        instance.addLayer({
          id: 'preview-line',
          type: 'line',
          source: PREVIEW_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#e879f9',
            'line-width': 4,
            'line-opacity': 0.9,
            'line-dasharray': [2, 1.5],
          },
        });

        mapRef.current = instance;
        setMapReady(true);
      });
    });

    return () => {
      cancelled = true;
      instance?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Update confirmed route data when legs change ──────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const src = mapRef.current.getSource(CONFIRMED_SOURCE) as GeoJSONSource | undefined;
    src?.setData(buildConfirmedGeoJSON(confirmedLegs));
  }, [mapReady, confirmedLegs]);

  // ── 3. Update preview route data when previewLeg changes ────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const src = mapRef.current.getSource(PREVIEW_SOURCE) as GeoJSONSource | undefined;
    src?.setData(buildPreviewGeoJSON(previewLeg));
  }, [mapReady, previewLeg]);

  // ── 4. Sync confirmed venue markers ─────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Remove old confirmed markers
    for (const { remove } of confirmedMarkerRefs.current) remove();
    confirmedMarkerRefs.current = [];

    void import('maplibre-gl').then(({ default: maplibregl }) => {
      if (!mapRef.current) return;

      for (let i = 0; i < confirmedVenues.length; i++) {
        const v = confirmedVenues[i];
        if (!v.lat || !v.lng) continue;

        const el = makeConfirmedMarkerEl(String(i + 1), v.color);
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([v.lng, v.lat])
          .addTo(mapRef.current!);

        confirmedMarkerRefs.current.push({ marker, remove: () => marker.remove() });
      }
    });
  }, [mapReady, confirmedVenues]);

  // ── 5. Sync candidate markers ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Remove old candidate markers
    for (const { remove } of candidateMarkerRefs.current) remove();
    candidateMarkerRefs.current = [];

    void import('maplibre-gl').then(({ default: maplibregl }) => {
      if (!mapRef.current) return;

      for (let i = 0; i < currentOptions.length; i++) {
        const opt = currentOptions[i];
        if (!opt.lat || !opt.lng) continue;

        const isActive = previewOption?.id === opt.id;
        const label = String.fromCharCode(65 + i); // A, B, C …
        const el = makeCandidateMarkerEl(label, opt.color, isActive);

        el.addEventListener('click', () => onCandidateClick(opt));

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([opt.lng, opt.lat])
          .addTo(mapRef.current!);

        candidateMarkerRefs.current.push({ marker, remove: () => marker.remove() });
      }
    });
  }, [mapReady, currentOptions, previewOption, onCandidateClick]);

  // ── 6. Fly/fit to the right view when step changes ───────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const lastConfirmed = confirmedVenues[confirmedVenues.length - 1];

    if (!lastConfirmed || !previewOption) {
      // First step OR no preview: just centre on candidates
      const candidates = currentOptions.filter((o) => o.lat && o.lng);
      if (candidates.length === 0) return;

      const lngs = candidates.map((o) => o.lng!);
      const lats = candidates.map((o) => o.lat!);

      map.fitBounds(
        [
          [Math.min(...lngs) - 0.005, Math.min(...lats) - 0.003],
          [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.003],
        ],
        { padding: 80, duration: 900 },
      );
      return;
    }

    // Show last confirmed + preview option
    if (previewOption.lat && previewOption.lng && lastConfirmed.lat && lastConfirmed.lng) {
      const lngs = [lastConfirmed.lng, previewOption.lng];
      const lats = [lastConfirmed.lat, previewOption.lat];

      map.fitBounds(
        [
          [Math.min(...lngs) - 0.006, Math.min(...lats) - 0.004],
          [Math.max(...lngs) + 0.006, Math.max(...lats) + 0.004],
        ],
        { padding: 90, duration: 800 },
      );
    }
  }, [mapReady, confirmedVenues, previewOption, currentOptions]);

  // ── Cleanup candidate markers on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      for (const { remove } of confirmedMarkerRefs.current) remove();
      for (const { remove } of candidateMarkerRefs.current) remove();
    };
  }, []);

  return (
    <div className="relative h-[340px] overflow-hidden rounded-[28px] border border-slate-800 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.85)]">
      <div ref={containerRef} className="h-full w-full" />

      {/* Top gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/50 to-transparent" />

      {/* Neighborhood badge */}
      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
        {neighborhood}
      </div>

      {/* Loading overlay while route is being fetched */}
      {previewOption && !previewLeg && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
          Calculating route…
        </div>
      )}
    </div>
  );
}
