'use client';

import React from 'react';

interface StepperProps {
  steps: string[];
  current: number;
  onSelect: (i: number) => void;
}

export function Stepper({ steps, current, onSelect }: StepperProps) {
  return (
    <div className="mb-8">
      {/* Mobile: progress bar */}
      <div className="sm:hidden space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#8B95A8] font-medium">Step {current + 1} of {steps.length}</span>
          <span className="text-[#FF4500] font-semibold">{steps[current]}</span>
        </div>
        <div className="h-0.5 bg-[#E2E6EE] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF4500] rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: connected steps */}
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
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#FF4500] text-white'
                    : isDone
                    ? 'bg-[#FF4500]/10 text-[#FF4500] hover:bg-[#FF4500]/15 cursor-pointer'
                    : 'text-[#8B95A8] cursor-default'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-[#FF4500]/20 text-[#FF4500]'
                      : 'bg-[#E2E6EE] text-[#8B95A8]'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                {label}
              </button>

              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 transition-colors duration-300 ${
                    i < current ? 'bg-[#FF4500]/25' : 'bg-[#E2E6EE]'
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
