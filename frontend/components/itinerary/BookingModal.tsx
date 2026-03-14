'use client';

import { useEffect, useState } from 'react';
import type { ItineraryStop, BookingPhase } from '@/types/itinerary-result';

interface BookingModalProps {
  stop: ItineraryStop;
  onClose: () => void;
  onConfirmed: (slot: string) => void;
}

const STEPS: { phase: BookingPhase; label: string; delay: number }[] = [
  { phase: 'checking',   label: 'Checking availability…',       delay: 0 },
  { phase: 'contacting', label: 'Contacting the venue…',         delay: 1600 },
  { phase: 'available',  label: 'Slot available',                delay: 3200 },
  { phase: 'confirmed',  label: 'Booking confirmed!',            delay: 4400 },
];

const SLOT = '7:30 PM';

export function BookingModal({ stop, onClose, onConfirmed }: BookingModalProps) {
  const [phase, setPhase] = useState<BookingPhase>('checking');

  useEffect(() => {
    const timers = STEPS.map(({ phase: p, delay }) =>
      setTimeout(() => setPhase(p), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === 'confirmed') {
      const t = setTimeout(() => onConfirmed(SLOT), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, onConfirmed]);

  const isDone = phase === 'confirmed';
  const stepIndex = STEPS.findIndex((s) => s.phase === phase);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && !isDone && onClose()}
    >
      {/* Modal card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 px-6 py-5 text-white">
          <p className="text-violet-200 text-xs font-medium mb-1 uppercase tracking-wide">
            {stop.bookingLabel ?? 'Make a reservation'}
          </p>
          <h3 className="text-lg font-bold">{stop.name}</h3>
          <p className="text-violet-200 text-sm mt-0.5">{stop.address}</p>
        </div>

        {/* Progress steps */}
        <div className="px-6 py-6 space-y-4">
          {STEPS.map(({ phase: p, label }, i) => {
            const isActive = i === stepIndex;
            const isPast   = i < stepIndex;
            const isFuture = i > stepIndex;

            return (
              <div key={p} className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isPast
                      ? 'bg-emerald-100 text-emerald-600'
                      : isActive
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-slate-100 text-slate-300'
                  }`}
                >
                  {isPast ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive && !isDone ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : isDone && i === STEPS.length - 1 ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      isPast
                        ? 'text-emerald-600'
                        : isActive
                        ? 'text-slate-900'
                        : 'text-slate-300'
                    }`}
                  >
                    {label}
                    {/* Slot reveal */}
                    {p === 'available' && !isFuture && (
                      <span className="ml-2 text-violet-700 font-semibold">{SLOT}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmed footer */}
        {isDone && (
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-center">
              <p className="text-emerald-700 font-semibold text-sm">
                ✓ Reserved for {SLOT} at {stop.name}
              </p>
              <p className="text-emerald-600 text-xs mt-0.5">
                A confirmation will be sent to your email.
              </p>
            </div>
          </div>
        )}

        {/* Cancel / close */}
        {!isDone && (
          <div className="px-6 pb-5 text-center">
            <button
              onClick={onClose}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
