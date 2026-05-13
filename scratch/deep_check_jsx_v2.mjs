import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

const stack = [];
const regex = /<(div|section|AnimatePresence|motion\.div|motion\.section|button|span|h2|h3|h4|NumericControl|TechnicalSpec|CustomSelect|TransmitModal|QuotePDF|AnimatePresence|motion\.div|motion\.section|motion\.button|motion\.span|motion\.h2|motion\.h3|motion\.h4)|<\/(div|section|AnimatePresence|motion\.div|motion\.section|button|span|h2|h3|h4|NumericControl|TechnicalSpec|CustomSelect|TransmitModal|QuotePDF|AnimatePresence|motion\.div|motion\.section|motion\.button|motion\.span|motion\.h2|motion\.h3|motion\.h4)/g;

// Only process the main DetailsApp return block
const startOfDetailsApp = content.indexOf('export default function DetailsApp');
const returnStart = content.indexOf('return (', startOfDetailsApp);
// Find matching ) for return (
let braceCount = 1;
let returnEnd = -1;
for (let i = returnStart + 8; i < content.length; i++) {
    if (content[i] === '(') braceCount++;
    if (content[i] === ')') braceCount--;
    if (braceCount === 0) {
        returnEnd = i;
        break;
    }
}

const returnBlock = content.substring(returnStart, returnEnd);

let match;
while ((match = regex.exec(returnBlock)) !== null) {
    const tag = match[1] || match[2];
    const isClose = match[0].startsWith('</');
    const lineNum = returnBlock.substring(0, match.index).split('\n').length + content.substring(0, returnStart).split('\n').length - 1;

    // Check for self-closing or tags that don't need closing in JSX if handled correctly (but we assume they need />)
    const tagContent = returnBlock.substring(match.index, returnBlock.indexOf('>', match.index) + 1);
    if (!isClose) {
        if (tagContent.endsWith('/>')) {
            continue;
        }
        stack.push({ tag, lineNum });
    } else {
        const last = stack.pop();
        if (!last || last.tag !== tag) {
            console.log(`Mismatched close tag </${tag}> at line ${lineNum}. Expected </${last ? last.tag : 'NONE'}> (from line ${last ? last.lineNum : 'NONE'})`);
        }
    }
}

while (stack.length > 0) {
    const last = stack.pop();
    console.log(`Unclosed tag <${last.tag}> from line ${last.lineNum}`);
}
