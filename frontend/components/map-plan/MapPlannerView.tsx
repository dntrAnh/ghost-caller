'use client';

import { useEffect, useMemo, useState } from 'react';

import { GhostCaller } from '@/components/GhostCaller';
import { ItineraryMapCanvas } from '@/components/map-plan/ItineraryMapCanvas';
import { useRoutePreview } from '@/hooks/useRoutePreview';
import type { ItineraryProfile } from '@/types/itinerary';
import type { BuildMapPlanResponse, MapOption, MapPlanStep } from '@/types/map-plan';
import type { JourneyLeg } from '@/types/mapDemo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupInitials(names: string[]): string[] {
  return names.map((name) => name.charAt(0).toUpperCase());
}

/** Parse "H:MM AM/PM" → total minutes since midnight, or -1 if unparseable */
function parseTimeMinutes(time: string): number {
  const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return -1;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return h * 60 + min;
}

/**
 * Returns a parallel array of 1-based day numbers.
 * A new day is inferred when time goes backward by more than 3 hours.
 */
function inferStepDays(steps: Array<{ time: string }>): number[] {
  const days: number[] = [];
  let day = 1;
  let prev = -1;
  for (const step of steps) {
    const mins = parseTimeMinutes(step.time);
    if (prev !== -1 && mins !== -1 && mins < prev - 180) day++;
    days.push(day);
    if (mins !== -1) prev = mins;
  }
  return days;
}

// ─── MediaPanel ───────────────────────────────────────────────────────────────

