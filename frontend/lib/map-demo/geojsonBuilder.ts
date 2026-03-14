import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';

import type {
  JourneyLeg,
  JourneySegment,
  MapDemoPlace,
  MapDemoSubwayStation,
} from '@/types/mapDemo';

export function buildPointFeatureCollection<T extends MapDemoPlace | MapDemoSubwayStation>(
  items: T[]
): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: items.map(
      (item): Feature<Point> => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: item.coordinates,
        },
        properties: {
          id: item.id,
          name: item.name,
        },
      })
    ),
  };
}

export function buildDiscoveryHalo(
  center: [number, number],
  lngRadius = 0.01,
  latRadius = 0.007
): FeatureCollection<Polygon> {
  const steps = 48;
  const coordinates: [number, number][] = [];

  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    coordinates.push([
      center[0] + Math.cos(angle) * lngRadius,
      center[1] + Math.sin(angle) * latRadius,
    ]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        properties: {},
      },
    ],
  };
}

export function buildJourneyLineFeatureCollection(
  legs: JourneyLeg[]
): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: legs.map(
      (leg): Feature<LineString> => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates:
            leg.geometry.length >= 2 ? leg.geometry : [leg.from.coordinates, leg.to.coordinates],
        },
        properties: {
          id: leg.id,
          from: leg.from.name,
          to: leg.to.name,
          routeType: leg.routeType,
        },
      })
    ),
  };
}

export function buildJourneySegmentFeatureCollection(
  legs: JourneyLeg[]
): FeatureCollection<LineString> {
  const segments = legs.flatMap((leg) => leg.segments);

  return {
    type: 'FeatureCollection',
    features: segments.map(
      (segment: JourneySegment): Feature<LineString> => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: segment.geometry,
        },
        properties: {
          id: segment.id,
          mode: segment.mode,
          color:
            segment.mode === 'subway'
              ? segment.transitDetails?.color ?? '#facc15'
              : segment.mode === 'bus'
                ? '#fb923c'
                : '#e2e8f0',
          textColor: segment.transitDetails?.textColor ?? '#0f172a',
          label: segment.label,
        },
      })
    ),
  };
}
