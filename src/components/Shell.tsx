"use client";

import React, { useState } from "react";

interface ShellProps {
  currentTab: "intake" | "history" | "help";
  onTabChange: (tab: "intake" | "history" | "help") => void;
  children: React.ReactNode;
  breadcrumbs?: string;
  onPrint?: () => void;
  isReportView?: boolean;
}

export default function Shell({
  currentTab,
  onTabChange,
  children,
  breadcrumbs = "Matter Assessment / New Intake",
  onPrint,
  isReportView = false,
}: ShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#171717] flex flex-col md:flex-row antialiased">
      {/* ---------------------------------------------------- */}
      {/* DESKTOP SIDEBAR: Fixed Dark Charcoal (#151515)       */}
      {/* ---------------------------------------------------- */}
      <aside className="hidden md:flex flex-col w-[210px] bg-[#151515] text-[#EEEEEC] border-r border-[#262626] shrink-0 fixed top-0 bottom-0 left-0 z-30 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#242424]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#F2D21A] shrink-0" />
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-tight text-white block uppercase">
                Assess Your File
              </span>
              <span className="text-[10px] text-[#8E8E8A] tracking-wider uppercase block">
                Legal Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 flex flex-col gap-0.5">
          <button
            onClick={() => onTabChange("intake")}
            className={`w-full text-left px-5 py-3 text-xs tracking-wide transition flex items-center gap-3 relative ${
              currentTab === "intake"
                ? "text-white font-semibold bg-[#1D1D1D]"
                : "text-[#8E8E8A] hover:text-[#EEEEEC] hover:bg-[#1A1A1A]"
            }`}
          >
            {currentTab === "intake" && (
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#F2D21A]" />
            )}
            <span className="text-sm">§</span>
            <span>New Assessment</span>
          </button>

          <button
            onClick={() => onTabChange("history")}
            className={`w-full text-left px-5 py-3 text-xs tracking-wide transition flex items-center gap-3 relative ${
              currentTab === "history"
                ? "text-white font-semibold bg-[#1D1D1D]"
                : "text-[#8E8E8A] hover:text-[#EEEEEC] hover:bg-[#1A1A1A]"
            }`}
          >
            {currentTab === "history" && (
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#F2D21A]" />
            )}
            <span className="text-sm">▦</span>
            <span>My Assessments</span>
          </button>

          <button
            onClick={() => onTabChange("help")}
            className={`w-full text-left px-5 py-3 text-xs tracking-wide transition flex items-center gap-3 relative ${
              currentTab === "help"
                ? "text-white font-semibold bg-[#1D1D1D]"
                : "text-[#8E8E8A] hover:text-[#EEEEEC] hover:bg-[#1A1A1A]"
            }`}
          >
            {currentTab === "help" && (
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#F2D21A]" />
            )}
            <span className="text-sm">?</span>
            <span>Help & Guidelines</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-[#242424] text-[11px] leading-relaxed text-[#757570]">
          <p className="font-semibold text-[#EEEEEC] text-[12px] mb-0.5">
            Assess Your File
          </p>
          <p className="text-[10px] text-[#6E6E69] leading-tight mb-2">
            Preliminary Legal Assessment Platform
          </p>
          <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[9px] text-[#555550]">
            <span>SC Judgments 2025</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* MOBILE HEADER & DRAWER                               */}
      {/* ---------------------------------------------------- */}
      <header className="md:hidden bg-[#151515] text-white px-5 py-3.5 border-b border-[#262626] flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
          <span className="font-bold text-sm tracking-tight uppercase">Assess Your File</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-xs text-[#EEEEEC] border border-[#333] px-2.5 py-1"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? "Close ✕" : "Menu ☰"}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1D1D1D] text-white border-b border-[#333] px-5 py-3 flex flex-col gap-2 z-30">
          <button
            onClick={() => {
              onTabChange("intake");
              setMobileMenuOpen(false);
            }}
            className={`text-left py-2 text-xs flex items-center gap-2 ${
              currentTab === "intake" ? "text-[#F2D21A] font-semibold" : "text-[#AAAAAA]"
            }`}
          >
            <span>§</span> New Assessment
          </button>
          <button
            onClick={() => {
              onTabChange("history");
              setMobileMenuOpen(false);
            }}
            className={`text-left py-2 text-xs flex items-center gap-2 ${
              currentTab === "history" ? "text-[#F2D21A] font-semibold" : "text-[#AAAAAA]"
            }`}
          >
            <span>▦</span> My Assessments
          </button>
          <button
            onClick={() => {
              onTabChange("help");
              setMobileMenuOpen(false);
            }}
            className={`text-left py-2 text-xs flex items-center gap-2 ${
              currentTab === "help" ? "text-[#F2D21A] font-semibold" : "text-[#AAAAAA]"
            }`}
          >
            <span>?</span> Help & Guidelines
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTAINER: Offset by desktop sidebar width      */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 md:pl-[210px] flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#D5D5D2] px-6 py-3.5 flex items-center justify-between sticky top-0 md:static z-20">
          <div className="flex items-center gap-2 text-xs text-[#686868]">
            <span className="text-[#171717] font-medium">{breadcrumbs}</span>
          </div>

          <div className="flex items-center gap-4">
            {isReportView && onPrint && (
              <button
                onClick={onPrint}
                className="no-print hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#171717] text-xs font-semibold hover:bg-[#171717] hover:text-white transition"
              >
                <span>⎙</span> Print Report
              </button>
            )}

            <div className="flex items-center gap-2 text-[11px] text-[#686868] border-l border-[#D5D5D2] pl-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-[#171717]">Preliminary Legal Assessment</span>
            </div>
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 px-4 sm:px-8 md:px-12 py-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>

        {/* Clean Editorial Footer */}
        <footer className="border-t border-[#D5D5D2] bg-white py-6 px-6 sm:px-12 text-[11px] text-[#686868]">
          <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#171717]">Assess Your File</span>
              <span>- Confidential Preliminary Legal Screening</span>
            </div>
            <div className="text-[11px] text-[#888884]">
              For professional reference only. Does not constitute formal legal counsel.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
