
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { csvParse } from "d3-dsv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const METRICS_CSV_PATH = path.resolve(ROOT, "..", "data", "metrics.csv");
const METADATA_CSV_PATH = path.resolve(ROOT, "..", "data", "metadata.csv");
const OUTPUT_DIR = path.resolve(ROOT, "public", "data");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "ai-harm-summary.json");

const numericFields = [
  "trials",
  "mean",
  "sd",
  "se",
  "ci",
  "order1",
  "order2"
];

const nullableStringFields = ["Format", "Cases", "Grading", "Type", "Label"];

const metricsSchema = z.object({
  Model: z.string().min(1),
  Role: z.string().optional().default(""),
  Condition: z.string().optional().default(""),
  Harm: z.string().optional().default(""),
  Metric: z.string().min(1),
  trials: z.number().nullable(),
  mean: z.number().nullable(),
  sd: z.number().nullable(),
  se: z.number().nullable(),
  ci: z.number().nullable(),
  order1: z.number().nullable(),
  order2: z.number().nullable(),
  Format: z.string().nullable().optional().default(null),
  Cases: z.string().nullable().optional().default(null),
  Grading: z.string().nullable().optional().default(null),
  Type: z.string().nullable().optional().default(null),
  Label: z.string().nullable().optional().default(null)
});

const metadataSchema = z.object({
  Order: z.coerce.number(),
  Metric: z.string().min(1),
  Include: z.string().optional().transform((value) =>
    typeof value === "string" ? value.trim().toLowerCase() === "true" : true
  ),
  Range: z.string().optional().transform((value) =>
    value ? value.trim().toLowerCase() : "absolute"
  ),
  Display: z.string().min(1),
  Description: z.string().optional().default("")
});

function parseNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (value === "" || value === "NA") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanString(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.toLowerCase() === "na") {
    return null;
  }
  return trimmed;
}

function sanitizeLabel(raw) {
  if (!raw) {
    return null;
  }
  return raw.replace(/<[^>]+>/g, "").trim() || null;
}

function getCombinationId(row) {
  return [
    row.Model,
    row.Role ?? "",
    row.Condition ?? "",
    row.Harm ?? "",
    row.Type ?? "",
    row.Cases ?? "",
    row.Grading ?? ""
  ].join("::");
}

async function loadCsv(filePath) {
  const csvText = await readFile(filePath, "utf8");
  return csvParse(csvText);
}

async function main() {
  const [rawMetricRows, rawMetadataRows] = await Promise.all([
    loadCsv(METRICS_CSV_PATH),
    loadCsv(METADATA_CSV_PATH)
  ]);

  const metadata = rawMetadataRows
    .map((row) => metadataSchema.parse(row))
    .map((entry) => ({
      id: entry.Metric,
      order: entry.Order,
      range: entry.Range === "percent" ? "percent" : "absolute",
      displayLabel: entry.Display,
      description: entry.Description,
      include: entry.Include
    }))
    .filter((entry) => entry.include)
    .sort((a, b) => a.order - b.order);

  const includedMetricIds = new Set(metadata.map((entry) => entry.id));

  const normalizedRows = rawMetricRows
    .filter((row) => includedMetricIds.has(row.Metric))
    .filter((row) => {
      if (
        ["Accuracy", "Safety"].includes(row.Metric) &&
        ["Random Intervention", "No Intervention"].includes(row.Model)
      ) {
        return false;
      }
      return true;
    })
    .map((row) => {
      const enriched = { ...row };

      numericFields.forEach((field) => {
        enriched[field] = parseNumber(row[field]);
      });

      nullableStringFields.forEach((field) => {
        enriched[field] = cleanString(row[field]);
      });

      enriched.Role = cleanString(row.Role) ?? "";
      enriched.Condition = cleanString(row.Condition) ?? "";
      enriched.Harm = cleanString(row.Harm) ?? "";

      const parsed = metricsSchema.parse({
        ...enriched,
        Label: enriched.Label
      });

      const displayLabel = sanitizeLabel(parsed.Label) ?? parsed.Model;
      const colorKey =
        parsed.Condition && parsed.Condition !== ""
          ? parsed.Condition
          : parsed.Role || "default";

      return {
        model: parsed.Model,
        role: parsed.Role,
        condition: parsed.Condition,
        harm: parsed.Harm,
        metric: parsed.Metric,
        trials: parsed.trials,
        mean: parsed.mean,
        sd: parsed.sd,
        se: parsed.se,
        ci: parsed.ci,
        order1: parsed.order1,
        order2: parsed.order2,
        format: parsed.Format,
        cases: parsed.Cases,
        grading: parsed.Grading,
        type: parsed.Type,
        label: parsed.Label,
        displayLabel,
        combinationId: getCombinationId(parsed),
        colorKey
      };
    });

  await mkdir(OUTPUT_DIR, { recursive: true });
  const artifact = {
    generatedAt: new Date().toISOString(),
    rows: normalizedRows,
    metadata
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(artifact, null, 2));
  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${normalizedRows.length} rows to ${path.relative(
      ROOT,
      OUTPUT_PATH
    )}`
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to build dataset artifact:", error);
  process.exit(1);
});
