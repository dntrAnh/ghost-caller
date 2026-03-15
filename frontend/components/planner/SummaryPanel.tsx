'use client';

import type { ItineraryProfile } from '@/types/itinerary';

interface SummaryPanelProps {
  profile: ItineraryProfile;
  onEdit: (sectionIndex: number) => void;
}

function Pill({ label, color = 'violet' }: { label: string; color?: 'violet' | 'orange' | 'slate' | 'emerald' }) {
  const styles = {
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    slate:  'bg-slate-50  text-slate-600  border-slate-100',
    emerald:'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[color]}`}>
      {label}
    </span>
  );
}

function Section({
  title,
  sectionIndex,
  onEdit,
  children,
}: {
  title: string;
  sectionIndex: number;
  onEdit: (i: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{title}</span>
        <button
          type="button"
          onClick={() => onEdit(sectionIndex)}
          className="text-xs text-violet-500 hover:text-violet-700 font-medium transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function SummaryPanel({ profile, onEdit }: SummaryPanelProps) {
  const { availability: a, location: l, food: f, activities: ac, party: p, budget: b, hardConstraints: hc, personalization: pe } = profile;

  const interestLabels = ac.interests.map((i) => i.replace(/^[^\s]+ /, ''));

  return (
    <div className="space-y-4">

      {/* ── Hero: Location ──────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-6 py-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #FF4500 0%, transparent 60%)' }} />
        <button
          type="button"
          onClick={() => onEdit(1)}
          className="absolute top-3 right-3 text-[10px] text-white/40 hover:text-white/70 font-medium transition-colors uppercase tracking-widest"
        >
          Edit
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">Starting from</p>
        <h2 className="text-2xl font-bold text-white leading-tight mb-4">
          {l.startingLocation || 'Your location'}
        </h2>
        {/* stat row */}
        <div className="flex flex-wrap gap-4 text-white/60 text-xs">
          {a.startTime && a.endTime && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {formatTime(a.startTime)} – {formatTime(a.endTime)}
            </span>
          )}
          {p.groupSize > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {p.groupSize} {p.groupSize === 1 ? 'person' : 'people'}
            </span>
          )}
          {b.budgetTier && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              {b.budgetTier} · {b.totalBudget}
            </span>
          )}
          {a.pacing && (
            <span className="capitalize">{a.pacing} pace</span>
          )}
        </div>
      </div>

      {/* ── Occasion + companions ───────────────────────────── */}
      {(p.occasion || p.companions.length > 0) && (
        <Section title="Who & Why" sectionIndex={5} onEdit={onEdit}>
          <div className="space-y-2">
            {p.occasion && (
              <p className="text-sm font-semibold text-slate-800">{p.occasion}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {p.companions.map((c) => <Pill key={c} label={c} color="violet" />)}
              {p.accessibilityNeeds.map((n) => <Pill key={n} label={n} color="slate" />)}
            </div>
          </div>
        </Section>
      )}

      {/* ── Vibe + interests ────────────────────────────────── */}
      {(interestLabels.length > 0 || ac.socialVibe.length > 0) && (
        <Section title="Vibe" sectionIndex={4} onEdit={onEdit}>
          <div className="space-y-2">
            {ac.vibeNote && (
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{ac.vibeNote}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {interestLabels.map((i) => <Pill key={i} label={i} color="orange" />)}
              {ac.socialVibe.map((v) => <Pill key={v} label={v} color="violet" />)}
            </div>
          </div>
        </Section>
      )}

      {/* ── Food ────────────────────────────────────────────── */}
      {(f.cuisinesLiked.length > 0 || f.cravings || f.dietaryRestrictions.length > 0) && (
        <Section title="Food" sectionIndex={3} onEdit={onEdit}>
          <div className="space-y-3">
            {f.cravings && (
              <p className="text-sm text-slate-600 leading-relaxed italic">"{f.cravings}"</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {f.cuisinesLiked.map((c) => <Pill key={c} label={c} color="emerald" />)}
              {f.dietaryRestrictions.map((d) => <Pill key={d} label={d} color="slate" />)}
            </div>
            {f.foodVibe.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {f.foodVibe.map((v) => <Pill key={v} label={v} color="orange" />)}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Day shape ───────────────────────────────────────── */}
      {(a.mealWindows.length > 0 || a.outingLength) && (
        <Section title="Day Shape" sectionIndex={0} onEdit={onEdit}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {a.outingLength && <Pill label={a.outingLength} color="slate" />}
              {a.mealWindows.map((m) => <Pill key={m} label={m} color="violet" />)}
            </div>
            {a.bufferTime && (
              <p className="text-xs text-slate-400">{a.bufferTime} min buffer between stops</p>
            )}
          </div>
        </Section>
      )}

      {/* ── Must-haves ──────────────────────────────────────── */}
      {(hc.mustInclude || hc.mustAvoid) && (
        <Section title="Must-Haves & Limits" sectionIndex={7} onEdit={onEdit}>
          <div className="space-y-3">
            {hc.mustInclude && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500 mb-1">Include</p>
                <p className="text-sm text-slate-700 leading-relaxed">{hc.mustInclude}</p>
              </div>
            )}
            {hc.mustAvoid && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400 mb-1">Avoid</p>
                <p className="text-sm text-slate-700 leading-relaxed">{hc.mustAvoid}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Personal note ───────────────────────────────────── */}
      {pe.idealDayDescription && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400 mb-2">Your ideal day</p>
          <p className="text-sm text-slate-700 leading-relaxed">{pe.idealDayDescription}</p>
        </div>
      )}

    </div>
  );
}

// ─── Mini Summary (desktop sidebar) ──────────────────────────────────────────

export function MiniSummary({ profile, onViewFull }: { profile: ItineraryProfile; onViewFull: () => void }) {
  const { party: p, budget: b, activities: ac, food: f, availability: a, location: l } = profile;

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

      {l.startingLocation && (
        <p className="text-xs font-semibold text-slate-800 truncate">{l.startingLocation}</p>
      )}

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
