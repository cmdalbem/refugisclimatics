# Project context: Refugis Climàtics

Read this before working on this repo.

## What this is

A map/app of Barcelona's "climate shelters" (refugis climàtics) — public
spaces (libraries, parks, pools, school patios, microrefugios, etc.) where
people can shelter from heat or cold. Official site:
https://www.barcelona.cat/barcelona-pel-clima/es/acciones-concretas/red-de-refugios-climaticos

## Current state

- `pipeline/` — a data-extraction pipeline, already built and run once.
  See `pipeline/README.md` for how it works and how to re-run it.
- `data/shelters.json` — the canonical, committed dataset the pipeline
  produced. `data/unmatched.json` lists known gaps/edge cases.
- The actual map/list app has not been started yet (tech stack undecided).

## Data we have per shelter (`data/shelters.json`)

- Identity/location: `name`, `address`, `district`, `neighborhood`, `lat`/`lon`
- Categorization: `typology` (library, park, pool, school patio, ...),
  `characteristics` (wifi, accessible, pet-friendly, water, toilet, indoor/outdoor)
- Hours: `opening_hours_raw` (structured rows), `timetable_raw` (CKAN's raw text), `notice` (temporary closures etc.)
- Contact: `contact_type`/`contact_value` (e.g. email or phone)
- Media: `image_url` (only ~53% of shelters have one)
- Provenance: `detail_url`, `register_id`, `match_status` (whether it was
  matched across both data sources or only found in one)

Not all fields are populated for every shelter — see `data/unmatched.json`
for known gaps.

## Key decisions so far

- The official open dataset alone lacks typology/characteristics, so we
  also scrape barcelona.cat's own (undocumented) internal API to fill
  those in. Details are in the pipeline code, not duplicated here.
- The pipeline is a one-time, manually re-run script — not scheduled, not
  wired into the app.
- v1 app is planned to read the static `data/shelters.json` directly,
  filtering client-side — no backend/database yet.

## Design principles (app)

- **Typography**: Climate Crisis variable font for shelter names, YEAR axis
  tied to distance (1990 = legible/clean = close; 2050 = degraded = far).
  Archivo bold for distances and numbers. Helvetica Neue for all body text.
- **Distance color gradient**: blue `#3A84B3` (close) → green `#839C7A` →
  yellow `#C7B640` → orange `#F39619` → red `#E84D26` (far). Applied to
  map markers, list distance labels, and the detail drawer distance.
- **No icons in content areas**: Lucide icons only for interactive controls
  (filter pills, close button). Shelter properties, section labels, and
  detail content use text only.
- **Minimal, editorial aesthetic**: prefer typographic hierarchy and
  whitespace over boxes, borders and labels to create structure. Avoid
  form/database-UI patterns (bordered cards per field, heavy section
  headers, etc.)
- **`.pill` class** for tag-style interactive elements (filter buttons).
  White background, border, shadow; `.active` = dark fill.

## Where to look for more

- `pipeline/README.md` — pipeline stages, data sources, how to re-run.
- `pipeline/*.py` — endpoint URLs, field mappings, join logic.
- `data/unmatched.json` — shelters that didn't cleanly match across sources.
