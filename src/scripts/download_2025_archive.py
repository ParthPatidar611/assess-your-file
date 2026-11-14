
from pathlib import Path
import requests
import json
import tarfile

BASE_URL = (
    "https://indian-supreme-court-judgments.s3.amazonaws.com/"
    "data/tar/year=2025/english/english.tar"
)

INDEX_FILE = Path(
    "data/aws/supreme_court/metadata/2025_english_index.json"
)

ARCHIVE_DIR = Path("data/aws/supreme_court/archives")
ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)

ARCHIVE_FILE = ARCHIVE_DIR / "2025_english.tar"
TEMP_FILE = ARCHIVE_DIR / "2025_english.tar.part"

if ARCHIVE_FILE.exists():
    print("Archive already exists:", ARCHIVE_FILE)
else:
    print("Starting download of the 2025 English judgment archive...")

    downloaded = 0

    try:
        response = requests.get(
            BASE_URL,
            stream=True,
            timeout=(30, 180)
        )
        response.raise_for_status()

        total = int(response.headers.get("Content-Length", 0))

        with TEMP_FILE.open("wb") as file:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    file.write(chunk)
                    downloaded += len(chunk)

                    if downloaded % (20 * 1024 * 1024) < 1024 * 1024:
                        if total:
                            percent = downloaded / total * 100
                            print(
                                f"Downloaded {downloaded / 1e6:.1f} MB "
                                f"({percent:.1f}%)"
                            )
                        else:
                            print(
                                f"Downloaded {downloaded / 1e6:.1f} MB"
                            )

        TEMP_FILE.replace(ARCHIVE_FILE)

    except Exception as error:
        TEMP_FILE.unlink(missing_ok=True)
        raise RuntimeError(f"Archive download failed: {error}")

if not INDEX_FILE.exists():
    raise FileNotFoundError(
        f"Dataset index missing: {INDEX_FILE}"
    )

index = json.loads(INDEX_FILE.read_text(encoding="utf-8"))

expected_count = sum(
    part.get("file_count", 0)
    for part in index.get("parts", [])
)

print("\nChecking archive integrity...")

try:
    with tarfile.open(ARCHIVE_FILE, mode="r:*") as archive:
        members = archive.getmembers()

        pdf_members = [
            member for member in members
            if member.isfile() and member.name.lower().endswith(".pdf")
        ]

        print("Total archive entries:", len(members))
        print("PDF documents:", len(pdf_members))
        print("Expected from index:", expected_count)

        if len(pdf_members) != expected_count:
            raise ValueError(
                "PDF count does not match the published dataset index."
            )

        print("\nFirst 10 PDF filenames:")
        for member in pdf_members[:10]:
            print("-", member.name)

except Exception as error:
    print("Archive validation failed:", error)
    raise

size_mb = ARCHIVE_FILE.stat().st_size / (1024 * 1024)

print("\n========================================")
print("ARCHIVE DOWNLOADED AND VALIDATED")
print("File:", ARCHIVE_FILE)
print("Size:", round(size_mb, 2), "MB")
print("PDF documents:", len(pdf_members))
print("========================================")
