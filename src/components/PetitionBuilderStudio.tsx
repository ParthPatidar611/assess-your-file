"use client";

import React, { useState, useEffect, useTransition } from "react";
import type {
  AssessmentResponse,
  PetitionEvent,
  CounterpartyArgument,
  AnnexureIndex,
  ForumCategory,
  GeneratedPetition,
  PetitionWorkspaceState,
} from "./types";
import {
  detectForumCategory,
  FORUM_TEMPLATES,
  compilePetitionDraft,
  synthesizeEventsFromLedger,
  buildDeterministicAnnexureIndex,
} from "@/lib/petitionEngine";
import { buildDeterministicCounterpartyArguments } from "@/lib/counterpartyEngine";
import WorkspaceNav, { type WorkspaceStage } from "./petition/WorkspaceNav";
import StageOverview from "./petition/StageOverview";
import StageEventsEditor from "./petition/StageEventsEditor";
import StageCounterparty from "./petition/StageCounterparty";
import StageAnnexureManager from "./petition/StageAnnexureManager";
import StagePetitionPreview from "./petition/StagePetitionPreview";
import StageExportReview from "./petition/StageExportReview";

interface PetitionBuilderStudioProps {
  assessmentResult: AssessmentResponse;
  onCloseStudio: () => void;
  onOpenUserManual: () => void;
}

