
from pathlib import Path
from collections import Counter
import json
import re
import csv

INPUT_FILE = Path("data/processed/supreme_court_2025.jsonl")
OUTPUT_DIR = Path("data/processed")

ALL_OUTPUT = OUTPUT_DIR / "supreme_court_2025_all_scored.csv"
CANDIDATE_OUTPUT = OUTPUT_DIR / "supreme_court_2025_candidates.csv"
SUMMARY_OUTPUT = OUTPUT_DIR / "supreme_court_2025_domain_summary.json"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Each term has a weight indicating how specifically it relates
# to the corresponding legal subject.

DOMAINS = {
    "commercial_contracts": [
        ("commercial dispute", 5),
        ("commercial courts act", 5),
        ("breach of contract", 5),
        ("construction contract", 5),
        ("supply agreement", 4),
        ("liquidated damages", 4),
        ("purchase order", 3),
        ("bank guarantee", 3),
        ("performance guarantee", 3),
        ("work order", 3),
        ("specific performance", 3),
        ("contractual", 2),
        ("tender", 2),
        ("contract", 1),
        ("agreement", 1),
        ("damages", 1),
    ],

    "arbitration": [
        ("international commercial arbitration", 5),
        ("arbitration and conciliation act", 5),
        ("arbitral tribunal", 5),
        ("arbitral award", 5),
        ("seat of arbitration", 5),
        ("appointment of arbitrator", 5),
        ("arbitration agreement", 4),
        ("arbitration", 3),
        ("arbitrator", 2),
        ("section 34", 2),
        ("section 11", 2),
    ],

    "corporate_insolvency": [
        ("insolvency and bankruptcy code", 5),
        ("committee of creditors", 5),
        ("resolution professional", 4),
        ("resolution plan", 4),
        ("corporate debtor", 4),
        ("insolvency", 3),
        ("liquidation", 2),
        ("operational creditor", 4),
        ("financial creditor", 4),
    ],

    "consumer_disputes": [
        ("consumer protection act", 5),
        ("deficiency in service", 5),
        ("unfair trade practice", 5),
        ("consumer commission", 5),
        ("product liability", 4),
        ("consumer dispute", 4),
        ("consumer", 2),
    ],

    "property_disputes": [
        ("transfer of property act", 5),
        ("land acquisition", 4),
        ("title to property", 4),
        ("property dispute", 4),
        ("sale deed", 3),
        ("lease deed", 3),
        ("specific performance", 3),
        ("eviction", 2),
        ("landlord", 1),
        ("tenant", 1),
    ],

    "employment_labour": [
        ("industrial disputes act", 5),
        ("industrial dispute", 4),
        ("termination of service", 4),
        ("reinstatement", 3),
        ("back wages", 3),
        ("service rules", 2),
        ("service law", 2),
        ("employment", 1),
        ("workman", 2),
        ("labour", 1),
        ("dismissal", 1),
    ],
}

# Build a single regex to scan each judgment efficiently.
TERM_DOMAINS = {}

for domain, terms in DOMAINS.items():
    for term, weight in terms:
        TERM_DOMAINS.setdefault(term, []).append((domain, weight))

sorted_terms = sorted(
    TERM_DOMAINS.keys(),
    key=len,
    reverse=True
)

combined_pattern = re.compile(
    r"(?<![a-z0-9])("
    + "|".join(re.escape(term) for term in sorted_terms)
    + r")(?![a-z0-9])",
    re.IGNORECASE
)

MINIMUM_SCORE = 6
MAX_PER_DOMAIN = 40

# -----------------------------------------
# LOAD AND SCORE JUDGMENTS
# -----------------------------------------

if not INPUT_FILE.exists():
    raise FileNotFoundError(
        "Corpus file not found: " + str(INPUT_FILE)
    )

print("\nLoading 2025 Supreme Court corpus...\n")

all_records = []
domain_pools = {
    domain: [] for domain in DOMAINS
}

