import type {
  Coordinates,
  ItineraryStop,
  JourneyLeg,
  JourneySegment,
  JourneySegmentMode,
  TravelLeg,
} from '@/types/itinerary-result';

function normaliseSegmentMode(mode?: string): JourneySegmentMode {
  const value = mode?.trim().toLowerCase() ?? '';
  if (value.includes('walk')) return 'walking';
  if (value.includes('subway') || value.includes('train')) return 'subway';
  if (value.includes('bus')) return 'bus';
  if (value.includes('bike')) return 'bike';
  if (value.includes('uber') || value.includes('lyft') || value.includes('car') || value.includes('drive')) {
    return 'car';
  }
  return 'other';
}

function buildSegmentPolyline(origin: Coordinates, destination: Coordinates): Coordinates[] {
  return [origin, destination];
}

function buildSegment(stop: ItineraryStop, nextStop: ItineraryStop, index: number, travel?: TravelLeg): JourneySegment {
  return {
    id: `segment-${index + 1}`,
    originStopId: stop.id,
    destinationStopId: nextStop.id,
    mode: normaliseSegmentMode(travel?.mode),
    durationMinutes: travel?.durationMinutes ?? 0,
    description: travel?.description ?? `Travel from ${stop.name} to ${nextStop.name}`,
    polyline: buildSegmentPolyline(stop.coordinates, nextStop.coordinates),
  };
}

export function buildJourneyFromStops(stops: ItineraryStop[]): { legs: JourneyLeg[]; segments: JourneySegment[] } {
  const segments = stops.slice(0, -1).map((stop, index) => buildSegment(stop, stops[index + 1], index, stop.travelToNext));

  const legs = stops.map((stop, index) => ({
    id: `leg-${index + 1}`,
    stopId: stop.id,
    stopIndex: index,
    nextSegmentId: segments[index]?.id,
  }));

  return { legs, segments };
}

export function getSegmentIndexForStop(stopIndex: number, stopCount: number): number | null {
  if (stopCount < 2) return null;
  if (stopIndex <= 0) return 0;
  if (stopIndex >= stopCount - 1) return stopCount - 2;
  return stopIndex;
}
