'use client';

import { useState, useCallback } from 'react';
import type { ItineraryProfile } from '@/types/itinerary';
import { defaultProfile } from '@/types/itinerary';

import { Stepper } from './Stepper';
import { YourDayStep, InterestsStep, LogisticsStep, FinalDetailsStep, type UpdateFn } from './steps';

// ─── Step metadata ────────────────────────────────────────────────────────────

const FORM_STEPS = [
  {
    label: 'Your Day',
    title: 'Tell us about your day',
    subtitle: "Basics first — when, who's coming, and where you're starting.",
  },
  {
    label: 'Interests',
    title: 'What are you into?',
    subtitle: 'Activities, budget, and the kind of energy you want today.',
  },
  {
    label: 'Logistics',
    title: 'Getting around',
    subtitle: 'How you\'ll move and anything special we should plan for.',
  },
  {
    label: 'Final touches',
    title: 'Almost done',
    subtitle: 'Your ideal day in your words, plus any must-haves or dealbreakers.',
  },
];

// ─── Compact review helpers ───────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
      {children}
    </span>
  );
}

function ReviewRow({ label, value }: { label: string; value: string | string[] | undefined }) {
  const display = Array.isArray(value)
    ? value.join(', ')
    : value;

  if (!display?.trim()) return null;

  return (
    <div className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 shrink-0 w-24 pt-0.5">{label}</span>
      <span className="text-sm text-slate-700 leading-snug">{display}</span>
    </div>
  );
}

function ReviewSection({
  title,
  icon,
  onEdit,
  stepIndex,
  children,
}: {
  title: string;
  icon: string;
  onEdit: (i: number) => void;
  stepIndex: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {icon} {title}
        </span>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="text-xs text-violet-500 hover:text-violet-700 font-medium transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

// ─── PlannerForm ──────────────────────────────────────────────────────────────

export function PlannerForm() {
  const [profile, setProfile] = useState<ItineraryProfile>(defaultProfile);
  const [step, setStep] = useState(0); // 0–3 = form, 4 = review
  const [submitted, setSubmitted] = useState(false);

  const update: UpdateFn = useCallback(
    (key, updates) => {
      setProfile((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...updates },
      }));
    },
    []
  );

  const goNext = () => {
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpTo = (i: number) => {
    setStep(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // Future: await fetch('/api/profile', { method: 'POST', body: JSON.stringify(profile) });
    console.log('Profile ready:', JSON.stringify(profile, null, 2));
    setSubmitted(true);
  };

  const stepProps = { profile, update };
  const { availability: a, party: p, location: l, budget: b,
    activities: ac, food: f, transportation: t, hardConstraints: hc,
    preferences: pr, personalization: pe } = profile;

  // ── Submitted screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-3xl shadow-lg shadow-violet-200 mx-auto mb-6">
          ✦
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile saved!</h2>
        <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
          In the full version, we'd now generate a personalized itinerary — spots, timing, and routing included.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setStep(0);
            setProfile(defaultProfile);
          }}
          className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors text-sm shadow-sm"
        >
          Start a new profile
        </button>
      </div>
    );
  }

  // ── Review screen ─────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Looks good?</h2>
          <p className="text-slate-500 text-sm mt-1">
            Review your profile below — tap any section to edit, or generate your plan.
          </p>
        </div>

        {/* Snapshot pills */}
        {(() => {
          const pills = [
            a.dayType,
            a.pacing,
            b.budgetTier,
            ac.energyLevel,
            l.indoorOutdoor,
            ...p.companions.slice(0, 2),
          ].filter(Boolean) as string[];

          return pills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pills.map((pill, i) => <Pill key={i}>{pill}</Pill>)}
            </div>
          ) : null;
        })()}

        {/* Sections */}
        <ReviewSection title="Your Day" icon="⏰" stepIndex={0} onEdit={jumpTo}>
          <ReviewRow label="When" value={a.startTime && a.endTime ? `${a.startTime} – ${a.endTime}` : a.startTime} />
          <ReviewRow label="Who" value={p.companions} />
          <ReviewRow label="Group" value={p.groupSize > 1 ? `${p.groupSize} people` : undefined} />
          <ReviewRow label="From" value={l.startingLocation} />
          <ReviewRow label="Occasion" value={p.occasion} />
        </ReviewSection>

        <ReviewSection title="Interests & Budget" icon="🎯" stepIndex={1} onEdit={jumpTo}>
          <ReviewRow label="Interests" value={ac.interests.map((i) => i.replace(/^[^\s]+ /, ''))} />
          <ReviewRow label="Budget" value={b.budgetTier} />
          <ReviewRow label="Energy" value={ac.energyLevel} />
          <ReviewRow label="Setting" value={l.indoorOutdoor} />
          <ReviewRow label="Food vibe" value={f.foodVibe} />
          <ReviewRow label="Cuisines" value={f.cuisinesLiked} />
        </ReviewSection>

        <ReviewSection title="Logistics" icon="🚇" stepIndex={2} onEdit={jumpTo}>
          <ReviewRow label="Transport" value={t.modes} />
          <ReviewRow label="Max travel" value={t.maxTravelTime === 999 ? 'Flexible' : `≤ ${t.maxTravelTime} min`} />
          <ReviewRow label="Dietary" value={f.dietaryRestrictions} />
          <ReviewRow label="Accessibility" value={p.accessibilityNeeds} />
        </ReviewSection>

        <ReviewSection title="Must-haves & Vibe" icon="✨" stepIndex={3} onEdit={jumpTo}>
          <ReviewRow label="Ideal day" value={pe.idealDayDescription} />
          <ReviewRow label="Must include" value={hc.mustInclude} />
          <ReviewRow label="Must avoid" value={hc.mustAvoid} />
          <ReviewRow label="Plan style" value={pr.planningStyle} />
        </ReviewSection>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 p-8 text-center text-white shadow-xl shadow-violet-200">
          <p className="text-violet-200 text-sm mb-2">Your profile is ready</p>
          <h3 className="text-xl font-bold mb-4">Generate your itinerary</h3>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-violet-700 font-bold text-sm hover:bg-violet-50 transition-colors shadow-sm"
          >
            ✦ Generate My Itinerary
          </button>
        </div>

        <div className="flex justify-start">
          <button
            type="button"
            onClick={goPrev}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to edit
          </button>
        </div>
      </div>
    );
  }

  // ── Form steps ────────────────────────────────────────────────────────────
  const currentStep = FORM_STEPS[step];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <Stepper
        steps={FORM_STEPS.map((s) => s.label)}
        current={step}
        onSelect={jumpTo}
      />

      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-50">
          <h2 className="text-xl font-bold text-slate-900">{currentStep.title}</h2>
          <p className="text-sm text-slate-400 mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Card body */}
        <div className="px-6 py-6">
          {step === 0 && <YourDayStep {...stepProps} />}
          {step === 1 && <InterestsStep {...stepProps} />}
          {step === 2 && <LogisticsStep {...stepProps} />}
          {step === 3 && <FinalDetailsStep {...stepProps} />}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={goNext}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
            step === FORM_STEPS.length - 1
              ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-700 hover:to-violet-600 shadow-violet-200'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {step === FORM_STEPS.length - 1 ? 'Review my profile →' : 'Continue →'}
        </button>
      </div>

      {/* Skip hint */}
      <p className="text-center text-xs text-slate-300 mt-4">
        All fields are optional — fill what matters most to you.
      </p>
    </div>
  );
}
