import type { APIRoute } from 'astro';
import { apiError, getAdminSession } from '../../../../lib/http';
import { getForm } from '../../../../db/forms.mjs';
import { cloneForm } from '../../../../db/clone.mjs';

function parseId(raw: string | undefined): number | null {
  const id = Number.parseInt(String(raw ?? ''), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const POST: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  const id = parseId(context.params.id);
  if (id === null) return apiError('ID không hợp lệ.', 400);

  const source = getForm(id);
  if (!source) return apiError('Không tìm thấy form.', 404);

  const admin = getAdminSession(context);
  const newId = cloneForm(id, admin!.id);
  if (newId === null) return apiError('Không nhân bản được form.', 500);

  const copy = getForm(newId);
  if (!copy) return apiError('Không nhân bản được form.', 500);
  return Response.json(
    { ok: true, id: copy.id, slug: copy.slug, title: copy.title },
    { status: 201 },
  );
};
