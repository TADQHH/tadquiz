import type { APIRoute } from 'astro';
import { getAdminSession, apiError, readJson } from '../../../lib/http';
import {
  getForm,
  updateFormMeta,
  replaceQuestions,
  deleteForm,
  slugExists,
} from '../../../db/forms.mjs';
import { validateFormPayload } from '../../../lib/form-validate';

interface Params {
  id: string;
}

function parseId(raw: string | undefined): number | null {
  const id = Number.parseInt(String(raw ?? ''), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const GET: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  const id = parseId(context.params.id);
  if (id === null) return apiError('ID không hợp lệ.', 400);
  const form = getForm(id);
  if (!form) return apiError('Không tìm thấy form.', 404);
  return Response.json(form);
};

export const PUT: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  const id = parseId(context.params.id);
  if (id === null) return apiError('ID không hợp lệ.', 400);
  const existing = getForm(id);
  if (!existing) return apiError('Không tìm thấy form.', 404);

  const payload = await readJson<unknown>(context.request);
  const result = validateFormPayload(payload);
  if (!result.ok || !result.value) return apiError(result.error ?? 'Payload không hợp lệ.', 400);

  if (result.value.slug !== existing.slug && slugExists(result.value.slug, id)) {
    return apiError(`Slug "${result.value.slug}" đã được dùng cho form khác.`, 409);
  }

  updateFormMeta(id, result.value);
  replaceQuestions(id, result.value.questions);
  const updated = getForm(id);
  return Response.json(updated);
};

export const DELETE: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  const id = parseId(context.params.id);
  if (id === null) return apiError('ID không hợp lệ.', 400);
  if (!getForm(id)) return apiError('Không tìm thấy form.', 404);
  deleteForm(id);
  return Response.json({ ok: true });
};
