'use client';

import Plot from "@/components/PlotClient";
import { ROLE_COLORS } from "@/config/colors";
import { metricsById, metricsConfig } from "@/config/metrics";
import type { CombinationEntry, DataRow } from "@/types/dataset";
import clsx from "clsx";
import type { Layout, PlotData, PlotMouseEvent } from "plotly.js";
import { useMemo } from "react";
import { formatMetricValue } from "@/utils/data";

function sizeFromTrials(a: DataRow | undefined, b: DataRow | undefined) {
  const trials = Math.max(a?.trials ?? 0, b?.trials ?? 0);
  if (trials <= 0) return 10;
  return Math.min(28, 10 + Math.log2(trials + 1) * 4);
}

interface ScatterChartCardProps {
  combinations: CombinationEntry[];
  xMetricId: string;
  yMetricId: string;
  onXMetricChange: (metricId: string) => void;
  onYMetricChange: (metricId: string) => void;
  onPointClick?: (entry: CombinationEntry) => void;
  highlightedCombinationId?: string | null;
}

export function ScatterChartCard({
  combinations,
  xMetricId,
  yMetricId,
  onXMetricChange,
  onYMetricChange,
  onPointClick,
  highlightedCombinationId
}: ScatterChartCardProps) {
  const xMetric = metricsById[xMetricId];
  const yMetric = metricsById[yMetricId];

  const filtered = useMemo(() => {
    return combinations.filter((entry) => {
      const xValue = entry.metrics[xMetricId]?.mean;
      const yValue = entry.metrics[yMetricId]?.mean;
      return xValue !== undefined && xValue !== null && yValue !== undefined && yValue !== null;
    });
  }, [combinations, xMetricId, yMetricId]);

  const roleGroups = useMemo(() => {
    const map = new Map<string, CombinationEntry[]>();
    filtered.forEach((entry) => {
      const key = entry.role || "Other";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(entry);
    });
    return map;
  }, [filtered]);

  const data: PlotData[] = useMemo(() => {
    const highlighted = new Set([highlightedCombinationId ?? ""]);
    const traces: PlotData[] = [];
    roleGroups.forEach((entries, role) => {
      const x = entries.map((entry) => entry.metrics[xMetricId]?.mean ?? 0);
      const y = entries.map((entry) => entry.metrics[yMetricId]?.mean ?? 0);
      const color = ROLE_COLORS[role] ?? ROLE_COLORS.default;
      const marker = {
        size: entries.map((entry) =>
          sizeFromTrials(entry.metrics[xMetricId], entry.metrics[yMetricId])
        ),
        color,
        opacity: entries.map((entry) =>
          highlightedCombinationId
            ? highlighted.has(entry.combinationId)
              ? 0.95
              : 0.4
            : 0.85
        ),
        line: {
          width: entries.map((entry) =>
            highlightedCombinationId && highlighted.has(entry.combinationId)
              ? 2
              : 0
          ),
          color: "#0f172a"
        }
      };

      const hoverTexts = entries.map((entry) => {
        const xValue = entry.metrics[xMetricId]?.mean ?? null;
        const yValue = entry.metrics[yMetricId]?.mean ?? null;
        const xCi = entry.metrics[xMetricId]?.ci ?? null;
        const yCi = entry.metrics[yMetricId]?.ci ?? null;
        const condition = entry.condition || "NA";
        const role = entry.role || "NA";
        const trials = Math.max(
          entry.metrics[xMetricId]?.trials ?? 0,
          entry.metrics[yMetricId]?.trials ?? 0
        );
        const lines = [
          `<b>${entry.displayLabel || entry.model}</b>`,
          `${xMetric?.label ?? xMetricId}: ${formatMetricValue(
            xValue,
            xMetric
          )}`,
          xCi
            ? `CI (${xMetric?.label ?? xMetricId}): ±${formatMetricValue(
                xCi,
                xMetric
              )}`
            : null,
          `${yMetric?.label ?? yMetricId}: ${formatMetricValue(
            yValue,
            yMetric
          )}`,
          yCi
            ? `CI (${yMetric?.label ?? yMetricId}): ±${formatMetricValue(
                yCi,
                yMetric
              )}`
            : null,
          `Harm: ${entry.harm || "NA"}`,
          `Condition: ${condition}`,
          `Role: ${role}`,
          `Trials: ${trials || "NA"}`
        ].filter(Boolean);

        return `${lines.join("<br>")}<extra></extra>`;
      });

      const xError = entries.map(
        (entry) => entry.metrics[xMetricId]?.ci ?? 0
      );
      const yError = entries.map(
        (entry) => entry.metrics[yMetricId]?.ci ?? 0
      );

      const errorX =
        xError.some((value) => value && value > 0)
          ? { type: "data", array: xError, visible: true }
          : undefined;
      const errorY =
        yError.some((value) => value && value > 0)
          ? { type: "data", array: yError, visible: true }
          : undefined;

      traces.push({
        type: "scattergl",
        mode: "markers",
        name: role,
        x,
        y,
        text: entries.map((entry) => entry.displayLabel || entry.model),
        hoverinfo: "text",
        hovertext: hoverTexts,
        marker,
        error_x: errorX,
        error_y: errorY,
        customdata: entries.map((entry) => entry.combinationId)
      } as PlotData);
    });

    return traces;
  }, [
    roleGroups,
    highlightedCombinationId,
    xMetric,
    yMetric,
    xMetricId,
    yMetricId
  ]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      margin: { l: 60, r: 20, t: 40, b: 60 },
      height: 520,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      xaxis: {
        title: {
          text: xMetric?.label ?? xMetricId,
          font: {
            size: 14,
            family: "Inter, sans-serif"
          }
        },
        automargin: true,
        zeroline: false,
        gridcolor: "#e2e8f0"
      },
      yaxis: {
        title: {
          text: yMetric?.label ?? yMetricId,
          font: {
            size: 14,
            family: "Inter, sans-serif"
          }
        },
        automargin: true,
        zeroline: false,
        gridcolor: "#e2e8f0"
      },
      hovermode: "closest",
      font: {
        family: "Inter, sans-serif",
        color: "#0f172a"
      },
      legend: {
        orientation: "h",
        y: 1.1
      }
    }),
    [xMetric, yMetric, xMetricId, yMetricId]
  );

  const handleClick = (event: PlotMouseEvent) => {
    if (!onPointClick) return;
    const point = event.points?.[0];
    if (!point) return;
    const combinationId = point.customdata as string;
    const entry = filtered.find(
      (candidate) => candidate.combinationId === combinationId
    );
    if (entry) {
      onPointClick(entry);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg shadow-slate-200">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Metric Explorer
            </h2>
            <p className="text-sm text-slate-500">
              Compare model behavior across two metrics. Click a point to inspect the full profile.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              X Metric
              <select
                value={xMetricId}
                onChange={(event) => onXMetricChange(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm transition hover:border-brand-500"
              >
                {metricsConfig.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Y Metric
              <select
                value={yMetricId}
                onChange={(event) => onYMetricChange(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm transition hover:border-brand-500"
              >
                {metricsConfig.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Hover for contextual details. Marker size approximates available trials for the two metrics.
        </p>
      </header>
      <div className={clsx("min-h-[520px] w-full")}>
        <Plot
          data={data}
          layout={layout}
          config={{
            displayModeBar: false,
            responsive: true,
            scrollZoom: true
          }}
          style={{ width: "100%", height: "100%" }}
          onClick={handleClick}
          useResizeHandler
        />
      </div>
    </section>
  );
}
