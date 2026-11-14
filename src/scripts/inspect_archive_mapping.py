
from pathlib import Path
import tarfile
import duckdb

ARCHIVE = Path(
    "data/aws/supreme_court/archives/2025_english.tar"
)

METADATA = Path(
    "data/aws/supreme_court/metadata/2025.parquet"
)

con = duckdb.connect()

# Load original metadata identifiers
metadata_paths = {
    row[0]
    for row in con.execute(
        "SELECT path FROM read_parquet(?)",
        [str(METADATA)]
    ).fetchall()
}

matched = []
unmatched = []

print("\nInspecting archive and matching metadata...\n")

with tarfile.open(ARCHIVE, "r:*") as archive:
    pdf_members = [
        member for member in archive.getmembers()
        if member.isfile() and member.name.lower().endswith(".pdf")
    ]

    for member in pdf_members:
        filename = Path(member.name).name

        identifier = filename.replace("_EN.pdf", "")

        if identifier in metadata_paths:
            matched.append(filename)
        else:
            unmatched.append(filename)

print("========== MAPPING RESULTS ==========")
print("PDF files in archive:", len(pdf_members))
print("Metadata records:", len(metadata_paths))
print("Successfully matched:", len(matched))
print("Unmatched PDFs:", len(unmatched))

print("\nFIRST 10 MATCHED JUDGMENTS:")
for filename in matched[:10]:
    print("-", filename)

if unmatched:
    print("\nFIRST 20 UNMATCHED FILES:")
    for filename in unmatched[:20]:
        print("-", filename)

print("\n=====================================")

con.close()

if len(matched) == len(pdf_members) and not unmatched:
    print("SUCCESS: Every PDF has a matching metadata record.")
else:
    print("REVIEW REQUIRED: Some PDF files could not be matched.")
