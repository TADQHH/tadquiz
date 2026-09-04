/** Response + answer queries. */
import { getDb } from './client.mjs';

/**
 * Insert one submitted response with its answers, atomically.
 * @param {number} formId
 * @param {Array<{questionId:number, value:string}>} answers — value is JSON-encoded
 * @param {{ip?:string, userAgent?:string}} [meta]
 * @returns {number} response id
 */
export function insertResponse(formId, answers, meta = {}) {
  const db = getDb();
  const tx = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO responses (form_id, meta) VALUES (?, ?)')
      .run(formId, JSON.stringify(meta));
    const responseId = Number(info.lastInsertRowid);
    const insert = db.prepare(
      'INSERT INTO answers (response_id, question_id, value) VALUES (?, ?, ?)',
    );
    for (const a of answers) insert.run(responseId, a.questionId, a.value);
    return responseId;
  });
  return tx();
}

/**
 * @param {number} formId
 * @returns {Array<{id:number, submittedAt:string, answers:Record<string, unknown>}>}
 */
export function listResponses(formId) {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC, id DESC')
    .all(formId);
  if (rows.length === 0) return [];
  const answerStmt = db.prepare('SELECT * FROM answers WHERE response_id = ?');
  return rows.map((row) => {
    /** @type {Record<string, unknown>} */
    const answers = {};
    for (const a of answerStmt.all(row.id)) {
      answers[String(a.question_id)] = JSON.parse(a.value);
    }
    return { id: row.id, submittedAt: row.submitted_at, answers };
  });
}

/** Responses with id > afterId in submit order (oldest first) — for Grist sync. */
export function responsesAfter(formId, afterId) {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM responses WHERE form_id = ? AND id > ? ORDER BY id ASC')
    .all(formId, afterId);
  if (rows.length === 0) return [];
  const answerStmt = db.prepare('SELECT * FROM answers WHERE response_id = ?');
  return rows.map((row) => {
    const answers = {};
    for (const a of answerStmt.all(row.id)) {
      answers[String(a.question_id)] = JSON.parse(a.value);
    }
    return { id: row.id, submittedAt: row.submitted_at, answers };
  });
}

/** @param {number} formId */
export function responseStats(formId) {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT COUNT(*) AS total, MAX(submitted_at) AS latest FROM responses WHERE form_id = ?',
    )
    .get(formId);
  return { total: row.total, latest: row.latest ?? null };
}

/** Number of responses received for a form — used to enforce response limits. */
export function countResponses(formId) {
  return getDb().prepare('SELECT COUNT(*) AS n FROM responses WHERE form_id = ?').get(formId).n;
}
