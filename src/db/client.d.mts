import type Database from 'better-sqlite3';

export function initDb(path?: string): Database.Database;
export function getDb(): Database.Database;
export function resetDb(): void;
