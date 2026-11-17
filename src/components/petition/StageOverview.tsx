"use client";

import React from "react";
import type { ForumCategory } from "@/components/types";
import { FORUM_TEMPLATES } from "@/lib/petitionEngine";

interface StageOverviewProps {
  forumCategory: ForumCategory;
  setForumCategory: (cat: ForumCategory) => void;
  courtHeading: string;
  setCourtHeading: (val: string) => void;
  petitionerName: string;
  setPetitionerName: (val: string) => void;
  petitionerAddress: string;
  setPetitionerAddress: (val: string) => void;
  respondentName: string;
  setRespondentName: (val: string) => void;
  respondentAddress: string;
  setRespondentAddress: (val: string) => void;
  matterTitle: string;
  onProceedToEvents: () => void;
}

const FORUM_OPTIONS: Array<{ category: ForumCategory; title: string; act: string }> = [
  { category: "COMMERCIAL_COURT", title: "Commercial Court", act: "Commercial Courts Act, 2015 (Sec 6)" },
  { category: "CONSUMER_COMMISSION", title: "Consumer Disputes Commission", act: "Consumer Protection Act, 2019 (Sec 35)" },
  { category: "CIVIL_COURT", title: "Civil Court (Senior Division)", act: "Code of Civil Procedure, 1908 (Order VII)" },
  { category: "ARBITRAL_TRIBUNAL", title: "Arbitral Tribunal", act: "Arbitration & Conciliation Act, 1996 (Sec 23)" },
  { category: "NCLT", title: "National Company Law Tribunal", act: "Insolvency and Bankruptcy Code, 2016 (Sec 9)" },
  { category: "HIGH_COURT", title: "High Court", act: "Original Civil Jurisdiction" },
  { category: "CUSTOM_FORUM", title: "Custom / Other Forum", act: "Competent Court / Tribunal" },
];

export default function StageOverview({
  forumCategory,
  setForumCategory,
  courtHeading,
  setCourtHeading,
  petitionerName,
  setPetitionerName,
  petitionerAddress,
  setPetitionerAddress,
  respondentName,
  setRespondentName,
  respondentAddress,
  setRespondentAddress,
  matterTitle,
  onProceedToEvents,
}: StageOverviewProps) {
  const currentTemplate = FORUM_TEMPLATES[forumCategory] || FORUM_TEMPLATES.COMMERCIAL_COURT;

  const handleForumChange = (cat: ForumCategory) => {
    setForumCategory(cat);
    const tmpl = FORUM_TEMPLATES[cat];
    if (tmpl) {
      setCourtHeading(tmpl.courtHeading);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
            Stage A · Forum Selection & Parties Setup
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#151515]">
          Matter Jurisdiction & Memo of Parties
        </h2>
        <p className="text-xs text-[#686868] mt-1 max-w-3xl">
          Configure the judicial forum and party designations according to the nature of the dispute.
          The petition structure, governing procedural law, and verification format will dynamically adapt to this selection.
        </p>
      </div>

      {/* 1. Forum Selection Grid */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#151515]">
          Select Applicable Forum / Tribunal:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FORUM_OPTIONS.map((opt) => {
            const isSelected = forumCategory === opt.category;
            return (
              <button
                key={opt.category}
                type="button"
                onClick={() => handleForumChange(opt.category)}
                className={`p-4 text-left border transition cursor-pointer ${
                  isSelected
                    ? "border-[#151515] bg-[#F5F5F3] shadow-xs"
                    : "border-[#EEEEEC] hover:border-[#D5D5D2] bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#151515]">{opt.title}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#F2D21A]" />
                  )}
                </div>
                <p className="text-[11px] text-[#686868]">{opt.act}</p>
              </button>
            );
          })}
        </div>

        {/* Forum Jurisdiction Note */}
        <div className="p-3 bg-[#FFFDF5] border border-[#F2D21A] text-xs text-[#151515] mt-3">
          <span className="font-bold text-[#806600]">Procedural Note: </span>
          <span>{currentTemplate.pecuniaryThresholdNote}</span>
        </div>
      </div>

      {/* 2. Court Heading Editor */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[#151515]">
            Court / Forum Heading (Top of Pleading):
          </label>
          <button
            type="button"
            onClick={() => setCourtHeading(currentTemplate.courtHeading)}
            className="text-[11px] text-[#686868] hover:text-[#151515] underline cursor-pointer"
          >
            Reset to Standard Format
          </button>
        </div>
        <input
          type="text"
          value={courtHeading}
          onChange={(e) => setCourtHeading(e.target.value)}
          className="w-full px-3 py-2.5 text-xs font-mono bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
          placeholder="e.g. IN THE COURT OF THE DISTRICT JUDGE (COMMERCIAL COURT) AT LUDHIANA, PUNJAB"
        />
        <p className="text-[11px] text-[#8E8E8A]">
          Specify the exact court designation and city/district where the pleading will be submitted.
        </p>
      </div>

      {/* 3. Parties Block Editor */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515] border-b border-[#EEEEEC] pb-3">
          Parties Block & Address Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Petitioner / Complainant */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#151515] text-white text-[10px] font-bold uppercase">
                Applicant / Plaintiff
              </span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#686868] mb-1">
                Full Legal Name / Entity:
              </label>
              <input
                type="text"
                value={petitionerName}
                onChange={(e) => setPetitionerName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                placeholder="e.g. M/s ColdChain Logistics Pvt. Ltd."
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#686868] mb-1">
                Registered Address / Place of Business:
              </label>
              <textarea
                value={petitionerAddress}
                onChange={(e) => setPetitionerAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                placeholder="e.g. Plot No. 44, Focal Point Phase-V, Ludhiana, Punjab"
              />
            </div>
          </div>

          {/* Respondent / Defendant */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#686868] text-white text-[10px] font-bold uppercase">
                Opposing Party / Defendant
              </span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#686868] mb-1">
                Full Legal Name / Entity:
              </label>
              <input
                type="text"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                placeholder="e.g. FrostEquip Commercial Appliances Ltd."
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#686868] mb-1">
                Registered Address / Last Known Office:
              </label>
              <textarea
                value={respondentAddress}
                onChange={(e) => setRespondentAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                placeholder="e.g. B-12 Industrial Area, Phase-I, Okhla, New Delhi 110020"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-[#8E8E8A]">
          Matter Title: <strong>{matterTitle}</strong>
        </span>
        <button
          type="button"
          onClick={onProceedToEvents}
          className="px-6 py-2.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
        >
          <span>Proceed to Event-Wise Facts (Stage B)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
