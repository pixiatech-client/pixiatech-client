import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = content.split('\n');
const first576 = lines.slice(0, 576).join('\n');

let braces = 0;
let parens = 0;
let inString = 0;
const braceOpens = [];
const parenOpens = [];

for (let i = 0; i < first576.length; i++) {
    const ch = first576[i];
    const prev = first576[i-1];
    
    if (inString === 1) { if (ch === "'" && prev !== '\\') inString = 0; continue; }
    if (inString === 2) { if (ch === '"' && prev !== '\\') inString = 0; continue; }
    if (inString === 3) { if (ch === '`' && prev !== '\\') inString = 0; continue; }
    if (ch === "'") { inString = 1; continue; }
    if (ch === '"') { inString = 2; continue; }
    if (ch === '`') { inString = 3; continue; }
    
    if (ch === '{') { braces++; const lineNum = first576.substring(0, i).split('\n').length; braceOpens.push(lineNum); }
    if (ch === '}') { braces--; braceOpens.pop(); }
    if (ch === '(') { parens++; const lineNum = first576.substring(0, i).split('\n').length; parenOpens.push(lineNum); }
    if (ch === ')') { parens--; parenOpens.pop(); }
}

console.log('Unclosed braces at lines:', braceOpens);
console.log('Unclosed parens at lines:', parenOpens);
