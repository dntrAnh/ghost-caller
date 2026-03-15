import type { ItineraryProfile } from '@/types/itinerary';
import type {
  GeneratedItinerary,
  ItineraryStop,
  TravelLogistics,
  AssistantMessage,
} from '@/types/itinerary-result';
import { buildJourneyFromStops } from '@/lib/itineraryJourney';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Offset a "HH:MM" base string by `add24h` minutes from midnight, return "h:mm AM/PM" */
function fmt(base24: string, offsetMin = 0): string {
  const [h, m] = base24.split(':').map(Number);
  const total = h * 60 + m + offsetMin;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  const period = hh >= 12 ? 'PM' : 'AM';
  const display = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
  return `${display}:${String(mm).padStart(2, '0')} ${period}`;
}

// ─── Mock stop definitions ─────────────────────────────────────────────────────
// A full NYC West Village / Chelsea / Meatpacking loop

const NYC_STOPS: Omit<ItineraryStop, 'startTime' | 'endTime'>[] = [
  {
    id: 'stop-1',
    name: 'Café Integral',
    category: 'cafe',
    address: '149 Elizabeth St, New York, NY 10012',
    coordinates: { lat: 40.7221, lng: -73.9973 },
    durationMinutes: 45,
    description:
      'A calm, beautifully designed espresso bar sourcing single-origin beans from Nicaragua. Perfect way to start the day.',
    priceRange: '$',
    rating: 4.7,
    bookable: false,
    travelToNext: {
      mode: 'Walking',
      durationMinutes: 20,
      description: '20 min walk north through Hudson Square',
    },
  },
  {
    id: 'stop-2',
    name: 'The High Line',
    category: 'scenic',
    address: 'Gansevoort St entrance, New York, NY 10014',
    coordinates: { lat: 40.7395, lng: -74.005 },
    durationMinutes: 75,
    description:
      'An elevated park built on a historic freight rail line. Walk south to north for art installations, great views, and vibrant plantings.',
    priceRange: 'Free',
    rating: 4.8,
    bookable: false,
    travelToNext: {
      mode: 'Walking',
      durationMinutes: 10,
      description: '10 min walk south into the West Village',
    },
  },
  {
    id: 'stop-3',
    name: 'Via Carota',
    category: 'restaurant',
    address: '51 Grove St, New York, NY 10014',
    coordinates: { lat: 40.733, lng: -74.0029 },
    durationMinutes: 75,
    description:
      'A beloved Italian trattoria with a market-driven menu. The insalata verde and fritto misto are legendary — book ahead or arrive early.',
    priceRange: '$$',
    rating: 4.6,
    bookable: true,
    bookingLabel: 'Reserve a table',
    travelToNext: {
      mode: 'Walking',
      durationMinutes: 8,
      description: '8 min walk north on 9th Ave to Chelsea',
    },
  },
  {
    id: 'stop-4',
    name: 'Chelsea Market',
    category: 'shopping',
    address: '75 9th Ave, New York, NY 10011',
    coordinates: { lat: 40.7424, lng: -74.0047 },
    durationMinutes: 60,
    description:
      'A bustling indoor food hall and market spanning an entire city block. Great for browsing local vendors, picking up snacks, or finding a unique gift.',
    priceRange: '$',
    rating: 4.5,
    bookable: false,
    travelToNext: {
      mode: 'Walking',
      durationMinutes: 8,
      description: '8 min walk west to the Meatpacking District',
    },
  },
  {
    id: 'stop-5',
    name: 'Whitney Museum of American Art',
    category: 'museum',
    address: '99 Gansevoort St, New York, NY 10014',
    coordinates: { lat: 40.7396, lng: -74.0089 },
    durationMinutes: 90,
    description:
      'World-class contemporary American art with stunning Hudson River views from the terraces. The permanent collection rotates often — always something new.',
    priceRange: '$$',
    rating: 4.7,
    bookable: true,
    bookingLabel: 'Buy timed entry tickets',
    travelToNext: {
      mode: 'Walking',
      durationMinutes: 6,
      description: '6 min walk to Pier 55 along the Hudson',
    },
  },
  {
    id: 'stop-6',
    name: 'Little Island',
    category: 'park',
    address: 'Pier 55, Hudson River Greenway, New York, NY 10014',
    coordinates: { lat: 40.7448, lng: -74.0094 },
    durationMinutes: 40,
    description:
      'A magical floating park shaped like a tulip garden rising from the Hudson. Great for a sunset stroll and a breather before dinner.',
    priceRange: 'Free',
    rating: 4.9,
    bookable: false,
    travelToNext: {
      mode: 'Walking',
      durationMinutes: 16,
      description: '16 min walk east into Greenwich Village',
    },
  },
  {
    id: 'stop-7',
    name: 'Don Angie',
    category: 'restaurant',
    address: '103 Greenwich Ave, New York, NY 10014',
    coordinates: { lat: 40.7373, lng: -74.0014 },
    durationMinutes: 90,
    description:
      'Inventive Italian-American cooking in a warm, buzzy setting. The pinwheel lasagna is Instagram-famous for good reason. Reservations are strongly recommended.',
    priceRange: '$$$',
    rating: 4.8,
    bookable: true,
    bookingLabel: 'Reserve for dinner',
  },
];

