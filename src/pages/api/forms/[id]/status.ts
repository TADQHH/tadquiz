import type { APIRoute } from 'astro';
import { getAdminSession, apiError, readJson } from '../../../../lib/http';
import { getForm, setStatus } from '../../../../db/forms.mjs';

const STATUSES = new Set(['draft', 'published', 'closed']);

export const POST: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  const id = Number.parseInt(String(context.params.id ?? ''), 10);
  if (!Number.isInteger(id) || id <= 0) return apiError('ID không hợp lệ.', 400);

  const form = getForm(id);
  if (!form) return apiError('Không tìm thấy form.', 404);

  const body = await readJson<{ status?: string }>(context.request);
  const status = String(body?.status ?? '');
  if (!STATUSES.has(status)) return apiError('status phải là draft | published | closed.', 400);

  if (status === 'published' && form.questions.length === 0) {
    return apiError('Form chưa có câu hỏi — không thể xuất bản.', 400);
  }

  setStatus(id, status);
  return Response.json({ ok: true, status });
};
