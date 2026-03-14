'use client';

import {
  ChipSelect,
  Field,
  NumberStepper,
  RangeSlider,
  SectionCard,
  SegmentedControl,
  TagInput,
  Toggle,
  BudgetCard,
  inputCls,
  textareaCls,
} from './ui';
import type {
  AvailabilityPreferences,
  LocationPreferences,
  TransportationPreferences,
  FoodPreferences,
  ActivityPreferences,
  PartyContext,
  BudgetPreferences,
  HardConstraints,
  PreferenceSignals,
  PersonalizationNotes,
} from '@/types/itinerary';

// ─── Option Constants ──────────────────────────────────────────────────────────

const CUISINES = [
  'Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 'Chinese', 'French',
  'Korean', 'Mediterranean', 'American', 'Vietnamese', 'Greek', 'Spanish',
  'Middle Eastern', 'Ethiopian', 'Brazilian', 'Peruvian', 'Sushi', 'Pizza',
  'Burgers', 'Ramen', 'Tacos', 'BBQ',
];

const DIETARY = [
  'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free',
  'Nut Allergy', 'Shellfish Allergy', 'Lactose Intolerant', 'Other',
];

const FOOD_VIBES = [
  'Casual', 'Trendy', 'Upscale', 'Local Hidden Gem', 'Aesthetic / Instagrammable',
];

const INTERESTS = [
  '📸 Scenic / Photography', '🌙 Nightlife', '🏛️ Museums', '🌳 Parks',
  '🛍️ Shopping', '☕ Cafes', '🗿 Landmarks', '🎶 Live Music', '🛒 Markets',
  '🧘 Wellness / Relaxing', '⚽ Active / Sports', '✨ Unique Experiences',
];

const SOCIAL_VIBES = ['Quiet', 'Cozy', 'Lively', 'Energetic', 'Luxurious', 'Artsy'];

const COMPANIONS = ['Solo', 'Partner / Date', 'Friends', 'Family', 'Kids', 'Coworkers'];

const OCCASIONS = [
  'Casual Day Out', 'Date', 'Birthday', 'Celebration',
  'Showing a Visitor Around', 'Self-Care Day', 'Other',
];

const ACCESSIBILITY = [
  'Wheelchair Accessible', 'Minimal Stairs', 'Easy Seating Access', 'None', 'Other',
];

const SPENDING_PRIORITY = ['Food', 'Activities', 'Views / Scenic', 'Shopping', 'Balanced'];

// ─── 1 · Availability Section ─────────────────────────────────────────────────

interface AvailabilitySectionProps {
  data: AvailabilityPreferences;
  onChange: (updates: Partial<AvailabilityPreferences>) => void;
}

