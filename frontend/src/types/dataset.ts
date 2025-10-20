export interface DataRow {
  model: string;
  role: string;
  condition: string;
  harm: string;
  metric: string;
  trials: number | null;
  mean: number | null;
  sd: number | null;
  se: number | null;
  ci: number | null;
  order1: number | null;
  order2: number | null;
  format: string | null;
  cases: string | null;
  grading: string | null;
  type: string | null;
  label: string | null;
  displayLabel: string;
  combinationId: string;
  colorKey: string;
}

export interface DatasetArtifact {
  generatedAt: string;
  rows: DataRow[];
}

export interface MetricConfig {
  id: string;
  label: string;
  description: string;
  higherIsBetter: boolean;
  format: (value: number) => string;
}

export interface CombinationEntry {
  combinationId: string;
  model: string;
  role: string;
  condition: string;
  harm: string;
  cases: string | null;
  grading: string | null;
  type: string | null;
  displayLabel: string;
  metrics: Record<string, DataRow>;
}
