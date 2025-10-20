## Harmdash

This repository hosts the Harmdash project: an interactive dashboard that benchmarks harm-related outcomes in medical AI recommendation systems.

- `data/` — Source CSVs with benchmark summaries.
- `frontend/` — Next.js dashboard (see `frontend/README.md` for usage).
- `render.yaml` — Render.com blueprint for deploying the dashboard.

### Quickstart

```bash
cd frontend
npm install
npm run dev
```

The dev script rebuilds the JSON artifact from `data/data_summary_subset.csv` and launches the interactive dashboard at `http://localhost:3000`.
- Bar and scatter visuals share a cohesive palette: deep navy, lilac indigo, warm coral, emerald, muted gold, and violet accents to distinguish conditions and roles.