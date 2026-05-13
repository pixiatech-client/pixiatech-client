import fs from 'fs';
const c = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = c.split('\n');

const stack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<AnimatePresence>/g) || []).length;
    const closes = (line.match(/<\/AnimatePresence>/g) || []).length;
    for (let j = 0; j < opens; j++) stack.push(i + 1);
    for (let j = 0; j < closes; j++) {
        if (stack.length === 0) {
            console.log(`EXTRA close at line ${i + 1}: ${line.trim()}`);
        } else {
            const opened = stack.pop();
            console.log(`Matched: open L${opened} -> close L${i+1}`);
        }
    }
}
if (stack.length > 0) console.log('Unclosed opens at lines:', stack);
else console.log('All matched. No unclosed opens.');
