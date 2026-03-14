'use client';

import { useState } from 'react';

import { chooseMapPlanOption } from '@/lib/mapPlanApi';
import type { ItineraryProfile } from '@/types/itinerary';
import type { BuildMapPlanResponse, MapOption, MapPlanStep } from '@/types/map-plan';

type MapPlannerViewProps = {
  initialPlan: BuildMapPlanResponse;
  profile: ItineraryProfile;
  onBack: () => void;
};

function groupInitials(names: string[]): string[] {
  return names.map((name) => name.charAt(0).toUpperCase());
}

function currentChoiceStep(plan: BuildMapPlanResponse, choices: Record<string, string>): MapPlanStep | undefined {
  return plan.steps.find((step) => step.type === 'choice' && !choices[String(step.step)]);
}

function resolvedFinalSteps(plan: BuildMapPlanResponse, choices: Record<string, string>, finalSteps: MapPlanStep[]): MapPlanStep[] {
  if (finalSteps.length > 0) {
    return finalSteps;
  }

  return plan.steps.map((step) => {
    if (step.type !== 'choice') return step;
    const chosenId = choices[String(step.step)];
    if (!chosenId) return step;
    const chosenOption = step.options.find((option) => option.id === chosenId);
    return chosenOption ? { ...step, options: [chosenOption] } : step;
  });
}

