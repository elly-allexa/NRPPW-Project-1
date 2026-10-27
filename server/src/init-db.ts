import { readFile } from "node:fs/promises";
import { pool } from "./database.js";

try {
  const sql = await readFile(
    new URL("../sql/create-passes.sql", import.meta.url),
    "utf8"
  );

  await pool.query(sql);

  console.log("Table of passes is ready"); 
} catch (error) {
  console.error("Database initialization failed");

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = 1;
} finally {
  await pool.end();
}