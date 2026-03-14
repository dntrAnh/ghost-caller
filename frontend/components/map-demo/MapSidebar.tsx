import {
  formatDistanceMiles,
  formatJourneyMinutes,
  formatWalkingDistance,
  getSegmentAccentColor,
  haversineDistanceMiles,
} from '@/lib/map-demo/mapHelpers';
import type {
  DemoRouteOption,
  DemoRouteType,
  JourneyAnchor,
  JourneyBuilderState,
  NearbyDiscoverySummary,
} from '@/types/mapDemo';

interface MapSidebarProps {
  routeOptions: DemoRouteOption[];
  selectedRouteId: DemoRouteType;
  discovery: NearbyDiscoverySummary;
  startAnchor: JourneyAnchor;
  destinationAnchor: JourneyAnchor | null;
  journeyState: JourneyBuilderState;
}

export function MapSidebar({
  routeOptions,
  selectedRouteId,
  discovery,
  startAnchor,
  destinationAnchor,
  journeyState,
}: MapSidebarProps) {
  const selectedRoute = routeOptions.find((option) => option.id === selectedRouteId) ?? routeOptions[0];
  const activeLeg = journeyState.legs.at(-1) ?? null;

  return (
    <aside className="flex h-full flex-col gap-4 rounded-[32px] border border-slate-200 bg-white/92 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Map Demo
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          NYC map-first itinerary sandbox
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This page is isolated from the existing itinerary UI and is set up for high-fidelity transit-first map work.
        </p>
      </div>

      <section className="rounded-[28px] bg-slate-950 px-5 py-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          Active Hotel
        </p>
        <h2 className="mt-2 text-xl font-semibold">{discovery.hotel.name}</h2>
        <p className="mt-1 text-sm text-slate-300">{discovery.hotel.neighborhood}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{discovery.hotel.description}</p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Route Summary
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">{selectedRoute.label}</h3>
          </div>
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedRoute.accent }} />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{selectedRoute.summary}</p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Current Leg
        </p>
        <div className="mt-3 rounded-2xl bg-slate-950 px-4 py-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Start</p>
          <p className="mt-1 text-base font-semibold">{startAnchor.name}</p>
          <p className="mt-1 text-sm text-slate-300">{startAnchor.neighborhood}</p>

          <div className="my-4 h-px bg-white/10" />

          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Next destination</p>
          <p className="mt-1 text-base font-semibold">
            {destinationAnchor ? destinationAnchor.name : 'Choose a stop'}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {destinationAnchor ? destinationAnchor.neighborhood : 'Select a candidate stop to draw the first leg.'}
          </p>

          {activeLeg ? (
            <div className="mt-4 rounded-2xl bg-white/8 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {activeLeg.mode === 'transit' ? 'Transit journey' : 'Direct segment'}
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {activeLeg.from.name} to {activeLeg.to.name}
              </p>
              <p className="mt-1 text-sm font-medium text-cyan-300">
                {formatJourneyMinutes(activeLeg.estimatedMinutes)}
              </p>
            </div>
          ) : null}

          {journeyState.status === 'loading' ? (
            <div className="mt-4 rounded-2xl bg-white/8 px-3 py-3 text-sm text-slate-200">
              Fetching transit directions from Google Routes API.
            </div>
          ) : null}
        </div>
      </section>

      {activeLeg ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Transit Timeline
          </p>
          <div className="mt-3 space-y-3">
            {activeLeg.segments.map((segment, index) => (
              <div key={segment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: getSegmentAccentColor(segment) }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {index + 1}. {segment.label}
                      </p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {formatJourneyMinutes(segment.estimatedMinutes)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{segment.instruction}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatDistanceMiles(segment.distanceMeters)}</span>
                      {segment.transitDetails?.stopCount ? (
                        <span>{segment.transitDetails.stopCount} stops</span>
                      ) : null}
                      {segment.transitDetails?.headsign ? (
                        <span>toward {segment.transitDetails.headsign}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Nearby Subway
        </p>
        <div className="mt-3 space-y-3">
          {discovery.nearbyStations.map((station) => {
            const distance = haversineDistanceMiles(discovery.hotel.coordinates, station.coordinates);

            return (
              <div key={station.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{station.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {station.neighborhood}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                    {formatWalkingDistance(distance)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {station.servedLines.map((line) => (
                    <span
                      key={line}
                      className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Restaurants
          </p>
          <div className="mt-3 space-y-2">
            {discovery.nearbyRestaurants.map((place) => (
              <div key={place.id}>
                <p className="text-sm font-semibold text-slate-900">{place.name}</p>
                <p className="text-xs text-slate-500">{place.neighborhood}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Attractions
          </p>
          <div className="mt-3 space-y-2">
            {discovery.nearbyAttractions.map((place) => (
              <div key={place.id}>
                <p className="text-sm font-semibold text-slate-900">{place.name}</p>
                <p className="text-xs text-slate-500">{place.neighborhood}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
}
