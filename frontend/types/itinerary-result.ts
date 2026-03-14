// ─── Stop categories ───────────────────────────────────────────────────────────

export type StopCategory =
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'park'
  | 'museum'
  | 'attraction'
  | 'shopping'
  | 'scenic'
  | 'nightlife'
  | 'wellness'
  | 'activity';

// ─── Core building blocks ──────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TravelLeg {
  mode: string;          // "Walking", "Subway", "Uber"
  durationMinutes: number;
  description: string;   // "8 min walk south on Hudson St"
}

// ─── Itinerary stop ────────────────────────────────────────────────────────────

export interface ItineraryStop {
  id: string;
  name: string;
  category: StopCategory;
  address: string;
  coordinates: Coordinates;
  startTime: string;         // display string e.g. "10:00 AM"
  endTime: string;           // display string e.g. "10:45 AM"
  durationMinutes: number;
  description: string;
  priceRange: 'Free' | '$' | '$$' | '$$$' | '$$$$';
  rating?: number;           // 0–5
  bookable: boolean;
  bookingLabel?: string;     // "Reserve a table" | "Buy tickets"
  confirmedSlot?: string;    // "7:30 PM" — set after booking
  travelToNext?: TravelLeg;
}

// ─── Booking simulation ────────────────────────────────────────────────────────

export type BookingPhase =
  | 'idle'
  | 'checking'
  | 'contacting'
  | 'available'
  | 'confirmed'
  | 'failed';

export interface BookingState {
  phase: BookingPhase;
  slot?: string;
  error?: string;
}

// ─── Logistics ────────────────────────────────────────────────────────────────

export interface HotelSuggestion {
  name: string;
  pricePerNight: number;
  rating: number;
  distanceMiles: number;
  neighborhood: string;
}

export interface WeatherInfo {
  condition: string;
  tempF: number;
  icon: string;    // emoji
  note: string;
}

export interface TransportSuggestion {
  primary: string;
  estimatedCost: string;
  totalMiles: number;
  note: string;
}

export interface ParkingSuggestion {
  garage: string;
  estimatedCostPerHour: number;
  walkMinutes: number;
}

export interface TravelLogistics {
  weather: WeatherInfo;
  hotel: HotelSuggestion;
  transport: TransportSuggestion;
  parking?: ParkingSuggestion;
}

// ─── AI assistant messages ─────────────────────────────────────────────────────

export type AssistantMessageType = 'info' | 'success' | 'suggestion';

export interface AssistantMessage {
  id: string;
  text: string;
  type: AssistantMessageType;
}

// ─── Generated itinerary (root) ────────────────────────────────────────────────

export interface GeneratedItinerary {
  id: string;
  title: string;
  subtitle: string;
  stops: ItineraryStop[];
  logistics: TravelLogistics;
  assistantMessages: AssistantMessage[];
  estimatedBudget: string;
}
