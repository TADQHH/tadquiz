import type { APIRoute } from 'astro';
import { getAdminSession, apiError } from '../../../../lib/http';
import { getForm } from '../../../../db/forms.mjs';
import { listResponses } from '../../../../db/responses.mjs';
import { toCsv, answerToCell } from '../../../../lib/csv';

export const GET: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  const id = Number.parseInt(String(context.params.id ?? ''), 10);
  if (!Number.isInteger(id) || id <= 0) return apiError('ID không hợp lệ.', 400);

  const form = getForm(id);
  if (!form) return apiError('Không tìm thấy form.', 404);

  const rows = listResponses(id);
  const headers = ['ID', 'Thời gian gửi', ...form.questions.map((q) => q.label)];
  const body = rows.map((row) => [
    String(row.id),
    row.submittedAt,
    ...form.questions.map((q) => answerToCell(row.answers[String(q.id)])),
  ]);

  const csv = toCsv(headers, body);
  const filename = `tadquiz-${form.slug}-responses.csv`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
};
