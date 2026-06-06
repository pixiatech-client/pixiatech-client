import re
with open(r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx', encoding='utf-8') as f:
    lines = f.readlines()
strings = []
for i, line in enumerate(lines, 1):
    matches = re.findall(r'>(.*?)<|title="([^"]+)"|placeholder="([^"]+)"', line)
    for m in matches:
        text = m[0] or m[1] or m[2]
        if text and re.search(r'[À-ÿ]', text) and len(text) > 2:
            strings.append((i, text.strip()))
seen = set()
for lineno, text in strings:
    if text not in seen:
        seen.add(text)
        print(f'{lineno}: {text}')
