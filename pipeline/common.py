"""Shared configuration and helpers for the climate shelters data pipeline."""

import json
import pathlib
import time

import requests

PIPELINE_DIR = pathlib.Path(__file__).resolve().parent
RAW_DIR = PIPELINE_DIR / "raw"
DETAIL_PAGES_DIR = RAW_DIR / "detail_pages"
DATA_DIR = PIPELINE_DIR.parent / "data"

CKAN_RESOURCE_ID = "7ecae024-6cb2-427d-b2d0-e170500e2a38"
CKAN_JSON_RESOURCE_ID = "d88129fe-7aaa-4ae6-b9fd-908ad3f7480d"
CKAN_DATASTORE_SEARCH_URL = "https://opendata-ajuntament.barcelona.cat/data/api/action/datastore_search"
CKAN_JSON_DOWNLOAD_URL = (
    "https://opendata-ajuntament.barcelona.cat/data/dataset/xarxa-refugis-climatics"
    f"/resource/{CKAN_JSON_RESOURCE_ID}/download/opendatabcn_NP-NASIA_xarxa-refugis-climatics-js.json"
)
# When datastore_search returns fewer records than this, assume the indexed
# API is out of sync and fall back to the full JSON resource download.
CKAN_DATASTORE_MIN_RECORDS = 100

GUIA_BASE_URL = "https://www.barcelona.cat/barcelona-pel-clima/es/api/guia/filter/node/146"
GUIA_SHOW_MORE_URL = "https://www.barcelona.cat/barcelona-pel-clima/es/api/guia/show_more/node/146"
GUIA_BASE_CATEGORY_CODE = "0000148414647"
SITE_BASE_URL = "https://www.barcelona.cat"

# Typology filter codes scraped from the "Tipologías" facet on the public
# listing page (https://www.barcelona.cat/.../listado-refugios).
TYPOLOGY_CODES = {
    "148414758": "Bibliotecas",
    "148414760": "Centros comerciales",
    "148414759": "Centros de culto",
    "148414762": "Complejos deportivos",
    "148414761": "Entidades culturales",
    "148414763": "Equipamientos ambientales",
    "148414764": "Equipos de proximidad",
    "148414794": "Espacios de juegos con agua",
    "148414767": "Interiores de manzana",
    "148414768": "Mercados",
    "148414769": "Museos",
    "148414770": "Oficinas",
    "148414771": "Parques y jardines",
    "148414766": "Patios de guarderías",
    "148414765": "Patios de escuelas",
    "148414772": "Piscinas",
    "148414773": "Universidades",
    "148414839": "Microrefugis",
    "148414774": "Otro(s)",
}

# Derived access characteristics (not scraped from CMS). All shelters in the
# network are free except swimming pools — per the official site.
FREE_ACCESS_CHARACTERISTIC = "Acceso gratuito"
PAID_ACCESS_CHARACTERISTIC = "Acceso de pago"
PAID_ACCESS_TYPOLOGIES = {"Piscinas"}


def enrich_characteristics(typology, characteristics):
    """Append access pricing based on typology, stripping any prior value."""
    chars = [
        c
        for c in (characteristics or [])
        if c not in (FREE_ACCESS_CHARACTERISTIC, PAID_ACCESS_CHARACTERISTIC)
    ]
    if typology in PAID_ACCESS_TYPOLOGIES:
        return [PAID_ACCESS_CHARACTERISTIC, *chars]
    return [*chars, FREE_ACCESS_CHARACTERISTIC]


REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; refugisclimatics-pipeline/1.0; +https://github.com/)",
}

# Seconds to wait between requests to barcelona.cat, to be polite to a
# public-sector site that has no documented rate limit for this internal API.
REQUEST_DELAY_SECONDS = 0.3


def get_json(url, params=None):
    response = requests.get(url, params=params, headers=REQUEST_HEADERS, timeout=30)
    response.raise_for_status()
    return response.json()


def get_text(url, params=None):
    response = requests.get(url, params=params, headers=REQUEST_HEADERS, timeout=30)
    response.raise_for_status()
    time.sleep(REQUEST_DELAY_SECONDS)
    return response.text


def get_html_fragment(url, params=None):
    """The barcelona.cat "guia" API returns its HTML fragment as a JSON
    string (xout=json2), so it needs a JSON decode, not a plain text read,
    to get back real HTML with unescaped characters."""
    response = requests.get(url, params=params, headers=REQUEST_HEADERS, timeout=30)
    response.raise_for_status()
    time.sleep(REQUEST_DELAY_SECONDS)
    return response.json()


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def read_json_if_exists(path, default=None):
    if not path.exists():
        return default if default is not None else {}
    return read_json(path)


def load_env():
    """Load pipeline/.env if present (gitignored)."""
    env_path = PIPELINE_DIR / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        import os
        os.environ.setdefault(key.strip(), value.strip())


def google_geocoding_api_key():
    import os
    load_env()
    return os.environ.get("GOOGLE_GEOCODING_API_KEY") or None


def normalize_join_key(name, street, number):
    """Build a normalized key for joining CKAN records with CMS records,
    since the two systems use unrelated numbering schemes for the same
    physical shelters."""
    raw = f"{name} {street} {number or ''}"
    raw = raw.lower()
    replacements = {
        "à": "a", "á": "a", "è": "e", "é": "e", "ì": "i", "í": "i",
        "ò": "o", "ó": "o", "ù": "u", "ú": "u", "ï": "i", "ü": "u",
        "ç": "c", "'": " ", "-": " ", "–": " ", ".": " ",
    }
    for src, dst in replacements.items():
        raw = raw.replace(src, dst)
    normalized = "".join(ch if ch.isalnum() else " " for ch in raw)
    return " ".join(normalized.split())
