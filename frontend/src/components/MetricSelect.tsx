'use client';

import type { MetricMetadata } from "@/types/dataset";
import clsx from "clsx";

interface MetricSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: MetricMetadata[];
  className?: string;
  helper?: string;
}

export function MetricSelect({
  id,
  label,
  value,
  onChange,
  options,
  className,
  helper
}: MetricSelectProps) {
  return (
    <label className={clsx("flex flex-col gap-1 text-sm", className)} htmlFor={id}>
      <span className="font-medium text-slate-700">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base shadow-sm transition hover:border-brand-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}
