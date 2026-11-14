"use client";

import React, { useState } from "react";
import type { AssessmentResponse } from "./types";

interface ReportViewProps {
  result: AssessmentResponse;
  onReset: () => void;
  onPrint?: () => void;
}

export default function ReportView({ result, onReset, onPrint }: ReportViewProps) {
  const [expandedPrecedent, setExpandedPrecedent] = useState<string | null>(null);

  const {
    case: caseMeta,
    assessment,
    analysisMode,
    model,
    fallbackReason,
    retrievedPrecedents = [],
  } = result;

  const isDeterministic = analysisMode === "deterministic_fallback";
  const isFallbackAI = analysisMode === "ai_fallback";

  const timelineEvents = assessment.timeline || [];
  const outcome = assessment.outcomeAssessment;
  const duration = assessment.expectedDuration;
  const precautions = assessment.precautionsAndRecommendations;
  const legalOptions = assessment.legalOptions || [];
  const filing = assessment.filingAssistance;
  const precedentsAnalyzed = assessment.precedent_analysis || [];

  return (
    <div className="space-y-10 pb-16">
      {/* -------------------------------------------------------- */}
      {/* 0. REPORT TOP HEADER & ACTIONS                           */}
      {/* -------------------------------------------------------- */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EEEEEC] pb-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Confidential Legal Assessment Report
              </span>
            </div>
            <p className="text-xs text-[#8E8E8A]">
              Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · Supreme Court of India 2025 Benchmark
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onPrint || (() => window.print())}
              className="px-4 py-2 bg-white hover:bg-[#EEEEEC] text-[#151515] border border-[#151515] text-xs font-semibold uppercase tracking-wider transition"
            >
              Print / Export ⎙
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] border border-[#D5D5D2] text-xs font-bold uppercase tracking-wider transition"
            >
              New Assessment +
            </button>
          </div>
        </div>

        {/* Matter Title and Meta Badges */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-[#151515] text-white text-[11px] font-bold uppercase tracking-wider">
              {caseMeta.caseType || "General Legal Matter"}
            </span>

            {/* Architecture Engine Badge */}
            {analysisMode === "ai_primary" && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-medium">
                Primary Model · {model || "gemini-3.8-flash"}
              </span>
            )}
            {analysisMode === "ai_fallback" && (
              <span className="px-2.5 py-1 bg-[#FFF9E6] text-[#806600] border border-[#F2D21A] text-[11px] font-semibold">
                Secondary Model Active · {model || "gemini-3.5-flash-lite"}
              </span>
            )}
            {analysisMode === "deterministic_fallback" && (
              <span className="px-2.5 py-1 bg-[#F5F5F5] text-[#151515] border border-[#D5D5D2] text-[11px] font-semibold">
                Rules-Based Deterministic Engine
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#151515] tracking-tight leading-tight">
            {assessment.assessment_title || caseMeta.title}
          </h1>

          <div className="text-xs text-[#686868] flex flex-wrap items-center gap-4 pt-1">
            <span><strong>Jurisdiction:</strong> {caseMeta.jurisdiction || "India"}</span>
            {caseMeta.desiredOutcome && (
              <span><strong>Desired Outcome:</strong> {caseMeta.desiredOutcome}</span>
            )}
          </div>
        </div>
      </div>

      {/* Fallback Warning Notice */}
      {isDeterministic && (
        <div className="bg-[#FFF9E6] border-l-4 border-[#F2D21A] p-5 text-xs text-[#151515] space-y-1">
          <p className="font-bold text-sm">Deterministic Rules-Based Analysis Active</p>
          <p className="text-[#444444] leading-relaxed">
            {fallbackReason ||
              "External generative reasoning services were temporarily unavailable. This report was constructed using deterministic legal rule tables, statutory checklists, and keyword-screened Supreme Court 2025 precedents."}
          </p>
        </div>
      )}

      {isFallbackAI && fallbackReason && (
        <div className="bg-white border-l-4 border-[#F2D21A] border p-4 text-xs text-[#151515] flex items-center justify-between">
          <div>
            <span className="font-bold">Failover Notification: </span>
            <span className="text-[#686868]">{fallbackReason}</span>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* EXECUTIVE OVERVIEW                                       */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-4 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            Executive Overview
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Matter Synthesis & Case Understanding
          </h3>
        </div>

        <div className="text-sm sm:text-[15px] text-[#171717] leading-relaxed space-y-4">
          <p className="whitespace-pre-wrap">{assessment.executive_summary}</p>
        </div>

        {/* Identified Legal Issues */}
        {assessment.legal_issues && assessment.legal_issues.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#EEEEEC]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] mb-3">
              Core Legal Questions Raised:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assessment.legal_issues.map((issue, idx) => (
                <div key={idx} className="p-3.5 bg-[#FAFAF8] border border-[#EEEEEC] text-xs flex gap-3">
                  <span className="font-mono font-bold text-[#151515] shrink-0">0{idx + 1}.</span>
                  <span className="text-[#2B2B2B] leading-relaxed">{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 01 - CHRONOLOGY OF EVENTS                                */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
              01 - Chronology of Events
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
              Factual Timeline
            </h3>
          </div>
          <span className="text-xs text-[#8E8E8A]">
            {timelineEvents.length} Events Extracted
          </span>
        </div>

        {timelineEvents.length === 0 ? (
          <div className="p-5 bg-[#FAFAF8] border border-[#EEEEEC] text-xs text-[#686868] italic">
            No explicit calendar dates were detected in the submitted narrative. Providing exact dates strengthens limitation analyses.
          </div>
        ) : (
          <div className="relative border-l border-[#D5D5D2] ml-3 sm:ml-4 pl-6 sm:pl-8 space-y-6">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Node Indicator */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-2.5 h-2.5 bg-[#151515] group-hover:bg-[#F2D21A] transition border-2 border-white" />

                <div className="p-4 bg-[#FAFAF8] border border-[#EEEEEC] hover:border-[#D5D5D2] transition">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-[#151515] font-mono">
                      {evt.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 border ${
                          evt.dateType === "confirmed"
                            ? "bg-white text-emerald-800 border-emerald-300"
                            : "bg-white text-amber-800 border-amber-300"
                        }`}
                      >
                        {evt.dateType || (evt.isConfirmed ? "Confirmed" : "Approximate")}
                      </span>
                      {evt.source && (
                        <span className="text-[10px] text-[#8E8E8A]">
                          Source: {evt.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 02 & 03 - FACTORS SUPPORTING & OPPOSING THE CASE         */}
      {/* -------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Supporting Factors */}
        <section className="bg-white border border-[#D5D5D2] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#EEEEEC] pb-4 mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                02 - Case Strengths
              </h2>
              <h3 className="text-lg sm:text-xl font-bold text-[#151515] tracking-tight mt-1">
                Factors Supporting Your Position
              </h3>
            </div>

            <div className="space-y-4">
              {assessment.strengths.map((str, idx) => (
                <div key={idx} className="p-4 bg-[#FAFAF8] border border-[#EEEEEC] text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#151515]">
                    <span className="text-emerald-700">✓</span>
                    <span>{str.factor}</span>
                  </div>
                  <p className="text-[#444444] leading-relaxed">{str.explanation}</p>
                  {str.factual_basis && (
                    <div className="pt-2 border-t border-[#EEEEEC] text-[11px] text-[#686868]">
                      <strong>Factual Basis:</strong> {str.factual_basis}
                    </div>
                  )}
                  {str.available_evidence && (
                    <div className="text-[11px] text-emerald-800">
                      <strong>Supporting Evidence:</strong> {str.available_evidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Opposing Factors & Vulnerabilities */}
        <section className="bg-white border border-[#D5D5D2] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#EEEEEC] pb-4 mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                03 - Case Vulnerabilities
              </h2>
              <h3 className="text-lg sm:text-xl font-bold text-[#151515] tracking-tight mt-1">
                Factors Opposing Your Position
              </h3>
            </div>

            <div className="space-y-4">
              {assessment.weaknesses.map((w, idx) => (
                <div key={idx} className="p-4 bg-[#FAFAF8] border border-[#EEEEEC] text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#151515]">
                    <span className="text-amber-700">!</span>
                    <span>{w.factor}</span>
                  </div>
                  <p className="text-[#444444] leading-relaxed">{w.explanation}</p>
                  {w.factual_basis && (
                    <div className="pt-2 border-t border-[#EEEEEC] text-[11px] text-[#686868]">
                      <strong>Basis:</strong> {w.factual_basis}
                    </div>
                  )}
                  {w.opposing_argument && (
                    <div className="text-[11px] text-[#9E3B1B]">
                      <strong>Anticipated Counter-Argument:</strong> {w.opposing_argument}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* -------------------------------------------------------- */}
      {/* 04 - COMPARABLE JUDICIAL DECISIONS                       */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
                04 - Comparable Judicial Decisions
              </h2>
              <span className="px-2 py-0.5 bg-[#EEEEEC] text-[10px] font-bold text-[#151515]">
                SC 2025 Corpus
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
              Source-Matched Supreme Court Judgments
            </h3>
          </div>
          <span className="text-xs text-[#8E8E8A]">
            {retrievedPrecedents.length} Comparable Decisions Retrieved
          </span>
        </div>

        <div className="mb-6 p-3.5 bg-[#FAFAF8] border border-[#EEEEEC] text-xs text-[#686868] flex items-center justify-between">
          <span>
            These judicial rulings were retrieved from the 2025 Supreme Court repository and compared against your stated facts.
          </span>
          <span className="text-[11px] font-semibold text-[#151515] shrink-0 ml-4">
            Legal Review Status: Pending Counsel
          </span>
        </div>

        {retrievedPrecedents.length === 0 ? (
          <div className="p-6 bg-[#FAFAF8] border border-[#EEEEEC] text-xs text-[#686868] text-center">
            No direct precedent matches met the threshold in the local database. Broaden facts or check the legal options below.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table of Precedents */}
            <div className="border border-[#D5D5D2] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#151515] text-white uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-bold">Case Citation</th>
                    <th className="py-3 px-4 font-bold">Parties</th>
                    <th className="py-3 px-4 font-bold">Decision Date</th>
                    <th className="py-3 px-4 font-bold">Domain</th>
                    <th className="py-3 px-4 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEC] bg-white">
                  {retrievedPrecedents.map((p) => {
                    const isExpanded = expandedPrecedent === p.case_id;
                    const analysis = precedentsAnalyzed.find((pa) => pa.case_id === p.case_id);

                    return (
                      <React.Fragment key={p.case_id}>
                        <tr className="hover:bg-[#FAFAF8] transition">
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#151515] whitespace-nowrap">
                            {p.citation || p.case_id}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#171717] max-w-xs truncate">
                            {p.case_name}
                          </td>
                          <td className="py-3.5 px-4 text-[#686868] whitespace-nowrap">
                            {p.judgment_date || "2025"}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-[#EEEEEC] text-[10px] font-semibold text-[#151515]">
                              {p.domain}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() =>
                                setExpandedPrecedent(isExpanded ? null : p.case_id)
                              }
                              className="px-2.5 py-1 text-[11px] font-bold text-[#151515] bg-[#EEEEEC] hover:bg-[#F2D21A] transition"
                            >
                              {isExpanded ? "Collapse ▲" : "Compare ▼"}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Comparative Breakdown */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-[#FBFBFA] p-6 border-b border-[#D5D5D2]">
                              <div className="max-w-4xl space-y-4 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEEEEC] pb-3">
                                  <h4 className="font-bold text-sm text-[#151515]">
                                    {p.case_name}
                                  </h4>
                                  {p.source_url && (
                                    <a
                                      href={p.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#151515] underline font-semibold hover:text-black"
                                    >
                                      View Official SCR Judgment PDF ↗
                                    </a>
                                  )}
                                </div>

                                {p.matched_excerpt && (
                                  <div className="p-3 bg-white border border-[#EEEEEC]">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E8A] mb-1">
                                      Judicial Headnote / Excerpt:
                                    </p>
                                    <p className="italic text-[#444444] leading-relaxed">
                                      "{p.matched_excerpt}"
                                    </p>
                                  </div>
                                )}

                                {analysis && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    <div className="p-3 bg-white border border-[#EEEEEC]">
                                      <p className="font-bold text-[11px] text-emerald-800 mb-1">
                                        Factual Similarities:
                                      </p>
                                      <p className="text-[#444444] leading-relaxed">
                                        {analysis.similarities || "General subject matter alignment."}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-white border border-[#EEEEEC]">
                                      <p className="font-bold text-[11px] text-amber-800 mb-1">
                                        Key Distinctions:
                                      </p>
                                      <p className="text-[#444444] leading-relaxed">
                                        {analysis.differences || "Procedural stage or contractual terms differ."}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-white border border-[#EEEEEC]">
                                      <p className="font-bold text-[11px] text-[#151515] mb-1">
                                        Core Legal Principle:
                                      </p>
                                      <p className="text-[#444444] leading-relaxed">
                                        {analysis.legal_principle || "Interference restricted by statute."}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 05 - INDICATIVE OUTCOME ASSESSMENT                       */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            05 - Indicative Outcome Assessment
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Predictive Outlook & Risk Factor Evaluation
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Qualitative Status Card */}
          <div className="md:col-span-5 p-6 bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868] mb-2">
              Preliminary Qualitative Classification
            </p>
            <div className="text-lg font-bold text-[#151515] mb-3">
              {outcome?.qualitativeAssessment || "Mixed or uncertain"}
            </div>

            <div className="p-3 bg-white border border-[#D5D5D2] text-xs text-[#444444] leading-relaxed">
              <span className="font-bold text-[#151515] block mb-1">
                Ethical Standard on Quantitative Probability:
              </span>
              {outcome?.statusText ||
                "Insufficient validated historical data for a reliable probability estimate."}
            </div>
          </div>

          {/* Risk Factors Table */}
          <div className="md:col-span-7">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] mb-3">
              Evaluated Case Risk Factors:
            </h4>
            {outcome?.riskFactors && outcome.riskFactors.length > 0 ? (
              <div className="border border-[#D5D5D2]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#151515] text-white uppercase text-[10px]">
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3">Risk Factor</th>
                      <th className="py-2.5 px-3 text-right">Impact Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEC]">
                    {outcome.riskFactors.map((rf, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="py-2.5 px-3 font-semibold text-[#151515]">{rf.category}</td>
                        <td className="py-2.5 px-3 text-[#444444]">{rf.factor}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{rf.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#686868] italic p-4 bg-[#FAFAF8] border border-[#EEEEEC]">
                Risk factor analysis requires additional evidentiary documentation to classify severity.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 06 - EXPECTED CASE DURATION                              */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            06 - Expected Case Duration
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Procedural Stages & Institutional Progression
          </h3>
        </div>

        <p className="text-xs text-[#686868] mb-5 leading-relaxed">
          {duration?.explanation ||
            "Litigation timelines in Indian courts depend heavily on jurisdiction, judicial vacancies, and interim applications. Typical progression entails the following sequential stages:"}
        </p>

        {duration?.proceduralStages && duration.proceduralStages.length > 0 && (
          <div className="border border-[#D5D5D2] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#151515] text-white uppercase text-[10px]">
                  <th className="py-3 px-4 font-bold">Stage Number</th>
                  <th className="py-3 px-4 font-bold">Procedural Phase</th>
                  <th className="py-3 px-4 font-bold">Stage Description</th>
                  <th className="py-3 px-4 font-bold">Typical Counsel Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEC] bg-white">
                {duration.proceduralStages.map((st, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAF8] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#151515]">Phase 0{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">{st.stageName}</td>
                    <td className="py-3 px-4 text-[#444444] leading-relaxed max-w-sm">{st.description}</td>
                    <td className="py-3 px-4 text-[#686868] leading-relaxed">{st.typicalActivities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 07 - PRECAUTIONS & RECOMMENDATIONS                       */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            07 - Strategic Precautions & Recommendations
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Pre-Litigation Safeguards & Checklist
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Documents to Preserve */}
          <div className="p-5 bg-[#FAFAF8] border border-[#EEEEEC] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F2D21A]" /> Documents to Preserve Immediately
            </h4>
            <ul className="space-y-1.5 text-xs text-[#444444]">
              {(precautions?.documentsToPreserve || []).map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-[#151515]">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Dates & Limitation */}
          <div className="p-5 bg-[#FAFAF8] border border-[#EEEEEC] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F2D21A]" /> Limitation & Deadlines
            </h4>
            <ul className="space-y-1.5 text-xs text-[#444444]">
              {(precautions?.importantDatesAndLimitation || []).map((d, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-red-700">!</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Questions for Advocate */}
          <div className="p-5 bg-[#FAFAF8] border border-[#EEEEEC] space-y-3 md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F2D21A]" /> Questions to Clarify with Retained Counsel
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#444444]">
              {(precautions?.questionsForAdvocate || []).map((q, idx) => (
                <div key={idx} className="p-3 bg-white border border-[#EEEEEC]">
                  <strong>Q{idx + 1}:</strong> {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- */}
      {/* 08 - AVAILABLE LEGAL OPTIONS                             */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
        <div className="border-b border-[#EEEEEC] pb-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
            08 - Available Legal Options
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
            Comparative Matrix of Remedies
          </h3>
        </div>

        {legalOptions.length === 0 ? (
          <p className="text-xs text-[#686868] italic p-4 bg-[#FAFAF8] border border-[#EEEEEC]">
            Consult retained counsel to delineate specific statutory petitions suitable for this jurisdiction.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="border border-[#D5D5D2] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#151515] text-white uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-bold">Legal Option</th>
                    <th className="py-3 px-4 font-bold">Procedural Prerequisites</th>
                    <th className="py-3 px-4 font-bold">Potential Advantages</th>
                    <th className="py-3 px-4 font-bold">Risks & Disadvantages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEC] bg-white">
                  {legalOptions.map((opt, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAF8] transition">
                      <td className="py-3 px-4 font-bold text-[#151515] max-w-[200px]">
                        {opt.optionName}
                        <p className="font-normal text-[11px] text-[#686868] mt-1">{opt.relevanceContext}</p>
                      </td>
                      <td className="py-3 px-4 text-[#444444] text-[11px]">
                        <ul className="list-disc pl-3 space-y-1">
                          {(opt.prerequisites || []).map((pr, i) => (
                            <li key={i}>{pr}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-4 text-emerald-800 text-[11px]">
                        <ul className="list-disc pl-3 space-y-1">
                          {(opt.advantages || []).map((ad, i) => (
                            <li key={i}>{ad}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-4 text-[#9E3B1B] text-[11px]">
                        <ul className="list-disc pl-3 space-y-1">
                          {(opt.disadvantages || []).map((dis, i) => (
                            <li key={i}>{dis}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- */}
      {/* 09 - FILING PREPARATION ASSISTANCE                       */}
      {/* -------------------------------------------------------- */}
      {filing && (
        <section className="bg-white border border-[#D5D5D2] p-6 sm:p-10">
          <div className="border-b border-[#EEEEEC] pb-4 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#686868]">
              09 - Filing Preparation Assistance
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-[#151515] tracking-tight mt-1">
              Petition Outline & Document Index
            </h3>
          </div>

          <div className="space-y-6 text-xs">
            {filing.preliminaryDraftStructure && (
              <div className="p-6 bg-[#FAFAF8] border border-[#D5D5D2] space-y-4 font-mono">
                <div className="p-2.5 bg-[#FFF9E6] border-l-4 border-[#F2D21A] text-[11px] font-sans text-[#151515]">
                  {filing.preliminaryDraftStructure.placeholdersNotice}
                </div>

                <div className="text-center font-bold text-sm text-[#151515] uppercase tracking-wide border-b border-[#EEEEEC] pb-3">
                  {filing.preliminaryDraftStructure.jurisdictionHeading}
                </div>

                <div className="text-center font-semibold text-xs text-[#444444]">
                  {filing.preliminaryDraftStructure.partiesBlock}
                </div>

                <div className="font-bold text-[#151515] text-center uppercase tracking-wider py-1 bg-white border border-[#EEEEEC]">
                  {filing.preliminaryDraftStructure.documentType}
                </div>

                <p className="text-[#333333] leading-relaxed">
                  {filing.preliminaryDraftStructure.preliminaryStatement}
                </p>

                {filing.preliminaryDraftStructure.factualGroundsDraft && (
                  <div>
                    <p className="font-bold text-[#151515] mb-2">FACTUAL GROUNDS:</p>
                    <ol className="list-decimal pl-5 space-y-2 text-[#444444]">
                      {filing.preliminaryDraftStructure.factualGroundsDraft.map((gr, i) => (
                        <li key={i}>{gr}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {filing.preliminaryDraftStructure.prayerDraft && (
                  <div className="pt-2 border-t border-[#EEEEEC]">
                    <p className="font-bold text-[#151515] mb-1">PRAYER:</p>
                    <p className="italic text-[#444444] leading-relaxed">
                      {filing.preliminaryDraftStructure.prayerDraft}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- */}
      {/* 10 - LIMITATIONS & DISCLAIMER                            */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border border-[#D5D5D2] p-6 sm:p-8 text-xs text-[#686868] leading-relaxed space-y-3">
        <h3 className="font-bold text-sm text-[#151515] uppercase tracking-wider">
          Legal Disclaimer & Professional Boundaries
        </h3>
        <p>
          {result.disclaimer ||
            "This document is an AI-assisted research and triage assessment, not legal advice. The database contains a curated collection of Supreme Court of India judgments. Source matching does not establish legal precedent or binding authority for your matter. Consult a licensed advocate before taking any procedural or legal action."}
        </p>
      </section>
    </div>
  );
}
