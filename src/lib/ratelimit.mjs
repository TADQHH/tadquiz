/** Tiny in-memory fixed-window rate limiter (single-process deployment). */

const buckets = new Map();

/**
 * @param {string} key
 * @param {{limit?: number, windowMs?: number}} [opts]
 * @returns {boolean} true when the call is allowed
 */
export function checkRate(key, opts = {}) {
  const limit = opts.limit ?? 10;
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();

  if (buckets.size > 10_000) {
    for (const [k, hits] of buckets) {
      if (hits.length === 0 || hits[hits.length - 1] + windowMs < now) buckets.delete(k);
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => t + windowMs > now);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Test hook. */
export function resetRateLimiter() {
  buckets.clear();
}
