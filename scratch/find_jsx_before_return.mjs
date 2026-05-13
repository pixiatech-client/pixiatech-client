import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = content.split('\n');

// Look for suspicious patterns between line 1 and 576
// that could cause "Unexpected token div" - typically unclosed template literals,
// unclosed strings, or arrow functions with JSX that aren't terminated

for (let i = 0; i < 576; i++) {
    const line = lines[i];
    // Check for suspicious patterns:
    // 1. Backtick strings - count opening and closing backticks
    // 2. Arrow functions returning JSX inline
    
    // Look for JSX patterns outside the return block (before line 576)
    if (line.match(/<[A-Za-z][A-Za-z.]*\s/) && !line.includes('//') && !line.includes('*')) {
        console.log(`L${i+1}: ${line.trim()}`);
    }
}
