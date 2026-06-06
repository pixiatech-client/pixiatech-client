# -*- coding: utf-8 -*-
import re, json

with open(r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx', encoding='utf-8') as f:
    lines = f.readlines()

strings = []
for i, line in enumerate(lines, 1):
    text = line.strip()
    if re.search(r'[À-ÿ]', text) and len(text) > 2:
        # Only keep lines that look like UI text
        if any(k in text for k in ['>', 'placeholder', 'title=', 'label', 'button', 'span', 'h1', 'h2', 'h3', 'h4', 'p ', 'toast', 'alert']):
            strings.append(f'{i}: {text[:120]}')

for s in strings[:120]:
    print(s)
