'use client';

import {
  ChipSelect,
  Disclosure,
  Field,
  NumberStepper,
  SegmentedControl,
  TagInput,
  Toggle,
  BudgetCard,
  inputCls,
  textareaCls,
} from './ui';
import type { ItineraryProfile } from '@/types/itinerary';

// ─── Shared update function type ──────────────────────────────────────────────

export type UpdateFn = <K extends keyof ItineraryProfile>(
  key: K,
  updates: Partial<ItineraryProfile[K]>
) => void;

interface StepProps {
  profile: ItineraryProfile;
  update: UpdateFn;
}

// ─── Option constants ─────────────────────────────────────────────────────────

const INTERESTS = [
  '📸 Scenic / Photography', '🏛️ Museums', '🌳 Parks', '☕ Cafes',
  '🛍️ Shopping', '🎶 Live Music', '🛒 Markets', '🗿 Landmarks',
  '🧘 Wellness', '⚽ Active / Sports', '🌙 Nightlife', '✨ Unique Experiences',
];

const FOOD_VIBES = ['Casual', 'Trendy', 'Upscale', 'Local Hidden Gem', 'Aesthetic'];

const TOP_CUISINES = [
  'Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 'Chinese',
  'Korean', 'Mediterranean', 'American', 'Vietnamese', 'French', 'Middle Eastern',
];

const DIETARY = [
  'Vegetarian', 'Vegan', 'Halal', 'Kosher',
  'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Shellfish Allergy', 'Other',
];

const ACCESSIBILITY = [
  'Wheelchair Accessible', 'Minimal Stairs', 'Easy Seating', 'None',
];

const OCCASIONS = [
  'Casual Day Out', 'Date', 'Birthday / Celebration',
  'Showing a Visitor Around', 'Self-Care Day',
];

const BUDGET_TIERS = [
  { tier: '$', label: 'Budget', description: 'Under $50' },
  { tier: '$$', label: 'Moderate', description: '$50–$120' },
  { tier: '$$$', label: 'Splurge', description: '$120–$250' },
  { tier: '$$$$', label: 'No limit', description: '$250+' },
] as const;

const TRAVEL_TIME_OPTIONS = [
  { label: '≤ 15 min', value: '15' },
  { label: '≤ 30 min', value: '30' },
  { label: '≤ 45 min', value: '45' },
  { label: 'Flexible', value: '999' },
];

// ─── Step 1: Your Day ─────────────────────────────────────────────────────────

