'use client';

import { useEffect, useRef, useState } from 'react';

import { JourneyBuilder } from '@/components/map-demo/JourneyBuilder';
import { MapCanvas } from '@/components/map-demo/MapCanvas';
import { MapSidebar } from '@/components/map-demo/MapSidebar';
import { RouteSelector } from '@/components/map-demo/RouteSelector';
import {
  buildInitialJourneyState,
  getCandidateStops,
  getJourneyAnchorById,
  getJourneyStartAnchors,
} from '@/lib/map-demo/journeyPlanner';
import { getNearbyDiscoverySummary } from '@/lib/map-demo/mapHelpers';
import {
  MAP_DEMO_ATTRACTIONS,
  MAP_DEMO_HOTELS,
  MAP_DEMO_RESTAURANTS,
  MAP_DEMO_SUBWAY_STATIONS,
} from '@/lib/map-demo/mockNycData';
import { resolveTransitJourneyLeg } from '@/lib/map-demo/providers/googleTransit';
import { DEMO_ROUTE_OPTIONS } from '@/lib/map-demo/routeDefinitions';

export default function MapDemoPage() {
  const startAnchors = getJourneyStartAnchors();
  const requestAbortRef = useRef<AbortController | null>(null);
  const [journeyState, setJourneyState] = useState(() =>
    buildInitialJourneyState(startAnchors[1]?.id ?? startAnchors[0].id)
  );
  const [selectedRouteId, setSelectedRouteId] = useState(DEMO_ROUTE_OPTIONS[0].id);

  const startAnchor =
    getJourneyAnchorById(journeyState.startAnchorId) ??
    getJourneyAnchorById(startAnchors[0].id)!;
  const candidateStops = getCandidateStops(startAnchor, selectedRouteId);
  const destinationAnchor =
    (journeyState.destinationAnchorId
      ? getJourneyAnchorById(journeyState.destinationAnchorId)
      : null) ?? null;

  const activeHotel =
    MAP_DEMO_HOTELS.find((hotel) => hotel.id === startAnchor.id) ?? MAP_DEMO_HOTELS[1] ?? MAP_DEMO_HOTELS[0];

  const discovery = getNearbyDiscoverySummary(
    activeHotel,
    MAP_DEMO_SUBWAY_STATIONS,
    MAP_DEMO_RESTAURANTS,
    MAP_DEMO_ATTRACTIONS
  );

  const allAnchors = [
    ...startAnchors,
    ...candidateStops
      .map((stop) => stop.anchor)
      .filter((anchor, index, anchors) => anchors.findIndex((item) => item.id === anchor.id) === index),
  ];

  const handleStartAnchorSelect = (anchorId: string) => {
    requestAbortRef.current?.abort();
    setJourneyState(buildInitialJourneyState(anchorId));
  };

  const rerouteSelectedDestination = async () => {
    if (!destinationAnchor) return;

    requestAbortRef.current?.abort();
    const controller = new AbortController();
    requestAbortRef.current = controller;

    setJourneyState((current) => ({
      ...current,
      status: 'loading',
      errorMessage: null,
    }));

    try {
      const resolvedLeg = await resolveTransitJourneyLeg(
        startAnchor,
        destinationAnchor,
        selectedRouteId,
        controller.signal
      );

      setJourneyState((current) => ({
        ...current,
        destinationAnchorId: destinationAnchor.id,
        legs: [resolvedLeg],
        status: 'ready',
        errorMessage: null,
      }));
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setJourneyState((current) => ({
        ...current,
        destinationAnchorId: destinationAnchor.id,
        legs: [],
        status: 'error',
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unable to fetch transit directions.',
      }));
    }
  };

  const handleDestinationSelect = async (anchorId: string) => {
    const nextAnchor = getJourneyAnchorById(anchorId);
    if (!nextAnchor) return;

    requestAbortRef.current?.abort();
    const controller = new AbortController();
    requestAbortRef.current = controller;

    setJourneyState((current) => ({
      ...current,
      destinationAnchorId: nextAnchor.id,
      status: 'loading',
      errorMessage: null,
    }));

    try {
      const resolvedLeg = await resolveTransitJourneyLeg(
        startAnchor,
        nextAnchor,
        selectedRouteId,
        controller.signal
      );

      setJourneyState((current) => ({
        ...current,
        destinationAnchorId: nextAnchor.id,
        legs: [resolvedLeg],
        status: 'ready',
        errorMessage: null,
      }));
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setJourneyState((current) => ({
        ...current,
        destinationAnchorId: nextAnchor.id,
        legs: [],
        status: 'error',
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unable to fetch transit directions.',
      }));
    }
  };

  useEffect(() => {
    if (!destinationAnchor) return;

    const currentLeg = journeyState.legs[0];
    if (
      journeyState.status === 'loading' ||
      (currentLeg &&
        currentLeg.from.id === startAnchor.id &&
        currentLeg.to.id === destinationAnchor.id &&
        currentLeg.routeType === selectedRouteId &&
        currentLeg.mode === 'transit')
    ) {
      return;
    }

    void rerouteSelectedDestination();
  }, [
    destinationAnchor,
    journeyState.legs,
    journeyState.status,
    selectedRouteId,
    startAnchor.id,
  ]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.14),_transparent_35%),linear-gradient(180deg,_#f7fafc_0%,_#edf4ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6 xl:flex-row">
        <div className="w-full xl:max-w-[400px]">
          <div className="sticky top-6 flex flex-col gap-4">
            <JourneyBuilder
              startAnchors={startAnchors}
              selectedStartAnchorId={startAnchor.id}
              candidateStops={candidateStops}
              journeyState={journeyState}
              onStartAnchorSelect={handleStartAnchorSelect}
              onDestinationSelect={handleDestinationSelect}
            />
            <RouteSelector
              options={DEMO_ROUTE_OPTIONS}
              selectedRouteId={selectedRouteId}
              onSelect={setSelectedRouteId}
            />
            <MapSidebar
              routeOptions={DEMO_ROUTE_OPTIONS}
              selectedRouteId={selectedRouteId}
              discovery={discovery}
              startAnchor={startAnchor}
              destinationAnchor={destinationAnchor}
              journeyState={journeyState}
            />
          </div>
        </div>

        <section className="min-w-0 flex-1">
          <MapCanvas
            startAnchor={startAnchor}
            destinationAnchor={destinationAnchor}
            routeLegs={journeyState.legs}
            allAnchors={allAnchors}
            candidateDestinationIds={candidateStops.map((stop) => stop.anchor.id)}
            onStartAnchorSelect={handleStartAnchorSelect}
          />
        </section>
      </div>
    </main>
  );
}
