import type {
  DemoRouteType,
  JourneyAnchor,
  JourneyBuilderState,
  JourneyCandidateStop,
  JourneyLeg,
  MapDemoPlace,
} from '@/types/mapDemo';

import { haversineDistanceMiles } from './mapHelpers';
import {
  MAP_DEMO_ATTRACTIONS,
  MAP_DEMO_HOTELS,
  MAP_DEMO_RESTAURANTS,
} from './mockNycData';

const CURATED_START_PLACE_IDS = [
  'attr-high-line',
  'attr-chelsea-market',
  'rest-russ-daughters',
];

const ROUTE_LABELS: Record<DemoRouteType, string> = {
  food: 'Best aligned with restaurant energy and iconic food stops nearby.',
  scenic: 'Biases toward visually strong neighborhoods and a walkable arrival.',
  chill: 'Keeps the hop short and easy for a low-friction next step.',
  explore: 'Pushes outward for a broader neighborhood jump.',
};

function toJourneyAnchor(place: MapDemoPlace, sourceType: 'hotel' | 'place'): JourneyAnchor {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    coordinates: place.coordinates,
    neighborhood: place.neighborhood,
    description: place.description,
    sourceType,
  };
}

export function getJourneyStartAnchors(): JourneyAnchor[] {
  const hotelAnchors = MAP_DEMO_HOTELS.map((hotel) => toJourneyAnchor(hotel, 'hotel'));
  const curatedPlaces = [...MAP_DEMO_ATTRACTIONS, ...MAP_DEMO_RESTAURANTS]
    .filter((place) => CURATED_START_PLACE_IDS.includes(place.id))
    .map((place) => toJourneyAnchor(place, 'place'));

  return [...hotelAnchors, ...curatedPlaces];
}

export function getAllJourneyDestinationAnchors(): JourneyAnchor[] {
  return [...MAP_DEMO_RESTAURANTS, ...MAP_DEMO_ATTRACTIONS].map((place) =>
    toJourneyAnchor(place, 'place')
  );
}

export function buildInitialJourneyState(startAnchorId: string): JourneyBuilderState {
  return {
    startAnchorId,
    destinationAnchorId: null,
    legs: [],
    status: 'idle',
    errorMessage: null,
  };
}

export function getJourneyAnchorById(anchorId: string): JourneyAnchor | undefined {
  return [...getJourneyStartAnchors(), ...getAllJourneyDestinationAnchors()].find(
    (anchor) => anchor.id === anchorId
  );
}

export function getCandidateStops(
  startAnchor: JourneyAnchor,
  routeType: DemoRouteType,
  limit = 4
): JourneyCandidateStop[] {
  const candidates = getAllJourneyDestinationAnchors()
    .filter((anchor) => anchor.id !== startAnchor.id)
    .map((anchor) => {
      const distance = haversineDistanceMiles(startAnchor.coordinates, anchor.coordinates);
      const categoryBonus =
        routeType === 'food' && anchor.category === 'restaurant'
          ? -0.18
          : routeType === 'scenic' && anchor.category === 'attraction'
            ? -0.14
            : routeType === 'chill'
              ? -0.08
              : routeType === 'explore'
                ? distance < 1.5
                  ? 0.2
                  : -0.04
                : 0;

      return {
        anchor,
        score: distance + categoryBonus,
        distance,
      };
    })
    .sort((left, right) => left.score - right.score)
    .slice(0, limit);

  return candidates.map(({ anchor, distance }) => ({
    id: `${startAnchor.id}__${anchor.id}`,
    anchor,
    rationale: ROUTE_LABELS[routeType],
    estimatedMinutes: Math.max(5, Math.round(distance * 12)),
  }));
}

export function buildJourneyLeg(
  startAnchor: JourneyAnchor,
  destinationAnchor: JourneyAnchor,
  routeType: DemoRouteType
): JourneyLeg {
  const distance = haversineDistanceMiles(startAnchor.coordinates, destinationAnchor.coordinates);

  return {
    id: `${startAnchor.id}__${destinationAnchor.id}`,
    from: startAnchor,
    to: destinationAnchor,
    mode: 'direct',
    routeType,
    estimatedMinutes: Math.max(6, Math.round(distance * 12)),
    distanceMeters: Math.round(distance * 1609.34),
    geometry: [startAnchor.coordinates, destinationAnchor.coordinates],
    segments: [
      {
        id: `${startAnchor.id}__${destinationAnchor.id}__direct`,
        mode: 'walking',
        label: 'Direct connection',
        instruction: `${startAnchor.name} to ${destinationAnchor.name}`,
        estimatedMinutes: Math.max(6, Math.round(distance * 12)),
        distanceMeters: Math.round(distance * 1609.34),
        geometry: [startAnchor.coordinates, destinationAnchor.coordinates],
      },
    ],
  };
}
