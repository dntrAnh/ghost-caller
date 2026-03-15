'use client';

import { useState, useCallback } from 'react';
import type { ItineraryProfile } from '@/types/itinerary';
import { defaultProfile } from '@/types/itinerary';

import { Stepper } from './Stepper';
import { YourDayStep, InterestsStep, LogisticsStep, FinalDetailsStep, type UpdateFn } from './steps';
import { MOCK_PROFILES } from '@/lib/itineraryStream';

// ─── Step metadata ────────────────────────────────────────────────────────────

const FORM_STEPS = [
  { label: 'Your Day',       title: 'Tell us about your day',  subtitle: "When, who's coming, and where you're starting." },
  { label: 'Interests',      title: 'What are you into?',      subtitle: 'Activities, budget, and the energy you want today.' },
  { label: 'Logistics',      title: 'Getting around',          subtitle: "How you'll move and anything special we should plan for." },
  { label: 'Final touches',  title: 'Almost done',             subtitle: 'Your ideal day in your words, plus any must-haves.' },
];

// ─── Review helpers ───────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string | string[] | undefined }) {
  const display = Array.isArray(value) ? value.join(', ') : value;
  if (!display?.trim()) return null;

  return (
    <div className="flex gap-3 py-2 border-b border-[#E2E6EE] last:border-0">
      <span className="text-xs text-[#8B95A8] shrink-0 w-24 pt-0.5">{label}</span>
      <span className="text-sm text-[#0F1117] leading-snug">{display}</span>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  stepIndex,
  children,
}: {
  title: string;
  onEdit: (i: number) => void;
  stepIndex: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[#E2E6EE] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FFFFFF] border-b border-[#E2E6EE]">
        <span className="text-xs font-semibold text-[#5A6478] uppercase tracking-wide">{title}</span>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="text-xs text-[#FF4500] hover:text-[#FF6620] font-medium transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-1 bg-[#F6F8FA]">{children}</div>
    </div>
  );
}

// ─── PlannerForm ──────────────────────────────────────────────────────────────

