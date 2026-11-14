
from pathlib import Path
from io import BytesIO
import tarfile
import json
import hashlib
import duckdb

from pypdf import PdfReader

# -----------------------------------------
# FILE LOCATIONS
# -----------------------------------------

ARCHIVE = Path(
    "data/aws/supreme_court/archives/2025_english.tar"
)

METADATA = Path(
    "data/aws/supreme_court/metadata/2025.parquet"
)

OUTPUT_DIR = Path("data/processed")

OUTPUT_FILE = OUTPUT_DIR / "supreme_court_2025.jsonl"
TEMP_FILE = OUTPUT_DIR / "supreme_court_2025.jsonl.part"
SUMMARY_FILE = OUTPUT_DIR / "supreme_court_2025_summary.json"

BASE_URL = (
    "https://indian-supreme-court-judgments.s3.amazonaws.com/"
    "data/pdf/year=2025/english/"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------------------
# VALIDATE INPUT FILES
# -----------------------------------------

for file in [ARCHIVE, METADATA]:
    if not file.exists():
        raise FileNotFoundError(f"Missing input file: {file}")

# -----------------------------------------
# LOAD ORIGINAL METADATA
# -----------------------------------------

print("\nLoading original judgment metadata...")

con = duckdb.connect()

columns = [
    "title",
    "petitioner",
    "respondent",
    "description",
    "judge",
    "author_judge",
    "citation",
    "case_id",
    "cnr",
    "decision_date",
    "disposal_nature",
    "court",
    "available_languages",
    "path",
    "nc_display",
    "scraped_at",
    "year"
]

query = """
SELECT
    title, petitioner, respondent, description,
    judge, author_judge, citation, case_id, cnr,
    decision_date, disposal_nature, court,
    available_languages, path, nc_display,
    scraped_at, year
FROM read_parquet(?)
"""

rows = con.execute(query, [str(METADATA)]).fetchall()

metadata_by_path = {}

for row in rows:
    record = dict(zip(columns, row))
    identifier = str(record["path"])
    metadata_by_path[identifier] = record

print("Metadata records loaded:", len(metadata_by_path))

# -----------------------------------------
# EXTRACTION COUNTERS
# -----------------------------------------

stats = {
    "archive_pdf_count": 0,
    "matched_records": 0,
    "successfully_extracted": 0,
    "empty_text": 0,
    "extraction_errors": 0,
    "unmatched_pdfs": 0,
    "total_characters": 0
}

unmatched_files = []

# -----------------------------------------
# PROCESS ARCHIVE
# -----------------------------------------

print("\nStarting bulk judgment extraction...\n")

try:
    with tarfile.open(ARCHIVE, "r:*") as archive:
        pdf_members = [
            member for member in archive.getmembers()
            if member.isfile()
            and member.name.lower().endswith(".pdf")
        ]

        stats["archive_pdf_count"] = len(pdf_members)

        with TEMP_FILE.open("w", encoding="utf-8") as output:

            for index, member in enumerate(pdf_members, 1):

                filename = Path(member.name).name
                identifier = filename.replace("_EN.pdf", "")

                metadata = metadata_by_path.get(identifier)

                if metadata is None:
                    stats["unmatched_pdfs"] += 1
                    unmatched_files.append(filename)
                    continue

                stats["matched_records"] += 1

                result = {
                    **metadata,
                    "pdf_filename": filename,
                    "source_url": BASE_URL + filename,
                    "source_dataset": "AWS Indian Supreme Court Judgments",
                    "source_license": "CC BY 4.0",
                    "judgment_text": "",
                    "page_count": 0,
                    "text_char_count": 0,
                    "sha256": None,
                    "extraction_status": "pending",
                    "extraction_error": None
                }

                try:
                    file_object = archive.extractfile(member)

                    if file_object is None:
                        raise ValueError("Could not read PDF from archive.")

                    pdf_bytes = file_object.read()

                    if not pdf_bytes.startswith(b"%PDF"):
                        raise ValueError("Invalid PDF signature.")

                    result["sha256"] = hashlib.sha256(
                        pdf_bytes
                    ).hexdigest()

                    reader = PdfReader(
                        BytesIO(pdf_bytes),
                        strict=False
                    )

                    result["page_count"] = len(reader.pages)

                    extracted_pages = []

                    for page in reader.pages:
                        extracted_pages.append(
                            page.extract_text() or ""
                        )

                    judgment_text = "\n\n".join(
                        extracted_pages
                    ).strip()

                    result["judgment_text"] = judgment_text
                    result["text_char_count"] = len(judgment_text)

                    if len(judgment_text) < 100:
                        result["extraction_status"] = "no_text"
                        stats["empty_text"] += 1
                    else:
                        result["extraction_status"] = "extracted"
                        stats["successfully_extracted"] += 1
                        stats["total_characters"] += len(judgment_text)

                except Exception as error:
                    result["extraction_status"] = "error"
                    result["extraction_error"] = str(error)[:500]
                    stats["extraction_errors"] += 1

                output.write(
                    json.dumps(result, ensure_ascii=False) + "\n"
                )

                if index % 50 == 0 or index == len(pdf_members):
                    print(
                        f"Processed {index}/{len(pdf_members)} | "
                        f"Extracted: {stats['successfully_extracted']} | "
                        f"Empty: {stats['empty_text']} | "
                        f"Errors: {stats['extraction_errors']}"
                    )

    # Publish completed output only after processing finishes.
    TEMP_FILE.replace(OUTPUT_FILE)

except Exception:
    print("\nExtraction stopped. Partial output retained at:", TEMP_FILE)
    raise

finally:
    con.close()

# -----------------------------------------
# SAVE EXTRACTION SUMMARY
# -----------------------------------------

summary = {
    **stats,
    "source_archive": str(ARCHIVE),
    "source_metadata": str(METADATA),
    "output_file": str(OUTPUT_FILE),
    "unmatched_files": unmatched_files
}

SUMMARY_FILE.write_text(
    json.dumps(summary, indent=2),
    encoding="utf-8"
)

print("\n==========================================")
print("BULK EXTRACTION COMPLETE")
print("==========================================")

for key, value in stats.items():
    print(f"{key}: {value}")

print("\nDataset:", OUTPUT_FILE)
print("Summary:", SUMMARY_FILE)
print("==========================================")
