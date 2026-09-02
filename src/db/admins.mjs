/** Admin account queries. Accounts are created via scripts/create-admin.mjs only. */
import { getDb } from './client.mjs';

/**
 * @param {string} username
 * @param {string} passwordHash
 */
export function createAdmin(username, passwordHash) {
  const db = getDb();
  const info = db
    .prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash);
  return { id: Number(info.lastInsertRowid), username };
}

/** @param {string} username */
export function findByUsername(username) {
  return getDb().prepare('SELECT * FROM admins WHERE username = ? COLLATE NOCASE').get(username);
}

/** @param {number} id */
export function findAdminById(id) {
  return getDb().prepare('SELECT * FROM admins WHERE id = ?').get(id);
}

/** @param {number} id @param {string} passwordHash */
export function updatePassword(id, passwordHash) {
  getDb()
    .prepare(
      "UPDATE admins SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
    )
    .run(passwordHash, id);
}

/**
 * Create or reset an admin account.
 * @param {string} username @param {string} passwordHash
 * @returns {{ id: number, username: string, created: boolean }}
 */
export function upsertAdmin(username, passwordHash) {
  const existing = findByUsername(username);
  if (existing) {
    updatePassword(existing.id, passwordHash);
    return { id: existing.id, username, created: false };
  }
  const created = createAdmin(username, passwordHash);
  return { ...created, created: true };
}
