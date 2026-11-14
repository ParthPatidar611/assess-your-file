import { extractText } from "unpdf";
import { GoogleGenAI } from "@google/genai";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENTS = 3;
export const MAX_CHARS_PER_DOCUMENT = 12000;
export const MAX_TOTAL_DOCUMENT_CHARS = 30000;

export type PageClassification =
    | "TEXT_BASED"
    | "SCANNED_PRINTED"
    | "HANDWRITTEN"
    | "HYBRID"
    | "UNREADABLE_OR_DAMAGED";

export interface ExtractedKeyValue {
    field: string;
    value: string;
    currency?: string;
    status: string;
    sourcePage: number;
}

export interface UncertainField {
    field: string;
    reading: string;
    reason: string;
    userConfirmationRequired: boolean;
}

export interface PageExtractionItem {
    pageNumber: number;
    classification: PageClassification;
    extractionMethod: "digital_text" | "gemini_multimodal_ocr" | "gemini_handwriting_transcription";
    extractedText: string;
    charCount: number;
    status: "completed" | "partially_readable" | "requires_confirmation" | "failed";
    keyValues: ExtractedKeyValue[];
    uncertainFields: UncertainField[];
    unreadablePassages: string[];
}

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
    status: "processed" | "partially_readable" | "requires_confirmation" | "empty_or_scanned" | "failed" | "rejected";
    requiresOcr: boolean;
    documentType?: string;
    pages?: PageExtractionItem[];
    keyValues?: ExtractedKeyValue[];
    uncertainFields?: UncertainField[];
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
    multimodalProcessedCount?: number;
}

export interface ExtractionResult {
    success: boolean;
    combinedDocumentText: string;
    report: DocumentProcessingReport;
    errors: string[];
}

/**
 * Validates whether the binary data starts with the PDF magic bytes (%PDF-).
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
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Calls Gemini's Multimodal API to transcribe scanned, image-based, or handwritten PDF documents.
 */