function MediaPanel({ venue, onClose }: { venue: MapOption; onClose: () => void }) {
  const [photoIdx, setPhotoIdx] = useState(0);

  return (
    <div className="overflow-hidden rounded-md border border-[#E2E6EE] bg-[#FFFFFF] shadow-2xl animate-slide-up">
      <div className="relative h-48 overflow-hidden bg-[#F6F8FA]">
        <img src={venue.photos[photoIdx]} alt={venue.name} className="h-full w-full object-cover opacity-80" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-sm text-white hover:bg-black/80"
        >
          ×
        </button>
        {venue.photos.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {venue.photos.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPhotoIdx(index)}
                className={`h-1 rounded-full transition-all ${index === photoIdx ? 'w-5 bg-white' : 'w-1 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#0F1117]">{venue.name}</h3>
            <p className="text-xs text-[#5A6478] mt-0.5">{venue.address}</p>
          </div>
          <span className="text-xs font-semibold text-[#5A6478]">{venue.price}</span>
        </div>

        {venue.vibes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {venue.vibes.map((vibe) => (
              <span key={vibe} className="rounded-full border border-[#E2E6EE] px-2.5 py-1 text-xs text-[#5A6478]">
                {vibe}
              </span>
            ))}
          </div>
        )}

        <div className="rounded-md border border-[#E2E6EE] bg-[#F6F8FA] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B95A8] mb-1">Why this place</p>
          <p className="text-sm text-[#5A6478]">{venue.why}</p>
        </div>

        {venue.reels.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B95A8]">Reels</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {venue.reels.map((reel, index) => (
                <div key={`${venue.id}-${index}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md border border-[#E2E6EE] bg-[#F6F8FA]">
                  <img src={venue.photos[index % venue.photos.length]} alt={reel} className="h-full w-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] text-white">▶</div>
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
  const RESERVABLE_TYPES = new Set(['restaurant', 'food', 'bar', 'cafe']);

  const reservationCandidate = useMemo(() => {
    for (let i = finalSteps.length - 1; i >= 0; i -= 1) {
      const step = finalSteps[i];
      const option = step.options[0];
      if (step.type === 'choice' && option && option.ghost && (!option.activity_type || RESERVABLE_TYPES.has(option.activity_type))) {
        return { stepIndex: step.step, option };
      }
    }
    for (let i = finalSteps.length - 1; i >= 0; i -= 1) {
      const step = finalSteps[i];
      const option = step.options[0];
      if (step.type === 'choice' && option && (!option.activity_type || RESERVABLE_TYPES.has(option.activity_type))) {
        return { stepIndex: step.step, option };
      }
    }
    return null;
  }, [finalSteps]);

  const [isGhostCallerOpen, setIsGhostCallerOpen] = useState(false);
  const [selectedReservationOption, setSelectedReservationOption] = useState<MapOption | null>(null);
  const [callProgress, setCallProgress] = useState({
    status: 'INITIATED', progressIndex: 0, confirmed: false, confirmationCode: null as string | null,
  });
  const [activeStopIndex, setActiveStopIndex] = useState(0);

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

  const reservationChecklist = ['Calling the restaurant', 'Picking up', 'Confirming details', 'Reservation confirmed'];

  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      {/* Nav */}
      <nav className="border-b border-[#E2E6EE]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-bold text-[#0F1117]">Let Me Know</span>
          <button type="button" onClick={onReset} className="text-xs font-medium text-[#5A6478] hover:text-[#0F1117] transition-colors">
            Edit plan
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
        {/* Full route map */}
        <div className="overflow-hidden rounded-md border border-[#E2E6EE] bg-[#FFFFFF] shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#E2E6EE] px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B95A8] mb-0.5">Full route</p>
              <h2 className="text-base font-semibold text-[#0F1117]">The whole journey, mapped</h2>
            </div>
            <span className="font-mono text-xs text-[#8B95A8]">
              Stop {Math.min(activeStopIndex + 1, confirmedVenues.length)} of {confirmedVenues.length}
            </span>
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

        {/* Timeline with day dividers */}
        {(() => {
          const stepDays = inferStepDays(finalSteps);
          const totalDays = stepDays[stepDays.length - 1] ?? 1;
          const items: React.ReactNode[] = [];

          finalSteps.forEach((step, index) => {
            const venue = step.type === 'start' ? step.venue : step.options[0];
            if (!venue) return;
            const isGhostVenue = 'ghost' in venue && Boolean(venue.ghost);
            const isActive = activeStopIndex === index;
            const day = stepDays[index];

            // Insert day divider when day changes (or on day 1 if multi-day)
            if (index === 0 || stepDays[index] !== stepDays[index - 1]) {
              items.push(
                <div key={`day-${day}`} className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-[#E2E6EE]" />
                  <span className="shrink-0 rounded-full bg-[#0F1117] px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
                    {totalDays > 1 ? `Day ${day}` : 'Your day'}
                  </span>
                  <div className="h-px flex-1 bg-[#E2E6EE]" />
                </div>
              );
            }

            items.push(
              <button
                key={step.step}
                type="button"
                onClick={() => setActiveStopIndex(index)}
                className={`flex w-full gap-4 rounded-lg border-2 text-left transition-all ${
                  isActive
                    ? 'border-[#FF4500] bg-[#FFF8F6] shadow-sm'
                    : 'border-[#E2E6EE] bg-[#FFFFFF] hover:border-[#CDD3DF]'
                }`}
              >
                {/* Step number + connector line */}
                <div className="flex w-10 flex-col items-center pl-2 pt-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-[#FF4500] text-white'
                      : 'border border-[#E2E6EE] bg-[#FFFFFF] text-[#5A6478]'
                  }`}>
                    {index + 1}
                  </div>
                  {index < finalSteps.length - 1 ? (
                    <div className={`mt-2 flex-1 w-px ${isActive ? 'bg-[#FF4500]/30' : 'bg-[#E2E6EE]'}`} style={{ minHeight: '2.5rem' }} />
                  ) : null}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4 pr-4 pt-4">
                  <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isActive ? 'text-[#FF4500]' : 'text-[#8B95A8]'}`}>{step.time}</p>
                  <div className={`overflow-hidden rounded-md border ${isActive ? 'border-[#FF4500]/30' : 'border-[#E2E6EE]'}`}>
                    {'photos' in venue && venue.photos[0] ? (
                      <div className="relative">
                        <img src={venue.photos[0]} alt={venue.name} className={`h-28 w-full object-cover transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`} />
                        {isActive ? (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        ) : null}
                      </div>
                    ) : null}
                    <div className="space-y-2 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B95A8]">{step.label}</p>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className={`text-base font-semibold ${isActive ? 'text-[#0F1117]' : 'text-[#5A6478]'}`}>{venue.name}</h2>
                          <p className="text-xs text-[#8B95A8] mt-0.5">{venue.address}</p>
                        </div>
                        {'score' in venue ? (
                          <span className={`text-xs font-bold ${isActive ? 'text-[#FF4500]' : 'text-[#8B95A8]'}`}>{venue.score}/100</span>
                        ) : null}
                      </div>
                      {'why' in venue && isActive ? <p className="text-sm text-[#5A6478]">{venue.why}</p> : null}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {'walk' in venue && venue.walk ? (
                          <span className="rounded-full border border-[#E2E6EE] px-2.5 py-1 text-[#5A6478]">Walk: {venue.walk}</span>
                        ) : null}
                        {'transit' in venue && venue.transit ? (
                          <span className="rounded-full border border-[#E2E6EE] px-2.5 py-1 text-[#5A6478]">Transit: {venue.transit}</span>
                        ) : null}
                        {isGhostVenue ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openGhostCaller(venue as MapOption);
                            }}
                            className="rounded-full border border-[#FF4500]/30 bg-[#FF4500]/10 px-2.5 py-1 text-[#FF4500] transition hover:bg-[#FF4500]/15"
                          >
                            {callProgress.confirmed ? 'Reservation Confirmed' : 'Let Me Know'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          });

          return items;
        })()}

        {/* Reservation checklist */}
        <div className="rounded-md border border-[#E2E6EE] bg-[#FFFFFF] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm font-semibold text-[#0F1117]">Reservation checklist</p>
            <button
              type="button"
              onClick={() => { if (reservationOption) openGhostCaller(reservationOption); }}
              disabled={!reservationOption}
              className="rounded-md bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#FF6620] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {callProgress.confirmed ? 'Confirmed' : 'Open Let Me Know'}
            </button>
          </div>

          <div className="space-y-2">
            {reservationChecklist.map((item, index) => {
              const complete = index <= callProgress.progressIndex;
              return (
                <div key={item} className="flex items-center gap-2.5">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${complete ? 'border border-emerald-300 bg-emerald-50 text-emerald-700' : 'border border-[#E2E6EE] bg-[#F0F2F6] text-[#8B95A8]'}`}>
                    {complete ? '✓' : index + 1}
                  </span>
                  <span className={`text-sm ${complete ? 'text-[#0F1117]' : 'text-[#8B95A8]'}`}>{item}</span>
                </div>
              );
            })}
          </div>

          {callProgress.confirmationCode ? (
            <p className="mt-3 text-sm text-emerald-700">
              Confirmation code: <span className="font-semibold">{callProgress.confirmationCode}</span>
            </p>
          ) : null}
        </div>

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

// ─── MapPlannerView ───────────────────────────────────────────────────────────

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

  const [isFullscreen, setIsFullscreen] = useState(true);

  const { state: routeState, fetchRoute, requestRouteLeg, clear: clearRoute } = useRoutePreview();

  const choiceSteps = plan.steps.filter((step) => step.type === 'choice');
  const currentStep = choiceSteps[currentStepIndex] ?? null;

  // Auto-select first candidate whenever the step changes
  useEffect(() => {
    const first = choiceSteps[currentStepIndex]?.options[0] ?? null;
    setPreviewOption(first);
    setActiveOption(null);
    clearRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex]);
  const previewLeg = routeState.status === 'ready' ? routeState.leg : null;
  const isLoadingRoute = routeState.status === 'loading';

  function handleCandidateClick(option: MapOption) {
    setPreviewOption(option);
    setActiveOption(option);
    if (confirmedVenues.length > 0) {
      void fetchRoute(confirmedVenues[confirmedVenues.length - 1], option);
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

  // ── Final view ───────────────────────────────────────────────────────────────
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

  // ── No steps guard ───────────────────────────────────────────────────────────
  if (!currentStep) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0F1117] mb-2">Plan complete</h1>
          <p className="text-sm text-[#5A6478] mb-6">All choices have been made.</p>
          <button type="button" onClick={onBack} className="rounded-md bg-[#FF4500] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FF6620]">
            Back to planner
          </button>
        </div>
      </div>
    );
  }

  // ── Shared sub-components ────────────────────────────────────────────────────

  const stepHeader = (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B95A8]">
        Step {currentStepIndex + 1} of {choiceSteps.length} — {currentStep.label}
      </p>
      <p className="text-sm text-[#5A6478] mt-1">{currentStep.time} · {plan.group.join(', ')}</p>
      <div className="flex gap-1.5 mt-2">
        {groupInitials(plan.group).map((initial, index) => (
          <div key={`${initial}-${index}`} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF4500] text-xs font-semibold text-white">
            {initial}
          </div>
        ))}
      </div>
    </div>
  );

  const candidateCards = currentStep.options.map((option, i) => {
    const isSelected = previewOption?.id === option.id;
    const letter = String.fromCharCode(65 + i);

    return (
      <button
        key={option.id}
        type="button"
        onClick={() => handleCandidateClick(option)}
        className={`w-full overflow-hidden rounded-lg border-2 text-left transition-all ${
          isSelected
            ? 'border-[#FF4500] bg-[#FFF8F6] shadow-sm'
            : 'border-[#E2E6EE] bg-white hover:border-[#CDD3DF] hover:bg-[#FAFBFC]'
        }`}
      >
        <div className="flex items-stretch">
          {/* Letter badge — left column */}
          <div className={`flex w-10 shrink-0 flex-col items-center justify-start pt-3 ${isSelected ? 'bg-[#FF4500]/10' : 'bg-[#F6F8FA]'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              isSelected ? 'bg-[#FF4500] text-white' : 'bg-[#E2E6EE] text-[#5A6478]'
            }`}>
              {letter}
            </span>
          </div>

          {/* Photo + content */}
          <div className="flex flex-1 items-stretch">
            {option.photos[0] ? (
              <img src={option.photos[0]} alt={option.name} className="h-[88px] w-20 shrink-0 object-cover" />
            ) : null}
            <div className="flex flex-1 flex-col justify-between p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F1117] leading-tight">{option.name}</h3>
                  <p className="text-xs text-[#8B95A8] mt-0.5 leading-snug">{option.address}</p>
                </div>
                <span className={`shrink-0 text-xs font-bold ${isSelected ? 'text-[#FF4500]' : 'text-[#5A6478]'}`}>{option.score}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {option.vibes.slice(0, 2).map((vibe) => (
                  <span key={vibe} className={`rounded-full px-2 py-0.5 text-[11px] border ${
                    isSelected ? 'border-[#FF4500]/30 bg-[#FF4500]/8 text-[#FF4500]' : 'border-[#E2E6EE] text-[#8B95A8]'
                  }`}>
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Why strip */}
        <div className={`border-t px-3 py-2 ${isSelected ? 'border-[#FF4500]/20 bg-[#FF4500]/5' : 'border-[#E2E6EE] bg-[#F6F8FA]'}`}>
          <p className="text-xs text-[#8B95A8] line-clamp-2">{option.why}</p>
        </div>
      </button>
    );
  });

  // ── Confirm button (single action after selecting a candidate) ────────────────
  const confirmButton = (
    <button
      type="button"
      onClick={() => previewOption && void handleChoose(previewOption)}
      disabled={!previewOption || isLoadingRoute}
      className="w-full rounded-lg bg-[#FF4500] py-3 text-sm font-bold text-white transition hover:bg-[#FF6620] disabled:cursor-wait disabled:opacity-50"
    >
      {isLoadingRoute
        ? 'Routing…'
        : previewOption
          ? `Choose ${previewOption.name}`
          : 'Select a place first'}
    </button>
  );

  // ── Fullscreen toggle button ──────────────────────────────────────────────────
  const fullscreenToggle = (
    <button
      type="button"
      onClick={() => setIsFullscreen((v) => !v)}
      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E2E6EE] bg-[#F6F8FA] text-[#5A6478] transition hover:bg-[#EAECF0] hover:text-[#0F1117]"
    >
      {isFullscreen ? (
        /* compress icon */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M5.5 1a.5.5 0 0 1 .5.5V4H1.5a.5.5 0 0 1 0-1H4V1.5a.5.5 0 0 1 .5-.5h1ZM11.5 1a.5.5 0 0 1 .5.5V3h1.5a.5.5 0 0 1 0 1H12v1.5a.5.5 0 0 1-1 0V1.5a.5.5 0 0 1 .5-.5ZM1 11.5a.5.5 0 0 1 .5-.5H4v1.5a.5.5 0 0 1-1 0V12H1.5a.5.5 0 0 1-.5-.5ZM12 11h1.5a.5.5 0 0 1 0 1H12v1.5a.5.5 0 0 1-1 0V11.5a.5.5 0 0 1 .5-.5H12Z"/>
        </svg>
      ) : (
        /* expand icon */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M1.5 1h4a.5.5 0 0 1 0 1H2v3.5a.5.5 0 0 1-1 0v-4A.5.5 0 0 1 1.5 1ZM10.5 1a.5.5 0 0 1 .5.5V5h3.5a.5.5 0 0 1 0 1H11a.5.5 0 0 1-.5-.5V1.5a.5.5 0 0 1 .5-.5ZM1 10.5a.5.5 0 0 1 .5-.5h.5v-1a.5.5 0 0 1 1 0V10h3.5a.5.5 0 0 1 0 1H2v.5a.5.5 0 0 1-1 0v-1ZM14.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1 0-1H14v-3.5a.5.5 0 0 1 .5-.5Z"/>
        </svg>
      )}
    </button>
  );

  // ── Interactive chooser — fullscreen ─────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div className="flex h-screen flex-col bg-[#F6F8FA]">
        {/* Nav */}
        <nav className="shrink-0 border-b border-[#E2E6EE] bg-white">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-bold text-[#0F1117]">Let Me Know</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#8B95A8]">
                {String(currentStepIndex + 1).padStart(2, '0')} / {String(choiceSteps.length).padStart(2, '0')}
              </span>
              {fullscreenToggle}
              <button type="button" onClick={onBack} className="text-xs font-medium text-[#5A6478] hover:text-[#0F1117] transition-colors">
                Back
              </button>
            </div>
          </div>
        </nav>

        {/* Body: map + sidebar */}
        <div className="flex flex-1 min-h-0">

          {/* Map — fills all remaining width */}
          <div className="flex-1 min-w-0">
            <ItineraryMapCanvas
              confirmedVenues={confirmedVenues}
              confirmedLegs={confirmedLegs}
              currentOptions={currentStep.options}
              previewOption={previewOption}
              previewLeg={previewLeg}
              onCandidateClick={handleCandidateClick}
              neighborhood={plan.neighborhood}
              containerClassName="h-full"
            />
          </div>

          {/* Sidebar — fixed width, scrollable */}
          <div className="w-[360px] shrink-0 flex flex-col border-l border-[#E2E6EE] bg-white overflow-y-auto">
            {/* Step header */}
            <div className="sticky top-0 z-10 border-b border-[#E2E6EE] bg-white px-5 py-4">
              {stepHeader}
            </div>

            {/* Candidate cards */}
            <div className="flex-1 space-y-3 p-4">
              {candidateCards}
            </div>

            {/* Media panel */}
            {activeOption ? (
              <div className="border-t border-[#E2E6EE] p-4">
                <MediaPanel venue={activeOption} onClose={() => setActiveOption(null)} />
              </div>
            ) : null}

            {/* Confirm — sticky footer */}
            <div className="sticky bottom-0 border-t border-[#E2E6EE] bg-white p-4">
              {confirmButton}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Interactive chooser — windowed (stacked) ──────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      {/* Nav */}
      <nav className="border-b border-[#E2E6EE] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-bold text-[#0F1117]">Let Me Know</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#8B95A8]">
              {String(currentStepIndex + 1).padStart(2, '0')} / {String(choiceSteps.length).padStart(2, '0')}
            </span>
            {fullscreenToggle}
            <button type="button" onClick={onBack} className="text-xs font-medium text-[#5A6478] hover:text-[#0F1117] transition-colors">
              Back
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-5">
        {/* Step header */}
        <div>{stepHeader}</div>

        {/* Map */}
        <ItineraryMapCanvas
          confirmedVenues={confirmedVenues}
          confirmedLegs={confirmedLegs}
          currentOptions={currentStep.options}
          previewOption={previewOption}
          previewLeg={previewLeg}
          onCandidateClick={handleCandidateClick}
          neighborhood={plan.neighborhood}
          containerClassName="h-[420px] rounded-xl"
        />

        {/* Candidate cards */}
        <div className="space-y-3">
          {candidateCards}
        </div>

        {/* Media panel */}
        {activeOption ? (
          <MediaPanel venue={activeOption} onClose={() => setActiveOption(null)} />
        ) : null}

        {/* Confirm */}
        {confirmButton}
      </div>
    </div>
  );
}
