/** Minimal .env loader (dotenv-style) — mirrors gen-env semantics:
 * a key already present in process.env always wins; .env only fills gaps.
 * Runs once on first import so the standalone server (`node dist/server/entry.mjs`)
 * and CLI scripts behave identically in dev, prod, and Docker. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let loaded = false;

export function loadDotEnv(dir = process.cwd()) {
  if (loaded) return;
  loaded = true;
  const file = join(dir, '.env');
  if (!existsSync(file)) return;
  const text = readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    if (key in process.env && process.env[key] !== undefined) continue;
    const value = raw.replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}
