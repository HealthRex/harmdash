'use client';

import { BarChartCard } from "@/components/BarChartCard";
import { FiltersPanel } from "@/components/FiltersPanel";
import { MetricsSummary } from "@/components/MetricsSummary";
import { ModelInfoDrawer } from "@/components/ModelInfoDrawer";
import { ScatterChartCard } from "@/components/ScatterChartCard";
import type {
  CombinationEntry,
  DataRow,
  DatasetArtifact
} from "@/types/dataset";
import { CONDITION_COLORS, TEAM_COLORS } from "@/config/colors";
import { groupRowsByCombination } from "@/utils/data";
import { useCallback, useEffect, useMemo, useState } from "react";

interface DashboardProps {
  dataset: DatasetArtifact;
}

const HARM_OPTIONS = [
  { value: "Severe", label: "Severe", color: "#F87171" },
  { value: "Moderate", label: "Moderate", color: "#FB923C" },
  { value: "Mild", label: "Mild", color: "#FACC15" }
];

const CASE_OPTIONS = [
  { value: "AllCases", label: "All Cases" },
  { value: "HumanCases", label: "Human Subset" }
];

const ALWAYS_ON_CONDITION_NAMES = new Set(["human", "control"]);

function toggleWithMinimumSelected(
  current: string[],
  value: string,
  minimum = 1
): string[] {
  if (current.includes(value)) {
    if (current.length <= minimum) {
      return current;
    }
    return current.filter((item) => item !== value);
  }

  return [...current, value];
}

