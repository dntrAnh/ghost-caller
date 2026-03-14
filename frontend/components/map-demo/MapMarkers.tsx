'use client';

import { useEffect } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';

import {
  getAnchorPillLabel,
  getSubwayLineColor,
  haversineDistanceMiles,
} from '@/lib/map-demo/mapHelpers';
import type { JourneyAnchor, MapDemoSubwayStation } from '@/types/mapDemo';

interface MapMarkersProps {
  map: MapLibreMap | null;
  anchors: JourneyAnchor[];
  stations: MapDemoSubwayStation[];
  selectedStartAnchorId: string;
  selectedDestinationAnchorId: string | null;
  candidateDestinationIds: string[];
  onStartAnchorSelect: (anchorId: string) => void;
}

function createAnchorElement(
  anchor: JourneyAnchor,
  isStartSelected: boolean,
  isDestinationSelected: boolean,
  isCandidate: boolean
): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = [
    'group rounded-full border px-3 py-2 text-left shadow-lg backdrop-blur-md transition',
    isStartSelected
      ? 'border-cyan-300 bg-slate-950/92 text-white shadow-[0_12px_40px_rgba(8,145,178,0.35)]'
      : isDestinationSelected
        ? 'border-amber-300 bg-amber-50/96 text-slate-950 shadow-[0_12px_40px_rgba(245,158,11,0.28)]'
        : isCandidate
          ? 'border-emerald-200 bg-white/94 text-slate-900'
          : 'border-white/65 bg-slate-950/72 text-white',
  ].join(' ');

  element.innerHTML = `
    <span class="block text-[10px] font-semibold uppercase tracking-[0.28em] ${
      isStartSelected ? 'text-cyan-300' : isDestinationSelected ? 'text-amber-500' : 'text-slate-300'
    }">${getAnchorPillLabel(anchor)}</span>
    <span class="mt-0.5 block text-sm font-semibold leading-none">${anchor.name}</span>
  `;

  return element;
}

function createStationElement(station: MapDemoSubwayStation, isNearby: boolean): HTMLDivElement {
  const element = document.createElement('div');
  element.className = [
    'rounded-2xl border px-2 py-2 shadow-md backdrop-blur',
    isNearby
      ? 'border-sky-200 bg-white/95 ring-2 ring-sky-300/60'
      : 'border-white/70 bg-white/86',
  ].join(' ');

  const badges = station.servedLines
    .slice(0, 4)
    .map(
      (line) => `
        <span
          style="background:${getSubwayLineColor(line)}"
          class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
        >${line}</span>
      `
    )
    .join('');

  const overflow = station.servedLines.length > 4 ? `<span class="text-[10px] font-semibold text-slate-500">+${station.servedLines.length - 4}</span>` : '';

  element.innerHTML = `
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1">${badges}${overflow}</div>
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subway</p>
        <p class="text-xs font-semibold text-slate-900">${station.name}</p>
      </div>
    </div>
  `;

  return element;
}

export function MapMarkers({
  map,
  anchors,
  stations,
  selectedStartAnchorId,
  selectedDestinationAnchorId,
  candidateDestinationIds,
  onStartAnchorSelect,
}: MapMarkersProps) {
  useEffect(() => {
    if (!map) return;
    const activeStartAnchor = anchors.find((anchor) => anchor.id === selectedStartAnchorId);
    let disposed = false;
    let markers: Marker[] = [];

    void import('maplibre-gl').then(({ default: maplibregl }) => {
      if (disposed) return;

      const anchorMarkers: Marker[] = anchors.map((anchor) => {
        const marker = new maplibregl.Marker({
          element: createAnchorElement(
            anchor,
            anchor.id === selectedStartAnchorId,
            anchor.id === selectedDestinationAnchorId,
            candidateDestinationIds.includes(anchor.id)
          ),
          anchor: 'bottom',
          offset: [0, 8],
        })
          .setLngLat(anchor.coordinates)
          .addTo(map);

        marker.getElement().addEventListener('click', () => onStartAnchorSelect(anchor.id));

        return marker;
      });

      const stationMarkers: Marker[] = stations.map((station) => {
        const isNearby =
          activeStartAnchor != null &&
          haversineDistanceMiles(station.coordinates, activeStartAnchor.coordinates) <= 0.6;

        return new maplibregl.Marker({
          element: createStationElement(station, isNearby),
          anchor: 'center',
        })
          .setLngLat(station.coordinates)
          .addTo(map);
      });

      markers = [...anchorMarkers, ...stationMarkers];
    });

    return () => {
      disposed = true;

      for (const marker of markers) {
        marker.remove();
      }
    };
  }, [
    anchors,
    candidateDestinationIds,
    map,
    onStartAnchorSelect,
    selectedDestinationAnchorId,
    selectedStartAnchorId,
    stations,
  ]);

  return null;
}
