/** Grist sync service — bridges TADQuiz responses into a Grist doc.
 *
 * Model: one Grist doc per form, one table "PhanHoi", one column per question
 * (labels are column ids, trimmed to ASCII-ish). A per-form cursor
 * (grist_synced_response_id) tracks which responses were already pushed, so
 * syncs are incremental and idempotent-ish (at-least-once, never re-push).
 */
import { getForm } from '../db/forms.mjs';
import { updateFormGrist, markGristSynced } from '../db/grist.mjs';
import { responsesAfter } from '../db/responses.mjs';
import { gristEnabled, createDoc, ensureTable, addRecords } from './grist.mjs';

/** Column value for one answer, shaped for Grist. */
function cell(value) {
  if (Array.isArray(value)) return value.join(' | ');
  if (value === undefined || value === null) return '';
  return value;
}

/**
 * Ensure the form has a Grist doc + table; create on first use.
 * Returns updated form (with grist fields) or throws.
 */
export async function ensureGristDoc(form, origin) {
  if (form.grist?.docId) return form;
  const docId = await createDoc(form);
  await ensureTable(docId, form, form.questions);
  const gristBase =
    (process.env.GRIST_PUBLIC_URL ?? '').replace(/\/$/, '') ||
    (origin ?? '').replace(/\/$/, '');
  const grist = {
    docId,
    tableId: 'PhanHoi',
    url: gristBase ? `${gristBase}/doc/${docId}/t/PhanHoi` : null,
    syncedResponseId: form.grist?.syncedResponseId ?? 0,
  };
  updateFormGrist(form.id, grist);
  return { ...form, grist };
}
/**
 * Push unsynced responses (id > cursor). Creates the doc if needed.
 * Returns { synced: number, url: string|null }.
 */
export async function syncFormToGrist(formId, origin) {
  if (!gristEnabled()) return { synced: 0, url: null, disabled: true };
  let form = getForm(formId);
  if (!form) throw new Error('Không tìm thấy form.');
  form = await ensureGristDoc(form, origin);

  const cursor = form.grist.syncedResponseId ?? 0;
  const rows = responsesAfter(formId, cursor);
  if (rows.length > 0) {
    // Column per question, computed identically to ensureTable.
    const seen = new Set();
    const { columnId } = await import('./grist.mjs');
    const colIds = ['ResponseID', 'SubmittedAt'];
    for (const [i, q] of form.questions.entries()) {
      colIds.push(columnId(q.label, i, seen));
    }
    const records = rows.map((row) => {
      const fields = { ResponseID: row.id, SubmittedAt: row.submittedAt };
      for (const [i, q] of form.questions.entries()) {
        fields[colIds[i + 2]] = cell(row.answers[String(q.id)]);
      }
      return { fields };
    });
    await addRecords(form.grist.docId, records);
    markGristSynced(formId, rows[rows.length - 1].id);
  }
  return { synced: rows.length, url: form.grist.url };
}
