'use client';

import { CONDITION_COLORS, ROLE_COLORS } from "@/config/colors";
import type { DataRow, MetricMetadata } from "@/types/dataset";
import {
  pickRowsForMetric,
  sortRowsForMetric,
  formatMetricValue
} from "@/utils/data";
import clsx from "clsx";
import { useMemo } from "react";

type Props = {
  rows: DataRow[];
  metricId: string;
  onMetricChange: (metricId: string) => void;
  onBarClick?: (row: DataRow) => void;
  highlightedCombinationId?: string | null;
  maxItems?: number;
  metrics: MetricMetadata[];
  metadataMap: Map<string, MetricMetadata>;
};

const conditionLegendOrder = [
  "Control",
  "Solo",
  "Guardian",
  "Guardian+Guardian",
  "Guardian+Stewardship",
  "Stewardship"
];

const roleLegendOrder = ["Agent1", "Agent2", "Agent3", "Human"];

const shortenLabel = (label: string, maxChars = 44) => {
  if (label.length <= maxChars) return label;
  return `${label.slice(0, maxChars - 1)}…`;
};

const getBarColor = (row: DataRow) => {
  const key = row.colorKey || row.condition || row.role;
  if (key && CONDITION_COLORS[key]) return CONDITION_COLORS[key];
  if (key && ROLE_COLORS[key]) return ROLE_COLORS[key];
  return ROLE_COLORS.default;
};

const getTextColor = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#111827' : '#f8fafc';
};

function LegendBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function BarChartCard({
  rows,
  metricId,
  onMetricChange,
  onBarClick,
  highlightedCombinationId,
  maxItems = 15,
  metrics,
  metadataMap
}: Props) {
  const metricMeta = metadataMap.get(metricId);
  const metricLabel = metricMeta?.displayLabel ?? metricId;
  const metricDescription = metricMeta?.description ?? "";
  const isPercentMetric = metricMeta?.range === "percent";

  const barRows = useMemo(() => {
    const filtered = pickRowsForMetric(rows, metricId);
    return sortRowsForMetric(filtered, true, maxItems);
  }, [rows, metricId, maxItems]);

  const maxValue = useMemo(() => {
    if (barRows.length === 0) return 1;
    if (isPercentMetric) return 1;
    const candidateMax = Math.max(...barRows.map((row) => row.mean ?? 0), 0);
    return candidateMax <= 0 ? 1 : candidateMax;
  }, [barRows, isPercentMetric]);

  const conditionLegend = useMemo(() => {
    const keys = new Set(
      barRows
        .map((row) => row.condition)
        .filter((value): value is string => Boolean(value))
    );
    return conditionLegendOrder
      .filter((key) => keys.has(key))
      .map((key) => ({
        label: key,
        color: CONDITION_COLORS[key] ?? ROLE_COLORS.default
      }));
  }, [barRows]);

  const roleLegend = useMemo(() => {
    const keys = new Set(
      barRows
        .map((row) => row.role)
        .filter((value): value is string => Boolean(value))
    );
    return roleLegendOrder
      .filter((key) => keys.has(key))
      .map((key) => ({
        label: key,
        color: ROLE_COLORS[key] ?? ROLE_COLORS.default
      }));
  }, [barRows]);

  const handleRowClick = (row: DataRow) => {
    onBarClick?.(row);
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg shadow-slate-200">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Top Models by {metricLabel}
            </h2>
            <p className="text-sm text-slate-500">
              Click a row to see detailed metrics. Sorted descending by mean value.
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
      <div className="flex flex-wrap items-start gap-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {"Higher is Better"}
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
      <div className="flex flex-col gap-3">
        {barRows.map((row) => {
          const value = row.mean ?? 0;
          const widthPercentRaw = isPercentMetric
            ? value * 100
            : maxValue === 0
            ? 0
            : (value / maxValue) * 100;
          const widthPercent = Math.max(Math.min(widthPercentRaw, 100), 0);
          const barColor = getBarColor(row);
          const isSelected = highlightedCombinationId === row.combinationId;
          const displayLabel = shortenLabel(row.displayLabel || row.model);
          const formattedValue = formatMetricValue(row.mean, {
            metadata: metricMeta
          });
          const hasCi = row.ci !== null && row.ci !== undefined && row.ci !== 0;
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
                'group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-transparent bg-white/0 px-3 py-3 text-left transition',
                isSelected
                  ? 'border-slate-300 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm'
                  : 'hover:border-slate-200 hover:bg-slate-50/70'
              )}
            >
              <div className="relative h-8 w-full overflow-hidden rounded-[6px]">
                <div className="absolute inset-0 rounded-[6px] bg-slate-200" />
                <div
                  className={clsx(
                    'absolute inset-0 rounded-[6px] transition-all duration-500 ease-out',
                    isSelected ? 'opacity-100 shadow-inner shadow-slate-900/10' : 'opacity-95'
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
                <span className="text-sm font-semibold text-slate-900">{formattedValue}</span>
                <span className="text-xs text-slate-500">{ciLabel}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
