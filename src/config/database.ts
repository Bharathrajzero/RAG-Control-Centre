import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL || "file:new.db";

export const db = createClient({
  url: url,
});

/**
 * Initializes database schemas if they don't exist.
 */
export async function initDatabase(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS parent_chunks (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}