"use client"

// WelcomeCTA.tsx
// Welcome page bottom CTA links — "See the work", "Who I am", "How I think"
// Place inside ContentColumn (76vw centered frame) — fills 100% of container width
// Last updated: 2026-05-26

import { useEffect, useRef, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { COLORS, TIMING, TYPE } from "./Tokens"

// ─────────────────────────────────────────────────────────────
// DEFAULTS — all tuning lives here
// ─────────────────────────────────────────────────────────────

const DEFAULTS = {
    // Type
    fontSizeVw: 2.0, // vw — scaled from window.innerWidth
    fontWeight: 600,
    letterSpacing: -0.01, // em

    // Layout
    gapPx: 220, // px — space between each text link (same between all three)
    lineGapPx: 30, // px — space between bottom of rule and top of text

    // Horizontal rule
    ruleHeightPx: 0.5,
    ruleOpacity: 0.5,
    // Rule always spans from left edge of first link to right edge of last link.

    // Entrance
    fadeDurationMs: 1200, // ms — text opacity + rise
    riseDistancePx: 12, // px — text rises up from this offset
    staggerMs: 300, // ms — delay between each text item
    colorOffsetMs: 1200, // ms — delay after text fades in before color begins
    colorSettleMs: 1500, // ms — white → page color transition duration

    // Hover
    hoverScale: 1.04,
    springiness: 1.0, // 1.0 = no spring, 2.0 = very springy
    lingerMs: 500, // ms — settle delay after mouseout

    // Click
    clickFlashMs: 400, // ms — white flash on click
}

// ─────────────────────────────────────────────────────────────
// LINK DATA
// ─────────────────────────────────────────────────────────────

const LINKS = [
    { label: "See the work", color: COLORS.work, href: "/work" },
    { label: "Who I am", color: COLORS.about, href: "/who-i-am" },
    { label: "How I think", color: COLORS.thinking, href: "/how-i-think" },
]

// ─────────────────────────────────────────────────────────────
// EASING
// ─────────────────────────────────────────────────────────────

function springInEase(sp: number): string {
    const p2 = 1.0 + (sp - 1) * 0.5
    return `cubic-bezier(0.34,${p2.toFixed(2)},0.64,1)`
}

function settleEase(sp: number): string {
    const p2 = 0.36 + (sp - 1) * 0.64
    return `cubic-bezier(0.34,${p2.toFixed(2)},0.64,1)`
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function WelcomeCTA({ enabled = true }: { enabled?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const ruleWrapRef = useRef<HTMLDivElement>(null)
    const ruleRef = useRef<HTMLHRElement>(null)
    const rowRef = useRef<HTMLDivElement>(null)
    const textRefs = useRef<(HTMLSpanElement | null)[]>([null, null, null])
    const [fontPx, setFontPx] = useState(26)
    useEffect(() => {
        setFontPx(Math.round((DEFAULTS.fontSizeVw / 100) * window.innerWidth))
    }, [])

    const router = useRouter()

    const lingerT = useRef<(ReturnType<typeof setTimeout> | null)[]>([
        null,
        null,
        null,
    ])
    const clickT = useRef<(ReturnType<typeof setTimeout> | null)[]>([
        null,
        null,
        null,
    ])

    // Cached text widths — set after fonts load
    const ws = useRef<number[]>([0, 0, 0])

    // ── font size ─────────────────────────────────────────────

function getFontPx(): number {
        return fontPx
    }

    // ── layout ────────────────────────────────────────────────
    // x0 = 0
    // x1 = ws[0] + gap
    // x2 = ws[0] + gap + ws[1] + gap
    // Rule width (span mode) = x2 + ws[2]
    // Each text span is position:absolute at its x position.
    // Row height = text height.

    function layout() {
        const row = rowRef.current
        if (!row) return
        const textH = textRefs.current[0]?.offsetHeight ?? 40

        // Measure text widths
        ws.current = textRefs.current.map((el) => el?.offsetWidth ?? 0)
        const [w0, w1, w2] = ws.current
        const gap = DEFAULTS.gapPx

        const x0 = 0
        const x1 = w0 + gap
        const x2 = w0 + gap + w1 + gap
        const totalSpan = x2 + w2

        // Position each span
        const positions = [x0, x1, x2]
        textRefs.current.forEach((el, i) => {
            if (!el) return
            el.style.left = positions[i] + "px"
            el.style.top = "0px"
            el.style.transformOrigin = "left center"
        })

        // Set row height
        row.style.height = textH + "px"

        // Rule: set its own pixel width to exactly span the text links.
        // scaleX wipe works correctly because transform-origin is left center.
        // The wrapper has no overflow:hidden — rule width controls the span.
        const rule = ruleRef.current
        if (rule) {
            rule.style.width = totalSpan + "px"
        }
    }

    // ── entrance ──────────────────────────────────────────────

    const playEntrance = useCallback(() => {
        const {
            fadeDurationMs,
            riseDistancePx,
            staggerMs,
            colorOffsetMs,
            colorSettleMs,
        } = DEFAULTS

        const rule = ruleRef.current
        const ruleWrap = ruleWrapRef.current
        if (!rule || !ruleWrap) return

        // Line wipe finishes as last text item arrives
        const textStartDelay = 80
        const lastItemEnd = textStartDelay + staggerMs * 2 + fadeDurationMs

        rule.style.transition = "none"
        rule.style.transform = "scaleX(0)"

        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                rule.style.transition = `transform ${lastItemEnd}ms ${TIMING.easeOut}`
                rule.style.transform = "scaleX(1)"
            })
        )

        textRefs.current.forEach((el, i) => {
            if (!el) return
            el.style.transition = "none"
            el.style.opacity = "0"
            el.style.color = "#ffffff"
            el.style.transform = `translateY(${riseDistancePx}px)`

            setTimeout(
                () => {
                    el.style.transition = [
                        `opacity ${fadeDurationMs}ms ${TIMING.easeOut}`,
                        `transform ${fadeDurationMs}ms ${TIMING.easeSpring}`,
                    ].join(", ")
                    el.style.opacity = "1"
                    el.style.transform = "translateY(0px)"

                    setTimeout(() => {
                        el.style.transition += `, color ${colorSettleMs}ms ${TIMING.easeOut}`
                        el.style.color = LINKS[i].color
                    }, colorOffsetMs)
                },
                textStartDelay + i * staggerMs
            )
        })
    }, [])

    // ── hover + click — document-level (Framer iframe requires this) ──

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            textRefs.current.forEach((el, idx) => {
                if (!el) return
                const rect = el.getBoundingClientRect()
                // Expand hit rect by hitPadH/hitPadV
                const pad = 20
                const inside =
                    e.clientX >= rect.left - pad &&
                    e.clientX <= rect.right + pad &&
                    e.clientY >= rect.top - pad &&
                    e.clientY <= rect.bottom + pad

                const wasInside = el.dataset.hovered === "true"

                if (inside && !wasInside) {
                    el.dataset.hovered = "true"
                    doIn(idx)
                } else if (!inside && wasInside) {
                    el.dataset.hovered = "false"
                    doOut(idx)
                }
            })
        }

        const handleClick = (e: MouseEvent) => {
            textRefs.current.forEach((el, idx) => {
                if (!el) return
                const rect = el.getBoundingClientRect()
                const pad = 20
                const inside =
                    e.clientX >= rect.left - pad &&
                    e.clientX <= rect.right + pad &&
                    e.clientY >= rect.top - pad &&
                    e.clientY <= rect.bottom + pad
                if (inside) doClick(idx)
            })
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("click", handleClick)
        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("click", handleClick)
        }
    }, [])

    function doIn(idx: number) {
        if (lingerT.current[idx]) {
            clearTimeout(lingerT.current[idx]!)
            lingerT.current[idx] = null
        }
        const ease = springInEase(DEFAULTS.springiness)
        const el = textRefs.current[idx]
        if (el) {
            el.style.transition = `transform 220ms ${ease}`
            el.style.transform = `scale(${DEFAULTS.hoverScale})`
        }
    }

    function doOut(idx: number) {
        const ease = settleEase(DEFAULTS.springiness)
        const li = DEFAULTS.lingerMs
        if (lingerT.current[idx]) clearTimeout(lingerT.current[idx]!)
        lingerT.current[idx] = setTimeout(() => {
            const el = textRefs.current[idx]
            if (el) {
                el.style.transition = `transform ${Math.round(li * 0.7)}ms ${ease}`
                el.style.transform = "scale(1)"
            }
            lingerT.current[idx] = null
        }, 60)
    }

    function doClick(idx: number) {
        if (clickT.current[idx]) clearTimeout(clickT.current[idx]!)
        const spd = DEFAULTS.clickFlashMs
        const el = textRefs.current[idx]
        if (!el) return
        el.style.transition = `color ${Math.round(spd * 0.3)}ms ease`
        el.style.color = "#ffffff"
        clickT.current[idx] = setTimeout(
            () => {
                el.style.transition = `color ${spd}ms ease`
                el.style.color = LINKS[idx].color
                setTimeout(
                    () => {
                       router.push(LINKS[idx].href)
                    },
                    Math.round(spd * 0.4)
                )
                clickT.current[idx] = null
            },
            Math.round(spd * 0.4)
        )
    }

    // ── mount ─────────────────────────────────────────────────

    useEffect(() => {
        // Apply type styles so measurement is accurate
        const fontPx = getFontPx()
        textRefs.current.forEach((el) => {
            if (!el) return
            el.style.fontSize = fontPx + "px"
            el.style.fontWeight = String(DEFAULTS.fontWeight)
            el.style.letterSpacing = DEFAULTS.letterSpacing + "em"
            el.style.fontFamily = TYPE.display
            el.style.position = "absolute"
            el.style.opacity = "0"
            el.style.color = "#ffffff"
            el.style.transform = `translateY(${DEFAULTS.riseDistancePx}px)`
        })

        // Wait for fonts, measure, then play entrance once
        const init = () => {
            layout()
        }

        if (document.fonts?.ready) {
            document.fonts.ready.then(init)
        } else {
            setTimeout(init, 300)
        }

        // Resize: re-measure font size and re-layout
        const onResize = () => {
            const px = getFontPx()
            textRefs.current.forEach((el) => {
                if (el) el.style.fontSize = px + "px"
            })
            requestAnimationFrame(layout)
        }
        window.addEventListener("resize", onResize)

        // Scroll fade — fires on entry, fades out on scroll away, replays on re-entry
        const container = containerRef.current
        let triggered = false
        let resetTimer: ReturnType<typeof setTimeout> | null = null

        const FADE_OUT_END = 300 // px — rect.bottom at which opacity reaches 0

        const onScroll = () => {
            if (!container) return
            const rect = container.getBoundingClientRect()
            const viewH = window.innerHeight

            const TRIGGER_TOP = 750
            const FADE_RANGE = 75
            const entered = viewH - rect.top
            const scrolledAway = rect.top - TRIGGER_TOP
            const exitOpacity = triggered
                ? Math.max(0, Math.min(1, 1 - scrolledAway / FADE_RANGE))
                : 0

            // Fade out only when scrolling back up past it
            if (triggered) {
                container.style.opacity = String(exitOpacity)
            }

            // Reset when fully scrolled past going up
            if (scrolledAway >= FADE_RANGE && triggered) {
                if (!resetTimer) {
                    resetTimer = setTimeout(() => {
                        triggered = false
                        container.style.opacity = "0"
                        if (ruleRef.current) {
                            ruleRef.current.style.transition = "none"
                            ruleRef.current.style.transform = "scaleX(0)"
                        }
                        textRefs.current.forEach((el) => {
                            if (!el) return
                            el.style.transition = "none"
                            el.style.opacity = "0"
                            el.style.color = "#ffffff"
                            el.style.transform = `translateY(${DEFAULTS.riseDistancePx}px)`
                        })
                        resetTimer = null
                    }, 650)
                }
            } else {
                if (resetTimer) {
                    clearTimeout(resetTimer)
                    resetTimer = null
                }
            }

            // Trigger entrance when element enters viewport from bottom
            if (entered > 40 && !triggered && enabled) {
                triggered = true
                container.style.transition = "none"
                container.style.opacity = "1"
                playEntrance()
                setTimeout(() => {
                    container.style.transition = `opacity 600ms ${TIMING.easeSpring}`
                }, 100)
            }
        }

window.addEventListener("scroll", onScroll, { passive: true })
        onScroll()

        return () => {
            window.removeEventListener("resize", onResize)
            window.removeEventListener("scroll", onScroll)
        }
    }, [playEntrance])

    // ── render ────────────────────────────────────────────────

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                // Start visible — no scroll-driven opacity for the last page element
                opacity: 0,
            }}
        >
            {/* Horizontal rule — width set by layout() to span exactly the three links */}
            <div
                ref={ruleWrapRef}
                style={{
                    marginBottom: DEFAULTS.lineGapPx + "px",
                    width: "100%",
                    flexShrink: 0,
                }}
            >
                <hr
                    ref={ruleRef}
                    style={{
                        border: "none",
                        background: "white",
                        display: "block",
                        height: DEFAULTS.ruleHeightPx + "px",
                        opacity: DEFAULTS.ruleOpacity,
                        margin: 0,
                        transformOrigin: "left center",
                        transform: "scaleX(0)",
                    }}
                />
            </div>

            {/* Text links — position:relative container, spans are position:absolute */}
            {/* Height is set by layout() after measurement */}
            <div
                ref={rowRef}
                style={{
                    width: "100%",
                    position: "relative",
                    minHeight: getFontPx() + "px",
                }}
            >
                {LINKS.map((link, i) => (
                    <span
                        key={i}
                        ref={(el) => {
                            textRefs.current[i] = el
                        }}
                        style={{
                            position: "absolute",
                            left: 0, // overridden by layout()
                            top: 0,
                            display: "block",
                            whiteSpace: "nowrap",
                            color: link.color,
                            fontFamily: TYPE.display,
                            fontWeight: DEFAULTS.fontWeight,
                            fontSize: getFontPx() + "px",
                            letterSpacing: DEFAULTS.letterSpacing + "em",
                            lineHeight: 1,
                            userSelect: "none",
                            cursor: "pointer",
                            willChange: "transform, opacity, color",
                            opacity: 0,
                            transformOrigin: "left center",
                        }}
                    >
                        {link.label}
                    </span>
                ))}
            </div>
        </div>
    )
}

