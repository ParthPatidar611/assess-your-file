/**
 * Frontend Types for Assess Your File
 * Consulting-Grade Legal Assessment Platform
 */

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
  extractedValue?: string;
  sourceDoc?: string;
  pageNumber?: number;
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

export type FactClassification =
  | "DOCUMENTED_FACT"
  | "USER_PROVIDED_FACT"
  | "PARTY_ALLEGATION"
  | "OPPOSING_PARTY_POSITION"
  | "INFERENCE"
  | "DISPUTED_FACT"
  | "UNKNOWN";

export type EvidenceVerificationStatus =
  | "Directly stated"
  | "Partially legible"
  | "Unclear"
  | "Not found"
  | "Conflicting";

export interface FactLedgerItem {
  id: string; // e.g. "FACT-001"
  statement: string;
  classification: FactClassification;
  sourceType: "uploaded_document" | "user_facts" | "opposing_statement" | "derived";
  sourceDocument?: string;
  sourcePageNumber?: number;
  extractedQuotation?: string;
  partyAttribution?: string;
  isDisputed: boolean;
  verificationStatus: EvidenceVerificationStatus;
  contradictionNote?: string;
}

export interface ContradictionItem {
  id: string;
  issue: string;
  partyAPosition: {
    party: string;
    account: string;
    source: string;
    factId?: string;
  };
  partyBPosition: {
    party: string;
    account: string;
    source: string;
    factId?: string;
  };
  unresolvedPoints: string;
  suggestedEvidenceToResolve: string;
}

export interface FactLedger {
  facts: FactLedgerItem[];
  contradictions: ContradictionItem[];
  unknowns: string[];
  summaryCount: {
    documented: number;
    userProvided: number;
    allegations: number;
    opposingPositions: number;
    disputed: number;
    inferences: number;
    unknowns: number;
  };
}

export type DraftingMode =
  | "initial_legal_notice"
  | "response_to_notice"
  | "contractual_demand_letter"
  | "cancellation_notice"
  | "petition_structure"
  | "document_summary";

export interface DraftingCompletenessCheck {
  senderName: { present: boolean; value?: string; placeholder: string };
  senderAddress: { present: boolean; value?: string; placeholder: string };
  recipientName: { present: boolean; value?: string; placeholder: string };
  recipientAddress: { present: boolean; value?: string; placeholder: string };
  relationshipDescription: { present: boolean; value?: string; placeholder: string };
  agreementDetails: { present: boolean; value?: string; placeholder: string };
  chronologicalBreach: { present: boolean; value?: string; placeholder: string };
  supportingDocuments: { present: boolean; value?: string; placeholder: string };
  specificReliefSought: { present: boolean; value?: string; placeholder: string };
  readinessScore: number;
  missingFieldsCount: number;
}

export interface FinancialBreakdown {
  totalAgreedValue?: string;
  advanceOrPaidAmount?: string;
  documentedDeductions?: string;
  disputedAmounts?: string;
  netBalanceClaimed?: string;
  interestCalculationNotice: string;
  sourceReferences: string[];
}

export interface VerifiedStatutoryProvision {
  actName: string;
  sectionNumber: string;
  title: string;
  applicabilityNote: string;
  isVerified: boolean;
}

