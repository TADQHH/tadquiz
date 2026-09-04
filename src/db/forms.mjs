/** Form + question queries. */
import { getDb } from './client.mjs';
import { rowToForm, rowToQuestion } from './form-rows.mjs';

const QUESTION_TYPES = new Set([
  'text',
  'textarea',
  'single_choice',
  'multi_choice',
  'rating',
]);

/** @param {string} slug @param {number} [excludeId] */
export function slugExists(slug, excludeId) {
  const db = getDb();
  const row = excludeId
    ? db.prepare('SELECT id FROM forms WHERE slug = ? AND id != ?').get(slug, excludeId)
    : db.prepare('SELECT id FROM forms WHERE slug = ?').get(slug);
  return Boolean(row);
}

/** @param {{slug:string,title:string,description?:string,createdBy:number}} input */
export function createForm({ slug, title, description = '', createdBy }) {
  const info = getDb()
    .prepare('INSERT INTO forms (slug, title, description, created_by) VALUES (?, ?, ?, ?)')
    .run(slug, title, description, createdBy);
  return Number(info.lastInsertRowid);
}

/**
 * Sync the question set of a form inside one transaction, keyed by the stable
 * client key: existing rows keep their ids (so past answers survive edits),
 * new keys are inserted, keys missing from the payload are deleted (their
 * answers cascade away with the question).
 * @param {number} formId
 * @param {Array<{key:string,type:string,label:string,description?:string,options?:string[],required?:boolean,maxChars?:number|null,logic?:object|null}>} questions
 */
export function syncQuestions(formId, questions) {
  const db = getDb();
  const tx = db.transaction((list) => {
    const upsert = db.prepare(`
      INSERT INTO questions (form_id, key, type, label, description, options, required, position, max_chars, logic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (form_id, key) DO UPDATE SET
        type = excluded.type,
        label = excluded.label,
        description = excluded.description,
        options = excluded.options,
        required = excluded.required,
        position = excluded.position,
        max_chars = excluded.max_chars,
        logic = excluded.logic
    `);
    const keys = [];
    list.forEach((q, index) => {
      if (!QUESTION_TYPES.has(q.type)) throw new Error(`Unknown question type: ${q.type}`);
      keys.push(q.key);
      upsert.run(
        formId,
        q.key,
        q.type,
        q.label,
        q.description ?? '',
        JSON.stringify(q.options ?? []),
        q.required ? 1 : 0,
        index,
        q.maxChars ?? null,
        q.logic ? JSON.stringify(q.logic) : null,
      );
    });
    const placeholders = keys.map(() => '?').join(', ');
    db.prepare(`DELETE FROM questions WHERE form_id = ? AND key NOT IN (${placeholders})`).run(formId, ...keys);
  });
  tx(questions);
}

/** @param {number} id */
export function getForm(id) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT f.*,
        (SELECT COUNT(*) FROM responses r WHERE r.form_id = f.id) AS response_count,
        (SELECT COUNT(*) FROM questions q WHERE q.form_id = f.id) AS question_count
       FROM forms f WHERE f.id = ?`,
    )
    .get(id);
  if (!row) return null;
  const questions = db
    .prepare('SELECT * FROM questions WHERE form_id = ? ORDER BY position, id')
    .all(id)
    .map(rowToQuestion);
  return rowToForm(row, questions);
}

/** @param {string} slug */
export function getFormBySlug(slug) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT f.*,
        (SELECT COUNT(*) FROM responses r WHERE r.form_id = f.id) AS response_count,
        (SELECT COUNT(*) FROM questions q WHERE q.form_id = f.id) AS question_count
       FROM forms f WHERE f.slug = ?`,
    )
    .get(slug);
  if (!row) return null;
  const questions = db
    .prepare('SELECT * FROM questions WHERE form_id = ? ORDER BY position, id')
    .all(row.id)
    .map(rowToQuestion);
  return rowToForm(row, questions);
}

export function listForms() {
  return getDb()
    .prepare(
      `SELECT f.*,
        (SELECT COUNT(*) FROM responses r WHERE r.form_id = f.id) AS response_count,
        (SELECT COUNT(*) FROM questions q WHERE q.form_id = f.id) AS question_count
       FROM forms f ORDER BY f.updated_at DESC`,
    )
    .all()
    .map((row) => rowToForm(row));
}

/**
 * Explicit-field update: keys present in meta win (null clears), absent keys
 * keep their current value — this lets the editor clear a field back to null.
 * @param {number} id
 * @param {{title?:string,slug?:string,description?:string,completionUrl?:string|null,responseLimit?:number|null}} meta
 */
export function updateFormMeta(id, meta) {
  const db = getDb();
  const current = db.prepare('SELECT * FROM forms WHERE id = ?').get(id);
  if (!current) return false;
  const completionUrl =
    'completionUrl' in meta ? meta.completionUrl || null : current.completion_url ?? null;
  const responseLimit =
    'responseLimit' in meta ? meta.responseLimit ?? null : current.response_limit ?? null;
  db.prepare(
    "UPDATE forms SET title = ?, slug = ?, description = ?, completion_url = ?, response_limit = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
  ).run(
    meta.title ?? current.title,
    meta.slug ?? current.slug,
    meta.description ?? current.description,
    completionUrl,
    responseLimit,
    id,
  );
  return true;
}
export function setStatus(id, status) {
  const info = getDb()
    .prepare(
      "UPDATE forms SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
    )
    .run(status, id);
  return info.changes > 0;
}

/** @param {number} id */
export function deleteForm(id) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE form_id = ?)').run(id);
    db.prepare('DELETE FROM responses WHERE form_id = ?').run(id);
    db.prepare('DELETE FROM questions WHERE form_id = ?').run(id);
    db.prepare('DELETE FROM forms WHERE id = ?').run(id);
  });
  tx();
}

