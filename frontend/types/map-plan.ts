export type UserProfile = {
  name: string;
  phone: string;
  neighborhood?: string;
  cuisines_loved?: string[];
  cuisines_avoided?: string[];
  dietary_restrictions?: string[];
  price_range?: string;
  availability?: string[];
  preferred_meal_times?: Record<string, string>;
  buffer_mins?: number;
  flexibility_mins?: number;
  transport_mode?: string;
  max_travel_mins?: number;
  vibes?: string[];
  photo_spots?: boolean;
  past_places?: Array<Record<string, unknown>>;
  vetoed_places?: string[];
};

export type MapStartVenue = {
  name: string;
  address: string;
  emoji: string;
  x: number;
  y: number;
};

export type MapOption = {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  score: number;
  price: string;
  walk?: string | null;
  transit?: string | null;
  vibes: string[];
  dietary?: string | null;
  why: string;
  color: string;
  x: number;
  y: number;
  /** Real-world coordinates for the MapLibre satellite map */
  lat?: number;
  lng?: number;
  ghost: boolean;
  photos: string[];
  reels: string[];
};

export type MapPlanStep = {
  step: number;
  time: string;
  label: string;
  type: string;
  venue?: MapStartVenue | null;
  options: MapOption[];
};

export type BuildMapPlanResponse = {
  group_id: string;
  group: string[];
  neighborhood: string;
  steps: MapPlanStep[];
};

export type ChooseMapPlanOptionResponse = {
  group_id: string;
  choices: Record<string, string>;
  selected_step: number;
  selected_option: MapOption;
  next_step?: MapPlanStep | null;
  final_steps: MapPlanStep[];
  completed: boolean;
};
