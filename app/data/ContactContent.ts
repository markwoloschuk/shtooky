// ContactContent.ts
// app/data/
// Page content data for the Contact page.
// v02 — ported to Next.js 2026-06-22

import type { ContentItem } from "../components/TextBlock"
import { COLORS } from "../components/Tokens"

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
        id: 2,
        type: "paragraph",
        seq: 1,
        text: "How you say something can be just as important as what you say, but I've come to think that how you listen may be even more fundamental. I like talking — especially in person — but I also really like to hear what others have to say.",
    },
    {
        id: 3,
        type: "paragraph",
        seq: 1,
        text: "That's because I believe collaboration isn't just working well together — it's the foundation of greater accomplishment. To do it well requires empathy, respect, an open mind and a positive attitude. That's the kind of team I want to be part of — let me know if that's with you.",
    },
    {
        id: 4,
        type: "paragraph",
        seq: 1,
        text: "San Francisco — Lower Haight",
    },
    {
        id: 5,
        type: "link",
        seq: 1,
        text: "Download resume",
        href: "https://drive.google.com/file/d/1itQd8z_xoR3zm7M2B7pLBDF6QY5VVRWJ/view?usp=share_link",
        color: COLORS.contact,
    },
]