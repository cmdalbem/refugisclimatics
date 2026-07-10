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
   563 shelters, including some in neighbouring municipalities.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Running

Run the stages in order from inside `pipeline/`:

```bash
.venv/bin/python stage1_ckan.py            # -> raw/ckan_shelters.json
.venv/bin/python stage2_typology.py        # -> raw/typology_index.json
.venv/bin/python stage3_fetch_details.py   # -> raw/detail_pages/*.html (slow: ~7 min, one request per shelter)
.venv/bin/python stage4_parse_details.py   # -> raw/parsed_details.json
.venv/bin/python stage5_join.py            # -> ../data/shelters.json, ../data/unmatched.json
```

`raw/` is a local, gitignored cache: stage 3 downloads each detail page once
and skips it on subsequent runs, so stages 4-5 can be re-run and iterated on
without re-hitting the site.

## Known data gaps (see `../data/unmatched.json`)

- ~32 shelters have no match because they're outside Barcelona city (Sant
  Adrià de Besòs, Badalona, l'Hospitalet, Santa Coloma) — the CKAN dataset
  only covers Barcelona.
- ~17 more have a district and coordinates from their detail page but no
  direct CKAN match — ~11 of these inherit CKAN data from a co-located
  sibling (same building, different sub-venue); the rest are likely recent
  additions not yet synced into the weekly-updated open dataset.
- For those without coordinates in either source, `lat`/`lon` are `null` in
  `shelters.json` — they still appear in the dataset but can't be placed on
  a map without geocoding their address, which this pipeline doesn't do.
