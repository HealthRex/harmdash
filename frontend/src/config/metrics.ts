import type { MetricConfig } from "@/types/dataset";

const formatter =
  (digits = 2, suffix = "") =>
  (value: number) =>
    Number.isFinite(value)
      ? `${value.toFixed(digits)}${suffix}`
      : "NA";

export const metricsConfig: MetricConfig[] = [
  {
    id: "Accuracy",
    label: "Accuracy",
    description:
      "Overall accuracy across adjudicated medical recommendation cases.",
    higherIsBetter: true,
    format: formatter(2, "%")
  },
  {
    id: "Safety",
    label: "Safety",
    description:
      "Safety compliance score capturing adherence to given harm policies.",
    higherIsBetter: true,
    format: formatter(2, "%")
  },
  {
    id: "Referral Rate",
    label: "Referral Rate",
    description:
      "Rate at which models escalate cases to human review or higher-level care.",
    higherIsBetter: true,
    format: formatter(2, "%")
  },
  {
    id: "Emergency Rate",
    label: "Emergency Referral Rate",
    description: "Likelihood of recommending emergency escalation.",
    higherIsBetter: true,
    format: formatter(2, "%")
  },
  {
    id: "pct",
    label: "Harm Percentile",
    description:
      "Percentile ranking for harm-related events normalized within benchmark.",
    higherIsBetter: false,
    format: formatter(1, "%")
  },
  {
    id: "pct_cumulative",
    label: "Cumulative Harm Percentile",
    description:
      "Cumulative percentile ranking for aggregated harm across benchmarks.",
    higherIsBetter: false,
    format: formatter(1, "%")
  },
  {
    id: "normalized",
    label: "Normalized Score",
    description:
      "Normalized harm score for cross-benchmark comparison (lower is safer).",
    higherIsBetter: false,
    format: formatter(3)
  },
  {
    id: "normalized_cumulative",
    label: "Cumulative Normalized Score",
    description:
      "Cumulative normalized harm score aggregated across tasks (lower is safer).",
    higherIsBetter: false,
    format: formatter(3)
  },
  {
    id: "nnh",
    label: "Number Needed to Harm",
    description:
      "Estimated number of cases before causing harm (higher means safer).",
    higherIsBetter: true,
    format: (value: number) =>
      Number.isFinite(value) ? value.toFixed(1) : "NA"
  },
  {
    id: "nnh_cumulative",
    label: "Cumulative Number Needed to Harm",
    description:
      "Cumulative estimate of cases before causing harm (higher means safer).",
    higherIsBetter: true,
    format: (value: number) =>
      Number.isFinite(value) ? value.toFixed(1) : "NA"
  }
];

export const metricsById = metricsConfig.reduce<Record<string, MetricConfig>>(
  (acc, metric) => {
    acc[metric.id] = metric;
    return acc;
  },
  {}
);
