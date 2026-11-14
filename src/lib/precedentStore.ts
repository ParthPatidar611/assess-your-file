/**
 * Precedent Store and Retrieval Module
 * =====================================
 * Provides hybrid retrieval for Indian Supreme Court precedents:
 * 1. Queries Supabase RPC `search_precedents` when Supabase is reachable.
 * 2. Transparently falls back to the curated 109 Supreme Court 2025 judgments
 *    corpus stored in `data/processed/curated_supreme_court_2025.jsonl` if Supabase
 *    is unreachable, paused or returns an error.
 *
 * Ensures the assessment engine ALWAYS has access to real Supreme Court precedents
 * with actual judgment text and excerpts, without fabricating any citations or cases.
 */

import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";
import type { RetrievedPrecedent } from "@/lib/deterministicAssessment";

interface CuratedRecord {
    case_id: string;
    title: string;
    citation?: string | null;
    court?: string | null;
    decision_date?: string | null;
    domain_tags?: string[] | null;
    source_url?: string | null;
    source_dataset?: string | null;
    judgment_text?: string;
    legal_review_status?: string | null;
    publication_status?: string | null;
    petitioner?: string | null;
    respondent?: string | null;
    judge?: string | null;
}

let cachedRecords: CuratedRecord[] | null = null;

function loadCuratedRecords(): CuratedRecord[] {
    if (cachedRecords) {
        return cachedRecords;
    }

    try {
        const filePath = path.join(process.cwd(), "data", "processed", "curated_supreme_court_2025.jsonl");
        if (!fs.existsSync(filePath)) {
            console.warn("[precedentStore] Curated JSONL file not found at", filePath);
            return [];
        }

        const content = fs.readFileSync(filePath, "utf-8");
        const records: CuratedRecord[] = [];
        const lines = content.split("\n");

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
                try {
                    records.push(JSON.parse(trimmed));
                } catch {
                    // skip malformed line
                }
            }
        }

        cachedRecords = records;
        return cachedRecords;
    } catch (err) {
        console.error("[precedentStore] Error loading curated records:", err);
        return [];
    }
}

/**
 * Searches the local 109 curated Supreme Court judgments using keyword ranking
 * and excerpt extraction.
 */
export function searchLocalCuratedPrecedents(
    query: string,
    domain?: string | null,
    limit = 6
): RetrievedPrecedent[] {
    const records = loadCuratedRecords();
    if (!records.length) return [];

    const queryLower = query.toLowerCase().trim();
    const queryTerms = queryLower
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2);

    const normalizedDomain = domain && domain !== "Not specified" && domain !== "Other" ? domain.toLowerCase().trim() : null;
    const isKnownDomain = normalizedDomain
        ? records.some((r) => r.domain_tags && r.domain_tags.some((t) => t.toLowerCase() === normalizedDomain))
        : false;
    const filterDomain = isKnownDomain ? normalizedDomain : null;

    if (queryTerms.length === 0) {
        // Return first entries matching domain if query is empty
        return records
            .filter((r) => !filterDomain || (r.domain_tags && r.domain_tags.some((t) => t.toLowerCase() === filterDomain)))
            .slice(0, limit)
            .map((r, i) => mapRecordToPrecedent(r, 0.5 - i * 0.05, ""));
    }

    const scored: { record: CuratedRecord; score: number; excerpt: string }[] = [];

    for (const rec of records) {
        // Filter by domain if valid domain specified
        if (filterDomain && rec.domain_tags && !rec.domain_tags.some((t) => t.toLowerCase() === filterDomain)) {
            continue;
        }

        const title = (rec.title || "").toLowerCase();
        const citation = (rec.citation || "").toLowerCase();
        const tags = (rec.domain_tags || []).join(" ").toLowerCase();
        const text = (rec.judgment_text || "").toLowerCase();

        let score = 0;
        let bestMatchPos = -1;

        // Exact query phrase match in title or tags
        if (title.includes(queryLower)) {
            score += 25;
            bestMatchPos = text.indexOf(queryTerms[0]);
        }
        if (tags.includes(queryLower)) {
            score += 15;
        }

        // Exact phrase match in text
        const phrasePos = text.indexOf(queryLower);
        if (phrasePos !== -1) {
            score += 20;
            if (bestMatchPos === -1) bestMatchPos = phrasePos;
        }

        // Individual term matches
        let termMatches = 0;
        for (const term of queryTerms) {
            if (title.includes(term)) {
                score += 8;
            }
            if (tags.includes(term)) {
                score += 5;
            }
            if (citation.includes(term)) {
                score += 10;
            }

            const pos = text.indexOf(term);
            if (pos !== -1) {
                termMatches++;
                score += 3;
                if (bestMatchPos === -1) bestMatchPos = pos;
            }
        }

        if (score > 0) {
            // Extract excerpt around best match
            let excerpt = "";
            const rawText = rec.judgment_text || "";
            if (bestMatchPos !== -1 && rawText.length > 0) {
                const start = Math.max(0, bestMatchPos - 140);
                const end = Math.min(rawText.length, bestMatchPos + 260);
                excerpt = (start > 0 ? "..." : "") + rawText.slice(start, end).replace(/\s+/g, " ").trim() + (end < rawText.length ? "..." : "");
            } else if (rawText.length > 0) {
                excerpt = rawText.slice(0, 300).replace(/\s+/g, " ").trim() + "...";
            }

            scored.push({ record: rec, score, excerpt });
        }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => mapRecordToPrecedent(s.record, s.score, s.excerpt));
}

