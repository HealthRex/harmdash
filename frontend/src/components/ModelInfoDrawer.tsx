'use client';

import Plot from "@/components/PlotClient";
import type { CombinationEntry, MetricMetadata } from "@/types/dataset";
import clsx from "clsx";
import { useMemo, useState } from "react";
import type { Layout, PlotData } from "plotly.js";
import { formatMetricValue } from "@/utils/data";

interface ModelInfoDrawerProps {
  selection: CombinationEntry | null;
  onClear: () => void;
  metrics: MetricMetadata[];
  className?: string;
  modelQuery: string;
  onModelSearchChange: (value: string) => void;
  suggestions: CombinationEntry[];
  onSuggestionSelect: (entry: CombinationEntry) => void;
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
  onClear,
  metrics,
  className,
  modelQuery,
  onModelSearchChange,
  suggestions,
  onSuggestionSelect
}: ModelInfoDrawerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const trimmedQuery = modelQuery.trim();
  const showSuggestions = isFocused && trimmedQuery !== "" && suggestions.length > 0;

  const radarData = useMemo(() => {
    if (!selection) {
      return null;
    }

    const labels: string[] = [];
    const normalizedValues: number[] = [];
    const hoverTexts: string[] = [];

    metrics.forEach((meta) => {
      if (!meta.includeInRadar) {
        return;
      }
      const row = selection.metrics[meta.id];
      const normalized = computeNormalizedMetricValue(row?.mean ?? null, meta);
      if (normalized === null) {
        return;
      }

      labels.push(meta.displayLabel);
      normalizedValues.push(normalized);
      hoverTexts.push(
        `${meta.displayLabel}: ${formatMetricValue(row?.mean ?? null, {
          metadata: meta
        })}`
      );
    });

    if (labels.length === 0) {
      return null;
    }

    const closedValues = [...normalizedValues, normalizedValues[0]];
    const closedLabels = [...labels, labels[0]];
    const closedHover = [...hoverTexts, hoverTexts[0]];

    const data: PlotData[] = [
      {
        type: "scatterpolar",
        r: closedValues,
        theta: closedLabels,
        fill: "toself",
        name: "Metric profile",
        hoverinfo: "text",
        hovertext: closedHover,
        marker: {
          color: "#38bdf8",
          size: 6
        },
        line: {
          color: "#0ea5e9",
          width: 2
        },
        opacity: 0.8
      } as PlotData
    ];

    const layout: Partial<Layout> = {
      margin: { l: 20, r: 20, t: 30, b: 20 },
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 1],
          gridcolor: "#cbd5f5",
          linecolor: "#94a3b8",
          tickvals: [0, 0.25, 0.5, 0.75, 1],
          ticktext: ["0", "0.25", "0.5", "0.75", "1"],
          tickfont: {
            size: 10,
            color: "#475569"
          }
        },
        angularaxis: {
          tickfont: {
            size: 12,
            color: "#1f2937"
          },
          gridcolor: "#e2e8f0",
          linecolor: "#94a3b8"
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

    return { data, layout };
  }, [metrics, selection]);

  return (
    <aside
      className={clsx(
        "flex w-full max-w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200 transition lg:max-w-[520px]",
        selection ? "opacity-100" : "opacity-75",
        className
      )}
    >
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {selection?.displayLabel ?? "Select a model"}
          </h3>
          <p className="text-sm text-slate-500">
            {selection
              ? "Detailed metrics for the selected model and condition."
              : "Click on any bar or point to inspect model performance."}
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
      </header>
      <div className="flex flex-1 flex-col gap-3">
        <div className="relative">
          <input
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
        {selection && radarData ? (
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
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
            Interact with the charts or use the search box to surface a model&apos;s full profile here.
          </div>
        )}
      </div>
    </aside>
  );
}
