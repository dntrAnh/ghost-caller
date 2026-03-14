// ─── Availability ──────────────────────────────────────────────────────────────

export type DayType = 'weekday' | 'weekend' | 'flexible';
export type MealWindow = 'Brunch' | 'Lunch' | 'Dinner';
export type Pacing = 'relaxed' | 'balanced' | 'packed';
export type OutingLength = '1-2 Hours' | 'Half Day' | 'Full Day' | 'Custom';
export type ReservationPreference = 'advance' | 'same-day' | 'walk-in';

export interface AvailabilityPreferences {
  dayType: DayType | '';
  mealWindows: MealWindow[];
  startTime: string;
  endTime: string;
  bufferTime: number; // minutes
  pacing: Pacing | '';
  outingLength: OutingLength | '';
  customOutingLength: string;
  reservationPreference: ReservationPreference | '';
}

// ─── Location ──────────────────────────────────────────────────────────────────

export type TravelRadius = 'under10' | 'under20' | 'under30' | 'under1hr' | 'custom';
export type IndoorOutdoor = 'indoor' | 'outdoor' | 'mixed' | 'weather-dependent';

export interface LocationPreferences {
  startingLocation: string;
  preferredAreas: string[];
  areasToAvoid: string[];
  maxTravelRadius: TravelRadius | '';
  customRadius: string;
  indoorOutdoor: IndoorOutdoor | '';
}

// ─── Transportation ────────────────────────────────────────────────────────────

export type TransportMode = 'Walking' | 'Public Transit' | 'Personal Car' | 'Uber / Lyft' | 'Bike';
export type WalkingTolerance = 'minimal' | 'moderate' | 'lots';

export interface TransportationPreferences {
  modes: TransportMode[];
  maxTravelTime: number; // minutes one-way
  walkingTolerance: WalkingTolerance | '';
  parkingNeeded: boolean;
  avoidTransfers: boolean;
}

// ─── Food ──────────────────────────────────────────────────────────────────────

export interface FoodPreferences {
  cuisinesLiked: string[];
  cuisinesDisliked: string[];
  cravings: string;
  dietaryRestrictions: string[];
  foodVibe: string[];
  foodNotes: string;
}

// ─── Activities ────────────────────────────────────────────────────────────────

export type EnergyLevel = 'chill' | 'moderate' | 'adventurous';
export type SpotPreference = 'iconic' | 'hidden' | 'mix';

export interface ActivityPreferences {
  interests: string[];
  energyLevel: EnergyLevel | '';
  spotPreference: SpotPreference | '';
  socialVibe: string[];
  vibeNote: string;
}

// ─── Party / Social ────────────────────────────────────────────────────────────

export interface PartyContext {
  companions: string[];
  groupSize: number;
  petsComing: boolean;
  childFriendly: boolean;
  occasion: string;
  accessibilityNeeds: string[];
}

// ─── Budget ────────────────────────────────────────────────────────────────────

export type BudgetTier = '$' | '$$' | '$$$' | '$$$$';

export interface BudgetPreferences {
  budgetTier: BudgetTier | '';
  totalBudget: string;
  flexibilityBuffer: string;
  spendingPriority: string[];
}

// ─── Hard Constraints ──────────────────────────────────────────────────────────

export interface HardConstraints {
  mustInclude: string;
  mustAvoid: string;
  timeSensitiveCommitments: string;
  specialNotes: string;
}

// ─── Preference Signals ────────────────────────────────────────────────────────

export type CrowdTolerance = 'avoid' | 'moderate' | 'dont-mind';
export type WeatherSensitivity = 'avoid-bad' | 'okay-adapting' | 'outdoor-regardless';
export type QueueTolerance = 'no-lines' | 'short-okay' | 'long-okay';
export type PlanningStyle = 'structured' | 'flexible' | 'spontaneous';

export interface PreferenceSignals {
  crowdTolerance: CrowdTolerance | '';
  weatherSensitivity: WeatherSensitivity | '';
  queueTolerance: QueueTolerance | '';
  planningStyle: PlanningStyle | '';
}

// ─── Personalization ───────────────────────────────────────────────────────────

export interface PersonalizationNotes {
  idealDayDescription: string;
  personalizedNote: string;
}

// ─── Root Profile ──────────────────────────────────────────────────────────────

export interface ItineraryProfile {
  availability: AvailabilityPreferences;
  location: LocationPreferences;
  transportation: TransportationPreferences;
  food: FoodPreferences;
  activities: ActivityPreferences;
  party: PartyContext;
  budget: BudgetPreferences;
  hardConstraints: HardConstraints;
  preferences: PreferenceSignals;
  personalization: PersonalizationNotes;
}

// ─── Default Profile ───────────────────────────────────────────────────────────

export const defaultProfile: ItineraryProfile = {
  availability: {
    dayType: '',
    mealWindows: [],
    startTime: '10:00',
    endTime: '21:00',
    bufferTime: 15,
    pacing: '',
    outingLength: '',
    customOutingLength: '',
    reservationPreference: '',
  },
  location: {
    startingLocation: '',
    preferredAreas: [],
    areasToAvoid: [],
    maxTravelRadius: '',
    customRadius: '',
    indoorOutdoor: '',
  },
  transportation: {
    modes: [],
    maxTravelTime: 20,
    walkingTolerance: '',
    parkingNeeded: false,
    avoidTransfers: false,
  },
  food: {
    cuisinesLiked: [],
    cuisinesDisliked: [],
    cravings: '',
    dietaryRestrictions: [],
    foodVibe: [],
    foodNotes: '',
  },
  activities: {
    interests: [],
    energyLevel: '',
    spotPreference: '',
    socialVibe: [],
    vibeNote: '',
  },
  party: {
    companions: [],
    groupSize: 2,
    petsComing: false,
    childFriendly: false,
    occasion: '',
    accessibilityNeeds: [],
  },
  budget: {
    budgetTier: '',
    totalBudget: '',
    flexibilityBuffer: '',
    spendingPriority: [],
  },
  hardConstraints: {
    mustInclude: '',
    mustAvoid: '',
    timeSensitiveCommitments: '',
    specialNotes: '',
  },
  preferences: {
    crowdTolerance: '',
    weatherSensitivity: '',
    queueTolerance: '',
    planningStyle: '',
  },
  personalization: {
    idealDayDescription: '',
    personalizedNote: '',
  },
};
