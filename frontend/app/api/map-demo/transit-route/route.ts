import { NextResponse } from 'next/server';

import { flattenJourneyGeometry, classifyTransitSegmentMode, buildTransitLabel } from '@/lib/map-demo/providers/googleTransit';
import type {
  DemoRouteType,
  JourneyAnchor,
  JourneyLeg,
  JourneySegment,
  JourneySegmentTransitDetails,
} from '@/types/mapDemo';

interface TransitRouteRequestBody {
  origin?: JourneyAnchor;
  destination?: JourneyAnchor;
  routeType?: DemoRouteType;
}

interface GoogleRoutesResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    legs?: Array<{
      distanceMeters?: number;
      duration?: string;
      steps?: Array<GoogleRouteStep>;
    }>;
  }>;
}

interface GoogleRouteStep {
  distanceMeters?: number;
  staticDuration?: string;
  travelMode?: string;
  polyline?: {
    geoJsonLinestring?: {
      type?: string;
      coordinates?: number[][];
    };
  };
  navigationInstruction?: {
    instructions?: string;
  };
  transitDetails?: {
    headsign?: string;
    stopCount?: number;
    stopDetails?: {
      arrivalStop?: {
        name?: string;
      };
      departureStop?: {
        name?: string;
      };
    };
    transitLine?: {
      name?: string;
      nameShort?: string;
      color?: string;
      textColor?: string;
      vehicle?: {
        type?: string;
      };
    };
  };
}

function parseDurationMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const seconds = Number.parseFloat(duration.replace('s', ''));
  if (Number.isNaN(seconds)) return 0;
  return Math.max(1, Math.round(seconds / 60));
}

function parseGeoJsonLineString(step: GoogleRouteStep): [number, number][] {
  const coordinates = step.polyline?.geoJsonLinestring?.coordinates ?? [];
  return coordinates
    .filter((coordinate): coordinate is number[] => coordinate.length >= 2)
    .map((coordinate): [number, number] => [coordinate[0] ?? 0, coordinate[1] ?? 0]);
}

function normalizeTransitDetails(step: GoogleRouteStep): JourneySegmentTransitDetails | undefined {
  if (!step.transitDetails) return undefined;

  return {
    lineName: step.transitDetails.transitLine?.name ?? null,
    lineShortName: step.transitDetails.transitLine?.nameShort ?? null,
    headsign: step.transitDetails.headsign ?? null,
    vehicleType: step.transitDetails.transitLine?.vehicle?.type ?? null,
    color: step.transitDetails.transitLine?.color ?? null,
    textColor: step.transitDetails.transitLine?.textColor ?? null,
    departureStop: step.transitDetails.stopDetails?.departureStop?.name ?? null,
    arrivalStop: step.transitDetails.stopDetails?.arrivalStop?.name ?? null,
    stopCount: step.transitDetails.stopCount ?? null,
  };
}

function buildInstruction(
  mode: 'walking' | 'subway' | 'bus',
  step: GoogleRouteStep,
  transitDetails?: JourneySegmentTransitDetails
): string {
  if (mode === 'walking') {
    return step.navigationInstruction?.instructions ?? 'Walk to the next transfer point';
  }

  const line = transitDetails?.lineShortName ?? transitDetails?.lineName ?? 'Transit';
  const departure = transitDetails?.departureStop ?? 'departure stop';
  const arrival = transitDetails?.arrivalStop ?? 'arrival stop';
  const headsign = transitDetails?.headsign ? ` toward ${transitDetails.headsign}` : '';

  return mode === 'bus'
    ? `Take bus ${line}${headsign} from ${departure} to ${arrival}`
    : `Take subway ${line}${headsign} from ${departure} to ${arrival}`;
}

