
/**
 * Deterministic Legal Assessment Engine
 *
 * Generates a rules-based preliminary triage report using keyword detection,
 * domain mapping, evidence checklists and predefined next-step guidance.
 *
 * This module makes NO calls to any LLM or generative AI service.
 * It is activated only when both primary and secondary Gemini models fail.
 *
 * All outputs are screening indicators - not legal conclusions.
 */

// =============================================
// SHARED TYPES (re-exported for route usage)
// =============================================

export interface TimelineEvent {
    date: string;
    description: string;
    source: string;
    isConfirmed: boolean;
    dateType: "confirmed" | "approximate" | "unknown";
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

export interface AssessmentEvidenceItem {
    evidence: string;
    why_it_matters: string;
}

export interface AssessmentPrecedentItem {
    case_id: string;
    case_name: string | undefined;
    citation: string | null | undefined;
    court: string | null | undefined;
    judgment_date: string | null | undefined;
    source_url: string | null | undefined;
    relevance: string;
    similarities: string;
    differences: string;
    legal_principle: string;
    legal_review_status: string | null | undefined;
    central_legal_issue?: string;
    actual_outcome?: string;
    relevant_reasoning?: string;
}

export interface RiskFactor {
    category: "Supporting" | "Adverse" | "Procedural";
    factor: string;
    impact: string;
}

export interface OutcomeAssessment {
    qualitativeAssessment: "Relatively favourable" | "Mixed or uncertain" | "Relatively unfavourable" | "Insufficient information";
    numericalProbability: null;
    statusText: string;
    riskLevel: "Low to Moderate" | "Moderate" | "Moderate to High" | "High";
    riskFactors: RiskFactor[];
    limitations: string;
    thresholdProposal: {
        thresholdPercentage: number;
        status: "Disabled (Pending Evaluated ML Model)";
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

export interface FilingPreparationAssistance {
    caseChecklist: {
        item: string;
        status: "Provided" | "Missing" | "Requires Verification";
        notes: string;
    }[];
    chronologicalFactsSummary: string[];
    documentOrganisationPlan: {
        annexure: string;
        documentDescription: string;
        sourceOrStatus: string;
    }[];
    missingInformation: string[];
    preliminaryDraftStructure: {
        documentType: string;
        jurisdictionHeading: string;
        partiesBlock: string;
        preliminaryStatement: string;
        factualGroundsDraft: string[];
        prayerDraft: string;
        placeholdersNotice: string;
    };
}

import type { DocumentProcessingReport } from "./pdfExtractor";

export interface NormalisedAssessment {
    assessment_title: string;
    executive_summary: string;
    understood_facts: string[];
    legal_issues: string[];
    strengths: AssessmentStrengthItem[];
    weaknesses: AssessmentWeaknessItem[];
    missing_evidence: AssessmentEvidenceItem[];
    precedent_analysis: AssessmentPrecedentItem[];
    recommended_next_steps: string[];
    limitations: string;
    document_processing?: DocumentProcessingReport;

    // Mentor required features
    case_timeline: TimelineEvent[];
    outcome_assessment: OutcomeAssessment;
    expected_duration: ExpectedCaseDuration;
    precautions_and_recommendations: PrecautionsAndRecommendations;
    legal_options: LegalOption[];
    filing_assistance: FilingPreparationAssistance;
}

export interface RetrievedPrecedent {
    id?: string;
    case_id: string;
    case_name: string;
    citation: string | null;
    court: string | null;
    judgment_date: string | null;
    domain: string | null;
    domain_tags: string[] | null;
    legal_issue: string | null;
    judgment_summary: string | null;
    disposal_nature?: string | null;
    source_url: string | null;
    source_dataset: string | null;
    legal_review_status: string | null;
    publication_status: string | null;
    relevance: number;
    matched_excerpt: string | null;
    judgment_text_snippet?: string;
}

export interface DeterministicResult {
    identifiedLegalIssues: string[];
    identifiedSearchQueries: string[];
    retrievedPrecedents: RetrievedPrecedent[];
    assessment: NormalisedAssessment;
    precedentRetrievalFailed: boolean;
}

export interface CaseMaterial {
    caseType: string;
    title: string;
    facts: string;
    desiredOutcome: string;
    jurisdiction: string;
    documentText: string;
    documentReport?: DocumentProcessingReport;
}

// =============================================
// DOMAIN DEFINITIONS
// =============================================

type Domain =
    | "commercial_contracts"
    | "arbitration"
    | "corporate_insolvency"
    | "consumer_disputes"
    | "property_disputes"
    | "employment_labour"
    | "unknown";

// =============================================
// DOMAIN DETECTION
// =============================================

const DOMAIN_SIGNALS: Record<Domain, string[]> = {
    commercial_contracts: [
        "contract", "agreement", "breach", "non-payment", "payment", "invoice",
        "purchase order", "delivery", "supply", "goods", "services", "vendor",
        "supplier", "buyer", "seller", "liquidated damages", "bank guarantee",
        "dues", "outstanding", "termination", "defective", "acceptance",
        "commercial", "business", "trade", "indemnity", "penalty",
    ],
    arbitration: [
        "arbitration", "arbitrator", "arbitral", "tribunal", "award", "section 34",
        "section 37", "arbitration clause", "dispute resolution", "invocation",
        "appointment", "arbitration agreement", "interim", "stay", "enforce",
        "arbitration and conciliation act", "aca", "seat", "sole arbitrator",
    ],
    corporate_insolvency: [
        "insolvency", "ibc", "nclt", "resolution", "liquidation", "creditor",
        "financial creditor", "operational creditor", "corporate debtor",
        "resolution plan", "resolution professional", "moratorium",
        "corporate insolvency resolution process", "cirp",
    ],
    consumer_disputes: [
        "consumer", "deficiency", "service deficiency", "unfair trade practice",
        "product liability", "consumer forum", "consumer commission", "ncdrc",
        "district forum", "state commission", "compensation",
    ],
    property_disputes: [
        "property", "land", "plot", "flat", "apartment", "sale deed",
        "agreement to sell", "title", "possession", "lease", "rent",
        "tenant", "landlord", "eviction", "stamp duty", "registry",
        "real estate", "builder", "rera", "allotment",
    ],
    employment_labour: [
        "employment", "employee", "employer", "termination", "dismissal",
        "retrenchment", "reinstatement", "back wages", "labour court",
        "industrial tribunal", "workman", "service", "appointment letter",
        "salary", "gratuity", "provident fund", "pf", "esic",
    ],
    unknown: [],
};

const CASE_TYPE_MAP: Record<string, Domain[]> = {
    "commercial": ["commercial_contracts"],
    "commercial / business dispute": ["commercial_contracts"],
    "contractual dispute": ["commercial_contracts"],
    "arbitration": ["arbitration"],
    "insolvency": ["corporate_insolvency"],
    "consumer": ["consumer_disputes"],
    "consumer dispute": ["consumer_disputes"],
    "property": ["property_disputes"],
    "property dispute": ["property_disputes"],
    "employment": ["employment_labour"],
    "employment dispute": ["employment_labour"],
    "labour": ["employment_labour"],
};

function detectDomains(material: CaseMaterial): Domain[] {
    const combined = (
        material.caseType + " " +
        material.title + " " +
        material.facts + " " +
        material.documentText
    ).toLowerCase();

    const scores: Partial<Record<Domain, number>> = {};

    // Boost from user-selected case type
    for (const [key, domains] of Object.entries(CASE_TYPE_MAP)) {
        if (combined.includes(key)) {
            for (const d of domains) {
                scores[d] = (scores[d] ?? 0) + 5;
            }
        }
    }

    // Keyword scoring
    for (const [domain, signals] of Object.entries(DOMAIN_SIGNALS) as [Domain, string[]][]) {
        if (domain === "unknown") continue;
        for (const signal of signals) {
            if (combined.includes(signal)) {
                scores[domain] = (scores[domain] ?? 0) + 1;
            }
        }
    }

    const ranked = (Object.entries(scores) as [Domain, number][])
        .filter(([, score]) => score >= 2)
        .sort(([, a], [, b]) => b - a)
        .map(([d]) => d);

    return ranked.length > 0 ? ranked.slice(0, 3) : ["unknown"];
}

// =============================================
// LEGAL ISSUE IDENTIFICATION
// =============================================

const ISSUE_MAP: Record<Domain, { phrase: string; issue: string }[]> = {
    commercial_contracts: [
        { phrase: "non-payment", issue: "Non-payment or delayed payment under contract" },
        { phrase: "payment", issue: "Recovery of outstanding dues" },
        { phrase: "breach", issue: "Breach of contract" },
        { phrase: "defective", issue: "Defective goods or non-conforming supply" },
        { phrase: "termination", issue: "Wrongful or premature contract termination" },
        { phrase: "liquidated damages", issue: "Claim for liquidated damages" },
        { phrase: "bank guarantee", issue: "Invocation or enforcement of bank guarantee" },
        { phrase: "delivery", issue: "Disputed delivery or acceptance of goods or services" },
        { phrase: "purchase order", issue: "Dispute arising from purchase order" },
        { phrase: "indemnity", issue: "Indemnity claim under contract" },
        { phrase: "penalty", issue: "Levy of contractual penalty" },
    ],
    arbitration: [
        { phrase: "arbitration clause", issue: "Existence and validity of arbitration agreement" },
        { phrase: "arbitration agreement", issue: "Existence and validity of arbitration agreement" },
        { phrase: "arbitrator", issue: "Appointment of arbitrator" },
        { phrase: "jurisdiction", issue: "Jurisdiction of arbitral tribunal" },
        { phrase: "section 34", issue: "Challenge to arbitral award under Section 34" },
        { phrase: "section 37", issue: "Appeal under Section 37" },
        { phrase: "interim", issue: "Interim protection or injunction" },
        { phrase: "invocation", issue: "Invocation of arbitration clause" },
        { phrase: "award", issue: "Enforcement or challenge of arbitral award" },
    ],
    corporate_insolvency: [
        { phrase: "financial creditor", issue: "Financial creditor claim under IBC" },
        { phrase: "operational creditor", issue: "Operational creditor claim under IBC" },
        { phrase: "resolution plan", issue: "Approval or challenge of resolution plan" },
        { phrase: "liquidation", issue: "Liquidation proceedings" },
        { phrase: "moratorium", issue: "Moratorium period under CIRP" },
        { phrase: "cirp", issue: "Corporate Insolvency Resolution Process (CIRP)" },
    ],
    consumer_disputes: [
        { phrase: "deficiency", issue: "Deficiency in service" },
        { phrase: "unfair trade practice", issue: "Unfair trade practice" },
        { phrase: "product liability", issue: "Product liability claim" },
        { phrase: "compensation", issue: "Claim for compensation" },
        { phrase: "builder", issue: "Builder-buyer dispute" },
    ],
    property_disputes: [
        { phrase: "title", issue: "Disputed property title" },
        { phrase: "possession", issue: "Recovery of possession" },
        { phrase: "sale deed", issue: "Enforceability of sale deed" },
        { phrase: "agreement to sell", issue: "Specific performance of agreement to sell" },
        { phrase: "lease", issue: "Lease or tenancy dispute" },
        { phrase: "eviction", issue: "Eviction proceedings" },
        { phrase: "rera", issue: "RERA complaint - real estate regulatory matter" },
    ],
    employment_labour: [
        { phrase: "termination", issue: "Wrongful termination of employment" },
        { phrase: "retrenchment", issue: "Disputed retrenchment" },
        { phrase: "reinstatement", issue: "Claim for reinstatement" },
        { phrase: "back wages", issue: "Recovery of back wages" },
        { phrase: "gratuity", issue: "Disputed gratuity payment" },
        { phrase: "provident fund", issue: "Provident fund dispute" },
        { phrase: "dismissal", issue: "Dismissal from service" },
    ],
    unknown: [],
};

function identifyLegalIssues(
    material: CaseMaterial,
    domains: Domain[]
): string[] {
    const combined = (
        material.title + " " +
        material.facts + " " +
        material.documentText
    ).toLowerCase();

    const issues = new Set<string>();

    for (const domain of domains) {
        const mappings = ISSUE_MAP[domain] ?? [];
        for (const { phrase, issue } of mappings) {
            if (combined.includes(phrase)) {
                issues.add(issue);
            }
        }
    }

    // Limitation period is always relevant
    issues.add("Applicable limitation period - verification required");

    return Array.from(issues).slice(0, 10);
}

// =============================================
// SEARCH QUERY GENERATION
// =============================================

const DOMAIN_SEARCH_TERMS: Record<Domain, string[]> = {
    commercial_contracts: [
        "breach of contract payment India",
        "commercial contract dispute recovery",
        "supply agreement termination",
    ],
    arbitration: [
        "arbitration clause enforcement India",
        "appointment of arbitrator section 11",
        "interim relief arbitration India",
    ],
    corporate_insolvency: [
        "CIRP financial creditor NCLT",
        "operational creditor insolvency India",
        "resolution plan approval IBC",
    ],
    consumer_disputes: [
        "deficiency in service consumer forum",
        "consumer dispute compensation India",
        "builder buyer RERA complaint",
    ],
    property_disputes: [
        "specific performance agreement to sell",
        "property title dispute India",
        "possession recovery real estate",
    ],
    employment_labour: [
        "wrongful termination reinstatement labour court",
        "retrenchment back wages industrial dispute",
        "dismissal workman industrial tribunal",
    ],
    unknown: [
        "Indian court judgment dispute",
        "civil dispute India Supreme Court",
    ],
};

function buildSearchQueries(
    material: CaseMaterial,
    domains: Domain[]
): string[] {
    const queries: string[] = [];

    // Use title words if available
    const titleWords = material.title
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .slice(0, 3)
        .join(" ");

    if (titleWords.length > 5) {
        queries.push(titleWords);
    }

    // Domain-specific terms
    for (const domain of domains.slice(0, 2)) {
        const terms = DOMAIN_SEARCH_TERMS[domain] ?? [];
        queries.push(...terms.slice(0, 2));
    }

    return Array.from(new Set(queries)).slice(0, 3);
}

// =============================================
// STRENGTHS AND WEAKNESSES
// =============================================

interface IndicatorRule {
    presentPhrase: string[];
    absentSignal?: string[];
    factor: string;
    explanation: string;
    factual_basis_present: string;
    factual_basis_absent: string;
    isStrength: boolean;
}

const INDICATOR_RULES: Record<Domain, IndicatorRule[]> = {
    commercial_contracts: [
        {
            presentPhrase: ["agreement", "contract", "written"],
            factor: "Written agreement appears to be available",
            explanation: "A written contract provides documentary evidence of the agreed terms and obligations.",
            factual_basis_present: "Submission references an agreement or contract.",
            factual_basis_absent: "No written agreement is mentioned in the submission.",
            isStrength: true,
        },
        {
            presentPhrase: ["invoice", "tax invoice", "bill"],
            factor: "Invoices or payment records appear to be available",
            explanation: "Invoices support the existence and quantum of outstanding amounts.",
            factual_basis_present: "Submission mentions invoices or billing records.",
            factual_basis_absent: "No invoices are mentioned.",
            isStrength: true,
        },
        {
            presentPhrase: ["delivery", "goods receipt", "challan", "dispatched", "received"],
            factor: "Delivery documentation appears to exist",
            explanation: "Delivery challans or goods receipt notes support proof of performance.",
            factual_basis_present: "Submission references delivery or dispatch of goods.",
            factual_basis_absent: "No delivery documentation is mentioned.",
            isStrength: true,
        },
        {
            presentPhrase: ["email", "letter", "notice", "correspondence", "communicated"],
            factor: "Written correspondence appears to be available",
            explanation: "Emails and notices create a record of the dispute and demands made.",
            factual_basis_present: "Submission references correspondence or notices.",
            factual_basis_absent: "No correspondence or demand notice is mentioned.",
            isStrength: true,
        },
        {
            presentPhrase: ["defective", "defect", "quality", "rejection"],
            factor: "Allegation of defective goods or poor quality",
            explanation: "If the opposing party alleges defective goods, this may require supporting inspection reports and quality documentation.",
            factual_basis_present: "Submission mentions allegations of defective or substandard goods.",
            factual_basis_absent: "",
            isStrength: false,
        },
        {
            presentPhrase: ["inspection", "acceptance"],
            absentSignal: ["acceptance", "accepted", "approved"],
            factor: "Acceptance of goods or services may be disputed",
            explanation: "Where formal acceptance records are absent, the opposing party may challenge whether goods or services were properly accepted.",
            factual_basis_present: "Submission references inspection or acceptance.",
            factual_basis_absent: "No acceptance documentation is mentioned.",
            isStrength: false,
        },
    ],
    arbitration: [
        {
            presentPhrase: ["arbitration clause", "arbitration agreement", "arbitration"],
            factor: "Arbitration clause appears to be present in the agreement",
            explanation: "The existence of an arbitration clause is the foundational requirement for initiating arbitration proceedings.",
            factual_basis_present: "Submission references an arbitration clause or agreement.",
            factual_basis_absent: "No arbitration clause is mentioned; recourse to arbitration may require further verification.",
            isStrength: true,
        },
        {
            presentPhrase: ["invocation", "notice", "section 21"],
            factor: "Arbitration invocation notice appears to have been issued",
            explanation: "Sending a valid invocation notice is a procedural step required before commencing arbitration.",
            factual_basis_present: "Submission references invocation of arbitration.",
            factual_basis_absent: "No invocation notice is mentioned.",
            isStrength: true,
        },
        {
            presentPhrase: ["time", "period", "delay", "limitation"],
            factor: "Limitation period requires verification",
            explanation: "Arbitration proceedings are subject to the Limitation Act. Late claims may face a limitation challenge.",
            factual_basis_present: "Submission references timing of events that may affect limitation.",
            factual_basis_absent: "",
            isStrength: false,
        },
    ],
    corporate_insolvency: [
        {
            presentPhrase: ["financial creditor", "loan", "debt", "npa", "default"],
            factor: "Financial creditor status appears to be established",
            explanation: "Financial creditors have a defined admission process under the IBC before NCLT.",
            factual_basis_present: "Submission indicates a financial creditor relationship.",
            factual_basis_absent: "Creditor category not clearly stated - financial or operational status requires verification.",
            isStrength: true,
        },
        {
            presentPhrase: ["resolution plan", "approved"],
            factor: "Resolution plan status may be relevant",
            explanation: "An approved resolution plan binds all creditors and may affect the relief available.",
            factual_basis_present: "Submission references a resolution plan.",
            factual_basis_absent: "",
            isStrength: false,
        },
    ],
    consumer_disputes: [
        {
            presentPhrase: ["consumer", "purchased", "paid", "bought"],
            factor: "Consumer eligibility appears to be established",
            explanation: "The complainant's status as a consumer within the meaning of the Consumer Protection Act is a threshold requirement.",
            factual_basis_present: "Submission describes a consumer purchase or payment for services.",
            factual_basis_absent: "Consumer status requires verification.",
            isStrength: true,
        },
        {
            presentPhrase: ["commercial purpose", "resale", "business use"],
            factor: "Consumer eligibility may be disputed",
            explanation: "Goods or services purchased for commercial purposes may fall outside the scope of consumer protection legislation.",
            factual_basis_present: "Submission references commercial or business use of goods or services.",
            factual_basis_absent: "",
            isStrength: false,
        },
    ],
    property_disputes: [
        {
            presentPhrase: ["sale deed", "registered", "registry"],
            factor: "Registered sale deed appears to be available",
            explanation: "A registered sale deed is primary evidence of title transfer under Indian property law.",
            factual_basis_present: "Submission references a sale deed or registration.",
            factual_basis_absent: "No registered sale deed is mentioned; title documentation requires verification.",
            isStrength: true,
        },
        {
            presentPhrase: ["possession", "actual possession", "physical possession"],
            factor: "Possession appears to have been taken",
            explanation: "Physical possession supports certain equitable and legal rights in property disputes.",
            factual_basis_present: "Submission references possession of the property.",
            factual_basis_absent: "Possession status is not clearly stated.",
            isStrength: true,
        },
        {
            presentPhrase: ["title dispute", "encumbrance", "third party", "prior claim"],
            factor: "Third party or title dispute may complicate the matter",
            explanation: "Competing claims or encumbrances on the property may require separate proceedings or resolution.",
            factual_basis_present: "Submission references a title dispute or third party claim.",
            factual_basis_absent: "",
            isStrength: false,
        },
    ],
    employment_labour: [
        {
            presentPhrase: ["appointment letter", "offer letter", "employment contract"],
            factor: "Employment appointment document appears to exist",
            explanation: "An appointment letter establishes the terms and conditions of employment relevant to the dispute.",
            factual_basis_present: "Submission references an appointment letter or employment agreement.",
            factual_basis_absent: "No appointment letter is mentioned.",
            isStrength: true,
        },
        {
            presentPhrase: ["service record", "performance", "record"],
            factor: "Service record documentation may be relevant",
            explanation: "Service records and performance documentation may be relevant to the reasons given for termination or dismissal.",
            factual_basis_present: "Submission references employment history or records.",
            factual_basis_absent: "No service record is mentioned.",
            isStrength: true,
        },
        {
            presentPhrase: ["misconduct", "disciplinary", "inquiry", "show cause"],
            factor: "Disciplinary proceedings may be relevant",
            explanation: "If disciplinary proceedings preceded the termination, the procedural compliance will be examined.",
            factual_basis_present: "Submission references disciplinary action or proceedings.",
            factual_basis_absent: "",
            isStrength: false,
        },
    ],
    unknown: [],
};

function assessIndicators(
    material: CaseMaterial,
    domains: Domain[]
): { strengths: AssessmentStrengthItem[]; weaknesses: AssessmentWeaknessItem[] } {
    const combined = (
        material.title + " " +
        material.facts + " " +
        material.documentText
    ).toLowerCase();

    const strengths: AssessmentStrengthItem[] = [];
    const weaknesses: AssessmentWeaknessItem[] = [];
    const seen = new Set<string>();

    for (const domain of domains) {
        const rules = INDICATOR_RULES[domain] ?? [];
        for (const rule of rules) {
            if (seen.has(rule.factor)) continue;
            const found = rule.presentPhrase.some((p) => combined.includes(p));
            if (found) {
                seen.add(rule.factor);
                if (rule.isStrength) {
                    strengths.push({
                        factor: rule.factor,
                        explanation: rule.explanation,
                        factual_basis: rule.factual_basis_present,
                    });
                } else {
                    weaknesses.push({
                        factor: rule.factor,
                        explanation: rule.explanation,
                        factual_basis: rule.factual_basis_present,
                    });
                }
            }
        }
    }

    return { strengths, weaknesses };
}

// =============================================
// EVIDENCE CHECKLISTS
// =============================================

const EVIDENCE_CHECKLISTS: Record<Domain, { evidence: string; why_it_matters: string }[]> = {
    commercial_contracts: [
        { evidence: "Signed contract or agreement", why_it_matters: "Establishes the agreed terms, obligations and dispute resolution mechanism." },
        { evidence: "Purchase orders and acknowledgements", why_it_matters: "Documents the specific goods or services ordered and the agreed price." },
        { evidence: "Delivery challans and goods receipt notes", why_it_matters: "Provides evidence that goods were delivered and received." },
        { evidence: "Inspection and acceptance records", why_it_matters: "Confirms whether goods or services were formally accepted." },
        { evidence: "Tax invoices for dues claimed", why_it_matters: "Supports the quantum of outstanding amounts." },
        { evidence: "Payment records and bank statements", why_it_matters: "Documents amounts paid and amounts outstanding." },
        { evidence: "Emails and written correspondence", why_it_matters: "Creates a record of the dispute, demands and responses." },
        { evidence: "Formal demand notice", why_it_matters: "A written demand is often a prerequisite before litigation or arbitration." },
        { evidence: "Defect or rejection notices (if applicable)", why_it_matters: "Relevant where the opposing party contests quality or compliance." },
        { evidence: "Arbitration clause or dispute resolution provision", why_it_matters: "Determines the appropriate dispute resolution forum." },
    ],
    arbitration: [
        { evidence: "Original arbitration agreement or clause", why_it_matters: "The foundational document for arbitration proceedings." },
        { evidence: "Invocation notice (Section 21 notice)", why_it_matters: "A mandatory procedural step before arbitration can commence." },
        { evidence: "Correspondence regarding arbitrator appointment", why_it_matters: "Documents steps taken to constitute the tribunal." },
        { evidence: "Arbitral award (if proceedings have concluded)", why_it_matters: "The primary document for enforcement or challenge proceedings." },
        { evidence: "Section 34 or Section 37 filings (if applicable)", why_it_matters: "Relevant where the award is being challenged or appealed." },
        { evidence: "Evidence filed before the tribunal", why_it_matters: "Supports the claims or defences advanced in arbitration." },
        { evidence: "Procedural orders issued by the tribunal", why_it_matters: "Documents the procedural history and any interim directions." },
    ],
    corporate_insolvency: [
        { evidence: "Proof of debt (IBC Form)", why_it_matters: "Required for submission of claims before the Resolution Professional." },
        { evidence: "Loan agreement or financial document", why_it_matters: "Establishes the financial creditor relationship and the amount due." },
        { evidence: "Default notice", why_it_matters: "Evidences the date and fact of default." },
        { evidence: "NCLT order admitting CIRP application", why_it_matters: "The initiating order for insolvency proceedings." },
        { evidence: "Resolution plan (if applicable)", why_it_matters: "The document approved by the Committee of Creditors." },
        { evidence: "Certificate of default from information utility (if available)", why_it_matters: "Supports the CIRP application." },
    ],
    consumer_disputes: [
        { evidence: "Invoice or purchase receipt", why_it_matters: "Establishes consumer status and the amount paid." },
        { evidence: "Warranty card or service agreement", why_it_matters: "Documents the contractual obligations of the seller or service provider." },
        { evidence: "Complaint correspondence with the opposite party", why_it_matters: "Shows that the grievance was raised before approaching the forum." },
        { evidence: "Expert or inspection report (if applicable)", why_it_matters: "Supports allegations of product defect or service deficiency." },
        { evidence: "Photographs or video evidence of defective product", why_it_matters: "Visual documentation of the alleged defect or deficiency." },
        { evidence: "Communication records (emails, messages)", why_it_matters: "Documents the history of the complaint and the opposite party's responses." },
    ],
    property_disputes: [
        { evidence: "Registered sale deed", why_it_matters: "Primary evidence of title transfer." },
        { evidence: "Agreement to sell", why_it_matters: "Establishes the terms agreed between buyer and seller." },
        { evidence: "Title search report", why_it_matters: "Documents the chain of ownership and any encumbrances." },
        { evidence: "Property tax receipts", why_it_matters: "Supports possession and ownership claims." },
        { evidence: "Possession receipt or handover letter", why_it_matters: "Documents the date and fact of possession." },
        { evidence: "Payment receipts for consideration paid", why_it_matters: "Evidences payments made under the sale agreement." },
        { evidence: "RERA registration details (if applicable)", why_it_matters: "Relevant for disputes involving registered real estate projects." },
        { evidence: "Correspondence with the builder or seller", why_it_matters: "Documents demands, complaints and the opposite party's responses." },
    ],
    employment_labour: [
        { evidence: "Appointment letter", why_it_matters: "Establishes the terms and conditions of employment." },
        { evidence: "Termination or dismissal order", why_it_matters: "The primary document evidencing the disputed action." },
        { evidence: "Service record and attendance records", why_it_matters: "Supports continuity of service and employment history." },
        { evidence: "Pay slips and salary statements", why_it_matters: "Evidences the salary structure and amounts due." },
        { evidence: "Show cause notice and response (if applicable)", why_it_matters: "Documents the disciplinary process followed before termination." },
        { evidence: "Inquiry report (if applicable)", why_it_matters: "The findings of any internal disciplinary inquiry." },
        { evidence: "Representation or grievance filed with employer", why_it_matters: "Documents internal dispute resolution steps." },
        { evidence: "Proof of PF and ESIC contributions", why_it_matters: "Relevant for provident fund and social security disputes." },
    ],
    unknown: [
        { evidence: "All relevant documents and agreements", why_it_matters: "The specific documents required will depend on the nature of the legal matter." },
        { evidence: "Correspondence and communication records", why_it_matters: "Written communications create a factual record." },
        { evidence: "Payment and financial records (if applicable)", why_it_matters: "Relevant where money claims are involved." },
        { evidence: "Notices issued or received", why_it_matters: "Legal notices are often procedural prerequisites." },
    ],
};

function buildEvidenceChecklist(
    material: CaseMaterial,
    domains: Domain[]
): AssessmentEvidenceItem[] {
    const combined = (
        material.facts + " " +
        material.documentText
    ).toLowerCase();

    const items: AssessmentEvidenceItem[] = [];
    const seen = new Set<string>();

    for (const domain of domains) {
        const checklist = EVIDENCE_CHECKLISTS[domain] ?? [];
        for (const item of checklist) {
            if (seen.has(item.evidence)) continue;
            // Only flag if the document is not clearly mentioned
            const keywords = item.evidence
                .toLowerCase()
                .split(/[\s,()]+/)
                .filter((w) => w.length > 4);
            const alreadyMentioned = keywords.some((kw) => combined.includes(kw));
            if (!alreadyMentioned) {
                items.push(item);
                seen.add(item.evidence);
            }
        }
    }

    return items.slice(0, 12);
}

// =============================================
// NEXT STEPS
// =============================================

const DOMAIN_NEXT_STEPS: Record<Domain, string[]> = {
    commercial_contracts: [
        "Locate and preserve the original signed contract or agreement.",
        "Organise all invoices, purchase orders and delivery records.",
        "Compile correspondence, emails and written demands sent to the opposite party.",
        "Prepare a clear account of amounts paid and amounts outstanding.",
        "If a formal demand notice has not already been issued, consider having one sent through a qualified advocate.",
        "Review the dispute resolution clause in the contract - it may specify arbitration, mediation or a particular court.",
        "Have the applicable limitation period checked by a qualified advocate to ensure no claim has become time-barred.",
    ],
    arbitration: [
        "Locate the original agreement containing the arbitration clause.",
        "Verify whether a valid invocation notice (Section 21 notice) has been issued.",
        "If an arbitrator has not yet been appointed, consider the appointment mechanism specified in the agreement.",
        "Consult a qualified advocate regarding any time limits for initiating or continuing arbitration proceedings.",
        "Gather all evidence and documents relevant to the claims or defences to be advanced in arbitration.",
        "If an arbitral award has already been passed, verify the timeline for filing any challenge under Section 34.",
    ],
    corporate_insolvency: [
        "Verify whether a Corporate Insolvency Resolution Process (CIRP) has already been initiated against the corporate debtor.",
        "If CIRP is underway, file a proof of claim with the Resolution Professional without delay.",
        "Consult a qualified advocate regarding the applicable forms and procedures before the NCLT.",
        "Gather all financial documents evidencing the debt and the date of default.",
        "Verify whether the limitation period for filing an insolvency application has been met.",
    ],
    consumer_disputes: [
        "Compile all purchase receipts, invoices and warranty documents.",
        "Collect all correspondence with the seller or service provider regarding the complaint.",
        "Identify the appropriate consumer forum based on the value of the claim and jurisdiction.",
        "Consider sending a formal complaint letter to the opposite party before filing at the forum.",
        "Consult a qualified advocate regarding the consumer forum's jurisdiction, procedures and limitation period.",
    ],
    property_disputes: [
        "Obtain a certified copy of all property documents, including the sale deed and agreement to sell.",
        "Commission a title search report to verify the chain of ownership and encumbrances.",
        "Compile all payment receipts and correspondence with the builder or seller.",
        "Verify the RERA registration of the project, if applicable.",
        "Consult a qualified advocate regarding the appropriate court or forum and any urgent interim relief that may be available.",
        "Have the limitation period for any specific performance or possession claim reviewed by a qualified advocate.",
    ],
    employment_labour: [
        "Locate and preserve the appointment letter, termination or dismissal order and service records.",
        "Compile all salary slips, bank statements and records of amounts due.",
        "If disciplinary proceedings preceded the termination, gather the show cause notice, your response and the inquiry report.",
        "Consult a qualified advocate regarding the appropriate labour forum, whether the industrial disputes act applies and the applicable time limits.",
        "Verify whether the employer followed the required statutory procedures before effecting retrenchment or dismissal.",
    ],
    unknown: [
        "Identify and preserve all documents and records relevant to the matter.",
        "Compile a chronological account of the events giving rise to the dispute.",
        "Issue a formal written notice to the opposing party documenting your position, if not already done.",
        "Consult a qualified advocate to identify the appropriate legal forum and applicable laws.",
        "Have the limitation period reviewed promptly - delay may bar otherwise valid claims.",
    ],
};

const UNIVERSAL_NEXT_STEPS = [
    "This assessment is generated by a rules-based system. Consult a qualified advocate before taking legal action.",
    "Do not destroy or alter any original documents relating to the matter.",
    "Preserve all electronic communications, including emails and messages.",
];

function buildNextSteps(domains: Domain[]): string[] {
    const steps: string[] = [];
    for (const domain of domains.slice(0, 2)) {
        steps.push(...(DOMAIN_NEXT_STEPS[domain] ?? []));
    }
    steps.push(...UNIVERSAL_NEXT_STEPS);
    return [...new Set(steps)].slice(0, 10);
}

// =============================================
// PRECEDENT ANALYSIS (using retrieved results)
// =============================================

// =============================================
// 1. TIMELINE EXTRACTION
// =============================================

export function buildDeterministicTimeline(material: CaseMaterial): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const textSources: { text: string; source: string }[] = [
        { text: material.facts, source: "User Submitted Facts" }
    ];

    if (material.documentText) {
        const docName = material.documentReport?.items?.[0]?.fileName || "Uploaded Document";
        textSources.push({ text: material.documentText.slice(0, 8000), source: `Document: ${docName}` });
    }

    const dateRegexes = [
        // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/g,
        // 12th January 2024 / 12 Jan 2024
        /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{2,4})\b/gi,
        // January 12, 2024
        /\b((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?[\s,]+\d{2,4})\b/gi,
        // Month Year (e.g. March 2023, Jan 2024)
        /\b((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(?:20\d{2}|19\d{2}))\b/gi,
        // in/dated/around/since 2024 or Month 2024
        /\b(?:in|dated|around|since|from|by|on)\s+((?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?(?:20\d{2}|19\d{2}))\b/gi,
    ];

    const seenDates = new Set<string>();

    for (const { text, source } of textSources) {
        if (!text) continue;
        const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 15);

        for (const sentence of sentences) {
            for (const rx of dateRegexes) {
                let match: RegExpExecArray | null;
                const rxCopy = new RegExp(rx.source, rx.flags);
                while ((match = rxCopy.exec(sentence)) !== null) {
                    const rawDate = match[1].trim();
                    if (seenDates.has(rawDate.toLowerCase())) continue;
                    seenDates.add(rawDate.toLowerCase());

                    // Truncate surrounding sentence to reasonable description
                    const cleanDesc = sentence.replace(/\s+/g, " ").trim();
                    const desc = cleanDesc.length > 180 ? cleanDesc.slice(0, 180) + "..." : cleanDesc;

                    const isPrecise = /\d{1,2}[/-]\d{1,2}/.test(rawDate) || /\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+/.test(rawDate);

                    events.push({
                        date: rawDate,
                        description: desc,
                        source,
                        isConfirmed: isPrecise,
                        dateType: isPrecise ? "confirmed" : "approximate",
                    });

                    if (events.length >= 8) break;
                }
                if (events.length >= 8) break;
            }
            if (events.length >= 8) break;
        }
    }

    if (events.length === 0) {
        events.push({
            date: "Date unspecified (Initial event)",
            description: `Inception of dispute as stated in submission: "${material.title || "Subject matter"}"`,
            source: "User Submitted Facts",
            isConfirmed: false,
            dateType: "unknown",
        });
        if (material.documentReport?.items?.length) {
            events.push({
                date: "Document Attachment Date",
                description: `Supporting documents (${material.documentReport.items.map(i => i.fileName).join(", ")}) provided for preliminary assessment.`,
                source: "Intake Upload",
                isConfirmed: true,
                dateType: "confirmed",
            });
        }
    }

    return events.slice(0, 10);
}

// =============================================
// 2. PREDICTIVE OUTCOME ASSESSMENT (WIN PROBABILITY)
// =============================================

export function buildDeterministicOutcomeAssessment(
    material: CaseMaterial,
    domains: Domain[],
    strengths: AssessmentStrengthItem[],
    weaknesses: AssessmentWeaknessItem[]
): OutcomeAssessment {
    const strengthCount = strengths.length;
    const weaknessCount = weaknesses.length;

    let qualitativeAssessment: OutcomeAssessment["qualitativeAssessment"] = "Mixed or uncertain";
    let riskLevel: OutcomeAssessment["riskLevel"] = "Moderate";

    if (strengthCount >= 3 && weaknessCount <= 1) {
        qualitativeAssessment = "Relatively favourable";
        riskLevel = "Low to Moderate";
    } else if (weaknessCount >= 3 && strengthCount <= 1) {
        qualitativeAssessment = "Relatively unfavourable";
        riskLevel = "Moderate to High";
    } else if (strengthCount === 0 && weaknessCount === 0) {
        qualitativeAssessment = "Insufficient information";
        riskLevel = "Moderate to High";
    }

    const riskFactors: RiskFactor[] = [];

    for (const s of strengths.slice(0, 3)) {
        riskFactors.push({
            category: "Supporting",
            factor: s.factor,
            impact: "Supports the prima facie maintainability and merits of the position.",
        });
    }

    for (const w of weaknesses.slice(0, 3)) {
        riskFactors.push({
            category: "Adverse",
            factor: w.factor,
            impact: "Presents potential evidential gaps or defences that the opposing party may raise.",
        });
    }

    riskFactors.push({
        category: "Procedural",
        factor: "Applicable limitation period & mandatory pre-institution procedures",
        impact: "Failure to verify limitation or comply with mandatory dispute resolution steps can bar claims at the threshold.",
    });

    return {
        qualitativeAssessment,
        numericalProbability: null,
        statusText: "Insufficient validated historical data for a reliable probability estimate.",
        riskLevel,
        riskFactors,
        limitations: "This assessment is based on preliminary screening of submitted details against a curated research collection of 109 Supreme Court judgments. In the absence of an independently calibrated and evaluated predictive model trained on representative trial-level outcomes, converting qualitative indicators into a mathematical percentage would be misleading. This section identifies preliminary risk factors only.",
        thresholdProposal: {
            thresholdPercentage: 60,
            status: "Disabled (Pending Evaluated ML Model)",
            isEligible: null,
            explanation: "The mentor's proposal for an automated 60% favourable-outcome threshold for filing assistance is structurally integrated in the application architecture, but remains strictly disabled until an evaluated machine-learning model is calibrated on a verified dataset. It serves as an assistance eligibility mechanism, not a decision on whether to litigate.",
        },
    };
}

// =============================================
// 3. EXPECTED CASE DURATION
// =============================================

export function buildDeterministicExpectedDuration(domains: Domain[]): ExpectedCaseDuration {
    const domain = domains[0] || "commercial_contracts";

    let stages: ProceduralStage[] = [
        {
            stageName: "Stage 1: Pre-litigation Notice & Statutory Procedures",
            description: "Issuance of formal legal notice / demand letter and statutory pre-institution mediation (e.g. under Section 12A of Commercial Courts Act, 2015, where applicable).",
            typicalActivities: "Drafting demand notice, dispatch via speed post/email, exploring pre-institution mediation through District Legal Services Authority (DLSA).",
        },
        {
            stageName: "Stage 2: Plaint / Petition Filing & Scrutiny",
            description: "Drafting, payment of court fees, filing before the registry, removing registry objections, and listing before the bench.",
            typicalActivities: "Registry verification, removal of office objections, first motion hearing, issuance of summons or notice to opposite party.",
        },
        {
            stageName: "Stage 3: Service of Summons & Pleadings Completion",
            description: "Formal service of summons upon the respondent and completion of written statements / replies and rejoinders.",
            typicalActivities: "Proof of service, filing Written Statement within statutory 30-120 days, admission/denial of documents, replication.",
        },
        {
            stageName: "Stage 4: Framing of Issues / Case Management Hearing",
            description: "Court frames specific legal and factual issues for trial and establishes case management timelines.",
            typicalActivities: "Filing list of witnesses, inspection of original documents, witness affidavits in lieu of examination-in-chief.",
        },
        {
            stageName: "Stage 5: Evidence & Cross-Examination",
            description: "Recording of oral evidence, cross-examination of plaintiff and defendant witnesses before the court or court commissioner.",
            typicalActivities: "Deposition of witnesses, marking exhibits, commissioner hearings.",
        },
        {
            stageName: "Stage 6: Final Arguments & Adjudication / Judgment",
            description: "Detailed oral arguments advanced by advocates on questions of fact and law, followed by reserved judgment and decree.",
            typicalActivities: "Submission of written arguments, citation of judicial precedents, pronouncement of judgment.",
        },
    ];

    if (domain === "arbitration") {
        stages = [
            {
                stageName: "Stage 1: Section 21 Invocation Notice",
                description: "Issuance of formal notice invoking the arbitration agreement and nominating or requesting arbitrator appointment.",
                typicalActivities: "Drafting Section 21 notice, sending to respondent, awaiting statutory 30-day response period.",
            },
            {
                stageName: "Stage 2: Arbitrator Appointment (Section 11) / Interim Relief (Section 9)",
                description: "If appointment is contested, filing application under Section 11 before High Court/Supreme Court. Urgent preservation under Section 9.",
                typicalActivities: "Petition filing, notice to other side, appointment order by the referral court.",
            },
            {
                stageName: "Stage 3: Preliminary Meeting & Statement of Claim",
                description: "First procedural meeting before the Sole Arbitrator / Arbitral Tribunal to fix procedural orders and schedule.",
                typicalActivities: "Filing Statement of Claim, Statement of Defence, Counter-claims, and procedural timetable.",
            },
            {
                stageName: "Stage 4: Evidence & Written Submissions",
                description: "Filing witness affidavits, cross-examination, and marking of documentary evidence.",
                typicalActivities: "Hearings before tribunal, marking exhibits, interrogatories.",
            },
            {
                stageName: "Stage 5: Final Arguments & Arbitral Award",
                description: "Oral arguments followed by delivery of the signed arbitral award.",
                typicalActivities: "Delivery of award within the statutory 12-month period (extendable by 6 months under Section 29A).",
            },
            {
                stageName: "Stage 6: Post-Award Enforcement or Section 34 Challenge",
                description: "Execution of award as a decree or filing petition to set aside award under Section 34 within 90 days + 30 days condonation window.",
                typicalActivities: "Section 34 challenge before Commercial Court / High Court.",
            },
        ];
    }

    return {
        estimateAvailable: false,
        numericalEstimate: null,
        explanation: "A reliable statistical resolution timeline cannot currently be generated. Total dispute duration in Indian courts and tribunals depends substantially on the chosen forum, roster availability, interlocutory appeals, and registry pendency. Below are the sequential procedural stages involved.",
        proceduralStages: stages,
        benchmarksNote: "Statutory benchmarks (e.g. 12-month period for arbitration under Section 29A of the Arbitration Act, or 3-month pre-institution mediation under Section 12A of the Commercial Courts Act) provide procedural timelines, but actual resolution periods must be discussed with counsel representing the matter in the local jurisdiction.",
    };
}

// =============================================
// 4. PRECAUTIONS AND RECOMMENDATIONS
// =============================================

export function buildDeterministicPrecautions(
    material: CaseMaterial,
    domains: Domain[]
): PrecautionsAndRecommendations {
    const domain = domains[0] || "commercial_contracts";

    const docsToPreserve = [
        "Original signed contract, agreement, or purchase order with all appendices and schedules.",
        "Complete trail of contemporaneous emails, WhatsApp messages, and official written correspondence.",
        "Bank statements, payment vouchers, RTGS/NEFT receipts, and invoices documenting money flows.",
        "Delivery challans, receipts, bills of lading, or inspection sign-offs.",
    ];

    const missingDocs = [
        "Formal written acknowledgment of debt or liability from the opposite party, if available.",
        "Certificate under Section 65B of the Indian Evidence Act (or equivalent under Bharatiya Sakshya Adhiniyam) for electronic communications.",
        "Proof of dispatch and delivery (Speed Post tracking / email read receipts) for demand notices.",
    ];

    const evidenceToCollect = [
        "Certified bank statements reflecting transaction debits/credits.",
        "Affidavit of electronic evidence certifying devices used to send and receive communications.",
        "Audited accounts and ledger extracts reflecting outstanding balance.",
    ];

    const limitationQuestions = [
        "Under the Limitation Act, 1963, the general limitation for breach of contract or recovery of money is 3 years from the date the cause of action arose (e.g. date of invoice default or breach).",
        "Verify whether any part-payment or written acknowledgment of liability extended the limitation period under Section 18 / 19 of the Limitation Act.",
        "Verify whether any mandatory pre-institution mediation period excludes time from the limitation calculation (Section 12A(3) of Commercial Courts Act).",
    ];

    const preLitigationPrecautions = [
        "Do NOT engage in informal or unrecorded admissions of liability or concessions with the opposing party without legal guidance.",
        "Avoid sending aggressive or contradictory written statements that the opposing party could rely upon as an admission or waiver.",
        "Ensure all communications sent to the opposing party preserve your rights 'without prejudice' where appropriate.",
        "Verify whether the contract contains a mandatory mediation, conciliation, or arbitration clause before filing a court suit.",
    ];

    const questionsForAdvocate = [
        "Which court or forum has territorial and pecuniary jurisdiction over this dispute?",
        "Is pre-institution mediation mandatory in this matter before a plaint can be numbered?",
        "What is the exact expiry date of the statutory limitation period for each claim?",
        "Is there an arbitration clause that bars an ordinary civil suit?",
        "Are urgent interim measures (e.g. injunctions, freezing orders, or Section 9 relief) warranted to prevent asset dissipation?",
        "What are the anticipated court fees and litigation costs?",
    ];

    return {
        documentsToPreserve: docsToPreserve,
        missingDocuments: missingDocs,
        evidenceToCollect: evidenceToCollect,
        importantDatesAndLimitation: limitationQuestions,
        preLitigationPrecautions,
        questionsForAdvocate,
    };
}

// =============================================
// 5. LEGAL OPTIONS
// =============================================

export function buildDeterministicLegalOptions(
    material: CaseMaterial,
    domains: Domain[]
): LegalOption[] {
    const domain = domains[0] || "commercial_contracts";

    if (domain === "arbitration") {
        return [
            {
                optionName: "Option A: Notice of Invocation (Section 21) & Mutual Arbitrator Appointment",
                description: "Issue formal Section 21 notice calling upon the respondent to agree on a Sole Arbitrator within 30 days as per the contractual clause.",
                relevanceContext: "Mandatory first step when an arbitration agreement exists.",
                prerequisites: [
                    "Valid written arbitration agreement signed by both parties",
                    "Clear statement of disputes and quantified claims",
                ],
                advantages: [
                    "Cost-effective if opposing party consents to appointment",
                    "Commences arbitral proceedings and stops the limitation clock",
                ],
                disadvantages: [
                    "Opposing party may refuse or fail to respond within 30 days",
                ],
                verificationRequired: "Advocate must verify that the arbitration agreement covers the specific claims and is not vitiated by stamping/jurisdiction defects.",
            },
            {
                optionName: "Option B: Section 11 Application before the High Court",
                description: "Filing petition before the designated High Court for court-appointed arbitrator upon failure of mutual appointment mechanism.",
                relevanceContext: "Required if opposite party fails to appoint within 30 days of Section 21 notice.",
                prerequisites: [
                    "Section 21 notice issued and 30-day statutory period elapsed",
                    "Certified copy of agreement with arbitration clause",
                ],
                advantages: [
                    "Independent, court-appointed neutral arbitrator",
                    "Binding appointment that enables proceedings to commence",
                ],
                disadvantages: [
                    "Takes time for High Court notice and listing",
                ],
                verificationRequired: "Determination of correct High Court having supervisory jurisdiction over the seat.",
            },
            {
                optionName: "Option C: Urgent Interim Protection under Section 9",
                description: "Filing application before the Commercial Court for interim injunction or preservation of assets pending arbitral tribunal constitution.",
                relevanceContext: "Crucial if opposite party is dissipating assets or invoking bank guarantees.",
                prerequisites: [
                    "Manifest urgency and prima facie case with balance of convenience",
                    "Arbitration commenced or undertaken to be commenced within 90 days",
                ],
                advantages: [
                    "Immediate judicial protection against irreparable injury",
                ],
                disadvantages: [
                    "High threshold of proof required for ex-parte reliefs",
                ],
                verificationRequired: "Proof of imminent asset dissipation or breach.",
            },
        ];
    }

    // Default Commercial / Contractual Options
    return [
        {
            optionName: "Option A: Statutory Pre-Institution Mediation (Section 12A Commercial Courts Act)",
            description: "Initiating statutory pre-institution mediation through the District Legal Services Authority (DLSA) prior to filing a commercial suit, unless urgent interim relief is sought.",
            relevanceContext: "Mandatory under Indian commercial litigation framework for disputes exceeding the specified pecuniary threshold where no urgent interim relief is prayed for (Patil Automation principle).",
            prerequisites: [
                "Commercial dispute within meaning of Section 2(1)(c) Commercial Courts Act, 2015",
                "Application filed with DLSA / State Legal Services Authority",
            ],
            advantages: [
                "Confidential, faster resolution without protracted trial",
                "Non-adversarial negotiation that preserves commercial relationships",
                "Settlement agreement has status of a court decree",
            ],
            disadvantages: [
                "Requires willingness of both parties to negotiate in good faith",
            ],
            verificationRequired: "Advocate must confirm whether urgent interim relief exempts the suit from Section 12A mediation.",
        },
        {
            optionName: "Option B: Commercial Suit for Money Recovery / Damages",
            description: "Filing a formal civil suit before the designated Commercial Court having territorial and pecuniary jurisdiction for recovery of outstanding amounts plus contractual interest.",
            relevanceContext: "Primary legal mechanism when formal demand notices fail to elicit payment.",
            prerequisites: [
                "Non-starter report from Section 12A mediation (if mandatory) or application for urgent interim relief",
                "Payment of requisite ad-valorem court fees",
                "Proper verification and statement of truth accompanying plaint",
            ],
            advantages: [
                "Binding decree executable across India",
                "Strict procedural timelines under Commercial Courts Act (timely written statements and case management)",
            ],
            disadvantages: [
                "Court fees payable upfront upon the claimed amount",
                "Subject to court backlog and procedural delays",
            ],
            verificationRequired: "Territorial jurisdiction, pecuniary limit of Commercial Court, and ad-valorem court fee calculation.",
        },
        {
            optionName: "Option C: Summary Suit under Order XXXVII of the CPC",
            description: "Summary recovery procedure where the claim is founded upon a written contract, bill of exchange, or liquidated demand where defendant must seek leave to defend.",
            relevanceContext: "Applicable where debt is liquidated and substantiated by written contractual debt acknowledgment.",
            prerequisites: [
                "Liquidated sum or debt arising on written contract or promissory note",
                "No unliquidated damages or speculative claims included",
            ],
            advantages: [
                "Defendant has no automatic right of defence; must establish substantial defence to obtain leave",
                "Rapid decree if leave to defend is denied",
            ],
            disadvantages: [
                "If court grants unconditional leave to defend, converts into an ordinary suit",
            ],
            verificationRequired: "Verification that claim strictly qualifies within parameters of Order 37 Rule 1(2) CPC.",
        },
    ];
}

// =============================================
// 6. FILING PREPARATION ASSISTANCE
// =============================================

export function buildDeterministicFilingAssistance(
    material: CaseMaterial,
    domains: Domain[],
    understoodFacts: string[]
): FilingPreparationAssistance {
    const domain = domains[0] || "commercial_contracts";

    const caseChecklist = [
        {
            item: "Legal identity and complete registered address of all parties",
            status: (material.title.includes("versus") || material.title.includes("vs") || material.title.includes("&")) ? "Provided" as const : "Requires Verification" as const,
            notes: "Full corporate identification numbers (CIN), registered office addresses, and authorized signatory details required for memo of parties.",
        },
        {
            item: "Primary executed agreement or contract",
            status: material.documentText.length > 100 ? "Provided" as const : "Missing" as const,
            notes: "Original or notarized copy of signed agreement with all annexures.",
        },
        {
            item: "Quantified statement of account / claim breakdown",
            status: (material.facts.includes("Rs") || material.facts.includes("inr") || material.facts.includes("crore") || material.facts.includes("lakh")) ? "Provided" as const : "Requires Verification" as const,
            notes: "Tabular ledger specifying principal amount, invoice dates, due dates, and contractual interest calculations.",
        },
        {
            item: "Chronological chain of demand notices and replies",
            status: "Requires Verification" as const,
            notes: "Proof of service (speed post receipts and tracking reports) must be attached to demonstrate delivery.",
        },
        {
            item: "Statement of Truth and Affidavit under Commercial Courts Act",
            status: "Missing" as const,
            notes: "Must be sworn by an authorized representative duly empowered by Board Resolution or Power of Attorney.",
        },
    ];

    const chronologicalFactsSummary = understoodFacts.length > 0 ? understoodFacts : [
        `Dispute arose between the parties regarding: ${material.title}`,
        `Claimant/Plaintiff position: ${material.facts.slice(0, 200)}...`,
        `Desired legal remedy: ${material.desiredOutcome || "Legal redress and recovery"}`,
    ];

    const docOrgPlan = [
        {
            annexure: "Annexure A-1",
            documentDescription: "Copy of the Master Agreement / Contract / Purchase Order entered into between the parties.",
            sourceOrStatus: material.documentReport?.items?.[0]?.fileName || "Primary contract document",
        },
        {
            annexure: "Annexure A-2",
            documentDescription: "Tax Invoices, Delivery Challans, and Payment Vouchers reflecting commercial transactions.",
            sourceOrStatus: "Commercial books of account / attached records",
        },
        {
            annexure: "Annexure A-3",
            documentDescription: "Legal Demand Notice issued by the Plaintiff/Claimant calling upon payment/performance.",
            sourceOrStatus: "Notice and proof of service",
        },
        {
            annexure: "Annexure A-4",
            documentDescription: "Reply to Demand Notice (if received) or proof of non-response.",
            sourceOrStatus: "Correspondence record",
        },
        {
            annexure: "Annexure A-5",
            documentDescription: "Board Resolution / Power of Attorney authorizing the authorized representative.",
            sourceOrStatus: "To be executed by Claimant organization",
        },
    ];

    const missingInfo = [
        "Exact date on which the first default or refusal of performance occurred.",
        "Bank account statement highlighting specific debit/credit entries for reconciliation.",
        "Copy of any written responses or acknowledgments issued by the opposite party.",
        "Resolution of Board of Directors authorizing the filing of the petition.",
    ];

    const draftStructure = {
        documentType: "PRELIMINARY MEMORANDUM OF PLAINT / PETITION (DRAFT OUTLINE)",
        jurisdictionHeading: `IN THE COURT OF THE DISTRICT JUDGE (COMMERCIAL COURT) AT [CITY/DISTRICT, STATE]\nCOMMERCIAL SUIT NO. ________ OF 2026`,
        partiesBlock: `IN THE MATTER OF:\n[NAME OF PLAINTIFF / CLAIMANT COMPANY]\nRegistered Office at: [PLAINTIFF REGISTERED ADDRESS]\nThrough its Authorized Representative: [NAME & DESIGNATION]\n... PLAINTIFF\n\nVERSUS\n\n[NAME OF DEFENDANT / RESPONDENT]\nAddress at: [DEFENDANT REGISTERED ADDRESS]\n... DEFENDANT`,
        preliminaryStatement: `THE PLAINTIFF RESPECTFULLY SUBMITTETH AS UNDER:\n1. That the Plaintiff is a company incorporated under the Companies Act and carries on the business of [BRIEF BUSINESS DESCRIPTION].\n2. That the Defendant is [BRIEF DEFENDANT DESCRIPTION] who entered into commercial transactions with the Plaintiff.\n3. That the present suit is a Commercial Dispute within the meaning of Section 2(1)(c) of the Commercial Courts Act, 2015.`,
        factualGroundsDraft: [
            `4. That on or about [DATE OF CONTRACT], the parties entered into an agreement titled [AGREEMENT TITLE] wherein Defendant agreed to [CORE OBLIGATION].`,
            `5. That Plaintiff duly fulfilled all contractual obligations including delivery of goods/services as evidenced by Invoices annexed as Annexure A-2.`,
            `6. That despite receipt of goods/services, Defendant committed persistent breach by failing to release payment of Rs. [AMOUNT] due on [DUE DATE].`,
            `7. That Plaintiff issued a formal Demand Notice dated [NOTICE DATE] calling upon Defendant to cure breach, but Defendant failed and neglected to do so.`,
            `8. That the cause of action first arose on [DATE OF DEFAULT] when payment fell due and continues to subsist. The suit is within the prescribed period of limitation.`,
        ],
        prayerDraft: `WHEREFORE IT IS RESPECTFULLY PRAYED THAT THIS HON'BLE COURT MAY BE PLEASED TO:\n(a) Pass a decree in favour of the Plaintiff and against the Defendant for an amount of Rs. [CLAIMED AMOUNT]/-;\n(b) Award pendente lite and future interest @ [INTEREST RATE]% per annum from the date of default until realization;\n(c) Award costs of the suit in favour of the Plaintiff;\n(d) Pass such other or further relief as this Hon'ble Court may deem fit and proper in the interest of justice.`,
        placeholdersNotice: "IMPORTANT NOTICE: This is an automated preliminary structural outline for drafting assistance. All bracketed terms [LIKE THIS] represent placeholders that must be substituted with verified factual details. This draft does NOT constitute a court-ready document and MUST be reviewed, settled and signed by a qualified legal professional before filing.",
    };

    return {
        caseChecklist,
        chronologicalFactsSummary,
        documentOrganisationPlan: docOrgPlan,
        missingInformation: missingInfo,
        preliminaryDraftStructure: draftStructure,
    };
}

// =============================================
// PRECEDENT ANALYSIS (using retrieved results)
// =============================================

function buildPrecedentAnalysis(
    precedents: RetrievedPrecedent[],
    domains: Domain[]
): AssessmentPrecedentItem[] {
    return precedents.slice(0, 6).map((p) => {
        const domainTag = (p.domain_tags ?? []).join(", ") || "general";
        return {
            case_id: p.case_id,
            case_name: p.case_name,
            citation: p.citation,
            court: p.court,
            judgment_date: p.judgment_date,
            source_url: p.source_url,
            central_legal_issue: p.legal_issue || `Adjudication of rights under ${domainTag}`,
            actual_outcome: p.disposal_nature ? `${p.disposal_nature} (as per official judgment record)` : "Outcome details pending legal review of full judgment text",
            relevant_reasoning: p.matched_excerpt
                ? `Excerpt from judgment: "${p.matched_excerpt.slice(0, 300)}${p.matched_excerpt.length > 300 ? "…" : ""}"`
                : "This judgment was retrieved as a relevant authority in the target legal domain.",
            relevance: `This judgment was retrieved from the database as a keyword match for the identified legal domain(s): ${domains.join(", ")}. Its legal relevance to this specific matter requires review by a qualified advocate.`,
            similarities: p.matched_excerpt
                ? `The database matched this case to your search terms. Matched excerpt: "${p.matched_excerpt.slice(0, 200)}${p.matched_excerpt.length > 200 ? "…" : ""}"`
                : "This case was matched on domain keywords. No specific excerpt was returned.",
            differences: "The full facts of this judgment have not been compared with your matter. Differences in facts, parties, jurisdiction or applicable law may significantly affect its relevance.",
            legal_principle: "The legal principles in this judgment have not been independently extracted or verified. Review the source judgment through a qualified legal professional.",
            legal_review_status: p.legal_review_status,
        };
    });
}

// =============================================
// UNDERSTOOD FACTS EXTRACTION
// =============================================

function extractUnderstoodFacts(material: CaseMaterial): string[] {
    const facts: string[] = [];

    if (material.title) {
        facts.push(`Matter title: ${material.title}.`);
    }
    if (material.caseType && material.caseType !== "Not specified") {
        facts.push(`Indicated legal domain: ${material.caseType}.`);
    }
    if (material.jurisdiction) {
        facts.push(`Jurisdiction specified: ${material.jurisdiction}.`);
    }
    if (material.desiredOutcome) {
        facts.push(`Stated desired outcome: ${material.desiredOutcome}.`);
    }

    // Extract sentences from facts text
    const sentences = material.facts
        .split(/[.!?]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20)
        .slice(0, 6);

    for (const sentence of sentences) {
        facts.push(`Submitted: ${sentence}.`);
    }

    if (material.documentReport?.items?.length) {
        for (const item of material.documentReport.items) {
            if (item.status === "processed") {
                facts.push(`Attached document "${item.fileName}" (${item.pageCount} page${item.pageCount > 1 ? "s" : ""}) was verified and its text incorporated.`);
            } else if (item.status === "empty_or_scanned") {
                facts.push(`Attached document "${item.fileName}" is a scanned image-only PDF requiring OCR (no digital text could be extracted).`);
            } else if (item.status === "rejected" || item.status === "failed") {
                facts.push(`Attached document "${item.fileName}" could not be processed (${item.warning || "Extraction error"}).`);
            }
        }
    } else if (material.documentText && material.documentText.length > 10) {
        facts.push("Supporting document text was submitted alongside the case description.");
    }

    return facts.slice(0, 14);
}

// =============================================
// EXECUTIVE SUMMARY
// =============================================

function buildExecutiveSummary(
    material: CaseMaterial,
    domains: Domain[],
    issues: string[]
): string {
    const domainLabel = domains
        .filter((d) => d !== "unknown")
        .map((d) => d.replace(/_/g, " "))
        .join(" and ");

    const issueCount = issues.length;

    return (
        `This is a rules-based preliminary triage report for a matter described as "${material.title}". ` +
        `Based on keyword analysis of the submitted facts, the matter appears to relate to ${domainLabel || "a legal matter of undetermined domain"}. ` +
        `${issueCount > 0 ? `${issueCount} potential legal issue${issueCount > 1 ? "s" : ""} ${issueCount > 1 ? "have" : "has"} been identified for preliminary consideration.` : ""} ` +
        `This report does not contain AI-generated legal reasoning. ` +
        `All findings are generated by predefined rules and require review by a qualified legal professional before any reliance.`
    ).trim();
}

// =============================================
// MAIN ENTRY POINT
// =============================================

/**
 * Run the deterministic assessment engine.
 *
 * @param material  The parsed case submission.
 * @param precedents  Judgments retrieved from Supabase (may be empty if retrieval failed).
 * @param precedentRetrievalFailed  Whether Supabase retrieval was unavailable.
 */
export function runDeterministicAssessment(
    material: CaseMaterial,
    precedents: RetrievedPrecedent[],
    precedentRetrievalFailed: boolean
): DeterministicResult {
    const domains = detectDomains(material);
    const legalIssues = identifyLegalIssues(material, domains);
    const searchQueries = buildSearchQueries(material, domains);
    const { strengths, weaknesses } = assessIndicators(material, domains);
    const missingEvidence = buildEvidenceChecklist(material, domains);
    const nextSteps = buildNextSteps(domains);
    const understoodFacts = extractUnderstoodFacts(material);
    const executiveSummary = buildExecutiveSummary(material, domains, legalIssues);
    const precedentAnalysis = buildPrecedentAnalysis(precedents, domains);

    // New mentor features
    const timeline = buildDeterministicTimeline(material);
    const outcomeAssessment = buildDeterministicOutcomeAssessment(material, domains, strengths, weaknesses);
    const expectedDuration = buildDeterministicExpectedDuration(domains);
    const precautions = buildDeterministicPrecautions(material, domains);
    const legalOptions = buildDeterministicLegalOptions(material, domains);
    const filingAssistance = buildDeterministicFilingAssistance(material, domains, understoodFacts);

    // If documents requiring OCR exist, highlight them in missing evidence
    if (material.documentReport?.documentsRequiringOcr?.length) {
        for (const ocrDoc of material.documentReport.documentsRequiringOcr) {
            missingEvidence.unshift({
                evidence: `Digital text copy / OCR transcript of "${ocrDoc}"`,
                why_it_matters: "This document appears to be an image-only or scanned PDF without extractable text. A readable transcription is required to review its specific terms and obligations."
            });
        }
    }

    const domainLabel = domains
        .filter((d) => d !== "unknown")
        .map((d) => d.replace(/_/g, " "))
        .join(", ") || "undetermined domain";

    const limitationParts: string[] = [
        "This report is generated by a deterministic rules-based engine, not by an AI or legal professional.",
        "All identified issues, indicators and evidence items are screening outputs based on keyword detection - not legal conclusions.",
        "This engine cannot assess the strength of a legal position, interpret contractual terms, evaluate witness credibility or predict court outcomes.",
        `The identified domain(s) (${domainLabel}) are based on keyword analysis and may not fully reflect the applicable law.`,
    ];

    if (material.documentReport?.documentsRequiringOcr?.length) {
        limitationParts.push(
            `Document Notice: ${material.documentReport.documentsRequiringOcr.join(", ")} could not be read digitally because no text stream was found. OCR processing is required before its contents can be considered.`
        );
    }

    if (precedentRetrievalFailed) {
        limitationParts.push(
            "Precedent retrieval from the database was unavailable during this assessment. No judgments have been referenced. Do not treat the absence of precedents as confirmation that none exist."
        );
    } else if (precedents.length === 0) {
        limitationParts.push(
            "No judgments were returned from the database for the generated search queries. The database contains a limited collection. Absence of results does not confirm that no relevant precedents exist."
        );
    } else {
        limitationParts.push(
            `${precedents.length} judgment${precedents.length > 1 ? "s" : ""} ${precedents.length > 1 ? "were" : "was"} retrieved by keyword match. These have not been legally reviewed for relevance to this specific matter.`
        );
    }

    limitationParts.push(
        "Consult a qualified advocate before taking any legal action or relying on this report."
    );

    return {
        identifiedLegalIssues: legalIssues,
        identifiedSearchQueries: searchQueries,
        retrievedPrecedents: precedents,
        assessment: {
            assessment_title: `Preliminary Triage Report - ${material.title || "Legal Matter"}`,
            executive_summary: executiveSummary,
            understood_facts: understoodFacts,
            legal_issues: legalIssues,
            strengths,
            weaknesses,
            missing_evidence: missingEvidence,
            precedent_analysis: precedentAnalysis,
            recommended_next_steps: nextSteps,
            limitations: limitationParts.join(" "),
            document_processing: material.documentReport,

            case_timeline: timeline,
            outcome_assessment: outcomeAssessment,
            expected_duration: expectedDuration,
            precautions_and_recommendations: precautions,
            legal_options: legalOptions,
            filing_assistance: filingAssistance,
        },
        precedentRetrievalFailed,
    };
}
