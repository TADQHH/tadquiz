/** SQLite access layer. Plain .mjs so both the server and CLI scripts share it. */
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

/** @type {Database.Database | null} */
let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  completion_url TEXT,
  response_limit INTEGER,
  grist_doc_id TEXT,
  grist_table_id TEXT,
  grist_url TEXT,
  grist_synced_response_id INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES admins(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  key TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('text','textarea','single_choice','multi_choice','rating')),
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  options TEXT NOT NULL DEFAULT '[]',
  required INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  max_chars INTEGER,
  logic TEXT
);

CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  meta TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_form ON questions(form_id, position);
CREATE INDEX IF NOT EXISTS idx_responses_form ON responses(form_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
`;

/** @param {string} pathStr */
export function initDb(pathStr) {
  const file = pathStr || process.env.DATABASE_PATH || './data/tadquiz.sqlite';
  if (file !== ':memory:') mkdirSync(dirname(resolve(file)), { recursive: true });
  if (db) db.close();
  db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Idempotent migrations for databases created before later features. */
function migrate(database) {
  const columns = new Set(
    database.pragma('table_info(questions)').map((col) => col.name),
  );
  if (!columns.has('key')) {
    database.exec("ALTER TABLE questions ADD COLUMN key TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.has('logic')) {
    database.exec('ALTER TABLE questions ADD COLUMN logic TEXT');
  }
  database.exec("UPDATE questions SET key = 'q' || id WHERE key = ''");
  database.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_form_key ON questions(form_id, key)',
  );

  const formColumns = new Set(
    database.pragma('table_info(forms)').map((col) => col.name),
  );
  for (const col of ['grist_doc_id', 'grist_table_id', 'grist_url']) {
    if (!formColumns.has(col)) {
      database.exec(`ALTER TABLE forms ADD COLUMN ${col} TEXT`);
    }
  }
  if (!formColumns.has('completion_url')) {
    database.exec('ALTER TABLE forms ADD COLUMN completion_url TEXT');
  }
  if (!formColumns.has('response_limit')) {
    database.exec('ALTER TABLE forms ADD COLUMN response_limit INTEGER');
  }
  if (!formColumns.has('grist_synced_response_id')) {
    database.exec(
      'ALTER TABLE forms ADD COLUMN grist_synced_response_id INTEGER NOT NULL DEFAULT 0',
    );
  }
}

export function getDb() {
  if (!db) initDb();
  return db;
}

/** Test hook — closes and forgets the singleton. */
export function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
}
