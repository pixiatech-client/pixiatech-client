import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i);
    const lineNum = content.substring(0, i).split('\n').length;
    if (lineNum >= 580 && lineNum <= 590 && charCode > 127) {
        console.log(`Non-ASCII character at line ${lineNum}: code ${charCode} ('${content[i]}')`);
    }
}
