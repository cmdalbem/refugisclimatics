"""Stage 3: fetch and cache every shelter's detail page HTML.

Reads the detail URLs discovered in stage 2 and downloads each page once,
caching it to disk under raw/detail_pages/ so stage 4's parsing logic can be
iterated on without re-hitting the site every time.
"""

from common import DETAIL_PAGES_DIR, RAW_DIR, get_text, read_json


def slug_for(detail_url):
    return detail_url.rstrip("/").rsplit("/", 1)[-1] + ".html"


def main():
    typology_index = read_json(RAW_DIR / "typology_index.json")
    detail_urls = sorted(typology_index.keys())

    DETAIL_PAGES_DIR.mkdir(parents=True, exist_ok=True)
    fetched, cached, failed = 0, 0, []
    for i, detail_url in enumerate(detail_urls, start=1):
        dest = DETAIL_PAGES_DIR / slug_for(detail_url)
        if dest.exists():
            cached += 1
            continue
        try:
            html = get_text(detail_url)
        except Exception as exc:
            print(f"[{i}/{len(detail_urls)}] FAILED {detail_url}: {exc}")
            failed.append(detail_url)
            continue
        dest.write_text(html, encoding="utf-8")
        fetched += 1
        if i % 50 == 0:
            print(f"[{i}/{len(detail_urls)}] fetched so far: {fetched}")

    print(f"Done. Fetched {fetched} new pages, {cached} already cached, {len(failed)} failed.")
    if failed:
        print("Failed URLs:")
        for url in failed:
            print(f"  {url}")


if __name__ == "__main__":
    main()
