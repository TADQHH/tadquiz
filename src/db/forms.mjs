/** Form + question queries. */
import { getDb } from './client.mjs';

const QUESTION_TYPES = new Set([
  'text',
  'textarea',
  'single_choice',
  'multi_choice',
  'rating',
]);

function rowToQuestion(row) {
  return {
    id: row.id,
    formId: row.form_id,
    type: row.type,
    label: row.label,
    description: row.description,
    options: JSON.parse(row.options),
    required: row.required === 1,
    position: row.position,
    maxChars: row.max_chars === null ? null : row.max_chars,
  };
}

function rowToForm(row, questions = []) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status,
    responseCount: questions.__count ?? row.response_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    questions,
  };
}

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
 * Replace the full question set of a form inside one transaction.
 * @param {number} formId
 * @param {Array<{type:string,label:string,description?:string,options?:string[],required?:boolean,maxChars?:number|null}>} questions
 */
export function replaceQuestions(formId, questions) {
  const db = getDb();
  const tx = db.transaction((list) => {
    db.prepare('DELETE FROM questions WHERE form_id = ?').run(formId);
    const insert = db.prepare(
      'INSERT INTO questions (form_id, type, label, description, options, required, position, max_chars) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    list.forEach((q, index) => {
      if (!QUESTION_TYPES.has(q.type)) throw new Error(`Unknown question type: ${q.type}`);
      insert.run(
        formId,
        q.type,
        q.label,
        q.description ?? '',
        JSON.stringify(q.options ?? []),
        q.required ? 1 : 0,
        index,
        q.maxChars ?? null,
      );
    });
  });
  tx(questions);
}

/** @param {number} id */
export function getForm(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM forms WHERE id = ?').get(id);
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
  const row = db.prepare('SELECT * FROM forms WHERE slug = ?').get(slug);
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
      `SELECT f.*, COUNT(r.id) AS response_count
       FROM forms f LEFT JOIN responses r ON r.form_id = f.id
       GROUP BY f.id ORDER BY f.updated_at DESC`,
    )
    .all()
    .map((row) => rowToForm(row));
}

/**
 * @param {number} id
 * @param {{title?:string,slug?:string,description?:string}} meta
 */
export function updateFormMeta(id, meta) {
  const db = getDb();
  const current = db.prepare('SELECT * FROM forms WHERE id = ?').get(id);
  if (!current) return false;
  db.prepare(
    "UPDATE forms SET title = ?, slug = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
  ).run(
    meta.title ?? current.title,
    meta.slug ?? current.slug,
    meta.description ?? current.description,
    id,
  );
  return true;
}

/** @param {number} id @param {'draft'|'published'|'closed'} status */
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
