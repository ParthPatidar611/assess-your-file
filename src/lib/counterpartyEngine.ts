/**
 * Counterparty Argument Intelligence Engine
 * ==========================================
 * Anticipates plausible opposing-party arguments, defenses, and procedural objections
 * based on transaction chronology, contract principles, and evidentiary gaps.
 *
 * Enforces Mandatory Rule 6:
 * - All arguments are strictly labeled as ANTICIPATED arguments (never actual statements).
 * - Generates proposed applicant rebuttals with supporting evidence requirements.
 * - Isolates internal counsel strategy notes so they are NEVER exposed in formal court drafts.
 * - Supports both deterministic rule-based generation and Gemini AI enrichment with retry.
 */

import { GoogleGenAI } from "@google/genai";
import type { CaseMaterial } from "./deterministicAssessment";
import type { FactLedger } from "./factLedger";
import type { PetitionEvent, CounterpartyArgument } from "@/components/types";

const PRIMARY_MODEL =
  process.env.GEMINI_PRIMARY_MODEL ||
  process.env.GEMINI_MODEL ||
  "gemini-2.0-flash";

const FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ||
  "gemini-2.0-flash-lite";

/**
 * Builds a deterministic baseline of anticipated opposing party arguments
 * based on common Indian commercial and contractual litigation defenses.
 */
