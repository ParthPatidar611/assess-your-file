/**
 * Sanitization Engine for Assess Your File
 * ========================================
 * Implements complete application-wide removal of legacy Fact Reference mechanisms
 * (e.g. [FACT-001], FACT-xxx, FACTUAL BASIS labels, orphaned brackets)
 * while preserving underlying factual narratives, natural prose, and valid document references.
 *
 * Rules:
 * 1. Executive Overview / Matter Synthesis: Contains NO source-reference codes (no FACT IDs and no DOCUMENT IDs).
 * 2. Supporting & Adverse Factors: Document references may remain, but all FACT IDs and FACTUAL BASIS labels are removed.
 * 3. Legal Recommendations / Next Steps: Free of fact-based citations.
 * 4. Factual Chronology & Petition Drafts: Preserves substance and annexures without FACT IDs.
 */

/**
 * Removes all FACT reference codes, FACTUAL BASIS labels, and resultant orphaned punctuation.
 * Preserves genuine document references (e.g. "Purchase_Order.pdf", "Annexure 1").
 */
export function cleanFactReferences(text?: string | null): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text
    // Remove bracketed or parenthesized FACT IDs: [FACT-001], (FACT-002), [FACT-USER-1], etc.
    .replace(/\[\s*FACT(?:UAL)?[-_]?[A-Za-z0-9_-]*\s*\]/gi, "")
    .replace(/\(\s*FACT(?:UAL)?[-_]?[A-Za-z0-9_-]*\s*\)/gi, "")
    // Remove explicit FACTUAL BASIS labels: e.g. "FACTUAL BASIS:", "Factual Basis:"
    .replace(/\bFACTUAL\s+BASIS\s*[:—–-]?\s*/gi, "")
    // Remove standalone FACT IDs: e.g. "FACT-001:", "FACT-001 "
    .replace(/\bFACT[-_][A-Za-z0-9_-]+\s*[:—–-]?\s*/gi, "")
    // Remove empty brackets left behind: [], (), [ ], ( )
    .replace(/\[\s*\]/g, "")
    .replace(/\(\s*\)/g, "")
    // Clean orphaned colons or dashes at start of line or after spaces
    .replace(/\s+[:—–-]\s+/g, " — ")
    .replace(/^\s*[:—–-]\s*/gm, "")
    // Remove double spaces and clean up whitespace
    .replace(/[ \t]{2,}/g, " ")
    // Clean spaces before punctuation
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();

  return cleaned;
}

/**
 * Specifically cleans Executive Overview / Matter Synthesis.
 * Enforces the rule: Must contain absolutely NO source-reference codes
 * — neither FACT IDs nor DOCUMENT IDs (e.g. [DOC-001], [Invoice.pdf], etc.).
 * Returns a smooth, natural-language professional assessment.
 */
export function cleanExecutiveOverview(text?: string | null): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = cleanFactReferences(text)
    // Remove bracketed document IDs: [DOC-01-...], [DOC-001]
    .replace(/\[\s*DOC(?:UMENT)?[-_]?[A-Za-z0-9_.-]*\s*\]/gi, "")
    .replace(/\(\s*DOC(?:UMENT)?[-_]?[A-Za-z0-9_.-]*\s*\)/gi, "")
    // Remove bracketed file references e.g. [Purchase_Order.pdf], (Receipt.pdf)
    .replace(/\[\s*[^\]]+\.(?:pdf|docx|xlsx|jpg|png)\s*(?:,\s*Page\s*\d+)?\s*\]/gi, "")
    .replace(/\(\s*[^)]+\.(?:pdf|docx|xlsx|jpg|png)\s*(?:,\s*Page\s*\d+)?\s*\)/gi, "")
    // Remove bracketed annexure tags if any in overview: [Annexure 1], (Annexure A)
    .replace(/\[\s*Annexure\s+[A-Za-z0-9_-]+\s*\]/gi, "")
    .replace(/\(\s*Annexure\s+[A-Za-z0-9_-]+\s*\)/gi, "")
    // Remove empty brackets
    .replace(/\[\s*\]/g, "")
    .replace(/\(\s*\)/g, "")
    // Clean spaces and punctuation
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();

  return cleaned;
}

/**
 * Sanitizes an assessment report object deeply, removing all legacy fact-reference
 * codes and terminology from executive summary, understood facts, factors, recommendations, and timeline.
 */
export function sanitizeAssessmentReport<T = unknown>(assessment: T): T {
  if (!assessment || typeof assessment !== "object") return assessment;

  const a = assessment as Record<string, unknown>;
  const sanitized: Record<string, unknown> = { ...a };

  if (typeof a.executive_summary === "string") {
    sanitized.executive_summary = cleanExecutiveOverview(a.executive_summary);
  }

  if (Array.isArray(a.understood_facts)) {
    sanitized.understood_facts = a.understood_facts
      .map((item) => (typeof item === "string" ? cleanFactReferences(item) : item))
      .filter((item) => typeof item !== "string" || item.length > 0);
  }

  if (Array.isArray(a.strengths)) {
    sanitized.strengths = a.strengths.map((item: Record<string, unknown>) => ({
      ...item,
      factor: typeof item.factor === "string" ? cleanFactReferences(item.factor) : item.factor,
      explanation: typeof item.explanation === "string" ? cleanFactReferences(item.explanation) : item.explanation,
      factual_basis: typeof item.factual_basis === "string" ? cleanFactReferences(item.factual_basis) : item.factual_basis,
      available_evidence: typeof item.available_evidence === "string" ? cleanFactReferences(item.available_evidence) : item.available_evidence,
    }));
  }

  if (Array.isArray(a.weaknesses)) {
    sanitized.weaknesses = a.weaknesses.map((item: Record<string, unknown>) => ({
      ...item,
      factor: typeof item.factor === "string" ? cleanFactReferences(item.factor) : item.factor,
      explanation: typeof item.explanation === "string" ? cleanFactReferences(item.explanation) : item.explanation,
      factual_basis: typeof item.factual_basis === "string" ? cleanFactReferences(item.factual_basis) : item.factual_basis,
      opposing_argument: typeof item.opposing_argument === "string" ? cleanFactReferences(item.opposing_argument) : item.opposing_argument,
    }));
  }

  if (Array.isArray(a.recommended_next_steps)) {
    sanitized.recommended_next_steps = a.recommended_next_steps
      .map((item) => (typeof item === "string" ? cleanFactReferences(item) : item))
      .filter((item) => typeof item !== "string" || item.length > 0);
  }

  if (Array.isArray(a.case_timeline)) {
    sanitized.case_timeline = a.case_timeline.map((evt: Record<string, unknown>) => ({
      ...evt,
      description: typeof evt.description === "string" ? cleanFactReferences(evt.description) : evt.description,
    }));
  }

  return sanitized as T;
}
