# -*- coding: utf-8 -*-
import re, json

with open(r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx', encoding='utf-8') as f:
    content = f.read()

# Find all string literals that contain French characters
pattern = re.compile(r"""
    (?:
        title=["']([^"']+)["']
        |
        placeholder=["']([^"']+)["']
        |
        >([^<]{3,})<
    )
""", re.VERBOSE)

strings = set()
for m in pattern.finditer(content):
    text = m.group(1) or m.group(2) or m.group(3)
    text = text.strip()
    if text and re.search(r'[À-ÿ]', text) and len(text) > 2:
        strings.add(text)

# Load existing fr.json
with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json', encoding='utf-8') as f:
    fr = json.load(f)

existing = fr.get('admin', {}).get('products', {})
new_keys = {}
for s in sorted(strings):
    if s not in existing:
        new_keys[s] = s  # same text for French

print("=== New keys to add to fr.json admin.products ===")
for k, v in new_keys.items():
    print(f'  "{k}": "{v}"')

print(f"\nTotal new keys: {len(new_keys)}")
print(f"Total existing keys: {len(existing)}")
