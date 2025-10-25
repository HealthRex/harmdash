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
      className="flex flex-col gap-6 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-6 shadow-inner sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      style={{ boxShadow: "0 18px 45px -20px rgba(14, 165, 233, 0.4)" }}
    >
      <div className="space-y-2 text-center sm:max-w-3xl sm:text-left">
        <h2 className="text-xl font-semibold text-slate-900">
          First, Do NOHARM: Interactive AI Benchmark Leaderboard
        </h2>
        <p className="text-sm text-slate-600">
          Visualize how leading AI models perform in the NOHARM medical AI benchmark.
        </p>
      </div>
      <dl className="grid w-full gap-3 text-sm sm:w-auto sm:grid-cols-3 sm:gap-6">
        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Models
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
