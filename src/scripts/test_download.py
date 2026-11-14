
from pathlib import Path
from io import BytesIO
import requests
import hashlib
import json

from pypdf import PdfReader

BASE_URL = (
    "https://indian-supreme-court-judgments.s3.amazonaws.com/"
    "data/pdf/year=2025/english/"
)

FILES = [
    "2025_1_81_92_EN.pdf",
    "2025_1_230_238_EN.pdf",
    "2025_1_515_541_EN.pdf",
]

OUTPUT_DIR = Path("data/raw/supreme_court/2025")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

results = []

for filename in FILES:
    print(f"\nProcessing: {filename}")

    try:
        url = BASE_URL + filename
        response = requests.get(url, timeout=90)
        response.raise_for_status()

        pdf_bytes = response.content

        if not pdf_bytes.startswith(b"%PDF"):
            raise ValueError("Downloaded file is not a valid PDF.")

        reader = PdfReader(BytesIO(pdf_bytes))

        pages = [page.extract_text() or "" for page in reader.pages]
        extracted_text = "\n\n".join(pages).strip()

        if not extracted_text:
            print("WARNING: No selectable text. OCR may be required.")
            continue

        pdf_path = OUTPUT_DIR / filename
        text_path = OUTPUT_DIR / filename.replace(".pdf", ".txt")

        pdf_path.write_bytes(pdf_bytes)
        text_path.write_text(extracted_text, encoding="utf-8")

        sha256 = hashlib.sha256(pdf_bytes).hexdigest()

        results.append({
            "filename": filename,
            "source_url": url,
            "sha256": sha256,
            "page_count": len(reader.pages),
            "character_count": len(extracted_text),
            "pdf_file": str(pdf_path),
            "text_file": str(text_path),
        })

        print("Downloaded:", len(pdf_bytes), "bytes")
        print("Pages:", len(reader.pages))
        print("Extracted characters:", len(extracted_text))
        print("SHA-256:", sha256)

        print("\nEXTRACTED TEXT PREVIEW:")
        print(extracted_text[:1200])

    except Exception as error:
        print(f"FAILED: {filename}")
        print("Reason:", error)

manifest = OUTPUT_DIR / "test_manifest.json"

manifest.write_text(
    json.dumps(results, indent=2),
    encoding="utf-8"
)

print("\n================================")
print("TEST COMPLETE")
print("Successfully processed:", len(results), "of", len(FILES))
print("Output folder:", OUTPUT_DIR)
print("Manifest:", manifest)
print("================================")
