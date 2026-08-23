"use client"

// who-i-am/page.tsx
// app/who-i-am/
// Who I Am page — full layout
// v01 — 2026-06-22

import { useEffect } from "react"
import { unlock } from "../components/SequenceController"
import SkillsSphere from "../components/WhoSkillsSphere"
import VennDiagram from "../components/WhoVennDiagram"
import SiteTextBlock from "../components/SiteTextBlock"
import { useColumn, useBreakpoint } from "../components/SiteTokens"

// ── VERTICAL LAYOUT — absolute px, breakpoint-tiered ─────────────────────
// Was flat vh (9vh top padding, 40vh sphere box) at every breakpoint.
// Two problems with that: the sphere's size comes only from its container's
// WIDTH (see SPHERE_RADIUS_* in WhoSkillsSphere.tsx), so a vh-based box
// grew taller on narrow/tall viewports while the sphere inside it got
// smaller — and because the sphere centres in that box, it also sank.
// On desktop the same coupling made the sphere appear to drift up and down
// as the window was resized vertically.
// Same explicit-trio pattern as ThinkOpenAnimation.tsx's NAV_CLEARANCE_*
// and lets-talk/page.tsx.

const NAV_CLEARANCE_DESKTOP = 80;  // px — was 9vh (81px at the 900px reference)
const NAV_CLEARANCE_TABLET = 70;   // px — starting guess, tune live
const NAV_CLEARANCE_MOBILE = 60;   // px — starting guess, tune live

// Sphere section box height. Desktop 360 == the old 40vh at the 900px
// reference height, so desktop should look identical — it just stops
// moving on vertical resize. Tablet/mobile are reasoned starting guesses
// paired with the SPHERE_RADIUS_* bumps in WhoSkillsSphere.tsx — tune live.
const SPHERE_BOX_HEIGHT_DESKTOP = 360; // px — unchanged in appearance
const SPHERE_BOX_HEIGHT_TABLET = 260;  // px — starting guess, tune live
const SPHERE_BOX_HEIGHT_MOBILE = 180;  // px — starting guess, tune live

export default function WhoIAm() {
    const col = useColumn()
    const bp = useBreakpoint()

    const navClearance =
        bp === "mobile" ? NAV_CLEARANCE_MOBILE :
        bp === "tablet" ? NAV_CLEARANCE_TABLET :
        NAV_CLEARANCE_DESKTOP

    const sphereBoxHeight =
        bp === "mobile" ? SPHERE_BOX_HEIGHT_MOBILE :
        bp === "tablet" ? SPHERE_BOX_HEIGHT_TABLET :
        SPHERE_BOX_HEIGHT_DESKTOP

    useEffect(() => {
        unlock(1)
        window.scrollTo(0, 0)
    }, [])

    return (
        <div
            style={{
                paddingTop: navClearance,
                paddingBottom: "15vh",
            }}
        >
            {/* ── Sphere section ── */}
            {bp === "desktop" ? (
                // Desktop keeps its deliberate asymmetric framing: the
                // sphere sits in a 76% box offset 3% from the left.
                <div style={{ width: "100%", height: sphereBoxHeight, display: "flex" }}>
                    <div style={{ width: "3%" }} />
                    <div style={{ width: "76%", height: "100%" }}>
                        <SkillsSphere />
                    </div>
                    <div style={{ width: "21%" }} />
                </div>
            ) : (
                // Mobile + tablet: full-bleed canvas.
                // The skill labels are painted ON the canvas, so anything
                // outside its box is hard-clipped mid-glyph — that was the
                // straight vertical cut through "Color Correction" and
                // "Graphic Design". Previously this box was 90vw (mobile)
                // and 76% (tablet), so labels were being severed ~20px /
                // ~92px inside the screen edge. Full width lets them run
                // to the edge of the viewport and stop there naturally.
                // NOTE: this deliberately breaks the leftmost-element
                // principle for this one canvas, the same way SiteBackground
                // is full-bleed — the atmospheric layer isn't "content".
                <div style={{ width: "100%", height: sphereBoxHeight, background: "rgba(255,0,0,0)" }}>
                    <SkillsSphere />
                </div>
            )}

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
                {/* Text blocks 1–7 */}
                <SiteTextBlock page="about" ids="1-7" />

                {/* Venn Diagram */}
                <div style={{ marginTop: "4vh", marginBottom: "4vh" }}>
                    <VennDiagram scale={1} xOffset={0} triggerOnScroll={true} />
                </div>

                {/* Text blocks 8–26 */}
                <SiteTextBlock page="about" ids="8-26" />
            </div>
        </div>
    )
}