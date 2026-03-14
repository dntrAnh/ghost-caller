'use client';

import type { TravelLogistics } from '@/types/itinerary-result';

interface LogisticsPanelProps {
  logistics: TravelLogistics;
  estimatedBudget: string;
  needsParking: boolean;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-base w-6 text-center">{icon}</span>
      <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 font-medium leading-snug">{value}</span>
    </div>
  );
}

export function LogisticsPanel({ logistics, estimatedBudget, needsParking }: LogisticsPanelProps) {
  const { weather, hotel, transport, parking } = logistics;

  return (
    <div className="space-y-3">
      {/* Weather */}
      <Card>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">
            {weather.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {weather.condition}, {weather.tempF}°F
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{weather.note}</p>
          </div>
        </div>
      </Card>

      {/* Budget estimate */}
      <Card>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <div>
              <p className="text-xs text-slate-400">Estimated spend</p>
              <p className="text-sm font-bold text-slate-800">{estimatedBudget}</p>
            </div>
          </div>
          <span className="text-xs text-slate-300 italic">per person</span>
        </div>
      </Card>

      {/* Transport */}
      <Card>
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Getting Around
          </p>
          <Row icon="🚶" label="Best mode" value={transport.primary} />
          <Row icon="💳" label="Est. cost"  value={transport.estimatedCost} />
          <Row icon="📍" label="Total dist" value={`${transport.totalMiles} miles`} />
        </div>
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-400 italic">{transport.note}</p>
        </div>
      </Card>

      {/* Hotel */}
      <Card>
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Nearby Hotel
          </p>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">{hotel.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{hotel.neighborhood}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-800">${hotel.pricePerNight}<span className="text-xs font-normal text-slate-400">/night</span></p>
              <p className="text-xs text-amber-500 mt-0.5">{'★'.repeat(Math.round(hotel.rating))} {hotel.rating}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{hotel.distanceMiles} mi from your route</p>
        </div>
      </Card>

      {/* Parking (conditional) */}
      {needsParking && parking && (
        <Card>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Nearest Parking
            </p>
            <p className="text-sm font-medium text-slate-800">{parking.garage}</p>
            <div className="flex gap-4 mt-1.5">
              <span className="text-xs text-slate-500">~${parking.estimatedCostPerHour}/hr</span>
              <span className="text-xs text-slate-400">{parking.walkMinutes} min walk to route</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
