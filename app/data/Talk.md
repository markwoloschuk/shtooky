---
fast: true
---

[subtitle]
I take people at their word, and trust they’ll take me at mine.

[slot] options

[paragraph]
How you say something can be just as important as what you say, but I think how you listen could be even more so. I like talking — especially in person — but I also really like hearing what others have to say.

To me collaboration isn’t just working well together — it’s the foundation of greater accomplishment. It requires empathy, respect, curiosity and a positive attitude. That’s the kind of team I want to be part of — let me know if it’s with you.

// ─────────────────────────────────────────────────────────────────────────
// Frontmatter `fast: true` puts every item on this page on SCROLL_FADE_FAST
// rather than SCROLL_FADE. All three items already used it — it was `fast:
// true` repeated on each one.
//
// SEQUENCE. Block order is gate order, so:
//   1  [subtitle]      unlocked by the page, after RippleNetwork's text
//   2  [slot] options  unlocked by the page, after block 1's fade
//   3  [paragraph]     unlocked by TalkOptions itself, after ITS fade
// Those two page-side waits are computed from the real animation constants,
// not guessed — see lets-talk/page.tsx.
// ─────────────────────────────────────────────────────────────────────────