function normalizeSegments(steps: GoogleRouteStep[]): JourneySegment[] {
  const segments = steps
    .map((step, index) => {
      const travelMode = step.travelMode ?? 'TRAVEL_MODE_UNSPECIFIED';
      const transitDetails = normalizeTransitDetails(step);
      const mode =
        travelMode === 'WALK' ? 'walking' : classifyTransitSegmentMode(transitDetails?.vehicleType);
      const geometry = parseGeoJsonLineString(step);

      if (geometry.length < 2) {
        return null;
      }

      const segment: JourneySegment = {
        id: `segment-${index}`,
        mode,
        label: buildTransitLabel(mode, transitDetails),
        instruction: buildInstruction(mode, step, transitDetails),
        estimatedMinutes: parseDurationMinutes(step.staticDuration),
        distanceMeters: step.distanceMeters ?? 0,
        geometry,
        transitDetails,
      };

      return segment;
    })
    .filter((segment): segment is JourneySegment => segment !== null);

  return segments;
}

export async function POST(request: Request) {
  const body = (await request.json()) as TransitRouteRequestBody;
  const origin = body.origin;
  const destination = body.destination;
  const routeType = body.routeType ?? 'explore';
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing GOOGLE_MAPS_API_KEY or GOOGLE_PLACES_API_KEY' },
      { status: 500 }
    );
  }

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'routes.distanceMeters',
        'routes.duration',
        'routes.legs.distanceMeters',
        'routes.legs.duration',
        'routes.legs.polyline',
        'routes.legs.steps.distanceMeters',
        'routes.legs.steps.staticDuration',
        'routes.legs.steps.travelMode',
        'routes.legs.steps.polyline',
        'routes.legs.steps.navigationInstruction.instructions',
        'routes.legs.steps.transitDetails.headsign',
        'routes.legs.steps.transitDetails.stopCount',
        'routes.legs.steps.transitDetails.stopDetails.arrivalStop.name',
        'routes.legs.steps.transitDetails.stopDetails.departureStop.name',
        'routes.legs.steps.transitDetails.transitLine.name',
        'routes.legs.steps.transitDetails.transitLine.nameShort',
        'routes.legs.steps.transitDetails.transitLine.color',
        'routes.legs.steps.transitDetails.transitLine.textColor',
        'routes.legs.steps.transitDetails.transitLine.vehicle.type',
        'routes.polyline',
      ].join(','),
    },
    body: JSON.stringify({
      origin: {
        location: {
          latLng: {
            latitude: origin.coordinates[1],
            longitude: origin.coordinates[0],
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.coordinates[1],
            longitude: destination.coordinates[0],
          },
        },
      },
      travelMode: 'TRANSIT',
      polylineQuality: 'HIGH_QUALITY',
      polylineEncoding: 'GEO_JSON_LINESTRING',
      departureTime: new Date().toISOString(),
      computeAlternativeRoutes: false,
      languageCode: 'en-US',
      units: 'IMPERIAL',
    }),
    cache: 'no-store',
  });

  const data = (await response.json()) as GoogleRoutesResponse | { error?: { message?: string } };

  if (!response.ok) {
    const message =
      'error' in data && data.error?.message
        ? data.error.message
        : `Google transit request failed with status ${response.status}`;

    return NextResponse.json({ error: message }, { status: 502 });
  }

  const route = ('routes' in data ? data.routes?.[0] : undefined) ?? null;
  const legResponse = route?.legs?.[0];
  const steps = legResponse?.steps ?? [];
  const segments = normalizeSegments(steps);

  if (!route || !legResponse || segments.length === 0) {
    return NextResponse.json(
      { error: 'Google Routes returned no usable transit segments for this trip.' },
      { status: 502 }
    );
  }

  const leg: JourneyLeg = {
    id: `${origin.id}__${destination.id}`,
    from: origin,
    to: destination,
    mode: 'transit',
    routeType,
    estimatedMinutes: parseDurationMinutes(route.duration ?? legResponse.duration),
    distanceMeters: route.distanceMeters ?? legResponse.distanceMeters ?? 0,
    geometry: flattenJourneyGeometry(segments),
    segments,
  };

  return NextResponse.json({ leg });
}
