import { NextResponse } from "next/server";
import {
    processUploadedDocuments,
    type InputDocument,
    MAX_FILE_SIZE_BYTES,
    MAX_DOCUMENTS,
} from "@/lib/pdfExtractor";

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Content-Type must be multipart/form-data.",
                    errors: ["Invalid content type. Expected multipart/form-data."],
                },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const files: File[] = [];

        // Collect all file entries from formData
        for (const [key, value] of formData.entries()) {
            if (value instanceof File && (key === "documents" || key === "files" || key === "file")) {
                files.push(value);
            }
        }

        if (files.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No PDF documents were received.",
                    errors: ["Please provide at least one PDF file."],
                },
                { status: 400 }
            );
        }

        if (files.length > MAX_DOCUMENTS) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Maximum ${MAX_DOCUMENTS} PDF documents are permitted. Received ${files.length}.`,
                    errors: [`Too many documents uploaded (maximum: ${MAX_DOCUMENTS}).`],
                },
                { status: 400 }
            );
        }

        // Convert files to Uint8Array in memory (no disk persistence)
        const inputDocs: InputDocument[] = [];
        for (const file of files) {
            const buffer = new Uint8Array(await file.arrayBuffer());
            inputDocs.push({
                name: file.name,
                size: file.size,
                buffer,
            });
        }

        const result = await processUploadedDocuments(inputDocs);

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? "Documents processed successfully."
                : "One or more documents could not be processed.",
            combinedDocumentText: result.combinedDocumentText,
            report: result.report,
            errors: result.errors,
        });
    } catch (err: unknown) {
        console.error("[documents/extract] Unhandled error:", err);
        const message = err instanceof Error ? err.message : "Document extraction failed.";
        return NextResponse.json(
            {
                success: false,
                message: "Unable to process uploaded documents.",
                errors: [message],
            },
            { status: 500 }
        );
    }
}
