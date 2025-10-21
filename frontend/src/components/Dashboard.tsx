'use client';

import { BarChartCard } from "@/components/BarChartCard";
import { FiltersPanel } from "@/components/FiltersPanel";
import { MetricsSummary } from "@/components/MetricsSummary";
import { ModelInfoDrawer } from "@/components/ModelInfoDrawer";
import { ScatterChartCard } from "@/components/ScatterChartCard";
import { metricsConfig } from "@/config/metrics";
import type {
  CombinationEntry,
  DataRow,
  DatasetArtifact
} from "@/types/dataset";
import { groupRowsByCombination } from "@/utils/data";
import { useEffect, useMemo, useState } from "react";

interface DashboardProps {
  dataset: DatasetArtifact;
}

const HARM_OPTIONS = [
  { value: "Severe", label: "Severe", color: "#F87171" },
  { value: "Moderate", label: "Moderate", color: "#FB923C" },
  { value: "Mild", label: "Mild", color: "#FACC15" }
];

const ROLE_OPTIONS = [
  { value: "Agent1", label: "Agent 1" },
  { value: "Agent2", label: "Agent 2" },
  { value: "Agent3", label: "Agent 3" }
];

const CONDITION_OPTIONS = [
  { value: "Solo", label: "Solo" },
  { value: "Guardian", label: "Guardian" },
  { value: "Guardian+Stewardship", label: "Guardian + Stewardship" },
  { value: "Guardian+Guardian", label: "Guardian + Guardian" },
  { value: "Stewardship", label: "Stewardship" },
  { value: "Control", label: "Control" }
];

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
  const [barMetricId, setBarMetricId] = useState<string>("Accuracy");
  const [xMetricId, setXMetricId] = useState<string>("normalized");
  const [yMetricId, setYMetricId] = useState<string>("Safety");
  const [selectedHarmLevels, setSelectedHarmLevels] = useState<string[]>(["Severe"]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    ROLE_OPTIONS.map((option) => option.value)
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    CONDITION_OPTIONS.map((option) => option.value)
  );
  const trialsRange = useMemo(() => {
    let maxTrials = 0;
    dataset.rows.forEach((row) => {
      if (row.trials !== null && row.trials !== undefined) {
        maxTrials = Math.max(maxTrials, row.trials);
      }
    });
    const snappedMax = Math.max(5, Math.ceil(maxTrials / 5) * 5);
    return { min: 0, max: snappedMax };
  }, [dataset.rows]);
  const [minTrials, setMinTrials] = useState<number>(5);
  const [selection, setSelection] = useState<CombinationEntry | null>(null);

  useEffect(() => {
    if (minTrials > trialsRange.max) {
      setMinTrials(trialsRange.max);
    }
  }, [minTrials, trialsRange.max]);

  const filteredRows = useMemo(() => {
    return dataset.rows.filter((row) => {
      const isHarmScopedMetric = row.harm && row.harm !== "NA";
      const harmMatch =
        !isHarmScopedMetric || selectedHarmLevels.length === 0
          ? true
          : selectedHarmLevels.includes(row.harm);
      const roleMatch =
        selectedRoles.length === 0 ? true : selectedRoles.includes(row.role);
      const conditionMatch =
        selectedConditions.length === 0
          ? true
          : selectedConditions.includes(row.condition);
      const trials = row.trials ?? 0;
      const trialsMatch = trials >= minTrials;
      return harmMatch && roleMatch && conditionMatch && trialsMatch;
    });
  }, [
    dataset.rows,
    selectedHarmLevels,
    selectedRoles,
    selectedConditions,
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

  const ensureMetricExists = (metricId: string) => {
    const available = metricsConfig.map((metric) => metric.id);
    if (available.includes(metricId)) {
      return metricId;
    }
    return available[0];
  };

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

  const handleToggleHarm = (value: string) => {
    setSelectedHarmLevels((prev) => toggleWithMinimumSelected(prev, value));
  };

  const handleSelectSeverity = (value: string) => {
    setSelectedHarmLevels([value]);
  };

  const handleToggleRole = (value: string) => {
    setSelectedRoles((prev) => toggleWithMinimumSelected(prev, value));
  };

  const handleToggleCondition = (value: string) => {
    setSelectedConditions((prev) => toggleWithMinimumSelected(prev, value));
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
          maxItems={15}
        />
        <FiltersPanel
          harmOptions={HARM_OPTIONS}
          selectedHarmLevels={selectedHarmLevels}
          onToggleHarm={handleToggleHarm}
          onSelectSeverity={handleSelectSeverity}
          roleOptions={ROLE_OPTIONS}
          selectedRoles={selectedRoles}
          onToggleRole={handleToggleRole}
          conditionOptions={CONDITION_OPTIONS}
          selectedConditions={selectedConditions}
          onToggleCondition={handleToggleCondition}
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
      />
      <ModelInfoDrawer selection={selection} onClear={handleClearSelection} />
    </div>
  );
}
