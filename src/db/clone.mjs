/** Clone a form (questions, logic, settings) into a fresh draft copy. */
import { getDb } from './client.mjs';
import { slugExists } from './forms.mjs';

/** Find a free slug: base, base-2, base-3… */
function freeSlug(base) {
  const db = getDb();
  let slug = base;
  let n = 2;
  while (db.prepare('SELECT id FROM forms WHERE slug = ?').get(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

/**
 * Clone form `id` for `adminId`: new draft with "-copy" slug, copied
 * questions (same keys so logic references stay valid), settings copied,
 * responses and Grist wiring NOT copied.
 * @returns {number|null} new form id, or null when source missing.
 */
export function cloneForm(id, adminId) {
  const db = getDb();
  const src = db.prepare('SELECT * FROM forms WHERE id = ?').get(id);
  if (!src) return null;
  const questions = db
    .prepare('SELECT * FROM questions WHERE form_id = ? ORDER BY position, id')
    .all(id);

  const clone = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO forms (slug, title, description, status, completion_url, response_limit, created_by)
         VALUES (?, ?, ?, 'draft', ?, ?, ?)`,
      )
      .run(
        freeSlug(`${src.slug}-copy`),
        `${src.title} (bản sao)`,
        src.description,
        src.completion_url ?? null,
        src.response_limit ?? null,
        adminId,
      );
    const newId = Number(info.lastInsertRowid);
    const insert = db.prepare(
      `INSERT INTO questions (form_id, key, type, label, description, options, required, position, max_chars, logic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    questions.forEach((q) => {
      insert.run(
        newId, q.key, q.type, q.label, q.description, q.options,
        q.required, q.position, q.max_chars, q.logic,
      );
    });
    return newId;
  });
  return clone();
}
