'use client';

import { useState } from 'react';
import type { ItineraryStop, StopCategory } from '@/types/itinerary-result';
import { BookingModal } from './BookingModal';

// ─── Category config ───────────────────────────────────────────────────────────

const CAT: Record<StopCategory, { label: string; icon: string; color: string; border: string; bg: string }> = {
  cafe:        { label: 'Café',        icon: '☕', color: 'text-amber-600',   border: 'border-amber-400',   bg: 'bg-amber-50' },
  restaurant:  { label: 'Restaurant',  icon: '🍽️', color: 'text-rose-600',    border: 'border-rose-400',    bg: 'bg-rose-50' },
  bar:         { label: 'Bar',         icon: '🍸', color: 'text-indigo-600',  border: 'border-indigo-400',  bg: 'bg-indigo-50' },
  park:        { label: 'Park',        icon: '🌿', color: 'text-emerald-600', border: 'border-emerald-400', bg: 'bg-emerald-50' },
  museum:      { label: 'Museum',      icon: '🏛️', color: 'text-blue-600',    border: 'border-blue-400',    bg: 'bg-blue-50' },
  attraction:  { label: 'Attraction',  icon: '🎠', color: 'text-purple-600',  border: 'border-purple-400',  bg: 'bg-purple-50' },
  shopping:    { label: 'Shopping',    icon: '🛍️', color: 'text-violet-600',  border: 'border-violet-400',  bg: 'bg-violet-50' },
  scenic:      { label: 'Scenic',      icon: '🌅', color: 'text-sky-600',     border: 'border-sky-400',     bg: 'bg-sky-50' },
  nightlife:   { label: 'Nightlife',   icon: '🎶', color: 'text-indigo-600',  border: 'border-indigo-400',  bg: 'bg-indigo-50' },
  wellness:    { label: 'Wellness',    icon: '🧘', color: 'text-teal-600',    border: 'border-teal-400',    bg: 'bg-teal-50' },
  activity:    { label: 'Activity',    icon: '⚡', color: 'text-orange-600',  border: 'border-orange-400',  bg: 'bg-orange-50' },
};

// ─── Single stop card ──────────────────────────────────────────────────────────

interface StopCardProps {
  stop: ItineraryStop;
  index: number;
  isActive: boolean;
  isBooked: boolean;
  onClick: () => void;
  onBook: () => void;
}

function StopCard({ stop, index, isActive, isBooked, onClick, onBook }: StopCardProps) {
  const cat = CAT[stop.category];

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-2xl border cursor-pointer
        transition-all duration-200 overflow-hidden
        ${isActive
          ? 'border-violet-200 shadow-lg shadow-violet-100 ring-1 ring-violet-200'
          : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'}
      `}
    >
      {/* Colored left accent */}
      <div className={`absolute inset-y-0 left-0 w-1 ${cat.border.replace('border-', 'bg-')}`} />

      <div className="pl-4 pr-4 pt-4 pb-3">
        {/* Top row: time + category badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-xs font-semibold text-slate-400 tabular-nums">
              {stop.startTime} – {stop.endTime}
            </p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{stop.name}</h3>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cat.bg} ${cat.color}`}>
            {cat.icon} {cat.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{stop.description}</p>

        {/* Address + meta */}
        <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400">
          <span>📍 {stop.address.split(',')[0]}</span>
          {stop.rating && (
            <span className="text-amber-500">★ {stop.rating}</span>
          )}
          <span>{stop.priceRange}</span>
          <span>{stop.durationMinutes} min</span>
        </div>

        {/* Book button */}
        {stop.bookable && (
          <div className="mt-3 pt-3 border-t border-slate-50">
            {isBooked ? (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Booked for {stop.confirmedSlot ?? '7:30 PM'}
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onBook(); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors shadow-sm"
              >
                {stop.bookingLabel ?? 'Book'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Travel leg connector ──────────────────────────────────────────────────────

function TravelLeg({ mode, durationMinutes, description }: {
  mode: string;
  durationMinutes: number;
  description: string;
}) {
  const modeIcon =
    mode === 'Walking' ? '🚶' :
    mode === 'Subway'  ? '🚇' :
    mode === 'Uber'    ? '🚕' :
    mode === 'Bike'    ? '🚲' : '🚌';

  return (
    <div className="flex items-center gap-3 py-1 px-2">
      {/* Dashed vertical line */}
      <div className="flex flex-col items-center w-6 shrink-0">
        <div className="w-px h-3 border-l-2 border-dashed border-slate-200" />
        <span className="text-sm">{modeIcon}</span>
        <div className="w-px h-3 border-l-2 border-dashed border-slate-200" />
      </div>
      <p className="text-xs text-slate-400 italic">
        {durationMinutes} min {mode.toLowerCase()} · {description}
      </p>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

interface TimelineProps {
  stops: ItineraryStop[];
  activeStopId: string | null;
  onStopClick: (id: string) => void;
}

export function Timeline({ stops, activeStopId, onStopClick }: TimelineProps) {
  const [bookingStop, setBookingStop] = useState<ItineraryStop | null>(null);
  const [booked, setBooked] = useState<Record<string, string>>({});

  return (
    <div className="space-y-2">
      {stops.map((stop, i) => (
        <div key={stop.id}>
          <StopCard
            stop={{ ...stop, confirmedSlot: booked[stop.id] }}
            index={i}
            isActive={activeStopId === stop.id}
            isBooked={!!booked[stop.id]}
            onClick={() => onStopClick(stop.id)}
            onBook={() => setBookingStop(stop)}
          />

          {stop.travelToNext && (
            <TravelLeg {...stop.travelToNext} />
          )}
        </div>
      ))}

      {/* Booking modal */}
      {bookingStop && (
        <BookingModal
          stop={bookingStop}
          onClose={() => setBookingStop(null)}
          onConfirmed={(slot) => {
            setBooked((prev) => ({ ...prev, [bookingStop.id]: slot }));
            setBookingStop(null);
          }}
        />
      )}
    </div>
  );
}
