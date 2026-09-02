import type { APIRoute } from 'astro';
import { getAdminSession, apiError } from '../../../../lib/http';
import { getForm } from '../../../../db/forms.mjs';
import { gristEnabled } from '../../../../lib/grist.mjs';
import { syncFormToGrist } from '../../../../lib/grist-sync.mjs';

export const POST: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  const id = Number.parseInt(String(context.params.id ?? ''), 10);
  if (!Number.isInteger(id) || id <= 0) return apiError('ID không hợp lệ.', 400);
  const form = getForm(id);
  if (!form) return apiError('Không tìm thấy form.', 404);

  if (!gristEnabled()) {
    return apiError(
      'Chưa cấu hình Grist: set GRIST_API_KEY trong .env (tạo key trong Grist → Account Settings → API).',
      503,
    );
  }

  // Public origin the admin browser can reach (Grist lives next to the app).
  const origin = context.url.searchParams.get('origin') ?? '';

  try {
    const result = await syncFormToGrist(id, origin);
    return Response.json({
      ok: true,
      synced: result.synced,
      url: result.url,
      docId: form.grist?.docId ?? null,
    });
  } catch (err) {
    return apiError(`Đồng bộ Grist lỗi: ${err instanceof Error ? err.message : String(err)}`, 502);
  }
};
