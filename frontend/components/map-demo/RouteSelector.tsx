import type { DemoRouteOption, DemoRouteType } from '@/types/mapDemo';

interface RouteSelectorProps {
  options: DemoRouteOption[];
  selectedRouteId: DemoRouteType;
  onSelect: (routeId: DemoRouteType) => void;
}

export function RouteSelector({
  options,
  selectedRouteId,
  onSelect,
}: RouteSelectorProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/92 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Route Modes
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Scaffolded selectors</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Routing next
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {options.map((option) => {
          const isActive = option.id === selectedRouteId;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={[
                'rounded-2xl border px-4 py-3 text-left transition',
                isActive
                  ? 'border-slate-900 bg-slate-950 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: option.accent }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold">{option.label}</span>
              </div>
              <p className={`mt-2 text-xs leading-5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                {option.summary}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