async function transcribeViaGeminiMultimodal(
    doc: InputDocument,
    pageCount: number
): Promise<{
    pages: PageExtractionItem[];
    combinedText: string;
    documentType: string;
    keyValues: ExtractedKeyValue[];
    uncertainFields: UncertainField[];
    success: boolean;
}> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("[pdfExtractor] GEMINI_API_KEY not configured. Cannot perform multimodal OCR.");
        return {
            pages: [],
            combinedText: "",
            documentType: "Scanned Document",
            keyValues: [],
            uncertainFields: [],
            success: false,
        };
    }

    const ai = new GoogleGenAI({ apiKey });
    const primaryModel = process.env.GEMINI_PRIMARY_MODEL || "gemini-3.8-flash";
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

    const base64Data = Buffer.from(doc.buffer).toString("base64");
    const prompt = `You are a forensic legal document transcription and handwriting recognition specialist for Indian court matters.
Carefully review the attached PDF document ("${doc.name}", approximately ${pageCount || 1} pages).

INSTRUCTIONS:
1. Examine each page individually.
2. Classify each page as: "HANDWRITTEN", "SCANNED_PRINTED", "TEXT_BASED", "HYBRID", or "UNREADABLE_OR_DAMAGED".
3. Transcribe ALL readable text verbatim without summarizing or altering words.
   - Preserve exact dates, calendar terms, names, addresses, currency amounts (INR/Rs.), quantities, model numbers, invoice/challan numbers.
   - Preserve handwritten notes, marginalia, and physical condition remarks (e.g. "dent on right side panel", "received subject to inspection").
   - If any handwriting, number, or word is ambiguous, damaged, or partially illegible, mark it as "[UNCLEAR]".
4. Extract key structured fields (dates, amounts, parties, contractual deadlines, deductions, refunds, delivery notes).
5. Extract uncertain fields that require user confirmation.

Return ONLY a valid JSON object matching this structure:
{
  "document_type": "Purchase Order / Service Agreement / Delivery Challan / Correspondence",
  "pages": [
    {
      "page_number": 1,
      "classification": "HANDWRITTEN",
      "transcription": "Full verbatim text of page...",
      "key_values": [
        { "field": "order_total", "value": "360000", "currency": "INR", "status": "Directly stated", "sourcePage": 1 }
      ],
      "uncertain_fields": [
        { "field": "field_name", "reading": "extracted text", "reason": "Handwriting ambiguous", "userConfirmationRequired": true }
      ],
      "unreadable_passages": []
    }
  ]
}`;

    const modelsToTry = [primaryModel, fallbackModel];
    let rawText: string | undefined;

    for (const model of modelsToTry) {
        try {
            const resp = await ai.models.generateContent({
                model,
                contents: [
                    {
                        inlineData: {
                            mimeType: "application/pdf",
                            data: base64Data,
                        },
                    },
                    prompt,
                ],
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                    maxOutputTokens: 3500,
                    abortSignal: AbortSignal.timeout(25000),
                },
            });
            rawText = resp.text;
            if (rawText) break;
        } catch (err: unknown) {
            console.warn(`[pdfExtractor] Multimodal extraction with ${model} failed:`, err instanceof Error ? err.message.slice(0, 80) : err);
        }
    }

    if (!rawText) {
        return {
            pages: [],
            combinedText: "",
            documentType: "Scanned Document",
            keyValues: [],
            uncertainFields: [],
            success: false,
        };
    }

    try {
        let cleaned = rawText.trim();
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (jsonMatch) cleaned = jsonMatch[1].trim();
        const parsed = JSON.parse(cleaned);

        const docType = typeof parsed.document_type === "string" ? parsed.document_type : "Scanned Document";
        const rawPages = Array.isArray(parsed.pages) ? parsed.pages : [];

        const pages: PageExtractionItem[] = [];
        const allKeyValues: ExtractedKeyValue[] = [];
        const allUncertain: UncertainField[] = [];
        const textParts: string[] = [];

        rawPages.forEach((p: Record<string, unknown>, idx: number) => {
            const pageNum = typeof p.page_number === "number" ? p.page_number : idx + 1;
            const cls = (["TEXT_BASED", "SCANNED_PRINTED", "HANDWRITTEN", "HYBRID", "UNREADABLE_OR_DAMAGED"] as const).includes(
                p.classification as PageClassification
            ) ? (p.classification as PageClassification) : "HANDWRITTEN";

            const method = cls === "HANDWRITTEN" ? "gemini_handwriting_transcription" : "gemini_multimodal_ocr";
            const trans = typeof p.transcription === "string" ? p.transcription.trim() : "";

            const kvs: ExtractedKeyValue[] = [];
            if (Array.isArray(p.key_values)) {
                p.key_values.forEach((kv: Record<string, unknown>) => {
                    if (typeof kv.field === "string" && typeof kv.value === "string") {
                        const item: ExtractedKeyValue = {
                            field: kv.field,
                            value: kv.value,
                            currency: typeof kv.currency === "string" ? kv.currency : undefined,
                            status: typeof kv.status === "string" ? kv.status : "Directly stated",
                            sourcePage: pageNum,
                        };
                        kvs.push(item);
                        allKeyValues.push(item);
                    }
                });
            }

            const uncert: UncertainField[] = [];
            if (Array.isArray(p.uncertain_fields)) {
                p.uncertain_fields.forEach((uf: Record<string, unknown>) => {
                    if (typeof uf.field === "string" && typeof uf.reading === "string") {
                        const item: UncertainField = {
                            field: uf.field,
                            reading: uf.reading,
                            reason: typeof uf.reason === "string" ? uf.reason : "Handwriting requires confirmation",
                            userConfirmationRequired: true,
                        };
                        uncert.push(item);
                        allUncertain.push(item);
                    }
                });
            }

            pages.push({
                pageNumber: pageNum,
                classification: cls,
                extractionMethod: method,
                extractedText: trans,
                charCount: trans.length,
                status: uncert.length > 0 ? "requires_confirmation" : (trans.length > 30 ? "completed" : "partially_readable"),
                keyValues: kvs,
                uncertainFields: uncert,
                unreadablePassages: Array.isArray(p.unreadable_passages) ? (p.unreadable_passages as string[]) : [],
            });

            if (trans) {
                textParts.push(`[Page ${pageNum} — ${cls} (${method})]\n${trans}`);
            }
        });

        return {
            pages,
            combinedText: textParts.join("\n\n"),
            documentType: docType,
            keyValues: allKeyValues,
            uncertainFields: allUncertain,
            success: pages.length > 0 && textParts.length > 0,
        };
    } catch (parseErr) {
        console.error("[pdfExtractor] Failed to parse Gemini multimodal JSON:", parseErr);
        return {
            pages: [],
            combinedText: "",
            documentType: "Scanned Document",
            keyValues: [],
            uncertainFields: [],
            success: false,
        };
    }
}

