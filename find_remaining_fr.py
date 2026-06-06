# -*- coding: utf-8 -*-
import re

with open(r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx', encoding='utf-8') as f:
    lines = f.readlines()

ranges = [(1763, 2675), (2676, 3334), (3335, 4819)]

results = []
for start, end in ranges:
    for i in range(start-1, end):
        line = lines[i]
        matches = re.findall(r'[\"\']([^\"\']{3,})[\"\']', line)
        for m in matches:
            text = m.strip()
            if text and re.search(r'[À-ÿ]', text):
                results.append(f'{i+1}: {text}')

for r in results:
    print(r)
