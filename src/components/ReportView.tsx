"use client";

import React, { useState, useMemo } from "react";
import type {
  AssessmentResponse,
  FactLedger,
  FactLedgerItem,
  FactClassification,
  ContradictionItem,
  DraftingMode,
  PageExtractionItem,
  ProcessedDocumentItem,
  UncertainField,
} from "./types";
import { buildMatterSpecificDraft } from "@/lib/legalDrafting";
import type { GeneratedLegalDraft } from "@/lib/legalDrafting";

interface ReportViewProps {
  result: AssessmentResponse;
  onReset: () => void;
  onPrint?: () => void;
}

const CLASSIFICATION_LABELS: Record<FactClassification, { label: string; bg: string; text: string; border: string }> = {
  DOCUMENTED_FACT: {
    label: "Documented Fact",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    border: "border-emerald-300",
  },
  USER_PROVIDED_FACT: {
    label: "User Statement",
    bg: "bg-blue-50",
    text: "text-blue-900",
    border: "border-blue-300",
  },
  PARTY_ALLEGATION: {
    label: "Party Allegation",
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-300",
  },
  OPPOSING_PARTY_POSITION: {
    label: "Opposing Position",
    bg: "bg-purple-50",
    text: "text-purple-900",
    border: "border-purple-300",
  },
  INFERENCE: {
    label: "Inference",
    bg: "bg-sky-50",
    text: "text-sky-900",
    border: "border-sky-300",
  },
  DISPUTED_FACT: {
    label: "Disputed Matter",
    bg: "bg-rose-50",
    text: "text-rose-900",
    border: "border-rose-300",
  },
  UNKNOWN: {
    label: "Unknown / Unverified",
    bg: "bg-stone-100",
    text: "text-stone-800",
    border: "border-stone-300",
  },
};

const DRAFT_MODE_LABELS: Record<DraftingMode, { title: string; short: string; desc: string }> = {
  initial_legal_notice: {
    title: "Initial Legal Notice",
    short: "Legal Notice",
    desc: "Formal statutory demand under Section 80 CPC / Section 12A Commercial Courts Act putting the recipient on notice prior to litigation.",
  },
  response_to_notice: {
    title: "Reply to Legal Notice",
    short: "Reply to Notice",
    desc: "Rebuttal and traversing of allegations made in an opposing notice with factual denial and reservation of rights.",
  },
  contractual_demand_letter: {
    title: "Contractual Demand Letter",
    short: "Demand Letter",
    desc: "Commercial cure notice highlighting contractual milestones, default clauses, and calling upon cure within agreed period.",
  },
  cancellation_notice: {
    title: "Contract Cancellation & Refund Notice",
    short: "Cancellation Notice",
    desc: "Formal notice exercising termination rights, demanding itemized reconciliation of advance, and recovery of unjustified deductions.",
  },
  petition_structure: {
    title: "Commercial Suit / Petition Structure",
    short: "Petition Outline",
    desc: "Preliminary pleading skeleton indexing causes of action, jurisdiction, valuation, and prayer for recovery/injunction.",
  },
  document_summary: {
    title: "Executive Document Synthesis",
    short: "Document Summary",
    desc: "Matter briefing summary consolidating documented facts, admissions, and evidentiary gaps for senior counsel.",
  },
};

