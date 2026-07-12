"""Stage 5: join the CMS-derived shelter records (name, typology,
characteristics, hours) with the official CKAN records (authoritative
geolocation, contact info, register id).

The two systems use unrelated identifiers for the same physical shelters, so
matching is done in four tiers of decreasing strictness:
  1. exact normalized name
  2. exact normalized name + district (catches near-duplicate names in
     different districts, and typos that tier 1 would otherwise conflate)
  3. nearest CKAN point within 30 meters of a CMS record's own parsed
     coordinates, as a last resort for anything else
  4. inherit CKAN data from an already-matched CMS sibling at the exact
     same coordinates (sub-venues in the same building, e.g. individual
     pool halls inside a sports centre). Multiple CMS records may share
     one CKAN register id when they represent the same site.

The canonical list is the 563 CMS/detail records (this matches the website's
own count). CKAN data enriches each record when a confident match is found.
CMS records that never find a confident CKAN match are still included in
shelters.json (most are simply outside Barcelona city, e.g. Sant Adrià,
Badalona, l'Hospitalet, Santa Coloma - the CKAN dataset is scoped to
Barcelona only) but are also listed in unmatched.json for manual review.
"""

import math

from common import DATA_DIR, RAW_DIR, normalize_join_key, read_json, read_json_if_exists, write_json

MAX_MATCH_DISTANCE_METERS = 30
# ~1 m precision; CMS siblings in the same building share one comshiva point.
COORD_KEY_DECIMALS = 5


def haversine_meters(lat1, lon1, lat2, lon2):
    radius_earth_m = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius_earth_m * math.asin(math.sqrt(a))


def build_ckan_record(raw):
    return {
        "register_id": raw.get("register_id", "").lstrip("\ufeff"),
        "name": raw.get("name"),
        "street": raw.get("addresses_road_name"),
        "street_number": raw.get("addresses_start_street_number"),
        "district": raw.get("addresses_district_name"),
        "neighborhood": raw.get("addresses_neighborhood_name"),
        "zip_code": raw.get("addresses_zip_code"),
        "lat": float(raw["geo_epgs_4326_lat"]) if raw.get("geo_epgs_4326_lat") else None,
        "lon": float(raw["geo_epgs_4326_lon"]) if raw.get("geo_epgs_4326_lon") else None,
        "timetable_raw": raw.get("timetable"),
        "contact_type": raw.get("values_attribute_name") or None,
        "contact_value": raw.get("values_value") or None,
        "created": raw.get("created"),
        "modified": raw.get("modified"),
    }


def match_tier1_by_name(cms_records, ckan_by_name):
    matches = {}
    for detail_url, cms in cms_records.items():
        key = normalize_join_key(cms["name"], "", "")
        candidates = ckan_by_name.get(key, [])
        if len(candidates) == 1:
            matches[detail_url] = candidates[0]
    return matches


def match_tier2_by_name_and_district(cms_records, ckan_records, already_matched):
    ckan_by_name_district = {}
    for ckan in ckan_records:
        key = (normalize_join_key(ckan["name"], "", ""), ckan["district"])
        ckan_by_name_district.setdefault(key, []).append(ckan)

    matches = {}
    for detail_url, cms in cms_records.items():
        if detail_url in already_matched:
            continue
        key = (normalize_join_key(cms["name"], "", ""), cms.get("district"))
        candidates = ckan_by_name_district.get(key, [])
        if len(candidates) == 1:
            matches[detail_url] = candidates[0]
    return matches


def match_tier3_by_distance(cms_records, ckan_records, already_matched):
    used_ckan_ids = {ckan["register_id"] for ckan in already_matched.values()}
    remaining_ckan = [c for c in ckan_records if c["register_id"] not in used_ckan_ids and c["lat"] is not None]

    candidates = []
    for detail_url, cms in cms_records.items():
        if detail_url in already_matched or cms.get("lat") is None:
            continue
        best, best_distance = None, None
        for ckan in remaining_ckan:
            distance = haversine_meters(cms["lat"], cms["lon"], ckan["lat"], ckan["lon"])
            if distance <= MAX_MATCH_DISTANCE_METERS and (best_distance is None or distance < best_distance):
                best, best_distance = ckan, distance
        if best is not None:
            candidates.append((best_distance, detail_url, best))

    matches = {}
    claimed_ckan_ids = set()
    for _distance, detail_url, ckan in sorted(candidates, key=lambda c: c[0]):
        if ckan["register_id"] in claimed_ckan_ids:
            continue
        matches[detail_url] = ckan
        claimed_ckan_ids.add(ckan["register_id"])
    return matches


def coord_key(lat, lon):
    return (round(lat, COORD_KEY_DECIMALS), round(lon, COORD_KEY_DECIMALS))


def pick_colocated_donor(unmatched_name, donors):
    """Choose which matched sibling should donate CKAN data.

    donors: list of (detail_url, ckan, cms_name). Prefer the shortest CMS
    name at the site — usually the parent venue (sports centre, CCCB, etc.).
    """
    return min(donors, key=lambda donor: (len(donor[2]), donor[2]))


