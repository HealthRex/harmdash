'use client';

import type { DatasetArtifact } from "@/types/dataset";
import { getDatasetSummary } from "@/utils/data";

interface MetricsSummaryProps {
  dataset: DatasetArtifact;
}

export function MetricsSummary({ dataset }: MetricsSummaryProps) {
  const summary = getDatasetSummary(dataset);

  return (
    <section
      className="flex flex-col gap-6 rounded-2xl border border-sky-200 bg-white p-6 shadow-lg shadow-slate-200 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
    >
      <div className="space-y-2 text-center sm:max-w-3xl sm:text-left">
        <h2 className="text-xl font-semibold text-slate-900">
          First, Do NOHARM AI Benchmark & Leaderboard
        </h2>
        <p className="text-sm text-slate-600">
          Numerous Options Harm Assessment of Risk in Medicine: a benchmark for medical benefit & harm
        </p>
      </div>
      <dl className="grid w-full gap-3 text-sm sm:w-auto sm:grid-cols-3 sm:gap-6">
        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Models & Teams
          </dt>
          <dd className="text-2xl font-semibold text-sky-600">
            {summary.totalModels}
          </dd>
        </div>
        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Metrics
          </dt>
          <dd className="text-2xl font-semibold text-sky-600">
            {summary.totalMetrics}
          </dd>
        </div>
        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Data Points
          </dt>
          <dd className="text-2xl font-semibold text-sky-600">
            {summary.totalRows}
          </dd>
        </div>
      </dl>
    </section>
  );
}
