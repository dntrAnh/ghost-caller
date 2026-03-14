'use client';

import React, { useState, useRef, useEffect } from 'react';

// ─── Input class helper ───────────────────────────────────────────────────────

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 ' +
  'focus:border-violet-300 transition-colors duration-150';

export const textareaCls =
  inputCls + ' resize-none leading-relaxed';

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  description?: string;
  icon: string;
  children: React.ReactNode;
}

export function SectionCard({ title, description, icon, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
      <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-white to-slate-50/50">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-xl shrink-0">
            {icon}
          </div>
          <div className="pt-0.5">
            <h2 className="text-lg font-semibold text-slate-900 leading-tight">{title}</h2>
            {description && (
              <p className="text-sm text-slate-500 mt-1 leading-snug">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 py-6 space-y-6">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  helper?: string;
  optional?: boolean;
  children: React.ReactNode;
}

export function Field({ label, helper, optional, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {optional && (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
            optional
          </span>
        )}
      </div>
      {helper && <p className="text-xs text-slate-400 leading-relaxed">{helper}</p>}
      {children}
    </div>
  );
}

// ─── ChipSelect ───────────────────────────────────────────────────────────────

type ColorScheme = 'violet' | 'rose' | 'amber' | 'emerald' | 'sky';

interface ChipSelectProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  multi?: boolean;
  colorScheme?: ColorScheme;
}

const chipColors: Record<ColorScheme, { sel: string; unsel: string }> = {
  violet: {
    sel: 'bg-violet-100 text-violet-700 border-violet-300 shadow-sm',
    unsel: 'bg-white text-slate-600 border-slate-200 hover:border-violet-200 hover:text-violet-600 hover:bg-violet-50/50',
  },
  rose: {
    sel: 'bg-rose-100 text-rose-700 border-rose-300 shadow-sm',
    unsel: 'bg-white text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/50',
  },
  amber: {
    sel: 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm',
    unsel: 'bg-white text-slate-600 border-slate-200 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50/50',
  },
  emerald: {
    sel: 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm',
    unsel: 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/50',
  },
  sky: {
    sel: 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm',
    unsel: 'bg-white text-slate-600 border-slate-200 hover:border-sky-200 hover:text-sky-600 hover:bg-sky-50/50',
  },
};

export function ChipSelect({
  options,
  selected,
  onChange,
  multi = true,
  colorScheme = 'violet',
}: ChipSelectProps) {
  const colors = chipColors[colorScheme];

  const toggle = (value: string) => {
    if (multi) {
      onChange(
        selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value]
      );
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer select-none ${
              isSelected ? colors.sel : colors.unsel
            }`}
          >
            {isSelected && <span className="mr-1 text-xs">✓</span>}
            {option}
          </button>
        );
      })}
    </div>
  );
}

// ─── TagInput ─────────────────────────────────────────────────────────────────

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  colorScheme?: ColorScheme;
}

export function TagInput({
  values,
  onChange,
  placeholder = 'Type and press Enter…',
  colorScheme = 'violet',
}: TagInputProps) {
  const [input, setInput] = useState('');
  const colors = chipColors[colorScheme];

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput('');
  };

  const remove = (value: string) => onChange(values.filter((v) => v !== value));

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className={`inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full border text-sm font-medium ${colors.sel}`}
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors text-xs leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 px-4 py-2 rounded-xl bg-violet-100 text-violet-700 text-sm font-medium hover:bg-violet-200 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── SegmentedControl ─────────────────────────────────────────────────────────

interface SegOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all duration-150 min-w-0 ${
            value === opt.value
              ? 'bg-white text-violet-700 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full text-left py-3 px-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
    >
      <div>
        <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4 ${
          checked ? 'bg-violet-600' : 'bg-slate-200'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}

// ─── RangeSlider ──────────────────────────────────────────────────────────────

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (v: number) => string;
}

export function RangeSlider({ min, max, step, value, onChange, formatValue }: RangeSliderProps) {
  const fmt = formatValue ?? String;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-400">{fmt(min)}</span>
        <span className="text-base font-semibold text-violet-700">{fmt(value)}</span>
        <span className="text-xs text-slate-400">{fmt(max)}</span>
      </div>
      <div className="relative">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-violet-500 shadow-md transition-all duration-100 pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
    </div>
  );
}

// ─── NumberStepper ────────────────────────────────────────────────────────────

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function NumberStepper({ value, onChange, min = 1, max = 20, label }: NumberStepperProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-violet-200 hover:text-violet-600 transition-colors flex items-center justify-center font-medium text-lg"
      >
        −
      </button>
      <div className="min-w-[3rem] text-center">
        <span className="text-xl font-semibold text-slate-900">{value}</span>
        {label && <p className="text-xs text-slate-400">{label}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-violet-200 hover:text-violet-600 transition-colors flex items-center justify-center font-medium text-lg"
      >
        +
      </button>
    </div>
  );
}

// ─── BudgetCard ───────────────────────────────────────────────────────────────

interface BudgetCardProps {
  tier: string;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export function BudgetCard({ tier, label, description, selected, onClick }: BudgetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-[100px] p-4 rounded-xl border-2 text-center transition-all duration-150 ${
        selected
          ? 'border-violet-400 bg-violet-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/30'
      }`}
    >
      <div className={`text-xl font-bold mb-1 ${selected ? 'text-violet-700' : 'text-slate-700'}`}>
        {tier}
      </div>
      <div className={`text-xs font-semibold mb-0.5 ${selected ? 'text-violet-600' : 'text-slate-600'}`}>
        {label}
      </div>
      <div className="text-[11px] text-slate-400">{description}</div>
    </button>
  );
}

// ─── Disclosure ───────────────────────────────────────────────────────────────

interface DisclosureProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  colorScheme?: 'default' | 'red';
}

export function Disclosure({ label, hint, children, defaultOpen = false, colorScheme = 'default' }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  // unused — kept for ref stability
  useEffect(() => {}, []);

  const accent = colorScheme === 'red'
    ? 'text-rose-500 hover:text-rose-700'
    : 'text-violet-500 hover:text-violet-700';

  return (
    <div className="border-t border-slate-100 pt-4 mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-sm font-medium transition-colors w-full text-left ${accent}`}
      >
        <span
          className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs leading-none transition-all ${
            open
              ? colorScheme === 'red'
                ? 'bg-rose-50 border-rose-300 text-rose-600'
                : 'bg-violet-50 border-violet-300 text-violet-600'
              : 'border-slate-200 text-slate-400'
          }`}
        >
          {open ? '−' : '+'}
        </span>
        {label}
        {hint && !open && (
          <span className="text-slate-400 text-xs font-normal">{hint}</span>
        )}
      </button>

      {open && (
        <div ref={contentRef} className="mt-5 space-y-5 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}
