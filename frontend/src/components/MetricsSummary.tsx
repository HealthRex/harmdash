'use client';

import type { DatasetArtifact } from "@/types/dataset";
import { getDatasetSummary } from "@/utils/data";

interface MetricsSummaryProps {
  dataset: DatasetArtifact;
}

export function MetricsSummary({ dataset }: MetricsSummaryProps) {
  const summary = getDatasetSummary(dataset);

  return (
    <section className="flex flex-col gap-6 rounded-xl bg-white px-6 py-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2">
        <h2 className="text-[15px] font-medium text-[#0c0d10]">
          Do NOHARM: Interactive AI Benchmark Leaderboard
        </h2>
        <p className="text-[14px] text-neutral-600">
          Visualize how leading AI models perform in the NOHARM medical AI benchmark.
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-8 text-center">
        <div className="flex flex-col gap-1">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Models & Teams</dt>
          <dd className="text-[32px] font-semibold leading-none text-[#0c0d10]">{summary.totalModels}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Metrics</dt>
          <dd className="text-[32px] font-semibold leading-none text-[#0c0d10]">{summary.totalMetrics}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Data Points</dt>
          <dd className="text-[32px] font-semibold leading-none text-[#0c0d10]">{summary.totalRows}</dd>
        </div>
      </dl>
    </section>
  );
}