function MapCanvas({
  plan,
  choices,
  activeOption,
  setActiveOption,
  currentStep,
}: {
  plan: BuildMapPlanResponse;
  choices: Record<string, string>;
  activeOption: MapOption | null;
  setActiveOption: (option: MapOption | null) => void;
  currentStep: number;
}) {
  const startVenue = plan.steps[0]?.venue;
  const currentChoice = plan.steps.find((step) => step.step === currentStep);

  const confirmedPath = startVenue
    ? [{ x: startVenue.x, y: startVenue.y }]
    : [];

  for (const step of plan.steps) {
    if (step.type !== 'choice') continue;
    const chosenId = choices[String(step.step)];
    if (!chosenId) continue;
    const chosenOption = step.options.find((option) => option.id === chosenId);
    if (chosenOption) confirmedPath.push({ x: chosenOption.x, y: chosenOption.y });
  }

  return (
    <div className="relative h-[280px] overflow-hidden rounded-[28px] border border-slate-800 bg-[#141627] shadow-[0_24px_80px_-32px_rgba(15,23,42,0.85)]">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect x="0" y="0" width="100" height="100" fill="#141627" />
        {[10, 30, 50, 70].map((x) => (
          <rect key={`v-${x}`} x={x} y="0" width="2" height="100" fill="#24263d" />
        ))}
        {[20, 40, 60, 80].map((y) => (
          <rect key={`h-${y}`} x="0" y={y} width="100" height="2" fill="#24263d" />
        ))}
        <rect x="15" y="25" width="12" height="8" fill="#232742" />
        <rect x="35" y="45" width="10" height="6" fill="#232742" />
        <rect x="58" y="18" width="8" height="10" fill="#232742" />
        <rect x="74" y="65" width="11" height="7" fill="#232742" />
        <text x="12" y="22" fontSize="3" fill="#3f4568">Grand St</text>
        <text x="32" y="42" fontSize="3" fill="#3f4568">N 4th St</text>
        <text x="52" y="18" fontSize="3" fill="#3f4568">Wythe Ave</text>

        {confirmedPath.map((point, index) => {
          if (index === 0) return null;
          const prev = confirmedPath[index - 1];
          return (
            <line
              key={`confirmed-${index}`}
              x1={`${prev.x}%`}
              y1={`${prev.y}%`}
              x2={`${point.x}%`}
              y2={`${point.y}%`}
              stroke="#7c3aed"
              strokeWidth="0.8"
              strokeDasharray="2 1"
              opacity="0.9"
            />
          );
        })}

        {currentChoice?.type === 'choice' && confirmedPath.length > 0
          ? currentChoice.options.map((option) => {
              const last = confirmedPath[confirmedPath.length - 1];
              return (
                <line
                  key={`candidate-${option.id}`}
                  x1={`${last.x}%`}
                  y1={`${last.y}%`}
                  x2={`${option.x}%`}
                  y2={`${option.y}%`}
                  stroke={option.color}
                  strokeWidth="0.55"
                  strokeDasharray="1.5 1"
                  opacity="0.55"
                />
              );
            })
          : null}

        {startVenue ? (
          <>
            <circle cx={`${startVenue.x}%`} cy={`${startVenue.y}%`} r="3" fill="#ffffff" stroke="#7c3aed" strokeWidth="1" />
            <text x={`${startVenue.x + 3}%`} y={`${startVenue.y + 1}%`} fontSize="3" fill="#ffffff" opacity="0.88">
              Hotel
            </text>
          </>
        ) : null}

        {plan.steps
          .filter((step) => step.type === 'choice')
          .flatMap((step) => step.options)
          .map((option) => {
            const chosen = Object.values(choices).includes(option.id);
            const isCurrent = currentChoice?.options.some((item) => item.id === option.id);
            const isActive = activeOption?.id === option.id;
            if (!chosen && !isCurrent) return null;

            return (
              <g
                key={option.id}
                onClick={() => setActiveOption(activeOption?.id === option.id ? null : option)}
                className="cursor-pointer"
              >
                <circle
                  cx={`${option.x}%`}
                  cy={`${option.y}%`}
                  r={isActive ? '4.2' : chosen ? '3.5' : '2.9'}
                  fill={chosen || isActive ? option.color : `${option.color}80`}
                  stroke="#ffffff"
                  strokeWidth={chosen || isActive ? '0.9' : '0'}
                />
                {(chosen || isActive) ? (
                  <text x={`${option.x + 3}%`} y={`${option.y + 1}%`} fontSize="2.7" fill="#ffffff" opacity="0.92">
                    {option.name.split(' ')[0]}
                  </text>
                ) : null}
              </g>
            );
          })}
      </svg>

      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
        {plan.neighborhood}
      </div>
      <div className="absolute right-4 top-4 flex gap-1.5">
        {groupInitials(plan.group).map((initial, index) => (
          <div
            key={`${initial}-${index}`}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-violet-500 text-[11px] font-semibold text-white shadow-lg"
          >
            {initial}
          </div>
        ))}
      </div>
    </div>
  );
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
  choices,
  finalSteps,
  onReset,
}: {
  plan: BuildMapPlanResponse;
  choices: Record<string, string>;
  finalSteps: MapPlanStep[];
  onReset: () => void;
}) {
  const resolvedSteps = resolvedFinalSteps(plan, choices, finalSteps);
  const icons = ['📍', '☕', '🎯', '🍽'];

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

      {resolvedSteps.map((step, index) => {
        const venue = step.type === 'start' ? step.venue : step.options[0];
        if (!venue) return null;
        const color = 'color' in venue ? venue.color : '#7c3aed';

        return (
          <div key={step.step} className="flex gap-4">
            <div className="flex w-12 flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg" style={{ borderColor: color, backgroundColor: `${color}1a` }}>
                {icons[index] ?? '📍'}
              </div>
              {index < resolvedSteps.length - 1 ? <div className="mt-2 h-16 w-0.5 bg-slate-200" /> : null}
            </div>
            <div className="flex-1 pb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{step.time}</p>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {'photos' in venue ? <img src={venue.photos[0]} alt={venue.name} className="h-28 w-full object-cover" /> : null}
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
                    {'ghost' in venue && venue.ghost ? <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">Ghost Caller</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex gap-3">
        <button type="button" onClick={onReset} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
          Edit plan
        </button>
        <button type="button" className="flex-[1.4] rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
          Confirm and book all
        </button>
      </div>
    </div>
  );
}

export function MapPlannerView({ initialPlan, profile, onBack }: MapPlannerViewProps) {
  const [plan] = useState(initialPlan);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [activeOption, setActiveOption] = useState<MapOption | null>(null);
  const [finalSteps, setFinalSteps] = useState<MapPlanStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = currentChoiceStep(plan, choices);

  async function choose(optionId: string) {
    if (!step) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await chooseMapPlanOption({
        groupId: plan.group_id,
        profile,
        currentStep: step.step,
        selectedOptionId: optionId,
        choices,
      });
      setChoices(result.choices);
      setActiveOption(null);
      if (result.completed) {
        setFinalSteps(result.final_steps);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while saving this choice.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (finalSteps.length > 0) {
    return <FinalItinerary plan={plan} choices={choices} finalSteps={finalSteps} onReset={onBack} />;
  }

  if (!step) {
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
              Everyone is synced. Select one option at a time and the backend will drive the next step in the day.
            </p>
          </div>
          <div className="hidden rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm sm:block">
            Step {step.step} of {plan.steps.length - 1}
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.95fr]">
          <div className="space-y-4">
            <MapCanvas
              plan={plan}
              choices={choices}
              activeOption={activeOption}
              setActiveOption={setActiveOption}
              currentStep={step.step}
            />

            <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Step {step.step} of {plan.steps.length - 1}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{step.label}</h2>
                  <p className="mt-1 text-sm text-slate-500">{step.time} · {plan.group.join(', ')}</p>
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
            {step.options.map((option) => (
              <div key={option.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm transition hover:shadow-lg">
                <button type="button" onClick={() => setActiveOption(option)} className="flex w-full items-stretch text-left">
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
                    onClick={() => choose(option.id)}
                    disabled={isSubmitting}
                    className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60"
                    style={{ backgroundColor: option.color }}
                  >
                    {isSubmitting ? 'Saving...' : 'Choose'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
