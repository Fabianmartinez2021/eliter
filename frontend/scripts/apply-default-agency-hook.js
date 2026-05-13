/**
 * Añade useSyncFirstAgencyFormField antes del return principal (tras listAgencies).
 * Solo archivos con un único useForm( en el archivo.
 * node scripts/apply-default-agency-hook.js
 */
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

function addSetValueWatchToFirstUseForm(s) {
  return s.replace(/const\s*\{([^}]*)\}\s*=\s*useForm\s*\([^)]*\)\s*;/, (m, inner) => {
    let parts = inner.split(',').map((x) => x.trim()).filter(Boolean);
    if (!parts.includes('setValue')) parts.push('setValue');
    if (!parts.includes('watch')) parts.push('watch');
    return `const { ${parts.join(', ')} } = useForm();`;
  });
}

function insertImport(s, imp) {
  const line = `import { useSyncFirstAgencyFormField } from '${imp}';`;
  if (s.includes('useSyncFirstAgencyFormField')) return s;
  const lines = s.split('\n');
  let insertAt = 0;
  for (let j = 0; j < lines.length; j++) {
    if (/^import\s/.test(lines[j])) insertAt = j + 1;
  }
  lines.splice(insertAt, 0, line);
  return lines.join('\n');
}

let changed = 0;
let skipped = 0;

for (const file of walk(VIEWS)) {
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('listAgencies')) continue;
  if (!/name=["']agency["']/.test(s)) continue;
  if (s.includes('useSyncFirstAgencyFormField(')) continue;

  const nForms = (s.match(/\buseForm\s*\(/g) || []).length;
  if (nForms !== 1) {
    skipped++;
    continue;
  }

  const idx = s.indexOf('const [listAgencies');
  if (idx === -1) {
    skipped++;
    continue;
  }
  const tail = s.slice(idx);
  const retMatch = tail.match(/\n(\s*)return\s*\(\s*$/m) || tail.match(/\n(\s*)return\s*\(/m);
  if (!retMatch) {
    skipped++;
    continue;
  }
  const retIdx = idx + tail.indexOf(retMatch[0]);
  const indent = retMatch[1] || '  ';

  const before = s.slice(0, retIdx);
  const after = s.slice(retIdx);
  const hookBlock = `\n${indent}const _defaultAgencyWatch = watch('agency');\n${indent}useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);\n`;

  let next = before + hookBlock + after;
  next = addSetValueWatchToFirstUseForm(next);
  next = insertImport(next, hookImportPath(file));

  if (next !== s) {
    fs.writeFileSync(file, next);
    changed++;
    console.log('OK', path.relative(ROOT, file));
  }
}
console.log('Changed:', changed, 'Skipped (multi useForm or pattern):', skipped);
