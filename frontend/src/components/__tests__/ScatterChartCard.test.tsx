import React from "react";
import { render } from "@testing-library/react";
import type { CombinationEntry, MetricMetadata } from "@/types/dataset";
import { ScatterChartCard } from "../ScatterChartCard";
import { vi, beforeEach, describe, expect, it } from "vitest";

(globalThis as unknown as { React: typeof React }).React = React;

const mockPlot = vi.fn();

vi.mock("@/components/PlotClient", () => ({
  __esModule: true,
  default: (props: any) => {
    mockPlot(props);
    return <div data-testid="mock-plot" />;
  }
}));

const baseMetricMeta: MetricMetadata = {
  id: "Accuracy",
  order: 0,
  radarOrder: 0,
  range: "percent",
  displayLabel: "Accuracy",
  description: "",
  betterDirection: "higher",
  axisMin: 0,
  axisMax: 1,
  includeInRadar: true
};

const safetyMeta: MetricMetadata = {
  ...baseMetricMeta,
  id: "Safety",
  displayLabel: "Safety"
};

const accuracyMeta: MetricMetadata = {
  ...baseMetricMeta,
  id: "Accuracy",
  displayLabel: "Accuracy"
};

function buildEntry(index: number, team = "Solo Models"): CombinationEntry {
  return {
    combinationId: `combo-${team}-${index}`,
    model: `Model ${index}`,
    team,
    condition: "Advisor",
    harm: "",
    cases: null,
    grading: null,
    type: null,
    displayLabel: `Model ${index}`,
    metrics: {
      Safety: {
        model: `Model ${index}`,
        team,
        condition: "Advisor",
        harm: "",
        metric: "Safety",
        trials: 3,
        mean: 0.5 + index * 0.001,
        sd: null,
        se: null,
        ci: null,
        order1: null,
        order2: null,
        format: null,
        cases: null,
        grading: null,
        type: null,
        label: `Model ${index}`,
        displayLabel: `Model ${index}`,
        combinationId: `combo-${team}-${index}`,
        colorKey: "Advisor"
      },
      Accuracy: {
        model: `Model ${index}`,
        team,
        condition: "Advisor",
        harm: "",
        metric: "Accuracy",
        trials: 3,
        mean: 0.4 + index * 0.001,
        sd: null,
        se: null,
        ci: null,
        order1: null,
        order2: null,
        format: null,
        cases: null,
        grading: null,
        type: null,
        label: `Model ${index}`,
        displayLabel: `Model ${index}`,
        combinationId: `combo-${team}-${index}`,
        colorKey: "Advisor"
      }
    }
  };
}

describe("ScatterChartCard trace selection", () => {
  beforeEach(() => {
    mockPlot.mockClear();
  });

  const metrics = [safetyMeta, accuracyMeta];
  const metadataMap = new Map<string, MetricMetadata>([
    ["Safety", safetyMeta],
    ["Accuracy", accuracyMeta]
  ]);

  it("uses scatter traces when the dataset is small", () => {
    const combinations: CombinationEntry[] = [
      buildEntry(0),
      buildEntry(1),
      {
        ...buildEntry(2),
        model: "Human Generalist Physicians",
        displayLabel: "Human Generalist Physicians"
      }
    ];

    render(
      <ScatterChartCard
        combinations={combinations}
        xMetricId="Safety"
        yMetricId="Accuracy"
        onXMetricChange={() => {}}
        onYMetricChange={() => {}}
        metrics={metrics}
        metadataMap={metadataMap}
      />
    );

    const plotArgs = mockPlot.mock.calls.at(-1)?.[0];
    expect(plotArgs).toBeDefined();
    expect(plotArgs.data).toSatisfy((data: any[]) =>
      data.every((trace) => trace.type === "scatter")
    );
  });

  it("switches to scattergl when there are many points", () => {
    const combinations: CombinationEntry[] = [];
    for (let index = 0; index < 220; index += 1) {
      combinations.push(buildEntry(index, "2-Agent Teams"));
    }

    render(
      <ScatterChartCard
        combinations={combinations}
        xMetricId="Safety"
        yMetricId="Accuracy"
        onXMetricChange={() => {}}
        onYMetricChange={() => {}}
        metrics={metrics}
        metadataMap={metadataMap}
      />
    );

    const plotArgs = mockPlot.mock.calls.at(-1)?.[0];
    expect(plotArgs).toBeDefined();
    const nonHumanTrace = (plotArgs.data as any[]).find(
      (trace) => trace.name !== "Human Generalist Physicians"
    );
    expect(nonHumanTrace?.type).toBe("scattergl");
  });

  it("adds a Pearson correlation annotation to the plot", () => {
    const combinations: CombinationEntry[] = [
      buildEntry(0),
      buildEntry(1),
      buildEntry(2)
    ];

    render(
      <ScatterChartCard
        combinations={combinations}
        xMetricId="Safety"
        yMetricId="Accuracy"
        onXMetricChange={() => {}}
        onYMetricChange={() => {}}
        metrics={metrics}
        metadataMap={metadataMap}
      />
    );

    const plotArgs = mockPlot.mock.calls.at(-1)?.[0];
    expect(plotArgs).toBeDefined();
    const annotation = plotArgs.layout.annotations?.[0];
    expect(annotation?.text).toBe("<b>r = 1.00</b>");
    expect(annotation?.x).toBeCloseTo(0.08);
    expect(annotation?.y).toBeCloseTo(0.08);
    expect(annotation?.xanchor).toBe("left");
    expect(annotation?.yanchor).toBe("bottom");
  });
});
