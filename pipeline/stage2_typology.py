"""Stage 2: discover each shelter's typology (library, park, mall, ...).

The public listing page's internal "guia" API returns results filtered by a
category code. We call it once per typology code (no category has more than
~560 shelters, so a single page with nr=1000 always returns everything for
that category, no need to paginate via "show more"), and record which
detail-page URL belongs to which typology.
"""

from bs4 import BeautifulSoup

from common import (
    GUIA_BASE_CATEGORY_CODE,
    GUIA_BASE_URL,
    RAW_DIR,
    SITE_BASE_URL,
    TYPOLOGY_CODES,
    get_html_fragment,
    write_json,
)

PAGE_SIZE = 1000


def fetch_typology_items(typology_code):
    html_fragment = get_html_fragment(
        GUIA_BASE_URL,
        params={
            "pg": "search",
            "xout": "json2",
            "ajax": "search",
            "sort": "namesort,asc",
            "c": f"{GUIA_BASE_CATEGORY_CODE};{typology_code}",
            "nr": PAGE_SIZE,
            "entity_type": "node",
        },
    )
    soup = BeautifulSoup(html_fragment, "lxml")
    items = []
    for link in soup.select("a.ajuntament-guia-item-name"):
        address_span = link.find_next_sibling("span", class_="ajuntament-guia-item-address")
        items.append(
            {
                "detail_url": SITE_BASE_URL + link["href"],
                "name": link.get_text(strip=True),
                "address_text": address_span.get_text(strip=True) if address_span else "",
            }
        )
    return items


def main():
    typology_index = {}
    for code, label in TYPOLOGY_CODES.items():
        items = fetch_typology_items(code)
        print(f"{label} ({code}): {len(items)} shelters")
        for item in items:
            typology_index[item["detail_url"]] = {
                "typology": label,
                "name": item["name"],
                "address_text": item["address_text"],
            }

    print(f"Total shelters indexed by typology: {len(typology_index)}")
    write_json(RAW_DIR / "typology_index.json", typology_index)


if __name__ == "__main__":
    main()
