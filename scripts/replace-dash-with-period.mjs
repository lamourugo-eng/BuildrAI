/**
 * Remplace les tirets (—) et séparateurs · par des points dans les textes du site.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

const SKIP_DIRS = new Set(['node_modules', '.next', '.git']);
const EXT = new Set(['.ts', '.tsx']);

function capitalizeAfterPeriods(text) {
  return text.replace(/(\. )([a-zàâäéèêëïîôùûüç])/g, (_, sep, letter) => `${sep}${letter.toUpperCase()}`);
}

function transformContent(content) {
  let next = content
    .replace(/\s—\s/g, '. ')
    .replace(/\s·\s/g, '. ');
  next = capitalizeAfterPeriods(next);
  return next;
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(name))) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('scripts' + path.sep)) continue;

  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes('—') && !original.includes('·')) continue;

  const updated = transformContent(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changed++;
    console.log('updated:', rel);
  }
}

console.log(`\n${changed} fichier(s) mis à jour.`);
