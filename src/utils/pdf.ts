import pdf from 'pdf-parse';

/**
 * Extracts raw text content from a PDF file buffer.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    // Clean up excessive whitespace and newlines
    return data.text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    throw new Error(`PDF Parsing failed: ${(error as Error).message}`);
  }
}