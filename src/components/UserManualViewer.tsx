"use client";

import React, { useState } from "react";

interface UserManualViewerProps {
  onClose?: () => void;
}

interface ManualStep {
  stepNumber: number;
  title: string;
  category: string;
  summary: string;
  requiredInputs: string[];
  expectedResults: string[];
  calloutNote: string;
  screenshotSrc: string;
  screenshotAlt: string;
}

const MANUAL_STEPS: ManualStep[] = [
  {
    stepNumber: 1,
    title: "Initiate Matter Intake & Case Setup",
    category: "Intake Workflow",
    summary: "Launch the platform and click 'New Assessment +' to open the structured legal intake portal. Review benchmark notice and institutional guidelines.",
    requiredInputs: ["Matter Title", "Case Dispute Category", "Jurisdiction: India"],
    expectedResults: ["Clean intake form initialized with progress step indicators."],
    calloutNote: "Do not include privileged client identity details in demonstration environments.",
    screenshotSrc: "/manual_screenshots/screenshot_01_intake_form.png",
    screenshotAlt: "Initial empty matter intake screen with category selection",
  },
  {
    stepNumber: 2,
    title: "Select Dispute Category & Enter Factual Narrative",
    category: "Intake Workflow",
    summary: "Select the dispute category (Commercial, Contractual, Consumer, Arbitration, IBC, etc.) and enter the factual chronology with exact dates, transactional amounts, and the desired legal outcome.",
    requiredInputs: ["Dispute Category", "Chronological narrative (min. 30 characters)", "Desired Outcome"],
    expectedResults: ["Live character validation passes, ready for document attachment."],
    calloutNote: "State factual events neutrally without embellishment; exact dates are parsed automatically.",
    screenshotSrc: "/manual_screenshots/screenshot_02_filled_details.png",
    screenshotAlt: "Completed matter intake with factual narrative and desired outcome",
  },
  {
    stepNumber: 3,
    title: "Upload Supporting PDF Documents (Contracts, Challans, Receipts)",
    category: "Document Intelligence",
    summary: "Attach up to 3 PDF documents (max 5 MB each). The ingestion pipeline automatically classifies pages into selectable text, scanned printed, or handwritten documents.",
    requiredInputs: ["PDF files: agreements, purchase orders, delivery challans, or emails."],
    expectedResults: ["File badges display size, status, and multimodal OCR indicators."],
    calloutNote: "Both clean digital PDFs and mobile camera photograph scans are supported via multimodal OCR.",
    screenshotSrc: "/manual_screenshots/screenshot_03_pdf_upload.png",
    screenshotAlt: "Document attachment area showing uploaded PDF files and OCR badges",
  },
  {
    stepNumber: 4,
    title: "Review & Approve Chronological Event Timeline",
    category: "Factual Workspace",
    summary: "Examine the central chronological event sequence synthesized from matter intake and uploaded documents. Each event captures the 5 mentor-required fields: Event, Mistake by other party, Applicant's response, Prayer / relief, and Supporting documents. Mark verification and approve the timeline as the canonical factual basis.",
    requiredInputs: ["Review event details", "Add, edit, or reorder events", "Confirm or dispute facts", "Approve Timeline ✓"],
    expectedResults: ["Approved chronological timeline serving as the authoritative factual foundation for petition drafting."],
    calloutNote: "The timeline is the single source of truth; any edits increment the timeline version and flag downstream sections for review.",
    screenshotSrc: "/manual_screenshots/screenshot_04_event_timeline.png",
    screenshotAlt: "Chronological Event Timeline displaying expandable events with 5 required fields and verification tags",
  },
  {
    stepNumber: 5,
    title: "Inspect Preliminary Legal Assessment & Risk Matrix",
    category: "Assessment Deliverable",
    summary: "Examine the preliminary assessment report covering procedural strengths, evidentiary weaknesses, Supreme Court precedents (2025 benchmark), expected duration stages, and legal remedies.",
    requiredInputs: ["Review of statutory provisions and missing evidence items."],
    expectedResults: ["14-section consulting deliverable with qualitative risk evaluation."],
    calloutNote: "Numerical win probabilities are disabled pending validated judicial models.",
    screenshotSrc: "/manual_screenshots/screenshot_05_assessment_report.png",
    screenshotAlt: "Assessment report deliverable showing risk matrix and precedent analysis",
  },
  {
    stepNumber: 6,
    title: "Open & Operate Event-Wise Petition Builder",
    category: "Petition Builder",
    summary: "Click 'Draft Formal Petition' to launch the drafting studio. In Stage B, review chronological events. Each event displays the 5 court-mandated fields: Event, Mistake by other party, Applicant's response, Relief sought, and Supporting documents.",
    requiredInputs: ["Inline edits to events", "Reorder events with Up/Down controls", "Add new events."],
    expectedResults: ["Structured sequence of events ready for court pleading statement of facts."],
    calloutNote: "Events missing documents are explicitly flagged; never invent fictitious dates or clauses.",
    screenshotSrc: "/manual_screenshots/screenshot_06_petition_events.png",
    screenshotAlt: "Petition Builder Stage B Event Editor with the 5 required fields",
  },
  {
    stepNumber: 7,
    title: "Evaluate Anticipated Counterparty Defenses & Rebuttals",
    category: "Adversarial Intelligence",
    summary: "In Stage C, review anticipated opposing-party arguments. Inspect the factual basis and legal doctrine. Review the proposed applicant rebuttal and toggle whether to include it in the Plaint.",
    requiredInputs: ["Approval toggle: 'Include Rebuttal in Plaint [ON/OFF]'", "Rebuttal edits."],
    expectedResults: ["Approved rebuttals flow into Section 4 of the court draft; strategy notes stay confidential."],
    calloutNote: "Internal strategy notes are strictly excluded from the final court pleading and DOCX exports.",
    screenshotSrc: "/manual_screenshots/screenshot_07_counterparty_intelligence.png",
    screenshotAlt: "Counterparty argument cards with rebuttal toggles and confidential strategy notes",
  },
  {
    stepNumber: 8,
    title: "Organize, Reorder & Number Annexures Deterministically",
    category: "Annexure Management",
    summary: "In Stage D, inspect the Annexure Registry. Documents are sequentially numbered 'Annexure 1', 'Annexure 2', etc. Drag or move items to reorder; all in-text paragraph citations recalculate dynamically.",
    requiredInputs: ["Document display title adjustments", "Move Up/Down", "Exclude non-exhibit files."],
    expectedResults: ["Deterministic Annexure Index with page ranges and extraction status."],
    calloutNote: "Unattached documents mentioned in facts are isolated and never given an annexure number.",
    screenshotSrc: "/manual_screenshots/screenshot_08_annexure_management.png",
    screenshotAlt: "Annexure Management table with order controls and extraction status",
  },
  {
    stepNumber: 9,
    title: "Compile, Validate & Export Formal Pleading (DOCX / PDF)",
    category: "Export & Filing Preparation",
    summary: "In Stages E & F, inspect the compiled formal draft with split-screen evidence inspection. Review the verification report, then export a formal Word (.docx) pleading or high-DPI PDF.",
    requiredInputs: ["One-click 'Download Word (.docx)' or 'Print / Save as PDF'."],
    expectedResults: ["Formatted court document with 1-inch margins, 1.5 line spacing, and Annexure Index."],
    calloutNote: "All exported drafts are prominently marked as requiring advocate review before filing.",
    screenshotSrc: "/manual_screenshots/screenshot_09_petition_preview_export.png",
    screenshotAlt: "Split-screen petition preview with real-time validation inspector and DOCX export",
  },
];

