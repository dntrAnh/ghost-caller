import Link from 'next/link';

import { mockGroupSession } from '@/lib/mockGroupSession';

const FEATURES = [
  {
    number: '01',
    title: 'Shared preference intake',
    description:
      'See who is in the group, compare vibe and budget signals, and shape one plan around everyone instead of one person.',
  },
  {
    number: '02',
    title: 'Live collaborative routing',
    description:
      'As the group locks in each venue, the map updates with the real route so everyone can follow the day together.',
  },
  {
    number: '03',
    title: 'One tap reservation help',
    description:
      'When the group is aligned, Ghost Caller handles the restaurant call so nobody gets stuck coordinating logistics.',
  },
];

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  invited: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;

function memberInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export default function HomePage() {
  const currentUser = mockGroupSession.members.find((member) => member.isCurrentUser);

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-[#0F1117]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#E2E6EE] bg-[#FFFFFF]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-base font-bold tracking-tight text-[#0F1117]">Let Me Know</span>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[#E2E6EE] bg-[#F9FAFB] px-3 py-1 text-xs font-semibold text-[#5A6478] sm:inline-flex">
              Session {mockGroupSession.id}
            </span>
            <Link
              href="/planner"
              className="rounded-md bg-[#FF4500] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#FF6620]"
            >
              Open Group Planner
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-20 pt-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[18%] top-[18%] h-[320px] w-[320px] rounded-full bg-[#FF4500]/8 blur-[110px]" />
          <div className="absolute right-[14%] top-[28%] h-[360px] w-[360px] rounded-full bg-[#2563EB]/8 blur-[130px]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E6EE] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#5A6478] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              You joined {mockGroupSession.name}
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-[1.02] tracking-tight text-[#0F1117] sm:text-6xl lg:text-7xl">
              Plan the day
              <br />
              <span className="text-[#FF4500]">with the whole group.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[#5A6478]">
              {currentUser?.name ?? 'You'} are inside a shared planning session with {mockGroupSession.hostName}, Maya, and Ethan.
              Compare preferences, build one route together, and lock the day without another chaotic group chat.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/planner"
                className="inline-flex items-center justify-center rounded-md bg-[#FF4500] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6620]"
              >
                Continue Planning
              </Link>
              <div className="rounded-2xl border border-[#E2E6EE] bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B95A8]">Invite code</p>
                <p className="mt-1 font-mono text-sm font-bold text-[#0F1117]">{mockGroupSession.id}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[#5A6478]">
              <span className="rounded-full border border-[#E2E6EE] bg-white px-3 py-1.5 shadow-sm">
                Invited by {mockGroupSession.invitedBy}
              </span>
              <span className="rounded-full border border-[#E2E6EE] bg-white px-3 py-1.5 shadow-sm">
                {mockGroupSession.createdLabel}
              </span>
              <span className="rounded-full border border-[#E2E6EE] bg-white px-3 py-1.5 shadow-sm">
                {mockGroupSession.statusLabel}
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[32px] border border-[#E2E6EE] bg-white/88 p-5 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.32)] backdrop-blur-sm">
              <div className="rounded-[28px] border border-[#E2E6EE] bg-[#FBFCFD] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B95A8]">Shared session</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0F1117]">{mockGroupSession.name}</h2>
                    <p className="mt-1 text-sm text-[#5A6478]">
                      Saturday in Manhattan · hosted by {mockGroupSession.hostName}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#E2E6EE] bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B95A8]">Group ID</p>
                    <p className="mt-1 font-mono text-sm font-bold text-[#0F1117]">{mockGroupSession.id}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#E2E6EE] bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B95A8]">Members</p>
                    <p className="mt-1 text-lg font-bold text-[#0F1117]">{mockGroupSession.members.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[#E2E6EE] bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B95A8]">Host</p>
                    <p className="mt-1 text-lg font-bold text-[#0F1117]">{mockGroupSession.hostName}</p>
                  </div>
                  <div className="rounded-2xl border border-[#E2E6EE] bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B95A8]">Status</p>
                    <p className="mt-1 text-lg font-bold text-[#0F1117]">Live</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B95A8]">Participants</p>
                    <p className="text-xs text-[#8B95A8]">Shared preferences will shape one itinerary</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {mockGroupSession.members.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                          member.isCurrentUser
                            ? 'border-[#FFB08F] bg-[#FFF6F2] shadow-sm'
                            : 'border-[#E2E6EE] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                              member.isCurrentUser
                                ? 'bg-[#FF4500] text-white'
                                : 'bg-[#EEF2FF] text-[#374151]'
                            }`}
                          >
                            {memberInitials(member.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[#0F1117]">{member.name}</p>
                              {member.role === 'host' ? (
                                <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-semibold text-[#4F46E5]">
                                  Host
                                </span>
                              ) : null}
                              {member.isCurrentUser ? (
                                <span className="rounded-full bg-[#FFE8DD] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm text-[#5A6478]">{member.joinedLabel}</p>
                          </div>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[member.status]}`}>
                          {member.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#8B95A8]">How this session works</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#0F1117]">A shared planning room, not a solo form.</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A6478]">
            The planner already knows this is a group session. Everyone adds preferences, the route updates live, and the final plan is built for the whole crew.
          </p>
        </div>

        <div className="grid gap-px border border-[#E2E6EE] bg-[#E2E6EE] sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.number} className="bg-[#F6F8FA] p-8 transition-colors hover:bg-[#FFFFFF]">
              <p className="mb-6 font-mono text-xs font-medium text-[#FF4500]">{feature.number}</p>
              <h3 className="mb-3 text-lg font-semibold text-[#0F1117]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#5A6478]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 rounded-[32px] border border-[#E2E6EE] bg-white px-8 py-10 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B95A8]">Ready to continue?</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F1117]">Jump back into {mockGroupSession.name}.</h2>
            <p className="mt-3 text-sm text-[#5A6478]">
              Everyone is already in the room. Open the planner to review the group preferences and keep building the itinerary together.
            </p>
          </div>
          <Link
            href="/planner"
            className="inline-flex items-center justify-center rounded-md bg-[#FF4500] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#FF6620]"
          >
            Open Shared Planner
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E2E6EE]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-sm font-semibold text-[#0F1117]">Let Me Know</span>
          <span className="text-xs text-[#8B95A8]">{mockGroupSession.name} · {mockGroupSession.id}</span>
        </div>
      </footer>
    </div>
  );
}
