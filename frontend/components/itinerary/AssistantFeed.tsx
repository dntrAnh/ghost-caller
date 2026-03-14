'use client';

import { useEffect, useState } from 'react';
import type { AssistantMessage } from '@/types/itinerary-result';

const TYPE_CONFIG: Record<
  AssistantMessage['type'],
  { icon: string; bg: string; text: string; border: string }
> = {
  info:       { icon: '◈', bg: 'bg-slate-50',   text: 'text-slate-600',  border: 'border-slate-100' },
  success:    { icon: '✦', bg: 'bg-violet-50',   text: 'text-violet-700', border: 'border-violet-100' },
  suggestion: { icon: '◆', bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-100' },
};

interface AssistantFeedProps {
  messages: AssistantMessage[];
}

export function AssistantFeed({ messages }: AssistantFeedProps) {
  const [visible, setVisible] = useState<AssistantMessage[]>([]);

  // Staggered reveal — feels like the AI is reasoning in real time
  useEffect(() => {
    let i = 0;
    const tick = () => {
      if (i < messages.length) {
        const msg = messages[i];
        setVisible((prev) => [...prev, msg]);
        i++;
        setTimeout(tick, 900);
      }
    };
    const t = setTimeout(tick, 600);
    return () => clearTimeout(t);
  }, [messages]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-50">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
          ✦
        </div>
        <span className="text-sm font-semibold text-slate-700">AI Travel Assistant</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="divide-y divide-slate-50">
        {visible.map((msg) => {
          const cfg = TYPE_CONFIG[msg.type];
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 px-4 py-3 animate-slide-up ${cfg.bg}`}
            >
              <span className={`text-base mt-0.5 shrink-0 ${cfg.text}`}>{cfg.icon}</span>
              <p className={`text-sm leading-snug ${cfg.text}`}>{msg.text}</p>
            </div>
          );
        })}

        {/* Typing indicator while more messages are coming */}
        {visible.length < messages.length && (
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50">
            <span className="text-slate-300">◈</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
