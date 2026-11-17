import { NextResponse } from "next/server";
import { synthesizeEventsFromLedger, buildDeterministicAnnexureIndex } from "@/lib/petitionEngine";
import type { CaseMaterial } from "@/lib/deterministicAssessment";
import type { DocumentProcessingReport } from "@/lib/pdfExtractor";
import type { FactLedger } from "@/lib/factLedger";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const caseType = typeof body.caseType === "string" ? body.caseType : "Not specified";
    const title = typeof body.title === "string" ? body.title : "";
    const facts = typeof body.facts === "string" ? body.facts : "";
    const desiredOutcome = typeof body.desiredOutcome === "string" ? body.desiredOutcome : "";
    const jurisdiction = typeof body.jurisdiction === "string" ? body.jurisdiction : "India";
    const documentText = typeof body.documentText === "string" ? body.documentText : "";
    const documentReport = body.documentProcessing as DocumentProcessingReport | undefined;
    const factLedger = body.factLedger as FactLedger | undefined;

    const caseMaterial: CaseMaterial = {
      caseType,
      title,
      facts,
      desiredOutcome,
      jurisdiction,
      documentText,
      documentReport,
    };

    // Synthesize chronological events with the 5 required fields
    const events = synthesizeEventsFromLedger(caseMaterial, factLedger, documentReport);

    // Build initial deterministic annexure index
    const annexureIndex = buildDeterministicAnnexureIndex(documentReport, events, `${title} ${facts} ${documentText}`);

    return NextResponse.json({
      success: true,
      events,
      annexureIndex,
      message: `Successfully synthesized ${events.length} chronological events and indexed ${annexureIndex.totalAnnexures} annexures.`,
    });
  } catch (error: unknown) {
    console.error("[api/petition/events] Error synthesizing events:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to synthesize events.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
