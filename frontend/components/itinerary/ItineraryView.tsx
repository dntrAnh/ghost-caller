'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { GeneratedItinerary } from '@/types/itinerary-result';
import { Timeline } from './Timeline';
import { LogisticsPanel } from './LogisticsPanel';
import { AssistantFeed } from './AssistantFeed';

// Load map client-side only — Leaflet doesn't support SSR
const ItineraryMap = dynamic(() => import('./ItineraryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center">
      <p className="text-sm text-slate-400">Loading map…</p>
    </div>
  ),
});

interface ItineraryViewProps {
  itinerary: GeneratedItinerary;
  onBack: () => void;
}

export function ItineraryView({ itinerary, onBack }: ItineraryViewProps) {
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  const hasParking = itinerary.logistics.transport.primary
    .toLowerCase()
    .includes('car') || !!itinerary.logistics.parking;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/20 page-bg">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            New plan
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate">{itinerary.title}</h1>
            <p className="text-xs text-slate-400 truncate hidden sm:block">{itinerary.subtitle}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              {itinerary.stops.length} stops
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="lg:grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] lg:gap-6 space-y-6 lg:space-y-0">

          {/* ── Left: Timeline ──────────────────────────────────────────────── */}
          <section>
            {/* Mobile map (stacked above timeline on small screens) */}
            <div className="lg:hidden mb-4 h-64 sm:h-80">
              <ItineraryMap
                stops={itinerary.stops}
                activeStopId={activeStopId}
                onMarkerClick={setActiveStopId}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Your Itinerary</h2>
              <span className="text-xs text-slate-400">
                Tap any stop to highlight it on the map
              </span>
            </div>

            <Timeline
              stops={itinerary.stops}
              activeStopId={activeStopId}
              onStopClick={(id) => setActiveStopId((prev) => (prev === id ? null : id))}
            />
          </section>

          {/* ── Right: Map + Logistics + Feed (sticky on desktop) ──────────── */}
          <aside className="space-y-4 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:pb-8">
            {/* Desktop map */}
            <div className="hidden lg:block h-72 xl:h-80">
              <ItineraryMap
                stops={itinerary.stops}
                activeStopId={activeStopId}
                onMarkerClick={setActiveStopId}
              />
            </div>

            <LogisticsPanel
              logistics={itinerary.logistics}
              estimatedBudget={itinerary.estimatedBudget}
              needsParking={hasParking}
            />

            <AssistantFeed messages={itinerary.assistantMessages} />
          </aside>
        </div>
      </main>
    </div>
  );
}
