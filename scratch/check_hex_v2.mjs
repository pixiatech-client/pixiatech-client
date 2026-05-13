import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 580; i <= 595; i++) {
    const line = lines[i];
    console.log(`Line ${i+1}: |${line}|`);
    if (line) {
        let hex = '';
        for (let j = 0; j < line.length; j++) {
            hex += line.charCodeAt(j).toString(16).padStart(2, '0') + ' ';
        }
        console.log(`Hex: ${hex}`);
    }
}
