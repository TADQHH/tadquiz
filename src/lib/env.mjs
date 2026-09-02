/** Environment access with safe defaults. .env is managed by scripts/gen-env.mjs. */
import { loadDotEnv } from './load-env.mjs';

loadDotEnv();
/**
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function env(key, fallback = '') {
  const value = process.env[key];
  return value !== undefined && value.trim() !== '' ? value.trim() : fallback;
}

export function envInt(key, fallback) {
  const raw = process.env[key];
  const parsed = raw === undefined ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Session HMAC secret; fails loudly with the fix command when absent. */
export function requireSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET missing or too short — run `npm run gen:env` (dev) or let the container entrypoint generate it.');
  }
  return secret;
}
