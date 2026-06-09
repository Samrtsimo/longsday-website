"""
Scrape China Customs HS codes (10-digit) from hscode.net.
Output: data/hs_cn.json — array of {code, name_zh, unit1, unit2, mfn_rate, vat_rate, export_rebate}
"""
import requests
import json
import time
import re
import os
import sys
from html.parser import HTMLParser

BASE_URL = "https://www.hscode.net/IntegrateQueries/GetQueryYSList"
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "data", "hs_cn.json")
CHECKPOINT = OUTPUT + ".progress"

HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "*/*",
}

TOTAL_PAGES = 2395
DELAY = 0.3  # seconds between requests


def parse_page(html):
    """Parse one page of results. Returns list of dicts."""
    results = []

    # Simple regex-based parsing
    # Each item is an <li> containing a <table>
    items = re.split(r'<li>\s*<table>', html)

    for item in items:
        if '<td>商品编码</td>' not in item:
            continue

        entry = {}

        # HS code
        m = re.search(r'<td[^>]*>\s*(\d{9,10})\s*</td>', item)
        if m:
            entry['code'] = m.group(1)

        # Product name (Chinese)
        m = re.search(r'<td>商品名称</td>\s*<td[^>]*>(.*?)</td>', item, re.DOTALL)
        if m:
            entry['name_zh'] = m.group(1).strip()

        # Legal units
        m = re.search(r'<td>法定第一单位</td>\s*<td>(.*?)</td>', item)
        if m:
            entry['unit1'] = m.group(1).strip()
        m = re.search(r'<td>法定第二单位</td>\s*<td[^>]*>(.*?)</td>', item)
        if m:
            entry['unit2'] = m.group(1).strip()

        # Tax rates
        m = re.search(r'<td>最惠国进口税率</td>\s*<td>(.*?)</td>', item)
        if m:
            entry['mfn_rate'] = m.group(1).strip()
        m = re.search(r'<td>增值税率</td>\s*<td>(.*?)</td>', item)
        if m:
            entry['vat_rate'] = m.group(1).strip()
        m = re.search(r'<td>出口退税率</td>\s*<td>(.*?)</td>', item)
        if m:
            entry['export_rebate'] = m.group(1).strip()

        # Regulatory conditions
        m = re.search(r'<td>海关监管条件</td>\s*<td[^>]*>(.*?)</td>', item)
        if m:
            entry['customs_reg'] = m.group(1).strip()

        if entry.get('code'):
            results.append(entry)

    return results


def load_checkpoint():
    """Load progress from checkpoint file."""
    if os.path.exists(CHECKPOINT):
        with open(CHECKPOINT, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('last_page', 0), data.get('items', [])
    return 0, []


def save_checkpoint(page, items):
    """Save progress."""
    with open(CHECKPOINT, 'w', encoding='utf-8') as f:
        json.dump({'last_page': page, 'items': items}, f, ensure_ascii=False)


def main():
    last_page, all_items = load_checkpoint()
    session = requests.Session()
    session.headers.update(HEADERS)

    start_page = last_page + 1

    if start_page > 1:
        print(f"Resuming from page {start_page} ({len(all_items)} items so far)")
    else:
        print(f"Starting scrape of {TOTAL_PAGES} pages...")

    for page in range(start_page, TOTAL_PAGES + 1):
        try:
            resp = session.post(f"{BASE_URL}?pageIndex={page}", data="", timeout=30)

            if resp.status_code != 200:
                print(f"  Page {page}: HTTP {resp.status_code}, retrying...")
                time.sleep(2)
                resp = session.post(f"{BASE_URL}?pageIndex={page}", data="", timeout=30)

            if resp.status_code == 200:
                items = parse_page(resp.text)
                all_items.extend(items)

                if page % 50 == 0 or page == TOTAL_PAGES:
                    save_checkpoint(page, all_items)
                    print(f"  Page {page}/{TOTAL_PAGES} — {len(all_items)} codes total — saved checkpoint")

                if page % 10 == 0:
                    print(f"  Page {page}/{TOTAL_PAGES} — {len(all_items)} codes so far")
            else:
                print(f"  Page {page}: FAILED after retry (HTTP {resp.status_code})")
                # Save checkpoint and exit on persistent error
                save_checkpoint(page - 1, all_items)
                print(f"  Checkpoint saved at page {page - 1}")
                break

        except Exception as e:
            print(f"  Page {page}: ERROR — {e}")
            save_checkpoint(page - 1, all_items)
            print(f"  Checkpoint saved at page {page - 1}")
            break

        time.sleep(DELAY)

    # Save final output
    print(f"\nSaving {len(all_items)} items to {OUTPUT}...")
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    # Remove checkpoint on success
    if len(all_items) > 10000:
        if os.path.exists(CHECKPOINT):
            os.remove(CHECKPOINT)
        print(f"Done! {len(all_items)} HS codes saved.")
    else:
        print(f"Warning: Only {len(all_items)} items — may be incomplete. Checkpoint preserved.")

    # Show file size
    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"File size: {size_kb:.0f} KB")


if __name__ == '__main__':
    main()
