# Harmdash Project Snapshot

### Purpose  
Interactive dashboard that benchmarks harm-related outcomes in medical AI recommendation systems. The app ingests curated CSVs, normalizes them into a JSON artifact, and visualizes model performance across multiple safety- and efficacy-focused metrics.

### Repository Layout  
```
root/
├─ data/                 Raw CSV exports (metrics & metadata)
├─ frontend/             Next.js 14.2.5 application (TypeScript)
│  ├─ public/data/       Generated JSON artifact (`ai-harm-summary.json`)
│  ├─ scripts/           build-data.mjs (CSV → JSON pipeline)
│  └─ src/               Application code (components, utils, config)
├─ src/                  (Reserved for backend/CLI utilities – currently empty)
└─ render.yaml           Render.com deployment blueprint
```

### Data Pipeline  
* **Source files:** `data/metrics.csv`, `data/metadata.csv`  
* **Builder:** `frontend/scripts/build-data.mjs` (runs via `npm run prepare-data`, `npm run dev`, and `npm run build`)  
* **Processing highlights:**  
  - Zod validation + type coercion for numeric fields  
  - Team/condition normalization, HTML label stripping  
  - Filters out baseline rows (e.g., Random/No Intervention for Accuracy/Safety)  
  - Produces `public/data/ai-harm-summary.json` with `rows`, `metadata`, and compliant color keys  

### Frontend Stack & Tooling  
* **Framework:** Next.js 14.2.5 (App Router, use client components for charts)  
* **Language:** TypeScript  
* **Styling:** Tailwind CSS + clsx  
* **Charts:** `react-plotly.js` (Bar + Scatter visualizations with CI overlays)  
* **Testing:** Vitest (`npm run test` → `frontend/src/utils/data.test.ts`)  
* **Linting:** ESLint / TypeScript (`npm run lint`)  
* **Build targets:** `npm run dev`, `npm run build`, `npm run start`

### Core UI Architecture (`frontend/src/components`)  
* `Dashboard` – central state owner; loads dataset, derives color maps, manages selections (team-condition coupling, cases, trials threshold).  
* `FiltersPanel` – stacked “Team & Conditions” cards with dependency logic for each team size; Harm severity, Cases, and Trials controls. Human/Control are implicitly included.  
* `BarChartCard` – splits results into Top/Bottom performers (5 each by default), using normalized colors to mirror filter selections; bars display mean, CI, and model label.  
* `ScatterChartCard` – plots combinations by selected metrics, grouped and colored by team, with hover details + CI whiskers.  
* `MetricsSummary` – quick stats (models, metrics, total rows).  
* `ModelInfoDrawer` – detailed metrics per selection with radar chart (0–1 normalized scores).  

### Key Behaviors & Constraints  
* Team filters dictate which condition pills are visible; condition toggles cannot be active unless their parent team is enabled.  
* Conditions “Human” and “Control” are always included by design.  
* Filters apply minimum trials threshold (default 5, floor 1) and case scope (All vs Human subset).  
* Visuals pull all labels, descriptions, and ranges from `metadata.csv` to ensure consistency.  
* Color system lives in `frontend/src/config/colors.ts`; `conditionColorMap` generated at runtime keeps filter chips and chart bars aligned.  

### Dev & Deployment Notes  
* Run `npm run prepare-data` whenever CSV inputs change.  
* Development (`npm run dev`) rebuilds the JSON artifact on start and watches for frontend changes.  
* Production build (`npm run build`) regenerates data, compiles Next.js app, suitable for Render.com deployment via `render.yaml`.  
* No backend services are currently bundled; API keys are not required for local dashboard usage.  

Use this document as a quick orientation for agents needing to extend visuals, adjust metrics, or update the data transformation pipeline.***
