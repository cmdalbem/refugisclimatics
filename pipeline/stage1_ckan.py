"""Stage 1: fetch the official Open Data BCN climate shelters dataset.

Normally paginates the CKAN datastore_search endpoint until every record has
been retrieved. When that indexed API returns suspiciously few rows (it has
been observed to drop to ~30 while the full dataset still has ~535), falls
back to downloading the companion JSON resource and normalizing each record
into the flat datastore field names that downstream stages expect.

Writes raw rows to raw/ckan_shelters.json.
"""

from common import (
    CKAN_DATASTORE_MIN_RECORDS,
    CKAN_DATASTORE_SEARCH_URL,
    CKAN_JSON_DOWNLOAD_URL,
    CKAN_RESOURCE_ID,
    RAW_DIR,
    get_json,
    write_json,
)

PAGE_SIZE = 500


def fetch_from_datastore():
    records = []
    offset = 0
    total = None
    while True:
        result = get_json(
            CKAN_DATASTORE_SEARCH_URL,
            params={"resource_id": CKAN_RESOURCE_ID, "limit": PAGE_SIZE, "offset": offset},
        )["result"]
        if total is None:
            total = result["total"]
        records.extend(result["records"])
        offset += PAGE_SIZE
        if offset >= total:
            break
    return records, total


def main_address(addresses):
    return next((address for address in addresses if address.get("main_address")), addresses[0] if addresses else {})


def normalize_json_record(raw):
    """Map a nested JSON resource record to flat datastore field names."""
    address = main_address(raw.get("addresses") or [])
    geo = raw.get("geo_epgs_4326_latlon") or {}
    if geo.get("lat") is None:
        geometries = (address.get("location_4326_latlon") or {}).get("geometries") or []
        if geometries:
            lon, lat = geometries[0]["coordinates"]
            geo = {"lat": lat, "lon": lon}

    values = raw.get("values") or []
    contact = values[0] if values else {}

    timetable = raw.get("timetable")
    if isinstance(timetable, dict):
        timetable = timetable.get("html")

    return {
        "register_id": str(raw.get("register_id", "")).lstrip("\ufeff"),
        "name": raw.get("name"),
        "addresses_road_name": address.get("road_name") or address.get("address_name"),
        "addresses_start_street_number": address.get("start_street_number") or address.get("street_number_1"),
        "addresses_district_name": address.get("district_name"),
        "addresses_neighborhood_name": address.get("neighborhood_name"),
        "addresses_zip_code": address.get("zip_code"),
        "geo_epgs_4326_lat": geo.get("lat"),
        "geo_epgs_4326_lon": geo.get("lon"),
        "timetable": timetable,
        "values_attribute_name": contact.get("attribute_name"),
        "values_value": contact.get("value"),
        "created": raw.get("created"),
        "modified": raw.get("modified"),
    }


def fetch_from_json_download():
    records = get_json(CKAN_JSON_DOWNLOAD_URL)
    if not isinstance(records, list):
        raise ValueError(f"Expected a JSON array from {CKAN_JSON_DOWNLOAD_URL}, got {type(records).__name__}")
    return [normalize_json_record(raw) for raw in records]


def main():
    records, total = fetch_from_datastore()
    if len(records) < CKAN_DATASTORE_MIN_RECORDS:
        print(
            f"CKAN datastore returned only {len(records)} records (total={total}); "
            f"falling back to JSON download."
        )
        records = fetch_from_json_download()
        print(f"Fetched {len(records)} records from the CKAN JSON resource.")
    else:
        print(f"Fetched {len(records)} records from the CKAN datastore.")
    write_json(RAW_DIR / "ckan_shelters.json", records)


if __name__ == "__main__":
    main()
