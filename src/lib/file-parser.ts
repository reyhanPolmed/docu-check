import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * Parses a file buffer and returns extracted text content
 */
export async function parseFile(buffer: Buffer, originalName: string): Promise<string> {
  const extension = originalName.split(".").pop()?.toLowerCase();

  try {
    switch (extension) {
      case "txt":
        return buffer.toString("utf-8");
      case "pdf":
        const parser = new PDFParse({ data: buffer });
        const pdfData = await parser.getText();
        await parser.destroy();
        return pdfData.text;
      case "docx":
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      default:
        // Try as plain text if unknown
        return buffer.toString("utf-8");
    }
  } catch (error) {
    console.error(`Error parsing file ${originalName}:`, error);
    throw new Error(`Gagal membaca file ${originalName}. Format file mungkin rusak.`);
  }
}
