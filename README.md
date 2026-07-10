# Refugis Climàtics

A map and list of Barcelona's climate shelter network ("refugis climàtics") — public spaces where people can shelter from heat or cold.

Official source: [barcelona.cat — Red de refugios climáticos](https://www.barcelona.cat/barcelona-pel-clima/es/acciones-concretas/red-de-refugios-climaticos)

## App

React + Vite + Mapbox. Reads the static dataset at build time.

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Data pipeline

The dataset in `data/shelters.json` is produced by `pipeline/` — see [pipeline/README.md](pipeline/README.md). Re-run when barcelona.cat or the open-data feed updates:

```bash
cd pipeline
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python stage1_ckan.py
.venv/bin/python stage2_typology.py
.venv/bin/python stage3_fetch_details.py   # slow first run (~7 min)
.venv/bin/python stage4_parse_details.py
.venv/bin/python stage5_join.py
.venv/bin/python stage6_geocode.py         # needs pipeline/.env for Google Geocoding
```

For geocoding, copy `pipeline/.env.example` to `pipeline/.env` and set `GOOGLE_GEOCODING_API_KEY`. Manual coordinate fixes go in `data/geocode_overrides.json`.

## Project docs

- [AGENTS.md](AGENTS.md) — context for AI assistants and contributors
- [data/unmatched.json](data/unmatched.json) — shelters without CKAN enrichment
