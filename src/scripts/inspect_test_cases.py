
from pathlib import Path
import json
import duckdb

METADATA = Path("data/aws/supreme_court/metadata/2025.parquet")
MANIFEST = Path("data/raw/supreme_court/2025/test_manifest.json")

if not METADATA.exists():
    raise FileNotFoundError(f"Metadata not found: {METADATA}")

if not MANIFEST.exists():
    raise FileNotFoundError(f"Test manifest not found: {MANIFEST}")

records = json.loads(MANIFEST.read_text(encoding="utf-8"))
con = duckdb.connect()

print("\n========== CASE-METADATA MATCHING ==========\n")

matched = 0

for item in records:
    filename = item["filename"]
    document_path = filename.replace("_EN.pdf", "")

    row = con.execute(
        """
        SELECT
            title,
            petitioner,
            respondent,
            judge,
            citation,
            case_id,
            cnr,
            decision_date,
            disposal_nature,
            court,
            available_languages,
            path
        FROM read_parquet(?)
        WHERE path = ?
        """,
        [str(METADATA), document_path]
    ).fetchone()

    print("\n---------------------------------------")
    print("PDF:", filename)

    if not row:
        print("WARNING: No matching metadata record.")
        continue

    matched += 1

    fields = [
        "Case title",
        "Petitioner",
        "Respondent",
        "Judge",
        "Citation",
        "Case ID",
        "CNR",
        "Decision date",
        "Disposal nature",
        "Court",
        "Languages",
        "Document path"
    ]

    for name, value in zip(fields, row):
        print(f"{name}: {value}")

    text_path = Path(item["text_file"])

    if text_path.exists():
        text = text_path.read_text(encoding="utf-8")
        print("\nExtracted judgment text:")
        print("Characters:", len(text))
        print("Preview:")
        print(text[:700])
    else:
        print("WARNING: Extracted text file is missing.")

print("\n=======================================")
print(f"Matched {matched} of {len(records)} judgments.")
print("=======================================")

con.close()