export default function PetitionBuilderStudio({
  assessmentResult,
  onCloseStudio,
  onOpenUserManual,
}: PetitionBuilderStudioProps) {
  const [currentStage, setCurrentStage] = useState<WorkspaceStage>("events");
  const [isPending, startTransition] = useTransition();

  const {
    case: caseMeta,
    assessment,
    documentProcessing,
    factLedger,
  } = assessmentResult;

  const storageKey = `petition_workspace_${caseMeta.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 32)}`;

  // Workspace State
  const [forumCategory, setForumCategory] = useState<ForumCategory>(() =>
    detectForumCategory(caseMeta.caseType)
  );
  const [courtHeading, setCourtHeading] = useState<string>(() => {
    const tmpl = FORUM_TEMPLATES[detectForumCategory(caseMeta.caseType)];
    return tmpl ? tmpl.courtHeading : FORUM_TEMPLATES.COMMERCIAL_COURT.courtHeading;
  });

  const [petitionerName, setPetitionerName] = useState<string>("");
  const [petitionerAddress, setPetitionerAddress] = useState<string>("");
  const [respondentName, setRespondentName] = useState<string>("");
  const [respondentAddress, setRespondentAddress] = useState<string>("");

  const [events, setEvents] = useState<PetitionEvent[]>([]);
  const [counterpartyArguments, setCounterpartyArguments] = useState<CounterpartyArgument[]>([]);
  const [annexureIndex, setAnnexureIndex] = useState<AnnexureIndex>({
    items: [],
    totalAnnexures: 0,
    totalPages: 0,
    unattachedReferencedDocs: [],
  });
  const [petitionDraft, setPetitionDraft] = useState<GeneratedPetition | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>("Synced Locally");

  // Initial State Loading from LocalStorage or Synthesis
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: PetitionWorkspaceState = JSON.parse(saved);
        if (parsed.events && parsed.events.length > 0) {
          setForumCategory(parsed.forumCategory || detectForumCategory(caseMeta.caseType));
          setCourtHeading(parsed.courtHeading || FORUM_TEMPLATES.COMMERCIAL_COURT.courtHeading);
          setPetitionerName(parsed.petitionerName || "");
          setPetitionerAddress(parsed.petitionerAddress || "");
          setRespondentName(parsed.respondentName || "");
          setRespondentAddress(parsed.respondentAddress || "");
          setEvents(parsed.events);
          setCounterpartyArguments(parsed.counterpartyArguments || []);
          setAnnexureIndex(parsed.annexureIndex || { items: [], totalAnnexures: 0, totalPages: 0, unattachedReferencedDocs: [] });
          setPetitionDraft(parsed.petitionDraft || null);
          return;
        }
      }
    } catch {
      // LocalStorage private context fallback
    }

    // First-time synthesis
    const caseMaterial = {
      caseType: caseMeta.caseType,
      title: caseMeta.title,
      facts: assessment.understood_facts?.join(" ") || caseMeta.title,
      desiredOutcome: caseMeta.desiredOutcome,
      jurisdiction: caseMeta.jurisdiction,
      documentText: "",
      documentReport: documentProcessing,
    };

    const initialEvents = synthesizeEventsFromLedger(caseMaterial, factLedger, documentProcessing);
    const initialAnnexures = buildDeterministicAnnexureIndex(
      documentProcessing,
      initialEvents,
      `${caseMeta.title} ${caseMaterial.facts}`
    );
    const initialCounterparty = buildDeterministicCounterpartyArguments(caseMaterial, initialEvents, factLedger);

    setEvents(initialEvents);
    setAnnexureIndex(initialAnnexures);
    setCounterpartyArguments(initialCounterparty);

    // Initial draft compile
    const initialDraft = compilePetitionDraft({
      caseMaterial,
      events: initialEvents,
      counterpartyArguments: initialCounterparty,
      annexureIndex: initialAnnexures,
      forumCategory: detectForumCategory(caseMeta.caseType),
      courtHeadingOverride: courtHeading,
      petitionerName,
      petitionerAddress,
      respondentName,
      respondentAddress,
      factLedger,
    });
    setPetitionDraft(initialDraft);
  }, []);

  // Save changes to LocalStorage securely (Rule 1: No insecure anonymous Supabase leak)
  useEffect(() => {
    if (events.length === 0) return;

    try {
      const stateToSave: PetitionWorkspaceState = {
        caseId: caseMeta.title,
        currentStage,
        forumCategory,
        courtHeading,
        petitionerName,
        petitionerAddress,
        respondentName,
        respondentAddress,
        events,
        counterpartyArguments,
        annexureIndex,
        petitionDraft,
        lastSavedTimestamp: new Date().toISOString(),
        isDirty: false,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      setSaveStatus("Saved to Secure Session");
    } catch {
      setSaveStatus("Session Active");
    }
  }, [
    currentStage,
    forumCategory,
    courtHeading,
    petitionerName,
    petitionerAddress,
    respondentName,
    respondentAddress,
    events,
    counterpartyArguments,
    annexureIndex,
    petitionDraft,
  ]);

  // Re-compile petition draft when transitioning to preview or export
  const ensureRecompiledDraft = () => {
    const caseMaterial = {
      caseType: caseMeta.caseType,
      title: caseMeta.title,
      facts: assessment.understood_facts?.join(" ") || caseMeta.title,
      desiredOutcome: caseMeta.desiredOutcome,
      jurisdiction: caseMeta.jurisdiction,
      documentText: "",
      documentReport: documentProcessing,
    };

    const compiled = compilePetitionDraft({
      caseMaterial,
      events,
      counterpartyArguments,
      annexureIndex,
      forumCategory,
      courtHeadingOverride: courtHeading,
      petitionerName,
      petitionerAddress,
      respondentName,
      respondentAddress,
      factLedger,
    });
    setPetitionDraft(compiled);
    return compiled;
  };

  const handleStageChange = (stage: WorkspaceStage) => {
    if (stage === "preview" || stage === "export") {
      ensureRecompiledDraft();
    }
    startTransition(() => {
      setCurrentStage(stage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleRefreshAI = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/petition/counterparty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseType: caseMeta.caseType,
          title: caseMeta.title,
          facts: assessment.understood_facts?.join(" ") || caseMeta.title,
          desiredOutcome: caseMeta.desiredOutcome,
          events,
          factLedger,
        }),
      });
      const text = await response.text();
      let data: { success?: boolean; counterpartyArguments?: unknown } | null = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      if (data && data.success && Array.isArray(data.counterpartyArguments)) {
        setCounterpartyArguments(data.counterpartyArguments);
      }
    } catch (err) {
      console.warn("AI counterparty refresh fallback:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const validationIssuesCount = petitionDraft?.validationReport
    ? petitionDraft.validationReport.missingMandatoryInformation.length +
      petitionDraft.validationReport.invalidCrossReferences.length +
      petitionDraft.validationReport.unsupportedClaims.length
    : 0;

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-[#151515]">
      {/* Studio Header Bar */}
      <div className="bg-white border-b border-[#D5D5D2] px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCloseStudio}
            className="px-3 py-1.5 bg-white border border-[#D5D5D2] hover:bg-[#F5F5F3] text-xs font-semibold text-[#151515] transition cursor-pointer"
          >
            ← Back to Assessment Report
          </button>
          <div className="h-4 w-px bg-[#D5D5D2] hidden sm:block" />
          <span className="text-xs font-bold text-[#151515] truncate max-w-md">
            {caseMeta.title}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#8E8E8A] font-mono text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {saveStatus}
          </span>
          <button
            type="button"
            onClick={onOpenUserManual}
            className="px-3 py-1.5 bg-[#FFF9E6] border border-[#F2D21A] text-[#806600] font-bold text-xs uppercase tracking-wider hover:bg-[#F2D21A] hover:text-[#151515] transition cursor-pointer"
          >
            User Manual 📖
          </button>
        </div>
      </div>

      {/* Persistent Horizontal Navigation Bar */}
      <WorkspaceNav
        currentStage={currentStage}
        onSelectStage={handleStageChange}
        eventCount={events.length}
        argumentCount={counterpartyArguments.length}
        annexureCount={annexureIndex.items.filter((i) => !i.isExcluded).length}
        validationIssuesCount={validationIssuesCount}
      />

      {/* Main Workspace Stage Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {currentStage === "overview" && (
          <StageOverview
            forumCategory={forumCategory}
            setForumCategory={setForumCategory}
            courtHeading={courtHeading}
            setCourtHeading={setCourtHeading}
            petitionerName={petitionerName}
            setPetitionerName={setPetitionerName}
            petitionerAddress={petitionerAddress}
            setPetitionerAddress={setPetitionerAddress}
            respondentName={respondentName}
            setRespondentName={setRespondentName}
            respondentAddress={respondentAddress}
            setRespondentAddress={setRespondentAddress}
            matterTitle={caseMeta.title}
            onProceedToEvents={() => handleStageChange("events")}
          />
        )}

        {currentStage === "events" && (
          <StageEventsEditor
            events={events}
            setEvents={setEvents}
            annexureIndex={annexureIndex}
            onProceedToCounterparty={() => handleStageChange("counterparty")}
            onBackToOverview={() => handleStageChange("overview")}
          />
        )}

        {currentStage === "counterparty" && (
          <StageCounterparty
            argumentsList={counterpartyArguments}
            setArgumentsList={setCounterpartyArguments}
            onProceedToAnnexures={() => handleStageChange("annexures")}
            onBackToEvents={() => handleStageChange("events")}
            onRefreshAI={handleRefreshAI}
            isGeneratingAI={isGeneratingAI}
          />
        )}

        {currentStage === "annexures" && (
          <StageAnnexureManager
            annexureIndex={annexureIndex}
            setAnnexureIndex={setAnnexureIndex}
            onProceedToPreview={() => handleStageChange("preview")}
            onBackToCounterparty={() => handleStageChange("counterparty")}
          />
        )}

        {currentStage === "preview" && petitionDraft && (
          <StagePetitionPreview
            petition={petitionDraft}
            onProceedToExport={() => handleStageChange("export")}
            onBackToAnnexures={() => handleStageChange("annexures")}
          />
        )}

        {currentStage === "export" && petitionDraft && (
          <StageExportReview
            petition={petitionDraft}
            onBackToPreview={() => handleStageChange("preview")}
            onOpenUserManual={onOpenUserManual}
          />
        )}
      </div>
    </div>
  );
}
