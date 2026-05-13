import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

const selfClosingTags = ['input', 'img', 'br', 'hr', 'textarea']; // textarea is not self-closing but often used as such in bad HTML

let newContent = content;

selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'g');
    newContent = newContent.replace(regex, `<${tag}$1 />`);
});

// Also fix some specific mismatches found by the script
// Tag mismatch: <div> (line 837) closed by </label>
// This means the label started but didn't close its own children properly or something.

fs.writeFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', newContent);
console.log('Fixed potential self-closing tag issues.');
