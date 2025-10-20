import type {
  CombinationEntry,
  DataRow,
  DatasetArtifact,
  MetricConfig
} from "@/types/dataset";

export function groupRowsByCombination(
  rows: DataRow[]
): CombinationEntry[] {
  const map = new Map<string, CombinationEntry>();
  const baseMap = new Map<string, CombinationEntry[]>();
  const generalMetrics = new Map<string, Record<string, DataRow>>();

  const getBaseKey = (row: DataRow) =>
    [
      row.model,
      row.role,
      row.condition,
      row.type ?? "",
      row.cases ?? "",
      row.grading ?? ""
    ].join("::");

  rows.forEach((row) => {
    const existing = map.get(row.combinationId);
    let entry: CombinationEntry;
    if (existing) {
      existing.metrics[row.metric] = row;
      entry = existing;
    } else {
      entry = {
        combinationId: row.combinationId,
        model: row.model,
        role: row.role,
        condition: row.condition,
        harm: row.harm,
        cases: row.cases,
        grading: row.grading,
        type: row.type,
        displayLabel: row.displayLabel,
        metrics: {
          [row.metric]: row
        }
      };
      map.set(row.combinationId, entry);
    }

    const baseKey = getBaseKey(row);
    const siblings = baseMap.get(baseKey);
    if (siblings) {
      if (!siblings.includes(entry)) {
        siblings.push(entry);
      }
    } else {
      baseMap.set(baseKey, [entry]);
    }

    const general = generalMetrics.get(baseKey);
    if (!row.harm) {
      const updatedGeneral = general ?? {};
      updatedGeneral[row.metric] = row;
      generalMetrics.set(baseKey, updatedGeneral);
      baseMap.get(baseKey)?.forEach((target) => {
        target.metrics[row.metric] = row;
      });
    } else if (general) {
      Object.entries(general).forEach(([metricId, metricRow]) => {
        if (!entry.metrics[metricId]) {
          entry.metrics[metricId] = metricRow;
        }
      });
    }
  });

  return Array.from(map.values());
}

export function pickRowsForMetric(
  rows: DataRow[],
  metricId: string
): DataRow[] {
  return rows.filter(
    (row) => row.metric === metricId && row.mean !== null
  );
}

export function sortRowsForMetric(
  rows: DataRow[],
  higherIsBetter: boolean,
  maxItems?: number
): DataRow[] {
  const sorted = [...rows].sort((a, b) => {
    const aMean = a.mean ?? Number.NEGATIVE_INFINITY;
    const bMean = b.mean ?? Number.NEGATIVE_INFINITY;
    return higherIsBetter ? bMean - aMean : aMean - bMean;
  });

  return typeof maxItems === "number" ? sorted.slice(0, maxItems) : sorted;
}

export function getDatasetSummary(dataset: DatasetArtifact) {
  const metrics = new Set<string>();
  const models = new Set<string>();

  dataset.rows.forEach((row) => {
    metrics.add(row.metric);
    models.add(row.model);
  });

  return {
    totalRows: dataset.rows.length,
    totalMetrics: metrics.size,
    totalModels: models.size
  };
}

export function sanitizeLabel(raw: string | null): string {
  if (!raw) {
    return "";
  }
  return raw.replace(/<[^>]+>/g, "").trim();
}

export function formatMetricValue(
  value: number | null | undefined,
  metric?: MetricConfig
): string {
  if (value === null || value === undefined) {
    return "NA";
  }
  if (metric) {
    return metric.format(value);
  }
  return Number.isFinite(value) ? value.toFixed(2) : "NA";
}
