import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i);
    if (charCode > 127 && charCode !== 0x0d && charCode !== 0x0a) {
        // French characters and emojis are okay, but let's see if there are others
        if (charCode < 0x00A0 || (charCode >= 0x2000 && charCode <= 0x206F)) {
            const lineNum = content.substring(0, i).split('\n').length;
            console.log(`Potential hidden character at line ${lineNum}: code ${charCode.toString(16)} at index ${i}`);
        }
    }
}
