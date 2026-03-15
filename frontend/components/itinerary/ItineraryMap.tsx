'use client';

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  ItineraryStop,
  JourneySegment,
  JourneySegmentMode,
  StopCategory,
} from '@/types/itinerary-result';

const CAT_COLOR: Record<StopCategory, string> = {
  cafe: '#d97706',
  restaurant: '#e11d48',
  bar: '#4f46e5',
  park: '#059669',
  museum: '#2563eb',
  attraction: '#7c3aed',
  shopping: '#7c3aed',
  scenic: '#0284c7',
  nightlife: '#4f46e5',
  wellness: '#0d9488',
  activity: '#ea580c',
};

const SEGMENT_STYLE: Record<JourneySegmentMode, { color: string; dashArray?: string }> = {
  walking: { color: '#7c3aed', dashArray: '10 8' },
  subway: { color: '#2563eb' },
  bus: { color: '#ea580c' },
  car: { color: '#0f766e' },
  bike: { color: '#0891b2' },
  other: { color: '#64748b' },
};

function createMarker(index: number, category: StopCategory, active: boolean) {
  const color = CAT_COLOR[category];
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:999px;
      background:${active ? color : '#ffffff'};
      border:3px solid ${color};
      color:${active ? '#ffffff' : color};
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:800;font-family:system-ui,sans-serif;
      box-shadow:${active ? '0 8px 20px rgba(15,23,42,0.22)' : '0 4px 14px rgba(15,23,42,0.12)'};
      transition:all 0.2s ease;
      cursor:pointer;
    ">${index + 1}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function createArrowIcon(angle: number, active: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="
      transform: rotate(${angle}deg);
      color:${active ? '#0f172a' : '#475569'};
      font-size:${active ? '18px' : '15px'};
      line-height:1;
      text-shadow:0 1px 6px rgba(255,255,255,0.95);
      font-weight:700;
    ">➜</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function toLatLngTuple(point: { lat: number; lng: number }): [number, number] {
  return [point.lat, point.lng];
}

function getArrowPositions(segment: JourneySegment): { position: [number, number]; angle: number }[] {
  if (segment.polyline.length < 2) return [];

  const start = segment.polyline[0];
  const end = segment.polyline[segment.polyline.length - 1];
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  const angle = (Math.atan2(dLat, dLng) * 180) / Math.PI;

  return [0.35, 0.7].map((t) => ({
    position: [start.lat + dLat * t, start.lng + dLng * t],
    angle,
  }));
}

function MapController({
  stops,
  activeStopId,
  activeSegment,
}: {
  stops: ItineraryStop[];
  activeStopId: string | null;
  activeSegment: JourneySegment | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map((stop) => [stop.coordinates.lat, stop.coordinates.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, stops]);

  useEffect(() => {
    if (!activeSegment) return;
    const bounds = L.latLngBounds(activeSegment.polyline.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
  }, [activeSegment, map]);

  useEffect(() => {
    if (!activeStopId) return;
    const stop = stops.find((entry) => entry.id === activeStopId);
    if (!stop) return;
    map.flyTo([stop.coordinates.lat, stop.coordinates.lng], Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 0.6,
    });
  }, [activeStopId, map, stops]);

  return null;
}

interface ItineraryMapProps {
  stops: ItineraryStop[];
  journey: {
    segments: JourneySegment[];
  };
  activeStopId: string | null;
  activeSegmentId: string | null;
  onMarkerClick: (id: string) => void;
  onSegmentClick: (segmentId: string) => void;
  onStepRoute: (direction: 'next' | 'previous') => void;
}

export default function ItineraryMap({
  stops,
  journey,
  activeStopId,
  activeSegmentId,
  onMarkerClick,
  onSegmentClick,
  onStepRoute,
}: ItineraryMapProps) {
  const center: [number, number] = stops[0]
    ? [stops[0].coordinates.lat, stops[0].coordinates.lng]
    : [40.7359, -74.0042];

  const activeSegment = useMemo(
    () => journey.segments.find((segment) => segment.id === activeSegmentId) ?? null,
    [activeSegmentId, journey.segments]
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
      <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-xl border border-white/80 bg-white/90 p-1.5 shadow-lg backdrop-blur-sm">
        <button
          type="button"
          onClick={() => onStepRoute('previous')}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onStepRoute('next')}
          className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
        >
          Next
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {journey.segments.map((segment) => {
          const style = SEGMENT_STYLE[segment.mode];
          const active = activeSegmentId === segment.id;
          return (
            <Polyline
              key={segment.id}
              positions={segment.polyline.map(toLatLngTuple)}
              eventHandlers={{ click: () => onSegmentClick(segment.id) }}
              pathOptions={{
                color: style.color,
                weight: active ? 6 : 4,
                opacity: active ? 0.95 : 0.5,
                dashArray: style.dashArray,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          );
        })}

        {journey.segments.flatMap((segment) =>
          getArrowPositions(segment).map((arrow, index) => (
            <Marker
              key={`${segment.id}-arrow-${index}`}
              position={arrow.position}
              icon={createArrowIcon(arrow.angle, activeSegmentId === segment.id)}
              interactive={false}
            />
          ))
        )}

        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={[stop.coordinates.lat, stop.coordinates.lng]}
            icon={createMarker(index, stop.category, activeStopId === stop.id)}
            eventHandlers={{ click: () => onMarkerClick(stop.id) }}
          >
            <Popup className="itinerary-popup">
              <div style={{ minWidth: 180 }}>
                <p style={{ marginBottom: 2, fontSize: 13, fontWeight: 700 }}>{stop.name}</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>{stop.startTime} - {stop.endTime}</p>
                <p style={{ marginTop: 2, fontSize: 11, color: '#64748b' }}>{stop.address.split(',')[0]}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController stops={stops} activeStopId={activeStopId} activeSegment={activeSegment} />
      </MapContainer>
    </div>
  );
}