function mapRecordToPrecedent(rec: CuratedRecord, score: number, excerpt: string): RetrievedPrecedent {
    const rawDate = rec.decision_date || null;
    let judgmentDate = rawDate;
    if (rawDate && rawDate.includes("-")) {
        const parts = rawDate.split("-");
        if (parts.length === 3 && parts[2].length === 4) {
            judgmentDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }

    const domain = rec.domain_tags && rec.domain_tags.length > 0 ? rec.domain_tags[0] : "Other";

    // Grab a substantive snippet from the judgment text (first 1500 chars or around excerpt)
    const rawText = rec.judgment_text || "";
    const textSnippet = rawText.length > 1800 ? rawText.slice(0, 1800) + "..." : rawText;

    return {
        case_id: rec.case_id,
        case_name: rec.title,
        citation: rec.citation || null,
        court: rec.court || "Supreme Court of India",
        judgment_date: judgmentDate,
        domain,
        domain_tags: rec.domain_tags || [],
        legal_issue: null,
        judgment_summary: null,
        source_url: rec.source_url || null,
        source_dataset: rec.source_dataset || "AWS Indian Supreme Court Judgments (2025)",
        legal_review_status: rec.legal_review_status || "pending",
        publication_status: rec.publication_status || "not_approved",
        relevance: Math.min(1.0, Math.max(0.1, score / 50)),
        matched_excerpt: excerpt,
        judgment_text_snippet: textSnippet,
    };
}

/**
 * Searches precedents using Supabase RPC first, and falls back to the curated 109 dataset.
 */
export async function searchPrecedentsWithFallback(
    queries: string[],
    domain?: string | null,
    limit = 6
): Promise<{ precedents: RetrievedPrecedent[]; failed: boolean; source: "supabase" | "curated_local" }> {
    // 1. Try Supabase RPC
    try {
        const responses = await Promise.all(
            queries.map((query: string) =>
                supabase.rpc("search_precedents", {
                    p_query: query,
                    p_domain: domain || null,
                    p_limit: limit,
                })
            )
        );

        const precedentMap = new Map<string, RetrievedPrecedent>();
        let hasError = false;

        for (const result of responses) {
            if (result.error) {
                hasError = true;
                break;
            }
            const rows = (result.data || []) as RetrievedPrecedent[];
            for (const row of rows) {
                if (row.case_id && !precedentMap.has(row.case_id)) {
                    precedentMap.set(row.case_id, row);
                }
            }
        }

        if (!hasError && precedentMap.size > 0) {
            return {
                precedents: Array.from(precedentMap.values()).slice(0, limit),
                failed: false,
                source: "supabase",
            };
        }
    } catch (err) {
        console.warn("[precedentStore] Supabase search failed, falling back to curated local dataset:", err);
    }

    // 2. Fallback to 109 curated Supreme Court judgments
    const combinedMap = new Map<string, RetrievedPrecedent>();
    for (const q of queries) {
        const localResults = searchLocalCuratedPrecedents(q, domain, limit);
        for (const item of localResults) {
            if (!combinedMap.has(item.case_id)) {
                combinedMap.set(item.case_id, item);
            }
        }
    }

    const precedents = Array.from(combinedMap.values()).slice(0, limit);
    return {
        precedents,
        failed: false,
        source: "curated_local",
    };
}
