'use client';

import type { LogLine } from '@/lib/itineraryStream';

interface StreamProgressProps {
  logs: LogLine[];
  isStreaming: boolean;
}

const EVENT_ICON: Record<string, string> = {
  planning:       '🧠',
  skeleton_ready: '📋',
  geocoding:      '📍',
  searching_block:'🔍',
  block_ready:    '✅',
  fetching_videos:'🎬',
  complete:       '🎉',
  error:          '❌',
};

const EVENT_COLOR: Record<string, string> = {
  planning:       'text-violet-500',
  skeleton_ready: 'text-blue-500',
  geocoding:      'text-cyan-500',
  searching_block:'text-amber-500',
  block_ready:    'text-emerald-500',
  fetching_videos:'text-pink-500',
  complete:       'text-emerald-600 font-semibold',
  error:          'text-red-500 font-semibold',
};

export function StreamProgress({ logs, isStreaming }: StreamProgressProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl">✈️</span>
            {isStreaming && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Building your itinerary</h2>
            <p className="text-xs text-slate-400">This takes around 30–60 seconds…</p>
          </div>
        </div>

        {/* Log feed */}
        <div className="px-6 py-4 h-72 overflow-y-auto space-y-2 font-mono text-sm bg-slate-50">
          {logs.length === 0 && (
            <p className="text-slate-400 text-xs">Connecting to server…</p>
          )}
          {logs.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-base shrink-0 leading-tight">
                {EVENT_ICON[line.event] ?? '⚙️'}
              </span>
              <span className={`leading-snug ${EVENT_COLOR[line.event] ?? 'text-slate-600'}`}>
                {line.message}
              </span>
              <span className="ml-auto text-[10px] text-slate-300 shrink-0 pt-0.5">
                {line.timestamp}
              </span>
            </div>
          ))}
          {isStreaming && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
            style={{
              width: logs.length === 0 ? '4%'
                : logs.some(l => l.event === 'complete') ? '100%'
                : `${Math.min(10 + logs.length * 10, 90)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