/**
 * Extracts and validates text from an array of submitted PDF documents,
 * combining fast unpdf selectable-text extraction with Gemini Multimodal OCR
 * and handwriting recognition for scanned or photographic documents.
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
        multimodalProcessedCount: 0,
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
        const fileName = doc.name || `document_${idx + 1}.pdf`;
        report.documentsReceived.push(fileName);

        // 1. File Size Validation
        if (doc.size > MAX_FILE_SIZE_BYTES) {
            const sizeMb = (doc.size / (1024 * 1024)).toFixed(1);
            const warning = `File "${fileName}" (${sizeMb} MB) exceeds the maximum allowed size of 5 MB and was skipped.`;
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

        // 3. Attempt standard selectable text extraction via unpdf
        try {
            const { text: pagesText, totalPages } = await extractText(doc.buffer);

            const pageCount = totalPages || (Array.isArray(pagesText) ? pagesText.length : 1);
            const pages = Array.isArray(pagesText) ? pagesText : [pagesText || ""];

            const cleanedPages = pages
                .map((p, pageIdx) => {
                    const cleaned = cleanExtractedPage(p);
                    return cleaned ? `[Page ${pageIdx + 1}]\n${cleaned}` : "";
                })
                .filter(Boolean);

            const fullDigitalText = cleanedPages.join("\n\n");
            const nonWhitespaceLength = fullDigitalText.replace(/\s+/g, "").length;

            // 4. If digital text is missing or sparse (< 40 characters), activate MULTIMODAL EXTRACTION
            if (pageCount > 0 && nonWhitespaceLength < 40) {
                console.info(`[pdfExtractor] "${fileName}" contains minimal digital text (${nonWhitespaceLength} chars). Launching Gemini multimodal OCR...`);
                
                const mmResult = await transcribeViaGeminiMultimodal(doc, pageCount);

                if (mmResult.success && mmResult.combinedText.length > 40) {
                    const charCount = mmResult.combinedText.length;
                    report.totalCharactersExtracted += charCount;
                    report.documentsProcessed.push(fileName);
                    report.multimodalProcessedCount = (report.multimodalProcessedCount || 0) + 1;

                    const summaryExcerpt = mmResult.combinedText
                        .replace(/\s+/g, " ")
                        .trim()
                        .slice(0, 250) + (mmResult.combinedText.length > 250 ? "..." : "");

                    report.items.push({
                        fileName,
                        fileSize: doc.size,
                        pageCount: mmResult.pages.length || pageCount,
                        charCount,
                        status: mmResult.uncertainFields.length > 0 ? "requires_confirmation" : "processed",
                        requiresOcr: false,
                        documentType: mmResult.documentType,
                        pages: mmResult.pages,
                        keyValues: mmResult.keyValues,
                        uncertainFields: mmResult.uncertainFields,
                        summaryExcerpt,
                    });

                    documentTextBlocks.push(
                        `--- DOCUMENT ${idx + 1}: ${fileName} (Pages: ${pageCount}, Type: ${mmResult.documentType}, Method: Multimodal OCR / Handwriting Transcription) ---\n${mmResult.combinedText}`
                    );
                    continue;
                } else {
                    // Fallback notice if multimodal was unavailable
                    const warning = `Document "${fileName}" (${pageCount} page${pageCount > 1 ? "s" : ""}) is a scanned or handwritten image PDF. Digital text is absent and OCR transcription could not be completed.`;
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
                        `[WARNING: Text extraction yielded no digital characters. This document appears to be scanned or image-based and requires OCR.]`
                    );
                    continue;
                }
            }

            // 5. Selectable digital text was extracted successfully
            let textToInclude = fullDigitalText;
            if (textToInclude.length > MAX_CHARS_PER_DOCUMENT) {
                textToInclude =
                    textToInclude.slice(0, MAX_CHARS_PER_DOCUMENT) +
                    `\n\n[... Note: Text from ${fileName} truncated at ${MAX_CHARS_PER_DOCUMENT} characters for assessment ...]`;
            }

            const charCount = fullDigitalText.length;
            report.totalCharactersExtracted += charCount;
            report.documentsProcessed.push(fileName);

            const summaryExcerpt = fullDigitalText
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 250) + (fullDigitalText.length > 250 ? "..." : "");

            // Construct page-level breakdown for text-based PDF
            const textPages: PageExtractionItem[] = pages.map((p, pIdx) => {
                const cleaned = cleanExtractedPage(p);
                return {
                    pageNumber: pIdx + 1,
                    classification: "TEXT_BASED",
                    extractionMethod: "digital_text",
                    extractedText: cleaned,
                    charCount: cleaned.length,
                    status: "completed",
                    keyValues: [],
                    uncertainFields: [],
                    unreadablePassages: [],
                };
            });

            report.items.push({
                fileName,
                fileSize: doc.size,
                pageCount,
                charCount,
                status: "processed",
                requiresOcr: false,
                documentType: "Digital Text PDF",
                pages: textPages,
                summaryExcerpt,
            });

            documentTextBlocks.push(
                `--- DOCUMENT ${idx + 1}: ${fileName} (Pages: ${pageCount}, Status: Digital Text Extracted) ---\n${textToInclude}`
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
        report.extractionNotice = `${report.documentsRequiringOcr.length} document(s) could not be read because they appear to be scanned images and OCR was unavailable.`;
    }

    return {
        success: errors.length === 0,
        combinedDocumentText: combined,
        report,
        errors,
    };
}
