import type { APIRoute } from 'astro';
import { apiError, readJson } from '../../../../lib/http';
import { getFormBySlug } from '../../../../db/forms.mjs';
import { insertResponse } from '../../../../db/responses.mjs';
import { validateAnswers } from '../../../../lib/validate';
import { checkRate } from '../../../../lib/ratelimit.mjs';

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  const slug = String(params.slug ?? '');
  if (!checkRate(`submit:${clientAddress ?? 'unknown'}`, { limit: 10, windowMs: 60_000 })) {
    return apiError('Bạn gửi nhanh quá — thử lại sau một phút.', 429);
  }

  const form = getFormBySlug(slug);
  if (!form) return apiError('Không tìm thấy form.', 404);
  if (form.status !== 'published') return apiError('Form này hiện không nhận phản hồi.', 403);

  const body = await readJson<{ answers?: Record<string, unknown> }>(request);
  if (!body || typeof body.answers !== 'object' || body.answers === null) {
    return apiError('Payload không hợp lệ.', 400);
  }

  // Ignore unknown question ids — validate only real questions.
  const result = validateAnswers(form.questions, body.answers);
  if (!result.ok) {
    return Response.json(
      { error: 'Còn câu chưa hợp lệ.', fields: result.errors },
      { status: 400 },
    );
  }

  const answers = Object.entries(result.values).map(([questionId, value]) => ({
    questionId: Number(questionId),
    value: JSON.stringify(value),
  }));
  const responseId = insertResponse(form.id, answers, {
    ip: clientAddress ?? null,
    userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
  });

  return Response.json({ ok: true, responseId, redirect: `/q/${form.slug}/done` }, { status: 201 });
};
