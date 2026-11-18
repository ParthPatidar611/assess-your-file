"use client";

import React from "react";

export type WorkspaceStage =
  | "overview"
  | "events"
  | "counterparty"
  | "annexures"
  | "preview"
  | "export";

interface WorkspaceNavProps {
  currentStage: WorkspaceStage;
  onSelectStage: (stage: WorkspaceStage) => void;
  eventCount: number;
  argumentCount: number;
  annexureCount: number;
  validationIssuesCount: number;
}

const STAGES: Array<{ id: WorkspaceStage; code: string; label: string; sub: string }> = [
  { id: "overview", code: "A", label: "Forum & Parties", sub: "Jurisdiction & Parties" },
  { id: "events", code: "B", label: "Event Timeline", sub: "Central Factual Workspace" },
  { id: "counterparty", code: "C", label: "Counterparty Intel", sub: "Anticipated Defenses" },
  { id: "annexures", code: "D", label: "Annexure Registry", sub: "Sequential Index" },
  { id: "preview", code: "E", label: "Petition Draft", sub: "Evidence-Linked" },
  { id: "export", code: "F", label: "Review & Export", sub: "DOCX & Print/PDF" },
];

export default function WorkspaceNav({
  currentStage,
  onSelectStage,
  eventCount,
  argumentCount,
  annexureCount,
  validationIssuesCount,
}: WorkspaceNavProps) {
  return (
    <div className="bg-[#151515] text-white border-b border-[#2D2D2D] sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 border-b border-[#2D2D2D]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Petition Drafting Studio · Indian Pleading Builder
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#A0A09C]">
            <span>Events: <strong className="text-white">{eventCount}</strong></span>
            <span>Annexures: <strong className="text-white">{annexureCount}</strong></span>
            <span>Arguments: <strong className="text-white">{argumentCount}</strong></span>
            {validationIssuesCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700 font-semibold">
                {validationIssuesCount} items to verify
              </span>
            )}
          </div>
        </div>

        {/* Horizontal Enterprise Stage Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0">
          {STAGES.map((s) => {
            const isActive = currentStage === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectStage(s.id)}
                className={`text-left px-3 py-3 border-b-2 transition-all cursor-pointer relative ${
                  isActive
                    ? "border-[#F2D21A] bg-[#222222]"
                    : "border-transparent hover:bg-[#1E1E1E] text-[#8E8E8A]"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                      isActive
                        ? "bg-[#F2D21A] text-[#151515] border-[#F2D21A]"
                        : "bg-transparent text-[#686868] border-[#444444]"
                    }`}
                  >
                    Stage {s.code}
                  </span>
                  <span className={`text-xs font-bold ${isActive ? "text-white" : "text-[#D5D5D2]"}`}>
                    {s.label}
                  </span>
                </div>
                <p className="text-[10px] text-[#686868] truncate pl-0.5">{s.sub}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
