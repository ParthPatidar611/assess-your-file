import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { searchPrecedentsWithFallback, searchLocalCuratedPrecedents } from "@/lib/precedentStore";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);

        const query = (url.searchParams.get("q") || "").trim();
        const domain = (url.searchParams.get("domain") || "").trim() || null;

        const rawLimit = Number(url.searchParams.get("limit") || 8);
        const limit = Number.isFinite(rawLimit)
            ? Math.min(Math.max(Math.floor(rawLimit), 1), 20)
            : 8;

        // No search query: verify database connectivity or return curated sample
        if (!query) {
            try {
                const { data, error, count } = await supabase
                    .from("precedents")
                    .select(
                        "case_id, case_name, citation, court, judgment_date, domain_tags, legal_review_status, source_url",
                        { count: "exact" }
                    )
                    .eq("verified", true)
                    .limit(5);

                if (!error && data && data.length > 0) {
                    return NextResponse.json({
                        success: true,
                        message: "Supabase connection successful.",
                        source: "supabase",
                        totalVerifiedPrecedents: count ?? 0,
                        results: data,
                    });
                }
            } catch (err) {
                console.warn("[precedents] Supabase direct check failed, using curated sample:", err);
            }

            // Fallback sample from local 109 curated judgments
            const localSample = searchLocalCuratedPrecedents("", domain, 5);
            return NextResponse.json({
                success: true,
                message: "Curated 109 Supreme Court precedents available.",
                source: "curated_local",
                totalVerifiedPrecedents: 109,
                results: localSample,
            });
        }

        if (query.length < 3 || query.length > 300) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Search query must contain between 3 and 300 characters.",
                },
                { status: 400 }
            );
        }

        const { precedents, source } = await searchPrecedentsWithFallback([query], domain, limit);

        return NextResponse.json({
            success: true,
            query,
            domain,
            source,
            totalResults: precedents.length,
            results: precedents,
            notice:
                "These are source-matched judgment candidates from the Supreme Court of India. Legal relevance review is pending.",
            attribution:
                "Indian Supreme Court Judgments dataset (2025), sourced from eCourts, CC BY 4.0.",
        });

    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "NEXT_PRERENDER_INTERRUPTED") {
            throw error;
        }
        console.error("Precedent API error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "An unexpected server error occurred.",
            },
            { status: 500 }
        );
    }
}
