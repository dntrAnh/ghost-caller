'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { startBookingReservation } from '@/lib/mapPlanApi';
import { useRoutePreview } from '@/hooks/useRoutePreview';
import type { ItineraryProfile } from '@/types/itinerary';
import type { BuildMapPlanResponse, MapOption, MapPlanStep } from '@/types/map-plan';
import type { JourneyLeg } from '@/types/mapDemo';

import { ItineraryMapCanvas } from './ItineraryMapCanvas';

// ─── Constants ────────────────────────────────────────────────────────────────

const BOOKING_PROGRESS_STEPS = [
  'calling the restaurant',
  'picking up',
  'confirming details',
  'successfully reserved',
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupInitials(names: string[]): string[] {
  return names.map((name) => name.charAt(0).toUpperCase());
}

// ─── MediaPanel ───────────────────────────────────────────────────────────────

function MediaPanel({ venue, onClose }: { venue: MapOption; onClose: () => void }) {
  const [photoIdx, setPhotoIdx] = useState(0);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl animate-slide-up">
      <div className="relative h-56 overflow-hidden bg-slate-950">
        {venue.photos[photoIdx] ? (
          <img src={venue.photos[photoIdx]} alt={venue.name} className="h-full w-full object-cover opacity-90" />
        ) : (
          <div className="h-full w-full" style={{ background: `${venue.color}33` }} />
        )}
        <div
          className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg"
          style={{ backgroundColor: venue.color }}
        >
          {venue.score}/100 match
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-lg text-white"
        >
          ×
        </button>
        {venue.photos.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {venue.photos.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPhotoIdx(index)}
                className={`h-2 rounded-full transition-all ${index === photoIdx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{venue.name}</h3>
            <p className="text-sm text-slate-400">{venue.address}</p>
          </div>
          <span className="text-sm font-medium text-slate-300">{venue.price}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {venue.vibes.map((vibe) => (
            <span
              key={vibe}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: `${venue.color}50`, color: venue.color, backgroundColor: `${venue.color}18` }}
            >
              {vibe}
            </span>
          ))}
          {venue.dietary ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {venue.dietary}
            </span>
          ) : null}
          {venue.ghost ? (
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
              ghost caller
            </span>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Why this place</p>
          <p className="mt-2 text-sm text-slate-200">{venue.why}</p>
        </div>

        {venue.reels.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Reels and highlights</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {venue.reels.map((reel, index) => (
                <div
                  key={`${venue.id}-${index}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
                >
                  {venue.photos[index % venue.photos.length] && (
                    <img
                      src={venue.photos[index % venue.photos.length]}
                      alt={reel}
                      className="h-full w-full object-cover opacity-70"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-between p-2">
                    <div className="mx-auto mt-5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[10px] text-slate-900">
                      ▶
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FinalItinerary ───────────────────────────────────────────────────────────

function FinalItinerary({
  plan,
  profile,
  confirmedVenues,
  onReset,
}: {
  plan: BuildMapPlanResponse;
  profile: ItineraryProfile;
  confirmedVenues: MapOption[];
  onReset: () => void;
}) {
  const icons = ['📍', '☕', '🎯', '🍽️', '🎶', '🌅'];
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStage, setBookingStage] = useState(-1);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const reservationCandidate = useMemo(() => {
    // Prefer a ghost-caller venue, else use the last confirmed
    const ghostVenue = confirmedVenues.find((v) => v.ghost);
    return ghostVenue ?? confirmedVenues[confirmedVenues.length - 1] ?? null;
  }, [confirmedVenues]);

  async function runReservationFlow() {
    if (!reservationCandidate || isBooking) return;

    setIsBooking(true);
    setBookingError(null);
    setBookingMessage(null);
    setBookingStage(0);

    const stageInterval = window.setInterval(() => {
      setBookingStage((current) => (current < 2 ? current + 1 : current));
    }, 1400);

    try {
      const result = await startBookingReservation({
        groupId: plan.group_id,
        blockIndex: confirmedVenues.indexOf(reservationCandidate) + 1,
        partySize: profile.party.groupSize || plan.group.length,
        contactName: profile.party.companions[0] || plan.group[0] || 'Planner',
        contactPhone: '+15550000000',
      });

      if (result.status === 'confirmed') {
        setBookingStage(3);
        setBookingMessage(
          result.confirmation_number
            ? `Reservation confirmed at ${result.venue_name}. Confirmation: ${result.confirmation_number}`
            : `Reservation confirmed at ${result.venue_name}.`,
        );
      } else {
        setBookingError(result.notes || 'The restaurant could not confirm the reservation.');
      }
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Reservation request failed.');
    } finally {
      window.clearInterval(stageInterval);
      setIsBooking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Final plan</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Your group day is set</h1>
        <p className="mt-2 text-sm text-slate-500">
          {plan.neighborhood} · {plan.group.join(', ')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {groupInitials(plan.group).map((initial, index) => (
            <div
              key={`${initial}-${index}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700"
            >
              {initial}
            </div>
          ))}
          <span className="self-center text-sm text-slate-500">all synced</span>
        </div>
      </div>

      {plan.steps.map((step, index) => {
        const venue = confirmedVenues[index] ?? step.options[0];
        if (!venue) return null;

        return (
          <div key={step.step} className="flex gap-4">
            <div className="flex w-12 flex-col items-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg"
                style={{ borderColor: venue.color, backgroundColor: `${venue.color}1a` }}
              >
                {icons[index] ?? '📍'}
              </div>
              {index < plan.steps.length - 1 ? (
                <div className="mt-2 h-16 w-0.5 bg-slate-200" />
              ) : null}
            </div>
            <div className="flex-1 pb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{step.time}</p>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {venue.photos[0] ? (
                  <img src={venue.photos[0]} alt={venue.name} className="h-28 w-full object-cover" />
                ) : null}
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{venue.name}</h2>
                      <p className="text-sm text-slate-500">{venue.address}</p>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: venue.color }}>
                      {venue.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{venue.why}</p>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    {venue.walk ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Walk: {venue.walk}</span>
                    ) : null}
                    {venue.transit ? (
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">Transit: {venue.transit}</span>
                    ) : null}
                    {venue.ghost ? (
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">Ghost Caller</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Edit plan
        </button>
        <button
          type="button"
          onClick={runReservationFlow}
          disabled={!reservationCandidate || isBooking || bookingStage === 3}
          className="flex-[1.4] rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBooking
            ? 'AI is booking now…'
            : bookingStage === 3
            ? 'Reservation Confirmed'
            : 'Ask AI to Make Reservation'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reservation progress</p>
        <div className="mt-3 space-y-2">
          {BOOKING_PROGRESS_STEPS.map((label, index) => {
            const active = index <= bookingStage;
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {active ? '✓' : index + 1}
                </span>
                <span className={`text-sm ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">Demo mode uses a fallback contact phone and mock call outcomes.</p>
        {bookingMessage ? (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{bookingMessage}</p>
        ) : null}
        {bookingError ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{bookingError}</p>
        ) : null}
      </div>
    </div>
  );
}

// ─── MapPlannerView ────────────────────────────────────────────────────────────

type MapPlannerViewProps = {
  initialPlan: BuildMapPlanResponse;
  profile: ItineraryProfile;
  onBack: () => void;
};

export function MapPlannerView({ initialPlan, profile, onBack }: MapPlannerViewProps) {
  const [plan] = useState(initialPlan);

  /** Index of the step currently being decided (0 = first step) */
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  /** Venues the user has confirmed, in order */
  const [confirmedVenues, setConfirmedVenues] = useState<MapOption[]>([]);

  /** Route legs between consecutive confirmed venues */
  const [confirmedLegs, setConfirmedLegs] = useState<JourneyLeg[]>([]);

  /** The option the user clicked to preview (before confirming) */
  const [previewOption, setPreviewOption] = useState<MapOption | null>(null);

  /** Whether we've shown the detail panel for a venue */
  const [detailOption, setDetailOption] = useState<MapOption | null>(null);

  /** Whether all choices are done */
  const [done, setDone] = useState(false);

  const { state: routeState, fetchRoute, clear: clearRoute } = useRoutePreview();

  // All choice steps only
  const choiceSteps = useMemo(
    () => plan.steps.filter((s) => s.type === 'choice'),
    [plan.steps],
  );

  const currentStep: MapPlanStep | undefined = choiceSteps[currentStepIndex];

  // ── When user clicks a candidate ─────────────────────────────────────────────
  const handleCandidateClick = useCallback(
    (option: MapOption) => {
      setPreviewOption(option);
      setDetailOption(option);

      // If there is a previous confirmed venue, fetch the route to this candidate
      const lastConfirmed = confirmedVenues[confirmedVenues.length - 1];
      if (lastConfirmed) {
        void fetchRoute(lastConfirmed, option);
      } else {
        clearRoute();
      }
    },
    [confirmedVenues, fetchRoute, clearRoute],
  );

  // ── When user confirms a candidate ───────────────────────────────────────────
  function handleConfirm(option: MapOption) {
    const newConfirmed = [...confirmedVenues, option];
    setConfirmedVenues(newConfirmed);

    // Attach the fetched leg to confirmed legs
    if (routeState.status === 'ready' && confirmedVenues.length > 0) {
      setConfirmedLegs((prev) => [...prev, routeState.leg]);
    }

    setPreviewOption(null);
    setDetailOption(null);
    clearRoute();

    if (currentStepIndex + 1 >= choiceSteps.length) {
      setDone(true);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }

  // ── Reset preview when step advances ─────────────────────────────────────────
  useEffect(() => {
    setPreviewOption(null);
    setDetailOption(null);
    clearRoute();
  }, [currentStepIndex, clearRoute]);

  // ── Done screen ───────────────────────────────────────────────────────────────
  if (done) {
    return (
      <FinalItinerary
        plan={plan}
        profile={profile}
        confirmedVenues={confirmedVenues}
        onReset={onBack}
      />
    );
  }

  if (!currentStep) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">No more choices to make</h1>
          <p className="mt-2 text-sm text-slate-500">Your map plan is complete.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to planner
          </button>
        </div>
      </div>
    );
  }

  const previewLeg = routeState.status === 'ready' ? routeState.leg : null;
  const isRouteLoading = routeState.status === 'loading';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-3 text-sm font-medium text-slate-500 transition hover:text-violet-600"
            >
              ← Back to form
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
              Interactive map plan
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Choose where the group goes next
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Select one venue per step — the route to each candidate appears live on the map.
            </p>
          </div>
          <div className="hidden rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm sm:block">
            Step {currentStepIndex + 1} of {choiceSteps.length}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.95fr]">

          {/* Left column: map + step info + media panel */}
          <div className="space-y-4">
            <ItineraryMapCanvas
              confirmedVenues={confirmedVenues}
              confirmedLegs={confirmedLegs}
              currentOptions={currentStep.options}
              previewOption={previewOption}
              previewLeg={previewLeg}
              onCandidateClick={handleCandidateClick}
              neighborhood={plan.neighborhood}
            />

            <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                    Step {currentStepIndex + 1} of {choiceSteps.length}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{currentStep.label}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {currentStep.time} · {plan.group.join(', ')}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {groupInitials(plan.group).map((initial, index) => (
                    <div
                      key={`${initial}-${index}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white shadow-lg shadow-violet-200"
                    >
                      {initial}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {detailOption ? (
              <MediaPanel venue={detailOption} onClose={() => setDetailOption(null)} />
            ) : null}
          </div>

          {/* Right column: option cards */}
          <div className="space-y-4">
            {currentStep.options.map((option) => {
              const isPreview = previewOption?.id === option.id;

              return (
                <div
                  key={option.id}
                  className={`overflow-hidden rounded-[28px] border bg-white/90 shadow-sm backdrop-blur-sm transition hover:shadow-lg ${
                    isPreview
                      ? 'border-violet-300 ring-2 ring-violet-200'
                      : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleCandidateClick(option)}
                    className="flex w-full items-stretch text-left"
                  >
                    {option.photos[0] ? (
                      <img
                        src={option.photos[0]}
                        alt={option.name}
                        className="h-28 w-28 object-cover sm:h-32 sm:w-32"
                      />
                    ) : (
                      <div
                        className="h-28 w-28 shrink-0 sm:h-32 sm:w-32"
                        style={{ background: `${option.color}33` }}
                      />
                    )}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-950">{option.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{option.address}</p>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ color: option.color, backgroundColor: `${option.color}14` }}
                        >
                          {option.score}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {option.vibes.slice(0, 3).map((vibe) => (
                          <span
                            key={vibe}
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{ color: option.color, backgroundColor: `${option.color}14` }}
                          >
                            {vibe}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs italic text-slate-500 line-clamp-2">{option.why}</p>
                    <button
                      type="button"
                      onClick={() => handleConfirm(option)}
                      disabled={isRouteLoading && isPreview}
                      className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60"
                      style={{ backgroundColor: option.color }}
                    >
                      {isRouteLoading && isPreview ? 'Routing…' : 'Choose'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
