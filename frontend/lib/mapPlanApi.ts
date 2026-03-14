import type { ItineraryProfile } from '@/types/itinerary';
import type {
  BuildMapPlanResponse,
  ChooseMapPlanOptionResponse,
  UserProfile,
} from '@/types/map-plan';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000/api/v1';

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Map plan request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<TResponse>;
}

function resolveTransportMode(profile: ItineraryProfile): UserProfile['transport_mode'] {
  const mode = profile.transportation.modes[0];
  if (mode === 'Walking') return 'walking';
  if (mode === 'Public Transit') return 'transit';
  if (mode === 'Uber / Lyft') return 'uber';
  return 'walking';
}

function resolvePriceRange(profile: ItineraryProfile): string {
  const budget = profile.budget.budgetTier;
  if (!budget) return 'mid';
  if (budget === '$') return 'budget';
  if (budget === '$$') return 'mid';
  return 'splurge';
}

export function mapProfileToBackendProfiles(profile: ItineraryProfile): UserProfile[] {
  const names = profile.party.companions.length > 0 ? profile.party.companions : ['Planner', 'Maya', 'Jordan', 'Sam'];
  const neighborhood = profile.location.startingLocation || 'Williamsburg, Brooklyn';
  const vibes = [...profile.food.foodVibe, ...profile.activities.socialVibe].filter(Boolean);

  return names.map((name, index) => ({
    name,
    phone: `+15550000${String(index + 10).padStart(2, '0')}`,
    neighborhood,
    cuisines_loved: profile.food.cuisinesLiked,
    cuisines_avoided: profile.food.cuisinesDisliked,
    dietary_restrictions: profile.food.dietaryRestrictions,
    price_range: resolvePriceRange(profile),
    transport_mode: resolveTransportMode(profile),
    max_travel_mins: profile.transportation.maxTravelTime,
    vibes,
    photo_spots: profile.activities.spotPreference === 'iconic',
    preferred_meal_times: {
      brunch: profile.availability.startTime,
      dinner: profile.availability.endTime,
    },
  }));
}

export async function fetchMapPlan(groupId: string, profile: ItineraryProfile): Promise<BuildMapPlanResponse> {
  return postJson<BuildMapPlanResponse>('/map-plan/build', {
    group_id: groupId,
    profiles: mapProfileToBackendProfiles(profile),
  });
}

export async function chooseMapPlanOption(params: {
  groupId: string;
  profile: ItineraryProfile;
  currentStep: number;
  selectedOptionId: string;
  choices: Record<string, string>;
}): Promise<ChooseMapPlanOptionResponse> {
  return postJson<ChooseMapPlanOptionResponse>('/map-plan/choose', {
    group_id: params.groupId,
    profiles: mapProfileToBackendProfiles(params.profile),
    current_step: params.currentStep,
    selected_option_id: params.selectedOptionId,
    choices: params.choices,
  });
}
