import { pool } from "./database.js";

try {
  const result = await pool.query(
    "SELECT NOW() AS database_time"
  );

  console.log("Database connection works!");
  console.log(result.rows[0]);
} catch (error) {
  console.error("Database connection failed");

  if (error instanceof Error) {
    console.error(error.message);
  }
  
  process.exitCode = 1;
} finally {
  await pool.end();
}