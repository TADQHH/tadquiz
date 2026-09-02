import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession, createSessionToken } from '../../src/lib/session.mjs';

const SECRET = 'test-secret-that-is-long-enough-1234';

test('sign + verify roundtrip', () => {
  const token = createSessionToken(7, 'admin', 1, SECRET);
  const payload = verifySession(token, SECRET);
  assert.ok(payload);
  assert.equal(payload.sub, 7);
  assert.equal(payload.un, 'admin');
});

test('sai secret → null', () => {
  const token = createSessionToken(7, 'admin', 1, SECRET);
  assert.equal(verifySession(token, 'another-secret-another-secret-xx'), null);
});

test('token bị sửa → null', () => {
  const token = createSessionToken(7, 'admin', 1, SECRET);
  assert.equal(verifySession(`${token}x`, SECRET), null);
  assert.equal(verifySession('not-a-token', SECRET), null);
  assert.equal(verifySession('', SECRET), null);
});

test('hết hạn → null', () => {
  const expired = signSession({ sub: 1, un: 'a', exp: Math.floor(Date.now() / 1000) - 10 }, SECRET);
  assert.equal(verifySession(expired, SECRET), null);
});

test('payload thiếu field → null', () => {
  const bad = signSession({ nope: true } as never, SECRET);
  assert.equal(verifySession(bad, SECRET), null);
});
