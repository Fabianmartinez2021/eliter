const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const VIEWS = path.join(ROOT, 'src', 'views');

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.jsx?$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function hookImportPath(fromFile) {
  const rel = path.relative(VIEWS, fromFile);
  const depth = rel.split(path.sep).length - 1;
  return '../'.repeat(depth + 1) + 'hooks/useSyncFirstAgency';
}

let n = 0;
for (const file of walk(VIEWS)) {
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('useSyncFirstAgencyFormField(')) continue;
  if (s.includes('hooks/useSyncFirstAgency')) continue;

  const line = `import { useSyncFirstAgencyFormField } from '${hookImportPath(file)}';`;
  const lines = s.split('\n');
  let insertAt = 0;
  for (let j = 0; j < lines.length; j++) {
    if (/^import\s/.test(lines[j])) insertAt = j + 1;
  }
  lines.splice(insertAt, 0, line);
  fs.writeFileSync(file, lines.join('\n'));
  n++;
  console.log(path.relative(ROOT, file));
}
console.log('Imports added:', n);
