import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOTS = [path.resolve('src'), path.resolve('scripts'), path.resolve('tests')];
const LIMIT = 200;
const EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.astro', '.css']);

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const files = (
  await Promise.all(ROOTS.map((root) => walk(root)))
).flat().filter((file) => EXT.has(path.extname(file)));
const offenders = [];

for (const file of files) {
  const text = await readFile(file, 'utf8');
  const lines = text.split(/\r?\n/).length;
  if (lines > LIMIT) {
    offenders.push({ file: path.relative(process.cwd(), file), lines });
  }
}

if (offenders.length) {
  console.error(`Files over ${LIMIT} lines:`);
  for (const item of offenders) console.error(`  ${item.file}: ${item.lines}`);
  process.exit(1);
}

console.log(`OK — ${files.length} source files within ${LIMIT} lines.`);
