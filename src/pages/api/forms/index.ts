import type { APIRoute } from 'astro';
import { getAdminSession, apiError, readJson } from '../../../lib/http';
import { listForms, createForm, slugExists } from '../../../db/forms.mjs';
import { slugify, validateSlug, suggestUniqueSlug } from '../../../lib/slug';

export const GET: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  return Response.json(listForms());
};

export const POST: APIRoute = async (context) => {
  const admin = getAdminSession(context);
  if (!admin) return apiError('Chưa đăng nhập.', 401);

  const body = await readJson<{ title?: string; slug?: string }>(context.request);
  if (!body) return apiError('Payload không hợp lệ.', 400);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title === '') return apiError('Form cần tiêu đề.', 400);
  if (title.length > 200) return apiError('Tiêu đề tối đa 200 ký tự.', 400);

  const requested = typeof body.slug === 'string' && body.slug.trim() !== ''
    ? body.slug
    : slugify(title);
  const check = validateSlug(requested);
  const slug = check.ok
    ? suggestUniqueSlug(check.slug, (s) => slugExists(s))
    : suggestUniqueSlug(requested, (s) => slugExists(s));

  const id = createForm({ slug, title, description: '', createdBy: admin.id });
  return Response.json({ id, slug }, { status: 201 });
};
