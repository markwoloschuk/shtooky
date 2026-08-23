// ContactContent.ts
// app/data/
// Page content data for the Contact page.
// v02 — ported to Next.js 2026-06-22

import type { ContentItem } from "../components/SiteTextBlock"

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const SPACING = {
    paragraphGap: "2.2em",
    pullGapBefore: "3.5em",
    pullGapAfter: "2.5em",
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