import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

const tags = [];
const regex = /<(\/?)([a-zA-Z0-9.]+)([^>]*?)(\/?)>/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const isSelfClosing = match[4] === '/';

    if (isSelfClosing) continue;

    if (isClosing) {
        if (tags.length === 0) {
            console.log(`Unmatched closing tag: </${tagName}> at index ${match.index}`);
        } else {
            const last = tags.pop();
            if (last.name !== tagName) {
                console.log(`Tag mismatch: <${last.name}> (line ${last.line}) closed by </${tagName}> (at index ${match.index})`);
            }
        }
    } else {
        const line = content.substring(0, match.index).split('\n').length;
        tags.push({ name: tagName, line });
    }
}

tags.forEach(t => {
    console.log(`Unclosed tag: <${t.name}> from line ${t.line}`);
});
