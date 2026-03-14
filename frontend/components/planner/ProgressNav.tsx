'use client';

import type { ItineraryProfile } from '@/types/itinerary';

export interface SectionMeta {
  id: string;
  title: string;
  icon: string;
  isComplete: (p: ItineraryProfile) => boolean;
}

export const SECTIONS: SectionMeta[] = [
  {
    id: 'availability',
    title: 'Timing',
    icon: '⏰',
    isComplete: (p) =>
      !!(p.availability.dayType && p.availability.pacing && p.availability.outingLength),
  },
  {
    id: 'location',
    title: 'Location',
    icon: '📍',
    isComplete: (p) =>
      !!(p.location.startingLocation && p.location.indoorOutdoor),
  },
  {
    id: 'transport',
    title: 'Transport',
    icon: '🚇',
    isComplete: (p) =>
      p.transportation.modes.length > 0 && !!p.transportation.walkingTolerance,
  },
  {
    id: 'food',
    title: 'Food',
    icon: '🍽️',
    isComplete: (p) => p.food.foodVibe.length > 0,
  },
  {
    id: 'activities',
    title: 'Activities',
    icon: '🎯',
    isComplete: (p) =>
      p.activities.interests.length > 0 && !!p.activities.energyLevel,
  },
  {
    id: 'party',
    title: "Who's Coming",
    icon: '👥',
    isComplete: (p) => p.party.companions.length > 0,
  },
  {
    id: 'budget',
    title: 'Budget',
    icon: '💰',
    isComplete: (p) => !!p.budget.budgetTier,
  },
  {
    id: 'constraints',
    title: 'Must-Haves',
    icon: '📋',
    isComplete: (_p) => true, // all optional
  },
  {
    id: 'signals',
    title: 'Preferences',
    icon: '🎛️',
    isComplete: (p) =>
      !!(p.preferences.crowdTolerance && p.preferences.planningStyle),
  },
  {
    id: 'personalization',
    title: 'About You',
    icon: '✨',
    isComplete: (p) => p.personalization.idealDayDescription.trim().length > 10,
  },
];

interface ProgressNavProps {
  activeSection: number;
  onSelect: (index: number) => void;
  profile: ItineraryProfile;
}

export function ProgressNav({ activeSection, onSelect, profile }: ProgressNavProps) {
  const completedCount = SECTIONS.filter((s) => s.isComplete(profile)).length;
  const pct = Math.round((completedCount / SECTIONS.length) * 100);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav className="hidden lg:flex flex-col gap-1">
        <div className="mb-4 px-1">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-slate-500">Progress</span>
            <span className="text-xs font-semibold text-violet-600">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {SECTIONS.map((section, i) => {
          const isActive = activeSection === i;
          const isDone = section.isComplete(profile);

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(i)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                isActive
                  ? 'bg-violet-50 border border-violet-100'
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* Step indicator */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-150 ${
                  isDone && !isActive
                    ? 'bg-violet-500 text-white'
                    : isActive
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}
              >
                {isDone && !isActive ? '✓' : i + 1}
              </div>

              {/* Label */}
              <div className="min-w-0">
                <span
                  className={`text-sm font-medium leading-tight block truncate ${
                    isActive
                      ? 'text-violet-700'
                      : isDone
                      ? 'text-slate-700'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {section.icon} {section.title}
                </span>
              </div>
            </button>
          );
        })}

        {/* Review step */}
        <button
          type="button"
          onClick={() => onSelect(SECTIONS.length)}
          className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 mt-2 border ${
            activeSection === SECTIONS.length
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'border-violet-200 bg-violet-50/50 hover:bg-violet-50 text-violet-600'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
              activeSection === SECTIONS.length ? 'bg-white/20' : 'bg-violet-100'
            }`}
          >
            ✦
          </div>
          <span className="text-sm font-semibold">Review & Generate</span>
        </button>
      </nav>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">
            {activeSection < SECTIONS.length
              ? `Step ${activeSection + 1} of ${SECTIONS.length}`
              : 'Review'}
          </span>
          <span className="text-xs font-semibold text-violet-600">{pct}% complete</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {activeSection < SECTIONS.length && (
          <p className="mt-2 text-sm font-medium text-slate-700">
            {SECTIONS[activeSection].icon} {SECTIONS[activeSection].title}
          </p>
        )}
      </div>
    </>
  );
}
