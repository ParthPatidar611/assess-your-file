/**
 * DOCX Document Export Engine
 * ============================
 * Generates formal, formatted Indian Court pleadings in Microsoft Word (.docx) format.
 *
 * Enforces:
 * - 1.5 line spacing, 1-inch margins, standard legal styling.
 * - Formal court heading, cause title, memo of parties.
 * - Tabular Chronological List of Dates and Events.
 * - Tabular Index of Annexures.
 * - Numbered statement of facts and grounds.
 * - Complete exclusion of confidential counsel strategy notes.
 * - Mandatory preliminary draft disclaimers.
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from "docx";
import type { GeneratedPetition } from "@/components/types";
import { cleanFactReferences } from "@/lib/sanitization";

/**
 * Builds a binary Buffer / Blob representing a formal Indian Court Pleading.
 */
export async function generatePetitionDocx(petition: GeneratedPetition): Promise<Document> {
  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  };

  const headerCell = (text: string, widthPercent: number) =>
    new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      shading: { fill: "F5F5F5" },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: true,
              size: 20, // 10pt
              font: "Times New Roman",
            }),
          ],
        }),
      ],
    });

  const bodyCell = (text: string, widthPercent: number) =>
    new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 20, // 10pt
              font: "Times New Roman",
            }),
          ],
        }),
      ],
    });

  // 1. Build List of Dates and Events Table
  const dateRows = [
    new TableRow({
      children: [
        headerCell("Date", 25),
        headerCell("Factual Event Description", 55),
        headerCell("Exhibit Reference", 20),
      ],
    }),
    ...petition.chronologicalListDates.map(
      (item) =>
        new TableRow({
          children: [
            bodyCell(item.date, 25),
            bodyCell(cleanFactReferences(item.eventSummary), 55),
            bodyCell(item.annexureRef || "—", 20),
          ],
        })
    ),
  ];

  const datesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: dateRows,
  });

  // 2. Build Index of Annexures Table
  const annexureRows = [
    new TableRow({
      children: [
        headerCell("Annexure", 18),
        headerCell("Document Description", 42),
        headerCell("Date", 15),
        headerCell("Page Range", 15),
        headerCell("Status", 10),
      ],
    }),
    ...petition.annexureIndex.items
      .filter((i) => !i.isExcluded)
      .map(
        (item) =>
          new TableRow({
            children: [
              bodyCell(item.annexureLabel, 18),
              bodyCell(item.documentTitle, 42),
              bodyCell(item.documentDate || "Unspecified", 15),
              bodyCell(item.relevantPageRange, 15),
              bodyCell(item.extractionStatus === "completed" ? "Verified" : "Attached", 10),
            ],
          })
      ),
  ];

  const annexuresTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: annexureRows,
  });

  // 3. Assemble document sections
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "CONFIDENTIAL / PRELIMINARY DRAFT — REQUIRES ADVOCATE REVIEW",
                    size: 16,
                    color: "666666",
                    font: "Times New Roman",
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Page ",
                    size: 18,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 18,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Mandatory Disclaimer Banner
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "PRELIMINARY LEGAL DRAFT — NOT FOR COURT FILING WITHOUT ADVOCATE REVIEW",
                bold: true,
                size: 20,
                color: "8B0000",
                font: "Times New Roman",
              }),
            ],
          }),

          // Court / Forum Heading
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: petition.courtHeading.toUpperCase(),
                bold: true,
                size: 24, // 12pt
                font: "Times New Roman",
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: petition.natureOfProceeding.toUpperCase(),
                bold: true,
                underline: {},
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          // Cause Title & Parties Block
          new Paragraph({
            children: [
              new TextRun({
                text: "IN THE MATTER OF:",
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `${petition.partiesBlock.petitionerName}\nAddress: ${petition.partiesBlock.petitionerAddress}`,
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
              new TextRun({
                text: `\n... ${petition.partiesBlock.petitionerRole.toUpperCase()}`,
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: "VERSUS",
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `${petition.partiesBlock.respondentName}\nAddress: ${petition.partiesBlock.respondentAddress}`,
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
              new TextRun({
                text: `\n... ${petition.partiesBlock.respondentRole.toUpperCase()}`,
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          // List of Dates and Events Section
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: "CHRONOLOGICAL LIST OF DATES AND EVENTS",
                bold: true,
                size: 22,
                underline: {},
                font: "Times New Roman",
              }),
            ],
          }),

          datesTable,

          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: "MOST RESPECTFULLY SHOWETH:",
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          // Statement of Facts Paragraphs
          ...petition.statementOfFacts.map(
            (p) =>
              new Paragraph({
                spacing: { after: 140, line: 360 }, // 1.5 line spacing
                children: [
                  new TextRun({
                    text: `${p.paragraphNumber}. `,
                    bold: true,
                    size: 22,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: cleanFactReferences(p.text),
                    size: 22,
                    font: "Times New Roman",
                  }),
                ],
              })
          ),

          // Event Breaches and Responses
          ...petition.eventBreachesAndResponses.map(
            (p) =>
              new Paragraph({
                spacing: { after: 140, line: 360 },
                children: [
                  new TextRun({
                    text: `${p.paragraphNumber}. `,
                    bold: true,
                    size: 22,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: cleanFactReferences(p.text),
                    size: 22,
                    font: "Times New Roman",
                  }),
                ],
              })
          ),

          // Anticipated Objections & Rebuttals (Excludes Strategy Notes)
          ...petition.anticipatedObjectionsAndRebuttals.map(
            (p) =>
              new Paragraph({
                spacing: { after: 140, line: 360 },
                children: [
                  new TextRun({
                    text: `${p.paragraphNumber}. `,
                    bold: true,
                    size: 22,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: cleanFactReferences(p.text),
                    size: 22,
                    font: "Times New Roman",
                  }),
                ],
              })
          ),

          // Grounds Section
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: "GROUNDS",
                bold: true,
                size: 22,
                underline: {},
                font: "Times New Roman",
              }),
            ],
          }),

          ...petition.grounds.map(
            (g) =>
              new Paragraph({
                spacing: { after: 140, line: 360 },
                children: [
                  new TextRun({
                    text: `${g.groundLetter}. `,
                    bold: true,
                    size: 22,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: `[${g.statutoryBasis}] `,
                    bold: true,
                    size: 22,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: cleanFactReferences(g.argument),
                    size: 22,
                    font: "Times New Roman",
                  }),
                ],
              })
          ),

          // Prayer Section
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: "PRAYER",
                bold: true,
                size: 22,
                underline: {},
                font: "Times New Roman",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: "Wherefore, in the facts and circumstances stated hereinabove, it is most respectfully prayed that this Hon'ble Court / Forum may graciously be pleased to:",
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          ...petition.consolidatedPrayers.map(
            (pr) =>
              new Paragraph({
                spacing: { after: 140, line: 360 },
                children: [
                  new TextRun({
                    text: `${pr.prayerId} `,
                    bold: true,
                    size: 22,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: pr.prayerText,
                    size: 22,
                    font: "Times New Roman",
                  }),
                ],
              })
          ),

          // Signatures Placeholder
          new Paragraph({
            spacing: { before: 360, after: 120 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `${petition.partiesBlock.petitionerRole.toUpperCase()}\nTHROUGH\n\n___________________________________\nADVOCATE FOR APPLICANT`,
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          // Verification Clause
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: "VERIFICATION",
                bold: true,
                size: 22,
                underline: {},
                font: "Times New Roman",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 240, line: 360 },
            children: [
              new TextRun({
                text: petition.verificationStatement.verificationText,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          // Index of Annexures Section
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: "INDEX OF ANNEXURES",
                bold: true,
                size: 22,
                underline: {},
                font: "Times New Roman",
              }),
            ],
          }),

          annexuresTable,
        ],
      },
    ],
  });

  return doc;
}