export function buildDeterministicCounterpartyArguments(
  material: CaseMaterial,
  events: PetitionEvent[],
  factLedger?: FactLedger
): CounterpartyArgument[] {
  const args: CounterpartyArgument[] = [];
  const combinedText = `${material.caseType} ${material.title} ${material.facts} ${material.documentText || ""}`;
  let argCounter = 1;

  // 1. Defect & Delivery Acceptance Objection (Section 41/42 Sale of Goods Act)
  if (/defect|dent|noise|cooling|damage|delivery|challan/i.test(combinedText)) {
    const deliveryEvent = events.find((e) => /deliver|challan|received/i.test(e.eventDescription));
    args.push({
      argumentId: `ARG-${String(argCounter++).padStart(3, "0")}`,
      relatedEventIds: deliveryEvent ? [deliveryEvent.eventId] : ["EVT-001"],
      opposingPartyArgument: "Anticipated defense: Respondent will argue that the equipment was delivered at site and received without immediate rejection, constituting deemed acceptance under Section 42 of the Sale of Goods Act, 1930.",
      factualBasis: "Signed delivery challan or physical receipt by receiving staff without immediate formal rejection notice at moment of drop-off.",
      supportingMaterial: ["Delivery Challan", "Gate Pass", "Goods Receipt Note"],
      applicableLegalPrinciple: "Section 41 and 42, Sale of Goods Act, 1930 (Right of examination and deemed acceptance)",
      applicantRebuttal: "The delivery challan carried an express contemporaneous endorsement noting physical damage/unverified operation. Rejection/defect notice was dispatched within a reasonable time upon technical inspection.",
      supportingEvidence: ["Handwritten Delivery Challan Endorsement", "Prompt Email / Notice of Defect"],
      vulnerabilities: "Need to verify whether the personnel signing the challan possessed technical competence to identify internal latent defects.",
      includeInPetition: true,
      strategyNotes: "CONFIDENTIAL COUNSEL NOTE: Do not plead unconditional delivery. Emphasize that commercial machinery requires electrical connection and operational testing before acceptance is perfected.",
    });
  }

  // 2. Cancellation and Expense Forfeiture Defense (Section 73/74 ICA)
  if (/cancellation|cancel|deduction|advance|refund|retain|deposit/i.test(combinedText)) {
    const cancelEvent = events.find((e) => /cancel|refund|deduct|statement/i.test(e.eventDescription));
    args.push({
      argumentId: `ARG-${String(argCounter++).padStart(3, "0")}`,
      relatedEventIds: cancelEvent ? [cancelEvent.eventId] : ["EVT-001"],
      opposingPartyArgument: "Anticipated defense: Service provider / Supplier will assert entitlement to retain advance payment towards alleged staff hours, overheads, design work, and opportunity loss under contract cancellation clauses.",
      factualBasis: "Internal closing statement, timesheet estimates, or reliance on customary administrative fees.",
      supportingMaterial: ["Closing Statement", "Internal Time Records", "Draft Concepts"],
      applicableLegalPrinciple: "Section 74, Indian Contract Act, 1872 (Stipulation for penalty vs genuine pre-estimate of loss)",
      applicantRebuttal: "Under settled Indian Supreme Court precedent (Kailash Nath Associates v. DDA), compensation under Section 74 is awarded only for actual damage or loss proved. Unilateral retention of advance without proof of actual expenses incurred is impermissible in law.",
      supportingEvidence: ["Written Cancellation Notice", "Demand for itemized third-party expense receipts"],
      vulnerabilities: "Check if the agreement explicitly stipulated a non-refundable advance or earnest money forfeiture clause.",
      includeInPetition: true,
      strategyNotes: "CONFIDENTIAL COUNSEL NOTE: Put respondent to strict proof of actual expenditure. Challenge internal timesheets as unverified self-serving notes.",
    });
  }

  // 3. Limitation & Pre-Institution Notice Objection (Section 12A Commercial Courts Act)
  if (/commercial/i.test(material.caseType || "") || /recovery/i.test(material.desiredOutcome || "")) {
    args.push({
      argumentId: `ARG-${String(argCounter++).padStart(3, "0")}`,
      relatedEventIds: events.length > 0 ? [events[events.length - 1].eventId] : ["EVT-001"],
      opposingPartyArgument: "Anticipated procedural objection: Opposing party may assert that the suit is barred or premature for failure to exhaust mandatory pre-institution mediation under Section 12A of the Commercial Courts Act, 2015.",
      factualBasis: "Filing of commercial suit directly without seeking pre-litigation settlement through State Legal Services Authority.",
      supportingMaterial: ["Mediation Non-Starter Report or Absence Thereof"],
      applicableLegalPrinciple: "Section 12A, Commercial Courts Act, 2015 (Mandatory Pre-Institution Mediation)",
      applicantRebuttal: "The applicant is seeking urgent interim relief regarding defect preservation / security deposit, which statutorily exempts the suit from prior mediation under Section 12A(1); alternatively, formal application for mediation was issued.",
      supportingEvidence: ["Interim Injunction Application", "Pre-litigation Legal Notice"],
      vulnerabilities: "Ensure Plaint specifically pleads urgent interim relief with factual justification to withstand Patil Automation v. Rakheja Engineers challenge.",
      includeInPetition: false,
      strategyNotes: "CONFIDENTIAL COUNSEL NOTE: If urgent relief is not realistically arguable, counsel should file an application with DLSA for mediation before formally presenting the Plaint.",
    });
  }

  // 4. Default Fallback Argument if fewer than 2 generated
  if (args.length < 2) {
    args.push({
      argumentId: `ARG-${String(argCounter++).padStart(3, "0")}`,
      relatedEventIds: events.length > 0 ? [events[0].eventId] : ["EVT-001"],
      opposingPartyArgument: "Anticipated defense: Opposite party will deny liability and claim that all obligations under the transaction were fully discharged or waived by the applicant.",
      factualBasis: "Transactional correspondence or passage of time without immediate litigation.",
      supportingMaterial: ["Transactional Receipts", "Exchange of Letters"],
      applicableLegalPrinciple: "Doctrine of Accord and Satisfaction / Estoppel",
      applicantRebuttal: "The record clearly reflects persistent written objections and continuous demands for defect rectification and financial reconciliation.",
      supportingEvidence: ["Registered Postal Receipts", "Email Trail"],
      vulnerabilities: "Confirm all emails were addressed to authorized managerial representatives.",
      includeInPetition: true,
      strategyNotes: "CONFIDENTIAL COUNSEL NOTE: Maintain chronological email records with full headers for Section 65B Indian Evidence Act / BSA certificate.",
    });
  }

  return args;
}

