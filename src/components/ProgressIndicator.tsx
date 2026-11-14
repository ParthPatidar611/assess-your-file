"use client";

import React from "react";

interface ProgressIndicatorProps {
  currentStep: 1 | 2;
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="mb-8 bg-white border border-[#D5D5D2] p-5">
      <div className="grid grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="relative">
          <div className="flex items-center justify-between text-xs mb-2">
            <span
              className={`font-semibold tracking-wide uppercase ${
                currentStep >= 1 ? "text-[#151515]" : "text-[#8E8E8A]"
              }`}
            >
              01 - Matter Details
            </span>
            {currentStep > 1 && (
              <span className="text-[10px] font-bold text-emerald-700">✓ Complete</span>
            )}
          </div>
          <div className="h-1 w-full bg-[#EEEEEC] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                currentStep >= 1 ? "bg-[#F2D21A] w-full" : "w-0"
              }`}
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative">
          <div className="flex items-center justify-between text-xs mb-2">
            <span
              className={`font-semibold tracking-wide uppercase ${
                currentStep === 2 ? "text-[#151515]" : "text-[#8E8E8A]"
              }`}
            >
              02 - Review & Submit
            </span>
            {currentStep === 2 && (
              <span className="text-[10px] font-bold text-[#F2D21A] bg-[#151515] px-1.5 py-0.2">
                Active
              </span>
            )}
          </div>
          <div className="h-1 w-full bg-[#EEEEEC] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                currentStep === 2 ? "bg-[#F2D21A] w-full" : "w-0"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
