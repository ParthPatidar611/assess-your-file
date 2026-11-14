"use client";

import React from "react";

interface ReviewScreenProps {
  caseType: string;
  title: string;
  facts: string;
  desiredOutcome: string;
  files: File[];
  onBackToEdit: () => void;
  onSubmit: () => void;
  loading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReviewScreen({
  caseType,
  title,
  facts,
  desiredOutcome,
  files,
  onBackToEdit,
  onSubmit,
  loading,
}: ReviewScreenProps) {
  return (
    <div className="space-y-8">
      {/* Review Summary Container */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Step 02 of 02 - Verification
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#151515] tracking-tight">
              Review Your Matter
            </h2>
          </div>

          <button
            onClick={onBackToEdit}
            disabled={loading}
            className="text-xs font-semibold text-[#151515] hover:underline flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>←</span> Back to Edit Details
          </button>
        </div>

        {/* Structured Editorial Table */}
        <div className="divide-y divide-[#EEEEEC] border border-[#EEEEEC]">
          {/* Matter Category */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-2 bg-[#FAFAF8]">
            <div className="md:col-span-3 text-xs font-bold uppercase tracking-wider text-[#686868]">
              Matter Category
            </div>
            <div className="md:col-span-9 text-sm font-semibold text-[#151515]">
              {caseType || "Not specified"}
            </div>
          </div>

          {/* Matter Title */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-2 bg-white">
            <div className="md:col-span-3 text-xs font-bold uppercase tracking-wider text-[#686868]">
              Matter Title
            </div>
            <div className="md:col-span-9 text-sm font-semibold text-[#151515]">
              {title}
            </div>
          </div>

          {/* Stated Facts */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-2 bg-[#FAFAF8]">
            <div className="md:col-span-3 text-xs font-bold uppercase tracking-wider text-[#686868]">
              Stated Facts & Chronology
            </div>
            <div className="md:col-span-9 text-sm text-[#171717] leading-relaxed whitespace-pre-wrap font-normal">
              {facts}
            </div>
          </div>

          {/* Desired Outcome */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-2 bg-white">
            <div className="md:col-span-3 text-xs font-bold uppercase tracking-wider text-[#686868]">
              Desired Relief / Outcome
            </div>
            <div className="md:col-span-9 text-sm text-[#171717] leading-relaxed whitespace-pre-wrap">
              {desiredOutcome || (
                <span className="italic text-[#8E8E8A]">No specific desired outcome stated.</span>
              )}
            </div>
          </div>

          {/* Attached Supporting Documents */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-2 bg-[#FAFAF8]">
            <div className="md:col-span-3 text-xs font-bold uppercase tracking-wider text-[#686868]">
              Supporting Documents ({files.length})
            </div>
            <div className="md:col-span-9">
              {files.length === 0 ? (
                <span className="text-xs text-[#8E8E8A] italic">
                  No supporting documents attached. Assessment will rely entirely on stated facts.
                </span>
              ) : (
                <ul className="space-y-2">
                  {files.map((file, idx) => (
                    <li
                      key={idx}
                      className="text-xs flex items-center justify-between p-2.5 bg-white border border-[#D5D5D2]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#686868]">0{idx + 1}.</span>
                        <span className="font-semibold text-[#151515]">{file.name}</span>
                      </div>
                      <span className="text-[11px] text-[#8E8E8A]">
                        {formatFileSize(file.size)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Notice */}
        <div className="mt-6 p-4 bg-[#F7F7F5] border border-[#D5D5D2] text-xs text-[#686868] leading-relaxed">
          <p className="font-semibold text-[#151515] mb-1">
            Preliminary Assessment Notice
          </p>
          <p>
            By submitting, your matter facts and attached documents will be evaluated against the 2025 Indian Supreme Court database. All outputs represent an automated research screening and do not substitute for formal engagement of an advocate.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToEdit}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#EEEEEC] text-[#151515] font-semibold text-xs uppercase tracking-wider transition border border-[#D5D5D2]"
        >
          ← Back to Edit
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="w-full sm:w-auto px-10 py-3.5 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] font-bold text-xs sm:text-sm uppercase tracking-wider transition border border-[#D5D5D2] shadow-xs flex items-center justify-center gap-2"
        >
          <span>Submit for Assessment</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
