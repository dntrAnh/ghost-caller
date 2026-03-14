'use client';

import type { ItineraryProfile } from '@/types/itinerary';
import { SECTIONS } from './ProgressNav';

interface SummaryPanelProps {
  profile: ItineraryProfile;
  onEdit: (sectionIndex: number) => void;
}

interface RowProps {
  label: string;
  value: string | string[] | boolean | number | undefined;
}

function Row({ label, value }: RowProps) {
  if (!value && value !== 0 && value !== false) return null;
  if (Array.isArray(value) && value.length === 0) return null;

  let display: string;
  if (Array.isArray(value)) {
    display = value.join(', ');
  } else if (typeof value === 'boolean') {
    display = value ? 'Yes' : 'No';
  } else {
    display = String(value);
  }

  if (!display.trim()) return null;

  return (
    <div className="flex gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 shrink-0 w-28 pt-0.5 leading-relaxed">{label}</span>
      <span className="text-xs text-slate-700 font-medium leading-relaxed">{display}</span>
    </div>
  );
}

interface SummaryGroupProps {
  title: string;
  icon: string;
  sectionIndex: number;
  onEdit: (i: number) => void;
  children: React.ReactNode;
}

function SummaryGroup({ title, icon, sectionIndex, onEdit, children }: SummaryGroupProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</span>
        </div>
        <button
          type="button"
          onClick={() => onEdit(sectionIndex)}
          className="text-xs text-violet-500 hover:text-violet-700 font-medium transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

export function SummaryPanel({ profile, onEdit }: SummaryPanelProps) {
  const { availability: a, location: l, transportation: t, food: f,
    activities: ac, party: p, budget: b, hardConstraints: hc,
    preferences: pr, personalization: pe } = profile;

  const completedCount = SECTIONS.filter((s) => s.isComplete(profile)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center px-2 py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 text-white text-3xl mb-4 shadow-lg shadow-violet-200">
          ✦
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Your Day-Out Profile</h2>
        <p className="text-slate-500 text-sm">
          {completedCount} of {SECTIONS.length} sections complete
        </p>
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedCount / SECTIONS.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <SummaryGroup title="Timing" icon="⏰" sectionIndex={0} onEdit={onEdit}>
        <Row label="Day type" value={a.dayType} />
        <Row label="Start" value={a.startTime} />
        <Row label="End" value={a.endTime} />
        <Row label="Pacing" value={a.pacing} />
        <Row label="Length" value={a.outingLength === 'Custom' ? a.customOutingLength || a.outingLength : a.outingLength} />
        <Row label="Meals" value={a.mealWindows} />
        <Row label="Buffer" value={a.bufferTime ? `${a.bufferTime} min` : undefined} />
        <Row label="Reservations" value={a.reservationPreference} />
      </SummaryGroup>

      <SummaryGroup title="Location" icon="📍" sectionIndex={1} onEdit={onEdit}>
        <Row label="Starting from" value={l.startingLocation} />
        <Row label="Include areas" value={l.preferredAreas} />
        <Row label="Avoid areas" value={l.areasToAvoid} />
        <Row label="Travel radius" value={l.maxTravelRadius === 'custom' ? l.customRadius : l.maxTravelRadius} />
        <Row label="Indoor/Outdoor" value={l.indoorOutdoor} />
      </SummaryGroup>

      <SummaryGroup title="Transport" icon="🚇" sectionIndex={2} onEdit={onEdit}>
        <Row label="Modes" value={t.modes} />
        <Row label="Max travel time" value={`${t.maxTravelTime} min`} />
        <Row label="Walking" value={t.walkingTolerance} />
        <Row label="Parking needed" value={t.parkingNeeded} />
        <Row label="Avoid transfers" value={t.avoidTransfers} />
      </SummaryGroup>

      <SummaryGroup title="Food" icon="🍽️" sectionIndex={3} onEdit={onEdit}>
        <Row label="Cuisines liked" value={f.cuisinesLiked} />
        <Row label="Avoid cuisines" value={f.cuisinesDisliked} />
        <Row label="Cravings" value={f.cravings} />
        <Row label="Dietary" value={f.dietaryRestrictions} />
        <Row label="Food vibe" value={f.foodVibe} />
        <Row label="Notes" value={f.foodNotes} />
      </SummaryGroup>

      <SummaryGroup title="Activities" icon="🎯" sectionIndex={4} onEdit={onEdit}>
        <Row label="Interests" value={ac.interests.map((i) => i.replace(/^[^\s]+ /, ''))} />
        <Row label="Energy" value={ac.energyLevel} />
        <Row label="Spots" value={ac.spotPreference} />
        <Row label="Vibe" value={ac.socialVibe} />
        <Row label="Note" value={ac.vibeNote} />
      </SummaryGroup>

      <SummaryGroup title="Party" icon="👥" sectionIndex={5} onEdit={onEdit}>
        <Row label="With" value={p.companions} />
        <Row label="Group size" value={p.groupSize} />
        <Row label="Occasion" value={p.occasion} />
        <Row label="Pets" value={p.petsComing} />
        <Row label="Child-friendly" value={p.childFriendly} />
        <Row label="Accessibility" value={p.accessibilityNeeds} />
      </SummaryGroup>

      <SummaryGroup title="Budget" icon="💰" sectionIndex={6} onEdit={onEdit}>
        <Row label="Tier" value={b.budgetTier} />
        <Row label="Total budget" value={b.totalBudget} />
        <Row label="Flex buffer" value={b.flexibilityBuffer} />
        <Row label="Spend priority" value={b.spendingPriority} />
      </SummaryGroup>

      <SummaryGroup title="Constraints" icon="📋" sectionIndex={7} onEdit={onEdit}>
        <Row label="Must include" value={hc.mustInclude} />
        <Row label="Must avoid" value={hc.mustAvoid} />
        <Row label="Commitments" value={hc.timeSensitiveCommitments} />
        <Row label="Notes" value={hc.specialNotes} />
      </SummaryGroup>

      <SummaryGroup title="Preferences" icon="🎛️" sectionIndex={8} onEdit={onEdit}>
        <Row label="Crowds" value={pr.crowdTolerance} />
        <Row label="Weather" value={pr.weatherSensitivity} />
        <Row label="Queues" value={pr.queueTolerance} />
        <Row label="Planning style" value={pr.planningStyle} />
      </SummaryGroup>

      <SummaryGroup title="Personalization" icon="✨" sectionIndex={9} onEdit={onEdit}>
        <Row label="Ideal day" value={pe.idealDayDescription} />
        <Row label="Personal note" value={pe.personalizedNote} />
      </SummaryGroup>
    </div>
  );
}

// ─── Mini Summary (desktop sidebar) ──────────────────────────────────────────

export function MiniSummary({ profile, onViewFull }: { profile: ItineraryProfile; onViewFull: () => void }) {
  const { party: p, budget: b, activities: ac, food: f, availability: a } = profile;

  const pills: string[] = [
    ...(a.pacing ? [a.pacing] : []),
    ...(b.budgetTier ? [b.budgetTier] : []),
    ...(ac.energyLevel ? [ac.energyLevel] : []),
    ...p.companions.slice(0, 2),
    ...f.foodVibe.slice(0, 1),
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-sm border border-violet-100">
          ✦
        </div>
        <span className="text-sm font-semibold text-slate-700">Profile Snapshot</span>
      </div>

      {pills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {pills.map((pill, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100"
            >
              {pill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">Fill in sections to see a snapshot here.</p>
      )}

      {p.groupSize > 0 && (
        <div className="text-xs text-slate-500">
          <span className="font-medium text-slate-700">{p.groupSize}</span> {p.groupSize === 1 ? 'person' : 'people'}
          {a.startTime && ` · Starting ${a.startTime}`}
        </div>
      )}

      <button
        type="button"
        onClick={onViewFull}
        className="w-full py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors"
      >
        View Full Profile →
      </button>
    </div>
  );
}
