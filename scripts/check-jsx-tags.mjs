import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'client', 'src');

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (/\.(jsx|tsx)$/.test(name)) files.push(full);
  }
  return files;
}

function checkFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const stack = [];
  const tagRe = /<\/?([A-Za-z][\w.]*)\b[^>]*\/?>/g;
  let m;

  while ((m = tagRe.exec(src))) {
    const full = m[0];
    if (full.startsWith('<!--') || full.includes('<>')) continue;

    const name = m[1];
    const selfClose = full.endsWith('/>') || /\/>\s*$/.test(full);
    const closing = full.startsWith('</');

    if ((selfClose && !closing) || VOID_TAGS.has(name)) continue;

    if (closing) {
      const open = stack.pop();
      if (!open || open.name !== name) {
        const line = src.slice(0, m.index).split('\n').length;
        throw new Error(
          `${path.relative(ROOT, file)}:${line} closing </${name}> does not match <${open?.name ?? '?'}>`
        );
      }
    } else {
      stack.push({ name, index: m.index });
    }
  }

  if (stack.length) {
    throw new Error(`${path.relative(ROOT, file)}: unclosed <${stack.at(-1).name}>`);
  }
}

for (const file of walk(ROOT)) {
  try {
    checkFile(file);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

console.log('JSX tag check OK');
