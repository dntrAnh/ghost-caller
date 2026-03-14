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

export type JourneySegmentMode = 'walking' | 'subway' | 'bus';

export interface JourneySegmentTransitDetails {
  lineName: string | null;
  lineShortName: string | null;
  headsign: string | null;
  vehicleType: string | null;
  color: string | null;
  textColor: string | null;
  departureStop: string | null;
  arrivalStop: string | null;
  stopCount: number | null;
}

export interface JourneySegment {
  id: string;
  mode: JourneySegmentMode;
  label: string;
  instruction: string;
  estimatedMinutes: number;
  distanceMeters: number;
  geometry: [number, number][];
  transitDetails?: JourneySegmentTransitDetails;
}

export interface JourneyLeg {
  id: string;
  from: JourneyAnchor;
  to: JourneyAnchor;
  mode: 'transit' | 'walking' | 'direct';
  routeType: DemoRouteType;
  estimatedMinutes: number;
  distanceMeters: number;
  geometry: [number, number][];
  segments: JourneySegment[];
}

export interface JourneyBuilderState {
  startAnchorId: string;
  destinationAnchorId: string | null;
  legs: JourneyLeg[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  errorMessage: string | null;
}

export interface NearbyDiscoverySummary {
  hotel: MapDemoPlace;
  nearbyStations: MapDemoSubwayStation[];
  nearbyRestaurants: MapDemoPlace[];
  nearbyAttractions: MapDemoPlace[];
}
