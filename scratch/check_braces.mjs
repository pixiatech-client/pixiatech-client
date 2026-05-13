import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

let braceCount = 0;
let lineNum = 1;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    if (content[i] === '\n') {
        if (lineNum === 586) {
            console.log(`Brace count at line 586: ${braceCount}`);
        }
        lineNum++;
    }
}
console.log(`Final brace count: ${braceCount}`);
