'use client';

import { TEAM_COLORS } from "@/config/colors";
import type { DataRow, MetricMetadata } from "@/types/dataset";
import {
  pickRowsForMetric,
  sortRowsForMetric,
  formatMetricValue
} from "@/utils/data";
import clsx from "clsx";
import { useCallback, useMemo } from "react";

type Props = {
  rows: DataRow[];
  metricId: string;
  onMetricChange: (metricId: string) => void;
  onBarClick?: (row: DataRow) => void;
  highlightedCombinationId?: string | null;
  comparisonCombinationId?: string | null;
  maxItems?: number;
  metrics: MetricMetadata[];
  metadataMap: Map<string, MetricMetadata>;
  conditionColorMap: Map<string, string>;
};

const PRIMARY_SELECTION_COLOR = "#0ea5e9";
const COMPARISON_SELECTION_COLOR = "#f97316";

const getTextColor = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#111827' : '#f8fafc';
};

export function BarChartCard({
  rows,
  metricId,
  onMetricChange,
  onBarClick,
  highlightedCombinationId,
  comparisonCombinationId,
  maxItems = 5,
  metrics,
  metadataMap,
  conditionColorMap
}: Props) {
  const metricMeta = metadataMap.get(metricId);
  const metricLabel = metricMeta?.displayLabel ?? metricId;
  const metricDescription = metricMeta?.description ?? "";
  const isPercentMetric = metricMeta?.range === "percent";
  const higherIsBetter = metricMeta?.betterDirection !== "lower";

  const { topRows, bottomRows, displayRows } = useMemo(() => {
    const filtered = pickRowsForMetric(rows, metricId);
    const sortedForBest = sortRowsForMetric(filtered, higherIsBetter);
    const perGroup = Math.max(1, maxItems);
    const top = sortedForBest.slice(0, perGroup);

    const sortedForWorst = sortRowsForMetric(filtered, !higherIsBetter);
    const bottom: DataRow[] = [];
    for (const candidate of sortedForWorst) {
      if (bottom.length >= perGroup) {
        break;
      }
      if (!top.some((row) => row.combinationId === candidate.combinationId)) {
        bottom.push(candidate);
      }
    }

    const bottomSorted = sortRowsForMetric(bottom, higherIsBetter);

    return {
      topRows: top,
      bottomRows: bottomSorted,
      displayRows: [...top, ...bottomSorted]
    };
  }, [rows, metricId, maxItems, higherIsBetter]);

  const { axisMin, axisMax } = useMemo(() => {
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;
    displayRows.forEach((row) => {
      if (row.mean !== null && row.mean !== undefined) {
        minValue = Math.min(minValue, row.mean);
        maxValue = Math.max(maxValue, row.mean);
      }
    });

    if (minValue === Number.POSITIVE_INFINITY) {
      minValue = 0;
    }
    if (maxValue === Number.NEGATIVE_INFINITY) {
      maxValue = 0;
    }

    const defaultMin = isPercentMetric ? 0 : Math.min(0, minValue);
    const defaultMax = isPercentMetric ? 1 : Math.max(maxValue, 0);

    const resolvedMin =
      metricMeta?.axisMin !== null && metricMeta?.axisMin !== undefined
        ? metricMeta.axisMin
        : defaultMin;
    const resolvedMax =
      metricMeta?.axisMax !== null && metricMeta?.axisMax !== undefined
        ? metricMeta.axisMax
        : defaultMax;

    const fallbackMax =
      resolvedMin + Math.abs(resolvedMin || 1) * 0.1;
    const adjustedMax =
      resolvedMax > resolvedMin
        ? resolvedMax
        : fallbackMax !== resolvedMin
        ? fallbackMax
        : resolvedMin + 1;

    return {
      axisMin: resolvedMin,
      axisMax: adjustedMax
    };
  }, [displayRows, metricMeta?.axisMin, metricMeta?.axisMax, isPercentMetric]);

  const getDefaultBarColor = useCallback(
    (row: DataRow) => {
      const conditionKey = (row.condition ?? "").trim();
      if (conditionKey && conditionColorMap.has(conditionKey)) {
        return conditionColorMap.get(conditionKey)!;
      }
      const teamKey = (row.team ?? "").trim();
      if (teamKey && conditionColorMap.has(teamKey)) {
        return conditionColorMap.get(teamKey)!;
      }
      if (teamKey && TEAM_COLORS[teamKey]) {
        return TEAM_COLORS[teamKey];
      }
      return TEAM_COLORS.default;
    },
    [conditionColorMap]
  );

  const handleRowClick = (row: DataRow) => {
    onBarClick?.(row);
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg shadow-slate-200">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Performance: Best and Worst Models
            </h2>
            <p className="text-sm text-slate-500">
              Compare model performance on a variety of metrics.
            </p>
          </div>
          <select
            value={metricId}
            onChange={(event) => onMetricChange(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-brand-500"
          >
            {metrics.map((option) => (
              <option key={option.id} value={option.id}>
                {option.displayLabel}
              </option>
            ))}
          </select>
        </div>
        {metricDescription ? (
          <p className="text-xs text-slate-500">{metricDescription}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Best
          </h3>
          {topRows.length ? (
            <div className="flex flex-col gap-1">
              {topRows.map((row) => {
                const value = row.mean ?? 0;
                const valueClamped = Math.min(Math.max(value, axisMin), axisMax);
                const range = axisMax - axisMin || 1;
                const widthPercentRaw =
                  range <= 0 ? 0 : ((valueClamped - axisMin) / range) * 100;
                const widthPercent = Math.max(Math.min(widthPercentRaw, 100), 0);
                const isPrimarySelected =
                  highlightedCombinationId === row.combinationId;
                const isComparisonSelected =
                  comparisonCombinationId === row.combinationId;
                const isSelected = isPrimarySelected || isComparisonSelected;
                const highlightColor = isPrimarySelected
                  ? PRIMARY_SELECTION_COLOR
                  : isComparisonSelected
                  ? COMPARISON_SELECTION_COLOR
                  : undefined;
                const barColor = highlightColor ?? getDefaultBarColor(row);
                const displayLabel = row.displayLabel || row.model;
                const formattedValue = formatMetricValue(row.mean, {
                  metadata: metricMeta
                });
                const hasCi =
                  row.ci !== null && row.ci !== undefined && row.ci !== 0;
                const ciLabel = hasCi
                  ? `CI: ± ${formatMetricValue(row.ci, { metadata: metricMeta })}`
                  : "CI: NA";
                const textColor = getTextColor(barColor);

                return (
                  <button
                    key={row.combinationId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleRowClick(row)}
                    className={clsx(
                      "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-transparent bg-white/0 px-2 py-1.5 text-left transition",
                      isSelected
                        ? "border-2 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm"
                        : "hover:border-slate-200 hover:bg-slate-50/70"
                    )}
                    style={
                      highlightColor
                        ? { borderColor: highlightColor }
                        : undefined
                    }
                  >
                    <div className="relative h-8 w-full overflow-hidden rounded-[6px]">
                      <div className="absolute inset-0 rounded-[6px] bg-slate-200" />
                      <div
                        className={clsx(
                          "absolute inset-0 rounded-[6px] transition-all duration-500 ease-out",
                          isSelected
                            ? "opacity-100 shadow-inner shadow-slate-900/10"
                            : "opacity-95"
                        )}
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: barColor
                        }}
                      />
                      <span
                        className="absolute left-4 top-1/2 -translate-y-1/2 truncate text-sm font-medium"
                        style={{ color: textColor }}
                        title={row.displayLabel || row.model}
                      >
                        {displayLabel}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-semibold text-slate-900">
                        {formattedValue}
                      </span>
                      <span className="text-xs text-slate-500">{ciLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              No models available for the selected filters.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Worst
          </h3>
          {bottomRows.length ? (
            <div className="flex flex-col gap-1">
              {bottomRows.map((row) => {
                const value = row.mean ?? 0;
                const valueClamped = Math.min(Math.max(value, axisMin), axisMax);
                const range = axisMax - axisMin || 1;
                const widthPercentRaw =
                  range <= 0 ? 0 : ((valueClamped - axisMin) / range) * 100;
                const widthPercent = Math.max(Math.min(widthPercentRaw, 100), 0);
                const isPrimarySelected =
                  highlightedCombinationId === row.combinationId;
                const isComparisonSelected =
                  comparisonCombinationId === row.combinationId;
                const isSelected = isPrimarySelected || isComparisonSelected;
                const highlightColor = isPrimarySelected
                  ? PRIMARY_SELECTION_COLOR
                  : isComparisonSelected
                  ? COMPARISON_SELECTION_COLOR
                  : undefined;
                const barColor = highlightColor ?? getDefaultBarColor(row);
                const displayLabel = row.displayLabel || row.model;
                const formattedValue = formatMetricValue(row.mean, {
                  metadata: metricMeta
                });
                const hasCi =
                  row.ci !== null && row.ci !== undefined && row.ci !== 0;
                const ciLabel = hasCi
                  ? `CI: ± ${formatMetricValue(row.ci, { metadata: metricMeta })}`
                  : "CI: NA";
                const textColor = getTextColor(barColor);

                return (
                  <button
                    key={row.combinationId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleRowClick(row)}
                    className={clsx(
                      "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-transparent bg-white/0 px-2 py-1.5 text-left transition",
                      isSelected
                        ? "border-2 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm"
                        : "hover:border-slate-200 hover:bg-slate-50/70"
                    )}
                    style={
                      highlightColor
                        ? { borderColor: highlightColor }
                        : undefined
                    }
                  >
                    <div className="relative h-8 w-full overflow-hidden rounded-[6px]">
                      <div className="absolute inset-0 rounded-[6px] bg-slate-200" />
                      <div
                        className={clsx(
                          "absolute inset-0 rounded-[6px] transition-all duration-500 ease-out",
                          isSelected
                            ? "opacity-100 shadow-inner shadow-slate-900/10"
                            : "opacity-95"
                        )}
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: barColor
                        }}
                      />
                      <span
                        className="absolute left-4 top-1/2 -translate-y-1/2 truncate text-sm font-medium"
                        style={{ color: textColor }}
                        title={row.displayLabel || row.model}
                      >
                        {displayLabel}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-semibold text-slate-900">
                        {formattedValue}
                      </span>
                      <span className="text-xs text-slate-500">{ciLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              No bottom performers to display for the selected filters.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
