#!/usr/bin/env python3
"""
Expand Legal Database for Assess Your File
===========================================
Expands the curated Indian Supreme Court (2025) judgment dataset
from 32 records to approximately 100-120 unique records across
the six target domains:
  1. Commercial and contractual disputes
  2. Arbitration
  3. Corporate insolvency (IBC)
  4. Consumer disputes
  5. Property disputes
  6. Employment and labour matters

Rules:
- Retains all 32 existing records unmodified.
- Screens candidates using their actual full judgment text.
- Prioritises substantive judgments deciding real legal issues.
- Does NOT invent citations, case names, outcomes or metadata.
- Idempotent and reproducible.
"""

from pathlib import Path
import json
import csv
import re
from collections import defaultdict, Counter

CORPUS_FILE = Path("data/processed/supreme_court_2025.jsonl")
CURATED_FILE = Path("data/processed/curated_supreme_court_2025.jsonl")
MANIFEST_FILE = Path("data/processed/curated_supreme_court_2025_manifest.csv")
CANDIDATES_CSV = Path("data/processed/supreme_court_2025_candidates.csv")

TARGET_MIN_TOTAL = 105
TARGET_MAX_TOTAL = 120

# Substantive scoring keywords per domain with weights
DOMAIN_SCORING = {
    "commercial_contracts": [
        (r"\bbreach of contract\b", 5),
        (r"\bcommercial courts act\b", 5),
        (r"\bliquidated damages\b", 5),
        (r"\bspecific performance\b", 4),
        (r"\btender condition\b|\bcontractual clause\b", 4),
        (r"\bperformance guarantee\b|\bbank guarantee\b", 4),
        (r"\btermination of contract\b|\bforfeiture\b", 4),
        (r"\bsection 73\b|\bsection 74\b|\bindian contract act\b", 4),
        (r"\btime is of the essence\b", 3),
        (r"\bcommercial dispute\b", 3),
    ],
    "arbitration": [
        (r"\barbitration and conciliation act\b", 5),
        (r"\bsection 34\b", 5),
        (r"\bsection 11\b", 5),
        (r"\barbitral tribunal\b|\barbitral award\b", 5),
        (r"\bpatent illegality\b", 5),
        (r"\bseat of arbitration\b", 4),
        (r"\bappointment of arbitrator\b", 4),
        (r"\barbitration agreement\b", 4),
        (r"\bsection 9\b|\binterim measure\b", 3),
        (r"\bcompetence-competence\b|\bkompetenz\b", 3),
    ],
    "corporate_insolvency": [
        (r"\binsolvency and bankruptcy code\b|\bibc\b", 5),
        (r"\bcommittee of creditors\b|\bcoc\b", 5),
        (r"\bresolution plan\b", 5),
        (r"\bcorporate debtor\b", 4),
        (r"\bresolution professional\b", 4),
        (r"\bcorporate insolvency resolution process\b|\bcirp\b", 4),
        (r"\bfinancial creditor\b|\boperational creditor\b", 4),
        (r"\bsection 7\b|\bsection 9\b|\bsection 31\b", 3),
        (r"\bnclt\b|\bnclat\b", 3),
        (r"\bmoratorium\b", 3),
    ],
    "consumer_disputes": [
        (r"\bconsumer protection act\b", 5),
        (r"\bdeficiency in service\b", 5),
        (r"\bunfair trade practice\b", 5),
        (r"\bnational consumer disputes redressal commission\b|\bncdrc\b", 5),
        (r"\bstate consumer\b|\bdistrict forum\b|\bdistrict commission\b", 4),
        (r"\ballottee\b|\bdelay in possession\b|\bflat buyer\b", 4),
        (r"\bmedical negligence\b", 4),
        (r"\bcompensation for deficiency\b", 4),
        (r"\bconsumer dispute\b", 3),
        (r"\brefund with interest\b", 3),
    ],
    "property_disputes": [
        (r"\btransfer of property act\b", 5),
        (r"\bsale deed\b|\bagreement to sell\b", 5),
        (r"\bspecific performance of contract\b", 5),
        (r"\btitle and possession\b|\bdeclaration of title\b", 5),
        (r"\blis pendens\b|\bsection 52\b", 4),
        (r"\bevict(?:ion)?\b|\btenant\b|\blandlord\b", 4),
        (r"\bpartition suit\b|\bco-sharer\b", 4),
        (r"\bregistration act\b", 3),
        (r"\binjunction\b", 3),
        (r"\badverse possession\b", 3),
    ],
    "employment_labour": [
        (r"\bindustrial disputes act\b", 5),
        (r"\breinstatement\b|\bback wages\b", 5),
        (r"\btermination of service\b|\bdismissal from service\b", 5),
        (r"\bretrenchment\b|\bsection 25f\b", 5),
        (r"\blabour court\b|\bindustrial tribunal\b", 4),
        (r"\bworkman\b|\bworkmen\b", 4),
        (r"\bdisciplinary enquiry\b|\bdepartmental enquiry\b", 4),
        (r"\bcontinuous service\b", 3),
        (r"\bseniority\b|\bpromotion\b", 3),
        (r"\bcompulsory retirement\b", 3),
    ],
}

