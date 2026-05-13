import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = content.split('\n');
const first576 = lines.slice(0, 576).join('\n');

let braces = 0;
let parens = 0;
let brackets = 0;
let inString = 0; // 0=none, 1=single, 2=double, 3=template

for (let i = 0; i < first576.length; i++) {
    const ch = first576[i];
    const prev = first576[i-1];
    
    // Skip strings
    if (inString === 1) { if (ch === "'" && prev !== '\\') inString = 0; continue; }
    if (inString === 2) { if (ch === '"' && prev !== '\\') inString = 0; continue; }
    if (inString === 3) { if (ch === '`' && prev !== '\\') inString = 0; continue; }
    
    if (ch === "'") { inString = 1; continue; }
    if (ch === '"') { inString = 2; continue; }
    if (ch === '`') { inString = 3; continue; }
    
    if (ch === '{') braces++;
    if (ch === '}') braces--;
    if (ch === '(') parens++;
    if (ch === ')') parens--;
    if (ch === '[') brackets++;
    if (ch === ']') brackets--;
}

console.log('After 576 lines:');
console.log('Open braces {:', braces);
console.log('Open parens (:', parens);
console.log('Open brackets [:', brackets);
