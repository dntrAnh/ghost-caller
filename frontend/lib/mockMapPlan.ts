import type { ItineraryProfile } from '@/types/itinerary';
import type {
  BuildMapPlanResponse,
  ChooseMapPlanOptionResponse,
  MapOption,
  MapPlanStep,
} from '@/types/map-plan';

import type { BookingResponse } from './mapPlanApi';

type MockChoiceMap = Record<string, string>;

const PHOTO_SETS = {
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  ],
  brunch: [
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
  ],
  museum: [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
  ],
  scenic: [
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1200&q=80',
  ],
  dinner: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
  ],
};

function wait(ms = 450) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildOption(option: MapOption): MapOption {
  return option;
}

function buildMockPlan(profile: ItineraryProfile): BuildMapPlanResponse {
  const group = profile.party.companions.length > 0 ? profile.party.companions : ['Planner', 'Maya', 'Jordan'];
  const neighborhood = profile.location.startingLocation || 'Williamsburg';
  const likesTransit = profile.transportation.modes.includes('Public Transit');
  const wantsFood = profile.food.foodVibe[0] || 'social';
  const interests = profile.activities.interests.join(', ') || 'food and neighborhood discovery';

  const startVenue = {
    name: 'The William Vale',
    address: '111 N 12th St, Brooklyn, NY 11249',
    emoji: '🏨',
    x: 18,
    y: 24,
  };

  const steps: MapPlanStep[] = [
    {
      step: 0,
      time: profile.availability.startTime || '10:00 AM',
      label: 'Start at the hotel',
      type: 'start',
      venue: startVenue,
      options: [],
    },
    {
      step: 1,
      time: '10:30 AM',
      label: 'Pick the first anchor',
      type: 'choice',
      options: [
        buildOption({
          id: 'coffee-1',
          name: 'Partners Coffee',
          address: '125 N 6th St, Brooklyn, NY 11249',
          score: 94,
          price: '$$',
          walk: '9 min',
          transit: null,
          vibes: ['coffee', 'design-forward', wantsFood],
          dietary: null,
          why: `Great first stop for a ${wantsFood} day and an easy walk from the hotel.`,
          color: '#10b981',
          x: 33,
          y: 30,
          ghost: false,
          photos: PHOTO_SETS.cafe,
          reels: ['latte art', 'roastery vibes'],
        }),
        buildOption({
          id: 'brunch-1',
          name: 'Sunday in Brooklyn',
          address: '348 Wythe Ave, Brooklyn, NY 11249',
          score: 91,
          price: '$$$',
          walk: '11 min',
          transit: likesTransit ? 'L train nearby' : null,
          vibes: ['brunch', 'popular', 'group-friendly'],
          dietary: 'vegetarian friendly',
          why: `Strong brunch energy for a group interested in ${interests}.`,
          color: '#f59e0b',
          x: 41,
          y: 21,
          ghost: false,
          photos: PHOTO_SETS.brunch,
          reels: ['pancake stack', 'weekend crowd'],
        }),
      ],
    },
    {
      step: 2,
      time: '1:00 PM',
      label: 'Choose the afternoon move',
      type: 'choice',
      options: [
        buildOption({
          id: 'museum-1',
          name: 'MoMA PS1',
          address: '22-25 Jackson Ave, Queens, NY 11101',
          score: 90,
          price: '$$',
          walk: null,
          transit: '27 min via G',
          vibes: ['art', 'indoor', 'creative'],
          dietary: null,
          why: 'A stronger culture pick with enough edge to feel intentional.',
          color: '#8b5cf6',
          x: 62,
          y: 34,
          ghost: false,
          photos: PHOTO_SETS.museum,
          reels: ['gallery rooms', 'outdoor installation'],
        }),
        buildOption({
          id: 'scenic-1',
          name: 'Domino Park',
          address: '15 River St, Brooklyn, NY 11249',
          score: 88,
          price: 'Free',
          walk: '14 min',
          transit: null,
          vibes: ['waterfront', 'scenic', 'relaxed'],
          dietary: null,
          why: 'Best if the group wants skyline views and lower friction.',
          color: '#06b6d4',
          x: 56,
          y: 48,
          ghost: false,
          photos: PHOTO_SETS.scenic,
          reels: ['skyline walk', 'river sunset'],
        }),
      ],
    },
    {
      step: 3,
      time: '7:30 PM',
      label: 'Lock in dinner',
      type: 'choice',
      options: [
        buildOption({
          id: 'dinner-1',
          name: 'Lilia',
          address: '567 Union Ave, Brooklyn, NY 11211',
          score: 97,
          price: '$$$$',
          walk: '18 min',
          transit: likesTransit ? '12 min via G + walk' : null,
          vibes: ['destination dinner', 'italian', 'celebration'],
          dietary: null,
          why: 'The highest-signal dinner pick and the best “this was worth it” finish.',
          color: '#ef4444',
          x: 72,
          y: 60,
          ghost: true,
          photos: PHOTO_SETS.dinner,
          reels: ['handmade pasta', 'dinner room'],
        }),
        buildOption({
          id: 'dinner-2',
          name: 'Laser Wolf',
          address: '97 Wythe Ave, Brooklyn, NY 11249',
          score: 92,
          price: '$$$',
          walk: '8 min',
          transit: null,
          vibes: ['rooftop', 'group dinner', 'views'],
          dietary: 'vegetarian friendly',
          why: 'More convenient, still high-energy, and easier for a group to land.',
          color: '#f97316',
          x: 50,
          y: 66,
          ghost: false,
          photos: PHOTO_SETS.dinner,
          reels: ['rooftop firepit', 'night skyline'],
        }),
      ],
    },
  ];

  return {
    group_id: 'group_1',
    group,
    neighborhood,
    steps,
  };
}

