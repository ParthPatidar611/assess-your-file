"use client";

import React, { useEffect, useState } from "react";

const STAGES = [
  { step: "01", title: "Reviewing matter details", desc: "Parsing stated chronology, facts, and legal domain context" },
  { step: "02", title: "Processing uploaded documents", desc: "Extracting in-memory text and validating supporting document contents" },
  { step: "03", title: "Identifying potential legal issues", desc: "Framing statutory issues and targeted precedent search vectors" },
  { step: "04", title: "Retrieving comparable judgments", desc: "Querying Supreme Court of India 2025 corpus & extracting judicial excerpts" },
  { step: "05", title: "Preparing the preliminary assessment", desc: "Synthesizing timeline, procedural duration, options, and filing assistance" },
];

export default function LoadingScreen() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-[#D5D5D2] p-8 sm:p-12 max-w-2xl mx-auto my-8">
      {/* Header */}
      <div className="border-b border-[#EEEEEC] pb-6 mb-8 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
          <span className="w-2.5 h-2.5 bg-[#F2D21A] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
            Automated Legal Intelligence Pipeline
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-[#151515] tracking-tight">
          Preparing Your Assessment
        </h2>

        <p className="text-xs sm:text-sm text-[#686868] mt-2 leading-relaxed">
          We are reviewing your matter, examining the available documents and retrieving potentially relevant judicial decisions.
        </p>
      </div>

      {/* Sequential Clean Progress List */}
      <div className="space-y-4">
        {STAGES.map((s, idx) => {
          const isDone = idx < activeStage;
          const isCurrent = idx === activeStage;

          return (
            <div
              key={s.step}
              className={`p-4 border transition-all ${
                isCurrent
                  ? "border-[#151515] bg-[#FAFAF8] shadow-xs"
                  : isDone
                  ? "border-[#EEEEEC] bg-white opacity-85"
                  : "border-[#EEEEEC] bg-white opacity-40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`text-xs font-mono font-bold mt-0.5 ${
                      isCurrent
                        ? "text-[#151515]"
                        : isDone
                        ? "text-emerald-700"
                        : "text-[#8E8E8A]"
                    }`}
                  >
                    {isDone ? "✓" : s.step}
                  </span>

                  <div>
                    <p
                      className={`text-sm font-semibold tracking-tight ${
                        isCurrent ? "text-[#151515]" : "text-[#444444]"
                      }`}
                    >
                      {s.title}
                    </p>
                    <p className="text-xs text-[#686868] mt-0.5 leading-normal">
                      {s.desc}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="shrink-0 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#F2D21A] text-[#151515]">
                    <span className="w-1.5 h-1.5 bg-[#151515] rounded-full animate-ping" />
                    In Progress
                  </span>
                )}
                {isDone && (
                  <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#EEEEEC] text-emerald-800">
                    Done
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Progress Bar */}
      <div className="mt-8 pt-6 border-t border-[#EEEEEC] flex items-center justify-between text-[11px] text-[#8E8E8A]">
        <span>Processing via 3-Level Fallback Engine</span>
        <span>Estimated duration: 5-15 seconds</span>
      </div>
    </div>
  );
}
