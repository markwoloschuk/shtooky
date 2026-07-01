// ScrollConfig.tsx — shtooky.com
// Fixed viewport gradient overlay — top and bottom fade zones.
// Zone constants read directly from Tokens.tsx VISIBILITY — no props for zone values.
// Tune gradient by editing VISIBILITY_TIERS in Tokens.tsx.
// Debug mode toggled from DEBUG.visibility in Tokens.
//
// Zone naming convention (all values in vh):
//   TF0   — top fade, 0% opacity   — element fully gone at top of viewport
//   TF100 — top fade, 100% opacity — element fully visible, top fade ends here
//   BF100 — bottom fade, 100% opacity — element fully visible, bottom fade begins here
//   BF0   — bottom fade, 0% opacity — element fully gone at bottom + fire trigger line

"use client"

import { COLORS, DEBUG, NAV, getVisibility } from "./Tokens"
import { useState, useEffect } from "react"

// ─── Global config store ──────────────────────────────────────────────────────
// Read by any component that needs to know the current zone positions.

let _config = {
    TF0: 8,
    TF100: 18,
    BF100: 72,
    BF0: 88,
}

const VISIBILITY_TIERS_DESKTOP = {
    TF0: 6, TF100: 24, BF100: 85, BF0: 95,
    gradientHeight: 120, gradientOpacity: 0.95,
    revealMs: 800, staggerMs: 600, idleMs: 4000,
}

export function getScrollConfig() {
    return _config
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScrollConfig() {
    const [vis, setVis] = useState(VISIBILITY_TIERS_DESKTOP)
    useEffect(() => { setVis(getVisibility()) }, [])
    const { TF0, TF100, BF100, BF0, gradientOpacity } = vis
    const debug = DEBUG.visibility

    // Safety clamps
    const safeTF0 = Math.min(TF0, TF100)
    const safeTF100 = Math.max(TF0, TF100)
    const safeBF100 = Math.min(BF100, BF0)
    const safeBF0 = Math.max(BF100, BF0)

    // Publish to global store
    _config = { TF0: safeTF0, TF100: safeTF100, BF100: safeBF100, BF0: safeBF0 }

    const bg = COLORS.dark
    const debugSolid = (a: number) => `rgba(200,40,40,${a})`

    const topGradient = debug
        ? `linear-gradient(to bottom,
            ${debugSolid(gradientOpacity)} 0%,
            ${debugSolid(gradientOpacity)} ${safeTF0}vh,
            ${debugSolid(0)} ${safeTF100}vh)`
        : `linear-gradient(to bottom,
            ${bg} 0%,
            ${bg} ${safeTF0}vh,
            transparent ${safeTF100}vh)`

    const bottomGradient = debug
        ? `linear-gradient(to top,
            ${debugSolid(gradientOpacity)} 0%,
            ${debugSolid(gradientOpacity)} ${100 - safeBF0}vh,
            ${debugSolid(0)} ${100 - safeBF100}vh)`
        : `linear-gradient(to top,
            ${bg} 0%,
            ${bg} ${100 - safeBF0}vh,
            transparent ${100 - safeBF100}vh)`

    const lineBase: React.CSSProperties = {
        position: "absolute",
        left: 0,
        right: 0,
        height: 1,
        pointerEvents: "none",
    }

    const labelBase: React.CSSProperties = {
        position: "absolute",
        fontSize: 10,
        fontFamily: '"Archivo", sans-serif',
        fontWeight: 600,
        letterSpacing: "0.07em",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        padding: "2px 7px",
        borderRadius: 3,
        background: "rgba(0,0,0,0.55)",
    }

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                // Gradient overlay z-index is set here (was 35, changed to 0 to allow for Carousel)
                zIndex: 35,
            }}
        >
            {/* Top gradient  - removed and added to navbar
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${safeTF100}vh`,
                    background: topGradient,
                    pointerEvents: "none",
                }}
            />
            */}
             
            {/* Bottom gradient */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${100 - safeBF100}vh`,
                    background: bottomGradient,
                    pointerEvents: "none",
                }}
            />

            {/* Debug zone lines */}
            {debug && (
                <>
                    <div style={{ ...lineBase, top: `${safeTF0}vh`, background: "rgba(255,60,60,0.9)" }}>
                        <span style={{ ...labelBase, top: 4, left: 8, color: "rgba(255,120,120,1)" }}>
                            TF0 — {safeTF0}vh — 0% opacity
                        </span>
                    </div>
                    <div style={{ ...lineBase, top: `${safeTF100}vh`, background: "rgba(255,160,60,0.9)" }}>
                        <span style={{ ...labelBase, top: 4, left: 8, color: "rgba(255,190,100,1)" }}>
                            TF100 — {safeTF100}vh — 100% opacity
                        </span>
                    </div>
                    <div style={{ ...lineBase, top: `${safeBF100}vh`, background: "rgba(80,160,255,0.9)" }}>
                        <span style={{ ...labelBase, bottom: 4, right: 8, color: "rgba(120,190,255,1)" }}>
                            BF100 — {safeBF100}vh — 100% opacity
                        </span>
                    </div>
                    <div style={{ ...lineBase, top: `${safeBF0}vh`, background: "rgba(60,100,255,0.9)" }}>
                        <span style={{ ...labelBase, bottom: 4, right: 8, color: "rgba(100,150,255,1)" }}>
                            BF0 — {safeBF0}vh — 0% opacity + fire trigger
                        </span>
                    </div>
                    <div style={{ ...lineBase, top: NAV.height, borderTop: "1px dashed rgba(255,255,255,0.3)", height: "auto", background: "none" }}>
                        <span style={{ ...labelBase, top: 4, left: 8, color: "rgba(255,255,255,0.5)" }}>
                            NAV — {NAV.height}px
                        </span>
                    </div>
                </>
            )}
        </div>
    )
}