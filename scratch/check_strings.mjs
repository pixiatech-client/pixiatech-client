import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

// Check for unclosed template literals or strings in the first 576 lines
const lines = content.split('\n');
const first576 = lines.slice(0, 576).join('\n');

let inTemplate = 0;
let inSingle = false;
let inDouble = false;
let inMultiComment = false;

for (let i = 0; i < first576.length; i++) {
    const ch = first576[i];
    const prev = first576[i-1];
    const next2 = first576.substring(i, i+2);
    
    if (inMultiComment) {
        if (next2 === '*/') { inMultiComment = false; i++; }
        continue;
    }
    
    if (!inSingle && !inDouble && !inTemplate && next2 === '/*') { inMultiComment = true; i++; continue; }
    if (!inSingle && !inDouble && !inTemplate && next2 === '//') {
        // Skip rest of line
        while (i < first576.length && first576[i] !== '\n') i++;
        continue;
    }
    
    if (!inDouble && !inTemplate && ch === "'" && prev !== '\\') { inSingle = !inSingle; continue; }
    if (!inSingle && !inTemplate && ch === '"' && prev !== '\\') { inDouble = !inDouble; continue; }
    if (!inSingle && !inDouble && ch === '`' && prev !== '\\') {
        if (inTemplate > 0) { inTemplate--; } else { inTemplate++; }
        continue;
    }
}

console.log('After line 576:');
console.log('In template literal:', inTemplate);
console.log('In single quote:', inSingle);
console.log('In double quote:', inDouble);
