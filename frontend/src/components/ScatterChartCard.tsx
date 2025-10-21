'use client';

import Plot from "@/components/PlotClient";
import { ROLE_COLORS } from "@/config/colors";
import type { CombinationEntry, DataRow, MetricMetadata } from "@/types/dataset";
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
  metrics: MetricMetadata[];
  metadataMap: Map<string, MetricMetadata>;
}

export function ScatterChartCard({
  combinations,
  xMetricId,
  yMetricId,
  onXMetricChange,
  onYMetricChange,
  onPointClick,
  highlightedCombinationId,
  metrics,
  metadataMap
}: ScatterChartCardProps) {
  const xMeta = metadataMap.get(xMetricId);
  const yMeta = metadataMap.get(yMetricId);
  const xIsPercentMetric = xMeta?.range === "percent";
  const yIsPercentMetric = yMeta?.range === "percent";

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
      const rawX = entries.map((entry) => entry.metrics[xMetricId]?.mean ?? 0);
      const rawY = entries.map((entry) => entry.metrics[yMetricId]?.mean ?? 0);

      const x = rawX.map((value) => (xIsPercentMetric ? value * 100 : value));
      const y = rawY.map((value) => (yIsPercentMetric ? value * 100 : value));

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
        const roleLabel = entry.role || "NA";
        const trials = Math.max(
          entry.metrics[xMetricId]?.trials ?? 0,
          entry.metrics[yMetricId]?.trials ?? 0
        );

        const formatAxisValue = (value: number | null, isPercent: boolean) => {
          if (value === null) return "NA";
          return isPercent
            ? `${formatMetricValue(value * 100, 1)}%`
            : formatMetricValue(value, 2);
        };

        const formatCi = (value: number | null, isPercent: boolean) => {
          if (value === null || value === 0) return null;
          return isPercent
            ? `CI: ± ${formatMetricValue(value * 100, 1)}%`
            : `CI: ± ${formatMetricValue(value, 2)}`;
        };

        const lines = [
          `<b>${entry.displayLabel || entry.model}</b>`,
          `${xMeta?.displayLabel ?? xMetricId}: ${formatAxisValue(xValue, xIsPercentMetric)}`,
          formatCi(xCi, xIsPercentMetric),
          `${yMeta?.displayLabel ?? yMetricId}: ${formatAxisValue(yValue, yIsPercentMetric)}`,
          formatCi(yCi, yIsPercentMetric),
          `Harm: ${entry.harm || "NA"}`,
          `Condition: ${condition}`,
          `Role: ${roleLabel}`,
          `Trials: ${trials || "NA"}`
        ].filter(Boolean);

        return `${lines.join("<br>")}<extra></extra>`;
      });

      const xErrorRaw = entries.map((entry) => entry.metrics[xMetricId]?.ci ?? 0);
      const yErrorRaw = entries.map((entry) => entry.metrics[yMetricId]?.ci ?? 0);

      const errorX = xErrorRaw.some((value) => value && value > 0)
        ? {
            type: "data",
            array: xErrorRaw.map((value) => (xIsPercentMetric ? value * 100 : value)),
            visible: true
          }
        : undefined;
      const errorY = yErrorRaw.some((value) => value && value > 0)
        ? {
            type: "data",
            array: yErrorRaw.map((value) => (yIsPercentMetric ? value * 100 : value)),
            visible: true
          }
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
    xMetricId,
    yMetricId,
    xIsPercentMetric,
    yIsPercentMetric
  ]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      margin: { l: 60, r: 20, t: 40, b: 60 },
      height: 520,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      xaxis: {
        title: {
          text: xMeta?.displayLabel ?? xMetricId,
          font: {
            size: 14,
            family: "Inter, sans-serif"
          }
        },
        range: xIsPercentMetric ? [0, 100] : undefined,
        tickformat: xIsPercentMetric ? ".1f" : undefined,
        automargin: true,
        zeroline: false,
        gridcolor: "#e2e8f0"
      },
      yaxis: {
        title: {
          text: yMeta?.displayLabel ?? yMetricId,
          font: {
            size: 14,
            family: "Inter, sans-serif"
          }
        },
        range: yIsPercentMetric ? [0, 100] : undefined,
        tickformat: yIsPercentMetric ? ".1f" : undefined,
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
    [xMeta, yMeta, xMetricId, yMetricId, xIsPercentMetric, yIsPercentMetric]
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
                {metrics.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.displayLabel}
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
                {metrics.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.displayLabel}
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
