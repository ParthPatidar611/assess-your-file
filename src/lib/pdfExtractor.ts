import { extractText } from "unpdf";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENTS = 3;
export const MAX_CHARS_PER_DOCUMENT = 10000;
export const MAX_TOTAL_DOCUMENT_CHARS = 25000;

export interface InputDocument {
    name: string;
    size: number;
    buffer: Uint8Array;
}

export interface ProcessedDocumentItem {
    fileName: string;
    fileSize: number;
    pageCount: number;
    charCount: number;
    status: "processed" | "empty_or_scanned" | "failed" | "rejected";
    requiresOcr: boolean;
    warning?: string;
    summaryExcerpt?: string;
}

export interface DocumentProcessingReport {
    documentsReceived: string[];
    documentsProcessed: string[];
    documentsFailed: string[];
    documentsRequiringOcr: string[];
    items: ProcessedDocumentItem[];
    totalCharactersExtracted: number;
    extractionNotice?: string;
}

export interface ExtractionResult {
    success: boolean;
    combinedDocumentText: string;
    report: DocumentProcessingReport;
    errors: string[];
}

/**
 * Validates whether the binary data starts with the PDF magic bytes (%PDF-).
 * According to ISO 32000-1, the header must appear in the first 1024 bytes.
 */
export function isValidPdfSignature(data: Uint8Array): boolean {
    if (data.length < 5) return false;
    const searchLimit = Math.min(data.length - 4, 1024);
    for (let i = 0; i < searchLimit; i++) {
        if (
            data[i] === 0x25 && // %
            data[i + 1] === 0x50 && // P
            data[i + 2] === 0x44 && // D
            data[i + 3] === 0x46 && // F
            data[i + 4] === 0x2d    // -
        ) {
            return true;
        }
    }
    return false;
}

/**
 * Cleans extracted page text while preserving paragraph structure.
 */
