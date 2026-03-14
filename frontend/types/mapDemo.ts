export type MapDemoPlaceCategory = 'hotel' | 'restaurant' | 'attraction';

export type DemoRouteType = 'food' | 'scenic' | 'chill' | 'explore';

export type JourneyAnchorKind = 'start' | 'destination';

export interface MapDemoPlace {
  id: string;
  name: string;
  category: MapDemoPlaceCategory;
  coordinates: [number, number];
  neighborhood: string;
  description: string;
}

export interface MapDemoSubwayStation {
  id: string;
  name: string;
  coordinates: [number, number];
  neighborhood: string;
  servedLines: string[];
}

export interface DemoRouteOption {
  id: DemoRouteType;
  label: string;
  summary: string;
  accent: string;
}

export interface JourneyAnchor {
  id: string;
  name: string;
  category: MapDemoPlaceCategory;
  coordinates: [number, number];
  neighborhood: string;
  description: string;
  sourceType: 'hotel' | 'place';
}

export interface JourneyCandidateStop {
  id: string;
  anchor: JourneyAnchor;
  rationale: string;
  estimatedMinutes: number;
}

export interface JourneyLeg {
  id: string;
  from: JourneyAnchor;
  to: JourneyAnchor;
  mode: 'direct';
  routeType: DemoRouteType;
  estimatedMinutes: number;
}

export interface JourneyBuilderState {
  startAnchorId: string;
  destinationAnchorId: string | null;
  legs: JourneyLeg[];
}

export interface NearbyDiscoverySummary {
  hotel: MapDemoPlace;
  nearbyStations: MapDemoSubwayStation[];
  nearbyRestaurants: MapDemoPlace[];
  nearbyAttractions: MapDemoPlace[];
}
