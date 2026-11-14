"use client";

import React from "react";
import type { AssessmentResponse } from "./types";

interface HistoryTabProps {
  history: Array<{ timestamp: string; data: AssessmentResponse }>;
  onSelectHistoryItem: (item: AssessmentResponse) => void;
  onClearHistory: () => void;
  onNewAssessment: () => void;
}

export default function HistoryTab({
  history,
  onSelectHistoryItem,
  onClearHistory,
  onNewAssessment,
}: HistoryTabProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="bg-white border border-[#D5D5D2] p-8 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Session Records
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#151515] tracking-tight">
              My Assessments
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 text-xs text-[#8E8E8A] hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
              >
                Clear History
              </button>
            )}
            <button
              onClick={onNewAssessment}
              className="px-4 py-2 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] text-xs font-bold uppercase tracking-wider transition border border-[#D5D5D2]"
            >
              New Assessment +
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-10 text-center bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-sm font-semibold text-[#151515] mb-1">
              No previous assessments recorded in this session.
            </p>
            <p className="text-xs text-[#686868] max-w-sm mx-auto mb-6">
              When you submit a matter for evaluation, the completed report will be archived here for reference during your session.
            </p>
            <button
              onClick={onNewAssessment}
              className="px-6 py-2.5 bg-[#151515] hover:bg-[#333] text-white text-xs font-semibold uppercase tracking-wider transition"
            >
              Start Your First Assessment →
            </button>
          </div>
        ) : (
          <div className="border border-[#D5D5D2] divide-y divide-[#EEEEEC]">
            {history.map((h, idx) => (
              <div
                key={idx}
                className="p-5 bg-white hover:bg-[#FAFAF8] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#EEEEEC] text-[#151515]">
                      {h.data.case.caseType || "Legal Assessment"}
                    </span>
                    <span className="text-[11px] text-[#8E8E8A]">
                      {new Date(h.timestamp).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#151515] truncate">
                    {h.data.assessment?.assessment_title || h.data.case.title}
                  </h3>

                  <p className="text-xs text-[#686868] line-clamp-1 max-w-xl">
                    {h.data.assessment?.executive_summary}
                  </p>
                </div>

                <button
                  onClick={() => onSelectHistoryItem(h.data)}
                  className="px-4 py-2 bg-white hover:bg-[#151515] hover:text-white text-[#151515] border border-[#151515] text-xs font-semibold whitespace-nowrap transition self-start sm:self-auto"
                >
                  View Report →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
