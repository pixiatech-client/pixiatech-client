# -*- coding: utf-8 -*-
import re, json

with open(r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx', encoding='utf-8') as f:
    tsx = f.read()

strings = re.findall(r'[\"\']([^\"\']{3,})[\"\']', tsx)
found = sorted({s for s in strings if re.search(r'[À-ÿ]', s) and len(s) > 2})
print(f'Found {len(found)} unique French strings')
for s in found:
    print(s)
