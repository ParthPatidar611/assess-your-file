"use client";

import React, { useState } from "react";
import type { PetitionEvent, AnnexureIndex, DateConfidence } from "@/components/types";

interface StageEventsEditorProps {
  events: PetitionEvent[];
  setEvents: (updater: (prev: PetitionEvent[]) => PetitionEvent[]) => void;
  annexureIndex: AnnexureIndex;
  onProceedToCounterparty: () => void;
  onBackToOverview: () => void;
}

export default function StageEventsEditor({
  events,
  setEvents,
  annexureIndex,
  onProceedToCounterparty,
  onBackToOverview,
}: StageEventsEditorProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(events[0]?.eventId || null);

  const handleUpdateField = (
    eventId: string,
    field: keyof PetitionEvent,
    value: string | string[] | boolean | DateConfidence
  ) => {
    setEvents((prev) =>
      prev.map((e) => (e.eventId === eventId ? { ...e, [field]: value } : e))
    );
  };

  const handleMoveEvent = (index: number, direction: "up" | "down") => {
    setEvents((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((e, idx) => ({ ...e, orderIndex: idx + 1 }));
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (events.length <= 1) {
      alert("At least one chronological event is required to construct a petition.");
      return;
    }
    setEvents((prev) =>
      prev.filter((e) => e.eventId !== eventId).map((e, idx) => ({ ...e, orderIndex: idx + 1 }))
    );
  };

  const handleAddNewEvent = () => {
    const newId = `EVT-${String(events.length + 1).padStart(3, "0")}`;
    const newEvent: PetitionEvent = {
      eventId: newId,
      orderIndex: events.length + 1,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
      dateConfidence: "approximate",
      eventDescription: "",
      otherPartyMistake: "Not separately identified from available material; subject to advocate review",
      applicantResponse: "Not documented in provided records; requires applicant confirmation",
      reliefSought: "Relief claimed in consolidated prayer",
      supportingDocumentIds: [],
      sourceFactIds: [`FACT-NEW-${events.length + 1}`],
      verificationStatus: "user_statement",
      isDisputed: false,
    };
    setEvents((prev) => [...prev, newEvent]);
    setExpandedEventId(newId);
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
                Stage B · Chronological Event Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#151515]">
              Event-Wise Factual Matrix ({events.length} Events)
            </h2>
            <p className="text-xs text-[#686868] mt-1 max-w-3xl">
              Every factual assertion must satisfy the <strong>5 mandatory fields</strong> required by court procedure.
              Events form the numbered statement of facts and grounds of the final draft.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddNewEvent}
            className="px-4 py-2 bg-[#F2D21A] hover:bg-[#DFC115] text-[#151515] text-xs font-bold uppercase tracking-wider transition cursor-pointer self-start sm:self-auto border border-[#D5D5D2]"
          >
            + Add Chronological Event
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((evt, index) => {
          const isExpanded = expandedEventId === evt.eventId;
          const isFirst = index === 0;
          const isLast = index === events.length - 1;

          return (
            <div
              key={evt.eventId}
              className={`bg-white border transition-all ${
                isExpanded ? "border-[#151515] shadow-xs" : "border-[#D5D5D2] hover:border-[#A0A09C]"
              }`}
            >
              {/* Event Summary Bar */}
              <div
                className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer bg-[#FCFCFA] border-b border-[#EEEEEC]"
                onClick={() => setExpandedEventId(isExpanded ? null : evt.eventId)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="px-2 py-1 bg-[#151515] text-white text-[11px] font-bold font-mono">
                    #{evt.orderIndex}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#151515]">{evt.date}</span>
                      <span className="text-[10px] px-1.5 py-0.5 border border-[#D5D5D2] text-[#686868] uppercase">
                        {evt.dateConfidence}
                      </span>
                      {evt.verificationStatus === "documented" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">
                          Documented Fact
                        </span>
                      )}
                      {evt.isDisputed && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-300">
                          Contested / Disputed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#686868] truncate mt-1">
                      {evt.eventDescription || "(No event description entered yet)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMoveEvent(index, "up")}
                    className="p-1.5 text-xs text-[#686868] hover:text-[#151515] disabled:opacity-30 cursor-pointer"
                    title="Move earlier"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMoveEvent(index, "down")}
                    className="p-1.5 text-xs text-[#686868] hover:text-[#151515] disabled:opacity-30 cursor-pointer"
                    title="Move later"
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
                <div className="p-6 space-y-6">
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
                        placeholder="e.g. 15 September 2026 or 'Mid-September 2026'"
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
                        <option value="unknown">Unknown / Needs Advocate Confirmation</option>
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
                      placeholder="e.g. Supplier delivered equipment with physical dent and cooling failure, failing clause 4 warranty..."
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
                      placeholder="e.g. Buyer endorsed receipt on delivery challan noting defects and dispatched formal cure notice within 48 hours..."
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
                      placeholder="e.g. Direction to refund advance payment of Rs. 1,92,000 with 12% interest"
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

                  {/* Fact Ledger Traceability IDs */}
                  <div className="pt-2 border-t border-[#EEEEEC] flex items-center justify-between text-[11px] text-[#8E8E8A]">
                    <div className="flex items-center gap-2">
                      <span>Source Fact IDs:</span>
                      {evt.sourceFactIds.map((fid) => (
                        <span key={fid} className="px-1.5 py-0.5 bg-[#F5F5F3] font-mono font-bold text-[#151515] border border-[#D5D5D2]">
                          {fid}
                        </span>
                      ))}
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={evt.isDisputed}
                        onChange={(e) => handleUpdateField(evt.eventId, "isDisputed", e.target.checked)}
                        className="rounded-none border-[#D5D5D2]"
                      />
                      <span>Mark as Disputed / Contested</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBackToOverview}
          className="px-5 py-2.5 bg-white border border-[#D5D5D2] hover:bg-[#F5F5F3] text-xs font-semibold text-[#151515] transition cursor-pointer"
        >
          ← Back to Forum & Parties (Stage A)
        </button>

        <button
          type="button"
          onClick={onProceedToCounterparty}
          className="px-6 py-2.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
        >
          <span>Proceed to Counterparty Intel (Stage C)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
