import { describe, expect, it } from "vitest";
import type { DataRow } from "@/types/dataset";
import {
  formatMetricValue,
  groupRowsByCombination,
  sanitizeLabel
} from "@/utils/data";
import type { MetricMetadata } from "@/types/dataset";

describe("sanitizeLabel", () => {
  it("removes HTML tags", () => {
    expect(sanitizeLabel("<span>Example</span>")).toBe("Example");
  });

  it("returns empty string when null", () => {
    expect(sanitizeLabel(null)).toBe("");
  });
});

describe("formatMetricValue", () => {
  const percentMeta: MetricMetadata = {
    id: "percentMetric",
    order: 1,
    range: "percent",
    displayLabel: "Percent Metric",
    description: "A percent metric"
  };

  const absoluteMeta: MetricMetadata = {
    id: "absoluteMetric",
    order: 2,
    range: "absolute",
    displayLabel: "Absolute Metric",
    description: "An absolute metric"
  };

  it("formats percent metrics with a percent sign", () => {
    expect(
      formatMetricValue(0.87456, { metadata: percentMeta, digits: 1 })
    ).toBe("87.5%");
  });

  it("formats absolute metrics with default digits", () => {
    expect(formatMetricValue(3.14159, { metadata: absoluteMeta })).toBe("3.14");
  });

  it("returns NA for null values", () => {
    expect(formatMetricValue(null)).toBe("NA");
  });

  it("omits the percent symbol when requested", () => {
    expect(
      formatMetricValue(0.5, {
        metadata: percentMeta,
        includeSymbol: false
      })
    ).toBe("50.0");
  });
});

describe("groupRowsByCombination", () => {
  const baseRows: DataRow[] = [
    {
      model: "Model A",
      role: "Agent",
      condition: "Solo",
      harm: "All",
      metric: "Accuracy",
      trials: 10,
      mean: 90,
      sd: null,
      se: null,
      ci: null,
      order1: null,
      order2: null,
      format: null,
      cases: "HumanCases",
      grading: "Unanimous",
      type: "AllHarm",
      label: null,
      displayLabel: "Model A",
      combinationId: "Model A::Agent::Solo::All::AllHarm::HumanCases::Unanimous"
    },
    {
      model: "Model A",
      role: "Agent",
      condition: "Solo",
      harm: "All",
      metric: "Safety",
      trials: 10,
      mean: 95,
      sd: null,
      se: null,
      ci: null,
      order1: null,
      order2: null,
      format: null,
      cases: "HumanCases",
      grading: "Unanimous",
      type: "AllHarm",
      label: null,
      displayLabel: "Model A",
      combinationId: "Model A::Agent::Solo::All::AllHarm::HumanCases::Unanimous"
    }
  ];

  it("groups rows under the same combination id", () => {
    const rows = [...baseRows];
    const grouped = groupRowsByCombination(rows);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].metrics.Accuracy.mean).toBe(90);
    expect(grouped[0].metrics.Safety.mean).toBe(95);
  });

  it("shares harm-agnostic metrics across harm-scoped combinations", () => {
    const rows: DataRow[] = [
      {
        model: "Model B",
        role: "Agent",
        condition: "Guardian",
        harm: "",
        metric: "Accuracy",
        trials: 10,
        mean: 85,
        sd: null,
        se: null,
        ci: null,
        order1: null,
        order2: null,
        format: null,
        cases: "AllCases",
        grading: "Unanimous",
        type: "AllHarm",
        label: null,
        displayLabel: "Model B",
        combinationId: "Model B::Agent::Guardian::::AllHarm::AllCases::Unanimous"
      },
      {
        model: "Model B",
        role: "Agent",
        condition: "Guardian",
        harm: "Severe",
        metric: "normalized",
        trials: 10,
        mean: 20,
        sd: null,
        se: null,
        ci: null,
        order1: null,
        order2: null,
        format: null,
        cases: "AllCases",
        grading: "Unanimous",
        type: "AllHarm",
        label: null,
        displayLabel: "Model B",
        combinationId:
          "Model B::Agent::Guardian::Severe::AllHarm::AllCases::Unanimous"
      }
    ];

    const grouped = groupRowsByCombination(rows);
    expect(grouped).toHaveLength(2);
    const severeEntry = grouped.find(
      (entry) => entry.harm === "Severe" && entry.condition === "Guardian"
    );
    expect(severeEntry?.metrics.Accuracy?.mean).toBe(85);
  });
});
