# Climate shelters data pipeline

One-time (manually re-runnable) pipeline that builds `../data/shelters.json`,
the canonical dataset of Barcelona's climate shelters ("refugis climàtics"),
by combining two sources:

1. The official [Open Data BCN CKAN dataset](https://opendata-ajuntament.barcelona.cat/data/es/dataset/xarxa-refugis-climatics)
   — authoritative geolocation, address, contact info. Scoped to Barcelona
   city only (531 records).
2. barcelona.cat's own internal "guia" API and per-shelter detail pages
   — typology (library, park, mall, ...) and characteristics (wifi,
   accessible, pet-friendly, ...), which aren't in the open dataset. Covers
   564 shelters, including some in neighbouring municipalities.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # optional: Google Geocoding API key for stage 6
```

## Running

Run the stages in order from inside `pipeline/`:

```bash
.venv/bin/python stage1_ckan.py            # -> raw/ckan_shelters.json
```

Stage 1 normally uses the CKAN `datastore_search` API. If that indexed
endpoint returns suspiciously few records (it has dropped to ~30 while the
full dataset still has ~535), it automatically falls back to downloading the
companion JSON resource and normalizing it to the same flat field names.

```bash
.venv/bin/python stage2_typology.py        # -> raw/typology_index.json
.venv/bin/python stage3_fetch_details.py   # -> raw/detail_pages/*.html (slow: ~7 min, one request per shelter)
.venv/bin/python stage4_parse_details.py   # -> raw/parsed_details.json
.venv/bin/python stage5_join.py            # -> ../data/shelters.json, ../data/unmatched.json
.venv/bin/python stage6_geocode.py         # fills missing lat/lon via Google/ICGC + overrides
```

`raw/` is a local, gitignored cache: stage 3 downloads each detail page once
and skips it on subsequent runs, so stages 4–6 can be re-run without
re-hitting the site.

### Stage 5 join tiers

1. Exact normalized name
2. Exact name + district
3. Nearest CKAN point within 30 m
4. Co-located sibling inheritance (sub-venues in the same building)
5. Manual CKAN overrides (`../data/ckan_overrides.json`)

### Stage 6 geocoding

For shelters with an address but no coordinates (broken "Cómo llegar" links
on barcelona.cat), stage 6 tries in order:

1. `../data/geocode_overrides.json` (committed manual fixes)
2. Cached results in `raw/geocode_cache.json`
3. Google Geocoding API (if `GOOGLE_GEOCODING_API_KEY` in `.env`)
4. ICGC geocoder (Catalonia)

Failures are logged to `../data/geocode_failures.json`.

## Periodic refresh

When barcelona.cat adds shelters or the CKAN feed updates:

```bash
.venv/bin/python stage1_ckan.py      # refresh open data
.venv/bin/python stage2_typology.py  # pick up new CMS entries
.venv/bin/python stage3_fetch_details.py
.venv/bin/python stage4_parse_details.py
.venv/bin/python stage5_join.py
.venv/bin/python stage6_geocode.py
```

## Known data gaps (see `../data/unmatched.json`)

- **38 `cms_only` shelters** — no CKAN enrichment. Most are in neighbouring
  municipalities (Sant Adrià, Badalona, l'Hospitalet, Santa Coloma) outside
  the Barcelona CKAN scope. CMS typology, hours, and characteristics still
  apply.
- **11 `colocated`** — sub-venues that inherit CKAN contact/register data
  from a matched sibling at the same coordinates.
- **~47% missing images** — detail pages without gallery photos.
- Manual CKAN matches: add to `../data/ckan_overrides.json` keyed by
  `detail_url` if a shelter should link to a known `register_id`.
