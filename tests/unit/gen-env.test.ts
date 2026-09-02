import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const genEnv = join(scriptDir, '..', '..', 'scripts', 'gen-env.mjs');

function run(dir: string, extraEnv: Record<string, string> = {}) {
  return execFileSync('node', [genEnv, '--dir', dir], {
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
}

function readEnv(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(join(dir, '.env'), 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

test('.env chưa có → gen đủ 7 key', () => {
  const dir = mkdtempSync(join(tmpdir(), 'genenv-'));
  run(dir);
  const env = readEnv(dir);
  for (const key of [
    'PORT',
    'HOST',
    'SITE_URL',
    'DATABASE_PATH',
    'SESSION_SECRET',
    'SESSION_TTL_HOURS',
    'PUBLIC_SITE_NAME',
  ]) {
    assert.ok(key in env, `thiếu ${key}`);
  }
  assert.ok(env.SESSION_SECRET.length >= 32);
});

test('.env đã có → KHÔNG đụng giá trị cũ', () => {
  const dir = mkdtempSync(join(tmpdir(), 'genenv-'));
  run(dir);
  const file = join(dir, '.env');
  writeFileSync(file, readFileSync(file, 'utf8').replace('PORT=4321', 'PORT=9999'));
  run(dir);
  const env = readEnv(dir);
  assert.equal(env.PORT, '9999');
});

test('key đã có trong process env → không ghi vào file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'genenv-'));
  run(dir, { SESSION_SECRET: 'provided-by-orchestrator-abcdef' });
  assert.ok(existsSync(join(dir, '.env')));
  const env = readEnv(dir);
  assert.equal('SESSION_SECRET' in env, false, 'SESSION_SECRET phải skip khi process env đã có');
  // key khác vẫn được gen
  assert.ok('PORT' in env);
});
