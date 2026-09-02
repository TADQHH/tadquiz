import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '../../../lib/session.mjs';

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
