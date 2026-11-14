"use client";

import React from "react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="mb-10 border border-[#D5D5D2] bg-white overflow-hidden relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[260px]">
        {/* Left Editorial Content */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between relative z-10 bg-white">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-[#F2D21A]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#686868]">
                Intelligent Dispute Pre-Assessment
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#151515] tracking-tight leading-[1.12] mb-3">
              Assess Your File
            </h1>

            <p className="text-xl sm:text-2xl font-semibold text-[#151515] tracking-tight mb-3">
              Assess before you file.
            </p>

            <p className="text-sm sm:text-[15px] text-[#686868] leading-relaxed max-w-xl">
              Get a structured legal assessment of your matter, with relevant precedents, practical insights and clearer next steps.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-[#EEEEEC] flex flex-wrap items-center gap-6 text-[12px] text-[#686868]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#171717]">109+</span>
              <span>Supreme Court Judgments (2025)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#171717]">3-Level</span>
              <span>Reliable Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#171717]">PDF</span>
              <span>In-Memory Extraction</span>
            </div>
          </div>
        </div>

        {/* Right Architectural Visual Composition */}
        <div className="lg:col-span-5 relative bg-[#151515] min-h-[220px] lg:min-h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-[#D5D5D2]">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/institutional_architecture_hero.jpg"
              alt="Supreme Court and Institutional Architecture"
              fill
              priority
              className="object-cover opacity-75 grayscale contrast-125"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            {/* Subtle Gradient & Yellow Accent Line */}
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#151515]/90 via-[#151515]/40 to-transparent" />
          </div>

          {/* Yellow Framing Line */}
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#F2D21A] hidden lg:block z-10" />

          {/* Minimalist Architectural Caption */}
          <div className="absolute bottom-4 right-4 z-10 bg-[#151515]/90 border border-[#333333] px-3 py-1.5 text-[10px] text-[#D5D5D2] tracking-wider uppercase backdrop-blur-xs">
            Judicial Precedent Engine · 2025 Corpus
          </div>
        </div>
      </div>
    </section>
  );
}
