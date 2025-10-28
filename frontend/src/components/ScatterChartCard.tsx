'use client';

import Plot from "@/components/PlotClient";
import { TEAM_COLORS } from "@/config/colors";
import type { CombinationEntry, DataRow, MetricMetadata } from "@/types/dataset";
import type { Layout, PlotData, PlotMouseEvent, Shape } from "plotly.js";
import { useMemo } from "react";
import { formatMetricValue } from "@/utils/data";

const LEGEND_PRIORITY_GROUPS: readonly string[][] = [
  ["Solo Models", "Solo Model", "1 Agent"],
  ["2-Agent Teams", "2-Agent Team", "2 Agents"],
  ["3-Agent Teams", "3-Agent Team", "3 Agents"]
];

const LEGEND_PRIORITY_MAP = new Map<string, number>();

LEGEND_PRIORITY_GROUPS.forEach((group, index) => {
  group.forEach((label) => {
    LEGEND_PRIORITY_MAP.set(label.trim().toLowerCase(), index);
  });
});

function getLegendPriority(label: string): number {
  const normalized = label.trim().toLowerCase();
  return LEGEND_PRIORITY_MAP.get(normalized) ?? LEGEND_PRIORITY_GROUPS.length;
}

function sizeFromTrials(a: DataRow | undefined, b: DataRow | undefined) {
  const trials = Math.max(a?.trials ?? 0, b?.trials ?? 0);
  if (trials <= 0) return 10;
  return Math.min(28, 10 + Math.log2(trials + 1) * 4);
}

function resolveAxisRange(
  values: number[],
  meta: MetricMetadata | undefined,
  isPercentMetric: boolean
): [number, number] | undefined {
  const convert = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return null;
    }
    return isPercentMetric ? value * 100 : value;
  };

  const specifiedMin = convert(meta?.axisMin ?? null);
  const specifiedMax = convert(meta?.axisMax ?? null);

  const finiteValues = values.filter((value) => Number.isFinite(value));
  const dataMin =
    finiteValues.length > 0
      ? Math.min(...finiteValues)
      : null;
  const dataMax =
    finiteValues.length > 0
      ? Math.max(...finiteValues)
      : null;

  let rangeMin =
    specifiedMin ?? (isPercentMetric ? 0 : dataMin);
  let rangeMax =
    specifiedMax ?? (isPercentMetric ? 100 : dataMax);

  if (rangeMin === null && rangeMax === null) {
    return undefined;
  }

  if (rangeMin === null && rangeMax !== null) {
    rangeMin = rangeMax - Math.abs(rangeMax || 1) * 0.1;
  }

  if (rangeMax === null && rangeMin !== null) {
    rangeMax = rangeMin + Math.abs(rangeMin || 1) * 0.1 || rangeMin + 1;
  }

  if (rangeMin === null || rangeMax === null) {
    return undefined;
  }

  if (rangeMax <= rangeMin) {
    const spread = Math.abs(rangeMin || 1) * 0.1 || 1;
    rangeMax = rangeMin + spread;
  }

  return [rangeMin, rangeMax];
}

const HUMAN_MODEL_KEY = "human";

