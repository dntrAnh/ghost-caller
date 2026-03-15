'use client';

import type { LogLine } from '@/lib/itineraryStream';

interface StreamProgressProps {
  logs: LogLine[];
  isStreaming: boolean;
}

// Terminal-style tag labels instead of emojis
const EVENT_TAG: Record<string, string> = {
  planning:        'PLAN',
  skeleton_ready:  'INIT',
  geocoding:       'GEO',
  searching_block: 'SRCH',
  block_ready:     'DONE',
  fetching_videos: 'VID',
  complete:        'OK',
  error:           'ERR',
};

const EVENT_COLOR: Record<string, string> = {
  planning:        'text-violet-700',
  skeleton_ready:  'text-blue-700',
  geocoding:       'text-cyan-700',
  searching_block: 'text-amber-700',
  block_ready:     'text-emerald-700',
  fetching_videos: 'text-pink-700',
  complete:        'text-emerald-800 font-semibold',
  error:           'text-red-700 font-semibold',
};

const TAG_COLOR: Record<string, string> = {
  planning:        'text-violet-600',
  skeleton_ready:  'text-blue-600',
  geocoding:       'text-cyan-600',
  searching_block: 'text-amber-600',
  block_ready:     'text-emerald-600',
  fetching_videos: 'text-pink-600',
  complete:        'text-emerald-700',
  error:           'text-red-600',
};

export function StreamProgress({ logs, isStreaming }: StreamProgressProps) {
  const progressWidth =
    logs.length === 0 ? '4%'
    : logs.some((l) => l.event === 'complete') ? '100%'
    : `${Math.min(10 + logs.length * 10, 90)}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F6F8FA] border border-[#E2E6EE] rounded-md shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E6EE] flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            {isStreaming && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF4500] opacity-75 animate-ping" />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isStreaming ? 'bg-[#FF4500]' : 'bg-[#8B95A8]'}`} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0F1117]">Building your itinerary</h2>
            <p className="text-xs text-[#8B95A8]">This takes 30–60 seconds</p>
          </div>
        </div>

        {/* Log feed */}
        <div className="px-5 py-4 h-72 overflow-y-auto space-y-2 font-mono text-sm bg-[#F0F2F6]">
          {logs.length === 0 && (
            <p className="text-[#8B95A8] text-xs">Connecting to server…</p>
          )}
          {logs.map((line, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className={`text-[10px] font-bold shrink-0 pt-0.5 w-10 ${TAG_COLOR[line.event] ?? 'text-[#8B95A8]'}`}>
                [{EVENT_TAG[line.event] ?? '···'}]
              </span>
              <span className={`leading-snug flex-1 ${EVENT_COLOR[line.event] ?? 'text-[#5A6478]'}`}>
                {line.message}
              </span>
              <span className="ml-auto text-[10px] text-[#8B95A8] shrink-0 pt-0.5">
                {line.timestamp}
              </span>
            </div>
          ))}
          {isStreaming && (
            <div className="flex items-center gap-1 text-[#8B95A8] text-xs pt-1">
              <span className="w-1 h-1 rounded-full bg-[#FF4500] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-[#FF4500] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-[#FF4500] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-[#E2E6EE]">
          <div
            className="h-full bg-[#FF4500] transition-all duration-700"
            style={{ width: progressWidth }}
          />
        </div>
      </div>
    </div>
  );
}
