import { NextResponse } from "next/server";
import { generateCounterpartyIntelligence } from "@/lib/counterpartyEngine";
import type { CaseMaterial } from "@/lib/deterministicAssessment";
import type { FactLedger } from "@/lib/factLedger";
import type { PetitionEvent } from "@/components/types";

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
    const factLedger = body.factLedger as FactLedger | undefined;
    const events = (Array.isArray(body.events) ? body.events : []) as PetitionEvent[];

    const caseMaterial: CaseMaterial = {
      caseType,
      title,
      facts,
      desiredOutcome,
      jurisdiction,
      documentText,
    };

    // Generate anticipated counterparty arguments and rebuttals
    const counterpartyArguments = await generateCounterpartyIntelligence(
      caseMaterial,
      events,
      factLedger
    );

    return NextResponse.json({
      success: true,
      counterpartyArguments,
      message: `Generated ${counterpartyArguments.length} anticipated counterparty arguments and candidate rebuttals.`,
    });
  } catch (error: unknown) {
    console.error("[api/petition/counterparty] Error generating counterparty intelligence:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate counterparty arguments.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
