import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

const returnStart = content.indexOf('return (');
const returnEnd = content.lastIndexOf(');');
const returnBlock = content.substring(returnStart, returnEnd);

const openDivs = (returnBlock.match(/<div/g) || []).length;
const closeDivs = (returnBlock.match(/<\/div>/g) || []).length;

console.log(`Open divs in return: ${openDivs}`);
console.log(`Close divs in return: ${closeDivs}`);