export default function UserManualViewer({ onClose }: UserManualViewerProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const currentStepData = MANUAL_STEPS.find((s) => s.stepNumber === activeStep) || MANUAL_STEPS[0];

  return (
    <div className="bg-white border border-[#D5D5D2] shadow-sm">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-[#151515] text-white border-b border-[#2D2D2D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#F2D21A]">
              Application User Manual · Enterprise Operational Reference
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Assess Your File — Complete Operational Guide
          </h2>
          <p className="text-xs text-[#A0A09C] mt-1 max-w-2xl">
            Step-by-step instructions for legal assessment, OCR ingestion, event-wise petition building, counterparty intelligence, and annexure management.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-[#151515] text-xs font-bold uppercase tracking-wider hover:bg-[#EEEEEC] transition cursor-pointer self-start sm:self-auto"
          >
            Close Manual ✕
          </button>
        )}
      </div>

      {/* Manual Layout: 9 Steps Sidebar + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#EEEEEC]">
        {/* Left Step Navigator (4 cols) */}
        <div className="lg:col-span-4 p-4 sm:p-6 bg-[#FCFCFA] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#686868] block mb-3 pl-1">
            Table of Contents (9 Operational Stages)
          </span>

          {MANUAL_STEPS.map((step) => {
            const isSelected = activeStep === step.stepNumber;
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => setActiveStep(step.stepNumber)}
                className={`w-full text-left p-3 border transition cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? "bg-white border-[#151515] shadow-xs"
                    : "bg-transparent border-transparent hover:bg-[#F5F5F3] text-[#686868]"
                }`}
              >
                <span
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 border ${
                    isSelected
                      ? "bg-[#151515] text-white border-[#151515]"
                      : "bg-[#EEEEEC] text-[#686868] border-[#D5D5D2]"
                  }`}
                >
                  Step {step.stepNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isSelected ? "text-[#151515]" : "text-[#333333]"}`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-[#8E8E8A] truncate mt-0.5">{step.category}</p>
                </div>
              </button>
            );
          })}

          <div className="p-4 bg-white border border-[#D5D5D2] mt-6 text-[11px] text-[#686868] space-y-1">
            <span className="font-bold text-[#151515] block">Compliance Standard:</span>
            <p>Screenshots are captured from real application execution using benchmark fictional matters. No mock UI images or fabricated credentials are used.</p>
          </div>
        </div>

        {/* Right Step Content (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-10 space-y-8">
          {/* Step Header */}
          <div className="space-y-2 border-b border-[#EEEEEC] pb-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#F2D21A] text-[#151515] font-bold text-[10px] uppercase">
                Step {currentStepData.stepNumber} of 9
              </span>
              <span className="text-xs font-mono text-[#8E8E8A]">[{currentStepData.category}]</span>
            </div>
            <h3 className="text-xl font-bold text-[#151515]">
              {currentStepData.title}
            </h3>
            <p className="text-xs text-[#333333] leading-relaxed">
              {currentStepData.summary}
            </p>
          </div>

          {/* Screenshot Display with Callout */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#151515]">
                Actual Application Interface:
              </span>
              <span className="text-[10px] text-[#8E8E8A] font-mono">
                {currentStepData.screenshotSrc}
              </span>
            </div>

            <div className="border border-[#D5D5D2] bg-[#F5F5F3] overflow-hidden shadow-xs">
              <img
                src={currentStepData.screenshotSrc}
                alt={currentStepData.screenshotAlt}
                className="w-full h-auto object-cover max-h-[460px]"
                onError={(e) => {
                  // Fallback graceful placeholder if image generation is pending
                  const target = e.target as HTMLElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement("div");
                    fallback.className = "p-12 text-center text-xs text-[#686868] space-y-2 bg-[#FCFCFA]";
                    fallback.innerHTML = `
                      <span class="w-8 h-8 rounded-full bg-[#EEEEEC] text-[#151515] font-bold font-mono inline-flex items-center justify-center mb-1">📸</span>
                      <p class="font-bold text-[#151515]">${currentStepData.screenshotAlt}</p>
                      <p class="text-[11px] text-[#8E8E8A]">Capture script available at: src/scripts/capture_user_manual_screenshots.ts</p>
                    `;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>

            {/* Callout Notice */}
            <div className="p-3 bg-[#FFFDF5] border-l-4 border-[#F2D21A] text-xs text-[#151515]">
              <strong className="text-[#806600]">Important Instruction: </strong>
              <span>{currentStepData.calloutNote}</span>
            </div>
          </div>

          {/* Operational Input & Expected Output Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-[#FCFCFA] border border-[#EEEEEC] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#151515] block">
                Required Operational Inputs:
              </span>
              <ul className="text-xs text-[#686868] space-y-1 pl-4 list-disc">
                {currentStepData.requiredInputs.map((inp, idx) => (
                  <li key={idx}>{inp}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-[#FCFCFA] border border-[#EEEEEC] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#151515] block">
                Expected System Deliverables:
              </span>
              <ul className="text-xs text-[#686868] space-y-1 pl-4 list-disc">
                {currentStepData.expectedResults.map((res, idx) => (
                  <li key={idx}>{res}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[#EEEEEC]">
            <button
              type="button"
              disabled={activeStep === 1}
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 bg-white border border-[#D5D5D2] text-xs font-semibold text-[#151515] hover:bg-[#F5F5F3] disabled:opacity-30 cursor-pointer"
            >
              ← Previous Step
            </button>

            <span className="text-xs font-mono text-[#8E8E8A]">
              Step {activeStep} of 9
            </span>

            <button
              type="button"
              disabled={activeStep === 9}
              onClick={() => setActiveStep((prev) => Math.min(9, prev + 1))}
              className="px-4 py-2 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-30 cursor-pointer"
            >
              Next Step →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
