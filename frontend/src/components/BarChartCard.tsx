'use client';

import Plot from "@/components/PlotClient";
import { CONDITION_COLORS, ROLE_COLORS } from "@/config/colors";
import { metricsById, metricsConfig } from "@/config/metrics";
import type { DataRow } from "@/types/dataset";
import {
  formatMetricValue,
  pickRowsForMetric,
  sortRowsForMetric
} from "@/utils/data";
import clsx from "clsx";
import type { Layout, PlotData, PlotMouseEvent } from "plotly.js";
import { useMemo } from "react";

const conditionLegendOrder = [
  "Control",
  "Solo",
  "Guardian",
  "Guardian+Guardian",
  "Guardian+Stewardship",
  "Stewardship"
];

const roleLegendOrder = ["Agent1", "Agent2", "Agent3", "Human"];

function LegendBadge({
  label,
  color
}: {
  label: string;
  color: string;
}) {
  return (
    <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

interface BarChartCardProps {
  rows: DataRow[];
  metricId: string;
  onMetricChange: (metricId: string) => void;
  onBarClick?: (row: DataRow) => void;
  highlightedCombinationId?: string | null;
  maxItems?: number;
}

export function BarChartCard({
  rows,
  metricId,
  onMetricChange,
  onBarClick,
  highlightedCombinationId,
  maxItems = 15
}: BarChartCardProps) {
  const metric = metricsById[metricId];

  const barRows = useMemo(() => {
    const filtered = pickRowsForMetric(rows, metricId);
    return sortRowsForMetric(
      filtered,
      metric?.higherIsBetter ?? true,
      maxItems
    );
  }, [rows, metricId, metric, maxItems]);

const formatCategoryLabel = (row: DataRow) => {
  const base = row.displayLabel || row.model;
  if (!row.condition || row.condition === "Solo") {
    return base;
  }
  return `${base} (${row.condition})`;
};

const shortenLabel = (label: string, maxChars = 42) => {
  if (label.length <= maxChars) {
    return label;
  }
  return `${label.slice(0, maxChars - 1)}…`;
};

  const categoryLabels = useMemo(
    () => barRows.map((row) => formatCategoryLabel(row)),
    [barRows]
  );

  const { plotTrace, valueAnnotations, conditionLegend, roleLegend, xAxisMax } =
    useMemo(() => {
    const x = barRows.map((row) => row.mean ?? 0);
    const y = categoryLabels;
    const colors = barRows.map((row) => {
      const colorKey = row.colorKey || row.condition || row.role;
      if (colorKey && CONDITION_COLORS[colorKey]) {
        return CONDITION_COLORS[colorKey];
      }
      if (colorKey && ROLE_COLORS[colorKey]) {
        return ROLE_COLORS[colorKey];
      }
      return ROLE_COLORS.default;
    });

    const highlighted = new Set([highlightedCombinationId ?? ""]);

    const formattedValues = barRows.map((row) => {
      const base = formatMetricValue(row.mean, metric);
      if (row.ci !== null && row.ci !== undefined && row.ci !== 0) {
        return `${base} ± ${formatMetricValue(row.ci, metric)}`;
      }
      return base;
    });

    const ciValues = barRows.map((row) => row.ci ?? 0);
    const hoverTexts = barRows.map((row) => {
      const lines = [
        `<b>${row.displayLabel || row.model}</b>`,
        `${metric?.label ?? metricId}: ${formatMetricValue(row.mean, metric)}`
      ];
      if (row.ci !== null && row.ci !== undefined && row.ci !== 0) {
        lines.push(`CI: ±${formatMetricValue(row.ci, metric)}`);
      } else {
        lines.push("CI: Not available");
      }
      lines.push(
        `Harm: ${row.harm || "NA"}`,
        `Condition: ${row.condition || "NA"}`,
        `Role: ${row.role || "NA"}`,
        `Trials: ${row.trials ?? "NA"}`
      );
      return lines.join("<br>");
    });

    const hasCi = ciValues.some((value) => value && value > 0);
    const errorX: PlotData["error_x"] = {
      type: "data",
      array: hasCi ? ciValues : ciValues.map(() => 0),
      visible: hasCi
    };

    const maxValue = Math.max(...x, 0);
    const xPadding = maxValue * 0.1 || 1;
    const inlineLabels = barRows.map((row) =>
      shortenLabel(row.displayLabel || row.model, 40)
    );

    const baseOpacities = barRows.map((row) =>
      highlightedCombinationId
        ? highlighted.has(row.combinationId)
          ? 1
          : 0.5
        : 0.92
    );

    const xAxisMax = maxValue + xPadding;

    const trace = {
      type: "bar" as const,
      orientation: "h" as const,
      x,
      y,
      text: inlineLabels,
      textposition: "auto",
      cliponaxis: false,
      marker: {
        color: colors,
        opacity: baseOpacities,
        line: {
          color: colors.map((color) => color + "33"),
          width: 1
        }
      },
      error_x: errorX ?? false,
      hoverinfo: "text",
      hovertext: hoverTexts
    } as PlotData;

    const annotations = barRows.map((row, index) => ({
      xref: "paper" as const,
      yref: "y" as const,
      x: 1.02,
      y: categoryLabels[index],
      xanchor: "left" as const,
      yanchor: "middle" as const,
      text: formattedValues[index],
      font: {
        color: "#0f172a",
        size: 14,
        family: "Inter, sans-serif"
      },
      showarrow: false
    }));

    const conditionSet = new Set(
      barRows
        .map((row) => row.condition)
        .filter((value): value is string => Boolean(value))
    );
    const roleSet = new Set(
      barRows
        .map((row) => row.role)
        .filter((value): value is string => Boolean(value))
    );

    const conditionLegend = conditionLegendOrder
      .filter((key) => conditionSet.has(key))
      .map((key) => ({
        label: key,
        color: CONDITION_COLORS[key] ?? ROLE_COLORS.default
      }));

    const roleLegend = roleLegendOrder
      .filter((key) => roleSet.has(key))
      .map((key) => ({
        label: key,
        color: ROLE_COLORS[key] ?? ROLE_COLORS.default
      }));

    return {
      plotTrace: trace,
      valueAnnotations: annotations,
      conditionLegend,
      roleLegend,
      xAxisMax
    };
  }, [barRows, categoryLabels, metric, metricId, highlightedCombinationId]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      margin: { l: 72, r: 140, t: 48, b: 48 },
      height: Math.max(420, barRows.length * 34 + 140),
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(248,249,252,0.6)",
      xaxis: {
        title: {
          text: metric?.label ?? metricId,
          font: {
            size: 14,
            family: "Inter, sans-serif",
            color: "#475569"
          }
        },
        range: [0, xAxisMax],
        showgrid: false,
        zeroline: false,
        showline: false,
        automargin: true
      },
      yaxis: {
        automargin: true,
        categoryorder: "array",
        categoryarray: categoryLabels,
        autorange: "reversed",
        showticklabels: false,
        showgrid: false
      },
      bargap: 0.35,
      hovermode: "closest",
      font: {
        family: "Inter, sans-serif",
        color: "#0f172a"
      },
      annotations: valueAnnotations,
      shapes: [
        {
          type: "line",
          xref: "paper",
          yref: "paper",
          x0: 1,
          x1: 1,
          y0: 0,
          y1: 1,
          line: {
            color: "rgba(148, 163, 184, 0.45)",
            width: 1,
            dash: "dot"
          }
        }
      ]
    }),
    [barRows.length, categoryLabels, metric, metricId, valueAnnotations, xAxisMax]
  );

  const handleClick = (event: PlotMouseEvent) => {
    if (!onBarClick) return;
    const point = event.points?.[0];
    if (!point) return;
    const custom = point.customdata as
      | string
      | {
          combinationId: string;
        };
    const combinationId =
      typeof custom === "string" ? custom : custom?.combinationId;
    if (!combinationId) return;
    const row = barRows.find((entry) => entry.combinationId === combinationId);
    if (row) {
      onBarClick(row);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg shadow-slate-200">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Top Models by {metric?.label ?? metricId}
            </h2>
            <p className="text-sm text-slate-500">
              Click a bar to see detailed metrics. Sorted{" "}
              {metric?.higherIsBetter === false ? "ascending" : "descending"} by mean value.
            </p>
          </div>
          <select
            value={metricId}
            onChange={(event) => onMetricChange(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-brand-500"
          >
            {metricsConfig.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {metric ? (
          <p className="text-xs text-slate-500">{metric.description}</p>
        ) : null}
      </header>
      <div className="flex flex-wrap items-start gap-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {metric?.higherIsBetter === false ? "Lower is Better" : "Higher is Better"}
        </span>
        {conditionLegend.length ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="font-medium uppercase tracking-wide text-slate-500">
              Condition
            </span>
            {conditionLegend.map((item) => (
              <LegendBadge key={item.label} label={item.label} color={item.color} />
            ))}
          </div>
        ) : null}
        {roleLegend.length ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="font-medium uppercase tracking-wide text-slate-500">
              Role
            </span>
            {roleLegend.map((item) => (
              <LegendBadge key={item.label} label={item.label} color={item.color} />
            ))}
          </div>
        ) : null}
      </div>
      <div className={clsx("min-h-[460px] w-full")}> 
        <Plot
          data={[plotTrace]}
          layout={layout}
          config={{
            displayModeBar: false,
            responsive: true
          }}
          style={{ width: "100%", height: "100%" }}
          onClick={handleClick}
          useResizeHandler
        />
      </div>
    </section>
  );
}
