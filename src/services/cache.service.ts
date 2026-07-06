import { qdrant, CACHE_COLLECTION } from "../config/qdrant.js";
import { v4 as uuidv4 } from "uuid";

export class CacheService {
  /**
   * Searches the semantic cache for highly similar pre-existing questions
   * @param queryVector The vectorized user query
   * @param threshold Cosine similarity score match limit (0.0 to 1.0)
   */
  static async checkCache(queryVector: number[], threshold: number = 0.92): Promise<string | null> {
    try {
      const searchResult = await qdrant.search(CACHE_COLLECTION, {
        vector: queryVector,
        limit: 1,
        with_payload: true,
      });

      if (searchResult.length > 0 && searchResult[0].score >= threshold) {
        const payload = searchResult[0].payload;
        return payload && typeof payload.response === "string" ? payload.response : null;
      }
      
      return null;
    } catch (error) {
      console.error("Semantic cache lookup failed, passing through:", error);
      return null; // Fallback to live generation on cache errors
    }
  }

  /**
   * Saves a newly generated LLM answer to the semantic cache
   */
  static async setCache(queryVector: number[], originalQuery: string, responseText: string): Promise<void> {
    try {
      await qdrant.upsert(CACHE_COLLECTION, {
        wait: false,
        points: [
          {
            id: uuidv4(),
            vector: queryVector,
            payload: {
              query: originalQuery,
              response: responseText,
              cached_at: new Date().toISOString(),
            },
          },
        ],
      });
    } catch (error) {
      console.error("Failed to write to semantic cache:", error);
    }
  }
}