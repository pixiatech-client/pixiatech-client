const fs = require('fs');
const path = 'src/app/admin/quote-requests/_components/estimation/components/Table.tsx';
let content = fs.readFileSync(path, 'utf8');

// Normalize to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');
console.log('Total lines:', lines.length);
console.log('Line 637:', JSON.stringify(lines[636]));
console.log('Line 638:', JSON.stringify(lines[637]));
console.log('Line 639:', JSON.stringify(lines[638]));
console.log('Line 640:', JSON.stringify(lines[639]));
console.log('Line 641:', JSON.stringify(lines[640]));
console.log('Line 642:', JSON.stringify(lines[641]));

// Remove line 640 (index 639) - the extra </div>
if (lines[639].trim() === '</div>') {
  lines.splice(639, 1);
  console.log('Removed extra </div> at line 640');
} else {
  console.log('WARNING: Line 640 is not </div>, it is:', JSON.stringify(lines[639]));
  // Try to find it
  for (let i = 635; i < 645; i++) {
    console.log('L' + (i+1) + ':', JSON.stringify(lines[i]));
  }
}

// Restore CRLF
const result = lines.join('\n').replace(/\n/g, '\r\n');
fs.writeFileSync(path, result, 'utf8');
console.log('Done. New line count:', lines.length);
