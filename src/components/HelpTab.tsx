"use client";

import React, { useState } from "react";
import UserManualViewer from "./UserManualViewer";

export default function HelpTab() {
  const [activeView, setActiveView] = useState<"guidelines" | "manual">("manual");

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top View Selector */}
      <div className="flex items-center gap-3 border-b border-[#D5D5D2] pb-4">
        <button
          type="button"
          onClick={() => setActiveView("manual")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
            activeView === "manual"
              ? "bg-[#151515] text-[#F2D21A] border-[#151515]"
              : "bg-white text-[#686868] border-[#D5D5D2] hover:text-[#151515]"
          }`}
        >
          Operational User Manual (9 Steps) 📖
        </button>

        <button
          type="button"
          onClick={() => setActiveView("guidelines")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
            activeView === "guidelines"
              ? "bg-[#151515] text-[#F2D21A] border-[#151515]"
              : "bg-white text-[#686868] border-[#D5D5D2] hover:text-[#151515]"
          }`}
        >
          Architecture & Regulatory Guidelines 🏛
        </button>
      </div>

      {activeView === "manual" && <UserManualViewer />}

      {activeView === "guidelines" && (
        <div className="bg-white border border-[#D5D5D2] p-8 sm:p-10">
          <div className="border-b border-[#EEEEEC] pb-4 mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Documentation & Guidelines
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#151515] tracking-tight">
              How Assess Your File Works
            </h2>
            <p className="text-xs sm:text-sm text-[#686868] mt-1">
              Enterprise legal intelligence architecture, data sources, and analytical principles.
            </p>
          </div>

          <div className="space-y-8 text-xs sm:text-sm text-[#333333] leading-relaxed">
            {/* Section 1 */}
            <div className="border-b border-[#EEEEEC] pb-6">
              <h3 className="font-bold text-base text-[#151515] mb-2 flex items-center gap-2">
                <span className="font-mono text-[#F2D21A] bg-[#151515] px-1.5 py-0.5 text-xs">01</span>
                Three-Level Fallback Architecture
              </h3>
              <p className="mb-3">
                Assess Your File is engineered for maximum uptime and consistency through a 3-tier analysis hierarchy:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#555555]">
                <li>
                  <strong>Level 1 - Primary AI Model (Gemini 3.8 Flash):</strong> Analyzes narrative facts, parses supporting documents, formulates legal queries, and compares factual patterns against retrieved Supreme Court decisions.
                </li>
                <li>
                  <strong>Level 2 - Secondary Fallback Model (Gemini 3.5 Flash Lite):</strong> Engaged automatically within milliseconds if the primary model is throttled or experiencing high traffic spikes.
                </li>
                <li>
                  <strong>Level 3 - Deterministic Rules Engine:</strong> A fully local, offline rule engine that executes statutory issue checklists, procedural durations, and keyword precedent searches without external LLM dependencies.
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="border-b border-[#EEEEEC] pb-6">
              <h3 className="font-bold text-base text-[#151515] mb-2 flex items-center gap-2">
                <span className="font-mono text-[#F2D21A] bg-[#151515] px-1.5 py-0.5 text-xs">02</span>
                Supreme Court of India (2025) Precedent Database
              </h3>
              <p className="mb-2">
                Our precedent engine searches real Supreme Court judgments delivered in 2025 across core practice domains:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#444444] mb-3">
                <div className="p-2.5 bg-[#FAFAF8] border border-[#EEEEEC]">1. Commercial & Contractual Disputes</div>
                <div className="p-2.5 bg-[#FAFAF8] border border-[#EEEEEC]">2. Arbitration & Award Challenges (Section 34/37)</div>
                <div className="p-2.5 bg-[#FAFAF8] border border-[#EEEEEC]">3. Corporate Insolvency (IBC 2016)</div>
                <div className="p-2.5 bg-[#FAFAF8] border border-[#EEEEEC]">4. Consumer Protection Litigation</div>
                <div className="p-2.5 bg-[#FAFAF8] border border-[#EEEEEC]">5. Property & Title Disputes</div>
                <div className="p-2.5 bg-[#FAFAF8] border border-[#EEEEEC]">6. Employment & Labour Enactments</div>
              </div>
              <p className="text-[11px] text-[#777770]">
                Every citation is verified against authentic official Supreme Court Reports (SCR). We never fabricate cases or citations.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h3 className="font-bold text-base text-[#151515] mb-2 flex items-center gap-2">
                <span className="font-mono text-[#F2D21A] bg-[#151515] px-1.5 py-0.5 text-xs">03</span>
                Ethical Standards & Regulatory Compliance
              </h3>
              <p className="mb-2">
                Assess Your File enforces strict ethical safeguards aligned with Bar Council of India professional standards:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#555555]">
                <li>
                  <strong>No Fabricated Win Percentages:</strong> We explicitly prohibit displaying numerical win odds or arbitrary statistical meters. Qualitative indicators (e.g. <em>Relatively favourable</em>, <em>Mixed or uncertain</em>) are provided with supporting risk factors.
                </li>
                <li>
                  <strong>Preliminary Draft Notice:</strong> All draft petition structures generated by the system are marked as preliminary reference materials requiring independent scrutiny and verification by an enrolled advocate.
                </li>
                <li>
                  <strong>Client Confidentiality & Privacy:</strong> No legal drafts or strategy notes are exposed through public anonymous database policies. All workspace drafts are securely isolated to the client session.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
