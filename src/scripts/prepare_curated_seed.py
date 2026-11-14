
from pathlib import Path
import json
import csv

INPUT = Path("data/processed/supreme_court_2025.jsonl")
OUTPUT = Path("data/processed/curated_supreme_court_2025.jsonl")
MANIFEST = Path("data/processed/curated_supreme_court_2025_manifest.csv")

CURATED_CASES = {
    "2025 INSC 236": ["commercial_contracts"],
    "2025 INSC 574": ["commercial_contracts", "arbitration"],
    "2025 INSC 640": ["commercial_contracts", "arbitration"],
    "2025 INSC 696": ["commercial_litigation", "mediation"],
    "2025 INSC 1401": ["commercial_contracts", "arbitration"],

    "2025 INSC 616": ["arbitration"],
    "2025 INSC 507": ["arbitration"],
    "2025 INSC 605": ["arbitration"],
    "2025 INSC 665": ["arbitration"],
    "2025 INSC 698": ["arbitration"],
    "2025 INSC 352": ["international_commercial_arbitration"],
    "2025 INSC 874": ["arbitration", "commercial_contracts"],

    "2025 INSC 421": ["corporate_insolvency"],
    "2025 INSC 124": ["corporate_insolvency", "competition"],
    "2025 INSC 525": ["corporate_insolvency", "arbitration"],
    "2025 INSC 25": ["corporate_insolvency"],
    "2025 INSC 401": ["corporate_insolvency"],
    "2025 INSC 1086": ["corporate_insolvency", "real_estate"],

    "2025 INSC 288": ["consumer_disputes", "banking"],
    "2025 INSC 143": ["consumer_disputes", "real_estate"],
    "2025 INSC 1314": ["consumer_disputes", "software"],
    "2025 INSC 1094": ["consumer_disputes", "medical_negligence"],

    "2025 INSC 213": ["property_disputes", "sale_agreements"],
    "2025 INSC 121": ["property_disputes", "lis_pendens"],
    "2025 INSC 490": ["property_disputes", "sale_agreements"],
    "2025 INSC 772": ["property_disputes", "property_title"],
    "2025 INSC 1059": ["property_disputes", "property_title"],

    "2025 INSC 218": ["employment_labour", "service_law"],
    "2025 INSC 144": ["employment_labour", "retrenchment"],
    "2025 INSC 442": ["employment_labour", "service_law"],
    "2025 INSC 801": ["employment_labour", "industrial_closure"],
    "2025 INSC 920": ["employment_labour", "disability_rights"]
}

def main():
    if not INPUT.exists():
        raise FileNotFoundError(f"Corpus missing: {INPUT}")

    found = {}

    with INPUT.open("r", encoding="utf-8") as file:
        for line in file:
            record = json.loads(line)
            case_id = record.get("case_id")

            if case_id in CURATED_CASES:
                if case_id in found:
                    raise ValueError(f"Duplicate case: {case_id}")

                if record.get("extraction_status") != "extracted":
                    raise ValueError(f"Text not extracted: {case_id}")

                found[case_id] = record

    missing = sorted(set(CURATED_CASES) - set(found))

    if missing:
        raise ValueError("Missing cases: " + ", ".join(missing))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    manifest_rows = []

    with OUTPUT.open("w", encoding="utf-8") as output:
        for case_id, tags in CURATED_CASES.items():
            record = dict(found[case_id])

            record["domain_tags"] = tags
            record["legal_review_status"] = "pending"
            record["source_match_status"] = "matched_to_aws_metadata"
            record["publication_status"] = "not_approved"

            output.write(json.dumps(record, ensure_ascii=False) + "\n")

            manifest_rows.append({
                "case_id": case_id,
                "case_name": record.get("title"),
                "citation": record.get("citation"),
                "court": record.get("court"),
                "judgment_date": record.get("decision_date"),
                "domain_tags": ", ".join(tags),
                "pdf_filename": record.get("pdf_filename"),
                "source_url": record.get("source_url"),
                "page_count": record.get("page_count"),
                "text_char_count": record.get("text_char_count"),
                "sha256": record.get("sha256"),
                "legal_review_status": "pending",
                "publication_status": "not_approved"
            })

    with MANIFEST.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=list(manifest_rows[0]))
        writer.writeheader()
        writer.writerows(manifest_rows)

    print("\n========================================")
    print("CURATED DATASET PREPARED")
    print("========================================")
    print("Selected genuine judgments:", len(found))
    print("Expected judgments:", len(CURATED_CASES))
    print("Missing judgments:", len(missing))
    print("Complete extracted texts: YES")
    print("Dataset:", OUTPUT)
    print("Manifest:", MANIFEST)
    print("Legal review: PENDING")
    print("Publication: NOT APPROVED")
    print("========================================")

if __name__ == "__main__":
    main()
