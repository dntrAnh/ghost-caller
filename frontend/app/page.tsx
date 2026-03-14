import { PlannerForm } from '@/components/planner/PlannerForm';

export default function PlannerPage() {
  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="border-b border-slate-100 bg-white/70 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI Itinerary Planner
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Plan your{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              perfect day
            </span>
          </h1>

          <p className="text-slate-500 text-base">
            Four quick steps and we'll build a personalized itinerary for your day out.
          </p>
        </div>
      </header>

      {/* ── Form ── */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <PlannerForm />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 mt-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <p className="text-xs text-slate-300 text-center">
            Frontend preview · No data is sent anywhere
          </p>
        </div>
      </footer>
    </div>
  );
}
