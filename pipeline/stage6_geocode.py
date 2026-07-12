"""Stage 6: geocode shelters that have an address but no coordinates.

Fills lat/lon for shelters whose detail pages lack working comshiva links,
using Google Geocoding (if pipeline/.env key is set), then ICGC, then manual
overrides from data/geocode_overrides.json. Results are cached in
raw/geocode_cache.json.
"""

import time

import requests

from common import (
    DATA_DIR,
    RAW_DIR,
    REQUEST_HEADERS,
    google_geocoding_api_key,
    read_json,
    read_json_if_exists,
    write_json,
)
from stage5_join import build_unmatched_entry

ICGC_URL = "https://eines.icgc.cat/geocodificador/cerca"
GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
GOOGLE_DELAY_SECONDS = 0.1
ICGC_DELAY_SECONDS = 0.25


def infer_municipality(name, address):
    text = f"{name} {address or ''}".lower()
    rules = [
        (("dalt de la vila", "sant adria", "sant adrià", "besòs", "besos"), "Sant Adrià de Besòs"),
        (("santa eul", "santa coloma", "gramenet", "ponent", "generalitat", "victor hugo", "víctor hugo", "muns", "can peixauet", "font de la mina", "molinet", "kursaal", "carmen amaya", "martí i julià", "marti i julia", "josep janes", "janes"), "Santa Coloma de Gramenet"),
        (("hospitalet", "collblanc", "florida", "granvia de l", "albareda", "moreres", "trajana", "planes", "rambleta", "aprestadora", "pere calders", "ernest lluch", "gaiter", "pubilla", "torrassa"), "L'Hospitalet de Llobregat"),
        (("badalona", "can zam", "alhambra"), "Badalona"),
        (("estruch", "pare andreu de palma"), "El Prat de Llobregat"),
    ]
    for patterns, municipality in rules:
        if any(pattern in text for pattern in patterns):
            return municipality
    return None


def build_geocode_queries(shelter, municipality):
    name = shelter.get("name", "")
    address = shelter.get("address", "")
    queries = []
    if name and address and municipality:
        queries.append(f"{name}, {address}, {municipality}")
    if address and municipality:
        queries.append(f"{address}, {municipality}")
    if name and municipality:
        queries.append(f"{name}, {municipality}")
    if address:
        queries.append(f"{address}, Catalunya, Spain")
    return queries


def google_search(query, api_key):
    response = requests.get(
        GOOGLE_GEOCODE_URL,
        params={"address": query, "key": api_key, "region": "es"},
        headers=REQUEST_HEADERS,
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("status") != "OK" or not payload.get("results"):
        return None
    location = payload["results"][0]["geometry"]["location"]
    return float(location["lat"]), float(location["lng"])


def icgc_search(query):
    response = requests.get(
        ICGC_URL,
        params={"text": query, "layers": "address,topo1,topo2", "size": 1},
        headers=REQUEST_HEADERS,
        timeout=30,
    )
    response.raise_for_status()
    features = response.json().get("features", [])
    if not features:
        return None
    lon, lat = features[0]["geometry"]["coordinates"]
    return float(lat), float(lon)


def geocode_shelter(shelter, municipality, google_api_key):
    queries = build_geocode_queries(shelter, municipality)

    if google_api_key:
        for query in queries:
            try:
                coords = google_search(query, google_api_key)
                if coords is not None:
                    return coords, "google", query, "google"
            except Exception:
                pass
            time.sleep(GOOGLE_DELAY_SECONDS)

    for query in queries:
        try:
            coords = icgc_search(query)
            if coords is not None:
                return coords, "icgc", query, "icgc"
        except Exception:
            pass
        time.sleep(ICGC_DELAY_SECONDS)

    return None, None, None, None


def rebuild_unmatched(shelters, cms_records):
    cms_by_url = {url: cms for url, cms in cms_records.items()}
    unmatched = []
    for shelter in shelters:
        if shelter.get("match_status") != "cms_only":
            continue
        cms = cms_by_url.get(shelter["detail_url"])
        if cms is None:
            cms = {
                "name": shelter.get("name"),
                "district": shelter.get("district"),
                "address": shelter.get("address"),
                "lat": shelter.get("lat"),
                "lon": shelter.get("lon"),
            }
        else:
            cms = {**cms, "lat": shelter.get("lat"), "lon": shelter.get("lon")}
        unmatched.append(build_unmatched_entry(shelter["detail_url"], cms))
    return unmatched


def main():
    shelters = read_json(DATA_DIR / "shelters.json")
    cms_records = read_json(RAW_DIR / "parsed_details.json")
    overrides = read_json_if_exists(DATA_DIR / "geocode_overrides.json", {})
    cache = read_json_if_exists(RAW_DIR / "geocode_cache.json", {})
    google_api_key = google_geocoding_api_key()

    geocoded = 0
    from_override = 0
    from_cache = 0
    failures = []

    for shelter in shelters:
        if shelter.get("lat") is not None or not shelter.get("address"):
            continue

        detail_url = shelter["detail_url"]
        municipality = infer_municipality(shelter.get("name", ""), shelter.get("address"))
        coords = None
        source = None
        query = None
        provider = None

        override = overrides.get(detail_url)
        if override and override.get("lat") is not None and override.get("lon") is not None:
            coords = (float(override["lat"]), float(override["lon"]))
            source = "manual"
            from_override += 1
        elif detail_url in cache and cache[detail_url].get("lat") is not None:
            coords = (float(cache[detail_url]["lat"]), float(cache[detail_url]["lon"]))
            source = cache[detail_url].get("source", "icgc")
            from_cache += 1
        else:
            coords, source, query, provider = geocode_shelter(shelter, municipality, google_api_key)
            if coords is None:
                failures.append(
                    {
                        "name": shelter.get("name"),
                        "detail_url": detail_url,
                        "municipality": municipality,
                        "reason": "no geocoder results from Google or ICGC",
                    }
                )
                continue
            cache[detail_url] = {
                "lat": coords[0],
                "lon": coords[1],
                "source": source,
                "query": query,
                "provider": provider,
            }

        shelter["lat"] = coords[0]
        shelter["lon"] = coords[1]
        geocoded += 1

    unmatched = rebuild_unmatched(shelters, cms_records)

    write_json(DATA_DIR / "shelters.json", shelters)
    write_json(DATA_DIR / "unmatched.json", unmatched)
    write_json(RAW_DIR / "geocode_cache.json", cache)
    write_json(DATA_DIR / "geocode_failures.json", failures)

    print(f"Geocoded {geocoded} shelters ({from_override} manual, {from_cache} cached, rest fresh)")
    if google_api_key:
        print("  Google Geocoding API: enabled")
    else:
        print("  Google Geocoding API: not configured (copy pipeline/.env.example to .env)")
    print(f"Failures: {len(failures)} (see data/geocode_failures.json)")
    print(f"Unmatched against CKAN: {len(unmatched)}")


if __name__ == "__main__":
    main()
