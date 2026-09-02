export interface ResponseRow {
  id: number;
  submittedAt: string;
  answers: Record<string, unknown>;
}

export function insertResponse(
  formId: number,
  answers: Array<{ questionId: number; value: string }>,
  meta?: { ip?: string | null; userAgent?: string | null },
): number;
export function listResponses(formId: number): ResponseRow[];
export function responseStats(formId: number): { total: number; latest: string | null };
