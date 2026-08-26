"use client"

// lets-talk/LetsTalkBody.tsx
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
import { unlock, reset } from "../components/SiteSequenceController"
import { armQueue } from "../components/SiteRevealQueue"
import RippleNetwork, { TEXT_DELAY, CHUNKS, TIMING } from "../components/TalkRippleNetwork"
import SiteTextBlock, { itemFadeMs } from "../components/SiteTextBlock"
import TalkOptions from "../components/TalkOptions"
import { useColumn, SPACE, SEQUENCE, useSpace } from "../components/SiteTokens"



// Real completion time of RippleNetwork's one-shot text overlay —
// last chunk's own delay + its animation duration, on top of the
// overlay's own start delay.
const RIPPLE_TEXT_DONE_MS =
    TEXT_DELAY + CHUNKS[CHUNKS.length - 1].delay + TIMING.duration

// Real completion time of the subtitle's fade once gate 1 opens. Computed
// from the queue's own pacing, not guessed — the queue waits firstDelayMs
// before its first item, then that item fades for itemFadeMs. The page runs
// on `fast: true`, so it must ask for the fast duration or this wait drifts
// out of sync with what actually happens on screen.
const BLOCK1_FADE_DONE_MS = SEQUENCE.firstDelayMs + itemFadeMs(true)

export default function LetsTalkBody({ md }: { md: string }) {
    const col = useColumn()
    const space = useSpace()
    const blurbGap = space(SPACE.layout.talkBlurbGap)
    const navClearance = space(SPACE.layout.talkNavClearance)

    useEffect(() => {
        reset()
        armQueue()
        window.scrollTo(0, 0)

        const t1 = setTimeout(() => unlock(1), RIPPLE_TEXT_DONE_MS)
        const t2 = setTimeout(
            () => unlock(2),
            RIPPLE_TEXT_DONE_MS + BLOCK1_FADE_DONE_MS
        )
        // seq 3 (the remaining paragraphs) is unlocked by TalkOptions
        // itself, once ITS OWN reveal fade finishes — see TalkOptions.tsx.

        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [])

    return (
        <div
            style={{
                paddingTop: navClearance,
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
                <div style={{ marginTop: `${blurbGap}px` }}>
                    <SiteTextBlock
                        md={md}
                        slots={{
                            options: (
                                <div style={{ marginTop: "2.2em", marginBottom: "2.2em" }}>
                                    <TalkOptions />
                                </div>
                            ),
                        }}
                    />
                </div>
            </div>
        </div>
    )
}