function isHumanEntry(entry: CombinationEntry) {
  const model = (entry.model ?? "").trim().toLowerCase();
  if (model === HUMAN_MODEL_KEY) {
    return true;
  }

  const label = (entry.displayLabel ?? "").trim().toLowerCase();
  return label === HUMAN_MODEL_KEY;
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

  const teamGroups = useMemo(() => {
    const map = new Map<string, CombinationEntry[]>();
    filtered.forEach((entry) => {
      const key = entry.team || "Unspecified Team";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(entry);
    });
    return map;
  }, [filtered]);

  const sortedTeams = useMemo(() => {
    return Array.from(teamGroups.entries()).sort((a, b) => {
      const aPriority = getLegendPriority(a[0]);
      const bPriority = getLegendPriority(b[0]);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a[0].localeCompare(b[0]);
    });
  }, [teamGroups]);

  const data: PlotData[] = useMemo(() => {
    const highlighted = new Set([highlightedCombinationId ?? ""]);
    const nonHumanTraces: PlotData[] = [];
    const humanTraces: PlotData[] = [];

    const createTrace = (
      traceName: string,
      entries: CombinationEntry[],
      colorKey: string,
      legendGroup: string,
      legendRank?: number
    ) => {
      if (entries.length === 0) {
        return null;
      }

      const rawX = entries.map((entry) => entry.metrics[xMetricId]?.mean ?? 0);
      const rawY = entries.map((entry) => entry.metrics[yMetricId]?.mean ?? 0);

      const x = rawX.map((value) => (xIsPercentMetric ? value * 100 : value));
      const y = rawY.map((value) => (yIsPercentMetric ? value * 100 : value));

      const color = TEAM_COLORS[colorKey] ?? TEAM_COLORS.default;
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
        const trials = Math.max(
          entry.metrics[xMetricId]?.trials ?? 0,
          entry.metrics[yMetricId]?.trials ?? 0
        );
        const modelName = entry.displayLabel || entry.model || "Unknown Model";

        const formatAxisValue = (
          value: number | null,
          meta: MetricMetadata | undefined
        ) => {
          if (value === null) return "NA";
          return formatMetricValue(value, { metadata: meta });
        };

        const formatMetricLine = (
          label: string,
          value: number | null,
          ci: number | null,
          meta: MetricMetadata | undefined
        ) => {
          const formattedValue = formatAxisValue(value, meta);
          if (formattedValue === "NA") {
            return `${label}: NA`;
          }

          if (ci === null || ci === 0) {
            return `${label}: ${formattedValue}`;
          }

          const formattedCi = formatMetricValue(ci, { metadata: meta });
          return `${label}: ${formattedValue} ± ${formattedCi}`;
        };

        const lines = [
          `<b>${modelName}</b>`,
          `Prompt: ${condition}`,
          formatMetricLine(xMeta?.displayLabel ?? xMetricId, xValue, xCi, xMeta),
          formatMetricLine(yMeta?.displayLabel ?? yMetricId, yValue, yCi, yMeta),
          `Trials: ${trials || "NA"}`
        ].filter(Boolean);

        return lines.join("<br>");
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

      const trace = {
        type: "scattergl",
        mode: "markers",
        name: traceName,
        x,
        y,
        text: entries.map((entry) => entry.displayLabel || entry.model),
        hoverinfo: "text",
        hovertext: hoverTexts,
        marker,
        error_x: errorX,
        error_y: errorY,
        customdata: entries.map((entry) => entry.combinationId),
        legendgroup: legendGroup,
        legendrank: legendRank
      } as PlotData;

      return trace;
    };

    sortedTeams.forEach(([team, entries]) => {
      const humanEntries: CombinationEntry[] = [];
      const otherEntries: CombinationEntry[] = [];

      entries.forEach((entry) => {
        if (isHumanEntry(entry)) {
          humanEntries.push(entry);
        } else {
          otherEntries.push(entry);
        }
      });

      const legendGroup = team || "default-team";

      const otherTrace = createTrace(
        team,
        otherEntries,
        team,
        legendGroup,
        getLegendPriority(team)
      );
      if (otherTrace) {
        nonHumanTraces.push(otherTrace);
      }

      if (humanEntries.length > 0) {
        const humanTrace = createTrace(
          "Human Physicians",
          humanEntries,
          "Human",
          legendGroup,
          Number.MAX_SAFE_INTEGER
        );
        if (humanTrace) {
          humanTraces.push(humanTrace);
        }
      }
    });

    return [...nonHumanTraces, ...humanTraces];
  }, [
    sortedTeams,
    highlightedCombinationId,
    xMetricId,
    yMetricId,
    xIsPercentMetric,
    yIsPercentMetric,
    xMeta,
    yMeta
  ]);

  const xDisplayValues = useMemo(() => {
    return filtered
      .map((entry) => entry.metrics[xMetricId]?.mean)
      .filter(
        (value): value is number =>
          value !== null && value !== undefined && Number.isFinite(value)
      )
      .map((value) => (xIsPercentMetric ? value * 100 : value));
  }, [filtered, xMetricId, xIsPercentMetric]);

  const yDisplayValues = useMemo(() => {
    return filtered
      .map((entry) => entry.metrics[yMetricId]?.mean)
      .filter(
        (value): value is number =>
          value !== null && value !== undefined && Number.isFinite(value)
      )
      .map((value) => (yIsPercentMetric ? value * 100 : value));
  }, [filtered, yMetricId, yIsPercentMetric]);

  const xAxisRange = useMemo(
    () => resolveAxisRange(xDisplayValues, xMeta, xIsPercentMetric),
    [xDisplayValues, xMeta, xIsPercentMetric]
  );

  const yAxisRange = useMemo(
    () => resolveAxisRange(yDisplayValues, yMeta, yIsPercentMetric),
    [yDisplayValues, yMeta, yIsPercentMetric]
  );

  const xAxisTitle = useMemo(() => {
    const label = xMeta?.displayLabel ?? xMetricId;
    if (!xIsPercentMetric) {
      return label;
    }
    return /%/.test(label) ? label : `${label} (%)`;
  }, [xMeta, xMetricId, xIsPercentMetric]);

  const yAxisTitle = useMemo(() => {
    const label = yMeta?.displayLabel ?? yMetricId;
    if (!yIsPercentMetric) {
      return label;
    }
    return /%/.test(label) ? label : `${label} (%)`;
  }, [yMeta, yMetricId, yIsPercentMetric]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      margin: { l: 60, r: 20, t: 80, b: 60 },
      height: 520,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      xaxis: {
        title: {
          text: `<b>${xAxisTitle}</b>`,
          font: {
            size: 16,
            family: "Inter, sans-serif"
          }
        },
        range: xAxisRange,
        tickformat: xIsPercentMetric ? ".0f" : undefined,
        ticksuffix: xIsPercentMetric ? "%" : undefined,
        automargin: true,
        zeroline: false,
        gridcolor: "#e2e8f0",
        zerolinecolor: "#94a3b8",
        zerolinewidth: 1.5,
        showline: true,
        mirror: true,
        linecolor: "#94a3b8",
        linewidth: 1.5,
        tickfont: {
          size: 12,
          family: "Inter, sans-serif",
          color: "#0f172a"
        }
      },
      yaxis: {
        title: {
          text: `<b>${yAxisTitle}</b>`,
          font: {
            size: 16,
            family: "Inter, sans-serif"
          }
        },
        range: yAxisRange,
        tickformat: yIsPercentMetric ? ".0f" : undefined,
        ticksuffix: yIsPercentMetric ? "%" : undefined,
        automargin: true,
        zeroline: false,
        gridcolor: "#e2e8f0",
        zerolinecolor: "#94a3b8",
        zerolinewidth: 1.5,
        showline: true,
        mirror: true,
        linecolor: "#94a3b8",
        linewidth: 1.5,
        tickfont: {
          size: 12,
          family: "Inter, sans-serif",
          color: "#0f172a"
        }
      },
      hovermode: "closest",
      font: {
        family: "Inter, sans-serif",
        color: "#0f172a"
      },
      legend: {
        orientation: "h",
        x: 0,
        xanchor: "left",
        y: 1.12,
        yanchor: "bottom",
        traceorder: "normal"
      },
      shapes: (() => {
        const shapes: Partial<Shape>[] = [];
        if (!xAxisRange || (xAxisRange[0] <= 0 && xAxisRange[1] >= 0)) {
          shapes.push({
            type: "line",
            x0: 0,
            x1: 0,
            y0: yAxisRange ? yAxisRange[0] : 0,
            y1: yAxisRange ? yAxisRange[1] : 0,
            line: {
              color: "#cbd5f5",
              width: 1,
              dash: "dot"
            }
          });
        }
        if (!yAxisRange || (yAxisRange[0] <= 0 && yAxisRange[1] >= 0)) {
          shapes.push({
            type: "line",
            x0: xAxisRange ? xAxisRange[0] : 0,
            x1: xAxisRange ? xAxisRange[1] : 0,
            y0: 0,
            y1: 0,
            line: {
              color: "#cbd5f5",
              width: 1,
              dash: "dot"
            }
          });
        }
        const addPercentLine = (value: number) => {
          const x100Visible =
            value >= (xAxisRange ? xAxisRange[0] : Number.NEGATIVE_INFINITY) &&
            value <= (xAxisRange ? xAxisRange[1] : Number.POSITIVE_INFINITY);
          if (x100Visible) {
            shapes.push({
              type: "line",
              x0: value,
              x1: value,
              y0: yAxisRange ? yAxisRange[0] : 0,
              y1: yAxisRange ? yAxisRange[1] : 0,
              line: {
                color: "#38bdf8",
                width: 1,
                dash: "dash"
              }
            });
          }

          const y100Visible =
            value >= (yAxisRange ? yAxisRange[0] : Number.NEGATIVE_INFINITY) &&
            value <= (yAxisRange ? yAxisRange[1] : Number.POSITIVE_INFINITY);
          if (y100Visible) {
            shapes.push({
              type: "line",
              x0: xAxisRange ? xAxisRange[0] : 0,
              x1: xAxisRange ? xAxisRange[1] : 0,
              y0: value,
              y1: value,
              line: {
                color: "#38bdf8",
                width: 1,
                dash: "dash"
              }
            });
          }
        };

        if (xIsPercentMetric || yIsPercentMetric) {
          addPercentLine(100);
        }

        return shapes;
      })()
    }),
    [
      xIsPercentMetric,
      yIsPercentMetric,
      xAxisRange,
      yAxisRange,
      xAxisTitle,
      yAxisTitle
    ]
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
    <section className="mx-auto flex w-full max-w-[50%] flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg shadow-slate-200">
      <header className="flex flex-col gap-1">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Metric Explorer
          </h2>
          <p className="text-sm text-slate-500">
            Compare model performance across two metrics. 
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Hover for more details. Size approximates number of trials.
        </p>
      </header>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex w-full max-w-xs flex-col gap-1 text-xs font-medium text-slate-600">
            Y Metric
            <select
              value={yMetricId}
              onChange={(event) => onYMetricChange(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-brand-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {metrics.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.displayLabel}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-full max-w-xs flex-col gap-1 text-xs font-medium text-slate-600">
            X Metric
            <select
              value={xMetricId}
              onChange={(event) => onXMetricChange(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-brand-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {metrics.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.displayLabel}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="aspect-square w-full flex-1">
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
      </div>
    </section>
  );
}