with INPUT_FILE.open("r", encoding="utf-8") as file:

    for line_number, line in enumerate(file, 1):

        record = json.loads(line)

        if record.get("extraction_status") != "extracted":
            continue

        text = record.get("judgment_text") or ""
        title = record.get("title") or ""

        text_counts = Counter(
            match.group(1).lower()
            for match in combined_pattern.finditer(text)
        )

        title_counts = Counter(
            match.group(1).lower()
            for match in combined_pattern.finditer(title)
        )

        scores = {
            domain: 0 for domain in DOMAINS
        }

        hits = {
            domain: [] for domain in DOMAINS
        }

        for term, count in text_counts.items():
            for domain, weight in TERM_DOMAINS[term]:
                contribution = weight * min(count, 4)
                scores[domain] += contribution

                hits[domain].append(
                    {
                        "term": term,
                        "count": count,
                        "source": "judgment_text",
                        "weight": weight
                    }
                )

        for term, count in title_counts.items():
            for domain, weight in TERM_DOMAINS[term]:
                contribution = weight * min(count, 2) * 3
                scores[domain] += contribution

                hits[domain].append(
                    {
                        "term": term,
                        "count": count,
                        "source": "case_title",
                        "weight": weight
                    }
                )

        candidate_domains = [
            domain
            for domain, score in scores.items()
            if score >= MINIMUM_SCORE
        ]

        candidate_domains.sort(
            key=lambda domain: scores[domain],
            reverse=True
        )

        # Find an actual text excerpt supporting the screening result.
        excerpt = ""

        first_matches = list(
            combined_pattern.finditer(text)
        )

        if first_matches:
            position = first_matches[0].start()
            excerpt = text[
                max(0, position - 250):
                min(len(text), position + 650)
            ].replace("\n", " ")

        record_output = {
            "case_id": record.get("case_id"),
            "title": title,
            "petitioner": record.get("petitioner"),
            "respondent": record.get("respondent"),
            "citation": record.get("citation"),
            "court": record.get("court"),
            "decision_date": record.get("decision_date"),
            "judge": record.get("judge"),
            "disposal_nature": record.get("disposal_nature"),
            "pdf_filename": record.get("pdf_filename"),
            "source_url": record.get("source_url"),
            "sha256": record.get("sha256"),
            "page_count": record.get("page_count"),
            "text_char_count": len(text),
            "candidate_domains": candidate_domains,
            "domain_scores": scores,
            "matched_terms": hits,
            "evidence_excerpt": excerpt,
            "_record": record
        }

        all_records.append(record_output)

        for domain in candidate_domains:
            domain_pools[domain].append(record_output)

        if line_number % 100 == 0:
            print(
                "Screened:",
                line_number,
                "records"
            )

# -----------------------------------------
# CREATE REVIEW SHORTLIST
# -----------------------------------------

selected = {}

print("\n========== DOMAIN SCREENING ==========\n")

summary = {}

for domain, pool in domain_pools.items():

    pool.sort(
        key=lambda item: item["domain_scores"][domain],
        reverse=True
    )

    chosen = pool[:MAX_PER_DOMAIN]

    for item in chosen:
        key = item["case_id"] or item["pdf_filename"]
        selected[key] = item

    summary[domain] = {
        "records_above_minimum_score": len(pool),
        "shortlisted": len(chosen),
        "minimum_score": MINIMUM_SCORE
    }

    print(
        domain,
        "| Candidates:",
        len(pool),
        "| Shortlisted:",
        len(chosen)
    )

# -----------------------------------------
# EXPORT CSV FILES
# -----------------------------------------

def export_csv(path, records):

    fields = [
        "case_id",
        "title",
        "petitioner",
        "respondent",
        "citation",
        "court",
        "decision_date",
        "judge",
        "disposal_nature",
        "pdf_filename",
        "source_url",
        "sha256",
        "page_count",
        "text_char_count",
        "candidate_domains",
        "domain_scores",
        "matched_terms",
        "evidence_excerpt"
    ]

    with path.open(
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fields
        )

        writer.writeheader()

        for record in records:

            row = {
                key: record.get(key)
                for key in fields
            }

            for key in [
                "candidate_domains",
                "domain_scores",
                "matched_terms"
            ]:
                row[key] = json.dumps(
                    row[key],
                    ensure_ascii=False
                )

            writer.writerow(row)


all_records.sort(
    key=lambda item: max(
        item["domain_scores"].values()
    ),
    reverse=True
)

candidate_records = sorted(
    selected.values(),
    key=lambda item: max(
        item["domain_scores"].values()
    ),
    reverse=True
)

export_csv(ALL_OUTPUT, all_records)
export_csv(CANDIDATE_OUTPUT, candidate_records)

summary_output = {
    "source": "AWS Indian Supreme Court Judgments",
    "source_year": 2025,
    "total_extracted_records": len(all_records),
    "shortlisted_unique_records": len(candidate_records),
    "minimum_screening_score": MINIMUM_SCORE,
    "maximum_per_domain": MAX_PER_DOMAIN,
    "domains": summary,
    "review_required": True
}

SUMMARY_OUTPUT.write_text(
    json.dumps(summary_output, indent=2),
    encoding="utf-8"
)

print("\n========================================")
print("LEGAL DOMAIN SCREENING COMPLETE")
print("========================================")
print("Extracted records:", len(all_records))
print("Unique shortlist:", len(candidate_records))
print("All records:", ALL_OUTPUT)
print("Candidate list:", CANDIDATE_OUTPUT)
print("Domain summary:", SUMMARY_OUTPUT)
print("\nIMPORTANT: Human legal relevance review is required.")
print("========================================")
