'use client';

import { useMemo, useState } from 'react';

import { GhostCaller } from '@/components/GhostCaller';
import { ItineraryMapCanvas } from '@/components/map-plan/ItineraryMapCanvas';
import { useRoutePreview } from '@/hooks/useRoutePreview';
import type { ItineraryProfile } from '@/types/itinerary';
import type { BuildMapPlanResponse, MapOption, MapPlanStep } from '@/types/map-plan';
import type { JourneyLeg } from '@/types/mapDemo';

function groupInitials(names: string[]): string[] {
  return names.map((name) => name.charAt(0).toUpperCase());
}

function MediaPanel({ venue, onClose }: { venue: MapOption; onClose: () => void }) {
  const [photoIdx, setPhotoIdx] = useState(0);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl animate-slide-up">
      <div className="relative h-56 overflow-hidden bg-slate-950">
        <img src={venue.photos[photoIdx]} alt={venue.name} className="h-full w-full object-cover opacity-90" />
        <div className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg" style={{ backgroundColor: venue.color }}>
          {venue.score}/100 match
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-lg text-white"
        >
          ×
        </button>
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

        <div className="grid gap-3 sm:grid-cols-2">
          {venue.walk ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">Walk</p>
              <p className="mt-1 text-sm font-medium text-white">{venue.walk}</p>
            </div>
          ) : null}
          {venue.transit ? (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-300">Transit</p>
              <p className="mt-1 text-sm font-medium text-white">{venue.transit}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Why this place</p>
          <p className="mt-2 text-sm text-slate-200">{venue.why}</p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Reels and highlights</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {venue.reels.map((reel, index) => (
              <div key={`${venue.id}-${index}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                <img src={venue.photos[index % venue.photos.length]} alt={reel} className="h-full w-full object-cover opacity-70" />
                <div className="absolute inset-0 flex flex-col justify-between p-2">
                  <div className="mx-auto mt-5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[10px] text-slate-900">
                    ▶
                  </div>
                  <p className="text-center text-[10px] font-medium leading-tight text-white">{reel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalItinerary({
  plan,
  profile,
  finalSteps,
  confirmedVenues,
  confirmedLegs,
  onReset,
}: {
  plan: BuildMapPlanResponse;
  profile: ItineraryProfile;
  finalSteps: MapPlanStep[];
  confirmedVenues: MapOption[];
  confirmedLegs: JourneyLeg[];
  onReset: () => void;
}) {
  const icons = ['📍', '☕', '🎯', '🍽', '🎶', '🌅'];
  const reservationChecklist = [
    'calling the restaurant',
    'picking up',
    'confirming details',
    'successfully reserved',
  ];
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  const RESERVABLE_TYPES = new Set(['restaurant', 'food', 'bar', 'cafe']);
  const reservationCandidate = useMemo(() => {
    for (let i = finalSteps.length - 1; i >= 0; i -= 1) {
      const step = finalSteps[i];
      const option = step.options[0];
      if (
        step.type === 'choice' &&
        option &&
        option.ghost &&
        (!option.activity_type || RESERVABLE_TYPES.has(option.activity_type))
      ) {
        return { stepIndex: step.step, option };
      }
    }
    for (let i = finalSteps.length - 1; i >= 0; i -= 1) {
      const step = finalSteps[i];
      const option = step.options[0];
      if (
        step.type === 'choice' &&
        option &&
        (!option.activity_type || RESERVABLE_TYPES.has(option.activity_type))
      ) {
        return { stepIndex: step.step, option };
      }
    }
    return null;
  }, [finalSteps]);

  const [isGhostCallerOpen, setIsGhostCallerOpen] = useState(false);
  const [selectedReservationOption, setSelectedReservationOption] = useState<MapOption | null>(null);
  const [callProgress, setCallProgress] = useState({
    status: 'INITIATED',
    progressIndex: 0,
    confirmed: false,
    confirmationCode: null as string | null,
  });

  const reservationOption = selectedReservationOption ?? reservationCandidate?.option ?? null;
  const partyNames = profile.party.companions.length > 0 ? profile.party.companions : plan.group;
  const partyDate = new Date().toISOString().slice(0, 10);
  const partyTime = profile.availability.startTime || '19:00';

  function openGhostCaller(option: MapOption) {
    setSelectedReservationOption(option);
    setIsGhostCallerOpen(true);
  }

  function navigateStep(direction: 'previous' | 'next') {
    setActiveStopIndex((current) => {
      const delta = direction === 'next' ? 1 : -1;
      return Math.min(Math.max(current + delta, 0), Math.max(confirmedVenues.length - 1, 0));
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Final plan</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Your group day is set</h1>
        <p className="mt-2 text-sm text-slate-500">Saturday in {plan.neighborhood} · {plan.group.join(', ')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {groupInitials(plan.group).map((initial, index) => (
            <div key={`${initial}-${index}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700">
              {initial}
            </div>
          ))}
          <span className="self-center text-sm text-slate-500">all synced</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 p-4 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)] backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Full route</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">The whole journey, mapped end to end</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use the controls or click a stop card to walk through each leg of the day.
            </p>
          </div>
          <div className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            Stop {Math.min(activeStopIndex + 1, confirmedVenues.length)} of {confirmedVenues.length}
          </div>
        </div>

        <ItineraryMapCanvas
          confirmedVenues={confirmedVenues}
          confirmedLegs={confirmedLegs}
          currentOptions={[]}
          previewOption={null}
          previewLeg={null}
          mode="final"
          activeStopIndex={activeStopIndex}
          onConfirmedMarkerClick={setActiveStopIndex}
          onStepNavigate={navigateStep}
          neighborhood={plan.neighborhood}
        />
      </div>

      {finalSteps.map((step, index) => {
        const venue = step.type === 'start' ? step.venue : step.options[0];
        if (!venue) return null;
        const color = 'color' in venue ? venue.color : '#7c3aed';
        const isGhostVenue = 'ghost' in venue && Boolean(venue.ghost);

        return (
          <button
            key={step.step}
            type="button"
            onClick={() => setActiveStopIndex(index)}
            className={`flex w-full gap-4 rounded-[28px] p-2 text-left transition ${
              activeStopIndex === index ? 'bg-violet-50/70 ring-1 ring-violet-100' : 'hover:bg-slate-50/80'
            }`}
          >
            <div className="flex w-12 flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg" style={{ borderColor: color, backgroundColor: `${color}1a` }}>
                {icons[index] ?? '📍'}
              </div>
              {index < finalSteps.length - 1 ? <div className="mt-2 h-16 w-0.5 bg-slate-200" /> : null}
            </div>
            <div className="flex-1 pb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{step.time}</p>
              <div className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${activeStopIndex === index ? 'border-violet-300' : 'border-slate-200'}`}>
                {'photos' in venue && venue.photos[0] ? <img src={venue.photos[0]} alt={venue.name} className="h-28 w-full object-cover" /> : null}
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{venue.name}</h2>
                      <p className="text-sm text-slate-500">{venue.address}</p>
                    </div>
                    {'score' in venue ? <span className="text-sm font-semibold" style={{ color }}>{venue.score}/100</span> : null}
                  </div>
                  {'why' in venue ? <p className="text-sm text-slate-700">{venue.why}</p> : null}
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    {'walk' in venue && venue.walk ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Walk: {venue.walk}</span> : null}
                    {'transit' in venue && venue.transit ? <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">Transit: {venue.transit}</span> : null}
                    {isGhostVenue ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openGhostCaller(venue as MapOption);
                        }}
                        className="rounded-full bg-orange-50 px-3 py-1 text-orange-700 transition hover:bg-orange-100"
                      >
                        {callProgress.confirmed ? 'Reservation Confirmed' : 'Ghost Caller'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Reservation checklist</p>
          <button
            type="button"
            onClick={() => { if (reservationOption) openGhostCaller(reservationOption); }}
            disabled={!reservationOption}
            className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {callProgress.confirmed ? 'Reservation Confirmed' : 'Open Ghost Caller'}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {reservationChecklist.map((item, index) => {
            const complete = index <= callProgress.progressIndex;
            return (
              <div key={item} className="flex items-center gap-2">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {complete ? '✓' : index + 1}
                </span>
                <span className={`text-sm ${complete ? 'text-slate-900' : 'text-slate-500'}`}>{item}</span>
              </div>
            );
          })}
        </div>

        {callProgress.confirmationCode ? (
          <p className="mt-3 text-sm text-emerald-700">Confirmation code: <span className="font-semibold">{callProgress.confirmationCode}</span></p>
        ) : null}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onReset} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
          Edit plan
        </button>
      </div>

      {reservationOption && isGhostCallerOpen ? (
        <GhostCaller
          restaurant={{
            name: reservationOption.name,
            address: reservationOption.address,
            score: reservationOption.score,
            cuisine: reservationOption.vibes[0] || reservationOption.price,
            phone: reservationOption.phone || process.env.NEXT_PUBLIC_GHOST_CALL_TARGET_NUMBER || '+15550000000',
          }}
          party={{
            size: profile.party.groupSize || plan.group.length,
            dietaryRestrictions: profile.food.dietaryRestrictions,
            date: partyDate,
            time: partyTime,
            userName: partyNames[0] || 'Planner',
            attendees: partyNames.map((name) => ({
              name,
              email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              dietary: profile.food.dietaryRestrictions.join(', ') || undefined,
            })),
          }}
          onCallStateChange={setCallProgress}
        />
      ) : null}
    </div>
  );
}

type MapPlannerViewProps = {
  initialPlan: BuildMapPlanResponse;
  profile: ItineraryProfile;
  onBack: () => void;
};

export function MapPlannerView({ initialPlan, profile, onBack }: MapPlannerViewProps) {
  const [plan] = useState(initialPlan);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [confirmedVenues, setConfirmedVenues] = useState<MapOption[]>([]);
  const [confirmedLegs, setConfirmedLegs] = useState<JourneyLeg[]>([]);
  const [previewOption, setPreviewOption] = useState<MapOption | null>(null);
  const [activeOption, setActiveOption] = useState<MapOption | null>(null);
  const [finalSteps, setFinalSteps] = useState<MapPlanStep[]>([]);

  const { state: routeState, fetchRoute, requestRouteLeg, clear: clearRoute } = useRoutePreview();

  const choiceSteps = plan.steps.filter((step) => step.type === 'choice');
  const currentStep = choiceSteps[currentStepIndex] ?? null;
  const previewLeg = routeState.status === 'ready' ? routeState.leg : null;
  const isLoadingRoute = routeState.status === 'loading';

  function handleCandidateClick(option: MapOption) {
    setPreviewOption(option);
    setActiveOption(option);

    if (confirmedVenues.length > 0) {
      const lastConfirmed = confirmedVenues[confirmedVenues.length - 1];
      void fetchRoute(lastConfirmed, option);
    } else {
      clearRoute();
    }
  }

  async function handleChoose(option: MapOption) {
    const lastConfirmed = confirmedVenues[confirmedVenues.length - 1];
    let legToCommit: JourneyLeg | null = null;

    if (lastConfirmed) {
      if (
        routeState.status === 'ready' &&
        routeState.leg.from.id === lastConfirmed.id &&
        routeState.leg.to.id === option.id
      ) {
        legToCommit = routeState.leg;
      } else {
        legToCommit = await requestRouteLeg(lastConfirmed, option);
      }
    }

    const newConfirmedVenues = [...confirmedVenues, option];
    const newConfirmedLegs = legToCommit ? [...confirmedLegs, legToCommit] : confirmedLegs;

    setConfirmedVenues(newConfirmedVenues);
    setConfirmedLegs(newConfirmedLegs);
    setPreviewOption(null);
    setActiveOption(null);
    clearRoute();

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= choiceSteps.length) {
      const resolved: MapPlanStep[] = plan.steps.map((step, index) => ({
        ...step,
        options: newConfirmedVenues[index] ? [newConfirmedVenues[index]] : step.options,
      }));
      setFinalSteps(resolved);
    } else {
      setCurrentStepIndex(nextIndex);
    }
  }

  if (finalSteps.length > 0) {
    return (
      <FinalItinerary
        plan={plan}
        profile={profile}
        finalSteps={finalSteps}
        confirmedVenues={confirmedVenues}
        confirmedLegs={confirmedLegs}
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
          <button type="button" onClick={onBack} className="mt-6 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            Back to planner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <button type="button" onClick={onBack} className="mb-3 text-sm font-medium text-slate-500 transition hover:text-violet-600">
              ← Back to form
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Interactive map plan</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Choose where the group goes next</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Pick one spot at a time — the map will draw the route from your last stop.
            </p>
          </div>
          <div className="hidden rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm sm:block">
            Step {currentStepIndex + 1} of {choiceSteps.length}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.95fr]">
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
                  <p className="mt-1 text-sm text-slate-500">{currentStep.time} · {plan.group.join(', ')}</p>
                </div>
                <div className="flex gap-1.5">
                  {groupInitials(plan.group).map((initial, index) => (
                    <div key={`${initial}-${index}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white shadow-lg shadow-violet-200">
                      {initial}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {activeOption ? <MediaPanel venue={activeOption} onClose={() => setActiveOption(null)} /> : null}
          </div>

          <div className="space-y-4">
            {currentStep.options.map((option) => {
              const isActive = previewOption?.id === option.id;
              return (
                <div
                  key={option.id}
                  className={`overflow-hidden rounded-[28px] border bg-white/90 shadow-sm backdrop-blur-sm transition hover:shadow-lg ${isActive ? 'border-violet-400 ring-2 ring-violet-200' : 'border-slate-200'}`}
                >
                  <button type="button" onClick={() => handleCandidateClick(option)} className="flex w-full items-stretch text-left">
                    <img src={option.photos[0]} alt={option.name} className="h-28 w-28 object-cover sm:h-32 sm:w-32" />
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-950">{option.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{option.address}</p>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: option.color, backgroundColor: `${option.color}14` }}>
                          {option.score}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {option.walk ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Walk {option.walk}</span> : null}
                        {option.transit ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">Transit {option.transit}</span> : null}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs italic text-slate-500">{option.why}</p>
                    <button
                      type="button"
                      onClick={() => void handleChoose(option)}
                      disabled={isLoadingRoute && isActive}
                      className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60"
                      style={{ backgroundColor: option.color }}
                    >
                      {isLoadingRoute && isActive ? 'Routing…' : 'Choose'}
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
