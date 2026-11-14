"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import HeroSection from "@/components/HeroSection";
import ProgressIndicator from "@/components/ProgressIndicator";
import AssessmentForm from "@/components/AssessmentForm";
import ReviewScreen from "@/components/ReviewScreen";
import LoadingScreen from "@/components/LoadingScreen";
import ReportView from "@/components/ReportView";
import HistoryTab from "@/components/HistoryTab";
import HelpTab from "@/components/HelpTab";
import type { AssessmentResponse } from "@/components/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_COUNT = 3;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Home() {
  const [activeNavTab, setActiveNavTab] = useState<"intake" | "history" | "help">("intake");
  const [workflowStep, setWorkflowStep] = useState<"form" | "review" | "loading" | "report">("form");

  // Form Fields
  const [caseType, setCaseType] = useState("");
  const [title, setTitle] = useState("");
  const [facts, setFacts] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");

  // Document attachments
  const [files, setFiles] = useState<File[]>([]);
  const [fileValidationErrors, setFileValidationErrors] = useState<string[]>([]);

  // Assessment Result & History
  const [result, setResult] = useState<AssessmentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ timestamp: string; data: AssessmentResponse }>>([]);

  // Load history from localStorage on initial mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("assess_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // LocalStorage unavailable in certain iframe/private contexts
    }
  }, []);

  const saveToHistory = (newResult: AssessmentResponse) => {
    const item = {
      timestamp: new Date().toISOString(),
      data: newResult,
    };
    const updated = [item, ...history].slice(0, 20);
    setHistory(updated);
    try {
      localStorage.setItem("assess_history", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("assess_history");
    } catch {
      // ignore
    }
  };

  // Add supporting documents with rigorous validation
  const handleAddFiles = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const errors: string[] = [];
    const addedFiles: File[] = [];

    let slotAvailable = MAX_FILE_COUNT - files.length;
    if (slotAvailable <= 0) {
      setFileValidationErrors([`Maximum limit of ${MAX_FILE_COUNT} documents has already been reached.`]);
      return;
    }

    Array.from(newFiles).forEach((file) => {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        errors.push(`"${file.name}" is not a PDF. Only PDF documents are supported.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" (${formatFileSize(file.size)}) exceeds the maximum limit of 5 MB.`);
        return;
      }

      if (slotAvailable > 0) {
        addedFiles.push(file);
        slotAvailable--;
      } else {
        errors.push(`"${file.name}" was not attached because the limit of ${MAX_FILE_COUNT} documents was reached.`);
      }
    });

    setFiles((prev) => [...prev, ...addedFiles]);
    setFileValidationErrors(errors);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileValidationErrors([]);
  };

  // Submission handler
  const handleSubmitAssessment = async () => {
    setErrorMessage(null);
    setWorkflowStep("loading");

    try {
      const formData = new FormData();
      formData.append("caseType", caseType || "Not specified");
      formData.append("title", title);
      formData.append("facts", facts);
      formData.append("desiredOutcome", desiredOutcome);
      formData.append("jurisdiction", "India");

      files.forEach((file) => {
        formData.append("documents", file);
      });

      const response = await fetch("/api/assess", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to generate preliminary assessment.");
      }

      const assessmentResponse = data as AssessmentResponse;
      setResult(assessmentResponse);
      saveToHistory(assessmentResponse);
      setWorkflowStep("report");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected server error occurred during assessment."
      );
      setWorkflowStep("review");
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage(null);
    setFiles([]);
    setFileValidationErrors([]);
    setWorkflowStep("form");
    setActiveNavTab("intake");
  };

  // Determine breadcrumb text
  let breadcrumbText = "Matter Assessment / New Intake";
  if (activeNavTab === "history") breadcrumbText = "Intelligence Archive / My Assessments";
  else if (activeNavTab === "help") breadcrumbText = "User Reference / Guidelines & FAQ";
  else if (workflowStep === "review") breadcrumbText = "Matter Assessment / Review & Submit";
  else if (workflowStep === "loading") breadcrumbText = "Intelligence Pipeline / Processing Matter";
  else if (workflowStep === "report") breadcrumbText = "Assessment Deliverable / Preliminary Report";

  return (
    <Shell
      currentTab={activeNavTab}
      onTabChange={(tab) => {
        setActiveNavTab(tab);
        if (tab === "intake" && workflowStep === "report" && !result) {
          setWorkflowStep("form");
        }
      }}
      breadcrumbs={breadcrumbText}
      onPrint={() => window.print()}
      isReportView={workflowStep === "report" && Boolean(result)}
    >
      {/* ---------------------------------------------------- */}
      {/* GLOBAL ERROR BANNER                                  */}
      {/* ---------------------------------------------------- */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-[#FFF9E6] border-l-4 border-red-600 text-xs text-[#151515] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-red-700">Error:</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: MY ASSESSMENTS                                  */}
      {/* ---------------------------------------------------- */}
      {activeNavTab === "history" && (
        <HistoryTab
          history={history}
          onSelectHistoryItem={(item) => {
            setResult(item);
            setActiveNavTab("intake");
            setWorkflowStep("report");
          }}
          onClearHistory={clearHistory}
          onNewAssessment={() => {
            handleReset();
            setActiveNavTab("intake");
          }}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: HELP & GUIDELINES                               */}
      {/* ---------------------------------------------------- */}
      {activeNavTab === "help" && <HelpTab />}

      {/* ---------------------------------------------------- */}
      {/* TAB: NEW ASSESSMENT FLOW                             */}
      {/* ---------------------------------------------------- */}
      {activeNavTab === "intake" && (
        <>
          {workflowStep === "form" && (
            <div>
              <HeroSection />
              <ProgressIndicator currentStep={1} />
              <AssessmentForm
                caseType={caseType}
                setCaseType={setCaseType}
                title={title}
                setTitle={setTitle}
                facts={facts}
                setFacts={setFacts}
                desiredOutcome={desiredOutcome}
                setDesiredOutcome={setDesiredOutcome}
                files={files}
                fileValidationErrors={fileValidationErrors}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                onProceedToReview={() => setWorkflowStep("review")}
              />
            </div>
          )}

          {workflowStep === "review" && (
            <div>
              <ProgressIndicator currentStep={2} />
              <ReviewScreen
                caseType={caseType}
                title={title}
                facts={facts}
                desiredOutcome={desiredOutcome}
                files={files}
                onBackToEdit={() => setWorkflowStep("form")}
                onSubmit={handleSubmitAssessment}
                loading={false}
              />
            </div>
          )}

          {workflowStep === "loading" && <LoadingScreen />}

          {workflowStep === "report" && result && (
            <ReportView
              result={result}
              onReset={handleReset}
              onPrint={() => window.print()}
            />
          )}
        </>
      )}
    </Shell>
  );
}
