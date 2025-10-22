'use client';

import Plot from "@/components/PlotClient";
import type { CombinationEntry, MetricMetadata } from "@/types/dataset";
import clsx from "clsx";
import { useMemo, useState } from "react";
import type { Layout, PlotData } from "plotly.js";
import { formatMetricValue } from "@/utils/data";

interface ModelInfoDrawerProps {
  selection: CombinationEntry | null;
  comparison: CombinationEntry | null;
  onClear: () => void;
  onClearComparison: () => void;
  metrics: MetricMetadata[];
  className?: string;
  modelQuery: string;
  onModelSearchChange: (value: string) => void;
  suggestions: CombinationEntry[];
  comparisonQuery: string;
  onComparisonSearchChange: (value: string) => void;
  comparisonSuggestions: CombinationEntry[];
  onSuggestionSelect: (entry: CombinationEntry) => void;
  onComparisonSuggestionSelect: (entry: CombinationEntry) => void;
}

function computeNormalizedMetricValue(
  value: number | null | undefined,
  meta: MetricMetadata
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  if (meta.range === "percent") {
    const clamped = Math.min(Math.max(value, 0), 1);
    const normalized =
      meta.betterDirection === "lower" ? 1 - clamped : clamped;
    return Math.min(Math.max(normalized, 0), 1);
  }

  const axisMax = meta.axisMax ?? null;
  let denominator =
    axisMax && Number.isFinite(axisMax) && axisMax > 0
      ? axisMax
      : Math.max(Math.abs(value), 1);
  let ratio = value / denominator;
  if (!Number.isFinite(ratio)) {
    ratio = 0;
  }
  ratio = Math.min(Math.max(ratio, 0), 1);
  return meta.betterDirection === "lower" ? 1 - ratio : ratio;
}

