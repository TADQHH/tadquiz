export interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export function createAdmin(username: string, passwordHash: string): { id: number; username: string };
export function findByUsername(username: string): AdminRow | undefined;
export function findAdminById(id: number): AdminRow | undefined;
export function updatePassword(id: number, passwordHash: string): void;
export function upsertAdmin(
  username: string,
  passwordHash: string,
): { id: number; username: string; created: boolean };
