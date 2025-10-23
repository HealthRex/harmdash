'use client';

import { TEAM_COLORS } from "@/config/colors";
import type { DataRow, MetricMetadata } from "@/types/dataset";
import {
  pickRowsForMetric,
  sortRowsForMetric,
  formatMetricValue,
  getCombinationBaseKeyFromId,
  getCombinationBaseKeyFromRow
} from "@/utils/data";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

const applyAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const clampAlpha = Math.min(Math.max(alpha, 0), 1);
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${clampAlpha})`;
  }
  if (normalized.length !== 6) {
    return hex;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clampAlpha})`;
};

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
  const [viewMode, setViewMode] = useState<"bestWorst" | "all">(
    "bestWorst"
  );
  const isAllView = viewMode === "all";
  const metricMeta = metadataMap.get(metricId);
  const metricDescription = metricMeta?.description ?? "";
  const isPercentMetric = metricMeta?.range === "percent";
  const higherIsBetter = metricMeta?.betterDirection !== "lower";
  const betterDirectionLabel = higherIsBetter
    ? "Higher is better"
    : "Lower is better";

  const { topRows, bottomRows, displayRows, allRows } = useMemo(() => {
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

    const bestOrder = new Map(
      sortedForBest.map((row, index) => [row.combinationId, index])
    );
    const worstOrder = new Map(
      sortedForWorst.map((row, index) => [row.combinationId, index])
    );

    const insertInOrder = (
      collection: DataRow[],
      row: DataRow,
      orderMap: Map<string, number>
    ): DataRow[] => {
      const targetIndex = orderMap.get(row.combinationId);
      if (targetIndex === undefined) {
        return collection;
      }

      const next = [...collection];
      let inserted = false;
      for (let index = 0; index < next.length; index += 1) {
        const existing = next[index];
        const existingOrder =
          orderMap.get(existing.combinationId) ?? Number.POSITIVE_INFINITY;
        if (existingOrder > targetIndex) {
          next.splice(index, 0, row);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        next.push(row);
      }
      return next;
    };

    let topWithSelections = [...top];
    let bottomWithSelections = [...bottomSorted];
    const topIds = new Set(topWithSelections.map((row) => row.combinationId));
    const bottomIds = new Set(
      bottomWithSelections.map((row) => row.combinationId)
    );

    const selectionTargets = [
      {
        combinationId: highlightedCombinationId ?? null,
        baseKey: getCombinationBaseKeyFromId(highlightedCombinationId)
      },
      {
        combinationId: comparisonCombinationId ?? null,
        baseKey: getCombinationBaseKeyFromId(comparisonCombinationId)
      }
    ].filter((target) => target.combinationId || target.baseKey);

    selectionTargets.forEach((target) => {
      const match = filtered.find((row) => {
        if (target.combinationId && row.combinationId === target.combinationId) {
          return true;
        }
        if (target.baseKey) {
          return getCombinationBaseKeyFromRow(row) === target.baseKey;
        }
        return false;
      });

      if (!match) {
        return;
      }

      if (topIds.has(match.combinationId) || bottomIds.has(match.combinationId)) {
        return;
      }

      const bestRank = bestOrder.get(match.combinationId);
      const worstRank = worstOrder.get(match.combinationId);
      if (bestRank === undefined || worstRank === undefined) {
        return;
      }

      if (bestRank <= worstRank) {
        topWithSelections = insertInOrder(topWithSelections, match, bestOrder);
        topIds.add(match.combinationId);
      } else {
        bottomWithSelections = insertInOrder(
          bottomWithSelections,
          match,
          worstOrder
        );
        bottomIds.add(match.combinationId);
      }
    });

    const combinedDisplay = [
      ...topWithSelections,
      ...bottomWithSelections.filter(
        (row) => !topIds.has(row.combinationId)
      )
    ];

    return {
      topRows: topWithSelections,
      bottomRows: bottomWithSelections,
      displayRows: combinedDisplay,
      allRows: sortedForBest
    };
  }, [
    rows,
    metricId,
    maxItems,
    higherIsBetter,
    highlightedCombinationId,
    comparisonCombinationId
  ]);

  const rowsForAxis = isAllView ? allRows : displayRows;

  const { axisMin, axisMax } = useMemo(() => {
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;
    rowsForAxis.forEach((row) => {
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
  }, [rowsForAxis, metricMeta?.axisMin, metricMeta?.axisMax, isPercentMetric]);

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

  const toggleViewMode = () => {
    setViewMode((current) => (current === "all" ? "bestWorst" : "all"));
  };

  const primaryBaseKey = useMemo(
    () => getCombinationBaseKeyFromId(highlightedCombinationId),
    [highlightedCombinationId]
  );
  const comparisonBaseKey = useMemo(
    () => getCombinationBaseKeyFromId(comparisonCombinationId),
    [comparisonCombinationId]
  );

  const renderRowButton = (row: DataRow) => {
    const value = row.mean ?? 0;
    const valueClamped = Math.min(Math.max(value, axisMin), axisMax);
    const range = axisMax - axisMin || 1;
    const widthPercentRaw =
      range <= 0 ? 0 : ((valueClamped - axisMin) / range) * 100;
    const widthPercent = Math.max(Math.min(widthPercentRaw, 100), 0);
    const rowBaseKey = getCombinationBaseKeyFromRow(row);
    const isPrimarySelected =
      highlightedCombinationId === row.combinationId ||
      (primaryBaseKey !== null && rowBaseKey === primaryBaseKey);
    const isComparisonSelected =
      comparisonCombinationId === row.combinationId ||
      (comparisonBaseKey !== null && rowBaseKey === comparisonBaseKey);
    const isSelected = isPrimarySelected || isComparisonSelected;
    const highlightColor = isPrimarySelected
      ? PRIMARY_SELECTION_COLOR
      : isComparisonSelected
      ? COMPARISON_SELECTION_COLOR
      : undefined;
    const barColor = getDefaultBarColor(row);
    const displayLabel = row.displayLabel || row.model;
    const formattedValue = formatMetricValue(row.mean, {
      metadata: metricMeta
    });
    const hasCi = row.ci !== null && row.ci !== undefined && row.ci !== 0;
    const ciLabel = hasCi
      ? `CI: ± ${formatMetricValue(row.ci, { metadata: metricMeta })}`
      : "CI: NA";
    const textColor = getTextColor(barColor);

    const renderConfidenceVisual = () => {
      if (!hasCi || range <= 0) {
        return null;
      }
      const ciHalf = row.ci ?? 0;
      const baseMean = row.mean ?? axisMin;
      const ciMin = baseMean - ciHalf;
      const ciMax = baseMean + ciHalf;
      const clamp = (val: number) => Math.min(Math.max(val, axisMin), axisMax);
      const percent = (val: number) =>
        Math.max(
          Math.min(((clamp(val) - axisMin) / range) * 100, 100),
          0
        );
      const startPercent = percent(ciMin);
      const endPercent = percent(ciMax);
      const bandWidth = Math.max(endPercent - startPercent, 0);
      if (bandWidth <= 0) {
        return null;
      }

      return (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-[3px] rounded-[6px]"
          style={{
            left: `${startPercent}%`,
            width: `${bandWidth}%`,
            background: `linear-gradient(to right, ${applyAlpha(
              barColor,
              0.12
            )}, ${applyAlpha(barColor, 0.3)})`
          }}
        />
      );
    };

    return (
      <button
        key={row.combinationId}
        type="button"
        aria-pressed={isSelected}
        onClick={() => handleRowClick(row)}
        className={clsx(
          "relative group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-transparent bg-white/0 px-2 py-1.5 text-left transition",
          isSelected
            ? "border-2 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm"
            : "hover:border-slate-200 hover:bg-slate-50/70"
        )}
        style={
          highlightColor
            ? {
                borderColor: highlightColor,
                boxShadow: `0 0 0 2px ${highlightColor}1a`
              }
            : undefined
        }
      >
        <div className="relative h-8 w-full overflow-hidden rounded-[6px]">
          <div className="absolute inset-0 rounded-[6px] bg-slate-200" />
          {renderConfidenceVisual()}
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
          {highlightColor ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[6px]"
              style={{
                boxShadow: `inset 0 0 0 2px ${highlightColor}40`
              }}
            />
          ) : null}
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
  };

  const renderRowGroup = (rowsToRender: DataRow[], emptyMessage: string) => {
    if (!rowsToRender.length) {
      return (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {rowsToRender.map(renderRowButton)}
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg shadow-slate-200">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Performance:{" "}
              <button
                type="button"
                onClick={toggleViewMode}
                aria-pressed={isAllView}
                className={clsx(
                  "rounded px-1 font-semibold text-brand-600 underline decoration-dashed underline-offset-4 transition hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40",
                  isAllView ? "text-brand-700" : undefined
                )}
                title={
                  isAllView
                    ? "Show only the best and worst performers"
                    : "Show all models"
                }
              >
                {isAllView ? "All" : "Best and Worst"}
              </button>{" "}
              Models
            </h2>
            <p className="text-sm text-slate-500">
              Compare model performance on a variety of metrics.
            </p>
          </div>
          <div className="flex min-w-[12rem] flex-col items-end gap-1">
            <select
              value={metricId}
              onChange={(event) => onMetricChange(event.target.value)}
              className="w-full rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-900 shadow transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300 hover:border-brand-300"
            >
              {metrics.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.displayLabel}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {betterDirectionLabel}
            </span>
          </div>
        </div>
        {metricDescription ? (
          <p className="text-xs text-slate-500">{metricDescription}</p>
        ) : null}
      </header>
      {isAllView ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            All Models
          </h3>
          {renderRowGroup(allRows, "No models available for the selected filters.")}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Best
            </h3>
            {renderRowGroup(
              topRows,
              "No models available for the selected filters."
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Worst
            </h3>
            {renderRowGroup(
              bottomRows,
              "No bottom performers to display for the selected filters."
            )}
          </div>
        </div>
      )}
    </section>
  );
}
