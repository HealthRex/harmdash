import { describe, expect, it } from "vitest";
import type { DataRow, MetricConfig } from "@/types/dataset";
import {
  formatMetricValue,
  groupRowsByCombination,
  sanitizeLabel
} from "@/utils/data";

describe("sanitizeLabel", () => {
  it("removes HTML tags", () => {
    expect(sanitizeLabel("<span>Example</span>")).toBe("Example");
  });

  it("returns empty string when null", () => {
    expect(sanitizeLabel(null)).toBe("");
  });
});

describe("formatMetricValue", () => {
  const metric: MetricConfig = {
    id: "Accuracy",
    label: "Accuracy",
    description: "Test metric",
    higherIsBetter: true,
    format: (value: number) => `${value.toFixed(1)}%`
  };

  it("formats using metric config", () => {
    expect(formatMetricValue(87.456, metric)).toBe("87.5%");
  });

  it("returns NA for null values", () => {
    expect(formatMetricValue(null, metric)).toBe("NA");
  });

  it("falls back to default formatting without metric", () => {
    expect(formatMetricValue(3.14159, undefined)).toBe("3.14");
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
