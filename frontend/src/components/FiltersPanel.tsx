'use client';

import clsx from "clsx";
import { TEAM_COLORS } from "@/config/colors";

interface ToggleOption {
  value: string;
  label: string;
  color?: string;
}

interface TeamConditionGroup {
  team: string;
  label: string;
  conditions: string[];
}

interface FiltersPanelProps {
  harmOptions: ToggleOption[];
  selectedHarmLevels: string[];
  onSelectSeverity: (severity: string) => void;
  teamGroups: TeamConditionGroup[];
  selectedTeams: string[];
  selectedTeamConditions: Record<string, string[]>;
  onToggleTeam: (team: string) => void;
  onToggleTeamCondition: (team: string, condition: string) => void;
  conditionColorMap: Map<string, string>;
  caseOptions: ToggleOption[];
  selectedCase: string;
  onSelectCase: (value: string) => void;
  minTrials: number;
  minTrialsRange: { min: number; max: number };
  onMinTrialsChange: (value: number) => void;
}

function TogglePill({
  label,
  active,
  onClick,
  color,
  disabled = false
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}) {
  const baseColor = color ?? "#6E5DC6";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        active
          ? "border-transparent text-white shadow"
          : "bg-white text-slate-600 hover:brightness-95",
        disabled ? "cursor-not-allowed opacity-60" : null
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
  onSelectSeverity,
  teamGroups,
  selectedTeams,
  selectedTeamConditions,
  onToggleTeam,
  onToggleTeamCondition,
  conditionColorMap,
  caseOptions,
  selectedCase,
  onSelectCase,
  minTrials,
  minTrialsRange,
  onMinTrialsChange
}: FiltersPanelProps) {
  const minAllowed = Math.max(minTrialsRange.min, 1);

  const clampTrials = (value: number) => {
    return Math.min(
      Math.max(
        Number.isFinite(value) ? Math.round(value) : minAllowed,
        minAllowed
      ),
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
          Refine the dashboard by harm severity, team composition, case focus, and data volume.
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
            Teams &amp; Conditions
          </span>
          <div className="flex flex-col gap-3">
            {teamGroups.map((group) => {
              const isSelected = selectedTeams.includes(group.team);
              const selectedConditionsForTeam =
                selectedTeamConditions[group.team] ?? group.conditions;

              return (
                <div
                  key={group.team || "unspecified-team"}
                  className={clsx(
                    "rounded-2xl border p-3 transition",
                    isSelected
                      ? "border-brand-200 bg-white shadow-sm"
                      : "border-slate-200 bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <TogglePill
                      label={group.label}
                      active={isSelected}
                      onClick={() => onToggleTeam(group.team)}
                      color={TEAM_COLORS[group.team] ?? TEAM_COLORS.default}
                    />
                    {group.conditions.length ? (
                      <div className="flex items-center gap-1">
                        {group.conditions.map((condition) => {
                          const color =
                            conditionColorMap.get(condition) ??
                            TEAM_COLORS[group.team] ??
                            TEAM_COLORS.default;
                          const isActive = selectedConditionsForTeam.includes(condition);
                          return (
                            <span
                              key={condition}
                              className={clsx(
                                "h-1.5 w-6 rounded-full",
                                !isSelected ? "opacity-20" : !isActive ? "opacity-30" : ""
                              )}
                              style={{ backgroundColor: color }}
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  {group.conditions.length ? (
                    <div
                      className={clsx(
                        "mt-3 flex flex-col gap-2",
                        isSelected ? "" : "pointer-events-none opacity-60"
                      )}
                    >
                      {group.conditions.map((condition) => {
                        const isActive = selectedConditionsForTeam.includes(condition);
                        const disabled = !isSelected || group.conditions.length <= 1;
                        const color =
                          conditionColorMap.get(condition) ??
                          TEAM_COLORS[group.team] ??
                          TEAM_COLORS.default;
                        return (
                          <button
                            key={condition}
                            type="button"
                            disabled={disabled}
                            onClick={() => onToggleTeamCondition(group.team, condition)}
                            className={clsx(
                              "flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left transition",
                              isActive
                                ? "border-transparent bg-brand-50 text-brand-700 shadow-sm"
                                : "border-slate-200 bg-white text-slate-600 hover:border-brand-200",
                              disabled ? "cursor-not-allowed opacity-70 hover:border-slate-200" : null
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={clsx(
                                  "h-2.5 w-2.5 rounded-full",
                                  isActive ? "" : "opacity-40"
                                )}
                                style={{ backgroundColor: color }}
                              />
                              {condition}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      No additional configurations for this team.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cases
          </span>
          <div className="flex flex-wrap gap-2">
            {caseOptions.map((option) => (
              <TogglePill
                key={option.value}
                label={option.label}
                active={selectedCase === option.value}
                onClick={() => onSelectCase(option.value)}
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
              min={minAllowed}
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
              min={minAllowed}
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
