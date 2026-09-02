import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../src/lib/password.mjs';

test('hash + verify roundtrip', () => {
  const stored = hashPassword('correct horse battery');
  assert.match(stored, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.equal(verifyPassword('correct horse battery', stored), true);
});

test('sai mật khẩu → false', () => {
  const stored = hashPassword('right');
  assert.equal(verifyPassword('wrong', stored), false);
});

test('mỗi lần hash ra salt khác', () => {
  assert.notEqual(hashPassword('same'), hashPassword('same'));
});

test('stored malformed → false, không throw', () => {
  assert.equal(verifyPassword('x', ''), false);
  assert.equal(verifyPassword('x', 'plaintext'), false);
  assert.equal(verifyPassword('x', 'scrypt$only$two'), false);
  assert.equal(verifyPassword('x', 'md5$abcd$deadbeef'), false);
});
