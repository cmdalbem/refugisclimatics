"""Stage 1: fetch the official Open Data BCN climate shelters dataset.

Paginates the CKAN datastore_search endpoint until every record has been
retrieved, then writes the raw rows to raw/ckan_shelters.json.
"""

from common import CKAN_DATASTORE_SEARCH_URL, CKAN_RESOURCE_ID, RAW_DIR, get_json, write_json

PAGE_SIZE = 500


def fetch_all_records():
    records = []
    offset = 0
    while True:
        result = get_json(
            CKAN_DATASTORE_SEARCH_URL,
            params={"resource_id": CKAN_RESOURCE_ID, "limit": PAGE_SIZE, "offset": offset},
        )["result"]
        records.extend(result["records"])
        offset += PAGE_SIZE
        if offset >= result["total"]:
            break
    return records


def main():
    records = fetch_all_records()
    print(f"Fetched {len(records)} records from the CKAN datastore.")
    write_json(RAW_DIR / "ckan_shelters.json", records)


if __name__ == "__main__":
    main()
