/**
 * Converts the backend itinerary (from the SSE `complete` event) into the
 * BuildMapPlanResponse shape that MapPlannerView already knows how to render.
 */

import type { BuildMapPlanResponse, MapOption, MapPlanStep } from '@/types/map-plan';

// ─── Backend shapes (mirrors app/schemas/itinerary.py) ────────────────────────

export interface BackendVenue {
  place_id: string;
  name: string;
  address: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  price_level: string | null;
  photo_url: string | null;
  website: string | null;
  editorial_summary: string | null;
  composite_score: number;
  youtube_url: string | null;
}

export interface BackendBlock {
  label: string;
  activity_type: string;
  start_time: string;   // ISO datetime string
  end_time: string;
  skeleton: {
    vibes: string[];
    keywords: string[];
    cuisine: string[];
    dietary_restrictions: string[];
  };
  candidates: BackendVenue[];
  confirmed_venue: BackendVenue | null;
  booking_status: string;
}

export interface BackendItinerary {
  group_id: string;
  date: string;
  meetup_point: string;
  blocks: BackendBlock[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "2026-06-14T10:00:00" → "10:00 AM" */
function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** Map backend price_level strings to display symbols */
function fmtPrice(level: string | null): string {
  if (!level) return '$$';
  const map: Record<string, string> = {
    free: 'Free',
    budget: '$',
    mid: '$$',
    splurge: '$$$',
  };
  return map[level] ?? '$$';
}

/** Map activity_type to a simple hex color for the map dot */
const ACTIVITY_COLOR: Record<string, string> = {
  restaurant:    '#f43f5e',   // rose
  attraction:    '#8b5cf6',   // violet
  entertainment: '#6366f1',   // indigo
  outdoor:       '#10b981',   // emerald
  shopping:      '#f59e0b',   // amber
  lodging:       '#3b82f6',   // blue
  transit:       '#94a3b8',   // slate
  free_time:     '#14b8a6',   // teal
};

/**
 * Convert lat/lng arrays to normalised x/y (0–100) for the canvas map.
 * We build a bounding box across all venues in the itinerary so the dots
 * spread across the full map area.
 */
function normaliseCoords(
  blocks: BackendBlock[]
): Map<string, { x: number; y: number }> {
  const venues = blocks.flatMap((b) => b.candidates);

  const lats = venues.map((v) => v.latitude).filter(Boolean);
  const lngs = venues.map((v) => v.longitude).filter(Boolean);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const result = new Map<string, { x: number; y: number }>();
  for (const v of venues) {
    // x = longitude (west→east), y = latitude inverted (north = top)
    const x = Math.round(((v.longitude - minLng) / lngRange) * 80 + 10);
    const y = Math.round((1 - (v.latitude - minLat) / latRange) * 80 + 10);
    result.set(v.place_id, { x, y });
  }
  return result;
}

// ─── Main mapper ──────────────────────────────────────────────────────────────

export function backendItineraryToMapPlan(
  itinerary: BackendItinerary
): BuildMapPlanResponse {
  const coordMap = normaliseCoords(itinerary.blocks);

  const steps: MapPlanStep[] = itinerary.blocks.filter((b) => b.candidates.length > 0).map((block, i) => {
    const options: MapOption[] = block.candidates.map((venue) => {
      const coords = coordMap.get(venue.place_id) ?? { x: 50, y: 50 };
      const photos: string[] = venue.photo_url ? [venue.photo_url] : [];
      const reels: string[] = venue.youtube_url ? [venue.youtube_url] : [];

      return {
        id: venue.place_id,
        name: venue.name,
        address: venue.address,
        score: Math.round(venue.composite_score * 100) / 100,
        price: fmtPrice(venue.price_level),
        walk: null,
        transit: null,
        vibes: block.skeleton?.vibes ?? [],
        dietary: block.skeleton?.dietary_restrictions?.join(', ') || null,
        why: venue.editorial_summary ?? `Top pick for ${block.label}`,
        color: ACTIVITY_COLOR[block.activity_type] ?? '#8b5cf6',
        x: coords.x,
        y: coords.y,
        lat: venue.latitude,
        lng: venue.longitude,
        ghost: false,
        photos,
        reels,
        activity_type: block.activity_type,
      };
    });

    return {
      step: i + 1,
      time: fmtTime(block.start_time),
      label: block.label,
      type: 'choice',          // MapPlannerView only shows the interactive UI for type === 'choice'
      venue: null,
      options,
    };
  });

  return {
    group_id: itinerary.group_id,
    group: ['Maya', 'Jordan', 'Sam'],   // could pull from profiles if passed in
    neighborhood: itinerary.meetup_point,
    steps,
  };
}
