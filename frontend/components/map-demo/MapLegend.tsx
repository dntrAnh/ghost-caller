export function MapLegend() {
  return (
    <div className="rounded-[28px] border border-white/30 bg-slate-950/72 p-4 shadow-xl backdrop-blur-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300">
        Visual Key
      </p>
      <div className="mt-3 space-y-3 text-sm text-slate-200">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold text-slate-950">
            Hotel
          </span>
          <span>Origin anchors for route generation</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-6 items-center gap-1 rounded-2xl border border-white/25 bg-white/90 px-2">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#fccc0a] text-[9px] font-bold text-slate-950">
              N
            </span>
            <span className="text-[11px] font-semibold text-slate-700">Station</span>
          </span>
          <span>Subway nodes with line badges</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-[3px] w-12 rounded-full border-b-2 border-dashed border-slate-200" />
          <span>Walking transfer</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-[3px] w-12 rounded-full bg-[#facc15] shadow-[0_0_0_3px_rgba(15,23,42,0.55)]" />
          <span>Subway segment</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-[3px] w-12 rounded-full bg-[#fb923c] shadow-[0_0_0_3px_rgba(15,23,42,0.55)]" />
          <span>Bus segment</span>
        </div>
      </div>
    </div>
  );
}
