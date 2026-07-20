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
        text: "I aim to take people at their word — and I hope they will take me at mine.",
    },
    
    {
        id: 3,
        type: "paragraph",
        seq: 3,
        text: "How you say something can be just as important as what you say, but I've come to think that how you listen may be even more fundamental. I like talking — especially in person — but I also really like to hear what others have to say.",
    },
    {
        id: 4,
        type: "paragraph",
        seq: 3,
        text: "That's because I believe collaboration isn't just working well together — it's the foundation of greater accomplishment. To do it well requires empathy, respect, an open mind and a positive attitude. That's the kind of team I want to be part of — let me know if that's with you.",
    },
]