export function AvailabilitySection({ data, onChange }: AvailabilitySectionProps) {
  return (
    <SectionCard
      icon="⏰"
      title="Timing & Availability"
      description="When are you heading out, and how long do you have?"
    >
      <Field label="What kind of day is this?">
        <SegmentedControl
          options={[
            { label: 'Weekday', value: 'weekday' },
            { label: 'Weekend', value: 'weekend' },
            { label: 'Flexible', value: 'flexible' },
          ]}
          value={data.dayType}
          onChange={(v) => onChange({ dayType: v as AvailabilityPreferences['dayType'] })}
        />
      </Field>

      <Field label="Meal windows you want covered" optional helper="Which meals do you want built into the itinerary?">
        <ChipSelect
          options={['Brunch', 'Lunch', 'Dinner']}
          selected={data.mealWindows}
          onChange={(v) => onChange({ mealWindows: v as AvailabilityPreferences['mealWindows'] })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time">
          <input
            type="time"
            value={data.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Must be back by">
          <input
            type="time"
            value={data.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        label="Buffer time between activities"
        helper="Minimum breathing room between stops"
      >
        <RangeSlider
          min={5}
          max={60}
          step={5}
          value={data.bufferTime}
          onChange={(v) => onChange({ bufferTime: v })}
          formatValue={(v) => `${v} min`}
        />
      </Field>

      <Field label="Preferred pacing">
        <SegmentedControl
          options={[
            { label: '😌 Relaxed', value: 'relaxed' },
            { label: '⚖️ Balanced', value: 'balanced' },
            { label: '🔥 Packed', value: 'packed' },
          ]}
          value={data.pacing}
          onChange={(v) => onChange({ pacing: v as AvailabilityPreferences['pacing'] })}
        />
      </Field>

      <Field label="Outing length">
        <ChipSelect
          options={['1-2 Hours', 'Half Day', 'Full Day', 'Custom']}
          selected={data.outingLength ? [data.outingLength] : []}
          onChange={(v) =>
            onChange({ outingLength: (v[0] ?? '') as AvailabilityPreferences['outingLength'] })
          }
          multi={false}
        />
        {data.outingLength === 'Custom' && (
          <input
            className={`${inputCls} mt-2`}
            placeholder="e.g., 3–4 hours"
            value={data.customOutingLength}
            onChange={(e) => onChange({ customOutingLength: e.target.value })}
          />
        )}
      </Field>

      <Field label="Reservation preference">
        <SegmentedControl
          options={[
            { label: 'Book Ahead', value: 'advance' },
            { label: 'Same-Day', value: 'same-day' },
            { label: 'Walk-In Only', value: 'walk-in' },
          ]}
          value={data.reservationPreference}
          onChange={(v) =>
            onChange({ reservationPreference: v as AvailabilityPreferences['reservationPreference'] })
          }
        />
      </Field>
    </SectionCard>
  );
}

// ─── 2 · Location Section ─────────────────────────────────────────────────────

interface LocationSectionProps {
  data: LocationPreferences;
  onChange: (updates: Partial<LocationPreferences>) => void;
}

export function LocationSection({ data, onChange }: LocationSectionProps) {
  return (
    <SectionCard
      icon="📍"
      title="Location & Area"
      description="Where are you starting from, and where do you want to explore?"
    >
      <Field label="Starting location or neighborhood" helper="Your home base for the day">
        <input
          className={inputCls}
          placeholder="e.g., Lower East Side, NYC"
          value={data.startingLocation}
          onChange={(e) => onChange({ startingLocation: e.target.value })}
        />
      </Field>

      <Field label="Preferred areas to include" optional helper="Add neighborhoods or districts you'd love to visit">
        <TagInput
          values={data.preferredAreas}
          onChange={(v) => onChange({ preferredAreas: v })}
          placeholder="e.g., West Village, Williamsburg…"
        />
      </Field>

      <Field label="Areas to avoid" optional helper="Neighborhoods or zones you'd rather skip">
        <TagInput
          values={data.areasToAvoid}
          onChange={(v) => onChange({ areasToAvoid: v })}
          placeholder="e.g., Midtown, tourist traps…"
          colorScheme="rose"
        />
      </Field>

      <Field label="Maximum travel radius">
        <div className="flex flex-wrap gap-2">
          {[
            { label: '< 10 min', value: 'under10' },
            { label: '< 20 min', value: 'under20' },
            { label: '< 30 min', value: 'under30' },
            { label: '< 1 hr', value: 'under1hr' },
            { label: 'Custom', value: 'custom' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ maxTravelRadius: opt.value as LocationPreferences['maxTravelRadius'] })}
              className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 ${
                data.maxTravelRadius === opt.value
                  ? 'bg-violet-100 text-violet-700 border-violet-300 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-200 hover:text-violet-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {data.maxTravelRadius === 'custom' && (
          <input
            className={`${inputCls} mt-2`}
            placeholder="Describe your travel range…"
            value={data.customRadius}
            onChange={(e) => onChange({ customRadius: e.target.value })}
          />
        )}
      </Field>

      <Field label="Indoor / Outdoor preference">
        <SegmentedControl
          options={[
            { label: '🏠 Indoor', value: 'indoor' },
            { label: '🌿 Outdoor', value: 'outdoor' },
            { label: '🔀 Mixed', value: 'mixed' },
            { label: '🌤️ Weather-based', value: 'weather-dependent' },
          ]}
          value={data.indoorOutdoor}
          onChange={(v) => onChange({ indoorOutdoor: v as LocationPreferences['indoorOutdoor'] })}
        />
      </Field>
    </SectionCard>
  );
}

// ─── 3 · Transport Section ────────────────────────────────────────────────────

interface TransportSectionProps {
  data: TransportationPreferences;
  onChange: (updates: Partial<TransportationPreferences>) => void;
}

export function TransportSection({ data, onChange }: TransportSectionProps) {
  return (
    <SectionCard
      icon="🚇"
      title="Getting Around"
      description="How will you be moving through the city today?"
    >
      <Field label="Transportation modes" helper="Select all that apply">
        <ChipSelect
          options={['Walking', 'Public Transit', 'Personal Car', 'Uber / Lyft', 'Bike']}
          selected={data.modes}
          onChange={(v) =>
            onChange({ modes: v as TransportationPreferences['modes'] })
          }
          colorScheme="sky"
        />
      </Field>

      <Field label="Max one-way travel time between stops">
        <RangeSlider
          min={5}
          max={60}
          step={5}
          value={data.maxTravelTime}
          onChange={(v) => onChange({ maxTravelTime: v })}
          formatValue={(v) => `${v} min`}
        />
      </Field>

      <Field label="Walking tolerance">
        <SegmentedControl
          options={[
            { label: '🐢 Minimal', value: 'minimal' },
            { label: '🚶 Moderate', value: 'moderate' },
            { label: '👟 Love it', value: 'lots' },
          ]}
          value={data.walkingTolerance}
          onChange={(v) =>
            onChange({ walkingTolerance: v as TransportationPreferences['walkingTolerance'] })
          }
        />
      </Field>

      <div className="space-y-2">
        <Toggle
          checked={data.parkingNeeded}
          onChange={(v) => onChange({ parkingNeeded: v })}
          label="Parking needed"
          description="Factor in parking-friendly locations"
        />
        <Toggle
          checked={data.avoidTransfers}
          onChange={(v) => onChange({ avoidTransfers: v })}
          label="Avoid transit transfers"
          description="Prefer direct routes where possible"
        />
      </div>
    </SectionCard>
  );
}

// ─── 4 · Food Section ─────────────────────────────────────────────────────────

interface FoodSectionProps {
  data: FoodPreferences;
  onChange: (updates: Partial<FoodPreferences>) => void;
}

export function FoodSection({ data, onChange }: FoodSectionProps) {
  return (
    <SectionCard
      icon="🍽️"
      title="Food & Dining"
      description="Tell us what you're craving and any restrictions we should know about."
    >
      <Field label="Cuisines you love" optional helper="Select from the list or add your own">
        <ChipSelect
          options={CUISINES}
          selected={data.cuisinesLiked}
          onChange={(v) => onChange({ cuisinesLiked: v })}
          colorScheme="emerald"
        />
        <div className="mt-2">
          <TagInput
            values={data.cuisinesLiked.filter((c) => !CUISINES.includes(c))}
            onChange={(custom) =>
              onChange({
                cuisinesLiked: [
                  ...data.cuisinesLiked.filter((c) => CUISINES.includes(c)),
                  ...custom,
                ],
              })
            }
            placeholder="Add a cuisine not listed…"
            colorScheme="emerald"
          />
        </div>
      </Field>

      <Field label="Cuisines to avoid" optional helper="We'll steer clear of these">
        <ChipSelect
          options={CUISINES}
          selected={data.cuisinesDisliked}
          onChange={(v) => onChange({ cuisinesDisliked: v })}
          colorScheme="rose"
        />
      </Field>

      <Field label="Any specific cravings today?" optional>
        <input
          className={inputCls}
          placeholder="e.g., dumplings, a good espresso, something spicy…"
          value={data.cravings}
          onChange={(e) => onChange({ cravings: e.target.value })}
        />
      </Field>

      <Field label="Dietary restrictions" optional>
        <ChipSelect
          options={DIETARY}
          selected={data.dietaryRestrictions}
          onChange={(v) => onChange({ dietaryRestrictions: v })}
          colorScheme="amber"
        />
      </Field>

      <Field label="Food vibe" helper="What kind of dining experience fits today?">
        <ChipSelect
          options={FOOD_VIBES}
          selected={data.foodVibe}
          onChange={(v) => onChange({ foodVibe: v })}
        />
      </Field>

      <Field label="Anything else about food preferences?" optional>
        <textarea
          className={textareaCls}
          rows={3}
          placeholder="e.g., I always want to try something new, no chains please, outdoor seating is a plus…"
          value={data.foodNotes}
          onChange={(e) => onChange({ foodNotes: e.target.value })}
        />
      </Field>
    </SectionCard>
  );
}

// ─── 5 · Activities Section ───────────────────────────────────────────────────

interface ActivitiesSectionProps {
  data: ActivityPreferences;
  onChange: (updates: Partial<ActivityPreferences>) => void;
}

export function ActivitiesSection({ data, onChange }: ActivitiesSectionProps) {
  return (
    <SectionCard
      icon="🎯"
      title="Activities & Interests"
      description="What kind of experiences make your day feel complete?"
    >
      <Field label="What are you into?" helper="Select everything that sounds good today">
        <ChipSelect
          options={INTERESTS}
          selected={data.interests}
          onChange={(v) => onChange({ interests: v })}
        />
      </Field>

      <Field label="Energy level today">
        <SegmentedControl
          options={[
            { label: '😴 Chill', value: 'chill' },
            { label: '🙂 Moderate', value: 'moderate' },
            { label: '🏃 Adventurous', value: 'adventurous' },
          ]}
          value={data.energyLevel}
          onChange={(v) => onChange({ energyLevel: v as ActivityPreferences['energyLevel'] })}
        />
      </Field>

      <Field label="Spot preference">
        <SegmentedControl
          options={[
            { label: '🏆 Iconic Spots', value: 'iconic' },
            { label: '🔍 Hidden Gems', value: 'hidden' },
            { label: '🎲 Mix of Both', value: 'mix' },
          ]}
          value={data.spotPreference}
          onChange={(v) => onChange({ spotPreference: v as ActivityPreferences['spotPreference'] })}
        />
      </Field>

      <Field label="Atmosphere / social vibe" optional helper="Pick all that resonate">
        <ChipSelect
          options={SOCIAL_VIBES}
          selected={data.socialVibe}
          onChange={(v) => onChange({ socialVibe: v })}
          colorScheme="amber"
        />
      </Field>

      <Field label="What kind of vibe are you hoping for today?" optional>
        <textarea
          className={textareaCls}
          rows={3}
          placeholder="e.g., Slow morning, creative afternoon, ending somewhere with good drinks and music…"
          value={data.vibeNote}
          onChange={(e) => onChange({ vibeNote: e.target.value })}
        />
      </Field>
    </SectionCard>
  );
}

// ─── 6 · Party Section ────────────────────────────────────────────────────────

interface PartySectionProps {
  data: PartyContext;
  onChange: (updates: Partial<PartyContext>) => void;
}

export function PartySection({ data, onChange }: PartySectionProps) {
  return (
    <SectionCard
      icon="👥"
      title="Who's Coming?"
      description="Tell us about your group so we can tailor the experience."
    >
      <Field label="Who are you going with?" helper="Select all that apply">
        <ChipSelect
          options={COMPANIONS}
          selected={data.companions}
          onChange={(v) => onChange({ companions: v })}
          colorScheme="sky"
        />
      </Field>

      <Field label="Group size">
        <NumberStepper
          value={data.groupSize}
          onChange={(v) => onChange({ groupSize: v })}
          min={1}
          max={20}
          label="people"
        />
      </Field>

      <Field label="What's the occasion?">
        <ChipSelect
          options={OCCASIONS}
          selected={data.occasion ? [data.occasion] : []}
          onChange={(v) => onChange({ occasion: v[0] ?? '' })}
          multi={false}
        />
      </Field>

      <div className="space-y-2">
        <Toggle
          checked={data.petsComing}
          onChange={(v) => onChange({ petsComing: v })}
          label="Pets coming along"
          description="We'll include pet-friendly spots"
        />
        <Toggle
          checked={data.childFriendly}
          onChange={(v) => onChange({ childFriendly: v })}
          label="Child-friendly required"
          description="Prioritize family-appropriate venues and activities"
        />
      </div>

      <Field label="Accessibility needs" optional helper="We'll filter for venues that accommodate these">
        <ChipSelect
          options={ACCESSIBILITY}
          selected={data.accessibilityNeeds}
          onChange={(v) => onChange({ accessibilityNeeds: v })}
          colorScheme="emerald"
        />
      </Field>
    </SectionCard>
  );
}

// ─── 7 · Budget Section ───────────────────────────────────────────────────────

interface BudgetSectionProps {
  data: BudgetPreferences;
  onChange: (updates: Partial<BudgetPreferences>) => void;
}

const BUDGET_TIERS = [
  { tier: '$', label: 'Budget-Friendly', description: 'Under $50' },
  { tier: '$$', label: 'Moderate', description: '$50 – $120' },
  { tier: '$$$', label: 'Splurge-Worthy', description: '$120 – $250' },
  { tier: '$$$$', label: 'No Limits', description: '$250+' },
] as const;

export function BudgetSection({ data, onChange }: BudgetSectionProps) {
  return (
    <SectionCard
      icon="💰"
      title="Budget"
      description="Set your spending comfort zone for today's outing."
    >
      <Field label="Budget tier">
        <div className="flex gap-3 flex-wrap">
          {BUDGET_TIERS.map((b) => (
            <BudgetCard
              key={b.tier}
              tier={b.tier}
              label={b.label}
              description={b.description}
              selected={data.budgetTier === b.tier}
              onClick={() => onChange({ budgetTier: b.tier })}
            />
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Approximate total budget" optional helper="Rough number is fine">
          <input
            className={inputCls}
            placeholder="e.g., $150"
            value={data.totalBudget}
            onChange={(e) => onChange({ totalBudget: e.target.value })}
          />
        </Field>
        <Field label="Flexibility buffer" optional helper="How much flex do you have?">
          <input
            className={inputCls}
            placeholder="e.g., ±$30"
            value={data.flexibilityBuffer}
            onChange={(e) => onChange({ flexibilityBuffer: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Spending priority" optional helper="Where should we focus the budget?">
        <ChipSelect
          options={SPENDING_PRIORITY}
          selected={data.spendingPriority}
          onChange={(v) => onChange({ spendingPriority: v })}
          colorScheme="amber"
        />
      </Field>
    </SectionCard>
  );
}

// ─── 8 · Constraints Section ──────────────────────────────────────────────────

interface ConstraintsSectionProps {
  data: HardConstraints;
  onChange: (updates: Partial<HardConstraints>) => void;
}

export function ConstraintsSection({ data, onChange }: ConstraintsSectionProps) {
  return (
    <SectionCard
      icon="📋"
      title="Must-Haves & No-Go's"
      description="Hard requirements and veto list — we'll plan around these."
    >
      <Field label="Must-include places or activities" optional helper="Anything non-negotiable to include?">
        <textarea
          className={textareaCls}
          rows={3}
          placeholder="e.g., Stop by the farmer's market, want to see Central Park, need coffee from a specific spot…"
          value={data.mustInclude}
          onChange={(e) => onChange({ mustInclude: e.target.value })}
        />
      </Field>

      <div className="rounded-xl border-2 border-red-100 bg-red-50/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🚫</span>
          <p className="text-sm font-semibold text-red-700">Avoid at All Costs</p>
        </div>
        <p className="text-xs text-red-400">These will be completely excluded from your itinerary.</p>
        <textarea
          className="w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none transition-colors"
          rows={3}
          placeholder="e.g., No Times Square, no chain restaurants, avoid anything too touristy…"
          value={data.mustAvoid}
          onChange={(e) => onChange({ mustAvoid: e.target.value })}
        />
      </div>

      <Field label="Time-sensitive commitments" optional helper="Any appointments or windows to work around during the outing?">
        <textarea
          className={textareaCls}
          rows={2}
          placeholder="e.g., Call at 3pm, need to be back by 7pm for dinner reservation…"
          value={data.timeSensitiveCommitments}
          onChange={(e) => onChange({ timeSensitiveCommitments: e.target.value })}
        />
      </Field>

      <Field label="Special notes or constraints" optional>
        <textarea
          className={textareaCls}
          rows={2}
          placeholder="Anything else we should know to build a better plan?"
          value={data.specialNotes}
          onChange={(e) => onChange({ specialNotes: e.target.value })}
        />
      </Field>
    </SectionCard>
  );
}

// ─── 9 · Signals Section ─────────────────────────────────────────────────────

interface SignalsSectionProps {
  data: PreferenceSignals;
  onChange: (updates: Partial<PreferenceSignals>) => void;
}

export function SignalsSection({ data, onChange }: SignalsSectionProps) {
  return (
    <SectionCard
      icon="🎛️"
      title="Your Preferences"
      description="Fine-tune how we handle crowds, weather, lines, and planning style."
    >
      <Field label="Crowd tolerance">
        <SegmentedControl
          options={[
            { label: '🙈 Avoid Crowds', value: 'avoid' },
            { label: '🙂 Moderate OK', value: 'moderate' },
            { label: '🎉 Don\'t Mind', value: 'dont-mind' },
          ]}
          value={data.crowdTolerance}
          onChange={(v) => onChange({ crowdTolerance: v as PreferenceSignals['crowdTolerance'] })}
        />
      </Field>

      <Field label="Weather sensitivity">
        <SegmentedControl
          options={[
            { label: '🌧️ Avoid Outdoors', value: 'avoid-bad' },
            { label: '☁️ Okay Adapting', value: 'okay-adapting' },
            { label: '🌤️ Stay Outdoors', value: 'outdoor-regardless' },
          ]}
          value={data.weatherSensitivity}
          onChange={(v) =>
            onChange({ weatherSensitivity: v as PreferenceSignals['weatherSensitivity'] })
          }
        />
      </Field>

      <Field label="Queue / wait tolerance">
        <SegmentedControl
          options={[
            { label: '⚡ No Lines', value: 'no-lines' },
            { label: '⏳ Short OK', value: 'short-okay' },
            { label: '🎫 Worth the Wait', value: 'long-okay' },
          ]}
          value={data.queueTolerance}
          onChange={(v) => onChange({ queueTolerance: v as PreferenceSignals['queueTolerance'] })}
        />
      </Field>

      <Field label="Planning style">
        <SegmentedControl
          options={[
            { label: '📋 Structured', value: 'structured' },
            { label: '🌊 Flexible', value: 'flexible' },
            { label: '🎲 Spontaneous', value: 'spontaneous' },
          ]}
          value={data.planningStyle}
          onChange={(v) => onChange({ planningStyle: v as PreferenceSignals['planningStyle'] })}
        />
      </Field>
    </SectionCard>
  );
}

// ─── 10 · Personalization Section ────────────────────────────────────────────

interface PersonalizationSectionProps {
  data: PersonalizationNotes;
  onChange: (updates: Partial<PersonalizationNotes>) => void;
}

export function PersonalizationSection({ data, onChange }: PersonalizationSectionProps) {
  return (
    <SectionCard
      icon="✨"
      title="Tell Us More"
      description="Help us make this day feel truly yours."
    >
      <Field
        label="Describe your ideal day out in a sentence or two"
        helper="Let the planner understand the feeling you're going for"
      >
        <textarea
          className={textareaCls}
          rows={4}
          placeholder="e.g., A slow, exploratory morning wandering through galleries and coffee shops, followed by a long lunch somewhere with great ambiance, and ending somewhere lively but not too loud…"
          value={data.idealDayDescription}
          onChange={(e) => onChange({ idealDayDescription: e.target.value })}
        />
        <p className="text-xs text-slate-400 mt-1">{data.idealDayDescription.length} / 400</p>
      </Field>

      <Field
        label="Anything the planner should know to make this feel personalized?"
        optional
        helper="Surprises, inside jokes, specific moods, relationship context — whatever helps"
      >
        <textarea
          className={textareaCls}
          rows={4}
          placeholder="e.g., It's my partner's first time in the city — they love architecture and hate tourist traps. We want to end somewhere with a view at sunset…"
          value={data.personalizedNote}
          onChange={(e) => onChange({ personalizedNote: e.target.value })}
        />
      </Field>
    </SectionCard>
  );
}
