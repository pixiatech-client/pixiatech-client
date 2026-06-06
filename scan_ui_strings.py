# -*- coding: utf-8 -*-
import re

with open(r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx', encoding='utf-8') as f:
    lines = f.readlines()

# Focus on actual UI strings, not mock data/variables/code
ranges = [(1763, 2675), (2676, 3334), (3335, 4506)]

results = []
for start, end in ranges:
    for i in range(start-1, end):
        line = lines[i]
        # Skip if line contains code patterns
        if any(p in line for p in ['const ', 'let ', 'var ', 'function ', '=>', 'import ', 'export ', 'type ', 'interface ']):
            continue
        
        matches = re.findall(r'[\"\']([^\"\']{3,})[\"\']', line)
        for m in matches:
            text = m.strip()
            # Skip if it's a URL, path, className, or technical string
            if any(p in text for p in ['http', '/', '.tsx', '.ts', '.json', 'className', 'flex', 'grid', 'text-', 'bg-', 'border-', 'w-', 'h-', 'p-', 'm-', 'rounded', 'shadow', 'hover:', 'active:', 'transition', 'duration', 'ease', 'z-', 'fixed', 'absolute', 'relative', 'inset', 'overflow']):
                continue
            if text and re.search(r'[À-ÿ]', text) and len(text) > 2:
                results.append(f'{i+1}: {text}')

# Deduplicate
seen = set()
for r in results:
    if r not in seen:
        seen.add(r)
        print(r)