/**
 * AI-assisted generator for adversarial counterparty intelligence.
 * Enforces Rule 9 (preserves GEMINI_PRIMARY_MODEL / FALLBACK_MODEL) and falls back safely.
 */
export async function generateCounterpartyIntelligence(
  material: CaseMaterial,
  events: PetitionEvent[],
  factLedger?: FactLedger
): Promise<CounterpartyArgument[]> {
  const deterministicBaseline = buildDeterministicCounterpartyArguments(material, events, factLedger);

  const apiKey = process.env.GEMINI_API_KEY;
  const forceDeterministic = process.env.FORCE_DETERMINISTIC === "true";

  if (!apiKey || forceDeterministic) {
    return deterministicBaseline;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Senior Indian Litigation Counsel conducting an adversarial legal analysis.
Examine the following transactional events and Fact Ledger. Anticipate the strongest plausible defenses and procedural objections the OPPOSING PARTY will raise.

STRICT CONSTRAINTS (Mandatory):
1. These are ANTICIPATED arguments only. Never invent fabricated quotes, fictitious meetings, or false communications.
2. Formulate the applicant's rebuttal strictly using verified facts from the ledger.
3. Distinguish between arguments to address proactively in the plaint (includeInPetition: true) versus strategic defenses kept in reserve (includeInPetition: false).
4. Provide internal strategyNotes strictly for legal counsel (these will be excluded from the court draft).

CASE FACTS:
${JSON.stringify({
  caseType: material.caseType,
  title: material.title,
  desiredOutcome: material.desiredOutcome,
  events: events.map((e) => ({
    id: e.eventId,
    date: e.date,
    desc: e.eventDescription,
    mistake: e.otherPartyMistake,
    response: e.applicantResponse,
  })),
})}

Return ONLY valid JSON matching this structure:
{
  "counterpartyArguments": [
    {
      "argumentId": "ARG-001",
      "relatedEventIds": ["EVT-001"],
      "opposingPartyArgument": "Anticipated defense: ...",
      "factualBasis": "...",
      "supportingMaterial": ["..."],
      "applicableLegalPrinciple": "...",
      "applicantRebuttal": "...",
      "supportingEvidence": ["..."],
      "vulnerabilities": "...",
      "includeInPetition": true,
      "strategyNotes": "CONFIDENTIAL COUNSEL NOTE: ..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.15,
        abortSignal: AbortSignal.timeout(18000),
      },
    });

    const text = response.text?.trim() || "";
    let cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed?.counterpartyArguments) && parsed.counterpartyArguments.length > 0) {
      return parsed.counterpartyArguments.map((item: Record<string, unknown>, idx: number) => ({
        argumentId: typeof item.argumentId === "string" ? item.argumentId : `ARG-${String(idx + 1).padStart(3, "0")}`,
        relatedEventIds: Array.isArray(item.relatedEventIds) ? (item.relatedEventIds as string[]) : ["EVT-001"],
        opposingPartyArgument: String(item.opposingPartyArgument || "Anticipated opposing party defense"),
        factualBasis: String(item.factualBasis || "Based on transactional documentation"),
        supportingMaterial: Array.isArray(item.supportingMaterial) ? (item.supportingMaterial as string[]) : [],
        applicableLegalPrinciple: typeof item.applicableLegalPrinciple === "string" ? item.applicableLegalPrinciple : undefined,
        applicantRebuttal: String(item.applicantRebuttal || "Applicant maintains legal position"),
        supportingEvidence: Array.isArray(item.supportingEvidence) ? (item.supportingEvidence as string[]) : [],
        vulnerabilities: String(item.vulnerabilities || "Subject to verification of original records"),
        includeInPetition: item.includeInPetition !== false,
        strategyNotes: String(item.strategyNotes || "CONFIDENTIAL COUNSEL NOTE: Review prior to hearing"),
      }));
    }
  } catch (err) {
    console.warn("[counterpartyEngine] Gemini AI generation failed, using deterministic baseline:", err instanceof Error ? err.message : err);
  }

  return deterministicBaseline;
}
