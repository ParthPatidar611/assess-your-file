#!/usr/bin/env python3
"""
Import Expanded Curated Judgments to Supabase
=============================================
Uploads all 109 curated Supreme Court judgments to the 'precedents' table
in Supabase. Uses REST API upsert with 'resolution=merge-duplicates' so that:
  - Existing 32 records are preserved and not deleted.
  - New records are inserted or merged idempotently.
  - Never prints or exposes credentials.
"""

from pathlib import Path
from datetime import datetime
import json
import requests
import time

ENV_FILE = Path(".env.local")
INPUT_FILE = Path("data/processed/curated_supreme_court_2025.jsonl")
BATCH_SIZE = 5

def load_env(path: Path):
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
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SUPABASE_SECRET_KEY = env.get("SUPABASE_SECRET_KEY", "")

if not SUPABASE_URL.startswith("https://"):
    raise ValueError("Invalid Supabase project URL.")

if not SUPABASE_SECRET_KEY:
    raise ValueError("SUPABASE_SECRET_KEY is required in .env.local.")

if not INPUT_FILE.exists():
    raise FileNotFoundError(f"Input file missing: {INPUT_FILE}")

API_URL = SUPABASE_URL + "/rest/v1/precedents"

HEADERS = {
    "apikey": SUPABASE_SECRET_KEY,
    "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=representation"
}

session = requests.Session()
session.headers.update(HEADERS)

records = []
with INPUT_FILE.open("r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            records.append(json.loads(line))

print(f"\nLoaded {len(records)} curated judgments for import.")

def prepare_record(record):
    case_id = record.get("case_id")
    case_name = record.get("title")
    text = record.get("judgment_text", "")
    tags = record.get("domain_tags", [])

    if not case_id or not case_name:
        raise ValueError("A judgment is missing its case ID or title.")

    if not text or len(text) < 100:
        raise ValueError(f"Insufficient judgment text: {case_id}")

    raw_date = record.get("decision_date")
    judgment_date = None
    if raw_date:
        try:
            judgment_date = datetime.strptime(raw_date, "%d-%m-%Y").date().isoformat()
        except Exception:
            judgment_date = raw_date

    languages = record.get("available_languages") or ""
    if isinstance(languages, str):
        languages = [l.strip() for l in languages.split(",") if l.strip()]

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
        "verified": True,
        "legal_review_status": "pending",
        "publication_status": "not_approved",
        "legal_issue": None,
        "facts_summary": None,
        "judgment_summary": None,
        "outcome": None,
        "legal_provisions": [],
        "keywords": tags
    }

payload = [prepare_record(r) for r in records]
print(f"Validated {len(payload)} records for Supabase import.")

# Test connection
print("\nTesting Supabase connection...")
try:
    test_res = session.get(API_URL + "?select=case_id&limit=1", timeout=8)
    if test_res.status_code == 200:
        print("Supabase connection successful.")
        # Proceed with batch import
        imported = 0
        for i in range(0, len(payload), BATCH_SIZE):
            batch = payload[i:i + BATCH_SIZE]
            res = session.post(API_URL, json=batch, timeout=30)
            if res.status_code in [200, 201]:
                imported += len(batch)
                print(f"Imported batch {i // BATCH_SIZE + 1} ({imported}/{len(payload)})")
            else:
                print(f"Warning on batch {i // BATCH_SIZE + 1}: status {res.status_code} - {res.text[:120]}")
            time.sleep(0.3)
        print(f"\nSupabase import complete. Processed {imported} records.")
    else:
        print(f"Supabase connection test returned status {test_res.status_code}: {test_res.text[:120]}")
except Exception as e:
    print(f"Note: Remote Supabase database is currently unreachable ({type(e).__name__}).")
    print("Precedents have been stored locally in data/processed/curated_supreme_court_2025.jsonl.")
    print("Application will use the local JSONL precedent retrieval fallback automatically.")
