/** Grist REST API client (server-side only).
 *
 * Auth: API key header. Docs: https://support.getgrist.com/api/
 * Flow per form: create workspace doc → ensure table + columns → add records.
 */
import { env } from './env.mjs';

const MAX_LABEL_LEN = 60;

export function gristEnabled() {
  return env('GRIST_API_KEY') !== '';
}

/** @param {string} path @param {RequestInit} init */
async function api(path, init = {}) {
  const base = env('GRIST_URL', 'http://grist:8484').replace(/\/$/, '');
  const res = await fetch(`${base}/api${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env('GRIST_API_KEY')}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Grist ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.headers.get('content-type')?.includes('json') ? res.json() : null;
}

/** Grist column id: ASCII, no spaces — keep readable, dedupe clashes. */
export function columnId(label, index, seen) {
  const base =
    label
      .replace(/[Đđ]/g, (d) => (d === 'Đ' ? 'D' : 'd'))
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, MAX_LABEL_LEN) || `C${index + 1}`;
  let id = base;
  let n = 2;
  while (seen.has(id)) id = `${base}_${n++}`;
  seen.add(id);
  return id;
}


/** Create a doc named for the form inside the first workspace of the personal org. */
export async function createDoc(form) {
  const orgs = await api('/orgs');
  const org = orgs[0];
  if (!org) throw new Error('Grist chưa có org nào.');
  const ws = await api(`/workspaces/${org.id}`);
  if (!ws || !ws.id) throw new Error('Grist chưa có workspace nào.');
  const doc = await api(`/workspaces/${ws.id}/docs`, {
    method: 'POST',
    body: JSON.stringify({ name: form.title }),
  });
  return String(doc);
}

/**
 * Ensure the response table exists with one column per question (plus meta).
 * Grist adds a default `manualSort` column; that stays harmless at the end.
 * @param {string} docId
 * @param {Array<{label:string}>} questions
 */
export async function ensureTable(docId, form, questions) {
  const seen = new Set();
  const cols = [
    { id: 'ResponseID' },
    { id: 'SubmittedAt' },
    ...questions.map((q, i) => ({ id: columnId(q.label, i, seen), label: q.label })),
  ];
  await api(`/docs/${docId}/tables`, {
    method: 'POST',
    body: JSON.stringify({ tables: [{ id: 'PhanHoi', columns: cols }] }),
  });
  return cols;
}

/** Add columns when the form gained new questions since doc creation. */
export async function addColumns(docId, form, questions) {
  const seen = new Set();
  const cols = questions.map((q, i) => ({ id: columnId(q.label, i, seen), label: q.label }));
  await api(`/docs/${docId}/tables/PhanHoi/columns`, {
    method: 'POST',
    body: JSON.stringify({ columns: cols }),
  });
}

/**
 * Append response rows. `records` = [{ fields: { colId: value } }].
 * Returns count added.
 */
export async function addRecords(docId, records) {
  if (records.length === 0) return 0;
  await api(`/docs/${docId}/tables/PhanHoi/records`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
  return records.length;
}
