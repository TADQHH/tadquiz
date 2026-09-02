/** Stateless HMAC-signed session tokens for admin cookies.
 * Token: base64url(payloadJson) + '.' + base64url(hmacSha256(payload)).
 * Payload: { sub: adminId, un: username, exp: epochSeconds }. */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'tadquiz_session';

/**
 * @param {{sub:number, un:string, exp:number}} payload
 * @param {string} secret
 * @returns {string}
 */
export function signSession(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const mac = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

/**
 * @param {string} token
 * @param {string} secret
 * @returns {{sub:number, un:string, exp:number} | null}
 */
export function verifySession(token, secret) {
  const parts = String(token ?? '').split('.');
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') return null;
  const [body, mac] = parts;
  let expected;
  try {
    expected = createHmac('sha256', secret).update(body).digest('base64url');
  } catch {
    return null;
  }
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (
      typeof payload.sub !== 'number' ||
      typeof payload.un !== 'string' ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp)
    ) {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * @param {number} adminId
 * @param {string} username
 * @param {number} ttlHours
 * @param {string} secret
 * @returns {string}
 */
export function createSessionToken(adminId, username, ttlHours, secret) {
  const exp = Math.floor(Date.now() / 1000) + Math.max(1, ttlHours) * 3600;
  return signSession({ sub: adminId, un: username, exp }, secret);
}