export default function ReportView({ result, onReset, onPrint }: ReportViewProps) {
  const [expandedPrecedent, setExpandedPrecedent] = useState<string | null>(null);
  const [factFilter, setFactFilter] = useState<FactClassification | "ALL">("ALL");
  const [activeDraftMode, setActiveDraftMode] = useState<DraftingMode>("initial_legal_notice");
  const [confirmedFields, setConfirmedFields] = useState<Record<string, string>>({});
  const [copiedDraft, setCopiedDraft] = useState(false);

  const {
    case: caseMeta,
    assessment,
    analysisMode,
    model,
    fallbackReason,
    retrievedPrecedents = [],
    documentProcessing,
  } = result;

  const isDeterministic = analysisMode === "deterministic_fallback";
  const isFallbackAI = analysisMode === "ai_fallback";

  const timelineEvents = assessment.timeline || assessment.case_timeline || [];
  const outcome = assessment.outcomeAssessment || assessment.outcome_assessment;
  const duration = assessment.expectedDuration || assessment.expected_duration;
  const precautions = assessment.precautionsAndRecommendations || assessment.precautions_and_recommendations;
  const legalOptions = assessment.legalOptions || assessment.legal_options || [];
  const filing = assessment.filingAssistance || assessment.filing_assistance;
  const precedentsAnalyzed = assessment.precedent_analysis || [];

  // Fact Ledger and Contradictions
  const activeFactLedger: FactLedger | undefined = result.factLedger || assessment.fact_ledger || assessment.factLedger;
  const activeContradictions: ContradictionItem[] =
    result.contradictions || assessment.contradictions || activeFactLedger?.contradictions || [];

  // Dynamic Drafting Output computation (reactive to user switching draft modes)
  const currentDraft: GeneratedLegalDraft | undefined = useMemo(() => {
    if (!activeFactLedger) return result.draftingStudio || assessment.draftingStudio;
    const material = {
      caseType: caseMeta.caseType,
      title: caseMeta.title,
      facts: assessment.understood_facts?.join(" ") || caseMeta.title,
      desiredOutcome: caseMeta.desiredOutcome,
      jurisdiction: caseMeta.jurisdiction,
      documentText: "",
    };
    return buildMatterSpecificDraft(activeDraftMode, material, activeFactLedger);
  }, [activeDraftMode, activeFactLedger, caseMeta, assessment, result.draftingStudio]);

  const filteredFacts: FactLedgerItem[] = useMemo(() => {
    if (!activeFactLedger) return [];
    if (factFilter === "ALL") return activeFactLedger.facts;
    return activeFactLedger.facts.filter((item: FactLedgerItem) => item.classification === factFilter);
  }, [activeFactLedger, factFilter]);

  const allPagesList: Array<{ fileName: string; page: PageExtractionItem }> = useMemo(() => {
    if (!documentProcessing?.items) return [];
    const pages: Array<{ fileName: string; page: PageExtractionItem }> = [];
    documentProcessing.items.forEach((item: ProcessedDocumentItem) => {
      if (item.pages && item.pages.length > 0) {
        item.pages.forEach((p: PageExtractionItem) => {
          pages.push({ fileName: item.fileName, page: p });
        });
      }
    });
    return pages;
  }, [documentProcessing]);

  const allUncertainFields: UncertainField[] = useMemo(() => {
    if (!documentProcessing?.items) return [];
    const ufs: UncertainField[] = [];
    documentProcessing.items.forEach((item: ProcessedDocumentItem) => {
      if (item.uncertainFields) {
        ufs.push(...item.uncertainFields);
      }
      if (item.pages) {
        item.pages.forEach((p: PageExtractionItem) => {
          if (p.uncertainFields) {
            ufs.push(...p.uncertainFields);
          }
        });
      }
    });
    return ufs;
  }, [documentProcessing]);

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const handleFieldConfirm = (fieldId: string, val: string) => {
    setConfirmedFields((prev) => ({ ...prev, [fieldId]: val }));
  };

  return (
    <div className="space-y-10 pb-20">
      {/* -------------------------------------------------------- */}
      {/* 0. REPORT TOP HEADER & ACTIONS                           */}
      {/* -------------------------------------------------------- */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EEEEEC] pb-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Confidential Legal Assessment Report & Fact Ledger
              </span>
            </div>
            <p className="text-xs text-[#8E8E8A]">
              Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · Supreme Court of India 2025 Benchmark · Anti-Exaggeration Protocol Active
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onPrint || (() => window.print())}
              className="px-4 py-2 bg-white hover:bg-[#EEEEEC] text-[#151515] border border-[#151515] text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
            >
              Print / Export ⎙
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] border border-[#D5D5D2] text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              New Assessment +
            </button>
          </div>
        </div>

        {/* Matter Title and Meta Badges */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-[#151515] text-white text-[11px] font-bold uppercase tracking-wider">
              {caseMeta.caseType || "General Legal Matter"}
            </span>

            {/* Architecture Engine Badge */}
            {analysisMode === "ai_primary" && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-medium">
                Primary Model · {model || "gemini-3.8-flash"}
              </span>
            )}
            {analysisMode === "ai_fallback" && (
              <span className="px-2.5 py-1 bg-[#FFF9E6] text-[#806600] border border-[#F2D21A] text-[11px] font-semibold">
                Secondary Model Active · {model || "gemini-3.5-flash-lite"}
              </span>
            )}
            {analysisMode === "deterministic_fallback" && (
              <span className="px-2.5 py-1 bg-[#F5F5F5] text-[#151515] border border-[#D5D5D2] text-[11px] font-semibold">
                Rules-Based Deterministic Engine
              </span>
            )}

            {/* Strict Anti-Exaggeration Badge */}
            <span className="px-2.5 py-1 bg-neutral-100 text-[#151515] border border-neutral-300 text-[11px] font-mono font-medium">
              FactLedger Provenance Enforced
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#151515] tracking-tight leading-tight">
            {assessment.assessment_title || caseMeta.title}
          </h1>

          <div className="text-xs text-[#686868] flex flex-wrap items-center gap-4 pt-1">
            <span><strong>Jurisdiction:</strong> {caseMeta.jurisdiction || "India"}</span>
            {caseMeta.desiredOutcome && (
              <span><strong>Desired Outcome:</strong> {caseMeta.desiredOutcome}</span>
            )}
            {activeFactLedger && (
              <span><strong>Ledger Size:</strong> {activeFactLedger.facts.length} Structured Facts</span>
            )}
          </div>
        </div>
      </div>

      {/* Fallback Warning Notice */}
      {isDeterministic && (
        <div className="bg-[#FFF9E6] border-l-4 border-[#F2D21A] p-5 text-xs text-[#151515] space-y-1">
          <p className="font-bold text-sm">Deterministic Rules-Based Analysis Active</p>
          <p className="text-[#444444] leading-relaxed">
            {fallbackReason ||
              "External generative reasoning services were temporarily unavailable. This report was constructed using deterministic legal rule tables, statutory checklists, and keyword-screened Supreme Court 2025 precedents."}
          </p>
        </div>
      )}

      {isFallbackAI && fallbackReason && (
        <div className="bg-white border-l-4 border-[#F2D21A] border p-4 text-xs text-[#151515] flex items-center justify-between">
          <div>
            <span className="font-bold">Failover Notification: </span>
            <span className="text-[#686868]">{fallbackReason}</span>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* 0.1 DOCUMENT EXTRACTION & PROVENANCE STATUS PANEL        */}
      {/* -------------------------------------------------------- */}
      {documentProcessing && documentProcessing.documentsReceived.length > 0 && (
        <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
          <div className="border-b border-[#EEEEEC] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#151515]" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                  Document Extraction Intelligence
                </h2>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
                Multimodal Ingestion & Page-Level Provenance
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-[#FAFAF8] border border-[#EEEEEC] font-mono text-[#151515]">
                {documentProcessing.documentsProcessed.length} of {documentProcessing.documentsReceived.length} File(s)
              </span>
              <span className="px-2.5 py-1 bg-[#FAFAF8] border border-[#EEEEEC] font-mono text-[#151515]">
                {allPagesList.length} Pages Classified
              </span>
              <span className="px-2.5 py-1 bg-[#FAFAF8] border border-[#EEEEEC] font-mono text-[#151515]">
                {documentProcessing.totalCharactersExtracted.toLocaleString()} Chars
              </span>
            </div>
          </div>

          {/* Page Breakdown Table */}
          {allPagesList.length > 0 ? (
            <div className="space-y-4">
              <div className="border border-[#D5D5D2] overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#151515] text-white uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-4 font-bold">Document Source</th>
                      <th className="py-2.5 px-4 font-bold">Page</th>
                      <th className="py-2.5 px-4 font-bold">Classification</th>
                      <th className="py-2.5 px-4 font-bold">Extraction Method</th>
                      <th className="py-2.5 px-4 font-bold">Status</th>
                      <th className="py-2.5 px-4 font-bold text-right">Extracted Chars</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEC] bg-white">
                    {allPagesList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAFAF8] transition">
                        <td className="py-3 px-4 font-medium text-[#151515] max-w-xs truncate">
                          {item.fileName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#151515]">
                          p. {item.page.pageNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold border uppercase ${
                              item.page.classification === "HANDWRITTEN"
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : item.page.classification === "SCANNED_PRINTED"
                                ? "bg-blue-50 text-blue-900 border-blue-300"
                                : item.page.classification === "HYBRID"
                                ? "bg-purple-50 text-purple-900 border-purple-300"
                                : "bg-neutral-100 text-neutral-800 border-neutral-300"
                            }`}
                          >
                            {item.page.classification}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#444444] font-mono text-[11px]">
                          {item.page.extractionMethod}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold ${
                              item.page.status === "completed"
                                ? "text-emerald-800 bg-emerald-50 border border-emerald-200"
                                : "text-amber-800 bg-amber-50 border border-amber-200"
                            }`}
                          >
                            {item.page.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#686868]">
                          {item.page.charCount || item.page.extractedText.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Uncertain Fields & User Confirmation Step */}
              {allUncertainFields.length > 0 && (
                <div className="p-4 bg-[#FFF9E6] border border-[#F2D21A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#F2D21A]" /> Critical Fields Flagged for Confirmation
                    </span>
                    <span className="text-[11px] text-[#806600]">
                      Handwriting recognition confidence requires human verification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {allUncertainFields.map((uf: UncertainField, i: number) => {
                      const val = uf.reading || uf.extractedValue || "";
                      const isConfirmed = !!confirmedFields[uf.field];
                      return (
                        <div key={i} className="p-3 bg-white border border-[#D5D5D2] flex flex-col justify-between space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-[#151515] uppercase text-[10px] tracking-wider block">
                                {uf.field}
                              </span>
                              <span className="text-[#444444] font-medium">
                                Extracted: <strong className="text-[#151515]">{confirmedFields[uf.field] || val}</strong>
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8E8E8A] font-mono">
                              Doc: {uf.sourceDoc || "Uploaded PDF"}{uf.pageNumber ? ` (p.${uf.pageNumber})` : ""}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#806600] italic">
                            Reason: {uf.reason}
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-[#EEEEEC]">
                            <button
                              type="button"
                              onClick={() => handleFieldConfirm(uf.field, val)}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                                isConfirmed
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-[#EEEEEC] hover:bg-[#F2D21A] text-[#151515]"
                              }`}
                            >
                              {isConfirmed ? "Confirmed ✓" : "Confirm Extracted Value"}
                            </button>
                            <input
                              type="text"
                              placeholder="Or type correction..."
                              defaultValue={confirmedFields[uf.field] || ""}
                              onBlur={(e) => {
                                if (e.target.value.trim()) {
                                  handleFieldConfirm(uf.field, e.target.value.trim());
                                }
                              }}
                              className="px-2 py-1 text-xs border border-[#D5D5D2] bg-[#FAFAF8] flex-1 text-[#151515]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-[#FAFAF8] border border-[#EEEEEC] text-xs text-[#686868]">
              Direct text intake mode. Documents uploaded in PDF format are classified per-page into text-based, scanned, or handwritten pipelines.
            </div>
          )}
        </section>
      )}

      {/* -------------------------------------------------------- */}
      {/* PART 1 — FACT AND EVIDENCE LEDGER                        */}
      {/* -------------------------------------------------------- */}
      {activeFactLedger && (
        <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
          <div className="border-b border-[#EEEEEC] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                  Part 1 — Fact and Evidence Ledger
                </h2>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
                Structured Evidence Representation & Provenance
              </h3>
            </div>

            <div className="text-xs text-[#8E8E8A]">
              Showing {filteredFacts.length} of {activeFactLedger.facts.length} Facts
            </div>
          </div>

          {/* Classification Filter Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFactFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                factFilter === "ALL"
                  ? "bg-[#151515] text-white"
                  : "bg-[#FAFAF8] text-[#151515] border border-[#D5D5D2] hover:bg-[#EEEEEC]"
              }`}
            >
              All Facts ({activeFactLedger.facts.length})
            </button>

            {(Object.keys(CLASSIFICATION_LABELS) as FactClassification[]).map((cls: FactClassification) => {
              const count = activeFactLedger.facts.filter((f: FactLedgerItem) => f.classification === cls).length;
              if (count === 0 && factFilter !== cls) return null;
              const meta = CLASSIFICATION_LABELS[cls];
              const isSelected = factFilter === cls;

              return (
                <button
                  key={cls}
                  onClick={() => setFactFilter(cls)}
                  className={`px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-[#151515] text-white border-[#151515]"
                      : `${meta.bg} ${meta.text} ${meta.border} hover:opacity-80`
                  }`}
                >
                  <span>{meta.label}</span>
                  <span className="font-mono text-[10px] font-bold">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Facts List */}
          <div className="space-y-3">
            {filteredFacts.map((fact: FactLedgerItem) => {
              const meta = CLASSIFICATION_LABELS[fact.classification] || CLASSIFICATION_LABELS.DOCUMENTED_FACT;

              return (
                <div
                  key={fact.id}
                  className="p-4 bg-[#FAFAF8] border border-[#EEEEEC] hover:border-[#D5D5D2] transition space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#151515] bg-white px-2 py-0.5 border border-[#D5D5D2]">
                        {fact.id}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase ${meta.bg} ${meta.text} ${meta.border}`}>
                        {meta.label}
                      </span>
                      {fact.isDisputed && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 uppercase">
                          Disputed Issue
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#8E8E8A]">
                      {fact.partyAttribution && (
                        <span><strong>Attribution:</strong> {fact.partyAttribution}</span>
                      )}
                      <span><strong>Verification:</strong> {fact.verificationStatus}</span>
                    </div>
                  </div>

                  <p className="text-[#171717] text-sm leading-relaxed font-medium">
                    {fact.statement}
                  </p>

                  {/* Supporting Extracted Quotation & Provenance */}
                  <div className="pt-2 border-t border-[#EEEEEC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#686868]">
                    {fact.extractedQuotation ? (
                      <div className="italic text-[#444444] bg-white p-2 border border-[#EEEEEC] flex-1">
                        "{fact.extractedQuotation}"
                      </div>
                    ) : (
                      <div className="text-[#8E8E8A]">No direct verbatim quote; synthesis from party submission.</div>
                    )}

                    <div className="font-mono text-[10px] text-[#151515] bg-[#EEEEEC] px-2 py-1 shrink-0">
                      Source: {fact.sourceDocument || "User Intake"}{fact.sourcePageNumber ? ` (p.${fact.sourcePageNumber})` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- */}
      {/* 1.4 CONTRADICTION & DISPUTE RESOLUTION PANEL             */}
      {/* -------------------------------------------------------- */}
      {activeContradictions.length > 0 && (
        <section className="bg-white border-2 border-rose-200 p-6 sm:p-10 shadow-xs">
          <div className="border-b border-rose-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-rose-600" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-rose-800">
                1.4 — Evidentiary Contradictions & Disputed Facts
              </h2>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
              Conflicting Party Accounts Requiring Resolution
            </h3>
            <p className="text-xs text-[#686868] mt-1">
              The engine detected conflicting records between parties. The system does not resolve contradictory accounts without independent corroborating evidence.
            </p>
          </div>

          <div className="space-y-6">
            {activeContradictions.map((contra: ContradictionItem, idx: number) => (
              <div key={idx} className="p-5 bg-[#FAFAF8] border border-[#D5D5D2] space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-[#EEEEEC] pb-2">
                  <span className="font-bold text-sm text-[#151515]">{contra.issue}</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-900 font-bold text-[10px] uppercase">
                    Contested Matter
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account A */}
                  <div className="p-4 bg-white border border-[#EEEEEC] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                      Party A: {contra.partyAPosition.party}
                    </span>
                    <p className="text-xs text-[#171717] leading-relaxed font-medium">
                      "{contra.partyAPosition.account}"
                    </p>
                    <p className="text-[10px] text-[#8E8E8A] font-mono">
                      Source: {contra.partyAPosition.source}
                    </p>
                  </div>

                  {/* Account B */}
                  <div className="p-4 bg-white border border-[#EEEEEC] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                      Party B: {contra.partyBPosition.party}
                    </span>
                    <p className="text-xs text-[#171717] leading-relaxed font-medium">
                      "{contra.partyBPosition.account}"
                    </p>
                    <p className="text-[10px] text-[#8E8E8A] font-mono">
                      Source: {contra.partyBPosition.source}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#FFF9E6] border-l-4 border-[#F2D21A] space-y-1">
                  <p className="font-bold text-[#151515]">What Remains Unresolved:</p>
                  <p className="text-[#444444]">{contra.unresolvedPoints}</p>
                </div>

                <div className="p-3 bg-white border border-[#EEEEEC] space-y-1">
                  <p className="font-bold text-emerald-900">Recommended Resolving Evidence:</p>
                  <p className="text-[#444444]">{contra.suggestedEvidenceToResolve}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- */}
      {/* EXECUTIVE OVERVIEW                                       */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EEEEEC] pb-4 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            Executive Overview
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Matter Synthesis & Case Understanding
          </h3>
        </div>

        <div className="text-sm sm:text-[15px] text-[#171717] leading-relaxed space-y-4">
          <p className="whitespace-pre-wrap">{assessment.executive_summary}</p>
        </div>

        {/* Identified Legal Issues */}
        {assessment.legal_issues && assessment.legal_issues.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#EEEEEC]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] mb-3">
              Core Legal Questions Raised:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assessment.legal_issues.map((issue: string, idx: number) => (
                <div key={idx} className="p-3.5 bg-[#FAFAF8] border border-[#EEEEEC] text-xs flex gap-3">
                  <span className="font-mono font-bold text-[#151515] shrink-0">0{idx + 1}.</span>
                  <span className="text-[#2B2B2B] leading-relaxed">{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 01 - CHRONOLOGY OF EVENTS                                */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
              01 - Chronology of Events
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
              Factual Timeline
            </h3>
          </div>
          <span className="text-xs text-[#8E8E8A]">
            {timelineEvents.length} Events Extracted
          </span>
        </div>

        {timelineEvents.length === 0 ? (
          <div className="p-5 bg-[#FAFAF8] border border-[#EEEEEC] text-xs text-[#686868] italic">
            No explicit calendar dates were detected in the submitted narrative. Providing exact dates strengthens limitation analyses.
          </div>
        ) : (
          <div className="relative border-l border-[#D5D5D2] ml-3 sm:ml-4 pl-6 sm:pl-8 space-y-6">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-2.5 h-2.5 bg-[#151515] group-hover:bg-[#F2D21A] transition border-2 border-white" />

                <div className="p-4 bg-[#FAFAF8] border border-[#EEEEEC] hover:border-[#D5D5D2] transition">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-[#151515] font-mono">
                      {evt.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 border ${
                          evt.dateType === "confirmed"
                            ? "bg-white text-emerald-800 border-emerald-300"
                            : "bg-white text-amber-800 border-amber-300"
                        }`}
                      >
                        {evt.dateType || (evt.isConfirmed ? "Confirmed" : "Approximate")}
                      </span>
                      {evt.source && (
                        <span className="text-[10px] text-[#8E8E8A]">
                          Source: {evt.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 02 & 03 - FACTORS SUPPORTING & OPPOSING THE CASE         */}
      {/* -------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Supporting Factors */}
        <section className="bg-white border border-[#D5D5D2] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="border-b border-[#EEEEEC] pb-4 mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                02 - Case Strengths
              </h2>
              <h3 className="text-lg sm:text-xl font-bold text-[#151515] tracking-tight mt-1">
                Factors Supporting Your Position
              </h3>
            </div>

            <div className="space-y-4">
              {assessment.strengths.map((str, idx) => (
                <div key={idx} className="p-4 bg-[#FAFAF8] border border-[#EEEEEC] text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#151515]">
                    <span className="text-emerald-700">✓</span>
                    <span>{str.factor}</span>
                  </div>
                  <p className="text-[#444444] leading-relaxed">{str.explanation}</p>
                  {str.factual_basis && (
                    <div className="pt-2 border-t border-[#EEEEEC] text-[11px] text-[#686868]">
                      <strong>Factual Basis:</strong> {str.factual_basis}
                    </div>
                  )}
                  {str.available_evidence && (
                    <div className="text-[11px] text-emerald-800">
                      <strong>Supporting Evidence:</strong> {str.available_evidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Opposing Factors & Vulnerabilities */}
        <section className="bg-white border border-[#D5D5D2] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="border-b border-[#EEEEEC] pb-4 mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                03 - Case Vulnerabilities
              </h2>
              <h3 className="text-lg sm:text-xl font-bold text-[#151515] tracking-tight mt-1">
                Factors Opposing Your Position
              </h3>
            </div>

            <div className="space-y-4">
              {assessment.weaknesses.map((w, idx) => (
                <div key={idx} className="p-4 bg-[#FAFAF8] border border-[#EEEEEC] text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#151515]">
                    <span className="text-amber-700">!</span>
                    <span>{w.factor}</span>
                  </div>
                  <p className="text-[#444444] leading-relaxed">{w.explanation}</p>
                  {w.factual_basis && (
                    <div className="pt-2 border-t border-[#EEEEEC] text-[11px] text-[#686868]">
                      <strong>Basis:</strong> {w.factual_basis}
                    </div>
                  )}
                  {w.opposing_argument && (
                    <div className="text-[11px] text-[#9E3B1B]">
                      <strong>Anticipated Counter-Argument:</strong> {w.opposing_argument}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* -------------------------------------------------------- */}
      {/* 04 - COMPARABLE JUDICIAL DECISIONS                       */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                04 - Comparable Judicial Decisions
              </h2>
              <span className="px-2 py-0.5 bg-[#EEEEEC] text-[10px] font-bold text-[#151515]">
                SC 2025 Corpus
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
              Source-Matched Supreme Court Judgments
            </h3>
          </div>
          <span className="text-xs text-[#8E8E8A]">
            {retrievedPrecedents.length} Comparable Decisions Retrieved
          </span>
        </div>

        <div className="mb-6 p-3.5 bg-[#FAFAF8] border border-[#EEEEEC] text-xs text-[#686868] flex items-center justify-between">
          <span>
            These judicial rulings were retrieved from the 2025 Supreme Court repository and compared against your stated facts.
          </span>
          <span className="text-[11px] font-semibold text-[#151515] shrink-0 ml-4">
            Legal Review Status: Pending Counsel
          </span>
        </div>

        {retrievedPrecedents.length === 0 ? (
          <div className="p-6 bg-[#FAFAF8] border border-[#EEEEEC] text-xs text-[#686868] text-center">
            No direct precedent matches met the threshold in the local database. Broaden facts or check the legal options below.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-[#D5D5D2] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#151515] text-white uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-bold">Case Citation</th>
                    <th className="py-3 px-4 font-bold">Parties</th>
                    <th className="py-3 px-4 font-bold">Decision Date</th>
                    <th className="py-3 px-4 font-bold">Domain</th>
                    <th className="py-3 px-4 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEC] bg-white">
                  {retrievedPrecedents.map((p) => {
                    const isExpanded = expandedPrecedent === p.case_id;
                    const analysis = precedentsAnalyzed.find((pa) => pa.case_id === p.case_id);

                    return (
                      <React.Fragment key={p.case_id}>
                        <tr className="hover:bg-[#FAFAF8] transition">
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#151515] whitespace-nowrap">
                            {p.citation || p.case_id}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#171717] max-w-xs truncate">
                            {p.case_name}
                          </td>
                          <td className="py-3.5 px-4 text-[#686868] whitespace-nowrap">
                            {p.judgment_date || "2025"}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-[#EEEEEC] text-[10px] font-semibold text-[#151515]">
                              {p.domain}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() =>
                                setExpandedPrecedent(isExpanded ? null : p.case_id)
                              }
                              className="px-2.5 py-1 text-[11px] font-bold text-[#151515] bg-[#EEEEEC] hover:bg-[#F2D21A] transition cursor-pointer"
                            >
                              {isExpanded ? "Collapse ▲" : "Compare ▼"}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-[#FBFBFA] p-6 border-b border-[#D5D5D2]">
                              <div className="max-w-4xl space-y-4 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEEEEC] pb-3">
                                  <h4 className="font-bold text-sm text-[#151515]">
                                    {p.case_name}
                                  </h4>
                                  {p.source_url && (
                                    <a
                                      href={p.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#151515] underline font-semibold hover:text-black"
                                    >
                                      View Official SCR Judgment PDF ↗
                                    </a>
                                  )}
                                </div>

                                {p.matched_excerpt && (
                                  <div className="p-3 bg-white border border-[#EEEEEC]">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E8A] mb-1">
                                      Judicial Headnote / Excerpt:
                                    </p>
                                    <p className="italic text-[#444444] leading-relaxed">
                                      "{p.matched_excerpt}"
                                    </p>
                                  </div>
                                )}

                                {analysis && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    <div className="p-3 bg-white border border-[#EEEEEC]">
                                      <p className="font-bold text-[11px] text-emerald-800 mb-1">
                                        Factual Similarities:
                                      </p>
                                      <p className="text-[#444444] leading-relaxed">
                                        {analysis.similarities || "General subject matter alignment."}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-white border border-[#EEEEEC]">
                                      <p className="font-bold text-[11px] text-amber-800 mb-1">
                                        Key Distinctions:
                                      </p>
                                      <p className="text-[#444444] leading-relaxed">
                                        {analysis.differences || "Procedural stage or contractual terms differ."}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-white border border-[#EEEEEC]">
                                      <p className="font-bold text-[11px] text-[#151515] mb-1">
                                        Core Legal Principle:
                                      </p>
                                      <p className="text-[#444444] leading-relaxed">
                                        {analysis.legal_principle || "Interference restricted by statute."}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 05 - INDICATIVE OUTCOME ASSESSMENT                       */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            05 - Indicative Outcome Assessment
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Predictive Outlook & Risk Factor Evaluation
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-5 p-6 bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868] mb-2">
              Preliminary Qualitative Classification
            </p>
            <div className="text-lg font-bold text-[#151515] mb-3">
              {outcome?.qualitativeAssessment || "Mixed or uncertain"}
            </div>

            <div className="p-3 bg-white border border-[#D5D5D2] text-xs text-[#444444] leading-relaxed">
              <span className="font-bold text-[#151515] block mb-1">
                Ethical Standard on Quantitative Probability:
              </span>
              {outcome?.statusText ||
                "No arbitrary percentages generated. Insufficient validated historical trial data for a reliable quantitative probability estimate."}
            </div>
          </div>

          <div className="md:col-span-7">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] mb-3">
              Evaluated Case Risk Factors:
            </h4>
            {outcome?.riskFactors && outcome.riskFactors.length > 0 ? (
              <div className="border border-[#D5D5D2]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#151515] text-white uppercase text-[10px]">
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3">Risk Factor</th>
                      <th className="py-2.5 px-3 text-right">Impact Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEC]">
                    {outcome.riskFactors.map((rf, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="py-2.5 px-3 font-semibold text-[#151515]">{rf.category}</td>
                        <td className="py-2.5 px-3 text-[#444444]">{rf.factor}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{rf.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#686868] italic p-4 bg-[#FAFAF8] border border-[#EEEEEC]">
                Risk factor analysis requires additional evidentiary documentation to classify severity.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 06 - EXPECTED CASE DURATION                              */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            06 - Expected Case Duration
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Procedural Stages & Institutional Progression
          </h3>
        </div>

        <p className="text-xs text-[#686868] mb-5 leading-relaxed">
          {duration?.explanation ||
            "Litigation timelines in Indian courts depend heavily on jurisdiction, judicial vacancies, and interim applications. Typical progression entails the following sequential stages:"}
        </p>

        {duration?.proceduralStages && duration.proceduralStages.length > 0 && (
          <div className="border border-[#D5D5D2] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#151515] text-white uppercase text-[10px]">
                  <th className="py-3 px-4 font-bold">Stage Number</th>
                  <th className="py-3 px-4 font-bold">Procedural Phase</th>
                  <th className="py-3 px-4 font-bold">Stage Description</th>
                  <th className="py-3 px-4 font-bold">Typical Counsel Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEC] bg-white">
                {duration.proceduralStages.map((st, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAF8] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#151515]">Phase 0{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">{st.stageName}</td>
                    <td className="py-3 px-4 text-[#444444] leading-relaxed max-w-sm">{st.description}</td>
                    <td className="py-3 px-4 text-[#686868] leading-relaxed">{st.typicalActivities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 07 - PRECAUTIONS & RECOMMENDATIONS                       */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            07 - Strategic Precautions & Recommendations
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Pre-Litigation Safeguards & Checklist
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-[#FAFAF8] border border-[#EEEEEC] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F2D21A]" /> Documents to Preserve Immediately
            </h4>
            <ul className="space-y-1.5 text-xs text-[#444444]">
              {(precautions?.documentsToPreserve || []).map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-[#151515]">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 bg-[#FAFAF8] border border-[#EEEEEC] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F2D21A]" /> Limitation & Deadlines
            </h4>
            <ul className="space-y-1.5 text-xs text-[#444444]">
              {(precautions?.importantDatesAndLimitation || []).map((d, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-red-700">!</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 bg-[#FAFAF8] border border-[#EEEEEC] space-y-3 md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F2D21A]" /> Questions to Clarify with Retained Counsel
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#444444]">
              {(precautions?.questionsForAdvocate || []).map((q, idx) => (
                <div key={idx} className="p-3 bg-white border border-[#EEEEEC]">
                  <strong>Q{idx + 1}:</strong> {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 08 - AVAILABLE LEGAL OPTIONS                             */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            08 - Available Legal Options
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Comparative Matrix of Remedies
          </h3>
        </div>

        {legalOptions.length === 0 ? (
          <p className="text-xs text-[#686868] italic p-4 bg-[#FAFAF8] border border-[#EEEEEC]">
            Consult retained counsel to delineate specific statutory petitions suitable for this jurisdiction.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="border border-[#D5D5D2] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#151515] text-white uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-bold">Legal Option</th>
                    <th className="py-3 px-4 font-bold">Procedural Prerequisites</th>
                    <th className="py-3 px-4 font-bold">Potential Advantages</th>
                    <th className="py-3 px-4 font-bold">Risks & Disadvantages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEC] bg-white">
                  {legalOptions.map((opt, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAF8] transition">
                      <td className="py-3 px-4 font-bold text-[#151515] max-w-[200px]">
                        {opt.optionName}
                        <p className="font-normal text-[11px] text-[#686868] mt-1">{opt.relevanceContext}</p>
                      </td>
                      <td className="py-3 px-4 text-[#444444] text-[11px]">
                        <ul className="list-disc pl-3 space-y-1">
                          {(opt.prerequisites || []).map((pr, i) => (
                            <li key={i}>{pr}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-4 text-emerald-800 text-[11px]">
                        <ul className="list-disc pl-3 space-y-1">
                          {(opt.advantages || []).map((ad, i) => (
                            <li key={i}>{ad}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-4 text-[#9E3B1B] text-[11px]">
                        <ul className="list-disc pl-3 space-y-1">
                          {(opt.disadvantages || []).map((dis, i) => (
                            <li key={i}>{dis}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* PART 2 — INTERACTIVE LEGAL DRAFTING STUDIO (09)           */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border-2 border-[#151515] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                Part 2 — Legal Drafting Studio
              </h2>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
              Matter-Specific Notice & Pleadings Generator
            </h3>
            <p className="text-xs text-[#686868] mt-1">
              Grounded exclusively in verified documented facts, financial reconciliations, and verified Indian statutes.
            </p>
          </div>

          {currentDraft?.completenessCheck && (
            <div className="flex items-center gap-3 bg-[#FAFAF8] p-2.5 border border-[#D5D5D2]">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-[#8E8E8A] block">Readiness Score</span>
                <span className="text-base font-bold font-mono text-[#151515]">
                  {currentDraft.completenessCheck.readinessScore}%
                </span>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  currentDraft.completenessCheck.readinessScore >= 80
                    ? "bg-emerald-500"
                    : currentDraft.completenessCheck.readinessScore >= 50
                    ? "bg-[#F2D21A]"
                    : "bg-rose-500"
                }`}
              />
            </div>
          )}
        </div>

        {/* 6 Drafting Modes Switcher */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#151515] mb-2">
            Select Drafting Mode:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {(Object.keys(DRAFT_MODE_LABELS) as DraftingMode[]).map((mode) => {
              const info = DRAFT_MODE_LABELS[mode];
              const isCurrent = activeDraftMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveDraftMode(mode)}
                  className={`p-3 text-left transition border flex flex-col justify-between cursor-pointer ${
                    isCurrent
                      ? "bg-[#151515] text-white border-[#151515] shadow-xs"
                      : "bg-[#FAFAF8] text-[#151515] border-[#D5D5D2] hover:bg-[#EEEEEC]"
                  }`}
                >
                  <span className="text-xs font-bold block">{info.short}</span>
                  <span className={`text-[9px] mt-1 leading-tight ${isCurrent ? "text-neutral-300" : "text-[#8E8E8A]"}`}>
                    {mode.replace(/_/g, " ")}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[#686868] mt-2 italic">
            {DRAFT_MODE_LABELS[activeDraftMode].desc}
          </p>
        </div>

        {/* Financial Reconciliation Breakdown */}
        {currentDraft?.financialBreakdown && currentDraft.financialBreakdown.advanceOrPaidAmount && (
          <div className="mb-6 p-4 bg-white border border-[#D5D5D2] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#151515] block">
              Financial Reconciliation Summary
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {currentDraft.financialBreakdown.totalAgreedValue && (
                <div className="p-3 bg-[#FAFAF8] border border-[#EEEEEC]">
                  <span className="text-[10px] uppercase font-bold text-[#8E8E8A] block">Total Order / Fee</span>
                  <span className="text-sm font-bold font-mono text-[#151515]">
                    {currentDraft.financialBreakdown.totalAgreedValue}
                  </span>
                </div>
              )}
              {currentDraft.financialBreakdown.advanceOrPaidAmount && (
                <div className="p-3 bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Advance Consideration</span>
                  <span className="text-sm font-bold font-mono text-emerald-900">
                    {currentDraft.financialBreakdown.advanceOrPaidAmount}
                  </span>
                </div>
              )}
              {currentDraft.financialBreakdown.disputedAmounts && (
                <div className="p-3 bg-rose-50 border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">Disputed / Retained</span>
                  <span className="text-sm font-bold font-mono text-rose-900">
                    {currentDraft.financialBreakdown.disputedAmounts}
                  </span>
                </div>
              )}
              {currentDraft.financialBreakdown.netBalanceClaimed && (
                <div className="p-3 bg-[#151515] text-white border border-[#151515]">
                  <span className="text-[10px] uppercase font-bold text-[#F2D21A] block">Net Amount Claimed</span>
                  <span className="text-sm font-bold font-mono text-[#F2D21A]">
                    {currentDraft.financialBreakdown.netBalanceClaimed}
                  </span>
                </div>
              )}
            </div>
            {currentDraft.financialBreakdown.interestCalculationNotice && (
              <p className="text-[11px] text-[#686868] italic">
                Statutory Interest Basis: {currentDraft.financialBreakdown.interestCalculationNotice}
              </p>
            )}
          </div>
        )}

        {/* Verified Statutory Basis Table */}
        {currentDraft?.statutoryReferences && currentDraft.statutoryReferences.length > 0 && (
          <div className="mb-6 border border-[#D5D5D2] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#151515] text-white uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 font-bold">Act / Code</th>
                  <th className="py-2.5 px-3 font-bold">Section</th>
                  <th className="py-2.5 px-3 font-bold">Subject Matter</th>
                  <th className="py-2.5 px-3 font-bold">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEC] bg-white">
                {currentDraft.statutoryReferences.slice(0, 4).map((stat, i) => (
                  <tr key={i} className="hover:bg-[#FAFAF8]">
                    <td className="py-2.5 px-3 font-semibold text-[#151515]">{stat.actName}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#151515]">{stat.sectionNumber}</td>
                    <td className="py-2.5 px-3 text-[#444444]">{stat.title}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                        Verified Indian Statute
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Draft Viewer & Copy Button */}
        {currentDraft && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#D5D5D2] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                {currentDraft.matterSpecificSubject || DRAFT_MODE_LABELS[activeDraftMode].title}
              </span>
              <button
                type="button"
                onClick={() => handleCopyDraft(currentDraft.fullFormattedText)}
                className="px-3 py-1.5 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] border border-[#D5D5D2] text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {copiedDraft ? "Copied to Clipboard! ✓" : "Copy Draft ⎙"}
              </button>
            </div>

            <div className="p-6 bg-[#FAFAF8] border border-[#D5D5D2] space-y-4 font-mono text-xs leading-relaxed text-[#171717]">
              {/* Mandatory Review Notice Banner */}
              <div className="p-3 bg-amber-50 border-l-4 border-amber-500 font-sans text-xs text-amber-900 font-medium">
                {currentDraft.reviewWarning}
              </div>

              {/* Parties Block */}
              <div className="p-3 bg-white border border-[#EEEEEC] whitespace-pre-line text-[#444444]">
                {currentDraft.partiesBlock}
              </div>

              {/* Subject */}
              <div className="font-bold text-[#151515] uppercase tracking-wide py-1 border-b border-[#EEEEEC]">
                RE: {currentDraft.matterSpecificSubject}
              </div>

              {/* Draft Sections */}
              {currentDraft.draftSections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5 pt-2 border-t border-[#EEEEEC]">
                  <p className="font-bold text-[#151515] uppercase text-[11px]">
                    {sec.heading}
                  </p>
                  <p className="whitespace-pre-line text-[#333333]">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 10 - FILING PREPARATION ASSISTANCE (FALLBACK LEGACY VIEW) */}
      {/* -------------------------------------------------------- */}
      {filing && !currentDraft && (
        <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10 shadow-xs">
          <div className="border-b border-[#EEEEEC] pb-4 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
              09 - Filing Preparation Assistance
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
              Petition Outline & Document Index
            </h3>
          </div>

          <div className="space-y-6 text-xs">
            {filing.preliminaryDraftStructure && (
              <div className="p-6 bg-[#FAFAF8] border border-[#D5D5D2] space-y-4 font-mono">
                <div className="p-2.5 bg-[#FFF9E6] border-l-4 border-[#F2D21A] text-[11px] font-sans text-[#151515]">
                  {filing.preliminaryDraftStructure.placeholdersNotice}
                </div>

                <div className="text-center font-bold text-sm text-[#151515] uppercase tracking-wide border-b border-[#EEEEEC] pb-3">
                  {filing.preliminaryDraftStructure.jurisdictionHeading}
                </div>

                <div className="text-center font-semibold text-xs text-[#444444]">
                  {filing.preliminaryDraftStructure.partiesBlock}
                </div>

                <div className="font-bold text-[#151515] text-center uppercase tracking-wider py-1 bg-white border border-[#EEEEEC]">
                  {filing.preliminaryDraftStructure.documentType}
                </div>

                <p className="text-[#333333] leading-relaxed">
                  {filing.preliminaryDraftStructure.preliminaryStatement}
                </p>

                {filing.preliminaryDraftStructure.factualGroundsDraft && (
                  <div>
                    <p className="font-bold text-[#151515] mb-2">FACTUAL GROUNDS:</p>
                    <ol className="list-decimal pl-5 space-y-2 text-[#444444]">
                      {filing.preliminaryDraftStructure.factualGroundsDraft.map((gr, i) => (
                        <li key={i}>{gr}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {filing.preliminaryDraftStructure.prayerDraft && (
                  <div className="pt-2 border-t border-[#EEEEEC]">
                    <p className="font-bold text-[#151515] mb-1">PRAYER:</p>
                    <p className="italic text-[#444444] leading-relaxed">
                      {filing.preliminaryDraftStructure.prayerDraft}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- */}
      {/* 11 - LIMITATIONS & DISCLAIMER                            */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-8 text-xs text-[#686868] leading-relaxed space-y-3">
        <h3 className="font-bold text-sm text-[#151515] uppercase tracking-wider">
          Legal Disclaimer & Professional Boundaries
        </h3>
        <p>
          {result.disclaimer ||
            "This document is an AI-assisted research and triage assessment, not legal advice. The database contains a curated collection of Supreme Court of India judgments. Source matching does not establish legal precedent or binding authority for your matter. Consult a licensed advocate before taking any procedural or legal action."}
        </p>
      </section>

      {/* -------------------------------------------------------- */}
      {/* CRITICAL STATUTORY CONCLUSION: LAWYER REVIEW REQUIRED     */}
      {/* -------------------------------------------------------- */}
      <div className="bg-[#151515] border-4 border-[#F2D21A] p-8 sm:p-12 text-center text-white space-y-4 shadow-md">
        <div className="inline-block px-3 py-1 bg-[#F2D21A] text-[#151515] text-[11px] font-black uppercase tracking-widest">
          MANDATORY STATUTORY CONCLUSION
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#F2D21A] uppercase">
          Review of the lawyer is required!
        </h2>
        <p className="text-xs sm:text-sm text-[#D5D5D2] max-w-3xl mx-auto leading-relaxed">
          Under the Advocates Act, 1961 and the Bar Council of India standards of professional conduct, this automated assessment, evidentiary ledger, and drafting studio output constitute preliminary litigation intelligence only. No output from this platform may be dispatched, executed, or filed in any court, tribunal, or dispute forum without prior review, independent statutory verification, and settled endorsement by an enrolled advocate or legal counsel.
        </p>
      </div>
    </div>
  );
}
