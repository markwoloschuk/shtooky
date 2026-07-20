"use client"

// lets-talk/page.tsx
// app/lets-talk/
// Let's Talk page — full layout
// v03 — 2026-07-15 — real sequential reveal: RippleNetwork's text
// overlay finishes -> unlock id1 (blurb) -> id1's own fade finishes ->
// unlock seq 2 (TalkOptions) -> TalkOptions' own fade finishes -> it
// unlocks seq 3 (remaining paragraphs, ids 3-4) itself.
//
// Both waits below are computed from the real constants that already
// drive those animations (TalkRippleNetwork's TEXT_DELAY/CHUNKS/TIMING,
// TextBlock's SCROLL_FADE), not freshly guessed numbers. TalkOptions
// chains its own next step internally off its own real fade duration —
// see TalkOptions.tsx.

import { useEffect } from "react"
import { unlock, reset } from "../components/SequenceController"
import RippleNetwork, { TEXT_DELAY, CHUNKS, TIMING } from "../components/TalkRippleNetwork"
import SiteTextBlock, { SCROLL_FADE } from "../components/SiteTextBlock"
import TalkOptions from "../components/TalkOptions"
import { useColumn } from "../components/SiteTokens"

// Real completion time of RippleNetwork's one-shot text overlay —
// last chunk's own delay + its animation duration, on top of the
// overlay's own start delay.
const RIPPLE_TEXT_DONE_MS =
    TEXT_DELAY + CHUNKS[CHUNKS.length - 1].delay + TIMING.duration

// Real completion time of id1's fade once seq 1 unlocks — mountIndex
// is 0 for a single-paragraph TextBlock call, so paragraphStagger
// doesn't factor in.
const ID1_FADE_DONE_MS = SCROLL_FADE.mountDelay + SCROLL_FADE.mountFadeIn

export default function LetsTalk() {
    const col = useColumn()

    useEffect(() => {
        reset()
        window.scrollTo(0, 0)

        const t1 = setTimeout(() => unlock(1), RIPPLE_TEXT_DONE_MS)
        const t2 = setTimeout(
            () => unlock(2),
            RIPPLE_TEXT_DONE_MS + ID1_FADE_DONE_MS
        )
        // seq 3 (the remaining paragraphs) is unlocked by TalkOptions
        // itself, once ITS OWN reveal fade finishes — see TalkOptions.tsx.

        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [])

    return (
        <div
            style={{
                paddingTop: "11vh",
                paddingBottom: "18vh",
            }}
        >
            <div
                style={{
                    width: `${col.vw}vw`,
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                <RippleNetwork />
                <div style={{ marginTop: "-80px" }}>
                    <SiteTextBlock page="contact" ids="1" />
                    <div style={{ marginTop: "2.2em", marginBottom: "2.2em" }}>
                        <TalkOptions />
                    </div>
                    <SiteTextBlock page="contact" ids="3-4" />
                </div>
            </div>
        </div>
    )
}