import ollama from 'ollama';

export class LlmService {
  /**
   * Generates a grounded completion response using local Ollama models
   */
  static async generateAnswer(query: string, contexts: string[]): Promise<string> {
    const mergedContext = contexts.join("\n\n---\n\n");
    
    const structuredPrompt = `You are an advanced Enterprise RAG Assistant. 
Answer the user's question using ONLY the factual context provided below. 
If the context does not contain the answer, state clearly that you cannot answer based on the provided documents.

### PROVIDER DOCUMENT CONTEXT:
${mergedContext}

### USER QUESTION:
${query}`;

    try {
      // The SDK talks directly to the Ollama desktop application running in your system tray
      const response = await ollama.chat({
        model: 'llama3.2', // or 'mistral', 'phi3', etc.
        messages: [{ role: 'user', content: structuredPrompt }],
        options: {
          temperature: 0.1 // Keeps the model strictly focused on your document facts
        }
      });

      return response.message.content;
    } catch (error: any) {
      console.error("❌ Local Ollama pipeline execution failed:", error.message);
      return `[Ollama Fallback] Connected to local database, but your local LLM failed to respond. Source Context:\n\n${mergedContext.substring(0, 500)}...`;
    }
  }
}