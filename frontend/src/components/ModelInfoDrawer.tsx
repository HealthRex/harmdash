'use client';

import type { CombinationEntry, MetricMetadata } from "@/types/dataset";
import clsx from "clsx";
import { formatMetricValue } from "@/utils/data";

interface ModelInfoDrawerProps {
  selection: CombinationEntry | null;
  onClear: () => void;
  metrics: MetricMetadata[];
}

export function ModelInfoDrawer({
  selection,
  onClear,
  metrics
}: ModelInfoDrawerProps) {
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
              <dt className="font-medium text-slate-500">Role</dt>
              <dd>{selection.role || "NA"}</dd>
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
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">
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
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          Interact with the charts to surface a model&apos;s full profile here.
        </div>
      )}
    </aside>
  );
}
