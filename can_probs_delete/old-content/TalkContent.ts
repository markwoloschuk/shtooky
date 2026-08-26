// ContactContent.ts
// app/data/
// Page content data for the Contact page.
// v02 — ported to Next.js 2026-06-22

import type { ContentItem } from "../components/SiteTextBlock"

// ─── Spacing ──────────────────────────────────────────────────────────────────

import { SPACE } from "../components/SiteTokens"

export const SPACING = {
    // Shared site-wide rhythm — see SPACE.text in SiteTokens.tsx, which
    // carries the reasoning. Tiered px; SiteTextBlock resolves them with
    // useSpace(). Pass the tier OBJECTS through untouched — resolving here,
    // at module scope, would freeze them at desktop forever.
    // NOTE: this page has no [pull] items, so only paragraphGap is live here.
    paragraphGap: SPACE.text.paragraphGap,
    pullGapBefore: SPACE.text.pullGapBefore,
    pullGapAfter: SPACE.text.pullGapAfter,
    entryDelay: 0,
    paragraphStagger: 400,
}

// ─── Content ──────────────────────────────────────────────────────────────────

export const CONTENT: ContentItem[] = [
    {
        id: 1,
        type: "paragraph",
        seq: 1,
        size: "subtitle",   // NEW
        fast: true,
        text: "I take people at their word, and trust they\u2019ll take me at mine.",
    },
    
    {
        id: 3,
        type: "paragraph",
        seq: 3,
        fast: true,
        //text: "How you say something can be just as important as what you say, but I've come to think that how you listen may be even more fundamental. I like talking — especially in person — but I also really like to hear what others have to say.",
        text: "How you say something can be just as important as what you say, but I think how you listen could be even more so. I like talking — especially in person — but I also really like hearing what others have to say."

    },
    {
        id: 4,
        type: "paragraph",
        seq: 3,
        fast: true,
        //text: "That\u2019s because I believe collaboration isn\u2019t just working well together — it\u2019s the foundation of greater accomplishment. To do it well requires empathy, respect, an open mind and a positive attitude. That\u2019s the kind of team I want to be part of — let me know if it\u2019s with you.",
        text: "To me collaboration isn\u2019t just working well together — it\u2019s the foundation of greater accomplishment. It requires empathy, respect, curiosity and a positive attitude. That\u2019s the kind of team I want to be part of — let me know if it\u2019s with you."
    },
]