export function ModelInfoDrawer({
  selection,
  comparison,
  onClear,
  onClearComparison,
  metrics,
  className,
  modelQuery,
  onModelSearchChange,
  suggestions,
  comparisonQuery,
  onComparisonSearchChange,
  comparisonSuggestions,
  onSuggestionSelect,
  onComparisonSuggestionSelect
}: ModelInfoDrawerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isComparisonFocused, setIsComparisonFocused] = useState(false);
  const trimmedQuery = modelQuery.trim();
  const trimmedComparisonQuery = comparisonQuery.trim();
  const showSuggestions = isFocused && trimmedQuery !== "" && suggestions.length > 0;
  const showComparisonSuggestions =
    isComparisonFocused &&
    trimmedComparisonQuery !== "" &&
    comparisonSuggestions.length > 0;

  const description = selection
    ? comparison
      ? "Comparing the selected models across key metrics."
      : "Detailed metrics for the selected model and condition."
    : comparison
    ? "Comparison metrics for the selected model."
    : "Click on any bar or point to inspect model performance.";

  const primarySelectionLabel =
    selection?.displayLabel || selection?.model || null;
  const comparisonSelectionLabel =
    comparison?.displayLabel || comparison?.model || null;

  const radarData = useMemo(() => {
    if (!selection && !comparison) {
      return null;
    }

    type RadarPoint = {
      meta: MetricMetadata;
      primaryMetric: CombinationEntry["metrics"][string] | undefined;
      primaryValue: number | null;
      comparisonMetric: CombinationEntry["metrics"][string] | undefined;
      comparisonValue: number | null;
    };

    const points: RadarPoint[] = metrics
      .filter((meta) => meta.includeInRadar)
      .map((meta) => {
        const primaryMetric = selection?.metrics[meta.id];
        const comparisonMetric = comparison?.metrics[meta.id];
        const primaryValue = selection
          ? computeNormalizedMetricValue(primaryMetric?.mean ?? null, meta)
          : null;
        const comparisonValue = comparison
          ? computeNormalizedMetricValue(comparisonMetric?.mean ?? null, meta)
          : null;
        return {
          meta,
          primaryMetric,
          primaryValue,
          comparisonMetric,
          comparisonValue
        };
      })
      .filter((entry) => entry.primaryValue !== null || entry.comparisonValue !== null);

    if (points.length === 0) {
      return null;
    }

    const buildTrace = (
      entry: CombinationEntry | null,
      getValue: (point: RadarPoint) => number | null,
      getMetric: (point: RadarPoint) => CombinationEntry["metrics"][string] | undefined,
      styles: { fill: string; line: string; marker: string; opacity: number }
    ): PlotData | null => {
      if (!entry) {
        return null;
      }

      const values = points.map((point) => {
        const value = getValue(point);
        return value === null ? 0 : value;
      });
      const hovers = points.map((point) => {
        const metric = getMetric(point);
        const value = getValue(point);
        if (!metric || value === null) {
          return `${point.meta.displayLabel}: No data`;
        }
        return `${point.meta.displayLabel}: ${formatMetricValue(metric.mean ?? null, {
          metadata: point.meta
        })}`;
      });
      if (values.every((value) => value === 0)) {
        return null;
      }

      const closedValues = [...values, values[0]];
      const closedLabels = [...points.map((point) => point.meta.displayLabel), points[0].meta.displayLabel];
      const closedHover = [...hovers, hovers[0]];

      const label = entry.displayLabel || entry.model || "Metric profile";

      return {
        type: "scatterpolar",
        r: closedValues,
        theta: closedLabels,
        fill: "toself",
        name: label,
        hoverinfo: "text",
        hovertext: closedHover,
        marker: {
          color: styles.marker,
          size: 6
        },
        line: {
          color: styles.line,
          width: 2
        },
        opacity: styles.opacity,
        fillcolor: styles.fill
      } as PlotData;
    };

    const traces: PlotData[] = [];

    const primaryTrace = buildTrace(
      selection,
      (point) => point.primaryValue,
      (point) => point.primaryMetric,
      {
        fill: "rgba(56, 189, 248, 0.25)",
        line: "#0ea5e9",
        marker: "#38bdf8",
        opacity: 0.75
      }
    );
    if (primaryTrace) {
      traces.push(primaryTrace);
    }

    const comparisonTrace = buildTrace(
      comparison,
      (point) => point.comparisonValue,
      (point) => point.comparisonMetric,
      {
        fill: "rgba(249, 115, 22, 0.2)",
        line: "#f97316",
        marker: "#fb923c",
        opacity: 0.6
      }
    );
    if (comparisonTrace) {
      traces.push(comparisonTrace);
    }

    if (traces.length === 0) {
      return null;
    }

    const layout: Partial<Layout> = {
      margin: { l: 20, r: 20, t: 30, b: 20 },
      polar: {
        radialaxis: {
          range: [0, 1],
          showgrid: true,
          gridcolor: "#cbd5f5",
          showline: true,
          linecolor: "#94a3b8",
          tickvals: [0, 0.25, 0.5, 0.75, 1],
          showticklabels: false,
          ticks: ""
        },
        angularaxis: {
          tickfont: {
            size: 12,
            color: "#1f2937"
          },
          rotation: 90,
          gridcolor: "#e2e8f0",
          linecolor: "#94a3b8",
          showticklabels: true
        }
      },
      showlegend: false,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        family: "Inter, sans-serif",
        color: "#0f172a"
      }
    };

    return { data: traces, layout };
  }, [comparison, metrics, selection]);

  return (
    <aside
      className={clsx(
        "flex w-full max-w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200 transition",
        selection ? "opacity-100" : "opacity-75",
        className
      )}
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Model Profiles
            </h3>
            <p className="text-sm text-slate-500">
              {description}
            </p>
          </div>
          {selection ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-brand-400 hover:text-brand-600"
            >
              Clear
            </button>
          ) : null}
        </div>
        {(primarySelectionLabel || comparisonSelectionLabel) ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {primarySelectionLabel ? `Primary: ${primarySelectionLabel}` : "Primary: None selected"}
            {comparisonSelectionLabel ? ` | Comparison: ${comparisonSelectionLabel}` : ""}
          </p>
        ) : null}
      </header>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="model-search">
              Primary model
            </label>
            <div className="relative">
              <input
                id="model-search"
                type="search"
                placeholder="Search models"
                value={modelQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 120)}
                onChange={(event) => {
                  setIsFocused(true);
                  onModelSearchChange(event.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {showSuggestions ? (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {suggestions.length ? (
                    suggestions.map((entry) => {
                      const label = entry.displayLabel || entry.model;
                      const subtitle = [entry.team, entry.condition].filter(Boolean).join(" · ");
                      const selected = selection?.combinationId === entry.combinationId;
                      return (
                        <li key={entry.combinationId}>
                          <button
                            type="button"
                            onClick={() => {
                              onSuggestionSelect(entry);
                              onModelSearchChange(entry.displayLabel || entry.model || "");
                              setIsFocused(false);
                            }}
                            className={clsx(
                              "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm",
                              selected
                                ? "bg-brand-50 text-brand-700"
                                : "text-slate-700 hover:bg-slate-100"
                            )}
                          >
                            <span className="font-medium">{label}</span>
                            {subtitle ? (
                              <span className="text-xs text-slate-500">{subtitle}</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-3 py-2 text-xs text-slate-500">No matches found</li>
                  )}
                </ul>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              htmlFor="comparison-search"
            >
              Compare with
            </label>
            <div className="relative">
              <input
                id="comparison-search"
                type="search"
                placeholder="Search comparison model"
                value={comparisonQuery}
                onFocus={() => setIsComparisonFocused(true)}
                onBlur={() => setTimeout(() => setIsComparisonFocused(false), 120)}
                onChange={(event) => {
                  setIsComparisonFocused(true);
                  onComparisonSearchChange(event.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              {showComparisonSuggestions ? (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {comparisonSuggestions.length ? (
                    comparisonSuggestions.map((entry) => {
                      const label = entry.displayLabel || entry.model;
                      const subtitle = [entry.team, entry.condition].filter(Boolean).join(" · ");
                      const selected = comparison?.combinationId === entry.combinationId;
                      return (
                        <li key={entry.combinationId}>
                          <button
                            type="button"
                            onClick={() => {
                              onComparisonSuggestionSelect(entry);
                              onComparisonSearchChange(entry.displayLabel || entry.model || "");
                              setIsComparisonFocused(false);
                            }}
                            className={clsx(
                              "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm",
                              selected
                                ? "bg-amber-50 text-amber-700"
                                : "text-slate-700 hover:bg-slate-100"
                            )}
                          >
                            <span className="font-medium">{label}</span>
                            {subtitle ? (
                              <span className="text-xs text-slate-500">{subtitle}</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-3 py-2 text-xs text-slate-500">No matches found</li>
                  )}
                </ul>
              ) : null}
            </div>
            {comparison ? (
              <button
                type="button"
                onClick={onClearComparison}
                className="self-start text-xs font-semibold text-amber-700 hover:underline"
              >
                Clear comparison
              </button>
            ) : null}
          </div>
        </div>
        {radarData ? (
          <>
            {(selection || comparison) && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                {selection ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: "#0ea5e9" }}
                    />
                    {selection.displayLabel || selection.model || "Primary"}
                  </span>
                ) : null}
                {comparison ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: "#f97316" }}
                    />
                    {comparison.displayLabel || comparison.model || "Comparison"}
                  </span>
                ) : null}
              </div>
            )}
          <div className="flex h-[320px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 p-2">
            <Plot
              data={radarData.data}
              layout={radarData.layout}
              config={{
                displayModeBar: false,
                responsive: true
              }}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler
            />
          </div>
          </>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
            Interact with the charts or use the search boxes to surface up to two models for comparison.
          </div>
        )}
      </div>
    </aside>
  );
}
