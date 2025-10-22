'use client';

import Plot from "@/components/PlotClient";
import type { CombinationEntry, MetricMetadata } from "@/types/dataset";
import clsx from "clsx";
import { useMemo } from "react";
import type { Layout, PlotData } from "plotly.js";
import { formatMetricValue } from "@/utils/data";

interface ModelInfoDrawerProps {
  selection: CombinationEntry | null;
  onClear: () => void;
  metrics: MetricMetadata[];
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
  metrics
}: ModelInfoDrawerProps) {
  const radarData = useMemo(() => {
    if (!selection) {
      return null;
    }

    const labels: string[] = [];
    const normalizedValues: number[] = [];
    const hoverTexts: string[] = [];

    metrics.forEach((meta) => {
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
        "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200 transition",
        selection ? "opacity-100" : "opacity-75"
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
      {selection ? (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-2 text-sm text-slate-600">
            <div>
              <dt className="font-medium text-slate-500">Team</dt>
              <dd>{selection.team || "NA"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Condition</dt>
              <dd>{selection.condition || "NA"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Harm Context</dt>
              <dd>{selection.harm || "NA"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Type</dt>
              <dd>{selection.type || "NA"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Cases</dt>
              <dd>{selection.cases || "NA"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Grading</dt>
              <dd>{selection.grading || "NA"}</dd>
            </div>
          </dl>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-slate-700">
                Metric Breakdown
              </h4>
              <ul className="flex flex-col gap-2">
                {metrics.map((metric) => {
                  const row = selection.metrics[metric.id];
                  return (
                    <li
                      key={metric.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium text-slate-800">
                          {metric.displayLabel}
                        </span>
                        <span className="text-xs text-slate-500">
                          {metric.description}
                        </span>
                      </span>
                      <span className="flex flex-col items-end">
                        <span className="text-base font-semibold text-brand-600">
                          {formatMetricValue(row?.mean ?? null, {
                            metadata: metric
                          })}
                        </span>
                        {row?.ci !== null &&
                        row?.ci !== undefined &&
                        row?.ci !== 0 ? (
                          <span className="text-xs font-medium text-slate-500">
                            CI ±{" "}
                            {formatMetricValue(row.ci, {
                              metadata: metric
                            })}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-slate-700">
                Radar View
              </h4>
              {radarData ? (
                <div className="h-[320px] rounded-xl border border-slate-200 bg-slate-50/80 p-2">
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
                  Radar view unavailable for the selected model.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          Interact with the charts to surface a model&apos;s full profile here.
        </div>
      )}
    </aside>
  );
}
