"use client"

// HeroAnimation.tsx — shtooky.com
// Combines OpeningAnimation and WelcomeTagline into a single self-sizing component.
// Measures its own width and sets height as a ratio — no fixed px needed.
// Place inside ContentColumn. Set width 100%, no fixed height needed.

import { useEffect, useRef, useState } from "react"
import { TYPE, COLORS, TIMING } from "./Tokens"

// ─── TUNING ──────────────────────────────────────────────────────────────────

const CFG = {
    FADE_DUR: 1500,
    TRAVEL_PX: 70,
    DELAY_MS: 50,
    CAR_DUR: 2100,
    REACH_START: 80,
    REACH_END: 50,
    SHIFT_DUR: 2000,
    NUM_ENTRIES: 10,
    TAGLINE_DELAY: 2050,
    TAGLINE_DUR: 1500,
    TAGLINE_Y: 10,
}

const SCROLL_FADE = {
    fadeStart: 170, // scrollY where fade-out begins
    fadeEnd: 340, // scrollY where fade-out completes
}

const RATIO = 0.12 // height = width × RATIO — adjust to taste

// ─── CONTENT ─────────────────────────────────────────────────────────────────

const POOL = [
    "thoughtful designer",
    "visual storyteller",
    "design thinker",
    "pixel sculptor",
    "motion craftsperson",
    "brand builder",
    "idea machine",
    "detail observer",
    "light chaser",
    "color lover",
    "narrative architect",
    "lateral thinker",
    "documentarian",
    "general specialist",
    "curious cat",
    "sincere director",
]
const FINAL = "creative problem solver"

const TAGLINES = [
    "I like to make things, but even more I like to figure out what they should be.",
    "I've got empathy for clients AND their audience. It gets us on the same page.",
    "I ask a lot of questions at the start. It tends to prevent a lot of problems at the end.",
    "I've shipped some great ideas – but also improved some less great ones.",
    "I zoom between details and big picture so I don't get lost in either.",
    "From concept to completion — or any stop along the way.",
    "There are no bad stories. Only bad storytelling.",
]

// ─── PALETTE ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "")
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
    ]
}

const GSTOPS: [number, number, number][] = COLORS.gradient.map(hexToRgb)
const NG = GSTOPS.length

function gradientAt(t: number): [number, number, number] {
    t = ((t % 1) + 1) % 1
    const seg = (NG - 1) * t
    const i = Math.min(Math.floor(seg), NG - 2)
    const f = seg - i
    const a = GSTOPS[i],
        b = GSTOPS[i + 1]
    return [
        Math.round(a[0] + (b[0] - a[0]) * f),
        Math.round(a[1] + (b[1] - a[1]) * f),
        Math.round(a[2] + (b[2] - a[2]) * f),
    ]
}

function rgbStr(c: [number, number, number]): string {
    return `rgb(${c[0]},${c[1]},${c[2]})`
}

function lerpRgb(
    a: [number, number, number],
    b: [number, number, number],
    t: number
): [number, number, number] {
    return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t),
    ]
}

function buildColors(n: number): [number, number, number][] {
    const s = Math.floor(Math.random() * NG) / (NG - 1)
    return Array.from({ length: n }, (_, i) =>
        gradientAt(s + i * (1 / (NG - 1)))
    )
}

function easeOutQuart(t: number): number {
    t = Math.min(t, 1)
    return 1 - Math.pow(1 - t, 4)
}

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function shuffle<T>(a: T[]): T[] {
    const b = [...a]
    for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[b[i], b[j]] = [b[j], b[i]]
    }
    return b
}