export interface GeneratedLegalDraft {
  mode: DraftingMode;
  modeTitle: string;
  matterSpecificSubject: string;
  jurisdictionForum: string;
  partiesBlock: string;
  completenessCheck: DraftingCompletenessCheck;
  financialBreakdown: FinancialBreakdown;
  statutoryReferences: VerifiedStatutoryProvision[];
  draftSections: Array<{
    heading: string;
    content: string;
    supportingFactIds?: string[];
  }>;
  fullFormattedText: string;
  disclaimer: string;
  reviewWarning: string;
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
  numericalProbability: number | null;
  statusText: string;
  riskLevel: "Low to Moderate" | "Moderate" | "Moderate to High" | "High";
  riskFactors: RiskFactor[];
  limitations: string;
  thresholdProposal: {
    thresholdPercentage: number;
    status: string;
    isEligible: boolean | null;
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
  missingDocuments: string[];
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

export interface CaseChecklistItem {
  item: string;
  status: "Provided" | "Missing" | "Requires Verification";
  notes: string;
}

export interface DocumentOrganisationPlanItem {
  annexure: string;
  documentDescription: string;
  sourceOrStatus: string;
}

export interface PreliminaryDraftStructure {
  documentType: string;
  jurisdictionHeading: string;
  partiesBlock: string;
  preliminaryStatement: string;
  factualGroundsDraft: string[];
  prayerDraft: string;
  placeholdersNotice: string;
}

export interface FilingPreparationAssistance {
  caseChecklist: CaseChecklistItem[];
  chronologicalFactsSummary: string[];
  documentOrganisationPlan: DocumentOrganisationPlanItem[];
  missingInformation: string[];
  preliminaryDraftStructure: PreliminaryDraftStructure;
}

export interface AssessmentStrengthItem {
  factor: string;
  explanation: string;
  factual_basis?: string;
  legal_basis?: string;
  available_evidence?: string;
  strengthening_evidence?: string;
}

export interface AssessmentWeaknessItem {
  factor: string;
  explanation: string;
  factual_basis?: string;
  legal_basis?: string;
  risk_mitigation?: string;
  opposing_argument?: string;
  missing_or_contradictory_evidence?: string;
}

export interface AssessmentPrecedentItem {
  case_id: string;
  case_name?: string;
  citation?: string | null;
  court?: string | null;
  judgment_date?: string | null;
  source_url?: string | null;
  relevance: string;
  similarities: string;
  differences: string;
  legal_principle?: string;
  legal_review_status?: string | null;
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

  // Accuracy and Fact Ledger additions
  fact_ledger?: FactLedger;
  factLedger?: FactLedger;
  contradictions?: ContradictionItem[];
  draftingStudio?: GeneratedLegalDraft;
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
  data?: {
    assessment: AssessmentReport;
    generationMetadata?: {
      assessmentId?: string;
      analysisMode?: string;
      provider?: string;
      model?: string | null;
      fallbackReason?: string | null;
      sectionProvenance?: Record<string, string>;
      durationMs?: number;
    };
    case?: {
      title: string;
      caseType: string;
      jurisdiction: string;
      desiredOutcome: string;
    };
    documentProcessing?: DocumentProcessingReport;
    identifiedSearchQueries?: string[];
    identifiedLegalIssues?: string[];
    retrievedPrecedents?: RetrievedPrecedent[];
    factLedger?: FactLedger;
    contradictions?: ContradictionItem[];
    draftingStudio?: GeneratedLegalDraft;
  };
  analysisMode: "ai_primary" | "ai_fallback" | "deterministic_fallback";
  provider?: string;
  model?: string | null;
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
  factLedger?: FactLedger;
  contradictions?: ContradictionItem[];
  draftingStudio?: GeneratedLegalDraft;
  disclaimer: string;
  lawyerReviewRequired: boolean;
  message?: string;
  error?:
    | string
    | {
        code: string;
        message: string;
        details?: string;
        retryable?: boolean;
      };
}

// ============================================================================
// PETITION BUILDER & EVENT MODELS (MENTOR REQUIREMENTS 1 - 4)
// ============================================================================

export type DateConfidence = "confirmed" | "approximate" | "unknown";

export type EventVerificationStatus =
  | "documented"
  | "applicant_statement"
  | "opposing_party_statement"
  | "inference"
  | "disputed"
  | "unknown"
  | "unverified"
  | "user_statement"
  | "allegation";

export type EventApprovalStatus = "proposed" | "confirmed" | "edited" | "disputed";

export interface PetitionEvent {
  eventId: string; // e.g. "EVT-001"
  orderIndex: number; // 1-based chronological index
  date: string; // Formatted date string or approximate description (or "DATE NOT ESTABLISHED")
  dateConfidence: DateConfidence;
  originalDateText?: string;
  normalisedDate?: string;

  // 5 MENTOR REQUIRED FIELDS:
  eventDescription: string; // 1. Event: What happened and when?
  otherPartyMistake: string; // 2. Mistake by the other party (or explicit "Not separately identified")
  applicantResponse: string; // 3. Applicant's response (or explicit "Requires applicant confirmation")
  reliefSought: string; // 4. Prayer: What relief or action is sought connected to this event?
  supportingDocumentIds: string[]; // 5. Supporting documents: immutable doc IDs backing this event

  // Source Traceability & Legal Rigor
  supportingDocumentPageReferences?: Record<string, string>; // e.g. { "DOC-001": "Page 1-2" }
  sourceClassifications?: string[]; // ["document_supported", "applicant_statement", etc.]
  sourceReferences?: string[]; // Extracted text excerpts
  sourceFactIds: string[]; // Linked internal fact IDs (e.g. ["FACT-001"])
  verificationStatus: EventVerificationStatus;
  approvalStatus: EventApprovalStatus;
  isDisputed: boolean;
  disputedDetails?: string;
  legalIssueTags?: string[];
  notesForAdvocate?: string;
  updatedAt?: string;
  timelineVersion?: number;
}

export type TimelineEventModel = PetitionEvent;

// ============================================================================
// COUNTERPARTY ARGUMENT INTELLIGENCE
// ============================================================================

export interface CounterpartyArgument {
  argumentId: string; // e.g. "ARG-001"
  relatedEventIds: string[]; // Linked event IDs (e.g. ["EVT-001"])
  opposingPartyArgument: string; // ANTICIPATED opposing party argument (clearly marked as anticipated)
  factualBasis: string; // Factual basis opposing party may rely upon
  supportingMaterial?: string[]; // Documents or material potentially cited
  applicableLegalPrinciple?: string; // Contract clause or statutory doctrine
  applicantRebuttal: string; // Proposed applicant rebuttal
  supportingEvidence: string[]; // Applicant evidence supporting rebuttal
  vulnerabilities: string; // Missing info or case vulnerabilities
  includeInPetition: boolean; // Whether applicant approves including rebuttal in pleading
  strategyNotes: string; // CONFIDENTIAL strategy notes (EXCLUDED from court pleading & exports)
}

// ============================================================================
// ANNEXURE MANAGEMENT & MAPPING
// ============================================================================

export interface AnnexureItem {
  annexureNumber: number; // 1, 2, 3...
  annexureLabel: string; // "Annexure 1", "Annexure 2"
  documentId: string; // Immutable UUID or unique ID
  originalFileName: string;
  documentTitle: string; // Clean display name (e.g. "Purchase Order dated 15 May 2026")
  documentType: string; // "Purchase Order" | "Delivery Challan" | "Invoice" | "Email" | "Notice"
  documentDate?: string;
  pageCount: number;
  relevantPageRange: string; // e.g. "Pages 1-2"
  extractionMethod: string;
  extractionStatus: "completed" | "partially_readable" | "requires_confirmation" | "failed";
  isExcluded: boolean; // Excluded by user from formal pleading exhibit index
  relatedEventIds: string[]; // Event IDs supported by this annexure
  referencedInParagraphs: string[]; // Paragraph citations (e.g. ["Para 3.1", "Para 3.4"])
}

export interface AnnexureIndex {
  items: AnnexureItem[];
  totalAnnexures: number;
  totalPages: number;
  unattachedReferencedDocs: string[]; // Documents mentioned in narrative but not uploaded
}

// ============================================================================
// FORUM SELECTION & FORMAL PETITION STRUCTURE
// ============================================================================

export type ForumCategory =
  | "COMMERCIAL_COURT"
  | "CONSUMER_COMMISSION"
  | "CIVIL_COURT"
  | "HIGH_COURT"
  | "ARBITRAL_TRIBUNAL"
  | "NCLT"
  | "CUSTOM_FORUM";

export interface ForumTemplateInfo {
  forumCategory: ForumCategory;
  courtHeading: string;
  governingStatute: string;
  proceedingType: string;
  pecuniaryThresholdNote: string;
  standardVerificationClause: string;
}

export interface PetitionParagraph {
  paragraphNumber: number;
  heading?: string;
  text: string;
  citedFactIds: string[];
  citedAnnexures: string[];
  requiresVerification: boolean;
}

export interface PetitionGroundItem {
  groundLetter: string; // "A", "B", "C"...
  statutoryBasis: string;
  argument: string;
  isVerifiedStatute: boolean;
  citedFactIds: string[];
}

export interface ConsolidatedPrayerItem {
  prayerId: string; // "(a)", "(b)", "(c)"
  reliefType: string;
  prayerText: string;
  quantifiedAmount?: string;
  isPrincipal: boolean;
  sourceEventIds: string[];
}

export interface GeneratedPetition {
  petitionId: string;
  matterTitle: string;
  dateGenerated: string;
  forumInfo: ForumTemplateInfo;
  courtHeading: string;
  causeTitle: string;
  partiesBlock: {
    petitionerName: string;
    petitionerAddress: string;
    petitionerRole: string;
    respondentName: string;
    respondentAddress: string;
    respondentRole: string;
  };
  natureOfProceeding: string;
  jurisdictionStatement: string;
  chronologicalListDates: Array<{
    date: string;
    eventSummary: string;
    annexureRef?: string;
  }>;
  statementOfFacts: PetitionParagraph[];
  eventBreachesAndResponses: PetitionParagraph[];
  anticipatedObjectionsAndRebuttals: PetitionParagraph[];
  grounds: PetitionGroundItem[];
  interimReliefSection?: PetitionParagraph[];
  consolidatedPrayers: ConsolidatedPrayerItem[];
  annexureIndex: AnnexureIndex;
  verificationStatement: {
    deponentName: string;
    place: string;
    verificationText: string;
  };
  advocateNotice: string;
  validationReport: PetitionValidationReport;
}

export interface PetitionValidationReport {
  isValid: boolean;
  missingFacts: string[];
  unsupportedClaims: string[];
  unverifiedLegalCitations: string[];
  missingAnnexures: string[];
  invalidCrossReferences: string[];
  missingMandatoryInformation: string[];
  itemsRequiringAdvocateReview: string[];
  notes: string[];
}

// ============================================================================
// WORKSPACE STATE (PERSISTED IN LOCAL STORAGE)
// ============================================================================

export interface PetitionWorkspaceState {
  caseId: string;
  currentStage: "overview" | "events" | "counterparty" | "annexures" | "preview" | "export";
  forumCategory: ForumCategory;
  courtHeading: string;
  petitionerName: string;
  petitionerAddress: string;
  respondentName: string;
  respondentAddress: string;
  events: PetitionEvent[];
  counterpartyArguments: CounterpartyArgument[];
  annexureIndex: AnnexureIndex;
  petitionDraft: GeneratedPetition | null;
  timelineVersion?: number;
  generatedWithTimelineVersion?: {
    counterparty?: number;
    petition?: number;
    annexures?: number;
  };
  isMigrated?: boolean;
  legacyFactLedgerBackup?: unknown;
  lastSavedTimestamp: string;
  isDirty: boolean;
}