function cleanExtractedPage(rawPage: string): string {
    return rawPage
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // Normalise tabs and multiple spaces within lines
        .replace(/[ \t]+/g, " ")
        // Keep double line breaks for paragraphs, remove excessive vertical spacing
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Extracts and validates text from an array of submitted PDF documents.
 */
export async function processUploadedDocuments(
    documents: InputDocument[]
): Promise<ExtractionResult> {
    const report: DocumentProcessingReport = {
        documentsReceived: [],
        documentsProcessed: [],
        documentsFailed: [],
        documentsRequiringOcr: [],
        items: [],
        totalCharactersExtracted: 0,
    };

    const errors: string[] = [];
    const documentTextBlocks: string[] = [];

    // Check document count limit
    if (documents.length > MAX_DOCUMENTS) {
        errors.push(
            `A maximum of ${MAX_DOCUMENTS} supporting documents can be attached per assessment. Received ${documents.length}.`
        );
    }

    const docsToProcess = documents.slice(0, MAX_DOCUMENTS);

    for (let idx = 0; idx < docsToProcess.length; idx++) {
        const doc = docsToProcess[idx];
        const fileName = doc.name || `Document_${idx + 1}.pdf`;
        report.documentsReceived.push(fileName);

        // 1. File Size Validation
        if (doc.size > MAX_FILE_SIZE_BYTES) {
            const sizeMb = (doc.size / (1024 * 1024)).toFixed(1);
            const warning = `File "${fileName}" (${sizeMb} MB) exceeds the maximum allowed size of 5 MB.`;
            report.documentsFailed.push(fileName);
            report.items.push({
                fileName,
                fileSize: doc.size,
                pageCount: 0,
                charCount: 0,
                status: "rejected",
                requiresOcr: false,
                warning,
            });
            errors.push(warning);
            continue;
        }

        // 2. PDF Signature Validation
        if (!isValidPdfSignature(doc.buffer)) {
            const warning = `File "${fileName}" does not have a valid PDF header (%PDF-). It may be corrupted or a non-PDF file.`;
            report.documentsFailed.push(fileName);
            report.items.push({
                fileName,
                fileSize: doc.size,
                pageCount: 0,
                charCount: 0,
                status: "rejected",
                requiresOcr: false,
                warning,
            });
            errors.push(warning);
            continue;
        }

        // 3. Extract Text via unpdf
        try {
            const { text: pagesText, totalPages } = await extractText(
                doc.buffer
            );

            const pageCount = totalPages || (Array.isArray(pagesText) ? pagesText.length : 1);
            const pages = Array.isArray(pagesText) ? pagesText : [pagesText || ""];

            const cleanedPages = pages
                .map((p, pageIdx) => {
                    const cleaned = cleanExtractedPage(p);
                    return cleaned ? `[Page ${pageIdx + 1}]\n${cleaned}` : "";
                })
                .filter(Boolean);

            const fullText = cleanedPages.join("\n\n");
            const nonWhitespaceLength = fullText.replace(/\s+/g, "").length;

            // 4. Detect Scanned or Empty PDF
            if (pageCount > 0 && nonWhitespaceLength < 20) {
                const warning = `Document "${fileName}" (${pageCount} page${pageCount > 1 ? "s" : ""}) contains no extractable digital text. It appears to be a scanned or image-only PDF and requires OCR processing.`;
                report.documentsRequiringOcr.push(fileName);
                report.items.push({
                    fileName,
                    fileSize: doc.size,
                    pageCount,
                    charCount: 0,
                    status: "empty_or_scanned",
                    requiresOcr: true,
                    warning,
                });

                documentTextBlocks.push(
                    `--- DOCUMENT ${idx + 1}: ${fileName} (Pages: ${pageCount}, Status: Scanned / Image-Only) ---\n` +
                    `[WARNING: Text extraction yielded no digital characters. This document appears to be scanned or image-based and requires OCR. Content could not be analysed.]`
                );
                continue;
            }

            // 5. Normal text extracted successfully
            let textToInclude = fullText;
            if (textToInclude.length > MAX_CHARS_PER_DOCUMENT) {
                textToInclude =
                    textToInclude.slice(0, MAX_CHARS_PER_DOCUMENT) +
                    `\n\n[... Note: Text from ${fileName} truncated at ${MAX_CHARS_PER_DOCUMENT} characters for preliminary assessment ...]`;
            }

            const charCount = fullText.length;
            report.totalCharactersExtracted += charCount;
            report.documentsProcessed.push(fileName);

            // Summary excerpt (first 250 characters)
            const summaryExcerpt = fullText
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 250) + (fullText.length > 250 ? "..." : "");

            report.items.push({
                fileName,
                fileSize: doc.size,
                pageCount,
                charCount,
                status: "processed",
                requiresOcr: false,
                summaryExcerpt,
            });

            documentTextBlocks.push(
                `--- DOCUMENT ${idx + 1}: ${fileName} (Pages: ${pageCount}, Status: Successfully Extracted) ---\n${textToInclude}`
            );
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Unknown error during extraction";
            const warning = `Failed to extract text from "${fileName}": ${errMsg}`;
            report.documentsFailed.push(fileName);
            report.items.push({
                fileName,
                fileSize: doc.size,
                pageCount: 0,
                charCount: 0,
                status: "failed",
                requiresOcr: false,
                warning,
            });
            errors.push(warning);

            documentTextBlocks.push(
                `--- DOCUMENT ${idx + 1}: ${fileName} (Status: Extraction Failed) ---\n[Extraction Error: ${errMsg}]`
            );
        }
    }

    // Combine all document blocks
    let combined = documentTextBlocks.join("\n\n");
    if (combined.length > MAX_TOTAL_DOCUMENT_CHARS) {
        combined =
            combined.slice(0, MAX_TOTAL_DOCUMENT_CHARS) +
            `\n\n[... Total document extracts capped at ${MAX_TOTAL_DOCUMENT_CHARS} characters ...]`;
    }

    if (report.documentsRequiringOcr.length > 0) {
        report.extractionNotice = `${report.documentsRequiringOcr.length} document(s) could not be read because they appear to be scanned images. OCR is required for those documents.`;
    }

    return {
        success: errors.length === 0,
        combinedDocumentText: combined,
        report,
        errors,
    };
}
