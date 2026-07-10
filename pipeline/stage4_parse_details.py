"""Stage 4: parse cached detail pages into structured records.

Extracts, for each shelter detail page: name, address/district/neighborhood,
characteristics, opening hours, lat/lon (from the "Cómo llegar" link, as a
cross-check against the CKAN coordinates), and any temporary notice banner.
"""

import re

from bs4 import BeautifulSoup

from common import DETAIL_PAGES_DIR, RAW_DIR, TYPOLOGY_CODES, read_json, write_json

COMSHIVA_COORDS_RE = re.compile(r"hasta=(-?\d+\.\d+),(-?\d+\.\d+)")


def parse_address_block(soup):
    address = {}
    dl = soup.select_one("div.address-content dl")
    if not dl:
        return address
    for pair in dl.select("div.dt-dd"):
        dt = pair.find("dt")
        dd = pair.find("dd")
        if dt and dd:
            key = dt.get_text(strip=True).rstrip(":").lower()
            address[key] = dd.get_text(strip=True)
    return address


def parse_characteristics(soup):
    container = soup.select_one("div.caracteristic")
    if not container:
        return []
    return [li.get_text(strip=True) for li in container.select("ul li")]


def parse_opening_hours(soup):
    table = soup.select_one("div#horari table")
    if not table:
        return []
    rows = []
    for tr in table.select("tbody tr"):
        cells = [td.get_text(" ", strip=True) for td in tr.select("td")]
        rows.append(cells)
    return rows


def parse_coordinates(soup):
    link = soup.select_one("div.comshiva a")
    if not link or not link.get("href"):
        return None, None
    match = COMSHIVA_COORDS_RE.search(link["href"])
    if not match:
        return None, None
    return float(match.group(1)), float(match.group(2))


def parse_notice(soup):
    notice = soup.select_one("div.description.warning")
    return notice.get_text(" ", strip=True) if notice else None


def parse_detail_page(html, detail_url):
    soup = BeautifulSoup(html, "lxml")
    name_el = soup.select_one("div.title-content h2")
    lat, lon = parse_coordinates(soup)
    address = parse_address_block(soup)

    return {
        "detail_url": detail_url,
        "name": name_el.get_text(strip=True) if name_el else None,
        "address": address.get("dirección") or address.get("direccion"),
        "district": address.get("districte") or address.get("distrito"),
        "neighborhood": address.get("barrio") or address.get("barri"),
        "characteristics": parse_characteristics(soup),
        "opening_hours_raw": parse_opening_hours(soup),
        "lat": lat,
        "lon": lon,
        "notice": parse_notice(soup),
    }


def main():
    typology_index = read_json(RAW_DIR / "typology_index.json")

    parsed = {}
    failures = []
    for detail_url, typology_info in typology_index.items():
        slug = detail_url.rstrip("/").rsplit("/", 1)[-1]
        page_path = DETAIL_PAGES_DIR / f"{slug}.html"
        if not page_path.exists():
            failures.append(detail_url)
            continue
        html = page_path.read_text(encoding="utf-8")
        record = parse_detail_page(html, detail_url)
        record["typology"] = typology_info["typology"]
        parsed[detail_url] = record

    unknown_typologies = {r["typology"] for r in parsed.values()} - set(TYPOLOGY_CODES.values())
    if unknown_typologies:
        print(f"Warning: unexpected typologies found: {unknown_typologies}")

    missing_name = sum(1 for r in parsed.values() if not r["name"])
    missing_coords = sum(1 for r in parsed.values() if r["lat"] is None)
    print(f"Parsed {len(parsed)} detail pages ({len(failures)} missing from cache).")
    print(f"  missing name: {missing_name}, missing coordinates: {missing_coords}")

    write_json(RAW_DIR / "parsed_details.json", parsed)
    if failures:
        write_json(RAW_DIR / "parse_failures.json", failures)


if __name__ == "__main__":
    main()
