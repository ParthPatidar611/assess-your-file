"use client";

import React, { useRef, useState } from "react";

interface AssessmentFormProps {
  caseType: string;
  setCaseType: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  facts: string;
  setFacts: (val: string) => void;
  desiredOutcome: string;
  setDesiredOutcome: (val: string) => void;
  files: File[];
  fileValidationErrors: string[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onProceedToReview: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "Commercial / Business Dispute", label: "Commercial / Business Dispute" },
  { value: "Contractual Dispute", label: "Contractual & Supply Dispute" },
  { value: "Arbitration", label: "Arbitration & Award Challenge (Section 34)" },
  { value: "Corporate Insolvency", label: "Insolvency & Bankruptcy (IBC)" },
  { value: "Consumer Dispute", label: "Consumer Protection Dispute" },
  { value: "Property Dispute", label: "Property & Real Estate Dispute" },
  { value: "Employment Dispute", label: "Employment & Labour Matter" },
  { value: "Other", label: "Other Civil / Corporate Matter" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssessmentForm({
  caseType,
  setCaseType,
  title,
  setTitle,
  facts,
  setFacts,
  desiredOutcome,
  setDesiredOutcome,
  files,
  fileValidationErrors,
  onAddFiles,
  onRemoveFile,
  onProceedToReview,
}: AssessmentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const validateAndProceed = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!caseType) {
      setFormError("Please select the legal matter category.");
      return;
    }
    if (!title.trim() || title.trim().length < 5) {
      setFormError("Please enter a descriptive title for your matter (at least 5 characters).");
      return;
    }
    if (!facts.trim() || facts.trim().length < 30) {
      setFormError("Please provide at least 30 characters describing what happened in your matter.");
      return;
    }

    onProceedToReview();
  };

