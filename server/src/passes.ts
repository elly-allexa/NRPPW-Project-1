import { pool } from "./database.js";

type PassData = {
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