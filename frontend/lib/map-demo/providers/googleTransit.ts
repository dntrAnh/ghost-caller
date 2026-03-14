import type {
  JourneyAnchor,
  JourneyLeg,
  JourneySegment,
  JourneySegmentMode,
  JourneySegmentTransitDetails,
  DemoRouteType,
} from '@/types/mapDemo';

interface GoogleTransitRouteRequest {
  origin: JourneyAnchor;
  destination: JourneyAnchor;
  routeType: DemoRouteType;
}

interface GoogleTransitRouteResponse {
  leg: JourneyLeg;
}

export async function resolveTransitJourneyLeg(
  startAnchor: JourneyAnchor,
  destinationAnchor: JourneyAnchor,
  routeType: DemoRouteType,
  signal?: AbortSignal
): Promise<JourneyLeg> {
  const response = await fetch('/api/map-demo/transit-route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: startAnchor,
      destination: destinationAnchor,
      routeType,
    } satisfies GoogleTransitRouteRequest),
    signal,
  });

  const data = (await response.json()) as GoogleTransitRouteResponse | { error: string };

  if (!response.ok || !('leg' in data)) {
    throw new Error('error' in data ? data.error : `Transit route request failed with status ${response.status}`);
  }

  return data.leg;
}

export function flattenJourneyGeometry(segments: JourneySegment[]): [number, number][] {
  return segments.flatMap((segment, index) =>
    index === 0 ? segment.geometry : segment.geometry.slice(1)
  );
}

export function classifyTransitSegmentMode(vehicleType: string | null | undefined): JourneySegmentMode {
  switch (vehicleType) {
    case 'BUS':
    case 'INTERCITY_BUS':
    case 'TROLLEYBUS':
    case 'SHARE_TAXI':
      return 'bus';
    case 'SUBWAY':
    case 'HEAVY_RAIL':
    case 'METRO_RAIL':
    case 'COMMUTER_TRAIN':
    case 'RAIL':
    case 'TRAM':
      return 'subway';
    default:
      return 'subway';
  }
}

export function buildTransitLabel(
  mode: JourneySegmentMode,
  transitDetails?: JourneySegmentTransitDetails
): string {
  if (mode === 'walking') {
    return 'Walk';
  }

  const line = transitDetails?.lineShortName ?? transitDetails?.lineName ?? 'Transit';
  return mode === 'bus' ? `Bus ${line}` : `Subway ${line}`;
}
