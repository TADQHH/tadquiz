/** Custom-slug handling for public form URLs (/q/<slug>). */
import type { Question } from './types.ts';

export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'q',
  'login',
  'logout',
  'public',
  'assets',
  'static',
  'data',
  'favicon.ico',
  'robots.txt',
  '_astro',
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface SlugResult {
  ok: boolean;
  slug: string;
  error?: string;
}

/** Normalize free text into a slug candidate (strips Vietnamese diacritics). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
}

/** Validate a user-supplied slug (already normalized or raw). */
export function validateSlug(input: string): SlugResult {
  const slug = input.trim().toLowerCase().replace(/\s+/g, '-');
  if (slug.length < 3) {
    return { ok: false, slug, error: 'Slug cần ít nhất 3 ký tự.' };
  }
  if (slug.length > 64) {
    return { ok: false, slug: slug.slice(0, 64), error: 'Slug tối đa 64 ký tự.' };
  }
  if (!SLUG_RE.test(slug)) {
    return { ok: false, slug, error: 'Slug chỉ gồm a–z, 0–9 và dấu gạch ngang (không ở đầu/cuối).' };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, slug, error: `Slug "${slug}" được hệ thống giữ chỗ.` };
  }
  return { ok: true, slug };
}

/** Suggest a unique slug: base, base-2, base-3, … */
export function suggestUniqueSlug(base: string, exists: (slug: string) => boolean): string {
  const root = validateSlug(base).ok ? base : slugify(base) || 'form';
  if (!exists(root)) return root;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${root}-${i}`;
    if (!exists(candidate)) return candidate;
  }
  throw new Error('Không tìm được slug khả dụng.');
}

/** Used by tests / type imports to keep Question meaningful here. */
export type { Question };
