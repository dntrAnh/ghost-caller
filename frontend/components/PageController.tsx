'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlannerForm } from './planner/PlannerForm';
import { MapPlannerView } from './map-plan/MapPlannerView';
import { streamItinerary, buildLogLine, type SSEProgressEvent, type LogLine } from '@/lib/itineraryStream';
import { StreamProgress } from './itinerary/StreamProgress';
import { backendItineraryToMapPlan, type BackendItinerary } from '@/lib/itineraryMapper';
import type { ItineraryProfile } from '@/types/itinerary';
import type { BuildMapPlanResponse } from '@/types/map-plan';

type View = 'form' | 'map-plan';

export function PageController() {
  const [view, setView] = useState<View>('form');
  const [profile, setProfile] = useState<ItineraryProfile | null>(null);
  const [mapPlan, setMapPlan] = useState<BuildMapPlanResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamLogs, setStreamLogs] = useState<LogLine[]>([]);

  const handleSubmit = async (nextProfile: ItineraryProfile) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setStreamLogs([]);
    setIsStreaming(true);

    try {
      await streamItinerary(
        (e: SSEProgressEvent) => {
          setStreamLogs((prev) => [...prev, buildLogLine(e)]);
        },
        async (itinerary: unknown) => {
          setIsStreaming(false);
          await new Promise((r) => setTimeout(r, 800));
          try {
            const plan = backendItineraryToMapPlan(itinerary as BackendItinerary);
            setProfile(nextProfile);
            setMapPlan(plan);
            setView('map-plan');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to process itinerary.');
          }
        },
        (message: string) => {
          setIsStreaming(false);
          setSubmitError(message);
        }
      );
    } catch (error) {
      setIsStreaming(false);
      setSubmitError(error instanceof Error ? error.message : 'Failed to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'map-plan' && mapPlan && profile) {
    return (
      <MapPlannerView
        initialPlan={mapPlan}
        profile={profile}
        onBack={() => {
          setView('form');
          setMapPlan(null);
          setProfile(null);
          setSubmitError(null);
          setStreamLogs([]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      {(isStreaming || (streamLogs.length > 0 && isSubmitting)) && (
        <StreamProgress logs={streamLogs} isStreaming={isStreaming} />
      )}

      {/* Nav */}
      <nav className="border-b border-[#E2E6EE]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-bold tracking-tight text-[#0F1117]">Let Me Know</Link>
          <Link href="/" className="text-xs font-medium text-[#5A6478] transition-colors hover:text-[#0F1117]">Home</Link>
        </div>
      </nav>

      {/* Header */}
      <header className="mx-auto max-w-2xl px-4 pb-6 pt-10 sm:px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#8B95A8]">Itinerary Planner</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#0F1117] sm:text-4xl">Build your day</h1>
        <p className="mt-2 text-sm text-[#5A6478]">Four quick steps and we'll generate a personalized itinerary for your group.</p>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <PlannerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitError={submitError} />
      </main>

      <footer className="border-t border-[#E2E6EE]">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <p className="text-center text-xs text-[#8B95A8]">Let Me Know · Hackathon build</p>
        </div>
      </footer>
    </div>
  );
}