  return (
    <div className="space-y-8">
      {/* Form Card Header */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8">
        <div className="border-b border-[#EEEEEC] pb-5 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight">
            Tell us about your legal matter
          </h2>
          <p className="text-xs sm:text-sm text-[#686868] mt-1">
            Provide the key details to help us understand your situation and identify relevant Supreme Court rulings.
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-3.5 bg-[#FFF9E6] border-l-4 border-[#F2D21A] text-xs text-[#151515] flex items-center gap-2">
            <span className="font-bold">Notice:</span>
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Row 1: Matter Type & Brief Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#151515] uppercase tracking-wider mb-2">
                Select Matter Type <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                className="w-full h-11 px-3.5 border border-[#D5D5D2] bg-white text-sm text-[#171717] rounded-none transition hover:border-[#151515] focus:border-[#151515]"
              >
                <option value="" disabled>Select matter domain</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#8E8E8A] mt-1.5">
                Helps match relevant domain benchmarks and judicial principles.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#151515] uppercase tracking-wider mb-2">
                Brief Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Non-payment of running bills and wrongful contract termination"
                maxLength={300}
                className="w-full h-11 px-3.5 border border-[#D5D5D2] bg-white text-sm text-[#171717] rounded-none transition hover:border-[#151515] focus:border-[#151515]"
              />
              <p className="text-[11px] text-[#8E8E8A] mt-1.5">
                A concise descriptor for the assessment header.
              </p>
            </div>
          </div>

          {/* Row 2: Describe What Happened & What Outcome Seeking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-[#151515] uppercase tracking-wider">
                  Describe What Happened <span className="text-red-600">*</span>
                </label>
                <span className="text-[10px] text-[#8E8E8A]">
                  {facts.length} / 15,000 characters
                </span>
              </div>
              <textarea
                required
                rows={9}
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                placeholder="Chronologically describe key events, contractual dates, notices served, payments made or defaulted, and how the dispute originated (minimum 30 characters)."
                className="w-full p-3.5 border border-[#D5D5D2] bg-white text-sm text-[#171717] leading-relaxed rounded-none resize-y transition hover:border-[#151515] focus:border-[#151515]"
              />
              <p className="text-[11px] text-[#8E8E8A] mt-1.5">
                Include explicit dates so the chronology generator can construct your timeline accurately.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-[#151515] uppercase tracking-wider">
                  What Outcome Are You Seeking?
                </label>
                <span className="text-[10px] text-[#8E8E8A]">Optional</span>
              </div>
              <textarea
                rows={9}
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                placeholder="e.g. Recovery of Rs 45 Lakhs advance payment with interest; restraining encashment of bank guarantee; or negotiating a commercial settlement."
                className="w-full p-3.5 border border-[#D5D5D2] bg-white text-sm text-[#171717] leading-relaxed rounded-none resize-y transition hover:border-[#151515] focus:border-[#151515]"
              />
              <p className="text-[11px] text-[#8E8E8A] mt-1.5">
                States your preferred resolution for strategy recommendations and legal options mapping.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting PDF Documents Section */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h3 className="text-base sm:text-lg font-bold text-[#151515] tracking-tight">
            Upload Supporting Documents
          </h3>
          <p className="text-xs sm:text-sm text-[#686868] mt-1">
            Attach contracts, agreements, legal notices, invoices, judgments or other relevant documents.
          </p>
        </div>

        {/* Rectangular Upload Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed p-8 text-center cursor-pointer transition select-none ${
            dragActive
              ? "border-[#151515] bg-[#EEEEEC]"
              : "border-[#D5D5D2] bg-[#FAFAF8] hover:bg-[#F2F2F0] hover:border-[#151515]"
          }`}
        >
          <div className="max-w-md mx-auto">
            <span className="inline-block text-2xl mb-2 text-[#151515]">⎙</span>
            <p className="text-xs sm:text-sm font-semibold text-[#151515]">
              Click to browse or drag and drop supporting PDF documents here
            </p>
            <p className="text-[11px] text-[#8E8E8A] mt-1">
              PDF format only · Maximum 5 MB per file · Up to 3 documents
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => onAddFiles(e.target.files)}
          />
        </div>

        {/* File Validation Errors */}
        {fileValidationErrors.length > 0 && (
          <div className="mt-4 p-3.5 bg-[#FFF9E6] border-l-4 border-amber-500 text-xs text-amber-900 space-y-1">
            {fileValidationErrors.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        )}

        {/* Uploaded Files Table */}
        {files.length > 0 && (
          <div className="mt-6 border border-[#D5D5D2]">
            <div className="bg-[#EEEEEC] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#151515] border-b border-[#D5D5D2] flex justify-between items-center">
              <span>Attached Documents ({files.length} of 3)</span>
              <span className="text-[10px] text-[#686868]">In-Memory Processing</span>
            </div>

            <div className="divide-y divide-[#EEEEEC]">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="px-4 py-3 flex items-center justify-between bg-white hover:bg-[#FAFAF8] transition text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <span className="text-sm font-bold text-[#686868]">0{index + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#151515] truncate">{file.name}</p>
                      <p className="text-[11px] text-[#8E8E8A]">
                        {formatFileSize(file.size)} · Ready for extraction
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="px-2 py-1 text-xs text-[#8E8E8A] hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition font-medium"
                  >
                    Remove ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multimodal Ingestion Notice */}
        <div className="mt-4 p-3.5 bg-[#F7F7F5] border border-[#EEEEEC] text-[11px] leading-relaxed text-[#686868]">
          <span className="font-semibold text-[#151515]">Multimodal Document Intelligence:</span> Uploaded PDF documents are processed in-memory through our hybrid extraction pipeline. Digital text, scanned printed pages, and photographed handwritten records are classified per-page, transcribed with source provenance, and organized into an evidentiary ledger.
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-[#686868]">
          Step 01 of 02 - Proceed to review details before running the assessment.
        </div>

        <button
          type="button"
          onClick={validateAndProceed}
          className="w-full sm:w-auto px-8 py-3.5 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] font-bold text-xs sm:text-sm uppercase tracking-wider transition border border-[#D5D5D2] shadow-xs flex items-center justify-center gap-2"
        >
          <span>Next: Review & Submit</span>
          <span className="text-base font-normal">→</span>
        </button>
      </div>
    </div>
  );
}
