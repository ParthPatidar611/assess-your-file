import { NextResponse } from "next/server";
import { compilePetitionDraft, detectForumCategory } from "@/lib/petitionEngine";
import type { CaseMaterial } from "@/lib/deterministicAssessment";
import type { FactLedger } from "@/lib/factLedger";
import type {
  PetitionEvent,
  CounterpartyArgument,
  AnnexureIndex,
  ForumCategory,
} from "@/components/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const caseType = typeof body.caseType === "string" ? body.caseType : "Not specified";
    const title = typeof body.title === "string" ? body.title : "";
    const facts = typeof body.facts === "string" ? body.facts : "";
    const desiredOutcome = typeof body.desiredOutcome === "string" ? body.desiredOutcome : "";
    const jurisdiction = typeof body.jurisdiction === "string" ? body.jurisdiction : "India";
    const courtHeadingOverride = typeof body.courtHeadingOverride === "string" ? body.courtHeadingOverride : undefined;
    const petitionerName = typeof body.petitionerName === "string" ? body.petitionerName : undefined;
    const petitionerAddress = typeof body.petitionerAddress === "string" ? body.petitionerAddress : undefined;
    const respondentName = typeof body.respondentName === "string" ? body.respondentName : undefined;
    const respondentAddress = typeof body.respondentAddress === "string" ? body.respondentAddress : undefined;

    const forumCategory: ForumCategory =
      typeof body.forumCategory === "string"
        ? (body.forumCategory as ForumCategory)
        : detectForumCategory(caseType);

    const events = (Array.isArray(body.events) ? body.events : []) as PetitionEvent[];
    const counterpartyArguments = (Array.isArray(body.counterpartyArguments) ? body.counterpartyArguments : []) as CounterpartyArgument[];
    const annexureIndex = (body.annexureIndex || { items: [], totalAnnexures: 0, totalPages: 0, unattachedReferencedDocs: [] }) as AnnexureIndex;
    const factLedger = body.factLedger as FactLedger | undefined;

    const documentText = typeof body.documentText === "string" ? body.documentText : "";

    const caseMaterial: CaseMaterial = {
      caseType,
      title,
      facts,
      desiredOutcome,
      jurisdiction,
      documentText,
    };

    // Compile formal pleading draft and run verification checks
    const petition = compilePetitionDraft({
      caseMaterial,
      events,
      counterpartyArguments,
      annexureIndex,
      forumCategory,
      courtHeadingOverride,
      petitionerName,
      petitionerAddress,
      respondentName,
      respondentAddress,
      factLedger,
    });

    return NextResponse.json({
      success: true,
      petition,
      validationReport: petition.validationReport,
      message: "Formal petition draft generated and validated successfully.",
    });
  } catch (error: unknown) {
    console.error("[api/petition/generate] Error compiling petition:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to compile petition.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
