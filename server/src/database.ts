import "dotenv/config";
import pg from "pg";

const {Pool} = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing! Please check the server/.env file");
}

export const pool = new Pool({
  connectionString,
  ssl: true,
  max: 5,
  connectionTimeoutMillis: 10000
});