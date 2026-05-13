import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;

console.log(`Open divs: ${openDivs}`);
console.log(`Close divs: ${closeDivs}`);

const openMotions = (content.match(/<motion\.div/g) || []).length;
const closeMotions = (content.match(/<\/motion\.div>/g) || []).length;

console.log(`Open motion.divs: ${openMotions}`);
console.log(`Close motion.divs: ${closeMotions}`);
