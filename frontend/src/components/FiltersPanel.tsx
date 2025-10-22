'use client';

import type { CSSProperties } from "react";
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

interface TeamFiltersBarProps {
  teamGroups: TeamConditionGroup[];
  selectedTeams: string[];
  selectedTeamConditions: Record<string, string[]>;
  onToggleTeam: (team: string) => void;
  onToggleTeamCondition: (team: string, condition: string) => void;
  conditionColorMap: Map<string, string>;
}

export function TeamFiltersBar({
  teamGroups,
  selectedTeams,
  selectedTeamConditions,
  onToggleTeam,
  onToggleTeamCondition,
  conditionColorMap
}: TeamFiltersBarProps) {
  const inferAgentCount = (group: TeamConditionGroup) => {
    const labelMatch = group.label.match(/^(\d+)/);
    if (labelMatch) {
      const parsed = Number.parseInt(labelMatch[1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    const fromConditions = group.conditions.reduce((max, condition) => {
      const count = condition
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean).length;
      return Math.max(max, count || 0);
    }, 0);

    return Math.max(fromConditions, 1);
  };

  const getTeamCardSizing = (
    group: TeamConditionGroup,
    agentCount: number
  ): CSSProperties => {
    const baseSizing =
      agentCount >= 3
        ? { minWidth: 320, flexGrow: 1.25 }
        : agentCount === 2
        ? { minWidth: 225, flexGrow: 1.05 }
        : { minWidth: 170, flexGrow: 0.78 };

    const charWidth = agentCount >= 3 ? 7.2 : 6.2;
    const basePadding = agentCount >= 3 ? 34 : 30;

    const longestConditionLength = group.conditions.reduce(
      (max, condition) => Math.max(max, condition.trim().length),
      group.label.length
    );

    const estimatedButtonWidth = Math.max(
      agentCount >= 3 ? 170 : 135,
      Math.round(longestConditionLength * charWidth + basePadding)
    );

    const buttonCount = Math.max(group.conditions.length, 1);
    const maxPerRow = agentCount >= 3 ? 3 : 2;
    const buttonsPerRow = Math.min(buttonCount, maxPerRow);
    const estimatedRowWidth =
      estimatedButtonWidth * buttonsPerRow + (buttonsPerRow - 1) * 8;

    const minWidth = Math.min(
      560,
      Math.max(baseSizing.minWidth, estimatedRowWidth)
    );
    const flexGrow = Math.min(2, Math.max(baseSizing.flexGrow, minWidth / 280));

    return {
      flex: `${Number(flexGrow.toFixed(2))} 1 0%`,
      minWidth
    };
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          TEAM CONFIGURATION
        </h2>
      </header>
      <div className="flex flex-wrap items-stretch justify-evenly gap-4 md:gap-6">
        {teamGroups.map((group) => {
          const isSelected = selectedTeams.includes(group.team);
          const selectedConditionsForTeam =
            selectedTeamConditions[group.team] ?? group.conditions;
          const teamColor = TEAM_COLORS[group.team] ?? TEAM_COLORS.default;
          const agentCount = inferAgentCount(group);

          return (
            <div
              key={group.team || "unspecified-team"}
              className={clsx(
                "flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition",
                isSelected
                  ? "border-brand-200 bg-white shadow-sm"
                  : "border-slate-200 bg-slate-50"
              )}
              style={getTeamCardSizing(group, agentCount)}
            >
              <button
                type="button"
                onClick={() => onToggleTeam(group.team)}
                className={clsx(
                  "mx-auto inline-flex min-w-[200px] max-w-[220px] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  isSelected
                    ? "text-white shadow-sm focus-visible:ring-brand-500"
                    : "bg-white text-slate-600 hover:border-brand-200 focus-visible:ring-brand-500"
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: teamColor,
                        borderColor: teamColor,
                        width: "min(100%, 220px)"
                      }
                    : {
                        borderColor: teamColor,
                        color: teamColor,
                        width: "min(100%, 220px)"
                      }
                }
              >
                <span className="truncate">{group.label}</span>
              </button>
              {group.conditions.length ? (
                <div
                  className={clsx(
                    "flex flex-wrap justify-center gap-2",
                    isSelected ? "" : "opacity-60"
                  )}
                >
                  {group.conditions.map((condition) => {
                    const isActive = selectedConditionsForTeam.includes(condition);
                    const disabled = !isSelected || group.conditions.length <= 1;
                    const color =
                      conditionColorMap.get(condition) ?? teamColor;

                    return (
                      <button
                        key={condition}
                        type="button"
                        disabled={disabled}
                        onClick={() => onToggleTeamCondition(group.team, condition)}
                        className={clsx(
                          "flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-white transition",
                          isActive ? "shadow-sm" : "opacity-80 hover:opacity-100",
                          disabled
                            ? "cursor-not-allowed opacity-60 hover:border-slate-200"
                            : null
                        )}
                        style={{
                          backgroundColor: color,
                          borderColor: color
                        }}
                      >
                        <span className="truncate">{condition}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No additional configurations.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface DataControlsCardProps {
  caseOptions: ToggleOption[];
  selectedCase: string;
  onSelectCase: (value: string) => void;
  minTrials: number;
  minTrialsRange: { min: number; max: number };
  onMinTrialsChange: (value: number) => void;
}

export function DataControlsCard({
  caseOptions,
  selectedCase,
  onSelectCase,
  minTrials,
  minTrialsRange,
  onMinTrialsChange
}: DataControlsCardProps) {
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
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200">
      <header className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Data Controls
        </h2>
        <p className="text-sm text-slate-600">
          Choose the case focus and minimum trials for the analysis.
        </p>
      </header>
      <div className="flex flex-col gap-3">
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
