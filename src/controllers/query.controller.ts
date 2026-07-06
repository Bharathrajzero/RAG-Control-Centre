import { Request, Response } from 'express';
import { qdrant, KNOWLEDGE_COLLECTION } from '../config/qdrant.js'; 
import { db } from '../config/database.js'; 
import { EmbeddingService } from '../services/embedding.service.js'; 
import OpenAI from 'openai';
import crypto from 'crypto'; 

const apiKey = process.env.OPENAI_API_KEY || 'mock-key-for-now';
const openai = new OpenAI({ apiKey });

export const queryController = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query string is required." });

    // 1. Generate local embedding for incoming user query
    const queryVector = await EmbeddingService.generateEmbedding(query);

    // 2. CHECK SEMANTIC CACHE FIRST
    const cacheMatches = await qdrant.search('semantic_cache', {
      vector: queryVector,
      limit: 1,
      score_threshold: 0.92 
    });

    if (cacheMatches.length > 0) {
      return res.json({
        response: cacheMatches[0].payload?.response,
        source: 'semantic_cache'
      });
    }

    // 3. CACHE MISS -> Search for matching child vectors inside standard collection
    const childMatches = await qdrant.search(KNOWLEDGE_COLLECTION, {
      vector: queryVector,
      limit: 3 
    });

    if (childMatches.length === 0) {
      return res.json({ response: "I couldn't find any relevant context in the database.", source: 'live_generation' });
    }

    // 4. Extract unique, valid parent IDs from matching child payloads
    const parentIds = [...new Set(childMatches.map(match => match.payload?.parentId))].filter(Boolean);

    if (parentIds.length === 0) {
      return res.json({ response: "I couldn't find structural parent blocks for this context.", source: 'live_generation' });
    }

    // 5. Query LibSQL/SQLite using the modern async db.execute format
    const placeholders = parentIds.map(() => '?').join(',');
    
    // ✅ CRITICAL REFACTOR: Converted from db.prepare().all() to async db.execute()
    const result = await db.execute({
      sql: `SELECT text FROM parent_chunks WHERE id IN (${placeholders})`,
      args: parentIds as any[]
    });

    // Map LibSQL's row object properties out cleanly
    const contextText = result.rows.map(row => String(row.text)).join("\n\n");

    // 6. Execute OpenAI Chat Completion OR Fallback to local context mocking
    let aiResponse = "";

    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your_sk_') && process.env.OPENAI_API_KEY !== 'mock-key-for-now') {
      // Real API Mode
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are an enterprise AI assistant. Answer the user's question using ONLY the provided true document context. Context:\n\n${contextText}` },
          { role: "user", content: query }
        ]
      });
      aiResponse = completion.choices[0].message.content || "";
    } else {
      // 🚀 MOCK ENGINE MODE (Allows offline execution)
      aiResponse = `[MOCK LLM GENERATION - NO API KEY PROVIDED]\nBased on your retrieved document data, here is the context extracted:\n\n${contextText.substring(0, 500)}...`;
    }

    // 7. HYDRATE CACHE: Asynchronously save this query/response pair to cache collection
    await qdrant.upsert('semantic_cache', {
      wait: false,
      points: [{
        id: crypto.randomUUID(),
        vector: queryVector,
        payload: { query, response: aiResponse }
      }]
    });

    return res.json({
      response: aiResponse,
      source: 'live_generation'
    });

  } catch (error: any) {
    console.error("❌ Query pipeline failed:", error);
    // Explicit structured 500 payload allows frontend script exceptions to unmount gracefully
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};