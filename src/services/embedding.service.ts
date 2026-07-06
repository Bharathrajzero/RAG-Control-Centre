import { pipeline } from "@huggingface/transformers";

export class EmbeddingService {
  private static extractor: any = null;

  /**
   * Initializes or returns the cached local inference pipeline
   */
  private static async getExtractor() {
    if (!this.extractor) {
      // Lazy load model weights locally (approx 90MB downloaded once)
      this.extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
    }
    return this.extractor;
  }

  /**
   * Transforms plain text strings into 384-dimensional number arrays
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const extractor = await this.getExtractor();
      const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
      });

      // Convert ONNX runtime tensor values to native JavaScript arrays
      return Array.from(output.data);
    } catch (error) {
      throw new Error(`Local embedding generation failed: ${(error as Error).message}`);
    }
  }
}