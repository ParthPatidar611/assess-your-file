import { NextResponse } from "next/server";
import { Packer } from "docx";
import { generatePetitionDocx } from "@/lib/docxExport";
import type { GeneratedPetition } from "@/components/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const petition = body.petition as GeneratedPetition | undefined;

    if (!petition || !petition.statementOfFacts) {
      return NextResponse.json(
        { success: false, message: "Valid petition object is required for DOCX export." },
        { status: 400 }
      );
    }

    const doc = await generatePetitionDocx(petition);
    const buffer = await Packer.toBuffer(doc);

    // Sanitize title for filename
    const safeTitle = (petition.matterTitle || "Legal_Petition")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeTitle}_Formal_Pleading_Draft.docx"`,
      },
    });
  } catch (error: unknown) {
    console.error("[api/petition/export/docx] Error generating DOCX:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate DOCX document.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
