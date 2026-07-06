// Local constants to keep controllers intact
export const KNOWLEDGE_COLLECTION = "document_chunks";
export const CACHE_COLLECTION = "semantic_cache";

interface VectorPoint {
  id: string;
  vector: number[];
  payload: any;
}

// Global in-memory data tables
const store: Record<string, VectorPoint[]> = {
  [KNOWLEDGE_COLLECTION]: [],
  [CACHE_COLLECTION]: []
};

// Cosine similarity helper calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Mocking QdrantClient methods to run fully local & zero-dependency
export const qdrant = {
  upsert: async (collectionName: string, data: { points: VectorPoint[] }) => {
    if (!store[collectionName]) store[collectionName] = [];
    
    for (const newPoint of data.points) {
      // Prevent duplicates by checking if ID exists
      store[collectionName] = store[collectionName].filter(p => p.id !== newPoint.id);
      store[collectionName].push(newPoint);
    }
    return { status: "ok" };
  },

  search: async (collectionName: string, params: { vector: number[]; limit: number; with_payload?: boolean }) => {
    const points = store[collectionName] || [];
    if (points.length === 0) return [];

    // Calculate score metrics against all stored entries
    const scored = points.map(point => ({
      id: point.id,
      score: cosineSimilarity(params.vector, point.vector),
      payload: point.payload
    }));

    // Sort highest similarity score first and enforce limit boundary
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, params.limit);
  }
};

// Keep placeholder initialization intact so server.ts boots smoothly
export async function initQdrant(): Promise<void> {
  console.log("⚡ Zero-Docker In-Memory Vector Engine active.");
}