'use client';

import { useEffect, useState } from 'react';

import { JourneyBuilder } from '@/components/map-demo/JourneyBuilder';
import { MapCanvas } from '@/components/map-demo/MapCanvas';
import { MapSidebar } from '@/components/map-demo/MapSidebar';
import { RouteSelector } from '@/components/map-demo/RouteSelector';
import {
  buildInitialJourneyState,
  buildJourneyLeg,
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
import { DEMO_ROUTE_OPTIONS } from '@/lib/map-demo/routeDefinitions';

export default function MapDemoPage() {
  const startAnchors = getJourneyStartAnchors();
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
    setJourneyState(buildInitialJourneyState(anchorId));
  };

  const handleDestinationSelect = (anchorId: string) => {
    const nextAnchor = getJourneyAnchorById(anchorId);
    if (!nextAnchor) return;

    setJourneyState({
      startAnchorId: startAnchor.id,
      destinationAnchorId: nextAnchor.id,
      legs: [buildJourneyLeg(startAnchor, nextAnchor, selectedRouteId)],
    });
  };

  useEffect(() => {
    if (!journeyState.destinationAnchorId || !destinationAnchor) return;

    const currentLeg = journeyState.legs[0];
    if (
      currentLeg &&
      currentLeg.from.id === journeyState.startAnchorId &&
      currentLeg.to.id === journeyState.destinationAnchorId &&
      currentLeg.routeType === selectedRouteId
    ) {
      return;
    }

    setJourneyState((current) => ({
      ...current,
      legs: [buildJourneyLeg(startAnchor, destinationAnchor, selectedRouteId)],
    }));
  }, [
    destinationAnchor,
    journeyState.destinationAnchorId,
    journeyState.legs,
    journeyState.startAnchorId,
    selectedRouteId,
    startAnchor,
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