interface PlannerFormProps {
  onSubmit: (profile: ItineraryProfile) => void | Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export function PlannerForm({ onSubmit, isSubmitting = false, submitError = null }: PlannerFormProps) {
  const [profile, setProfile] = useState<ItineraryProfile>(defaultProfile);
  const [step, setStep] = useState(0);

  const update: UpdateFn = useCallback(
    (key, updates) => {
      setProfile((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
    },
    []
  );

  const goNext = () => { setStep((s) => Math.min(4, s + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goPrev = () => { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const jumpTo = (i: number) => { setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleSubmit = () => void onSubmit(profile);

  const { availability: a, party: p, location: l, budget: b,
    activities: ac, food: f, transportation: t,
    hardConstraints: hc, preferences: pr, personalization: pe } = profile;

  // ── Review ─────────────────────────────────────────────────────────────────
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  const interestLabels = ac.interests.map((i) => i.replace(/^[^\s]+ /, ''));

  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Hero: Location ── */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-6 py-8 overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #FF4500 0%, transparent 60%)' }} />
          <button type="button" onClick={() => jumpTo(0)}
            className="absolute top-3 right-3 text-[10px] text-white/40 hover:text-white/70 font-medium uppercase tracking-widest transition-colors">
            Edit
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">Starting from</p>
          <h2 className="text-2xl font-bold text-white leading-tight mb-4">
            {l.startingLocation || 'Your location'}
          </h2>
          <div className="flex flex-wrap gap-4 text-white/60 text-xs">
            {a.startTime && a.endTime && (
              <span>{formatTime(a.startTime)} – {formatTime(a.endTime)}</span>
            )}
            {p.groupSize > 0 && (
              <span>{p.groupSize} {p.groupSize === 1 ? 'person' : 'people'}</span>
            )}
            {b.budgetTier && (
              <span>{b.budgetTier} · {b.totalBudget}</span>
            )}
            {a.pacing && <span className="capitalize">{a.pacing} pace</span>}
          </div>
        </div>

        {/* ── Group members ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8B95A8] mb-3">
            {MOCK_PROFILES.profiles.length} people joining
          </p>
          <div className="space-y-3">
            {MOCK_PROFILES.profiles.map((member) => (
              <div key={member.name} className="rounded-2xl border border-[#E2E6EE] bg-white overflow-hidden">
                {/* Member header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E6EE]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {member.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F1117]">{member.name}</p>
                    <p className="text-xs text-[#8B95A8] capitalize">{member.transport_mode} · {member.price_range} budget · up to {member.max_travel_mins} min travel</p>
                  </div>
                </div>
                {/* Member preferences */}
                <div className="px-4 py-3 space-y-2.5">
                  {/* Vibes */}
                  {member.vibes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {member.vibes.map((v) => (
                        <span key={v} className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100 capitalize">{v}</span>
                      ))}
                    </div>
                  )}
                  {/* Cuisines */}
                  {member.cuisines_loved.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {member.cuisines_loved.map((c) => (
                        <span key={c} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">{c}</span>
                      ))}
                      {member.cuisines_avoided.map((c) => (
                        <span key={c} className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-medium border border-rose-100 line-through">{c}</span>
                      ))}
                    </div>
                  )}
                  {/* Dietary + photo */}
                  {(member.dietary_restrictions.length > 0 || member.photo_spots) && (
                    <div className="flex flex-wrap gap-1.5">
                      {member.dietary_restrictions.map((d) => (
                        <span key={d} className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100 capitalize">{d}</span>
                      ))}
                      {member.photo_spots && (
                        <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100">📸 Photo spots</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Generate CTA ── */}
        <div className="rounded-2xl border border-[#E2E6EE] bg-[#FFFFFF] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B95A8] mb-2">Ready to go</p>
          <h3 className="text-xl font-bold text-[#0F1117] mb-5">Generate your itinerary</h3>
          {submitError && (
            <p className="mb-4 rounded-md border border-[#F87171]/30 bg-[#F87171]/10 px-4 py-3 text-sm text-[#F87171]">
              {submitError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-md bg-[#FF4500] text-white font-bold text-sm hover:bg-[#FF6620] transition-colors disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Building...' : 'Generate Itinerary'}
          </button>
        </div>

        <button type="button" onClick={goPrev}
          className="text-sm text-[#8B95A8] hover:text-[#5A6478] transition-colors">
          Back to edit
        </button>
      </div>
    );
  }

  // ── Form steps ────────────────────────────────────────────────────────────
  const currentStep = FORM_STEPS[step];

  return (
    <div className="max-w-2xl mx-auto">
      <Stepper steps={FORM_STEPS.map((s) => s.label)} current={step} onSelect={jumpTo} />

      {/* Step card */}
      <div className="rounded-md border border-[#E2E6EE] bg-[#FFFFFF] overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-[#E2E6EE]">
          <h2 className="text-xl font-bold text-[#0F1117]">{currentStep.title}</h2>
          <p className="text-sm text-[#5A6478] mt-1">{currentStep.subtitle}</p>
        </div>
        <div className="px-6 py-6">
          {step === 0 && <YourDayStep profile={profile} update={update} />}
          {step === 1 && <InterestsStep profile={profile} update={update} />}
          {step === 2 && <LogisticsStep profile={profile} update={update} />}
          {step === 3 && <FinalDetailsStep profile={profile} update={update} />}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0}
          className="px-5 py-2.5 rounded-md border border-[#E2E6EE] bg-[#FFFFFF] text-sm font-medium text-[#5A6478] hover:text-[#0F1117] hover:border-[#CDD3DF] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Back
        </button>

        <button
          type="button"
          onClick={goNext}
          className="px-6 py-2.5 rounded-md bg-[#FF4500] text-sm font-semibold text-white hover:bg-[#FF6620] transition-all"
        >
          {step === FORM_STEPS.length - 1 ? 'Review' : 'Continue'}
        </button>
      </div>

      <div className="mt-4 rounded-md border border-[#E2E6EE] bg-[#FFFFFF] px-4 py-3 text-center">
        <p className="text-xs font-medium text-[#5A6478]">
          We&apos;ve preloaded most preferences to make testing easier. Change anything you want and use the defaults as a starting point for smarter experimentation.
        </p>
      </div>
    </div>
  );
}
