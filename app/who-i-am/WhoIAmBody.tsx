"use client"

// who-i-am/WhoIAmBody.tsx
// app/who-i-am/
// Who I Am page — client body. page.tsx is a server shell that reads
// About.md and hands it down as a string; see the note there.
// v02 — 2026-08-25 — content is markdown blocks; the sphere and the Venn
// diagram are [slot] items in that content rather than JSX positioned here,
// so a content edit can no longer dislodge them.

import { useEffect } from "react"
import { reset } from "../components/SequenceController"
import { armQueue } from "../components/RevealQueue"
import SkillsSphere from "../components/WhoSkillsSphere"
import VennDiagram from "../components/WhoVennDiagram"
import SiteTextBlock from "../components/SiteTextBlock"
import { useColumn, useBreakpoint, SPACE, useSpace } from "../components/SiteTokens"


// Sphere section box height. Desktop 360 == the old 40vh at the 900px
// reference height, so desktop should look identical — it just stops
// moving on vertical resize. Tablet/mobile are reasoned starting guesses
// paired with the SPHERE_RADIUS_* bumps in WhoSkillsSphere.tsx — tune live.

export default function WhoIAmBody({ md }: { md: string }) {
    const col = useColumn()
    const bp = useBreakpoint()

    const space = useSpace()
    const navClearance = space(SPACE.layout.whoNavClearance)
    const sphereBoxHeight = space(SPACE.layout.whoSphereBoxHeight)

    useEffect(() => {
        // Re-arm the whole sequence on every VISIT to this page.
        // `_unlocked` is module state that survives client-side navigation, so
        // without this, leaving the page and coming back rendered it fully
        // revealed with no animation at all — not play-once, play-never-again.
        // Let's Talk already did this; Who I Am never did.
        // Play-once is per visit; it is never re-armed by scrolling.
        // No gate is seeded by hand any more — this page is position-driven,
        // so the queue's own eligibility test starts it.
        reset()
        armQueue()
        window.scrollTo(0, 0)
    }, [])

    return (
        <div
            style={{
                paddingTop: navClearance,
                paddingBottom: "15vh",
            }}
        >
            {/* Sphere and Venn are rendered as [slot] items inside the content
                column below — the CONTENT declares where they sit in the
                sequence, this file still declares what they are and how they
                are framed. */}
            {/* ── 2vh spacer ── */}
            <div style={{ height: "2vh" }} />

            {/* ── content column ── */}
            <div
                style={{
                    width: `${col.vw}vw`,
                    marginLeft: "auto",
                    marginRight: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                }}
            >
                <SiteTextBlock
                    md={md}
                    slots={{
                        sphere:
                            bp === "desktop" ? (
                                // Desktop keeps its deliberate asymmetric framing:
                                // the sphere sits in a 76% box offset 3% from the left.
                                <div style={{ width: "100%", height: sphereBoxHeight, display: "flex" }}>
                                    <div style={{ width: "3%" }} />
                                    <div style={{ width: "76%", height: "100%" }}>
                                        <SkillsSphere />
                                    </div>
                                    <div style={{ width: "21%" }} />
                                </div>
                            ) : (
                                // Mobile + tablet: full-bleed canvas.
                                // The skill labels are painted ON the canvas, so
                                // anything outside its box is hard-clipped mid-glyph.
                                // NOTE: this deliberately breaks the leftmost-element
                                // principle for this one canvas, the same way
                                // SiteBackground is full-bleed — the atmospheric
                                // layer isn't "content".
                                <div style={{ width: "100%", height: sphereBoxHeight }}>
                                    <SkillsSphere />
                                </div>
                            ),
                        venn: (
                            <div style={{ marginTop: "4vh", marginBottom: "4vh" }}>
                                <VennDiagram scale={1} xOffset={0} triggerOnScroll={true} />
                            </div>
                        ),
                    }}
                />
            </div>
        </div>
    )
}