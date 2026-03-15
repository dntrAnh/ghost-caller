'use client';

import { useState, useCallback } from 'react';
import type { ItineraryProfile } from '@/types/itinerary';
import { defaultProfile } from '@/types/itinerary';

import { Stepper } from './Stepper';
import { YourDayStep, InterestsStep, LogisticsStep, FinalDetailsStep, type UpdateFn } from './steps';

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
  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#0F1117]">Review your plan</h2>
          <p className="text-sm text-[#5A6478] mt-1">Tap any section to edit, then generate.</p>
        </div>

        <ReviewSection title="Your Day" stepIndex={0} onEdit={jumpTo}>
          <ReviewRow label="When" value={a.startTime && a.endTime ? `${a.startTime} – ${a.endTime}` : a.startTime} />
          <ReviewRow label="Who" value={p.companions} />
          <ReviewRow label="Group" value={p.groupSize > 1 ? `${p.groupSize} people` : undefined} />
          <ReviewRow label="From" value={l.startingLocation} />
          <ReviewRow label="Occasion" value={p.occasion} />
        </ReviewSection>

        <ReviewSection title="Interests & Budget" stepIndex={1} onEdit={jumpTo}>
          <ReviewRow label="Interests" value={ac.interests} />
          <ReviewRow label="Budget" value={b.budgetTier} />
          <ReviewRow label="Energy" value={ac.energyLevel} />
          <ReviewRow label="Setting" value={l.indoorOutdoor} />
          <ReviewRow label="Food vibe" value={f.foodVibe} />
          <ReviewRow label="Cuisines" value={f.cuisinesLiked} />
        </ReviewSection>

        <ReviewSection title="Logistics" stepIndex={2} onEdit={jumpTo}>
          <ReviewRow label="Transport" value={t.modes} />
          <ReviewRow label="Max travel" value={t.maxTravelTime === 999 ? 'Flexible' : `≤ ${t.maxTravelTime} min`} />
          <ReviewRow label="Dietary" value={f.dietaryRestrictions} />
          <ReviewRow label="Accessibility" value={p.accessibilityNeeds} />
        </ReviewSection>

        <ReviewSection title="Must-haves & Vibe" stepIndex={3} onEdit={jumpTo}>
          <ReviewRow label="Ideal day" value={pe.idealDayDescription} />
          <ReviewRow label="Must include" value={hc.mustInclude} />
          <ReviewRow label="Must avoid" value={hc.mustAvoid} />
          <ReviewRow label="Plan style" value={pr.planningStyle} />
        </ReviewSection>

        {/* Generate CTA */}
        <div className="rounded-md border border-[#E2E6EE] bg-[#FFFFFF] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B95A8] mb-2">Profile ready</p>
          <h3 className="text-xl font-bold text-[#0F1117] mb-5">Generate your itinerary</h3>
          {submitError ? (
            <p className="mb-4 rounded-md border border-[#F87171]/30 bg-[#F87171]/10 px-4 py-3 text-sm text-[#F87171]">
              {submitError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-md bg-[#FF4500] text-white font-bold text-sm hover:bg-[#FF6620] transition-colors disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Building...' : 'Generate Itinerary'}
          </button>
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="text-sm text-[#8B95A8] hover:text-[#5A6478] transition-colors"
        >
          ← Back to edit
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
          ← Back
        </button>

        <button
          type="button"
          onClick={goNext}
          className="px-6 py-2.5 rounded-md bg-[#FF4500] text-sm font-semibold text-white hover:bg-[#FF6620] transition-all"
        >
          {step === FORM_STEPS.length - 1 ? 'Review →' : 'Continue →'}
        </button>
      </div>

      <p className="text-center text-xs text-[#8B95A8] mt-4">
        All fields are optional — fill what matters most.
      </p>
    </div>
  );
}
