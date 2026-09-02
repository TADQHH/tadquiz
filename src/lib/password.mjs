/** Password hashing with node:crypto scrypt — no external deps.
 * Stored format: `scrypt$<saltHex>$<hashHex>` (64-byte key). */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

/**
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

/**
 * @param {string} password
 * @param {string} stored
 * @returns {boolean}
 */
export function verifyPassword(password, stored) {
  const parts = String(stored ?? '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hash] = parts;
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== KEY_LENGTH) return false;
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(candidate, expected);
}
