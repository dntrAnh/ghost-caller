'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  StyleSpecification,
} from 'maplibre-gl';

import {
  buildDiscoveryHalo,
  buildJourneyLineFeatureCollection,
} from '@/lib/map-demo/geojsonBuilder';
import {
  MAP_DEMO_CENTER,
  MAP_DEMO_SUBWAY_STATIONS,
} from '@/lib/map-demo/mockNycData';
import type { JourneyAnchor, JourneyLeg } from '@/types/mapDemo';

import { MapLegend } from './MapLegend';
import { MapMarkers } from './MapMarkers';

const DISCOVERY_SOURCE_ID = 'hotel-discovery-halo';
const JOURNEY_SOURCE_ID = 'journey-line';

interface MapCanvasProps {
  startAnchor: JourneyAnchor;
  destinationAnchor: JourneyAnchor | null;
  routeLegs: JourneyLeg[];
  allAnchors: JourneyAnchor[];
  candidateDestinationIds: string[];
  onStartAnchorSelect: (anchorId: string) => void;
}

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    },
    labels: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
    },
    {
      id: 'labels',
      type: 'raster',
      source: 'labels',
    },
  ],
};

export function MapCanvas({
  startAnchor,
  destinationAnchor,
  routeLegs,
  allAnchors,
  candidateDestinationIds,
  onStartAnchorSelect,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let instance: MapLibreMap | null = null;

    void import('maplibre-gl').then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      instance = new maplibregl.Map({
        container: containerRef.current,
        style: SATELLITE_STYLE,
        center: MAP_DEMO_CENTER,
        zoom: 13.2,
        minZoom: 11,
        maxZoom: 17.5,
        pitch: 32,
        bearing: -8,
        attributionControl: false,
      });

      instance.on('load', () => {
        if (!instance) return;

        instance.addSource(DISCOVERY_SOURCE_ID, {
          type: 'geojson',
          data: buildDiscoveryHalo(startAnchor.coordinates),
        });

        instance.addLayer({
          id: 'hotel-discovery-fill',
          type: 'fill',
          source: DISCOVERY_SOURCE_ID,
          paint: {
            'fill-color': '#22d3ee',
            'fill-opacity': 0.12,
          },
        });

        instance.addLayer({
          id: 'hotel-discovery-outline',
          type: 'line',
          source: DISCOVERY_SOURCE_ID,
          paint: {
            'line-color': '#dbeafe',
            'line-width': 2,
            'line-opacity': 0.85,
            'line-dasharray': [2, 2],
          },
        });

        instance.addSource(JOURNEY_SOURCE_ID, {
          type: 'geojson',
          data: buildJourneyLineFeatureCollection(routeLegs),
        });

        instance.addLayer({
          id: 'journey-line-shadow',
          type: 'line',
          source: JOURNEY_SOURCE_ID,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#020617',
            'line-width': 9,
            'line-opacity': 0.75,
          },
        });

        instance.addLayer({
          id: 'journey-line',
          type: 'line',
          source: JOURNEY_SOURCE_ID,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#67e8f9',
            'line-width': 5,
            'line-opacity': 0.95,
          },
        });
      });

      mapRef.current = instance;
      setMap(instance);
    });

    return () => {
      cancelled = true;

      if (instance) {
        instance.remove();
      }

      mapRef.current = null;
      setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = mapRef.current;
    mapInstance.flyTo({
      center: destinationAnchor?.coordinates ?? startAnchor.coordinates,
      zoom: 13.9,
      speed: 0.55,
      curve: 1.2,
      essential: true,
    });

    const source = mapInstance.getSource(DISCOVERY_SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      source.setData(buildDiscoveryHalo(startAnchor.coordinates));
    }

    const routeSource = mapInstance.getSource(JOURNEY_SOURCE_ID) as GeoJSONSource | undefined;
    if (routeSource) {
      routeSource.setData(buildJourneyLineFeatureCollection(routeLegs));
    }
  }, [destinationAnchor, routeLegs, startAnchor.coordinates]);

  return (
    <div className="relative h-[calc(100vh-3rem)] min-h-[720px] overflow-hidden rounded-[32px] border border-slate-200 bg-slate-200 shadow-[0_30px_120px_rgba(15,23,42,0.18)]">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/65 via-slate-950/20 to-transparent" />

      <div className="absolute left-5 top-5 z-10 max-w-sm rounded-[28px] border border-white/25 bg-slate-950/68 px-5 py-4 shadow-xl backdrop-blur-md">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300">
          Satellite Journey View
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
          {startAnchor.name}
        </h2>
        <p className="mt-1 text-sm text-slate-300">{startAnchor.neighborhood}</p>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          Satellite base with selectable anchors and a first direct leg for the future choose-your-own-adventure flow.
        </p>
      </div>

      <div className="absolute bottom-5 left-5 z-10">
        <MapLegend />
      </div>

      <div className="absolute bottom-5 right-5 z-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:-translate-y-0.5"
        >
          Zoom in
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:-translate-y-0.5"
        >
          Zoom out
        </button>
      </div>

      <MapMarkers
        map={map}
        anchors={allAnchors}
        stations={MAP_DEMO_SUBWAY_STATIONS}
        selectedStartAnchorId={startAnchor.id}
        selectedDestinationAnchorId={destinationAnchor?.id ?? null}
        candidateDestinationIds={candidateDestinationIds}
        onStartAnchorSelect={onStartAnchorSelect}
      />
    </div>
  );
}
