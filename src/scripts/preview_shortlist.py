
import csv
import json
from pathlib import Path

FILE = Path("data/processed/supreme_court_2025_all_scored.csv")
OUTPUT = Path("data/processed/judgment_review_preview.txt")

DOMAINS = [
    "commercial_contracts",
    "arbitration",
    "corporate_insolvency",
    "consumer_disputes",
    "property_disputes",
    "employment_labour"
]

if not FILE.exists():
    raise FileNotFoundError(FILE)

with FILE.open("r", encoding="utf-8-sig") as f:
    records = list(csv.DictReader(f))

report = []

def add(text=""):
    report.append(str(text))

for domain in DOMAINS:

    candidates = []

    for record in records:
        scores = json.loads(record["domain_scores"])

        if scores.get(domain, 0) >= 6:
            candidates.append(record)

    candidates.sort(
        key=lambda record: json.loads(
            record["domain_scores"]
        ).get(domain, 0),
        reverse=True
    )

    add("\n" + "=" * 85)
    add(domain.upper())
    add("=" * 85)
    add(f"Candidates found: {len(candidates)}")

    for index, record in enumerate(candidates[:8], 1):

        scores = json.loads(record["domain_scores"])
        terms_by_domain = json.loads(record["matched_terms"])

        # Retrieve only the terms belonging to this domain.
        domain_hits = terms_by_domain.get(domain, [])

        matching_terms = []

        for hit in domain_hits:
            if isinstance(hit, dict):
                matching_terms.append(
                    f"{hit.get('term')} "
                    f"(count: {hit.get('count')}, "
                    f"source: {hit.get('source')})"
                )

        add(f"\n{index}. {record.get('title')}")
        add(f"Case ID: {record.get('case_id')}")
        add(f"Citation: {record.get('citation')}")
        add(f"Date: {record.get('decision_date')}")
        add(f"Judge: {record.get('judge')}")
        add(f"Disposal: {record.get('disposal_nature')}")
        add(f"Domain score: {scores.get(domain, 0)}")
        add(f"PDF: {record.get('pdf_filename')}")
        add(f"Source: {record.get('source_url')}")

        add("Matching terms:")
        for term in matching_terms[:8]:
            add(f"  - {term}")

        add("Judgment excerpt:")
        add(record.get("evidence_excerpt", "No excerpt available."))

add("\n" + "=" * 85)
add("REVIEW PREVIEW COMPLETE")
add(f"Total corpus records: {len(records)}")
add("=" * 85)

OUTPUT.write_text("\n".join(report), encoding="utf-8")

print("\n".join(report))
print("\nFull review saved to:", OUTPUT)
