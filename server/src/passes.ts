import { pool } from "./database.js";

export type PassData = {
  id: string;
  name: string;
  document: string;
  issuedAt: Date;
  status: "ACTIVE" | "CANCELLED";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function findPass(id: string): Promise<PassData | null> {
  if (!uuidPattern.test(id)) {
    return null;
  }

  const result = await pool.query<PassData>(
    `SELECT id, name, document, issued_at AS "issuedAt", status
     FROM passes
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export function isPassId(id: string): boolean {
  return uuidPattern.test(id);
}

export async function listPasses(): Promise<PassData[]> {
  const result = await pool.query<PassData>(
    `SELECT id, name, document, issued_at AS "issuedAt", status
     FROM passes
     ORDER BY issued_at DESC, id`
  );

  return result.rows;
}

export async function cancelPass(id: string): Promise<boolean> {
  if (!isPassId(id)) {
    return false;
  }

  const result = await pool.query(
    `UPDATE passes
     SET status = 'CANCELLED'
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rowCount === 1;
}

export async function deletePass(id: string): Promise<boolean> {
  if (!isPassId(id)) {
    return false;
  }

  const result = await pool.query(
    `DELETE FROM passes
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rowCount === 1;
}