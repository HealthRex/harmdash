import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { csvParse } from "d3-dsv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.resolve(ROOT, "..", "data", "data_summary_subset.csv");
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

const schema = z.object({
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

async function loadCsv() {
  const csvText = await readFile(CSV_PATH, "utf8");
  const rows = csvParse(csvText);
  return rows;
}

async function main() {
  const rawRows = await loadCsv();
  const normalizedRows = rawRows
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

    const parsed = schema.parse({
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
    rows: normalizedRows
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
