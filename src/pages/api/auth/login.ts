import type { APIRoute } from 'astro';
import { verifyPassword } from '../../../lib/password.mjs';
import { findByUsername } from '../../../db/admins.mjs';
import { createSessionToken, SESSION_COOKIE } from '../../../lib/session.mjs';
import { json, apiError, readJson } from '../../../lib/http';
import { requireSessionSecret, env, envInt } from '../../../lib/env.mjs';
import { checkRate } from '../../../lib/ratelimit.mjs';
import { validateUsername, validatePassword } from '../../../../scripts/lib/validate-credentials.mjs';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  if (!checkRate(`login:${clientAddress ?? 'unknown'}`, { limit: 10, windowMs: 60_000 })) {
    return apiError('Thử lại sau ít phút.', 429);
  }

  const body = await readJson<{ username?: string; password?: string }>(request);
  if (!body) return apiError('Payload không hợp lệ.', 400);

  if (!validateUsername(String(body.username ?? '')).ok) {
    return apiError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
  }
  if (!validatePassword(String(body.password ?? '')).ok) {
    return apiError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
  }

  const admin = findByUsername(String(body.username));
  if (admin === undefined || !verifyPassword(String(body.password), admin.password_hash)) {
    return apiError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
  }

  const ttl = envInt('SESSION_TTL_HOURS', 72);
  const token = createSessionToken(admin.id, admin.username, ttl, requireSessionSecret());
  const secure = env('SITE_URL', 'http://').startsWith('https://');
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: ttl * 3600,
  });
  return json({ ok: true, username: admin.username });
};
