'use client';

import React from 'react';

interface StepperProps {
  steps: string[];
  current: number; // 0-indexed, matches form steps only (not review)
  onSelect: (i: number) => void;
}

export function Stepper({ steps, current, onSelect }: StepperProps) {
  return (
    <div className="mb-8">
      {/* ── Mobile: compact bar ── */}
      <div className="sm:hidden space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 font-medium">
            Step {current + 1} of {steps.length}
          </span>
          <span className="text-violet-600 font-semibold">{steps[current]}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Desktop: connected pill steps ── */}
      <div className="hidden sm:flex items-center">
        {steps.map((label, i) => {
          const isDone = i < current;
          const isActive = i === current;
          const canClick = i <= current;

          return (
            <React.Fragment key={i}>
              <button
                type="button"
                onClick={() => canClick && onSelect(i)}
                disabled={!canClick}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : isDone
                    ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 cursor-pointer'
                    : 'text-slate-400 cursor-default'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-violet-200 text-violet-700'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                {label}
              </button>

              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 transition-colors duration-300 ${
                    i < current ? 'bg-violet-200' : 'bg-slate-100'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
