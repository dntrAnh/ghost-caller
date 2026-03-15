'use client';

import React, { useState, useRef, useEffect } from 'react';

// ─── Input / textarea classes ─────────────────────────────────────────────────

export const inputCls =
  'w-full rounded-md border border-[#E2E6EE] bg-[#FFFFFF] px-3.5 py-2.5 text-sm ' +
  'text-[#0F1117] placeholder:text-[#8B95A8] ' +
  'focus:outline-none focus:ring-1 focus:ring-[#FF4500]/40 focus:border-[#FF4500] ' +
  'transition-colors duration-150';

export const textareaCls = inputCls + ' resize-none leading-relaxed';

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  description?: string;
  icon: string; // kept for API compat, not rendered
  children: React.ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <div className="rounded-md border border-[#E2E6EE] bg-[#FFFFFF] overflow-hidden animate-slide-up">
      <div className="px-6 py-5 border-b border-[#E2E6EE]">
        <h2 className="text-base font-semibold text-[#0F1117] leading-tight">{title}</h2>
        {description && (
          <p className="text-sm text-[#5A6478] mt-1 leading-snug">{description}</p>
        )}
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
        <label className="text-sm font-medium text-[#5A6478]">{label}</label>
        {optional && (
          <span className="text-[11px] font-medium text-[#8B95A8] border border-[#E2E6EE] px-2 py-0.5 rounded-full">
            optional
          </span>
        )}
      </div>
      {helper && <p className="text-xs text-[#8B95A8] leading-relaxed">{helper}</p>}
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

export function ChipSelect({
  options,
  selected,
  onChange,
  multi = true,
}: ChipSelectProps) {
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
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
              isSelected
                ? 'bg-[#FF4500]/10 text-[#FF4500] border-[#FF4500]/30'
                : 'bg-transparent text-[#5A6478] border-[#E2E6EE] hover:border-[#FF4500]/20 hover:text-[#0F1117]'
            }`}
          >
            {isSelected && <span className="mr-1 text-[10px]">✓</span>}
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
}: TagInputProps) {
  const [input, setInput] = useState('');

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
              className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full border border-[#FF4500]/30 bg-[#FF4500]/10 text-[#FF4500] text-xs font-medium"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-xs leading-none"
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
            if (e.key === 'Enter') { e.preventDefault(); add(); }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 px-4 py-2 rounded-md border border-[#E2E6EE] bg-[#FFFFFF] text-[#5A6478] text-xs font-medium hover:border-[#FF4500]/30 hover:text-[#FF4500] transition-colors"
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
    <div className="flex rounded-md border border-[#E2E6EE] bg-[#F6F8FA] p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-all duration-150 min-w-0 ${
            value === opt.value
              ? 'bg-[#FFFFFF] text-[#0F1117] shadow-sm border border-[#E2E6EE]'
              : 'text-[#8B95A8] hover:text-[#5A6478]'
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
      className="flex items-center justify-between w-full text-left py-3 px-4 rounded-md border border-[#E2E6EE] bg-[#FFFFFF] hover:bg-[#F0F2F6] transition-colors group"
    >
      <div>
        <p className="text-sm font-medium text-[#5A6478] group-hover:text-[#0F1117] transition-colors">{label}</p>
        {description && <p className="text-xs text-[#8B95A8] mt-0.5">{description}</p>}
      </div>
      <div
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ml-4 ${
          checked ? 'bg-[#FF4500]' : 'bg-[#E2E6EE]'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0'
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
        <span className="text-xs text-[#8B95A8]">{fmt(min)}</span>
        <span className="text-sm font-semibold text-[#FF4500]">{fmt(value)}</span>
        <span className="text-xs text-[#8B95A8]">{fmt(max)}</span>
      </div>
      <div className="relative">
        <div className="h-1.5 bg-[#E2E6EE] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF4500] rounded-full transition-all duration-100"
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
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0F1117] border-2 border-[#FF4500] shadow transition-all duration-100 pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
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
        className="w-9 h-9 rounded-md border border-[#E2E6EE] bg-[#FFFFFF] text-[#5A6478] hover:border-[#FF4500]/30 hover:text-[#FF4500] transition-colors flex items-center justify-center font-medium text-lg"
      >
        −
      </button>
      <div className="min-w-[3rem] text-center">
        <span className="text-xl font-semibold text-[#0F1117]">{value}</span>
        {label && <p className="text-xs text-[#8B95A8]">{label}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-md border border-[#E2E6EE] bg-[#FFFFFF] text-[#5A6478] hover:border-[#FF4500]/30 hover:text-[#FF4500] transition-colors flex items-center justify-center font-medium text-lg"
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
      className={`flex-1 min-w-[80px] p-4 rounded-md border-2 text-center transition-all duration-150 ${
        selected
          ? 'border-[#FF4500]/50 bg-[#FF4500]/8'
          : 'border-[#E2E6EE] bg-[#FFFFFF] hover:border-[#FF4500]/20'
      }`}
    >
      <div className={`text-lg font-bold mb-1 ${selected ? 'text-[#FF4500]' : 'text-[#0F1117]'}`}>
        {tier}
      </div>
      <div className={`text-xs font-semibold mb-0.5 ${selected ? 'text-[#FF4500]' : 'text-[#5A6478]'}`}>
        {label}
      </div>
      <div className="text-[11px] text-[#8B95A8]">{description}</div>
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

export function Disclosure({ label, hint, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {}, []);

  return (
    <div className="border-t border-[#E2E6EE] pt-4 mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-medium transition-colors w-full text-left text-[#5A6478] hover:text-[#0F1117]"
      >
        <span
          className={`w-5 h-5 rounded border flex items-center justify-center text-xs leading-none transition-all ${
            open ? 'bg-[#FF4500]/10 border-[#FF4500]/30 text-[#FF4500]' : 'border-[#E2E6EE] text-[#8B95A8]'
          }`}
        >
          {open ? '−' : '+'}
        </span>
        {label}
        {hint && !open && (
          <span className="text-[#8B95A8] text-xs font-normal">{hint}</span>
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
