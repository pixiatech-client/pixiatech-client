
const fs = require('fs');
const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/components/chat/ChatWindow.tsx', 'utf8');

let parenCount = 0;
let braceCount = 0;
let bracketCount = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '(') parenCount++;
  if (content[i] === ')') parenCount--;
  if (content[i] === '{') braceCount++;
  if (content[i] === '}') braceCount--;
  if (content[i] === '[') bracketCount++;
  if (content[i] === ']') bracketCount--;
  
  if (parenCount < 0 || braceCount < 0 || bracketCount < 0) {
    console.log(`Unbalanced at char ${i}: ( ${parenCount}, { ${braceCount}, [ ${bracketCount} }`);
    // print some context
    console.log(content.substring(i-20, i+20));
  }
}

console.log(`Final counts: ( ${parenCount}, { ${braceCount}, [ ${bracketCount} }`);
