import { defineMiddleware } from 'astro:middleware';
import { verifySession, SESSION_COOKIE } from './lib/session.mjs';
import { requireSessionSecret } from './lib/env.mjs';

/** Gate all /admin pages (except /admin/login) behind a valid session cookie. */
export const onRequest = defineMiddleware((context, next) => {
  const { url, cookies, redirect } = context;
  const path = url.pathname;
  const isAdminPage = path === '/admin' || path.startsWith('/admin/');

  if (!isAdminPage || path === '/admin/login') return next();

  let valid = false;
  try {
    const token = cookies.get(SESSION_COOKIE)?.value;
    valid = token !== undefined && verifySession(token, requireSessionSecret()) !== null;
  } catch {
    valid = false;
  }

  if (!valid) {
    const nextParam = encodeURIComponent(path + url.search);
    return redirect(`/admin/login?next=${nextParam}`);
  }
  return next();
});
