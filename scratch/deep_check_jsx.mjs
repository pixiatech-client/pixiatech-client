import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

const stack = [];
const regex = /<(div|section|AnimatePresence|motion\.div|motion\.section|button|span|h2|h3|h4|input|textarea|NumericControl|TechnicalSpec|CustomSelect|TransmitModal|QuotePDF|AnimatePresence|motion\.div|motion\.section|motion\.button|motion\.span|motion\.h2|motion\.h3|motion\.h4)|<\/(div|section|AnimatePresence|motion\.div|motion\.section|button|span|h2|h3|h4|input|textarea|NumericControl|TechnicalSpec|CustomSelect|TransmitModal|QuotePDF|AnimatePresence|motion\.div|motion\.section|motion\.button|motion\.span|motion\.h2|motion\.h3|motion\.h4)/g;

let match;
let lastIndex = 0;

const returnStart = content.indexOf('return (');
const returnEnd = content.lastIndexOf(');');
const returnBlock = content.substring(returnStart, returnEnd);

while ((match = regex.exec(returnBlock)) !== null) {
    const tag = match[1] || match[2];
    const isClose = match[0].startsWith('</');
    const lineNum = returnBlock.substring(0, match.index).split('\n').length + content.substring(0, returnStart).split('\n').length - 1;

    if (!isClose) {
        // Check for self-closing
        const tagContent = returnBlock.substring(match.index, returnBlock.indexOf('>', match.index) + 1);
        if (tagContent.endsWith('/>')) {
            // Self-closing, skip
        } else {
            stack.push({ tag, lineNum });
        }
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
