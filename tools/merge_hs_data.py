"""
Merge Chinese 10-digit HS codes with international 6-digit English descriptions.
Input:  data/hs_cn.json (scraped from hscode.net)
        data/hs6.csv     (international 6-digit, English)
Output: data/hs_data.js  (compact JS array for browser loading)

Format of hs_data.js:
  var HS_DATA = [
    [code, name_zh, name_en, unit1, mfn_rate, vat_rate, export_rebate, customs_reg],
    ...
  ];

The array includes:
  - All 10-digit China codes with Chinese names + matched English from 6-digit parent
  - 6-digit codes from international data (for broader category search)
  - 4-digit codes from international data (for heading-level browsing)
"""
import json
import csv
import os
import re
import gzip

SCRIPT_DIR = os.path.dirname(__file__)
CN_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'hs_cn.json')
INTL_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'hs6.csv')
OUTPUT = os.path.join(SCRIPT_DIR, '..', 'data', 'hs_data.js')

def load_chinese_data():
    """Load scraped Chinese HS codes."""
    with open(CN_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} Chinese 10-digit HS codes")
    return data

def load_international_data():
    """Load international 6-digit data, build lookup by code."""
    lookup = {}  # code -> description
    with open(INTL_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get('hscode', '').strip()
            desc = row.get('description', '').strip()
            level = row.get('level', '').strip()
            if code and desc:
                lookup[code] = {
                    'desc': desc,
                    'level': int(level) if level else 0
                }
    print(f"Loaded {len(lookup)} international HS codes (2/4/6 digit)")
    return lookup

def find_english(cn_code, intl_lookup):
    """Find best English description for a Chinese 10-digit code.
    Try: exact 6-digit match → 4-digit parent match → empty
    """
    # Extract 6-digit base
    code6 = cn_code[:6]
    if code6 in intl_lookup:
        return intl_lookup[code6]['desc']

    # Try 4-digit parent
    code4 = cn_code[:4]
    if code4 in intl_lookup:
        return intl_lookup[code4]['desc'] + ' (broad category)'

    return ''

def build_output(cn_data, intl_lookup):
    """Build the combined output array."""
    entries = []
    seen_codes = set()

    # 1. Add all Chinese 10-digit codes
    for item in cn_data:
        code = item.get('code', '')
        if not code or code in seen_codes:
            continue
        seen_codes.add(code)

        name_zh = item.get('name_zh', '')
        name_en = find_english(code, intl_lookup)
        entry = [
            code,
            name_zh,
            name_en,
            item.get('unit1', ''),
            item.get('mfn_rate', ''),
            item.get('vat_rate', ''),
            item.get('export_rebate', ''),
            item.get('customs_reg', '')
        ]
        entries.append(entry)

    cn_10digit_count = len(entries)

    # 2. Add 6-digit international codes (for English search)
    # Skip 4-digit and codes already covered by Chinese data
    cn_prefixes = set()
    for item in cn_data:
        cn_prefixes.add(item['code'][:6])

    intl_added = 0
    for code, info in sorted(intl_lookup.items()):
        if code in seen_codes:
            continue
        # Only add 6-digit entries that are NOT already covered by Chinese data
        if info['level'] != 6:
            continue
        # Skip if we already have Chinese 10-digit codes under this 6-digit code
        if code in cn_prefixes:
            continue
        seen_codes.add(code)

        # Try to find Chinese name from existing entries
        name_zh = find_chinese_name(code, cn_data)

        entry = [
            code,
            name_zh,
            info['desc'],
            '', '', '', '', ''
        ]
        entries.append(entry)
        intl_added += 1

    print(f"  Chinese 10-digit: {cn_10digit_count}")
    print(f"  International 4/6-digit: {intl_added}")
    print(f"  Total entries: {len(entries)}")
    return entries

def find_chinese_name(code, cn_data):
    """Try to find Chinese name by prefix matching."""
    # Find first Chinese entry that starts with this code
    candidates = [c for c in cn_data if c['code'].startswith(code)]
    if candidates:
        # Use the common prefix of names as chapter/heading description
        return candidates[0].get('name_zh', '')
    return ''

def write_js(entries):
    """Write entries as a compact JavaScript file."""
    # Build compact JS - one entry per line for readability
    lines = ['var HS_DATA = [']

    for entry in entries:
        # JSON-encode each entry array
        line = '  ' + json.dumps(entry, ensure_ascii=False) + ','
        lines.append(line)

    lines.append('];')

    js_content = '\n'.join(lines)

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(js_content)

    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"\nWritten: {OUTPUT} ({size_kb:.0f} KB)")

    # Show gzip estimate
    compressed = gzip.compress(js_content.encode('utf-8'))
    gz_kb = len(compressed) / 1024
    print(f"Gzip estimate: {gz_kb:.0f} KB (what users actually download)")


def main():
    cn_data = load_chinese_data()
    intl_lookup = load_international_data()

    print("\nBuilding combined database...")
    entries = build_output(cn_data, intl_lookup)

    write_js(entries)

    # Also show a sample
    print("\nSample entries:")
    for e in entries[:3]:
        print(f"  {e[0]}: {e[1][:40]} | {e[2][:50]}")


if __name__ == '__main__':
    main()
