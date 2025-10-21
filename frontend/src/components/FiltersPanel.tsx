'use client';

import clsx from "clsx";
import { CONDITION_COLORS } from "@/config/colors";

interface ToggleOption {
  value: string;
  label: string;
  color?: string;
}

interface FiltersPanelProps {
  harmOptions: ToggleOption[];
  selectedHarmLevels: string[];
  roleOptions: ToggleOption[];
  selectedRoles: string[];
  onToggleRole: (role: string) => void;
  conditionOptions: ToggleOption[];
  selectedConditions: string[];
  onToggleCondition: (condition: string) => void;
  onSelectSeverity: (severity: string) => void;
  minTrials: number;
  minTrialsRange: { min: number; max: number };
  onMinTrialsChange: (value: number) => void;
}

function TogglePill({
  label,
  active,
  onClick,
  color
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  const baseColor = color ?? "#6E5DC6";
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        active
          ? "border-transparent text-white shadow"
          : "bg-white text-slate-600 hover:brightness-95"
      )}
      style={
        active
          ? {
              backgroundColor: baseColor,
              borderColor: baseColor
            }
          : {
              borderColor: baseColor,
              color: baseColor
            }
      }
    >
      {label}
    </button>
  );
}

export function FiltersPanel({
  harmOptions,
  selectedHarmLevels,
  roleOptions,
  selectedRoles,
  onToggleRole,
  conditionOptions,
  selectedConditions,
  onToggleCondition,
  onSelectSeverity,
  minTrials,
  minTrialsRange,
  onMinTrialsChange
}: FiltersPanelProps) {
  const clampTrials = (value: number) => {
    return Math.min(
      Math.max(Number.isFinite(value) ? Math.round(value) : minTrialsRange.min, minTrialsRange.min),
      minTrialsRange.max
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200">
      <header className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Filters
        </h2>
        <p className="text-sm text-slate-600">
          Refine the dashboard by harm severity, agent role, condition, and data volume.
        </p>
      </header>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Harm Severity
          </span>
          <div className="flex flex-wrap gap-2">
            {harmOptions.map((option) => (
              <TogglePill
                key={option.value}
                label={option.label}
                color={option.color}
                active={selectedHarmLevels.includes(option.value)}
                onClick={() => onSelectSeverity(option.value)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Role
          </span>
          <div className="flex flex-wrap gap-2">
            {roleOptions.map((option) => (
              <TogglePill
                key={option.value}
                label={option.label}
                active={selectedRoles.includes(option.value)}
                onClick={() => onToggleRole(option.value)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Condition
          </span>
          <div className="flex flex-wrap gap-2">
            {conditionOptions.map((option) => (
              <TogglePill
                key={option.value}
                label={option.label}
                active={selectedConditions.includes(option.value)}
                onClick={() => onToggleCondition(option.value)}
                color={CONDITION_COLORS[option.value]}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Minimum Trials
          </span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={minTrialsRange.min}
              max={minTrialsRange.max}
              step={1}
              value={minTrials}
              onChange={(event) =>
                onMinTrialsChange(clampTrials(Number(event.target.value)))
              }
              className="accent-brand-600 flex-1"
            />
            <input
              type="number"
              min={minTrialsRange.min}
              max={minTrialsRange.max}
              value={minTrials}
              onChange={(event) =>
                onMinTrialsChange(clampTrials(Number(event.target.value)))
              }
              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700 shadow-sm"
            />
          </div>
          <p className="text-xs text-slate-500">
            Showing results with at least {minTrials} trials.
          </p>
        </div>
      </div>
    </section>
  );
}
