'use client';

import { useCallback, useRef, useState } from 'react';

import type { JourneyLeg } from '@/types/mapDemo';
import type { MapOption } from '@/types/map-plan';

export type RoutePreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; leg: JourneyLeg }
  | { status: 'error'; message: string };

/** Build a straight-line fallback leg when the API is unavailable */
function buildStraightLeg(from: MapOption, to: MapOption): JourneyLeg {
  const fromCoords: [number, number] = [from.lng!, from.lat!];
  const toCoords: [number, number] = [to.lng!, to.lat!];

  const fromAnchor = {
    id: from.id,
    name: from.name,
    category: 'attraction' as const,
    coordinates: fromCoords,
    neighborhood: '',
    description: '',
    sourceType: 'place' as const,
  };

  const toAnchor = {
    id: to.id,
    name: to.name,
    category: 'attraction' as const,
    coordinates: toCoords,
    neighborhood: '',
    description: '',
    sourceType: 'place' as const,
  };

  return {
    id: `${from.id}__${to.id}`,
    from: fromAnchor,
    to: toAnchor,
    mode: 'direct',
    routeType: 'explore',
    estimatedMinutes: 0,
    distanceMeters: 0,
    geometry: [fromCoords, toCoords],
    segments: [
      {
        id: `segment-0`,
        mode: 'walking',
        label: 'Walk',
        instruction: `Walk to ${to.name}`,
        estimatedMinutes: 0,
        distanceMeters: 0,
        geometry: [fromCoords, toCoords],
      },
    ],
  };
}

export function useRoutePreview() {
  const [state, setState] = useState<RoutePreviewState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const requestRouteLeg = useCallback(async (from: MapOption, to: MapOption): Promise<JourneyLeg | null> => {
    // Both venues must have real coordinates
    if (!from.lat || !from.lng || !to.lat || !to.lng) {
      return null;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading' });

    try {
      const fromAnchor = {
        id: from.id,
        name: from.name,
        category: 'attraction' as const,
        coordinates: [from.lng, from.lat] as [number, number],
        neighborhood: '',
        description: '',
        sourceType: 'place' as const,
      };

      const toAnchor = {
        id: to.id,
        name: to.name,
        category: 'attraction' as const,
        coordinates: [to.lng, to.lat] as [number, number],
        neighborhood: '',
        description: '',
        sourceType: 'place' as const,
      };

      const response = await fetch('/api/map-demo/transit-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: fromAnchor,
          destination: toAnchor,
          routeType: 'explore',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Route API error ${response.status}`);
      }

      const data = (await response.json()) as { leg?: JourneyLeg; error?: string };

      if (!data.leg) {
        throw new Error(data.error ?? 'No route returned');
      }

      return controller.signal.aborted ? null : data.leg;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null;

      // Fall back to a straight-line leg so the map always has something to draw
      console.warn('[useRoutePreview] API failed, using straight-line fallback:', err);
      return abortRef.current?.signal.aborted ? null : buildStraightLeg(from, to);
    }
  }, []);

  const fetchRoute = useCallback(async (from: MapOption, to: MapOption) => {
    const leg = await requestRouteLeg(from, to);
    if (leg) {
      setState({ status: 'ready', leg });
    } else if (!abortRef.current?.signal.aborted) {
      setState({ status: 'idle' });
    }
  }, [requestRouteLeg]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle' });
  }, []);

  return { state, fetchRoute, requestRouteLeg, clear };
}
