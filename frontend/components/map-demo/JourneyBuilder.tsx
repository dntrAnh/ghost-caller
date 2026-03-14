import { getAnchorPillLabel, formatJourneyMinutes } from '@/lib/map-demo/mapHelpers';
import type {
  JourneyAnchor,
  JourneyBuilderState,
  JourneyCandidateStop,
} from '@/types/mapDemo';

interface JourneyBuilderProps {
  startAnchors: JourneyAnchor[];
  selectedStartAnchorId: string;
  candidateStops: JourneyCandidateStop[];
  journeyState: JourneyBuilderState;
  onStartAnchorSelect: (anchorId: string) => void;
  onDestinationSelect: (anchorId: string) => void;
}

export function JourneyBuilder({
  startAnchors,
  selectedStartAnchorId,
  candidateStops,
  journeyState,
  onStartAnchorSelect,
  onDestinationSelect,
}: JourneyBuilderProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/92 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Journey Builder
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Choose a starting point</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Step 1 foundation
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {startAnchors.map((anchor) => {
          const isActive = anchor.id === selectedStartAnchorId;

          return (
            <button
              key={anchor.id}
              type="button"
              onClick={() => onStartAnchorSelect(anchor.id)}
              className={[
                'w-full rounded-2xl border px-4 py-3 text-left transition',
                isActive
                  ? 'border-slate-900 bg-slate-950 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isActive ? 'text-cyan-300' : 'text-slate-500'}`}>
                    {getAnchorPillLabel(anchor)}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{anchor.name}</p>
                  <p className={`mt-1 text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {anchor.neighborhood}
                  </p>
                </div>
                {isActive ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                    Selected
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Candidate Next Stops
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              Choose where the journey goes next
            </h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {journeyState.legs.length} leg{journeyState.legs.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {candidateStops.map((stop) => {
            const isActive = stop.anchor.id === journeyState.destinationAnchorId;

            return (
              <button
                key={stop.id}
                type="button"
                onClick={() => onDestinationSelect(stop.anchor.id)}
                className={[
                  'w-full rounded-2xl border px-4 py-3 text-left transition',
                  isActive
                    ? 'border-sky-400 bg-sky-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{stop.anchor.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {stop.anchor.neighborhood}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{stop.rationale}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {formatJourneyMinutes(stop.estimatedMinutes)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
