"use client"

// WelcomeCTA.tsx
// Welcome page bottom CTA links — "See the work", "Who I am", "How I think"
// Place inside ContentColumn (76vw centered frame) — fills 100% of container width
// Last updated: 2026-07-01

import { useEffect, useRef, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { COLORS, TIMING, TYPE } from "./Tokens"

// ─────────────────────────────────────────────────────────────
// DEFAULTS — all tuning lives here
// ─────────────────────────────────────────────────────────────

const DEFAULTS = {
    // Type
    fontSizeVw: 2.0,
    fontWeight: 600,
    letterSpacing: -0.01,

    // Layout
    gapPx: 220,
    lineGapPx: 30,

    // Horizontal rule
    ruleHeightPx: 0.5,
    ruleOpacity: 0.5,

    // Entrance
    fadeDurationMs: 1200,
    riseDistancePx: 12,
    staggerMs: 300,
    colorOffsetMs: 1200,
    colorSettleMs: 1500,

    // Hover
    hoverScale: 1.04,
    springiness: 1.0,
    lingerMs: 500,

    // Click
    clickFlashMs: 400,
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
    const triggered = useRef(false)

    useEffect(() => {
        setFontPx(Math.round((DEFAULTS.fontSizeVw / 100) * window.innerWidth))
    }, [])

    const router = useRouter()

    const lingerT = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null])
    const clickT = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null])
    const ws = useRef<number[]>([0, 0, 0])

    function getFontPx(): number {
        return fontPx
    }

    function layout() {
        const row = rowRef.current
        if (!row) return
        const textH = textRefs.current[0]?.offsetHeight ?? 40
        ws.current = textRefs.current.map((el) => el?.offsetWidth ?? 0)
        const [w0, w1, w2] = ws.current
        const gap = DEFAULTS.gapPx
        const x0 = 0
        const x1 = w0 + gap
        const x2 = w0 + gap + w1 + gap
        const totalSpan = x2 + w2
        const positions = [x0, x1, x2]
        textRefs.current.forEach((el, i) => {
            if (!el) return
            el.style.left = positions[i] + "px"
            el.style.top = "0px"
            el.style.transformOrigin = "left center"
        })
        row.style.height = textH + "px"
        const rule = ruleRef.current
        if (rule) rule.style.width = totalSpan + "px"
    }

    const playEntrance = useCallback(() => {
        const { fadeDurationMs, riseDistancePx, staggerMs, colorOffsetMs, colorSettleMs } = DEFAULTS
        const rule = ruleRef.current
        const ruleWrap = ruleWrapRef.current
        if (!rule || !ruleWrap) return

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
            setTimeout(() => {
                el.style.transition = [
                    `opacity ${fadeDurationMs}ms linear`,
                    `transform ${fadeDurationMs}ms ${TIMING.easeSpring}`,
                ].join(", ")
                el.style.opacity = "1"
                el.style.transform = "translateY(0px)"
                setTimeout(() => {
                    el.style.transition += `, color ${colorSettleMs}ms ${TIMING.easeOut}`
                    el.style.color = LINKS[i].color
                }, colorOffsetMs)
            }, textStartDelay + i * staggerMs)
        })
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            textRefs.current.forEach((el, idx) => {
                if (!el) return
                const rect = el.getBoundingClientRect()
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
        clickT.current[idx] = setTimeout(() => {
            el.style.transition = `color ${spd}ms ease`
            el.style.color = LINKS[idx].color
            setTimeout(() => {
                router.push(LINKS[idx].href)
            }, Math.round(spd * 0.4))
            clickT.current[idx] = null
        }, Math.round(spd * 0.4))
    }

    // ── layout-only effect — runs once on mount ───────────────
    useEffect(() => {
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
        if (document.fonts?.ready) {
            document.fonts.ready.then(layout)
        } else {
            setTimeout(layout, 300)
        }
        const onResize = () => {
            const px = getFontPx()
            textRefs.current.forEach((el) => {
                if (el) el.style.fontSize = px + "px"
            })
            requestAnimationFrame(layout)
        }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    // ── scroll + entrance effect — re-runs when enabled changes ──
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        let resetTimer: ReturnType<typeof setTimeout> | null = null

        const TRIGGER_TOP = 750
        const FADE_RANGE = 75

        const onScroll = () => {
            const rect = container.getBoundingClientRect()
            const viewH = window.innerHeight
            const entered = viewH - rect.top
            const scrolledAway = rect.top - TRIGGER_TOP

            // Fade out when scrolling back up
            if (triggered.current) {
                const exitOpacity = Math.max(0, Math.min(1, 1 - scrolledAway / FADE_RANGE))
                container.style.opacity = String(exitOpacity)
            }

            // Reset when fully scrolled past going up
            if (scrolledAway >= FADE_RANGE && triggered.current) {
                if (!resetTimer) {
                    resetTimer = setTimeout(() => {
                        triggered.current = false
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

            // Trigger entrance
            if (entered > 40 && !triggered.current && enabled) {
                triggered.current = true
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
            window.removeEventListener("scroll", onScroll)
            if (resetTimer) clearTimeout(resetTimer)
        }
    }, [playEntrance, enabled])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                opacity: 0,
            }}
        >
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
                        ref={(el) => { textRefs.current[i] = el }}
                        style={{
                            position: "absolute",
                            left: 0,
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