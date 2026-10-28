import { pool } from "./database.js";

const demoPasses = [
  {
    id: "11111111-1111-2111-3111-111111111111",
    name: "Demo Visitor 1",
    document: "DEMO-1",
    issued_at: new Date().toISOString(),
    status: "ACTIVE"
  },
  {
    id: "22222222-2222-2222-3222-222222222222",
    name: "Demo Visitor 2",
    document: "DEMO-2",
    issued_at: new Date().toISOString(),
    status: "CANCELLED"
  }
];

try {
  for (const pass of demoPasses) {
    await pool.query(
      `INSERT INTO passes (id, name, document, issued_at, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [pass.id, pass.name, pass.document, pass.issued_at, pass.status]
    );
  }

  console.log("Demo passes are ready");
} catch (error) {
  console.error("Adding demo passes failed");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
} finally {
  await pool.end();
}