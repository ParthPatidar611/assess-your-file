/**
 * Frontend Types for Assess Your File
 * Consulting-Grade Legal Assessment Platform
 */

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

export interface TimelineEvent {
  date: string;
  description: string;
  source: string;
  isConfirmed: boolean;
  dateType: "confirmed" | "approximate" | "unknown";
}

export interface RiskFactor {
  category: "Supporting" | "Adverse" | "Procedural";
  factor: string;
  impact: string;
}

export interface OutcomeAssessment {
  qualitativeAssessment:
    | "Relatively favourable"
    | "Mixed or uncertain"
    | "Relatively unfavourable"
    | "Insufficient information";
  numericalProbability: null;
  statusText: string;
  riskLevel: "Low to Moderate" | "Moderate" | "Moderate to High" | "High";
  riskFactors: RiskFactor[];
  limitations: string;
  thresholdProposal?: {
    thresholdPercentage: number;
    status: string;
    isEligible: null;
    explanation: string;
  };
}

export interface ProceduralStage {
  stageName: string;
  description: string;
  typicalActivities: string;
}

export interface ExpectedCaseDuration {
  estimateAvailable: boolean;
  numericalEstimate: null;
  explanation: string;
  proceduralStages: ProceduralStage[];
  benchmarksNote: string;
}

export interface PrecautionsAndRecommendations {
  documentsToPreserve: string[];
  missingDocuments?: string[];
  evidenceToCollect: string[];
  importantDatesAndLimitation: string[];
  preLitigationPrecautions: string[];
  questionsForAdvocate: string[];
}

export interface LegalOption {
  optionName: string;
  description: string;
  relevanceContext: string;
  prerequisites: string[];
  advantages: string[];
  disadvantages: string[];
  verificationRequired: string;
}

export interface FilingPreparationAssistance {
  caseChecklist: Array<{ item: string; status: string; notes: string }>;
  chronologicalFactsSummary: string[];
  documentOrganisationPlan: Array<{
    annexure: string;
    documentDescription: string;
    sourceOrStatus: string;
  }>;
  missingInformation: string[];
  preliminaryDraftStructure?: {
    documentType: string;
    jurisdictionHeading: string;
    partiesBlock: string;
    preliminaryStatement: string;
    factualGroundsDraft: string[];
    prayerDraft: string;
    placeholdersNotice: string;
  };
}

export interface AssessmentPrecedentItem {
  case_id: string;
  case_name?: string;
  citation?: string | null;
  court?: string | null;
  judgment_date?: string | null;
  source_url?: string | null;
  relevance?: string;
  similarities?: string;
  differences?: string;
  legal_principle?: string;
  legal_review_status?: string | null;
}

export interface AssessmentStrengthItem {
  factor: string;
  explanation: string;
  factual_basis: string;
  legal_relevance?: string;
  available_evidence?: string;
  strengthening_evidence?: string;
}

export interface AssessmentWeaknessItem {
  factor: string;
  explanation: string;
  factual_basis: string;
  opposing_argument?: string;
  missing_or_contradictory_evidence?: string;
  clarification_needed?: string;
}

export interface AssessmentReport {
  assessment_title: string;
  executive_summary: string;
  understood_facts: string[];
  legal_issues: string[];
  strengths: AssessmentStrengthItem[];
  weaknesses: AssessmentWeaknessItem[];
  missing_evidence?: Array<{ evidence: string; why_it_matters: string }>;
  precedent_analysis?: AssessmentPrecedentItem[];
  recommended_next_steps?: string[];
  limitations?: string;
  document_processing?: DocumentProcessingReport;
  timeline?: TimelineEvent[];
  case_timeline?: TimelineEvent[];
  outcomeAssessment?: OutcomeAssessment;
  outcome_assessment?: OutcomeAssessment;
  expectedDuration?: ExpectedCaseDuration;
  expected_duration?: ExpectedCaseDuration;
  precautionsAndRecommendations?: PrecautionsAndRecommendations;
  precautions_and_recommendations?: PrecautionsAndRecommendations;
  legalOptions?: LegalOption[];
  legal_options?: LegalOption[];
  filingAssistance?: FilingPreparationAssistance;
  filing_assistance?: FilingPreparationAssistance;
}

export interface RetrievedPrecedent {
  case_id: string;
  case_name: string;
  citation: string | null;
  court: string;
  judgment_date: string | null;
  domain: string;
  domain_tags?: string[];
  source_url: string | null;
  source_dataset: string;
  legal_review_status: string;
  publication_status: string;
  relevance: number;
  matched_excerpt: string;
  judgment_text_snippet?: string;
}

export interface AssessmentResponse {
  success: boolean;
  analysisMode: "ai_primary" | "ai_fallback" | "deterministic_fallback";
  provider?: string;
  model?: string;
  fallbackReason?: string | null;
  case: {
    title: string;
    caseType: string;
    jurisdiction: string;
    desiredOutcome: string;
  };
  documentProcessing?: DocumentProcessingReport;
  identifiedSearchQueries: string[];
  identifiedLegalIssues: string[];
  retrievedPrecedents: RetrievedPrecedent[];
  assessment: AssessmentReport;
  disclaimer: string;
  message?: string;
  error?: string;
}
