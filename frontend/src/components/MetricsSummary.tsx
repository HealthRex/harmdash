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
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-6 shadow-inner"
      style={{ boxShadow: "0 18px 45px -20px rgba(14, 165, 233, 0.4)" }}
    >
      <div className="max-w-3xl space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">
          First, do NOHARM: Interactive AI Benchmark & Leaderboard
        </h2>
        <p className="text-sm text-slate-600">
          Analyze how leading AI models perform in the NOHARM medical AI benchmark. Select a metric to visualize rankings, compare trade-offs, and inspect the full metric profile.
        </p>
      </div>
      <dl className="flex gap-6 text-center text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Models
          </dt>
          <dd className="text-2xl font-semibold text-sky-600">
            {summary.totalModels}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Metrics
          </dt>
          <dd className="text-2xl font-semibold text-sky-600">
            {summary.totalMetrics}
          </dd>
        </div>
        <div>
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
