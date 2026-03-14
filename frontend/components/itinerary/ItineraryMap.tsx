'use client';

import { useEffect } from 'react';
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
import type { ItineraryStop, StopCategory } from '@/types/itinerary-result';

// ─── Category colours ──────────────────────────────────────────────────────────

const CAT_COLOR: Record<StopCategory, string> = {
  cafe:       '#d97706',
  restaurant: '#e11d48',
  bar:        '#4f46e5',
  park:       '#059669',
  museum:     '#2563eb',
  attraction: '#7c3aed',
  shopping:   '#7c3aed',
  scenic:     '#0284c7',
  nightlife:  '#4f46e5',
  wellness:   '#0d9488',
  activity:   '#ea580c',
};

// ─── Custom number marker ──────────────────────────────────────────────────────

function createMarker(index: number, category: StopCategory, active: boolean) {
  const color = CAT_COLOR[category];
  return L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:${active ? color : '#fff'};
      border:2.5px solid ${color};
      color:${active ? '#fff' : color};
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;font-family:system-ui,sans-serif;
      box-shadow:0 2px 10px rgba(0,0,0,${active ? '0.25' : '0.12'});
      transition:all 0.2s;
      cursor:pointer;
    ">${index + 1}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

// ─── Map controller (fits bounds + follows active stop) ────────────────────────

function MapController({
  stops,
  activeStopId,
}: {
  stops: ItineraryStop[];
  activeStopId: string | null;
}) {
  const map = useMap();

  // Fit all stops on mount
  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(
      stops.map((s) => [s.coordinates.lat, s.coordinates.lng])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan to active stop
  useEffect(() => {
    if (!activeStopId) return;
    const stop = stops.find((s) => s.id === activeStopId);
    if (stop) {
      map.panTo([stop.coordinates.lat, stop.coordinates.lng], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [activeStopId, stops, map]);

  return null;
}

// ─── ItineraryMap ──────────────────────────────────────────────────────────────

interface ItineraryMapProps {
  stops: ItineraryStop[];
  activeStopId: string | null;
  onMarkerClick: (id: string) => void;
}

export default function ItineraryMap({
  stops,
  activeStopId,
  onMarkerClick,
}: ItineraryMapProps) {
  const center: [number, number] = stops[0]
    ? [stops[0].coordinates.lat, stops[0].coordinates.lng]
    : [40.7359, -74.0042];

  const routeCoords: [number, number][] = stops.map((s) => [
    s.coordinates.lat,
    s.coordinates.lng,
  ]);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        {/* Clean minimal tiles — CartoDB Positron */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Route polyline */}
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: '#7c3aed',
            weight: 3,
            opacity: 0.5,
            dashArray: '8 6',
          }}
        />

        {/* Markers */}
        {stops.map((stop, i) => (
          <Marker
            key={stop.id}
            position={[stop.coordinates.lat, stop.coordinates.lng]}
            icon={createMarker(i, stop.category, activeStopId === stop.id)}
            eventHandlers={{ click: () => onMarkerClick(stop.id) }}
          >
            <Popup className="itinerary-popup">
              <div style={{ minWidth: 180 }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{stop.name}</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>{stop.startTime} – {stop.endTime}</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{stop.address.split(',')[0]}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController stops={stops} activeStopId={activeStopId} />
      </MapContainer>
    </div>
  );
}
