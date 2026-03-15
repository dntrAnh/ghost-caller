import Link from 'next/link';

const FEATURES = [
  {
    number: '01',
    title: 'AI Itinerary Builder',
    description:
      'Describe your group, vibe, and budget. Our coordinator agent plans a full day around you — not a generic template.',
  },
  {
    number: '02',
    title: 'Live Route Mapping',
    description:
      'Every venue you pick gets routed in real time on a satellite map. Walking, transit, and subway segments calculated on the fly.',
  },
  {
    number: '03',
    title: 'Ghost Caller',
    description:
      'When the itinerary is locked in, our AI agent calls the restaurant for you — confirms the reservation, gets a code, done.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F6F8FA] text-[#0F1117]">
      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#E2E6EE] bg-[#FFFFFF]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-base font-bold tracking-tight text-[#0F1117]">Ghost Caller</span>
          <Link
            href="/planner"
            className="rounded-md bg-[#FF4500] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#FF6620]"
          >
            Open Planner
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[480px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4500]/5 blur-[120px]" />
        </div>

        <div className="relative max-w-3xl">
          <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-[#0F1117] sm:text-6xl lg:text-7xl">
            Plan the day.<br />
            <span className="text-[#FF4500]">Skip the group chat.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg font-medium leading-relaxed text-[#5A6478]">
            Tell us who&apos;s coming, what you&apos;re into, and where you&apos;re starting.
            We handle the itinerary, the map, and the reservation call.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/planner"
              className="rounded-md bg-[#FF4500] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6620]"
            >
              Start Planning
            </Link>
            <span className="text-sm text-[#8B95A8]">Free · No account needed</span>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-xs text-[#8B95A8]">
            <span>How it works</span>
            <div className="h-6 w-px bg-[#E2E6EE]" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#8B95A8]">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#0F1117]">Three steps. One seamless day.</h2>
        </div>

        <div className="grid gap-px border border-[#E2E6EE] bg-[#E2E6EE] sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.number} className="bg-[#F6F8FA] p-8 transition-colors hover:bg-[#FFFFFF]">
              <p className="mb-6 font-mono text-xs font-medium text-[#FF4500]">{f.number}</p>
              <h3 className="mb-3 text-lg font-semibold text-[#0F1117]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[#5A6478]">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E6EE]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-sm font-semibold text-[#0F1117]">Ghost Caller</span>
          <span className="text-xs text-[#8B95A8]">Built for the hackathon</span>
        </div>
      </footer>
    </div>
  );
}
