"use client";

import React, { useState } from "react";
import type { GeneratedPetition } from "@/components/types";

interface StageExportReviewProps {
  petition: GeneratedPetition;
  onBackToPreview: () => void;
  onOpenUserManual: () => void;
}

export default function StageExportReview({
  petition,
  onBackToPreview,
  onOpenUserManual,
}: StageExportReviewProps) {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    setExportError(null);

    try {
      const response = await fetch("/api/petition/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petition }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate DOCX document from server.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (petition.matterTitle || "Legal_Petition")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 32);
      a.download = `${safeTitle}_Formal_Pleading_Draft.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Error generating DOCX export.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleCopyText = () => {
    let fullText = `${petition.courtHeading}\n${petition.natureOfProceeding}\n\n`;
    fullText += `${petition.causeTitle}\n\n`;
    fullText += `CHRONOLOGICAL LIST OF DATES AND EVENTS:\n`;
    petition.chronologicalListDates.forEach((d) => {
      fullText += `${d.date} — ${d.eventSummary} ${d.annexureRef ? `[${d.annexureRef}]` : ""}\n`;
    });
    fullText += `\nSTATEMENT OF FACTS:\n`;
    petition.statementOfFacts.forEach((p) => {
      fullText += `${p.paragraphNumber}. ${p.text}\n`;
    });
    fullText += `\nEVENT BREACHES & RESPONSES:\n`;
    petition.eventBreachesAndResponses.forEach((p) => {
      fullText += `${p.paragraphNumber}. ${p.text}\n`;
    });
    fullText += `\nGROUNDS:\n`;
    petition.grounds.forEach((g) => {
      fullText += `${g.groundLetter}. [${g.statutoryBasis}] ${g.argument}\n`;
    });
    fullText += `\nPRAYER:\n`;
    petition.consolidatedPrayers.forEach((pr) => {
      fullText += `${pr.prayerId} ${pr.prayerText}\n`;
    });
    fullText += `\nVERIFICATION:\n${petition.verificationStatement.verificationText}\n`;
    fullText += `\nINDEX OF ANNEXURES:\n`;
    petition.annexureIndex.items
      .filter((i) => !i.isExcluded)
      .forEach((a) => {
        fullText += `${a.annexureLabel}: ${a.documentTitle} (${a.relevantPageRange})\n`;
      });

    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
            Stage F · Export Engine & Compliance Review
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#151515]">
          Deliverable Export & Legal Review Certification
        </h2>
        <p className="text-xs text-[#686868] mt-1 max-w-3xl">
          Export the final structured pleading in Word (<code>.docx</code>) format with formal Indian legal margins and line spacing,
          or render a clean, high-resolution PDF with the browser print engine.
        </p>
      </div>

      {exportError && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-xs text-red-800">
          <strong>Export Error:</strong> {exportError}
        </div>
      )}

      {/* Primary Export Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Download DOCX */}
        <div className="bg-white border border-[#D5D5D2] p-6 flex flex-col justify-between space-y-4 hover:border-[#151515] transition">
          <div>
            <span className="w-8 h-8 flex items-center justify-center bg-[#151515] text-[#F2D21A] font-bold text-xs mb-3 font-mono">
              W
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515]">
              Microsoft Word (.docx)
            </h3>
            <p className="text-xs text-[#686868] mt-2 leading-relaxed">
              Fully editable formal court pleading draft. Formatted with 1-inch margins, 1.5 line spacing, 12pt Times New Roman, numbered paragraphs, and formal Annexure Index.
            </p>
          </div>
          <button
            type="button"
            disabled={isExportingDocx}
            onClick={handleDownloadDocx}
            className="w-full py-2.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50 text-center"
          >
            {isExportingDocx ? "Generating DOCX..." : "Download Word (.docx) ⭳"}
          </button>
        </div>

        {/* 2. Print / PDF Export */}
        <div className="bg-white border border-[#D5D5D2] p-6 flex flex-col justify-between space-y-4 hover:border-[#151515] transition">
          <div>
            <span className="w-8 h-8 flex items-center justify-center bg-[#F2D21A] text-[#151515] font-bold text-xs mb-3 font-mono">
              P
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515]">
              High-DPI Print / PDF Export
            </h3>
            <p className="text-xs text-[#686868] mt-2 leading-relaxed">
              Triggers the browser's native print engine with tailored print stylesheets, clean page breaks, institutional running headers, and footers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-2.5 bg-white border border-[#151515] hover:bg-[#F5F5F3] text-[#151515] text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center"
          >
            Print / Save as PDF ⎙
          </button>
        </div>

        {/* 3. Operational User Manual */}
        <div className="bg-white border border-[#D5D5D2] p-6 flex flex-col justify-between space-y-4 hover:border-[#151515] transition">
          <div>
            <span className="w-8 h-8 flex items-center justify-center bg-[#EEEEEC] text-[#151515] font-bold text-xs mb-3 font-mono">
              ?
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515]">
              Operational User Manual
            </h3>
            <p className="text-xs text-[#686868] mt-2 leading-relaxed">
              Access the complete screenshot-based operational guide covering all 9 steps: intake, OCR extraction, event sequencing, annexures, and pleading review.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenUserManual}
            className="w-full py-2.5 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center border border-[#D5D5D2]"
          >
            Open User Manual 📖
          </button>
        </div>
      </div>

      {/* Copy Raw Text Block */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515]">
              Quick Clipboard Copy
            </h4>
            <p className="text-[11px] text-[#686868] mt-0.5">
              Copy plain text of the entire pleading directly to your clipboard for paste into your law firm's custom letterhead or filing portal.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyText}
            className="px-4 py-2 bg-white border border-[#D5D5D2] hover:bg-[#F5F5F3] text-xs font-bold uppercase tracking-wider text-[#151515] cursor-pointer"
          >
            {copiedText ? "✓ Copied to Clipboard" : "Copy Full Text 📋"}
          </button>
        </div>
      </div>

      {/* Compliance Disclaimers */}
      <div className="p-5 bg-[#FCFCFA] border border-[#D5D5D2] space-y-2 text-xs text-[#686868]">
        <span className="font-bold uppercase tracking-wider text-[#151515] block">
          Mandatory Legal Review & Professional Standards:
        </span>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
          <li>
            This document is an AI-assisted <strong>preliminary legal draft</strong> and does not constitute a certified court filing.
          </li>
          <li>
            An advocate enrolled under the Advocates Act, 1961 must independently review all factual assertions, verify original supporting annexures, and confirm court fee calculation prior to formal presentation.
          </li>
          <li>
            Internal strategy notes generated during counterparty intelligence are privileged and have been completely omitted from this export.
          </li>
        </ul>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBackToPreview}
          className="px-5 py-2.5 bg-white border border-[#D5D5D2] hover:bg-[#F5F5F3] text-xs font-semibold text-[#151515] transition cursor-pointer"
        >
          ← Back to Pleading Preview (Stage E)
        </button>
      </div>
    </div>
  );
}