export function Dashboard({ dataset }: DashboardProps) {
  const metrics = useMemo(() => dataset.metadata, [dataset.metadata]);
  const metadataMap = useMemo(
    () => new Map(metrics.map((meta) => [meta.id, meta])),
    [metrics]
  );
  const metricIds = useMemo(() => metrics.map((meta) => meta.id), [metrics]);

  const { teamGroups, alwaysOnConditions } = useMemo(() => {
    const teamMap = new Map<string, Set<string>>();
    const allTeams = new Set<string>();
    const always = new Set<string>();

    dataset.rows.forEach((row) => {
      const team = (row.team ?? "").trim();
      const condition = (row.condition ?? "").trim();
      if (!team) {
        return;
      }
      allTeams.add(team);
      if (!condition) {
        return;
      }
      if (ALWAYS_ON_CONDITION_NAMES.has(condition.toLowerCase())) {
        always.add(condition);
        return;
      }
      if (!teamMap.has(team)) {
        teamMap.set(team, new Set<string>());
      }
      teamMap.get(team)!.add(condition);
    });

    const groups = Array.from(allTeams)
      .map((team) => {
        const conditions = Array.from(teamMap.get(team) ?? new Set<string>()).sort((a, b) =>
          a.localeCompare(b)
        );
        return {
          team,
          label: team ? team : "Unspecified Team",
          conditions
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    const alwaysList = Array.from(always).sort((a, b) => a.localeCompare(b));

    return {
      teamGroups: groups,
      alwaysOnConditions: alwaysList
    };
  }, [dataset.rows]);

  const [barMetricId, setBarMetricId] = useState<string>(() => metricIds[0] ?? "");
  const [xMetricId, setXMetricId] = useState<string>(() => metricIds[0] ?? "");
  const [yMetricId, setYMetricId] = useState<string>(
    () => metricIds[1] ?? metricIds[0] ?? ""
  );
  const [selectedHarmLevels, setSelectedHarmLevels] = useState<string[]>(["Severe"]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(() =>
    teamGroups.map((group) => group.team)
  );
  const [selectedTeamConditions, setSelectedTeamConditions] = useState<
    Record<string, string[]>
  >(() => {
    const initial: Record<string, string[]> = {};
    teamGroups.forEach((group) => {
      initial[group.team] = [...group.conditions];
    });
    return initial;
  });
  const [selectedCase, setSelectedCase] = useState<string>(CASE_OPTIONS[0].value);
  const trialsRange = useMemo(() => {
    let maxTrials = 0;
    dataset.rows.forEach((row) => {
      if (row.trials !== null && row.trials !== undefined) {
        maxTrials = Math.max(maxTrials, row.trials);
      }
    });
    const snappedMax = Math.max(5, Math.ceil(maxTrials / 5) * 5);
    return { min: 1, max: snappedMax };
  }, [dataset.rows]);
  const [minTrials, setMinTrials] = useState<number>(5);
  const [selection, setSelection] = useState<CombinationEntry | null>(null);

  useEffect(() => {
    if (minTrials > trialsRange.max) {
      setMinTrials(trialsRange.max);
    }
  }, [minTrials, trialsRange.max]);

  useEffect(() => {
    if (teamGroups.length === 0) {
      setSelectedTeams([]);
      setSelectedTeamConditions({});
      return;
    }

    setSelectedTeams((prev) => {
      const valid = prev.filter((team) =>
        teamGroups.some((group) => group.team === team)
      );
      if (valid.length === prev.length && valid.length !== 0) {
        return prev;
      }
      return valid.length ? valid : teamGroups.map((group) => group.team);
    });

    setSelectedTeamConditions((prev) => {
      const next: Record<string, string[]> = {};
      let changed = false;

      teamGroups.forEach((group) => {
        const allowed = group.conditions;
        const previous = prev[group.team] ?? allowed;
        const filtered = previous.filter((value) => allowed.includes(value));
        const finalValues =
          filtered.length > 0 || allowed.length === 0
            ? filtered.length > 0
              ? filtered
              : allowed
            : [];
        next[group.team] = finalValues;
        if (!changed) {
          if (
            previous.length !== finalValues.length ||
            !previous.every((value, index) => value === finalValues[index])
          ) {
            changed = true;
          }
        }
      });

      const prevKeys = Object.keys(prev);
      if (!changed && prevKeys.length === Object.keys(next).length) {
        const same = prevKeys.every((team) => {
          const prevValues = prev[team];
          const currentValues = next[team];
          return (
            prevValues &&
            currentValues &&
            prevValues.length === currentValues.length &&
            prevValues.every((value, index) => value === currentValues[index])
          );
        });
        if (same) {
          return prev;
        }
      }

      return next;
    });
  }, [teamGroups]);

  const alwaysOnConditionSet = useMemo(
    () => new Set(alwaysOnConditions.map((condition) => condition.toLowerCase())),
    [alwaysOnConditions]
  );

  const conditionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    teamGroups.forEach((group) => {
      const teamColor = TEAM_COLORS[group.team] ?? TEAM_COLORS.default;
      group.conditions.forEach((condition) => {
        const color = CONDITION_COLORS[condition] ?? teamColor;
        map.set(condition, color);
      });
    });

    alwaysOnConditions.forEach((condition) => {
      const normalized = condition.trim();
      if (!normalized) {
        return;
      }
      if (!map.has(normalized)) {
        map.set(normalized, CONDITION_COLORS[normalized] ?? TEAM_COLORS.default);
      }
    });

    return map;
  }, [teamGroups, alwaysOnConditions]);

  const teamConditionLookup = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    Object.entries(selectedTeamConditions).forEach(([team, conditions]) => {
      lookup.set(team, new Set(conditions));
    });
    return lookup;
  }, [selectedTeamConditions]);

  const filteredRows = useMemo(() => {
    return dataset.rows.filter((row) => {
      const isHarmScopedMetric = row.harm && row.harm !== "NA";
      const harmMatch =
        !isHarmScopedMetric || selectedHarmLevels.length === 0
          ? true
          : selectedHarmLevels.includes(row.harm);
      const teamValue = (row.team ?? "").trim();
      const teamMatch =
        selectedTeams.length === 0
          ? true
          : selectedTeams.includes(teamValue);
      const conditionValue = (row.condition ?? "").trim();
      const conditionMatch = (() => {
        if (alwaysOnConditionSet.has(conditionValue.toLowerCase())) {
          return true;
        }
        const allowed = teamConditionLookup.get(teamValue);
        if (!allowed || allowed.size === 0) {
          return true;
        }
        return allowed.has(conditionValue);
      })();
      const caseMatch =
        selectedCase === "AllCases"
          ? row.cases == null ||
            row.cases === "" ||
            row.cases === "AllCases" ||
            row.cases?.toLowerCase() === "allcases"
          : row.cases === "HumanCases" ||
            row.cases?.toLowerCase() === "humancases";
      const trials = row.trials ?? 0;
      const trialsMatch = trials >= minTrials;
      return harmMatch && teamMatch && conditionMatch && caseMatch && trialsMatch;
    });
  }, [
    dataset.rows,
    selectedHarmLevels,
    selectedTeams,
    teamConditionLookup,
    alwaysOnConditionSet,
    selectedCase,
    minTrials
  ]);

  const combinations = useMemo(
    () => groupRowsByCombination(filteredRows),
    [filteredRows]
  );

  useEffect(() => {
    if (!selection) {
      return;
    }
    const stillVisible = combinations.some(
      (entry) => entry.combinationId === selection.combinationId
    );
    if (!stillVisible) {
      setSelection(null);
    }
  }, [selection, combinations]);

  useEffect(() => {
    if (metricIds.length === 0) {
      return;
    }

    setBarMetricId((prev) => (metricIds.includes(prev) ? prev : metricIds[0]));
    setXMetricId((prev) => (metricIds.includes(prev) ? prev : metricIds[0]));
    setYMetricId((prev) => {
      if (metricIds.includes(prev)) {
        return prev;
      }
      return metricIds[1] ?? metricIds[0];
    });
  }, [metricIds]);

  const ensureMetricExists = useCallback(
    (metricId: string) => {
      if (metricIds.includes(metricId)) {
        return metricId;
      }
      return metricIds[0] ?? metricId;
    },
    [metricIds]
  );

  const safeBarMetric = ensureMetricExists(barMetricId);
  const safeXMetric = ensureMetricExists(xMetricId);
  const safeYMetric = ensureMetricExists(yMetricId);

  const handleBarClick = (row: DataRow) => {
    const target = combinations.find(
      (entry) => entry.combinationId === row.combinationId
    );
    if (target) {
      setSelection(target);
    }
  };

  const handlePointClick = (entry: CombinationEntry) => {
    setSelection(entry);
  };

  const handleClearSelection = () => {
    setSelection(null);
  };

  const handleSelectSeverity = (value: string) => {
    setSelectedHarmLevels([value]);
  };

  const handleToggleTeam = useCallback((team: string) => {
    setSelectedTeams((prev) => toggleWithMinimumSelected(prev, team));
  }, []);

  const handleToggleTeamCondition = useCallback(
    (team: string, condition: string) => {
      setSelectedTeamConditions((prev) => {
        const allowed = teamGroups.find((group) => group.team === team)?.conditions ?? [];
        if (allowed.length === 0) {
          return prev;
        }
        const current = prev[team] ?? allowed;
        const has = current.includes(condition);
        let nextValues: string[];
        if (has) {
          if (current.length <= 1) {
            nextValues = current;
          } else {
            nextValues = current.filter((value) => value !== condition);
          }
        } else {
          nextValues = [...current, condition];
        }
        const normalized = allowed.filter((value) => nextValues.includes(value));
        if (normalized.length === 0 && allowed.length > 0) {
          normalized.push(allowed[0]);
        }
        const previous = prev[team] ?? [];
        if (
          previous.length === normalized.length &&
          previous.every((value, index) => value === normalized[index])
        ) {
          return prev;
        }
        return {
          ...prev,
          [team]: normalized
        };
      });
    },
    [teamGroups]
  );

  const handleSelectCase = (value: string) => {
    setSelectedCase(value);
  };

  const handleMinTrialsChange = (value: number) => {
    setMinTrials(value);
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <MetricsSummary dataset={dataset} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,0.5fr)]">
        <BarChartCard
          rows={filteredRows}
          metricId={safeBarMetric}
          onMetricChange={setBarMetricId}
          onBarClick={handleBarClick}
          highlightedCombinationId={selection?.combinationId}
          metrics={metrics}
          metadataMap={metadataMap}
          conditionColorMap={conditionColorMap}
        />
        <FiltersPanel
          harmOptions={HARM_OPTIONS}
          selectedHarmLevels={selectedHarmLevels}
          onSelectSeverity={handleSelectSeverity}
          teamGroups={teamGroups}
          selectedTeams={selectedTeams}
          selectedTeamConditions={selectedTeamConditions}
          onToggleTeam={handleToggleTeam}
          onToggleTeamCondition={handleToggleTeamCondition}
          conditionColorMap={conditionColorMap}
          caseOptions={CASE_OPTIONS}
          selectedCase={selectedCase}
          onSelectCase={handleSelectCase}
          minTrials={minTrials}
          minTrialsRange={trialsRange}
          onMinTrialsChange={handleMinTrialsChange}
        />
      </div>
      <ScatterChartCard
        combinations={combinations}
        xMetricId={safeXMetric}
        yMetricId={safeYMetric}
        onXMetricChange={setXMetricId}
        onYMetricChange={setYMetricId}
        onPointClick={handlePointClick}
        highlightedCombinationId={selection?.combinationId}
        metrics={metrics}
        metadataMap={metadataMap}
      />
      <ModelInfoDrawer
        selection={selection}
        onClear={handleClearSelection}
        metrics={metrics}
      />
    </div>
  );
}
