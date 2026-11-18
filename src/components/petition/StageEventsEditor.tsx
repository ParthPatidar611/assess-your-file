"use client";

import React, { useState } from "react";
import type { PetitionEvent, AnnexureIndex, DateConfidence, EventVerificationStatus, EventApprovalStatus } from "@/components/types";
import { sortEventsChronologically } from "@/lib/petitionEngine";

interface StageEventsEditorProps {
  events: PetitionEvent[];
  setEvents: (updater: (prev: PetitionEvent[]) => PetitionEvent[]) => void;
  annexureIndex: AnnexureIndex;
  onProceedToCounterparty: () => void;
  onBackToOverview: () => void;
  onTimelineChange?: () => void;
}

export default function StageEventsEditor({
  events,
  setEvents,
  annexureIndex,
  onProceedToCounterparty,
  onBackToOverview,
  onTimelineChange,
}: StageEventsEditorProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(events[0]?.eventId || null);

  // Derived Metrics
  const totalCount = events.length;
  const approvedCount = events.filter((e) => e.approvalStatus === "confirmed").length;
  const requiresConfirmCount = events.filter((e) => e.approvalStatus === "proposed" || e.dateConfidence === "unknown").length;
  const disputedCount = events.filter((e) => e.isDisputed).length;
  const undatedCount = events.filter(
    (e) => !e.date || e.date.includes("NOT ESTABLISHED") || e.dateConfidence === "unknown" || e.date === "Date not specified"
  ).length;
  const docSupportedCount = events.filter((e) => e.supportingDocumentIds.length > 0).length;

  // Check if dates are out of chronological order
  const isChronologicalOrderBroken = () => {
    let lastTime = -1;
    for (const evt of events) {
      if (!evt.date || evt.date.includes("NOT ESTABLISHED") || evt.dateConfidence === "unknown") continue;
      const dmy = evt.date.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
      let t = 0;
      if (dmy) {
        const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3], 10) : parseInt(dmy[3], 10);
        t = new Date(year, parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)).getTime();
      } else {
        const p = Date.parse(evt.date);
        t = isNaN(p) ? 0 : p;
      }
      if (t > 0 && lastTime > 0 && t < lastTime) return true;
      if (t > 0) lastTime = t;
    }
    return false;
  };

  const chronologyNeedsFix = isChronologicalOrderBroken();

  const handleUpdateField = (
    eventId: string,
    field: keyof PetitionEvent,
    value: string | string[] | boolean | DateConfidence | EventVerificationStatus | EventApprovalStatus | Record<string, string>
  ) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.eventId !== eventId) return e;
        const updated = { ...e, [field]: value, updatedAt: new Date().toISOString() };
        if (field !== "approvalStatus" && e.approvalStatus === "proposed") {
          updated.approvalStatus = "edited";
        }
        return updated;
      })
    );
    if (onTimelineChange) onTimelineChange();
  };

  const handleApproveEvent = (eventId: string) => {
    handleUpdateField(eventId, "approvalStatus", "confirmed");
  };

  const handleApproveAllEvents = () => {
    setEvents((prev) =>
      prev.map((e) => ({
        ...e,
        approvalStatus: "confirmed",
        updatedAt: new Date().toISOString(),
      }))
    );
    if (onTimelineChange) onTimelineChange();
  };

  const handleRestoreChronology = () => {
    setEvents((prev) => sortEventsChronologically(prev));
    if (onTimelineChange) onTimelineChange();
  };

  const handleMoveEvent = (index: number, direction: "up" | "down") => {
    setEvents((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((e, idx) => ({ ...e, orderIndex: idx + 1, updatedAt: new Date().toISOString() }));
    });
    if (onTimelineChange) onTimelineChange();
  };

  const handleDeleteEvent = (eventId: string) => {
    if (events.length <= 1) {
      alert("At least one chronological event is required to build the legal pleading.");
      return;
    }
    if (confirm("Are you sure you want to remove this event from the timeline?")) {
      setEvents((prev) =>
        prev.filter((e) => e.eventId !== eventId).map((e, idx) => ({ ...e, orderIndex: idx + 1, updatedAt: new Date().toISOString() }))
      );
      if (onTimelineChange) onTimelineChange();
    }
  };

  const handleAddNewEvent = () => {
    const newId = `EVT-${String(events.length + 1).padStart(3, "0")}`;
    const newEvent: PetitionEvent = {
      eventId: newId,
      orderIndex: events.length + 1,
      date: "DATE NOT ESTABLISHED",
      dateConfidence: "unknown",
      originalDateText: "DATE NOT ESTABLISHED",
      eventDescription: "",
      otherPartyMistake: "No separate alleged mistake identified.",
      applicantResponse: "Applicant response not provided.",
      reliefSought: "No event-specific relief identified.",
      supportingDocumentIds: [],
      supportingDocumentPageReferences: {},
      sourceFactIds: [`FACT-USER-${events.length + 1}`],
      sourceClassifications: ["applicant_statement"],
      verificationStatus: "applicant_statement",
      approvalStatus: "edited",
      isDisputed: false,
      updatedAt: new Date().toISOString(),
      timelineVersion: 1,
    };
    setEvents((prev) => [...prev, newEvent]);
    setExpandedEventId(newId);
    if (onTimelineChange) onTimelineChange();
  };

  // Group events: Dated Chronological vs Date Not Established
  const datedEvents = events.filter(
    (e) => e.date && !e.date.includes("NOT ESTABLISHED") && e.dateConfidence !== "unknown" && e.date !== "Date not specified"
  );
  const undatedEventsList = events.filter(
    (e) => !e.date || e.date.includes("NOT ESTABLISHED") || e.dateConfidence === "unknown" || e.date === "Date not specified"
  );

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------- */}
      {/* EDITORIAL WORKSPACE HEADER & TIMELINE METRICS         */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#EEEEEC] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Stage B · Chronological Event Timeline
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#151515] tracking-tight">
              Central Factual Workspace
            </h2>
            <p className="text-xs text-[#686868] mt-1 max-w-3xl leading-relaxed">
              This chronological timeline is the single factual record that powers all subsequent stages:
              Counterparty Intelligence, Annexure Registry, and Petition Generation. Review, edit, and approve
              each transaction event before drafting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleAddNewEvent}
              className="px-4 py-2.5 bg-white hover:bg-[#F5F5F3] text-[#151515] text-xs font-bold uppercase tracking-wider border border-[#D5D5D2] transition cursor-pointer"
            >
              + Add Event
            </button>
            <button
              type="button"
              onClick={handleApproveAllEvents}
              className="px-5 py-2.5 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] text-xs font-bold uppercase tracking-wider border border-[#D5D5D2] shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <span>Approve Timeline</span>
              <span>✓</span>
            </button>
          </div>
        </div>

        {/* Real-time Timeline Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-3 bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E8A]">Total Events</p>
            <p className="text-lg font-bold text-[#151515] mt-0.5">{totalCount}</p>
          </div>
          <div className="p-3 bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Approved</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{approvedCount}</p>
          </div>
          <div className="p-3 bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Needs Review</p>
            <p className="text-lg font-bold text-amber-700 mt-0.5">{requiresConfirmCount}</p>
          </div>
          <div className="p-3 bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Disputed</p>
            <p className="text-lg font-bold text-rose-700 mt-0.5">{disputedCount}</p>
          </div>
          <div className="p-3 bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#686868]">Date Unknown</p>
            <p className="text-lg font-bold text-[#151515] mt-0.5">{undatedCount}</p>
          </div>
          <div className="p-3 bg-[#FAFAF8] border border-[#EEEEEC]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Doc-Supported</p>
            <p className="text-lg font-bold text-indigo-700 mt-0.5">{docSupportedCount}</p>
          </div>
        </div>

        {/* Chronology Notice & Quick Action */}
        {chronologyNeedsFix && (
          <div className="mt-5 p-3.5 bg-[#FFF9E6] border-l-4 border-[#F2D21A] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-bold text-[#151515]">Chronology Alignment Alert</p>
              <p className="text-[#686868]">
                One or more dated events are currently listed out of chronological sequence.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestoreChronology}
              className="px-3.5 py-1.5 bg-[#151515] hover:bg-[#333333] text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              Restore Chronological Order ↻
            </button>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: CHRONOLOGICAL SEQUENCE (DATED EVENTS)     */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#151515]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#151515]">
              Chronological Event Sequence ({datedEvents.length} Dated Events)
            </h3>
          </div>
          <span className="text-[11px] text-[#8E8E8A]">Sorted in chronological sequence</span>
        </div>

        {datedEvents.length === 0 && (
          <div className="p-6 bg-white border border-[#D5D5D2] text-xs text-[#8E8E8A] italic">
            No exact calendar dates were parsed from case text. All events are placed under "Date Not Established" below for your verification.
          </div>
        )}

        <div className="space-y-4">
          {datedEvents.map((evt) => {
            const index = events.findIndex((e) => e.eventId === evt.eventId);
            return renderEventCard(evt, index);
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: DATE NOT ESTABLISHED (SEPARATELY GROUPED) */}
      {/* ---------------------------------------------------- */}
      {undatedEventsList.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#D5D5D2]">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-900">
                Date Not Established / Confirmation Required ({undatedEventsList.length} Events)
              </h3>
            </div>
            <span className="text-[11px] text-amber-800">
              No fictitious dates assigned · Requires advocate confirmation
            </span>
          </div>

          <div className="space-y-4">
            {undatedEventsList.map((evt) => {
              const index = events.findIndex((e) => e.eventId === evt.eventId);
              return renderEventCard(evt, index);
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* BOTTOM ACTION BAR                                    */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#D5D5D2]">
        <button
          type="button"
          onClick={onBackToOverview}
          className="px-5 py-2.5 bg-white border border-[#D5D5D2] hover:bg-[#F5F5F3] text-xs font-semibold text-[#151515] transition cursor-pointer"
        >
          ← Back to Forum & Parties (Stage A)
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRestoreChronology}
            className="px-4 py-2.5 bg-white border border-[#D5D5D2] hover:bg-[#F5F5F3] text-xs font-semibold text-[#151515] transition cursor-pointer"
          >
            Sort Chronologically
          </button>
          <button
            type="button"
            onClick={onProceedToCounterparty}
            className="px-6 py-2.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <span>Proceed to Counterparty Intel (Stage C)</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Helper renderer for each event card
  function renderEventCard(evt: PetitionEvent, index: number) {
    const isExpanded = expandedEventId === evt.eventId;
    const isFirst = index === 0;
    const isLast = index === events.length - 1;

    // Resolve attached document names from annexureIndex
    const attachedAnnexures = annexureIndex.items.filter((item) =>
      evt.supportingDocumentIds.includes(item.documentId)
    );

    return (
      <div
        key={evt.eventId}
        className={`bg-white border transition-all ${
          isExpanded ? "border-[#151515] shadow-xs" : "border-[#D5D5D2] hover:border-[#A0A09C]"
        }`}
      >
        {/* Event Summary Bar */}
        <div
          className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer bg-[#FCFCFA] border-b border-[#EEEEEC]"
          onClick={() => setExpandedEventId(isExpanded ? null : evt.eventId)}
        >
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <span className="px-2 py-1 bg-[#151515] text-white text-[11px] font-bold font-mono shrink-0">
              #{evt.orderIndex}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold text-[#151515] font-mono">{evt.date}</span>

                {/* Date Confidence */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 border uppercase font-medium ${
                    evt.dateConfidence === "confirmed"
                      ? "bg-white text-emerald-800 border-emerald-300"
                      : evt.dateConfidence === "unknown"
                      ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                      : "bg-white text-[#686868] border-[#D5D5D2]"
                  }`}
                >
                  {evt.dateConfidence === "unknown" ? "Date Not Established" : evt.dateConfidence}
                </span>

                {/* Source Verification Badge */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 border uppercase font-medium ${
                    evt.verificationStatus === "documented"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : evt.verificationStatus === "allegation"
                      ? "bg-purple-50 text-purple-800 border-purple-300"
                      : evt.verificationStatus === "opposing_party_statement"
                      ? "bg-orange-50 text-orange-800 border-orange-300"
                      : "bg-[#F5F5F3] text-[#686868] border-[#D5D5D2]"
                  }`}
                >
                  {evt.verificationStatus.replace(/_/g, " ")}
                </span>

                {/* Disputed Status */}
                {evt.isDisputed && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 font-semibold uppercase">
                    Contested / Disputed
                  </span>
                )}

                {/* Approval Status */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 border uppercase font-semibold ${
                    evt.approvalStatus === "confirmed"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : evt.approvalStatus === "edited"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : "bg-[#FFF9E6] text-amber-900 border-[#F2D21A]"
                  }`}
                >
                  {evt.approvalStatus === "confirmed"
                    ? "User-Approved ✓"
                    : evt.approvalStatus === "edited"
                    ? "User-Edited"
                    : "Proposed (Review Required)"}
                </span>
              </div>

              <p className="text-xs text-[#2B2B2B] leading-snug line-clamp-2">
                {evt.eventDescription || "(No event description entered yet)"}
              </p>

              {/* Supporting Documents Indicator */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {attachedAnnexures.length > 0 ? (
                  attachedAnnexures.map((annx) => (
                    <span
                      key={annx.documentId}
                      className="inline-flex items-center gap-1 text-[10px] bg-white border border-[#D5D5D2] px-2 py-0.5 text-[#151515] font-mono"
                    >
                      <strong className="text-indigo-900">{annx.annexureLabel}:</strong>
                      <span className="truncate max-w-[180px]">{annx.documentTitle}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5">
                    No supporting document currently associated
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={isFirst}
              onClick={() => handleMoveEvent(index, "up")}
              className="p-1.5 text-xs text-[#686868] hover:text-[#151515] disabled:opacity-20 cursor-pointer"
              title="Move earlier in chronology"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => handleMoveEvent(index, "down")}
              className="p-1.5 text-xs text-[#686868] hover:text-[#151515] disabled:opacity-20 cursor-pointer"
              title="Move later in chronology"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => handleDeleteEvent(evt.eventId)}
              className="p-1.5 text-xs text-red-600 hover:text-red-800 cursor-pointer ml-1"
              title="Delete event"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Expanded 5 Required Fields Editor */}
        {isExpanded && (
          <div className="p-6 space-y-6 bg-white">
            {/* Date and Confidence */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#151515] mb-1">
                  Event Date / Timeline Marker:
                </label>
                <input
                  type="text"
                  value={evt.date}
                  onChange={(e) => handleUpdateField(evt.eventId, "date", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                  placeholder="e.g. 15 September 2026 or 'DATE NOT ESTABLISHED'"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#151515] mb-1">
                  Date Confidence:
                </label>
                <select
                  value={evt.dateConfidence}
                  onChange={(e) =>
                    handleUpdateField(evt.eventId, "dateConfidence", e.target.value as DateConfidence)
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                >
                  <option value="confirmed">Confirmed (Exact Date on Record)</option>
                  <option value="approximate">Approximate (Month / General Timeline)</option>
                  <option value="unknown">Unknown / Needs Confirmation</option>
                </select>
              </div>
            </div>

            {/* FIELD 1: What happened and when? */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#151515]">
                  1. Event Description (What Happened & When?):
                </label>
                <span className="text-[10px] text-[#8E8E8A]">Mandatory Pleading Paragraph</span>
              </div>
              <textarea
                value={evt.eventDescription}
                onChange={(e) => handleUpdateField(evt.eventId, "eventDescription", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                placeholder="State the objective factual occurrence, agreement, or communication..."
              />
            </div>

            {/* FIELD 2: Mistake by other party */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#151515]">
                  2. Mistake / Default by Other Party (What did they allegedly do wrong?):
                </label>
                <span className="text-[10px] text-[#8E8E8A]">Specific Breach Allegation</span>
              </div>
              <textarea
                value={evt.otherPartyMistake}
                onChange={(e) => handleUpdateField(evt.eventId, "otherPartyMistake", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                placeholder="No separate alleged mistake identified."
              />
            </div>

            {/* FIELD 3: Applicant's response */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#151515]">
                  3. Applicant's Response (What did the applicant say or do?):
                </label>
                <span className="text-[10px] text-[#8E8E8A]">Contemporaneous Reaction</span>
              </div>
              <textarea
                value={evt.applicantResponse}
                onChange={(e) => handleUpdateField(evt.eventId, "applicantResponse", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                placeholder="Applicant response not provided."
              />
            </div>

            {/* FIELD 4: Prayer / Relief sought */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#151515]">
                  4. Relief / Prayer Sought (Relief connected to this event):
                </label>
                <span className="text-[10px] text-[#8E8E8A]">Connected Prayer</span>
              </div>
              <input
                type="text"
                value={evt.reliefSought}
                onChange={(e) => handleUpdateField(evt.eventId, "reliefSought", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D5D5D2] focus:border-[#151515] focus:outline-none"
                placeholder="No event-specific relief identified."
              />
            </div>

            {/* FIELD 5: Supporting Documents / Annexures */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#151515] mb-2">
                5. Supporting Documents (Assigned Annexures):
              </label>
              <div className="flex flex-wrap gap-2">
                {annexureIndex.items
                  .filter((item) => !item.isExcluded)
                  .map((annx) => {
                    const isAttached = evt.supportingDocumentIds.includes(annx.documentId);
                    return (
                      <button
                        key={annx.documentId}
                        type="button"
                        onClick={() => {
                          const updated = isAttached
                            ? evt.supportingDocumentIds.filter((id) => id !== annx.documentId)
                            : [...evt.supportingDocumentIds, annx.documentId];
                          handleUpdateField(evt.eventId, "supportingDocumentIds", updated);
                        }}
                        className={`px-3 py-1.5 text-xs border transition cursor-pointer flex items-center gap-1.5 ${
                          isAttached
                            ? "bg-[#151515] text-white border-[#151515]"
                            : "bg-white text-[#686868] border-[#D5D5D2] hover:border-[#151515]"
                        }`}
                      >
                        <span>{isAttached ? "✓" : "+"}</span>
                        <span className="font-bold">{annx.annexureLabel}:</span>
                        <span className="truncate max-w-[200px]">{annx.documentTitle}</span>
                      </button>
                    );
                  })}
                {annexureIndex.items.length === 0 && (
                  <p className="text-xs text-[#8E8E8A] italic">
                    No PDF documents uploaded. You can attach documents in Stage D.
                  </p>
                )}
              </div>
            </div>

            {/* Metadata Controls & Approval */}
            <div className="pt-4 border-t border-[#EEEEEC] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#151515]">
                  <input
                    type="checkbox"
                    checked={evt.isDisputed}
                    onChange={(e) => handleUpdateField(evt.eventId, "isDisputed", e.target.checked)}
                    className="rounded-none border-[#D5D5D2]"
                  />
                  <span>Mark as Disputed / Contested</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8E8E8A]">Verification:</span>
                  <select
                    value={evt.verificationStatus}
                    onChange={(e) =>
                      handleUpdateField(evt.eventId, "verificationStatus", e.target.value as EventVerificationStatus)
                    }
                    className="px-2 py-1 text-xs bg-white border border-[#D5D5D2]"
                  >
                    <option value="documented">Documented Fact</option>
                    <option value="applicant_statement">Applicant Statement</option>
                    <option value="opposing_party_statement">Opposing Party Position</option>
                    <option value="allegation">Party Allegation</option>
                    <option value="inference">Inference</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {evt.approvalStatus !== "confirmed" ? (
                  <button
                    type="button"
                    onClick={() => handleApproveEvent(evt.eventId)}
                    className="px-4 py-1.5 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] font-bold text-xs uppercase tracking-wider border border-[#D5D5D2] cursor-pointer"
                  >
                    Confirm & Approve Event ✓
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <span>✓ Approved by User</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
