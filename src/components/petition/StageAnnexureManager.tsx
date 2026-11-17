"use client";

import React from "react";
import type { AnnexureIndex, AnnexureItem } from "@/components/types";
import { renumberAnnexures } from "@/lib/petitionEngine";

interface StageAnnexureManagerProps {
  annexureIndex: AnnexureIndex;
  setAnnexureIndex: (updater: (prev: AnnexureIndex) => AnnexureIndex) => void;
  onProceedToPreview: () => void;
  onBackToCounterparty: () => void;
}

export default function StageAnnexureManager({
  annexureIndex,
  setAnnexureIndex,
  onProceedToPreview,
  onBackToCounterparty,
}: StageAnnexureManagerProps) {
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= annexureIndex.items.length) return;

    setAnnexureIndex((prev) => {
      const copy = [...prev.items];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return renumberAnnexures(prev, copy);
    });
  };

  const handleToggleExclude = (documentId: string) => {
    setAnnexureIndex((prev) => {
      const updated = prev.items.map((item) =>
        item.documentId === documentId ? { ...item, isExcluded: !item.isExcluded } : item
      );
      return renumberAnnexures(prev, updated);
    });
  };

  const handleUpdateTitle = (documentId: string, newTitle: string) => {
    setAnnexureIndex((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.documentId === documentId ? { ...item, documentTitle: newTitle } : item
      ),
    }));
  };

  const activeAnnexures = annexureIndex.items.filter((i) => !i.isExcluded);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="bg-white border border-[#D5D5D2] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Stage D · Document-to-Event Mapping & Annexure Registry
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#151515]">
              Documentary Evidence & Annexure Index
            </h2>
            <p className="text-xs text-[#686868] mt-1 max-w-3xl">
              Annexure numbers are assigned deterministically to uploaded documents.
              One document may support multiple events without duplicate annexures.
              Reordering documents automatically updates all <code>[Annexure X]</code> paragraph citations throughout the petition.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto bg-[#F5F5F3] px-4 py-2 border border-[#D5D5D2]">
            <span>Active Annexures: <strong>{activeAnnexures.length}</strong></span>
            <span>Total Pages: <strong>{annexureIndex.totalPages}</strong></span>
          </div>
        </div>
      </div>

      {/* Unattached Documents Notice (Rule 5: Never reference an unavailable file as an attached annexure) */}
      {annexureIndex.unattachedReferencedDocs && annexureIndex.unattachedReferencedDocs.length > 0 && (
        <div className="p-4 bg-[#FFF9E6] border border-[#F2D21A] text-xs text-[#151515] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#806600]">
            <span>⚠ Unattached Document Notice:</span>
          </div>
          <p className="text-[11px] text-[#686868]">
            The following documents were mentioned in the transactional facts but have not been uploaded as PDF exhibits.
            Per evidentiary standards, they will be marked as requiring production by counsel and are <strong>excluded</strong> from the Annexure Index:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {annexureIndex.unattachedReferencedDocs.map((doc, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-white border border-[#D5D5D2] text-[10px] font-semibold text-[#151515]">
                {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Annexure Table */}
      <div className="bg-white border border-[#D5D5D2] overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#151515] text-white uppercase text-[10px] tracking-wider">
              <th className="p-3 w-14 text-center">Order</th>
              <th className="p-3 w-28">Annexure</th>
              <th className="p-3">Document Exhibit Title</th>
              <th className="p-3 w-32">Document Date</th>
              <th className="p-3 w-24">Pages</th>
              <th className="p-3 w-40">Extraction Status</th>
              <th className="p-3 w-28 text-center">Exclude</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEEEC]">
            {annexureIndex.items.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === annexureIndex.items.length - 1;

              return (
                <tr
                  key={item.documentId}
                  className={`transition-colors ${
                    item.isExcluded ? "bg-[#FAF8F5] opacity-50" : "hover:bg-[#FCFCFA]"
                  }`}
                >
                  {/* Order Controls */}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMove(index, "up")}
                        className="text-xs text-[#686868] hover:text-[#151515] disabled:opacity-20 cursor-pointer"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(index, "down")}
                        className="text-xs text-[#686868] hover:text-[#151515] disabled:opacity-20 cursor-pointer"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </td>

                  {/* Annexure Label */}
                  <td className="p-3">
                    <span
                      className={`font-bold font-mono px-2 py-1 text-[11px] block text-center ${
                        item.isExcluded
                          ? "bg-stone-200 text-stone-600"
                          : "bg-[#151515] text-white"
                      }`}
                    >
                      {item.isExcluded ? "Excluded" : item.annexureLabel}
                    </span>
                  </td>

                  {/* Document Title Editor */}
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.documentTitle}
                      onChange={(e) => handleUpdateTitle(item.documentId, e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-[#D5D5D2] focus:border-[#151515] focus:bg-white text-xs font-semibold text-[#151515] focus:outline-none"
                    />
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8E8E8A]">
                      <span>File: {item.originalFileName}</span>
                      {item.relatedEventIds.length > 0 && (
                        <span>· Linked to Events: {item.relatedEventIds.join(", ")}</span>
                      )}
                    </div>
                  </td>

                  {/* Document Date */}
                  <td className="p-3 text-[#686868]">
                    {item.documentDate || "Date Unspecified"}
                  </td>

                  {/* Page Range */}
                  <td className="p-3 font-mono text-[#686868]">
                    {item.relevantPageRange}
                  </td>

                  {/* Extraction Status */}
                  <td className="p-3">
                    {item.extractionStatus === "completed" && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-medium">
                        Digital / OCR Verified
                      </span>
                    )}
                    {item.extractionStatus === "partially_readable" && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-medium">
                        Multimodal OCR
                      </span>
                    )}
                    {item.extractionStatus === "failed" && (
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-300 text-[10px] font-medium" title="Extraction failed but preserved as exhibit">
                        Scanned Exhibit
                      </span>
                    )}
                  </td>

                  {/* Exclude Checkbox */}
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.isExcluded}
                      onChange={() => handleToggleExclude(item.documentId)}
                      className="cursor-pointer rounded-none border-[#D5D5D2]"
                      title="Exclude from formal pleading index"
                    />
                  </td>
                </tr>
              );
            })}

            {annexureIndex.items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-[#8E8E8A] italic">
                  No documents were uploaded with this matter. To attach exhibits, return to Matter Intake.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBackToCounterparty}
          className="px-5 py-2.5 bg-white border border-[#D5D5D2] hover:bg-[#F5F5F3] text-xs font-semibold text-[#151515] transition cursor-pointer"
        >
          ← Back to Counterparty Intel (Stage C)
        </button>

        <button
          type="button"
          onClick={onProceedToPreview}
          className="px-6 py-2.5 bg-[#151515] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
        >
          <span>Generate & Preview Formal Pleading (Stage E)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
