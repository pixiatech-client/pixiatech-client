import fs from 'fs';
const c = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = c.split('\n');

const stack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only count NON self-closing motion.div opens
    // A motion.div open looks like: <motion.div ... > (not />)
    // We need to track opens that are NOT self-closing
    
    // Count self-closing: <motion.div ... />
    const selfClosing = (line.match(/<motion\.div[^>]*\/>/g) || []).length;
    // Count all opens: <motion.div
    const allOpens = (line.match(/<motion\.div/g) || []).length;
    const realOpens = allOpens - selfClosing;
    
    const closes = (line.match(/<\/motion\.div>/g) || []).length;
    
    for (let j = 0; j < realOpens; j++) stack.push(i + 1);
    for (let j = 0; j < closes; j++) {
        if (stack.length === 0) {
            console.log(`EXTRA close at line ${i + 1}`);
        } else {
            const opened = stack.pop();
            // Only log if interesting (deep nesting)
        }
    }
}
if (stack.length > 0) console.log('Unclosed motion.divs at lines:', stack);
else console.log('All motion.divs matched!');
