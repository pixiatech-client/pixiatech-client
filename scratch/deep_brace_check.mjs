import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = content.split('\n');

const stack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') {
            stack.push({ line: i + 1, col: j + 1 });
        } else if (line[j] === '}') {
            if (stack.length === 0) {
                console.log(`Unmatched } at line ${i + 1}, col ${j + 1}`);
            } else {
                stack.pop();
            }
        }
    }
}

while (stack.length > 0) {
    const last = stack.pop();
    console.log(`Unclosed { from line ${last.line}, col ${last.col}`);
}
