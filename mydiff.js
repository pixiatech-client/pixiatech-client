const fs = require('fs');
const src = fs.readFileSync('F:/PIXIATECH/pixiatech-client/site/src/components/ShowreelSection.tsx', 'utf8');
const port = fs.readFileSync('F:/PIXIATECH/pixiatech-client/src/web/xeron/sections/ShowreelSection.tsx', 'utf8');

const normLine = s =>
  s.replace(/\/\/.*$/gm, '')
   .replace(/"[^"\n]*"/g, '"S"')
   .replace(/'[^'\n]*'/g, '"S"')
   .replace(/`[^`\n]*`/g, '"S"')
   .replace(/\s+/g, ' ')
   .trim();

const a = src.split(/\r?\n/).filter(Boolean).map(normLine);
const b = port.split(/\r?\n/).filter(Boolean).map(normLine);

console.log('site normalized lines:', a.length, 'port normalized lines:', b.length);

// Myers O(ND) diff on lines (works well when differences are localized)
function myersDiff(a, b) {
  const N = a.length, M = b.length;
  const MAX = N + M;
  const offset = MAX;
  let v = new Array(2 * MAX + 1).fill(0);
  const trace = [];
  let found = false, d = 0;
  for (d = 0; d <= MAX && !found; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) x = v[offset + k + 1];
      else x = v[offset + k - 1] + 1;
      let y = x - k;
      while (x < N && y < M && a[x] === b[y]) { x++; y++; }
      v[offset + k] = x;
      if (x >= N && y >= M) { found = true; break; }
    }
  }
  d = found ? d : MAX;
  const ops = [];
  let x = N, y = M;
  for (let di = d - 1; di >= 0; di--) {
    const vPrev = trace[di];
    const k = x - y;
    let prevK;
    if (k === -di || (k !== di && vPrev[offset + k - 1] < vPrev[offset + k + 1])) prevK = k + 1;
    else prevK = k - 1;
    const prevX = vPrev[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) { ops.push({ op: '=', ai: --x, bi: --y }); }
    if (di >= 0) {
      if (x === prevX) { ops.push({ op: '+', ai: x, bi: y }); y--; }
      else { ops.push({ op: '-', ai: --x, bi: y }); }
    }
  }
  while (x > 0 && y > 0) { ops.push({ op: '=', ai: --x, bi: --y }); }
  while (y > 0) { ops.push({ op: '+', ai: x, bi: --y }); }
  while (x > 0) { ops.push({ op: '-', ai: --x, bi: y }); }
  ops.reverse();
  return ops;
}

let ops;
try { ops = myersDiff(a, b); }
catch (e) { console.error('diff failed', e.message); process.exit(1); }

let i = 0, chunkCount = 0;
while (i < ops.length) {
  if (ops[i].op !== '=') {
    let end = i;
    while (end < ops.length && ops[end].op !== '=') end++;
    const rem = [], add = [];
    for (; i < end; i++) {
      if (ops[i].op === '-') rem.push(a[ops[i].ai]);
      else if (ops[i].op === '+') add.push(b[ops[i].bi]);
    }
    const rs = rem.join(' || '), as = add.join(' || ');
    const ignore = /isUploading|uploadNotice|isDragging|fileInputRef|handleFileProcess|reloadImageRef|onDrop|onDrag|startWith|readAsDataURL|FileReader|fetch|JSON|base64|setTimeout/;
    let out = true;
    if (rem.every(l => ignore.test(l)) && add.every(l => ignore.test(l))) out = false;
    if (out) {
      chunkCount++;
      console.log('=== chunk', chunkCount, '===');
      console.log('SRC[' + rem.length + ']:');
      console.log(rem.join('\n'));
      console.log('PRT[' + add.length + ']:');
      console.log(add.join('\n'));
    }
    i = end;
  } else i++;
}
console.log('total non-upload chunks:', chunkCount);