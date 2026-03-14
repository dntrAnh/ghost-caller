'use client';

import { useEffect } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';

import { getAnchorPillLabel } from '@/lib/map-demo/mapHelpers';
import type { JourneyAnchor } from '@/types/mapDemo';

interface MapMarkersProps {
  map: MapLibreMap | null;
  anchors: JourneyAnchor[];
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
    ${
      anchor.sourceType === 'hotel' && anchor.nightlyRate
        ? `<span class="mt-1 block text-xs font-medium ${
            isStartSelected ? 'text-slate-200' : isDestinationSelected ? 'text-amber-700' : 'text-slate-400'
          }">$${anchor.nightlyRate}/night</span>`
        : ''
    }
  `;

  return element;
}

export function MapMarkers({
  map,
  anchors,
  selectedStartAnchorId,
  selectedDestinationAnchorId,
  candidateDestinationIds,
  onStartAnchorSelect,
}: MapMarkersProps) {
  useEffect(() => {
    if (!map) return;
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
      markers = anchorMarkers;
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
  ]);

  return null;
}
