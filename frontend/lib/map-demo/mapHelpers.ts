import type {
  JourneyAnchor,
  MapDemoPlace,
  MapDemoSubwayStation,
  NearbyDiscoverySummary,
} from '@/types/mapDemo';

const SUBWAY_LINE_COLORS: Record<string, string> = {
  '1': '#ee352e',
  '2': '#ee352e',
  '3': '#ee352e',
  '4': '#00933c',
  '5': '#00933c',
  '6': '#00933c',
  '7': '#b933ad',
  A: '#0039a6',
  C: '#0039a6',
  E: '#0039a6',
  B: '#ff6319',
  D: '#ff6319',
  F: '#ff6319',
  M: '#ff6319',
  L: '#a7a9ac',
  N: '#fccc0a',
  Q: '#fccc0a',
  R: '#fccc0a',
  W: '#fccc0a',
  S: '#808183',
};

export function getSubwayLineColor(line: string): string {
  return SUBWAY_LINE_COLORS[line] ?? '#1f2937';
}

export function haversineDistanceMiles(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearbyDiscoverySummary(
  hotel: MapDemoPlace,
  stations: MapDemoSubwayStation[],
  restaurants: MapDemoPlace[],
  attractions: MapDemoPlace[]
): NearbyDiscoverySummary {
  const sortByDistance = <T extends { coordinates: [number, number] }>(items: T[]) =>
    [...items].sort(
      (left, right) =>
        haversineDistanceMiles(hotel.coordinates, left.coordinates) -
        haversineDistanceMiles(hotel.coordinates, right.coordinates)
    );

  return {
    hotel,
    nearbyStations: sortByDistance(stations).slice(0, 3),
    nearbyRestaurants: sortByDistance(restaurants).slice(0, 3),
    nearbyAttractions: sortByDistance(attractions).slice(0, 3),
  };
}

export function formatWalkingDistance(distanceMiles: number): string {
  const minutes = Math.max(2, Math.round(distanceMiles * 20));
  return `${minutes} min walk`;
}

export function formatJourneyMinutes(minutes: number): string {
  return `${minutes} min`;
}

export function getAnchorPillLabel(anchor: JourneyAnchor): string {
  if (anchor.sourceType === 'hotel') {
    return 'Hotel';
  }

  if (anchor.category === 'restaurant') {
    return 'Food';
  }

  return 'Stop';
}
