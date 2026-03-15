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
    dayType: 'weekend',
    mealWindows: ['Brunch', 'Dinner'],
    startTime: '11:00',
    endTime: '21:30',
    bufferTime: 20,
    pacing: 'balanced',
    outingLength: 'Full Day',
    customOutingLength: '',
    reservationPreference: 'advance',
  },
  location: {
    startingLocation: 'West Village, Manhattan',
    preferredAreas: ['West Village', 'Chelsea', 'SoHo'],
    areasToAvoid: ['Times Square'],
    maxTravelRadius: 'under30',
    customRadius: '',
    indoorOutdoor: 'mixed',
  },
  transportation: {
    modes: ['Walking', 'Public Transit'],
    maxTravelTime: 30,
    walkingTolerance: 'moderate',
    parkingNeeded: false,
    avoidTransfers: true,
  },
  food: {
    cuisinesLiked: ['Italian', 'Japanese', 'Mediterranean'],
    cuisinesDisliked: ['Steakhouses', 'Fast Food'],
    cravings: 'great coffee, fresh pasta, and one memorable cocktail stop',
    dietaryRestrictions: ['Vegetarian'],
    foodVibe: ['Trendy', 'Local Hidden Gem'],
    foodNotes: 'Prefer places that feel distinctly New York and work well for a group of friends.',
  },
  activities: {
    interests: ['Scenic / Photography', 'Cafes', 'Shopping', 'Museums'],
    energyLevel: 'moderate',
    spotPreference: 'mix',
    socialVibe: ['Cozy', 'Artsy'],
    vibeNote: 'A neighborhood-forward day with good design, strong food, and a little browsing in between.',
  },
  party: {
    companions: ['Friends'],
    groupSize: 4,
    petsComing: false,
    childFriendly: false,
    occasion: 'Showing a Visitor Around',
    accessibilityNeeds: ['Easy Seating'],
  },
  budget: {
    budgetTier: '$$',
    totalBudget: '$75-$125 per person',
    flexibilityBuffer: 'Happy to splurge a bit for one standout meal or rooftop view.',
    spendingPriority: ['Food', 'Views / Scenic', 'Balanced'],
  },
  hardConstraints: {
    mustInclude: 'A strong coffee stop, one scenic walk, and dinner somewhere reservation-worthy.',
    mustAvoid: 'No Times Square, no chain restaurants, and no long crosstown detours.',
    timeSensitiveCommitments: 'Need to wrap near downtown by around 9:30 PM.',
    specialNotes: 'Keep the flow walkable and social, with enough breathing room to linger if a place is great.',
  },
  preferences: {
    crowdTolerance: 'moderate',
    weatherSensitivity: 'okay-adapting',
    queueTolerance: 'short-okay',
    planningStyle: 'flexible',
  },
  personalization: {
    idealDayDescription:
      'A polished NYC day for four friends: start with a great coffee and a walkable neighborhood stretch, mix in a little shopping or art, keep transit light, and end with dinner that feels worth planning around.',
    personalizedNote:
      'This should feel energetic but not overstuffed, with places that are good for conversation and easy to share with an out-of-town friend.',
  },
};
