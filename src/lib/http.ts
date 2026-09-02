/** Helpers shared by all API endpoints. */
import type { APIContext } from 'astro';
import { verifySession, SESSION_COOKIE } from './session.mjs';
import { requireSessionSecret } from './env.mjs';

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(init?.headers ?? {}) },
  });
}

export function apiError(message: string, status = 400): Response {
  return json({ error: message }, { status });
}

export interface AdminSession {
  id: number;
  username: string;
}

/** Extract the logged-in admin from the session cookie, or null. */
export function getAdminSession(context: APIContext): AdminSession | null {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = verifySession(token, requireSessionSecret());
    if (!payload) return null;
    return { id: payload.sub, username: payload.un };
  } catch {
    return null;
  }
}


/** Safe JSON body read; null on parse errors. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
