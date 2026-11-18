"use client";

import React, { useState } from "react";
import type { CounterpartyArgument } from "@/components/types";

interface StageCounterpartyProps {
  argumentsList: CounterpartyArgument[];
  setArgumentsList: (updater: (prev: CounterpartyArgument[]) => CounterpartyArgument[]) => void;
  onProceedToAnnexures: () => void;
  onBackToEvents: () => void;
  onRefreshAI?: () => Promise<void>;
  isGeneratingAI?: boolean;
  isTimelineStale?: boolean;
  timelineVersion?: number;
  generatedVersion?: number;
}

export default function StageCounterparty({
  argumentsList,
  setArgumentsList,
  onProceedToAnnexures,
  onBackToEvents,
  onRefreshAI,
  isGeneratingAI = false,
  isTimelineStale = false,
  timelineVersion = 1,
  generatedVersion = 1,
}: StageCounterpartyProps) {
  const [activeArgId, setActiveArgId] = useState<string | null>(argumentsList[0]?.argumentId || null);

  const handleToggleInclude = (argId: string) => {
    setArgumentsList((prev) =>
      prev.map((a) => (a.argumentId === argId ? { ...a, includeInPetition: !a.includeInPetition } : a))
    );
  };

  const handleUpdateRebuttal = (argId: string, newRebuttal: string) => {
    setArgumentsList((prev) =>
      prev.map((a) => (a.argumentId === argId ? { ...a, applicantRebuttal: newRebuttal } : a))
    );
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Stage C · Counterparty Argument Intelligence
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#151515]">
              Anticipated Defenses & Applicant Rebuttal Matrix ({argumentsList.length} Arguments)
            </h2>
            <p className="text-xs text-[#686868] mt-1 max-w-3xl">
              Anticipate opposing arguments based on evidentiary gaps and contract terms.
              Toggle which rebuttals to proactively plead in the Plaint.
              Confidential strategy notes are <strong>strictly excluded</strong> from the formal court pleading and exported documents.
            </p>
          </div>

          {onRefreshAI && (
            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={onRefreshAI}
              className="px-4 py-2 bg-white border border-[#151515] hover:bg-[#F5F5F3] text-[#151515] text-xs font-bold uppercase tracking-wider transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              {isGeneratingAI ? "Analyzing Defenses..." : "Refresh Adversarial Analysis ⟳"}
            </button>
          )}
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
              The chronological event timeline was updated (v{generatedVersion} → v{timelineVersion}) after these arguments were generated. Regenerate adversarial analysis to reflect latest events.
            </span>
          </div>
          {onRefreshAI && (
            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={onRefreshAI}
              className="px-3.5 py-1.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAI ? "Regenerating..." : "Regenerate Counterparty Arguments ↻"}
            </button>
          )}
        </div>
      )}

      {/* Arguments Cards */}
      <div className="space-y-6">
        {argumentsList.map((arg, idx) => {
          const isSelected = activeArgId === arg.argumentId;

          return (
            <div
              key={arg.argumentId}
              className={`bg-white border transition-all ${
                arg.includeInPetition ? "border-[#151515]" : "border-[#D5D5D2] opacity-80"
              }`}
            >
              {/* Card Header & Inclusion Toggle */}
              <div className="p-5 border-b border-[#EEEEEC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFCFA]">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-[#686868] text-white text-[10px] font-bold uppercase tracking-wider">
                    Argument #{idx + 1}
                  </span>
                  <span className="text-xs font-mono text-[#8E8E8A]">[{arg.argumentId}]</span>
                  <span className="text-xs text-[#686868]">
                    Linked: {arg.relatedEventIds.join(", ")}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-[#D5D5D2] text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={arg.includeInPetition}
                      onChange={() => handleToggleInclude(arg.argumentId)}
                      className="rounded-none border-[#D5D5D2]"
                    />
                    <span>Include Rebuttal in Plaint</span>
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                      arg.includeInPetition
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        : "bg-stone-100 text-stone-600 border border-stone-300"
                    }`}
                  >
                    {arg.includeInPetition ? "Included in Draft" : "Reserved for Oral Hearing"}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-5">
                {/* 1. Anticipated Opposing Party Argument */}
                <div className="p-4 bg-[#FFF9E6] border-l-4 border-[#F2D21A]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#806600] block mb-1">
                    Anticipated Opposing Party Argument (Defense):
                  </span>
                  <p className="text-xs text-[#151515] leading-relaxed font-medium">
                    {arg.opposingPartyArgument}
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#F2D21A]/30 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#686868]">
                    <span>
                      <strong>Factual Basis:</strong> {arg.factualBasis}
                    </span>
                    {arg.applicableLegalPrinciple && (
                      <span>
                        <strong>Legal Principle:</strong> {arg.applicableLegalPrinciple}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Applicant's Proposed Rebuttal */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#151515]">
                      Applicant's Substantiated Rebuttal:
                    </label>
                    <span className="text-[10px] text-[#8E8E8A]">
                      Appears in Section 4 of Court Plaint if Included
                    </span>
                  </div>
                  <textarea
                    value={arg.applicantRebuttal}
                    onChange={(e) => handleUpdateRebuttal(arg.argumentId, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none leading-relaxed"
                    placeholder="Enter applicant's counter-argument and factual explanation..."
                  />
                  {arg.supportingEvidence && arg.supportingEvidence.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[#686868]">
                      <span className="font-semibold">Supporting Evidence:</span>
                      {arg.supportingEvidence.map((ev, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#F5F5F3] border border-[#D5D5D2] text-[10px]">
                          {ev}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Vulnerability Notice */}
                {arg.vulnerabilities && (
                  <div className="p-3 bg-[#FAF8F5] border border-[#EEEEEC] text-[11px] text-[#686868]">
                    <strong className="text-[#151515]">Evidentiary Caution: </strong>
                    <span>{arg.vulnerabilities}</span>
                  </div>
                )}

                {/* 4. Confidential Strategy Notes (EXCLUDED FROM COURT DRAFT) */}
                <div className="p-4 bg-[#151515] text-[#D5D5D2] border border-[#2D2D2D]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 bg-[#F2D21A]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2D21A]">
                      Internal Counsel Strategy Note (Privileged / Excluded from Pleading & Exports)
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-mono text-[#EEEEEC]">
                    {arg.strategyNotes}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBackToEvents}
          className="px-5 py-2.5 bg-white border border-[#D5D5D2] hover:bg-[#F5F5F3] text-xs font-semibold text-[#151515] transition cursor-pointer"
        >
          ← Back to Event-Wise Facts (Stage B)
        </button>

        <button
          type="button"
          onClick={onProceedToAnnexures}
          className="px-6 py-2.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
        >
          <span>Proceed to Annexure Registry (Stage D)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