def match_tier4_by_colocation(cms_records, matches):
    matched_by_coord = {}
    for detail_url, ckan in matches.items():
        cms = cms_records[detail_url]
        if cms.get("lat") is None:
            continue
        key = coord_key(cms["lat"], cms["lon"])
        matched_by_coord.setdefault(key, []).append((detail_url, ckan, cms["name"]))

    tier4 = {}
    for detail_url, cms in cms_records.items():
        if detail_url in matches or cms.get("lat") is None:
            continue
        donors = matched_by_coord.get(coord_key(cms["lat"], cms["lon"]))
        if not donors:
            continue
        tier4[detail_url] = pick_colocated_donor(cms["name"], donors)[1]
    return tier4


def apply_ckan_overrides(cms_records, ckan_records, matches):
    """Apply manual detail_url -> register_id mappings from data/ckan_overrides.json."""
    overrides = read_json_if_exists(DATA_DIR / "ckan_overrides.json", {})
    if not overrides:
        return {}

    ckan_by_id = {ckan["register_id"]: ckan for ckan in ckan_records}
    applied = {}
    for detail_url, override in overrides.items():
        if detail_url in matches or detail_url not in cms_records:
            continue
        register_id = str(override.get("register_id", "")).lstrip("\ufeff")
        ckan = ckan_by_id.get(register_id)
        if ckan is None:
            print(f"Warning: ckan override for {detail_url} references unknown register_id {register_id}")
            continue
        applied[detail_url] = ckan
    return applied


def build_unmatched_entry(detail_url, cms):
    return {
        "name": cms["name"],
        "detail_url": detail_url,
        "district": cms.get("district"),
        "address": cms.get("address"),
        "has_coordinates": cms.get("lat") is not None,
        "reason": "no coordinates parsed from detail page, cannot attempt distance match"
        if cms.get("lat") is None
        else "no confident match found in CKAN dataset (likely outside Barcelona city)",
    }


def main():
    cms_records = read_json(RAW_DIR / "parsed_details.json")
    ckan_raw = read_json(RAW_DIR / "ckan_shelters.json")
    ckan_records = [build_ckan_record(raw) for raw in ckan_raw]

    ckan_by_name = {}
    for ckan in ckan_records:
        ckan_by_name.setdefault(normalize_join_key(ckan["name"], "", ""), []).append(ckan)

    matches = match_tier1_by_name(cms_records, ckan_by_name)
    print(f"Tier 1 (exact name): {len(matches)} matches")

    tier2 = match_tier2_by_name_and_district(cms_records, ckan_records, matches)
    matches.update(tier2)
    print(f"Tier 2 (+name/district): {len(tier2)} new matches, {len(matches)} total")

    tier3 = match_tier3_by_distance(cms_records, ckan_records, matches)
    matches.update(tier3)
    print(f"Tier 3 (+nearest within {MAX_MATCH_DISTANCE_METERS}m): {len(tier3)} new matches, {len(matches)} total")

    tier4 = match_tier4_by_colocation(cms_records, matches)
    colocated_urls = set(tier4)
    matches.update(tier4)
    print(f"Tier 4 (+colocated sibling): {len(tier4)} new matches, {len(matches)} total")

    tier5 = apply_ckan_overrides(cms_records, ckan_records, matches)
    override_urls = set(tier5)
    matches.update(tier5)
    print(f"Tier 5 (+manual CKAN overrides): {len(tier5)} new matches, {len(matches)} total")

    shelters = []
    unmatched = []
    for detail_url, cms in cms_records.items():
        ckan = matches.get(detail_url)
        if ckan and detail_url in colocated_urls:
            match_status = "colocated"
        elif ckan and detail_url in override_urls:
            match_status = "matched"
        elif ckan:
            match_status = "matched"
        else:
            match_status = "cms_only"
        shelter = {
            "name": cms["name"],
            "typology": cms["typology"],
            "characteristics": cms["characteristics"],
            "opening_hours_raw": cms["opening_hours_raw"],
            "notice": cms["notice"],
            "image_url": cms["image_url"],
            "detail_url": detail_url,
            "address": cms.get("address"),
            "district": (ckan["district"] if ckan else cms.get("district")),
            "neighborhood": (ckan["neighborhood"] if ckan else cms.get("neighborhood")),
            "lat": (ckan["lat"] if ckan else cms.get("lat")),
            "lon": (ckan["lon"] if ckan else cms.get("lon")),
            "comshiva_url": cms.get("comshiva_url"),
            "contact_type": ckan["contact_type"] if ckan else None,
            "contact_value": ckan["contact_value"] if ckan else None,
            "timetable_raw": ckan["timetable_raw"] if ckan else None,
            "register_id": ckan["register_id"] if ckan else None,
            "match_status": match_status,
        }
        shelters.append(shelter)
        if match_status == "cms_only":
            unmatched.append(build_unmatched_entry(detail_url, cms))

    print(f"\nFinal dataset: {len(shelters)} shelters, {len(unmatched)} unmatched against CKAN")
    write_json(DATA_DIR / "shelters.json", shelters)
    write_json(DATA_DIR / "unmatched.json", unmatched)


if __name__ == "__main__":
    main()
