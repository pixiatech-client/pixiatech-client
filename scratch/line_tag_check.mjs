import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');
const lines = content.split('\n');

const divStack = [];
const motionStack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for motion.div
    const motionOpens = line.match(/<motion\.div/g) || [];
    const motionSelfCloses = line.match(/<motion\.div[^>]*?\/>/g) || [];
    const motionCloses = line.match(/<\/motion\.div>/g) || [];
    
    for (let j = 0; j < (motionOpens.length - motionSelfCloses.length); j++) motionStack.push(i + 1);
    for (let j = 0; j < motionCloses.length; j++) motionStack.pop();

    // Check for div
    const divOpens = line.match(/<div/g) || [];
    const divSelfCloses = line.match(/<div[^>]*?\/>/g) || [];
    const divCloses = line.match(/<\/div>/g) || [];
    
    for (let j = 0; j < (divOpens.length - divSelfCloses.length); j++) divStack.push(i + 1);
    for (let j = 0; j < divCloses.length; j++) divStack.pop();
}

console.log('Unclosed motion.divs:', motionStack);
console.log('Unclosed divs:', divStack);
