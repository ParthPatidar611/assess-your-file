"use client";

import React, { useState } from "react";
import type { GeneratedPetition } from "@/components/types";

interface StagePetitionPreviewProps {
  petition: GeneratedPetition;
  onProceedToExport: () => void;
  onBackToAnnexures: () => void;
  isTimelineStale?: boolean;
  onRecompileDraft?: () => void;
}

export default function StagePetitionPreview({
  petition,
  onProceedToExport,
  onBackToAnnexures,
  isTimelineStale = false,
  onRecompileDraft,
}: StagePetitionPreviewProps) {
  const [highlightedAnnexure, setHighlightedAnnexure] = useState<string | null>(null);
  const [highlightedFact, setHighlightedFact] = useState<string | null>(null);

  const report = petition.validationReport;
  const hasValidationIssues =
    report.missingMandatoryInformation.length > 0 ||
    report.invalidCrossReferences.length > 0 ||
    report.unsupportedClaims.length > 0;

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Stage E · Integrated Petition Preview & Evidence Traceability
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#151515]">
              Formal Indian Court Pleading Draft
            </h2>
            <p className="text-xs text-[#686868] mt-1 max-w-3xl">
              Inspect the compiled draft prior to export. Hover over any <code>[Annexure X]</code> or <code>[FACT-xxx]</code> badge to trace documentary origin.
              The right-hand panel provides explicit statutory and cross-reference verification.
            </p>
          </div>

          <button
            type="button"
            onClick={onProceedToExport}
            className="px-6 py-2.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer self-start sm:self-auto flex items-center gap-2"
          >
            <span>Proceed to Review & Export (Stage F)</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Stale Timeline Warning Banner */}
      {isTimelineStale && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="font-bold text-[11px] uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 border border-amber-400 shrink-0">
              Review Required — Source Timeline Changed
            </span>
            <span className="text-xs text-amber-900 leading-tight">
              The underlying chronological event timeline was modified after this petition was compiled. Recompile the draft to incorporate latest events and prayers.
            </span>
          </div>
          {onRecompileDraft && (
            <button
              type="button"
              onClick={onRecompileDraft}
              className="px-3.5 py-1.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer"
            >
              Recompile Petition Draft ↻
            </button>
          )}
        </div>
      )}

      {/* Split Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Pane: Pleading Document (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#D5D5D2] p-8 sm:p-12 shadow-sm font-serif text-[#151515] space-y-6">
          {/* Top Mandatory Disclaimer Banner */}
          <div className="p-3 bg-[#FFF9E6] border border-[#F2D21A] text-center text-[10px] font-sans font-bold uppercase tracking-wider text-[#806600]">
            {petition.advocateNotice}
          </div>

          {/* Court / Forum Heading */}
          <div className="text-center space-y-2 border-b border-[#EEEEEC] pb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-[#151515]">
              {petition.courtHeading}
            </h3>
            <p className="text-xs font-bold uppercase tracking-wide font-sans text-[#686868]">
              {petition.natureOfProceeding}
            </p>
            <p className="text-xs font-mono text-[#8E8E8A] pt-1">
              CAUSE TITLE: {petition.causeTitle.split("\n")[0]}
            </p>
          </div>

          {/* Memo of Parties Block */}
          <div className="space-y-4 text-xs font-sans border-b border-[#EEEEEC] pb-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-bold text-[#151515]">{petition.partiesBlock.petitionerName}</p>
                <p className="text-[#686868] text-[11px]">{petition.partiesBlock.petitionerAddress}</p>
              </div>
              <span className="font-bold text-[#151515] uppercase tracking-wider text-[11px] whitespace-nowrap">
                ... {petition.partiesBlock.petitionerRole}
              </span>
            </div>

            <div className="text-center font-bold text-xs text-[#8E8E8A] uppercase tracking-widest my-2">
              VERSUS
            </div>

            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-bold text-[#151515]">{petition.partiesBlock.respondentName}</p>
                <p className="text-[#686868] text-[11px]">{petition.partiesBlock.respondentAddress}</p>
              </div>
              <span className="font-bold text-[#151515] uppercase tracking-wider text-[11px] whitespace-nowrap">
                ... {petition.partiesBlock.respondentRole}
              </span>
            </div>
          </div>

          {/* Chronological List of Dates and Events */}
          <div className="space-y-3 font-sans">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] border-b border-[#EEEEEC] pb-2">
              Chronological List of Dates and Events
            </h4>
            <div className="border border-[#D5D5D2] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F3] text-[#686868] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2.5 w-32">Date</th>
                    <th className="p-2.5">Event Summary</th>
                    <th className="p-2.5 w-28">Exhibit Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEC]">
                  {petition.chronologicalListDates.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FCFCFA]">
                      <td className="p-2.5 font-bold text-[#151515] whitespace-nowrap">{item.date}</td>
                      <td className="p-2.5 text-[#333333]">{item.eventSummary}</td>
                      <td className="p-2.5 font-mono text-[11px] font-semibold text-[#806600]">
                        {item.annexureRef || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement of Facts (Numbered Paragraphs) */}
          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] font-sans border-b border-[#EEEEEC] pb-2">
              Numbered Statement of Facts & Event Breaches
            </h4>
            <p className="text-xs italic font-serif">MOST RESPECTFULLY SHOWETH:</p>

            <div className="space-y-4 text-xs leading-relaxed text-[#2D2D2D]">
              {petition.statementOfFacts.map((para) => (
                <div key={para.paragraphNumber} className="flex gap-3">
                  <span className="font-bold font-sans text-[#151515] min-w-[20px]">
                    {para.paragraphNumber}.
                  </span>
                  <div className="flex-1">
                    <p>{para.text}</p>
                    <div className="flex items-center gap-2 mt-1 font-sans">
                      {para.citedAnnexures.map((annx) => (
                        <span
                          key={annx}
                          onMouseEnter={() => setHighlightedAnnexure(annx)}
                          onMouseLeave={() => setHighlightedAnnexure(null)}
                          className="px-1.5 py-0.2 bg-[#FFF9E6] border border-[#F2D21A] text-[10px] font-bold text-[#806600] cursor-pointer"
                        >
                          {annx}
                        </span>
                      ))}
                      {para.citedFactIds.map((fid) => (
                        <span
                          key={fid}
                          onMouseEnter={() => setHighlightedFact(fid)}
                          onMouseLeave={() => setHighlightedFact(null)}
                          className="px-1.5 py-0.2 bg-[#F5F5F3] border border-[#D5D5D2] text-[10px] font-mono text-[#686868] cursor-pointer"
                        >
                          {fid}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {petition.eventBreachesAndResponses.map((para) => (
                <div key={para.paragraphNumber} className="flex gap-3">
                  <span className="font-bold font-sans text-[#151515] min-w-[20px]">
                    {para.paragraphNumber}.
                  </span>
                  <div className="flex-1">
                    <p>{para.text}</p>
                    {para.citedAnnexures.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 font-sans">
                        {para.citedAnnexures.map((annx) => (
                          <span
                            key={annx}
                            className="px-1.5 py-0.2 bg-[#FFF9E6] border border-[#F2D21A] text-[10px] font-bold text-[#806600]"
                          >
                            {annx}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anticipated Objections & Rebuttals (Approved only) */}
          {petition.anticipatedObjectionsAndRebuttals.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#EEEEEC]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] font-sans">
                Traversal of Anticipated Objections
              </h4>
              <div className="space-y-3 text-xs leading-relaxed text-[#2D2D2D]">
                {petition.anticipatedObjectionsAndRebuttals.map((para) => (
                  <div key={para.paragraphNumber} className="flex gap-3">
                    <span className="font-bold font-sans text-[#151515] min-w-[20px]">
                      {para.paragraphNumber}.
                    </span>
                    <p className="flex-1">{para.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounds Section */}
          <div className="space-y-4 pt-4 border-t border-[#EEEEEC]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] font-sans">
              Grounds
            </h4>
            <div className="space-y-3 text-xs leading-relaxed text-[#2D2D2D]">
              {petition.grounds.map((g) => (
                <div key={g.groundLetter} className="flex gap-3">
                  <span className="font-bold font-sans text-[#151515] min-w-[20px]">
                    {g.groundLetter}.
                  </span>
                  <div className="flex-1">
                    <span className="font-bold font-sans text-[#151515]">
                      [{g.statutoryBasis}] —{" "}
                    </span>
                    <span>{g.argument}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consolidated Prayers Section */}
          <div className="space-y-4 pt-4 border-t border-[#EEEEEC]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] font-sans">
              Prayer for Relief
            </h4>
            <p className="text-xs italic font-serif">
              Wherefore, it is most respectfully prayed that this Hon'ble Court / Forum may graciously be pleased to:
            </p>
            <div className="space-y-3 text-xs leading-relaxed text-[#151515] font-sans">
              {petition.consolidatedPrayers.map((pr) => (
                <div key={pr.prayerId} className="flex gap-3 pl-2">
                  <span className="font-bold text-[#151515]">{pr.prayerId}</span>
                  <p className="flex-1">{pr.prayerText}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Statement */}
          <div className="pt-6 border-t border-[#EEEEEC] space-y-2 font-sans text-xs">
            <h5 className="font-bold uppercase tracking-wider text-[#151515]">Verification</h5>
            <p className="text-[#686868] leading-relaxed">
              {petition.verificationStatement.verificationText}
            </p>
            <div className="flex justify-between items-center pt-4 text-[11px] font-bold text-[#151515]">
              <span>Verified at {petition.verificationStatement.place}</span>
              <span>DEPONENT</span>
            </div>
          </div>
        </div>

        {/* Right Pane: Validation Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-28">
          <div className="bg-white border border-[#D5D5D2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEEC] pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                Verification Inspector
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                  report.isValid
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                    : "bg-amber-50 text-amber-800 border border-amber-300"
                }`}
              >
                {report.isValid ? "Consistency Passed" : "Action Required"}
              </span>
            </div>

            {/* Validation items */}
            <div className="space-y-3 text-xs">
              {/* Missing Mandatory Information */}
              {report.missingMandatoryInformation.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block">
                    Missing Mandatory Information:
                  </span>
                  {report.missingMandatoryInformation.map((item, idx) => (
                    <p key={idx} className="text-[11px] text-red-700 leading-tight">
                      • {item}
                    </p>
                  ))}
                </div>
              )}

              {/* Invalid Cross References */}
              {report.invalidCrossReferences.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block">
                    Invalid Annexure Cross-References:
                  </span>
                  {report.invalidCrossReferences.map((item, idx) => (
                    <p key={idx} className="text-[11px] text-red-700 leading-tight">
                      • {item}
                    </p>
                  ))}
                </div>
              )}

              {/* Missing Annexures from Narrative */}
              {report.missingAnnexures.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Unattached Narrative Documents:
                  </span>
                  {report.missingAnnexures.map((item, idx) => (
                    <p key={idx} className="text-[11px] text-amber-800 leading-tight">
                      • {item}
                    </p>
                  ))}
                </div>
              )}

              {/* Items Requiring Advocate Review */}
              {report.itemsRequiringAdvocateReview.length > 0 && (
                <div className="p-3 bg-[#FCFCFA] border border-[#D5D5D2] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#686868] block">
                    Advocate Review Items:
                  </span>
                  {report.itemsRequiringAdvocateReview.map((item, idx) => (
                    <p key={idx} className="text-[11px] text-[#686868] leading-tight">
                      • {item}
                    </p>
                  ))}
                </div>
              )}

              {/* All Checks Passed Notification */}
              {report.isValid && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <span className="font-bold">✓ Internal Consistency Verified: </span>
                  All cited annexures exist in the registry, factual assertions are attributed, and statutory provisions match verified Indian law.
                </div>
              )}
            </div>

            {/* Evidence Quick-Trace */}
            {(highlightedAnnexure || highlightedFact) && (
              <div className="p-3 bg-[#151515] text-white text-xs font-mono space-y-1 border border-[#2D2D2D]">
                <span className="text-[10px] text-[#F2D21A] font-bold uppercase block">
                  Evidence Inspector:
                </span>
                {highlightedAnnexure && <div>Inspecting: {highlightedAnnexure}</div>}
                {highlightedFact && <div>Trace: {highlightedFact}</div>}
              </div>
            )}
          </div>

          {/* Navigation Action */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onProceedToExport}
              className="w-full py-3 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] border border-[#D5D5D2] text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center"
            >
              Export DOCX / PDF →
            </button>
            <button
              type="button"
              onClick={onBackToAnnexures}
              className="w-full py-2 bg-white hover:bg-[#F5F5F3] text-[#151515] border border-[#D5D5D2] text-xs font-semibold transition cursor-pointer text-center"
            >
              ← Back to Annexure Registry (Stage D)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
