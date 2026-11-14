
from pathlib import Path
from datetime import datetime
import json
import requests
import time

# =========================================
# CONFIGURATION
# =========================================

ENV_FILE = Path(".env.local")

INPUT_FILE = Path(
    "data/processed/curated_supreme_court_2025.jsonl"
)

BATCH_SIZE = 3

# =========================================
# LOAD ENVIRONMENT VARIABLES
# =========================================

def load_env(path):
    if not path.exists():
        raise FileNotFoundError(".env.local not found.")

    values = {}

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")

    return values


env = load_env(ENV_FILE)

SUPABASE_URL = (
    env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
)

SUPABASE_SECRET_KEY = env.get("SUPABASE_SECRET_KEY", "")

if not SUPABASE_URL.startswith("https://"):
    raise ValueError("Invalid Supabase project URL.")

if not SUPABASE_SECRET_KEY.startswith("sb_secret_"):
    raise ValueError(
        "A valid sb_secret_ key is required in .env.local."
    )

if not INPUT_FILE.exists():
    raise FileNotFoundError(INPUT_FILE)

# =========================================
# PREPARE SUPABASE REST API
# =========================================

API_URL = SUPABASE_URL + "/rest/v1/precedents"

HEADERS = {
    "apikey": SUPABASE_SECRET_KEY,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=representation"
}

session = requests.Session()
session.headers.update(HEADERS)

# =========================================
# LOAD CURATED JUDGMENTS
# =========================================

records = []

with INPUT_FILE.open("r", encoding="utf-8") as file:
    for line in file:
        if line.strip():
            records.append(json.loads(line))

if len(records) != 32:
    raise ValueError(
        f"Expected 32 records, found {len(records)}. "
        "Check the curated dataset before importing."
    )

print("\nLoaded", len(records), "curated judgments.")

# =========================================
# CONVERT ORIGINAL RECORDS
# =========================================

def prepare_record(record):

    case_id = record.get("case_id")
    case_name = record.get("title")
    text = record.get("judgment_text", "")
    tags = record.get("domain_tags", [])

    if not case_id or not case_name:
        raise ValueError("A judgment is missing its case ID or title.")

    if record.get("extraction_status") != "extracted":
        raise ValueError(f"Text extraction failed: {case_id}")

    if not text or len(text) < 100:
        raise ValueError(f"Insufficient judgment text: {case_id}")

    if not record.get("source_url", "").startswith("https://"):
        raise ValueError(f"Invalid source URL: {case_id}")

    if not record.get("sha256"):
        raise ValueError(f"Missing document hash: {case_id}")

    raw_date = record.get("decision_date")

    judgment_date = (
        datetime.strptime(raw_date, "%d-%m-%Y").date().isoformat()
        if raw_date else None
    )

    languages = record.get("available_languages") or ""

    if isinstance(languages, str):
        languages = [
            lang.strip()
            for lang in languages.split(",")
            if lang.strip()
        ]

    return {
        "case_id": case_id,
        "case_name": case_name,
        "citation": record.get("citation"),
        "court": record.get("court") or "Supreme Court of India",
        "judgment_date": judgment_date,

        "domain": tags[0] if tags else "Other",
        "domain_tags": tags,

        "petitioner": record.get("petitioner"),
        "respondent": record.get("respondent"),
        "judge": record.get("judge"),
        "author_judge": record.get("author_judge"),
        "cnr": record.get("cnr"),
        "disposal_nature": record.get("disposal_nature"),
        "available_languages": languages,

        "judgment_text": text,
        "text_char_count": len(text),
        "page_count": record.get("page_count"),

        "source_url": record.get("source_url"),
        "source_file": record.get("pdf_filename"),
        "source_dataset": record.get("source_dataset"),
        "source_license": record.get("source_license"),
        "sha256": record.get("sha256"),
        "source_match_status": "matched_to_aws_metadata",

        # Source verified does not mean legally reviewed.
        "verified": True,
        "legal_review_status": "pending",
        "publication_status": "not_approved",

        # Do not invent legal summaries or outcomes.
        "legal_issue": None,
        "facts_summary": None,
        "judgment_summary": None,
        "outcome": None,
        "legal_provisions": [],
        "keywords": tags
    }


payload = [
    prepare_record(record)
    for record in records
]

case_ids = [record["case_id"] for record in payload]

if len(case_ids) != len(set(case_ids)):
    raise ValueError("Duplicate case IDs detected in import file.")

print("All 32 records passed local validation.")

# =========================================
# TEST DATABASE ACCESS
# =========================================

print("\nTesting Supabase connection...")

test_response = session.get(
    API_URL,
    params={
        "select": "case_id",
        "limit": "1"
    },
    timeout=30
)

if not test_response.ok:
    raise RuntimeError(
        "Supabase connection failed: "
        + test_response.text[:1000]
    )

print("Supabase connection successful.")

# =========================================
# IMPORT IN SMALL BATCHES
# =========================================

inserted_count = 0

for start in range(0, len(payload), BATCH_SIZE):

    batch = payload[start:start + BATCH_SIZE]

    response = session.post(
        API_URL,
        params={
            "on_conflict": "case_id",
            "select": "case_id,case_name"
        },
        json=batch,
        timeout=120
    )

    if not response.ok:
        raise RuntimeError(
            f"Import failed for batch {start // BATCH_SIZE + 1}.\n"
            f"HTTP status: {response.status_code}\n"
            f"Database response: {response.text[:2000]}"
        )

    imported = response.json()

    if len(imported) != len(batch):
        raise RuntimeError(
            "Returned record count does not match batch size."
        )

    inserted_count += len(imported)

    print(
        f"Imported {inserted_count}/{len(payload)} judgments"
    )

    time.sleep(0.2)

# =========================================
# FINAL VERIFICATION
# =========================================

verification_response = session.get(
    API_URL,
    params={
        "select": "case_id,legal_review_status,publication_status",
        "case_id": "in.(" + ",".join(case_ids) + ")",
        "limit": "100"
    },
    timeout=60
)

if not verification_response.ok:
    raise RuntimeError(
        "Import completed, but verification failed: "
        + verification_response.text[:1000]
    )

verified_records = verification_response.json()

if len(verified_records) != 32:
    raise RuntimeError(
        f"Expected 32 records in Supabase, found {len(verified_records)}."
    )

if any(
    row["legal_review_status"] != "pending"
    or row["publication_status"] != "not_approved"
    for row in verified_records
):
    raise RuntimeError("Review or publication status is incorrect.")

print("\n========================================")
print("SUPABASE IMPORT SUCCESSFUL")
print("========================================")
print("Records processed:", inserted_count)
print("Records verified:", len(verified_records))
print("Legal review status: PENDING")
print("Publication status: NOT APPROVED")
print("Duplicates prevented using: case_id")
print("========================================")

session.close()
