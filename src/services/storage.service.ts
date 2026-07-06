import { db } from "../config/database.js";
import { ParentChunk } from "../utils/chunker.js";

export class StorageService {
  /**
   * Persists parent chunks directly into the local database
   */
  static async saveParentChunks(chunks: ParentChunk[]): Promise<void> {
    // We execute inside a batch transaction for optimal local I/O performance
    const statements = chunks.map((chunk) => ({
      sql: "INSERT OR REPLACE INTO parent_chunks (id, text) VALUES (?, ?)",
      args: [chunk.id, chunk.text],
    }));

    await db.batch(statements, "write");
  }

  /**
   * Fetches multiple parent chunks by their unique IDs to build prompt context
   */
  static async getParentChunksByIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];

    // Create a safe, parameterized IN clause mapping dynamically to IDs
    const placeholders = ids.map(() => "?").join(",");
    const query = `SELECT text FROM parent_chunks WHERE id IN (${placeholders})`;

    const result = await db.execute({
      sql: query,
      args: ids,
    });

    return result.rows.map((row) => row.text as string);
  }
}