# dashi

Open-source BI in your browser. Connect data, shape it with visual workflows, and pin the
results to dashboards — powered by [DuckDB](https://duckdb.org) running locally via WASM,
with a desktop-like multi-window UI built on SvelteKit + Svelte 5.

## Features

### Data connections

- **Files**: CSV, Excel, Parquet, JSON/NDJSON — loaded into in-browser DuckDB, nothing is uploaded.
- **Remote files (URL)**: point at any https CSV/Parquet/JSON file; DuckDB reads it directly.
- **Databases** (via the server proxy): Postgres, MySQL, SQLite, DuckDB database files.
- SQL editor (Data Studio) with schema tree, history, and local + remote targets.

### Workflows (visual ETL)

- Node-based editor: table/SQL sources → transforms → chart/table/metric/pivot outputs.
- Transforms: filter, select, formula, aggregate (count, distinct, sum, avg, min, max,
  median, stddev), join, union, sort, limit, **pivot, unpivot, window (running totals,
  moving averages, % change, lag/lead, rank), dedupe, sample, cast, rename**.
- **Workflow parameters**: define `{{name}}` values once, reference them in SQL, formulas
  and filter values.
- **AI assistant**: describe what you want in plain language; a schema-aware prompt against
  any OpenAI-compatible endpoint (including local Ollama) generates an editable SQL node.
- Download any node's full result as CSV or JSON.

### Charts & visualization

- 15 chart types: line, bar, horizontal/stacked/grouped bar, area, scatter, pie, donut,
  histogram, heatmap, funnel, waterfall, gauge, treemap.
- Number formatting everywhere: currency, percent, compact, fixed decimals.
- Interactive pivot table output with row/column dimensions, aggregations and totals.
- Sortable, exportable data tables.

### Dashboards

- Grid + freeform layouts, themes, shapes/text widgets, presentation mode, mobile preview.
- **Cross-filtering**: click a bar, funnel stage, treemap tile, heatmap cell or table cell
  and every widget sharing that column filters; active filters show as removable chips.
- **Filter widgets**: dropdown, multi-select, search, number range, date range controls.
- **Drill-down**: give a chart a dimension hierarchy and click to descend, with breadcrumbs.
- **Metric alerts**: threshold rules highlight the metric and raise a notification.
- **Auto-refresh** per widget, undo/redo (⌘Z / ⇧⌘Z), and exports: chart PNG/SVG,
  self-contained static HTML snapshot of the whole dashboard, print/PDF, and portable
  `.dashi` workspace files.

### Reports

- Notebook-style documents mixing markdown cells with live SQL cells (tables and charts),
  exportable as standalone HTML.

## Developing

```sh
bun install
bun run dev
```

## Building

```sh
bun run build
bun run preview
```

## Testing

```sh
bun run test:unit   # vitest
bun run test:e2e    # playwright
```