export function YourDayStep({ profile, update }: StepProps) {
  const { availability: a, party: p, location: l } = profile;
  const isSolo = p.companions.includes('Solo');

  return (
    <div className="space-y-6">
      <Field label="What kind of day is this?">
        <SegmentedControl
          options={[
            { label: '💼 Weekday', value: 'weekday' },
            { label: '🎉 Weekend', value: 'weekend' },
            { label: '✌️ Flexible', value: 'flexible' },
          ]}
          value={a.dayType}
          onChange={(v) => update('availability', { dayType: v as typeof a.dayType })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time">
          <input
            type="time"
            value={a.startTime}
            onChange={(e) => update('availability', { startTime: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Must be back by">
          <input
            type="time"
            value={a.endTime}
            onChange={(e) => update('availability', { endTime: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Who's coming?">
        <ChipSelect
          options={['Solo', 'Partner / Date', 'Friends', 'Family', 'Kids', 'Coworkers']}
          selected={p.companions}
          onChange={(v) => update('party', { companions: v })}
          colorScheme="sky"
        />
      </Field>

      {!isSolo && (
        <Field label="Group size">
          <NumberStepper
            value={p.groupSize}
            onChange={(v) => update('party', { groupSize: v })}
            min={2}
            max={20}
            label="people"
          />
        </Field>
      )}

      <Field label="Starting neighborhood or location">
        <input
          className={inputCls}
          placeholder="e.g., Lower East Side, NYC"
          value={l.startingLocation}
          onChange={(e) => update('location', { startingLocation: e.target.value })}
        />
      </Field>

      {/* Progressive disclosure */}
      <Disclosure label="Add occasion or pacing" hint="— optional">
        <Field label="What's the occasion?" optional>
          <ChipSelect
            options={OCCASIONS}
            selected={p.occasion ? [p.occasion] : []}
            onChange={(v) => update('party', { occasion: v[0] ?? '' })}
            multi={false}
          />
        </Field>

        <Field label="Preferred pacing" optional>
          <SegmentedControl
            options={[
              { label: '😌 Relaxed', value: 'relaxed' },
              { label: '⚖️ Balanced', value: 'balanced' },
              { label: '🔥 Packed', value: 'packed' },
            ]}
            value={a.pacing}
            onChange={(v) => update('availability', { pacing: v as typeof a.pacing })}
          />
        </Field>
      </Disclosure>
    </div>
  );
}

// ─── Step 2: Interests ────────────────────────────────────────────────────────

export function InterestsStep({ profile, update }: StepProps) {
  const { activities: ac, budget: b, location: l } = profile;

  return (
    <div className="space-y-6">
      <Field label="What sounds good today?" helper="Pick everything that feels right">
        <ChipSelect
          options={INTERESTS}
          selected={ac.interests}
          onChange={(v) => update('activities', { interests: v })}
        />
      </Field>

      <Field label="Budget for today">
        <div className="flex gap-2.5">
          {BUDGET_TIERS.map((bt) => (
            <BudgetCard
              key={bt.tier}
              tier={bt.tier}
              label={bt.label}
              description={bt.description}
              selected={b.budgetTier === bt.tier}
              onClick={() => update('budget', { budgetTier: bt.tier })}
            />
          ))}
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Energy level">
          <SegmentedControl
            options={[
              { label: '😴 Chill', value: 'chill' },
              { label: '🙂 Moderate', value: 'moderate' },
              { label: '🏃 Active', value: 'adventurous' },
            ]}
            value={ac.energyLevel}
            onChange={(v) => update('activities', { energyLevel: v as typeof ac.energyLevel })}
          />
        </Field>

        <Field label="Setting">
          <SegmentedControl
            options={[
              { label: '🏠 Indoor', value: 'indoor' },
              { label: '🔀 Mixed', value: 'mixed' },
              { label: '🌿 Outdoor', value: 'outdoor' },
            ]}
            value={l.indoorOutdoor}
            onChange={(v) => update('location', { indoorOutdoor: v as typeof l.indoorOutdoor })}
          />
        </Field>
      </div>

      {/* Progressive disclosure: food */}
      <Disclosure label="Add food preferences" hint="— cuisines, vibe, cravings">
        <Field label="Food vibe" optional>
          <ChipSelect
            options={FOOD_VIBES}
            selected={profile.food.foodVibe}
            onChange={(v) => update('food', { foodVibe: v })}
            colorScheme="emerald"
          />
        </Field>

        <Field label="Cuisines you love" optional>
          <ChipSelect
            options={TOP_CUISINES}
            selected={profile.food.cuisinesLiked}
            onChange={(v) => update('food', { cuisinesLiked: v })}
            colorScheme="emerald"
          />
          <div className="mt-2">
            <TagInput
              values={profile.food.cuisinesLiked.filter((c) => !TOP_CUISINES.includes(c))}
              onChange={(custom) =>
                update('food', {
                  cuisinesLiked: [
                    ...profile.food.cuisinesLiked.filter((c) => TOP_CUISINES.includes(c)),
                    ...custom,
                  ],
                })
              }
              placeholder="Add another cuisine…"
              colorScheme="emerald"
            />
          </div>
        </Field>

        <Field label="Any specific cravings?" optional>
          <input
            className={inputCls}
            placeholder="e.g., good espresso, something spicy, dessert…"
            value={profile.food.cravings}
            onChange={(e) => update('food', { cravings: e.target.value })}
          />
        </Field>
      </Disclosure>

      {/* Progressive disclosure: vibe */}
      <Disclosure label="Refine the vibe" hint="— atmosphere, spot type">
        <Field label="Atmosphere" optional>
          <ChipSelect
            options={['Quiet', 'Cozy', 'Lively', 'Energetic', 'Luxurious', 'Artsy']}
            selected={ac.socialVibe}
            onChange={(v) => update('activities', { socialVibe: v })}
            colorScheme="amber"
          />
        </Field>

        <Field label="Spot preference" optional>
          <SegmentedControl
            options={[
              { label: '🏆 Iconic', value: 'iconic' },
              { label: '🔍 Hidden gems', value: 'hidden' },
              { label: '🎲 Mix', value: 'mix' },
            ]}
            value={ac.spotPreference}
            onChange={(v) => update('activities', { spotPreference: v as typeof ac.spotPreference })}
          />
        </Field>
      </Disclosure>
    </div>
  );
}

// ─── Step 3: Logistics ────────────────────────────────────────────────────────

export function LogisticsStep({ profile, update }: StepProps) {
  const { transportation: t, availability: a } = profile;

  const needsParking = t.modes.some(
    (m) => m === 'Personal Car' || m === 'Uber / Lyft'
  );
  const hasKids =
    profile.party.companions.includes('Kids') ||
    profile.party.companions.includes('Family');

  return (
    <div className="space-y-6">
      <Field label="How are you getting around?" helper="Select all that apply">
        <ChipSelect
          options={['Walking', 'Public Transit', 'Personal Car', 'Uber / Lyft', 'Bike']}
          selected={t.modes}
          onChange={(v) =>
            update('transportation', { modes: v as typeof t.modes })
          }
          colorScheme="sky"
        />
      </Field>

      <Field label="Max travel time between stops">
        <SegmentedControl
          options={TRAVEL_TIME_OPTIONS}
          value={String(t.maxTravelTime)}
          onChange={(v) => update('transportation', { maxTravelTime: Number(v) })}
        />
      </Field>

      {/* Conditional: parking (only shown when driving) */}
      {needsParking && (
        <Toggle
          checked={t.parkingNeeded}
          onChange={(v) => update('transportation', { parkingNeeded: v })}
          label="Factor in parking"
          description="We'll prefer parking-friendly locations"
        />
      )}

      {/* Conditional: child-friendly (only shown when family/kids selected) */}
      {hasKids && (
        <Toggle
          checked={profile.party.childFriendly}
          onChange={(v) => update('party', { childFriendly: v })}
          label="Keep it child-friendly"
          description="Prioritize family-appropriate venues"
        />
      )}

      {/* Progressive disclosure: dietary & accessibility */}
      <Disclosure label="Dietary needs or accessibility" hint="— optional">
        <Field label="Dietary restrictions" optional>
          <ChipSelect
            options={DIETARY}
            selected={profile.food.dietaryRestrictions}
            onChange={(v) => update('food', { dietaryRestrictions: v })}
            colorScheme="amber"
          />
        </Field>

        <Field label="Accessibility needs" optional>
          <ChipSelect
            options={ACCESSIBILITY}
            selected={profile.party.accessibilityNeeds}
            onChange={(v) => update('party', { accessibilityNeeds: v })}
            colorScheme="emerald"
          />
        </Field>
      </Disclosure>

      {/* Progressive disclosure: booking */}
      <Disclosure label="Booking preferences" hint="— optional">
        <Field label="Reservation style" optional>
          <SegmentedControl
            options={[
              { label: 'Walk-in only', value: 'walk-in' },
              { label: 'Same-day OK', value: 'same-day' },
              { label: 'Book ahead', value: 'advance' },
            ]}
            value={a.reservationPreference}
            onChange={(v) =>
              update('availability', { reservationPreference: v as typeof a.reservationPreference })
            }
          />
        </Field>

        <Toggle
          checked={t.avoidTransfers}
          onChange={(v) => update('transportation', { avoidTransfers: v })}
          label="Avoid transit transfers"
          description="Prefer direct routes where possible"
        />
      </Disclosure>
    </div>
  );
}

// ─── Step 4: Final Details ────────────────────────────────────────────────────

export function FinalDetailsStep({ profile, update }: StepProps) {
  const { hardConstraints: hc, preferences: pr, personalization: pe } = profile;

  return (
    <div className="space-y-6">
      <Field
        label="Describe your ideal day"
        helper="A sentence or two is perfect — this helps the most"
      >
        <textarea
          className={textareaCls}
          rows={3}
          placeholder="e.g., A slow creative morning wandering galleries and coffee shops, long lunch somewhere with great vibes, ending somewhere lively but not too loud…"
          value={pe.idealDayDescription}
          onChange={(e) => update('personalization', { idealDayDescription: e.target.value })}
        />
      </Field>

      <Field label="Must-includes" optional helper="Any spots or experiences non-negotiable?">
        <textarea
          className={textareaCls}
          rows={2}
          placeholder="e.g., Want to see the High Line, need a good coffee stop…"
          value={hc.mustInclude}
          onChange={(e) => update('hardConstraints', { mustInclude: e.target.value })}
        />
      </Field>

      <div className="rounded-xl border-2 border-red-100 bg-red-50/40 p-4 space-y-2">
        <div className="flex items-center gap-1.5">
          <span>🚫</span>
          <span className="text-sm font-semibold text-red-700">Dealbreakers</span>
          <span className="text-xs text-red-400 ml-1">optional</span>
        </div>
        <textarea
          className="w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none transition-colors"
          rows={2}
          placeholder="e.g., No Times Square, no chain restaurants, avoid Midtown…"
          value={hc.mustAvoid}
          onChange={(e) => update('hardConstraints', { mustAvoid: e.target.value })}
        />
      </div>

      {/* Progressive disclosure: advanced preferences */}
      <Disclosure label="Fine-tune your plan" hint="— crowds, queues, planning style">
        <Field label="Planning style" optional>
          <SegmentedControl
            options={[
              { label: '📋 Structured', value: 'structured' },
              { label: '🌊 Flexible', value: 'flexible' },
              { label: '🎲 Spontaneous', value: 'spontaneous' },
            ]}
            value={pr.planningStyle}
            onChange={(v) => update('preferences', { planningStyle: v as typeof pr.planningStyle })}
          />
        </Field>

        <Field label="Crowd tolerance" optional>
          <SegmentedControl
            options={[
              { label: '🙈 Avoid crowds', value: 'avoid' },
              { label: '🙂 Some OK', value: 'moderate' },
              { label: '🎉 No issue', value: 'dont-mind' },
            ]}
            value={pr.crowdTolerance}
            onChange={(v) => update('preferences', { crowdTolerance: v as typeof pr.crowdTolerance })}
          />
        </Field>

        <Field label="Wait / queue tolerance" optional>
          <SegmentedControl
            options={[
              { label: '⚡ No lines', value: 'no-lines' },
              { label: '⏳ Short OK', value: 'short-okay' },
              { label: '🎫 Worth it', value: 'long-okay' },
            ]}
            value={pr.queueTolerance}
            onChange={(v) => update('preferences', { queueTolerance: v as typeof pr.queueTolerance })}
          />
        </Field>

        <Field label="Weather sensitivity" optional>
          <SegmentedControl
            options={[
              { label: '🌧️ Avoid outdoors', value: 'avoid-bad' },
              { label: '☁️ Adaptable', value: 'okay-adapting' },
              { label: '🌤️ Outdoors anyway', value: 'outdoor-regardless' },
            ]}
            value={pr.weatherSensitivity}
            onChange={(v) =>
              update('preferences', { weatherSensitivity: v as typeof pr.weatherSensitivity })
            }
          />
        </Field>

        <Field label="Anything else?" optional>
          <textarea
            className={textareaCls}
            rows={2}
            placeholder="Anything else we should know…"
            value={hc.specialNotes}
            onChange={(e) => update('hardConstraints', { specialNotes: e.target.value })}
          />
        </Field>
      </Disclosure>
    </div>
  );
}