// ─── Logistics ─────────────────────────────────────────────────────────────────

const DEFAULT_LOGISTICS: TravelLogistics = {
  weather: {
    condition: 'Sunny',
    tempF: 72,
    icon: '☀️',
    note: 'Great day for outdoor activities — keep sunscreen handy.',
  },
  hotel: {
    name: 'Hotel Gansevoort Meatpacking',
    pricePerNight: 245,
    rating: 4.4,
    distanceMiles: 0.3,
    neighborhood: 'Meatpacking District',
  },
  transport: {
    primary: 'Walking + Subway',
    estimatedCost: '$8–18',
    totalMiles: 2.8,
    note: 'This route is very walkable. Grab an Uber for the return trip if your feet give out.',
  },
  parking: {
    garage: 'Icon Parking – 500 W 23rd St',
    estimatedCostPerHour: 12,
    walkMinutes: 7,
  },
};

// ─── Assistant messages ────────────────────────────────────────────────────────

const ASSISTANT_MESSAGES: AssistantMessage[] = [
  {
    id: 'msg-1',
    type: 'info',
    text: 'Building your itinerary — optimizing for walking distance and your interest preferences.',
  },
  {
    id: 'msg-2',
    type: 'suggestion',
    text: 'West Village loop selected — compact route, low transit cost, great neighborhood energy.',
  },
  {
    id: 'msg-3',
    type: 'info',
    text: 'Via Carota peaks at noon — shifted your lunch to 12:30 PM to avoid the wait.',
  },
  {
    id: 'msg-4',
    type: 'success',
    text: 'Whitney Museum added — matches your arts & scenic preferences. Terrace views are a bonus.',
  },
  {
    id: 'msg-5',
    type: 'success',
    text: 'Don Angie 7:30 PM slot is available. Click Book to confirm your reservation.',
  },
  {
    id: 'msg-6',
    type: 'info',
    text: 'Total walking distance: ~2.8 miles across the day. Estimated transport spend: $8–18.',
  },
];

// ─── Generator ─────────────────────────────────────────────────────────────────

export function generateMockItinerary(profile: ItineraryProfile): GeneratedItinerary {
  const startTime = profile.availability.startTime || '10:00';
  const hasKids =
    profile.party.companions.includes('Kids') ||
    profile.party.companions.includes('Family') ||
    profile.party.childFriendly;
  const needsParking =
    profile.transportation.modes.includes('Personal Car') ||
    profile.transportation.modes.includes('Uber / Lyft');

  // Build time-stamped stops using the user's start time as base
  let cursorMin = 0; // minutes from startTime
  const stops: ItineraryStop[] = NYC_STOPS
    // Remove the bar stop if kids
    .filter((s) => !(hasKids && s.category === 'bar'))
    .map((stopDef) => {
      const start = fmt(startTime, cursorMin);
      cursorMin += stopDef.durationMinutes;
      const end = fmt(startTime, cursorMin);
      if (stopDef.travelToNext) cursorMin += stopDef.travelToNext.durationMinutes;

      return { ...stopDef, startTime: start, endTime: end };
    });

  // Personalize title
  const companions = profile.party.companions;
  const occasion = profile.party.occasion;
  let title = 'Your Perfect Day in NYC';
  if (occasion === 'date' || companions.includes('Partner'))
    title = 'A Romantic Day in the West Village';
  else if (occasion === 'birthday' || occasion === 'celebration')
    title = 'A Celebration Day Out in NYC';
  else if (hasKids) title = 'Family Day in NYC';
  else if (companions.includes('Friends')) title = 'A Day Out with Friends in NYC';

  const location = profile.location.startingLocation;
  const subtitle = location
    ? `Starting from ${location} · West Village loop · ~${stops.length} stops`
    : `West Village & Chelsea loop · ~${stops.length} stops · ~2.8 miles`;

  // Budget estimate based on tier
  const budgetMap: Record<string, string> = {
    $: '$25–45',
    $$: '$60–90',
    $$$: '$120–160',
    $$$$: '$200+',
    '': '$60–90',
  };
  const estimatedBudget = budgetMap[profile.budget.budgetTier] ?? '$60–90';

  const logistics: TravelLogistics = {
    ...DEFAULT_LOGISTICS,
    parking: needsParking ? DEFAULT_LOGISTICS.parking : undefined,
  };

  const journey = buildJourneyFromStops(stops);

  return {
    id: `itinerary-${Date.now()}`,
    title,
    subtitle,
    stops,
    journey,
    logistics,
    assistantMessages: ASSISTANT_MESSAGES,
    estimatedBudget,
  };
}
