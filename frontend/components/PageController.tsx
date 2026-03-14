'use client';

import { useState } from 'react';
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

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamLogs, setStreamLogs] = useState<LogLine[]>([]);

  const handleSubmit = async (nextProfile: ItineraryProfile) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setStreamLogs([]);
    setIsStreaming(true);

    try {
      await streamItinerary(
        // onEvent — append each SSE progress line to the log
        (e: SSEProgressEvent) => {
          setStreamLogs((prev) => [...prev, buildLogLine(e)]);
        },
        // onComplete — convert real itinerary to map plan and show it
        async (itinerary: unknown) => {
          setIsStreaming(false);
          // Brief pause so user sees the 🎉 complete line
          await new Promise((r) => setTimeout(r, 800));
          try {
            const mapPlan = backendItineraryToMapPlan(itinerary as BackendItinerary);
            setProfile(nextProfile);
            setMapPlan(mapPlan);
            setView('map-plan');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to process itinerary.');
          }
        },
        // onError
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
    <div className="min-h-screen">
      {/* Streaming progress overlay */}
      {(isStreaming || (streamLogs.length > 0 && isSubmitting)) && (
        <StreamProgress logs={streamLogs} isStreaming={isStreaming} />
      )}

      {/* Header */}
      <header className="border-b border-slate-100 bg-white/70 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI Itinerary Planner
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Plan your{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              perfect day
            </span>
          </h1>
          <p className="text-slate-500 text-base">
            Four quick steps and we'll build a personalized itinerary for your day out.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <PlannerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitError={submitError} />
      </main>

      <footer className="border-t border-slate-100 mt-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <p className="text-xs text-slate-300 text-center">
            Frontend preview · No data is sent anywhere
          </p>
        </div>
      </footer>
    </div>
  );
}