function measureText(
    text: string,
    fontSize: string,
    fontFamily: string,
    fontWeight: number
): { w: number; h: number } {
    const t = document.createElement("span")
    t.style.cssText = `position:fixed;top:-999px;left:-999px;visibility:hidden;font-size:${fontSize};font-weight:${fontWeight};white-space:nowrap;font-family:${fontFamily}`
    t.textContent = text
    document.body.appendChild(t)
    const r = { w: t.offsetWidth, h: t.offsetHeight }
    document.body.removeChild(t)
    return r
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const FONT_DISPLAY = TYPE.display
const WHITE_RGB: [number, number, number] = [255, 255, 255]

export default function HeroAnimation({
    autoPlay = true,
}: {
    autoPlay?: boolean
}) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        const wrap = wrapRef.current
        if (!wrap) return

        let rafId = 0
        let running = true
        let hasResolved = false
        let resolvedNCar = 0
        let resolvedColors: [number, number, number][] = []

        // ── ResizeObserver — sets component height ──────────────────────────
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = entry.contentRect.width
                setHeight(w * RATIO)
            }
        })
        resizeObserver.observe(wrap)

        // ── DOM elements ────────────────────────────────────────────────────
        const stage = document.createElement("div")
        const staticEl = document.createElement("span")
        const carouselAnchor = document.createElement("div")
        const slotOuter = document.createElement("div")
        const slotTrack = document.createElement("div")
        const finalEl = document.createElement("div")
        const taglineEl = document.createElement("div")

        function buildDOM() {
            wrap.innerHTML = ""

            // Opening animation stage
            stage.style.cssText = `
                position: absolute;
                overflow: visible;
                left: 0;
                top: 0;
                transform: none;
                display: flex;
                align-items: flex-start;
                gap: 0.3em;
                font-family: ${FONT_DISPLAY};
                font-weight: ${TYPE.OPENING.weight};
                letter-spacing: ${TYPE.OPENING.tracking}em;
                color: #fff;
                white-space: nowrap;
                pointer-events: none;
            `
            wrap.appendChild(stage)

            staticEl.textContent = "I\u2019m a"
            stage.appendChild(staticEl)

            carouselAnchor.style.cssText = `
                display: inline-block;
                vertical-align: top;
                position: relative;
            `
            stage.appendChild(carouselAnchor)

            slotOuter.style.cssText = `
                display: block;
                overflow: hidden;
                position: relative;
            `
            carouselAnchor.appendChild(slotOuter)

            slotTrack.style.cssText = `
                display: flex;
                flex-direction: column;
                will-change: transform;
            `
            slotOuter.appendChild(slotTrack)

            finalEl.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                font-weight: ${TYPE.OPENING.weight};
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                will-change: transform;
            `
            carouselAnchor.appendChild(finalEl)

            // Tagline
            const tagline =
                TAGLINES[Math.floor(Math.random() * TAGLINES.length)]
            taglineEl.textContent = tagline
            taglineEl.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                white-space: nowrap;
                font-family: ${FONT_DISPLAY};
                font-size: 1.944vw;
                font-weight: ${TYPE.TAGLINE.weight};
                letter-spacing: ${TYPE.TAGLINE.tracking}em;
                line-height: ${TYPE.TAGLINE.lineHeight};
                color: #ffffff;
                opacity: 0;
                pointer-events: none;
                will-change: transform, opacity;
            `
            wrap.appendChild(taglineEl)
        }

        function setMask(
            outerH: number,
            lH: number,
            padding: number,
            reach: number
        ) {
            const c = lH
            const t0 = Math.max(0, c - lH / 2 - reach)
            const t1 = c - lH / 2
            const b0 = c + lH / 2
            const b1 = Math.min(outerH, c + lH / 2 + reach)
            const m = `linear-gradient(to bottom,transparent ${t0.toFixed(1)}px,black ${t1.toFixed(1)}px,black ${b0.toFixed(1)}px,transparent ${b1.toFixed(1)}px)`
            slotOuter.style.maskImage = m
            ;(slotOuter.style as any).webkitMaskImage = m
        }

        function calcLayout() {
            const fontSize = Math.round(
                window.innerWidth * (TYPE.OPENING.sizeVw / 100)
            )
            const fontSizeStr = fontSize + "px"
            const lineH = measureText(
                "A",
                fontSizeStr,
                FONT_DISPLAY,
                TYPE.OPENING.weight
            ).h
            const scale = fontSize / 34
            const travelPx = Math.round(CFG.TRAVEL_PX * scale)
            const reachStart = Math.round(CFG.REACH_START * scale)
            const reachEnd = Math.round(CFG.REACH_END * scale)
            const carSeq = shuffle(POOL).slice(
                0,
                Math.max(4, CFG.NUM_ENTRIES - 1)
            )
            const nCar = carSeq.length
            const allColors = buildColors(nCar + 1)
            let maxW = 0
            ;[...carSeq, FINAL].forEach((p) => {
                const { w } = measureText(
                    p,
                    fontSizeStr,
                    FONT_DISPLAY,
                    TYPE.OPENING.weight
                )
                if (w > maxW) maxW = w
            })
            const padding = Math.max(travelPx, lineH + reachStart + 4)
            return {
                fontSize,
                fontSizeStr,
                lineH,
                travelPx,
                reachStart,
                reachEnd,
                carSeq,
                nCar,
                allColors,
                maxW,
                padding,
            }
        }

        function positionTagline(lineH: number) {
            // Sits just below the opening text line
            const gap = 5
            taglineEl.style.top = lineH + gap + "px"
        }

        function applyResolvedState(
            fontSizeStr: string,
            lineH: number,
            padding: number,
            maxW: number,
            nCar: number,
            colors: [number, number, number][]
        ) {
            stage.style.fontSize = fontSizeStr
            staticEl.style.cssText = `opacity:1;transform:translateY(0);display:inline-block;white-space:nowrap;`
            const outerH = lineH + padding * 2
            slotOuter.style.height = outerH + "px"
            slotOuter.style.width = maxW + "px"
            slotOuter.style.opacity = "0"
            slotOuter.style.maskImage = "none"
            ;(slotOuter.style as any).webkitMaskImage = "none"
            finalEl.style.fontSize = fontSizeStr
            finalEl.style.lineHeight = lineH + "px"
            finalEl.style.top = "0px"
            finalEl.style.opacity = "1"
            finalEl.style.color = "rgb(255,255,255)"
            finalEl.textContent = FINAL
            positionTagline(lineH)
        }

        function play() {
            const {
                fontSizeStr,
                lineH,
                travelPx,
                reachStart,
                reachEnd,
                carSeq,
                nCar,
                allColors,
                maxW,
                padding,
            } = calcLayout()

            resolvedNCar = nCar
            resolvedColors = allColors
            const finalColor = allColors[nCar]

            stage.style.fontSize = fontSizeStr
            staticEl.style.cssText = `opacity:0;transform:translateY(${travelPx}px);display:inline-block;white-space:nowrap;`
            staticEl.style.marginTop = padding + "px"
            const outerH = lineH + padding * 2
            slotOuter.style.height = outerH + "px"
            slotOuter.style.width = maxW + "px"
            slotOuter.style.opacity = "1"
            setMask(outerH, lineH, padding, reachStart)

            slotTrack.innerHTML = ""
            ;[...carSeq, FINAL].forEach((text, i) => {
                const div = document.createElement("div")
                div.style.cssText = `height:${lineH}px;line-height:${lineH}px;font-size:${fontSizeStr};font-weight:${TYPE.OPENING.weight};white-space:nowrap;display:block;color:${rgbStr(allColors[i])};`
                div.textContent = text
                slotTrack.appendChild(div)
            })

            const trackStart = lineH
            const trackAtFinal = -nCar * lineH
            const trackDist = trackStart - trackAtFinal
            slotTrack.style.transform = `translateY(${trackStart}px)`

            finalEl.style.fontSize = fontSizeStr
            finalEl.style.lineHeight = lineH + "px"
            finalEl.style.left = "0px"
            finalEl.style.color = rgbStr(finalColor)
            finalEl.style.opacity = "0"
            finalEl.textContent = FINAL

            positionTagline(lineH)

            const t0 = performance.now()

            function frame(now: number) {
                if (!running) return
                const elapsed = now - t0

                const lp = Math.min(elapsed / CFG.FADE_DUR, 1)
                const le = easeOutQuart(lp)
                staticEl.style.opacity = le.toFixed(4)
                staticEl.style.transform = `translateY(${(CFG.TRAVEL_PX * (1 - le)).toFixed(2)}px)`

                const ct = Math.max(0, elapsed - CFG.DELAY_MS)
                const cp = Math.min(ct / CFG.CAR_DUR, 1)
                const ce = easeOutQuart(cp)

                const trackY = trackStart - ce * trackDist
                slotTrack.style.transform = `translateY(${trackY.toFixed(3)}px)`
                finalEl.style.top = (trackY + nCar * lineH).toFixed(3) + "px"

                const reach = reachStart + (reachEnd - reachStart) * ce
                setMask(outerH, lineH, padding, reach)

                const fadeT = Math.max(0, (cp - 0.5) / 0.5)
                const fadeE = easeInOutCubic(fadeT)
                slotOuter.style.opacity = (1 - fadeE).toFixed(4)
                finalEl.style.opacity = fadeE.toFixed(4)

                const colorT = Math.max(
                    0,
                    (ct - (CFG.CAR_DUR - CFG.SHIFT_DUR)) / CFG.SHIFT_DUR
                )
                finalEl.style.color = rgbStr(
                    lerpRgb(finalColor, WHITE_RGB, Math.min(colorT, 1))
                )

                if (lp < 1 || cp < 1) {
                    rafId = requestAnimationFrame(frame)
                } else {
                    staticEl.style.opacity = "1"
                    staticEl.style.transform = "translateY(0)"
                    slotOuter.style.opacity = "0"
                    finalEl.style.top = "0px"
                    finalEl.style.opacity = "1"
                    finalEl.style.color = "rgb(255,255,255)"
                    hasResolved = true
                    rafId = 0
                }
            }

            rafId = requestAnimationFrame(frame)

            // Tagline fade in
            let taglineTimer: ReturnType<typeof setTimeout> | null = null
            let taglineRaf = 0
            taglineTimer = setTimeout(() => {
                if (!running) return
                taglineEl.style.transform = `translateY(${CFG.TAGLINE_Y}px)`
                taglineEl.style.opacity = "0"
                const t1 = performance.now()
                function taglineFrame(now: number) {
                    if (!running) return
                    const p = Math.min((now - t1) / CFG.TAGLINE_DUR, 1)
                    const e = 1 - Math.pow(1 - p, 4)
                    taglineEl.style.opacity = e.toFixed(4)
                    taglineEl.style.transform = `translateY(${(CFG.TAGLINE_Y * (1 - e)).toFixed(2)}px)`
                    if (p < 1) {
                        taglineRaf = requestAnimationFrame(taglineFrame)
                    } else {
                        taglineEl.style.opacity = "1"
                        taglineEl.style.transform = "translateY(0px)"
                    }
                }
                taglineRaf = requestAnimationFrame(taglineFrame)
            }, CFG.TAGLINE_DELAY)
        }

        let resizeTimer: ReturnType<typeof setTimeout> | null = null

        function handleResize() {
            if (resizeTimer) clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                if (!running) return
                if (hasResolved) {
                    const { fontSizeStr, lineH, padding, maxW } = calcLayout()
                    applyResolvedState(
                        fontSizeStr,
                        lineH,
                        padding,
                        maxW,
                        resolvedNCar,
                        resolvedColors
                    )
                }
            }, 100)
        }

        function handleScroll() {
            const scrollY = window.scrollY
            const raw =
                (scrollY - SCROLL_FADE.fadeStart) /
                (SCROLL_FADE.fadeEnd - SCROLL_FADE.fadeStart)
            const opacity = 1 - Math.max(0, Math.min(1, raw))
            wrap.style.opacity = opacity.toFixed(3)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })

        window.addEventListener("resize", handleResize)
        buildDOM()

        if (autoPlay) {
            requestAnimationFrame(() => {
                if (running) play()
            })
        }
        return () => {
            running = false
            if (rafId) cancelAnimationFrame(rafId)
            if (resizeTimer) clearTimeout(resizeTimer)
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("scroll", handleScroll)
            resizeObserver.disconnect()
            wrap.innerHTML = ""
        }
    }, [autoPlay])

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: "100%",
                height: height || "auto",
                overflow: "visible",
                pointerEvents: "none",
            }}
        />
    )
}
