import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

const stack = [];
// List of tags to track
const tags = ['div', 'section', 'AnimatePresence', 'motion.div', 'motion.section', 'NumericControl', 'TechnicalSpec', 'CustomSelect', 'TransmitModal', 'QuotePDF'];

// Simple parser
let i = content.indexOf('return (', content.indexOf('export default function DetailsApp'));
const end = content.lastIndexOf(');', content.lastIndexOf('export default function DetailsApp') + 5000); // Rough estimate

while (i < end) {
    if (content[i] === '<' && content[i+1] !== ' ' && content[i+1] !== '!') {
        let isClose = content[i+1] === '/';
        let tagStart = isClose ? i + 2 : i + 1;
        let j = tagStart;
        while (/[a-zA-Z0-9.]/.test(content[j])) j++;
        const tag = content.substring(tagStart, j);

        if (tags.includes(tag)) {
            // Find end of tag
            let k = j;
            let isSelfClosing = false;
            while (content[k] !== '>') {
                if (content[k] === '/' && content[k+1] === '>') {
                    isSelfClosing = true;
                    break;
                }
                k++;
            }
            
            const lineNum = content.substring(0, i).split('\n').length;

            if (!isClose) {
                if (!isSelfClosing) {
                    stack.push({ tag, lineNum });
                }
            } else {
                const last = stack.pop();
                if (!last || last.tag !== tag) {
                    console.log(`Mismatched close tag </${tag}> at line ${lineNum}. Expected </${last ? last.tag : 'NONE'}> (from line ${last ? last.lineNum : 'NONE'})`);
                }
            }
            i = k;
        }
    }
    i++;
}

while (stack.length > 0) {
    const last = stack.pop();
    console.log(`Unclosed tag <${last.tag}> from line ${last.lineNum}`);
}