function buildFinalSteps(plan: BuildMapPlanResponse, choices: MockChoiceMap): MapPlanStep[] {
  return plan.steps.map((step) => {
    if (step.type !== 'choice') return step;
    const selected = step.options.find((option) => option.id === choices[String(step.step)]) ?? step.options[0];
    return {
      ...step,
      options: selected ? [selected] : [],
    };
  });
}

export async function fetchMockMapPlan(
  _groupId: string,
  profile: ItineraryProfile
): Promise<BuildMapPlanResponse> {
  await wait();
  return buildMockPlan(profile);
}

export async function chooseMockMapPlanOption(params: {
  groupId: string;
  profile: ItineraryProfile;
  currentStep: number;
  selectedOptionId: string;
  choices: Record<string, string>;
}): Promise<ChooseMapPlanOptionResponse> {
  await wait(350);

  const plan = buildMockPlan(params.profile);
  const nextChoices = {
    ...params.choices,
    [String(params.currentStep)]: params.selectedOptionId,
  };

  const selectedStep = plan.steps.find((step) => step.step === params.currentStep);
  const selectedOption = selectedStep?.options.find((option) => option.id === params.selectedOptionId);

  if (!selectedStep || !selectedOption) {
    throw new Error('Mock plan could not resolve the selected option.');
  }

  const nextChoiceStep = plan.steps.find(
    (step) => step.type === 'choice' && !nextChoices[String(step.step)]
  );

  const completed = nextChoiceStep == null;

  return {
    group_id: params.groupId,
    choices: nextChoices,
    selected_step: params.currentStep,
    selected_option: selectedOption,
    next_step: nextChoiceStep ?? null,
    final_steps: completed ? buildFinalSteps(plan, nextChoices) : [],
    completed,
  };
}

export async function startMockBookingReservation(params: {
  groupId: string;
  blockIndex: number;
  partySize: number;
  contactName: string;
  contactPhone: string;
}): Promise<BookingResponse> {
  await wait(2200);

  return {
    group_id: params.groupId,
    block_index: params.blockIndex,
    venue_name: 'Lilia',
    status: 'confirmed',
    confirmation_number: `MOCK-${params.partySize}-${params.contactPhone.slice(-4)}`,
    notes: `Reserved under ${params.contactName}.`,
  };
}