def score_judgment_substance(text: str, domain: str) -> float:
    """Scores how substantively a judgment addresses the domain based on actual text."""
    text_lower = text.lower()
    score = 0.0

    patterns = DOMAIN_SCORING.get(domain, [])
    for pattern, weight in patterns:
        matches = len(re.findall(pattern, text_lower))
        if matches > 0:
            # Diminishing returns for repeated mentions to favor depth over repetition
            score += weight * (1.0 + min(matches - 1, 5) * 0.4)

    # Substantive decision markers (gives bonus if court actually adjudicated)
    decision_markers = [
        r"\bwe are of the considered view\b",
        r"\bthe question that arises for consideration\b",
        r"\bimpugned judgment\b",
        r"\bthe appeal is (?:allowed|dismissed)\b",
        r"\bfor the reasons recorded\b",
        r"\bsettled principle of law\b",
        r"\bheld that\b",
    ]
    for marker in decision_markers:
        if re.search(marker, text_lower):
            score += 1.5

    return score

def main():
    print("=" * 60)
    print("EXPANDING PRECEDENT DATABASE (SUPREME COURT 2025)")
    print("=" * 60)

    # 1. Load existing 32 curated cases
    if not CURATED_FILE.exists():
        raise FileNotFoundError(f"Existing curated file missing: {CURATED_FILE}")

    existing_curated = []
    existing_case_ids = set()

    with CURATED_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rec = json.loads(line)
                existing_curated.append(rec)
                existing_case_ids.add(rec["case_id"])

    print(f"Loaded {len(existing_curated)} existing curated cases (must retain all).")

    # 2. Load all 897 judgments from corpus
    print("Loading extracted 2025 corpus...")
    corpus = {}
    with CORPUS_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rec = json.loads(line)
                corpus[rec["case_id"]] = rec

    print(f"Total corpus judgments available: {len(corpus)}")

    # 3. Load candidates from CSV
    candidates_meta = {}
    with CANDIDATES_CSV.open("r", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            cid = row.get("case_id") or row.get("\ufeffcase_id")
            if cid:
                candidates_meta[cid] = row

    print(f"Candidate metadata entries: {len(candidates_meta)}")

    # 4. Score non-curated candidate judgments
    non_curated_ids = [
        cid for cid in candidates_meta.keys()
        if cid not in existing_case_ids and cid in corpus
    ]
    print(f"Candidates to screen for addition: {len(non_curated_ids)}")

    candidates_by_domain = defaultdict(list)

    for cid in non_curated_ids:
        raw_rec = corpus[cid]
        text = raw_rec.get("judgment_text", "")

        # Skip trivial or very short orders (< 2,500 characters)
        if len(text) < 2500 or raw_rec.get("extraction_status") != "extracted":
            continue

        meta = candidates_meta.get(cid, {})
        candidate_doms = []
        try:
            candidate_doms = json.loads(meta.get("candidate_domains", "[]"))
        except Exception:
            pass

        # Evaluate score for each domain
        domain_scores = {}
        for dom in DOMAIN_SCORING.keys():
            s = score_judgment_substance(text, dom)
            if s >= 8.0:  # Threshold for substantive relevance
                domain_scores[dom] = s

        if not domain_scores:
            continue

        # Primary domain is highest substantive score
        best_domain = max(domain_scores.items(), key=lambda x: x[1])[0]
        secondary_domains = [d for d, s in domain_scores.items() if d != best_domain and s >= 12.0]

        all_tags = [best_domain] + secondary_domains

        candidates_by_domain[best_domain].append({
            "case_id": cid,
            "primary_domain": best_domain,
            "all_tags": all_tags,
            "score": domain_scores[best_domain],
            "text_char_count": len(text),
            "page_count": raw_rec.get("page_count", 0),
            "record": raw_rec
        })

    print("\nQualified substantive candidates per domain:")
    for dom, items in sorted(candidates_by_domain.items()):
        print(f"  {dom}: {len(items)} qualified candidates")

    # 5. Determine quota per domain to reach ~108-112 total cases
    # Target counts in final dataset:
    # Existing 32 counts:
    # arbitration: 10, commercial_contracts: 5, corporate_insolvency: 6,
    # consumer_disputes: 4, property_disputes: 5, employment_labour: 5
    #
    # We want roughly 16-20 total per domain!
    targets_to_add = {
        "commercial_contracts": 14,  # -> 19 total
        "arbitration": 10,           # -> 20 total
        "corporate_insolvency": 12,  # -> 18 total
        "consumer_disputes": 12,     # -> 16 total
        "property_disputes": 15,     # -> 20 total
        "employment_labour": 15,     # -> 20 total
    }

    selected_new = []
    selected_new_ids = set()

    for dom, target in targets_to_add.items():
        pool = candidates_by_domain.get(dom, [])
        # Sort by substantive score descending
        pool.sort(key=lambda x: x["score"], reverse=True)

        added_for_dom = 0
        for item in pool:
            if added_for_dom >= target:
                break
            if item["case_id"] not in selected_new_ids:
                selected_new.append(item)
                selected_new_ids.add(item["case_id"])
                added_for_dom += 1

        print(f"Selected {added_for_dom} new cases for domain '{dom}'.")

    total_count = len(existing_curated) + len(selected_new)
    print(f"\nTotal selected: {len(existing_curated)} existing + {len(selected_new)} new = {total_count} judgments.")
    assert TARGET_MIN_TOTAL <= total_count <= TARGET_MAX_TOTAL, f"Count {total_count} outside target range!"

    # 6. Format newly selected records preserving exact original schema
    expanded_dataset = list(existing_curated)

    for item in selected_new:
        rec = item["record"]
        new_rec = dict(rec)
        new_rec["domain_tags"] = item["all_tags"]
        new_rec["legal_review_status"] = "pending"
        new_rec["source_match_status"] = "matched_to_aws_metadata"
        new_rec["publication_status"] = "not_approved"
        expanded_dataset.append(new_rec)

    # 7. Write out expanded JSONL
    print(f"\nWriting {len(expanded_dataset)} records to {CURATED_FILE}...")
    with CURATED_FILE.open("w", encoding="utf-8") as f:
        for rec in expanded_dataset:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    # 8. Write manifest CSV
    print(f"Writing manifest to {MANIFEST_FILE}...")
    manifest_rows = []
    domain_counter = Counter()

    for rec in expanded_dataset:
        tags = rec.get("domain_tags", [])
        for t in tags:
            domain_counter[t] += 1

        manifest_rows.append({
            "case_id": rec.get("case_id"),
            "case_name": rec.get("title"),
            "citation": rec.get("citation"),
            "court": rec.get("court"),
            "judgment_date": rec.get("decision_date"),
            "domain_tags": ", ".join(tags) if isinstance(tags, list) else str(tags),
            "pdf_filename": rec.get("pdf_filename"),
            "source_url": rec.get("source_url"),
            "page_count": rec.get("page_count"),
            "text_char_count": rec.get("text_char_count"),
            "sha256": rec.get("sha256"),
            "legal_review_status": rec.get("legal_review_status", "pending"),
            "publication_status": rec.get("publication_status", "not_approved")
        })

    fieldnames = [
        "case_id", "case_name", "citation", "court", "judgment_date",
        "domain_tags", "pdf_filename", "source_url", "page_count",
        "text_char_count", "sha256", "legal_review_status", "publication_status"
    ]

    with MANIFEST_FILE.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manifest_rows)

    print("\n" + "=" * 60)
    print(f"SUCCESS: Expanded database to {len(expanded_dataset)} unique Supreme Court judgments.")
    print("=" * 60)
    print("Domain distribution across expanded database:")
    for dom in ["commercial_contracts", "arbitration", "corporate_insolvency", "consumer_disputes", "property_disputes", "employment_labour"]:
        print(f"  - {dom}: {domain_counter[dom]} judgments")

if __name__ == "__main__":
    main()
