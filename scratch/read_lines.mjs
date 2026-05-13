import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 580; i <= 590; i++) {
    console.log(`Line ${i+1}: ${JSON.stringify(lines[i])}`);
}
