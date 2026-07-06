import { Request, Response } from "express";
import { extractTextFromPdf } from "../utils/pdf.js";
import { createParentChildChunks } from "../utils/chunker.js";
import { StorageService } from "../services/storage.service.js";
import { EmbeddingService } from "../services/embedding.service.js";
import { qdrant, KNOWLEDGE_COLLECTION } from "../config/qdrant.js";

export async function ingestDocument(req: Request, res: Response): Promise<void> {
  try {
    // 1. Structural Guard: Verify Multer successfully parsed and attached the file buffer
    if (!req.file) {
      res.status(400).json({ error: "Missing required file attachment." });
      return;
    }

    // 2. Convert file buffer into clean plain text string
    const text = await extractTextFromPdf(req.file.buffer);

    // 3. Fragment text into paired, hierarchical window chunks
    const parentChunks = createParentChildChunks(text);

    // 4. Database Transaction: Persist the heavy parent text strings into LibSQL/SQLite
    await StorageService.saveParentChunks(parentChunks);

    // 5. Flatten out the hierarchical child array into a single flat processing list
    const flatChildren = parentChunks.flatMap(parent => 
      parent.children.map(child => ({
        id: child.id,
        parentId: parent.id, // Enforce relational cross-reference link
        text: child.text
      }))
    );

    // 6. Network Optimization: Fire off embedding requests concurrently
    const points = await Promise.all(
      flatChildren.map(async (child) => {
        const vector = await EmbeddingService.generateEmbedding(child.text);
        return {
          id: child.id,
          vector: vector,
          payload: {
            parentId: child.parentId,
            text: child.text,
          },
        };
      })
    );

    // 7. Vector Storage Transaction: Upload the indexed child vectors to Qdrant
    if (points.length > 0) {
      await qdrant.upsert(KNOWLEDGE_COLLECTION, {
        wait: true,
        points,
      });
    }

    // 8. Return comprehensive payload generation statistics
    res.status(200).json({
      message: "Ingestion pipeline completed successfully.",
      stats: {
        parentsProcessed: parentChunks.length,
        childVectorsIndexed: points.length,
      },
    });
  } catch (error) {
    console.error("Ingestion pipeline failed:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}