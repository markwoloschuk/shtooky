"use client"

// HeroAnimationTwoLine.tsx — shtooky.com
// Two-line variant of HeroAnimation for narrow viewports.
// Line 1 (static): "I'm a creative"
// Line 2 (carousel): cycles single-word/short titles, resolves to "problem solver"
// Shares the same crossfade + color-settle mechanics as HeroAnimation.tsx.
// NOTE: color helpers (rgbToHsl/hslToRgb/colorToWhite/etc.) are duplicated here,
// not yet shared — deferred bonus item: extract into a shared module once both
// files' color math is fully settled.
//
// LINE-GAP FIX: line-2 positioning previously used `lineH * 0.76` as a guessed
// approximation of visual cap-height (borrowed from the tagline code). For this
// font that guess overestimates the real glyph height, so most of the visible
// gap was a fixed baked-in error — LINE_GAP could shrink to near-zero without
// closing it. Now uses canvas actualBoundingBoxAscent/Descent to measure the
// TRUE rendered glyph height, and LINE_GAP_PX is a plain, independent pixel
// value on top of that — no ratio, no guessing.

import { useEffect, useRef, useState } from "react"
import { TYPE, COLORS, TIMING, getType } from "./SiteTokens"

// ─── TUNING ──────────────────────────────────────────────────────────────────

const CFG = {
    FADE_DUR: 1500,        // line 1 static entrance fade
    TRAVEL_PX: 70,
    DELAY_MS: 50,          // line 2 carousel start offset, relative to line 1
    CAR_DUR: 2100,
    REACH_START: 80,
    REACH_END: 50,
    COLOR_SETTLE_DELAY: 80,
    COLOR_SETTLE_DUR: 1200,
    NUM_ENTRIES: 8,        // pool has 14 unique words — tune how many cycle through
    LINE_GAP_PX: 1.5,        // gap between line 1 and line 2, plain pixels at reference scale — tune by eye, 0 = touching

    TAGLINE_GAP_PX: 35,   // gap between "problem solver" and the subtitle below it — tune by eye

    TAGLINE_DELAY: 2050,   // same starting point as HeroAnimation.tsx — may need nudging
    TAGLINE_DUR: 1500,
    TAGLINE_Y: 10,
}

const SCROLL_FADE = {
    fadeStart: 170,
    fadeEnd: 340,
}

const RATIO = 0.22 // height = width × RATIO — starting point for 2-line + tagline, tune by eye

// ─── CONTENT ─────────────────────────────────────────────────────────────────

const LINE1 = "I\u2019m a creative"

const POOL = [
    "designer",
    "storyteller",
    "thinker",
    "observer",
    "director",
    "documentarian",
    "photographer",
    "writer",
    "pixel pusher",
    "motion artist",
    "idea generator",
    "brand builder",
    "light chaser",
    "color lover",
]
const FINAL = "problem solver"

const TAGLINES = [
    "I like to make things, but even more I like to figure out what they should be.",
    "I\u2019ve got empathy for clients AND their audience. It gets us on the same page.",
    "I ask a lot of questions at the start. It prevents a lot of problems in the end.",
    "I\u2019ve shipped some great ideas – but also improved some less great ones.",
    "I zoom between details and big picture so I don\u2019t get lost in either.",
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

function rgbToHsl(rgb: [number, number, number]): [number, number, number] {
    const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const l = (max + min) / 2
    let h = 0, s = 0
    const d = max - min
    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1))
        if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h *= 60
        if (h < 0) h += 360
    }
    return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r = 0, g = 0, b = 0
    if (h < 60) [r, g, b] = [c, x, 0]
    else if (h < 120) [r, g, b] = [x, c, 0]
    else if (h < 180) [r, g, b] = [0, c, x]
    else if (h < 240) [r, g, b] = [0, x, c]
    else if (h < 300) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ]
}

function easeOutQuart(t: number): number {
    t = Math.min(t, 1)
    return 1 - Math.pow(1 - t, 4)
}

function colorToWhite(color: [number, number, number], t: number): [number, number, number] {
    const [h, s, l] = rgbToHsl(color)
    const lT = easeOutQuart(t)
    const sT = Math.pow(t, 2.2)
    const newL = l + (1 - l) * lT
    const newS = s * (1 - sT)
    return hslToRgb(h, newS, newL)
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

// Measures the TRUE rendered height of glyphs (ascent+descent of actual ink),
// not the font's inflated line-box. Used to position line 2 tight against
// line 1's real visual bottom edge, independent of any guessed ratio.
let measureCanvas: HTMLCanvasElement | null = null
function measureGlyphHeight(
    fontSizeStr: string,
    fontFamily: string,
    fontWeight: number
): number {
    if (!measureCanvas) measureCanvas = document.createElement("canvas")
    const ctx = measureCanvas.getContext("2d")!
    ctx.font = `${fontWeight} ${fontSizeStr} ${fontFamily}`
    const m = ctx.measureText("Apgy") // mix of cap height + descenders
    return Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const FONT_DISPLAY = TYPE.display
const WHITE_RGB: [number, number, number] = [255, 255, 255]

export default function HeroAnimationTwoLine({
    autoPlay = true,
}: {
    autoPlay?: boolean
}) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        const wrap = wrapRef.current!
        if (!wrap) return

        let rafId = 0
        let running = true
        let hasResolved = false
        let resolvedNCar = 0
        let resolvedColors: [number, number, number][] = []
        let resolvedLineH = 0

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = entry.contentRect.width
                setHeight(w * RATIO)
            }
        })
        resizeObserver.observe(wrap)

        // ── DOM elements ────────────────────────────────────────────────────
        const line1El = document.createElement("div")
        const carouselAnchor = document.createElement("div")
        const finalEl = document.createElement("div")
        const slotOuter = document.createElement("div")
        const slotTrack = document.createElement("div")
        const taglineEl = document.createElement("div")

        function buildDOM() {
            wrap.innerHTML = ""

            line1El.textContent = LINE1
            line1El.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                font-family: ${FONT_DISPLAY};
                font-weight: ${getType().OPENING.weight};
                letter-spacing: ${getType().OPENING.tracking}em;
                color: #fff;
                white-space: nowrap;
                pointer-events: none;
            `
            wrap.appendChild(line1El)

            carouselAnchor.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                font-family: ${FONT_DISPLAY};
                font-weight: ${getType().OPENING.weight};
                letter-spacing: ${getType().OPENING.tracking}em;
                white-space: nowrap;
                pointer-events: none;
            `
            wrap.appendChild(carouselAnchor)

            // finalEl sits BENEATH slotOuter (stacking-order fix — see HeroAnimation.tsx)
            finalEl.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                font-weight: ${getType().OPENING.weight};
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                will-change: transform;
            `
            carouselAnchor.appendChild(finalEl)

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

            const tagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)]
            taglineEl.textContent = tagline
            taglineEl.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                white-space: nowrap;
                font-family: ${FONT_DISPLAY};
                font-size: 1.944vw;
                font-weight: ${getType().TAGLINE.weight};
                letter-spacing: ${getType().TAGLINE.tracking}em;
                line-height: ${getType().TAGLINE.lineHeight};
                color: #ffffff;
                opacity: 0;
                pointer-events: none;
                will-change: transform, opacity;
            `
            wrap.appendChild(taglineEl)
        }

        function setMask(outerH: number, lH: number, padding: number, reach: number) {
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
            const fontSize = Math.round(window.innerWidth * (getType().OPENING.sizeVw / 100))
            const fontSizeStr = fontSize + "px"
            const lineH = measureText("A", fontSizeStr, FONT_DISPLAY, getType().OPENING.weight).h
            const glyphH = measureGlyphHeight(fontSizeStr, FONT_DISPLAY, getType().OPENING.weight)
            const scale = fontSize / 34
            const travelPx = Math.round(CFG.TRAVEL_PX * scale)
            const reachStart = Math.round(CFG.REACH_START * scale)
            const reachEnd = Math.round(CFG.REACH_END * scale)
            const carSeq = shuffle(POOL).slice(0, Math.max(3, CFG.NUM_ENTRIES - 1))
            const nCar = carSeq.length
            const allColors = (() => {
                const s = Math.floor(Math.random() * NG) / (NG - 1)
                return Array.from({ length: nCar + 1 }, (_, i) =>
                    gradientAt(s + i * (1 / (NG - 1)))
                )
            })()
            let maxW = 0
            ;[...carSeq, FINAL].forEach((p) => {
                const { w } = measureText(p, fontSizeStr, FONT_DISPLAY, getType().OPENING.weight)
                if (w > maxW) maxW = w
            })
            const padding = Math.max(travelPx, lineH + reachStart + 4)
            const lineGap = Math.round(CFG.LINE_GAP_PX * scale)
            return { fontSize, fontSizeStr, lineH, glyphH, travelPx, reachStart, reachEnd, carSeq, nCar, allColors, maxW, padding, lineGap }
        }


function positionTagline(glyphH: number, lineGap: number) {
    taglineEl.style.top = glyphH + lineGap + glyphH + CFG.TAGLINE_GAP_PX + "px"
}

        function applyResolvedState(
            fontSizeStr: string,
            lineH: number,
            glyphH: number,
            lineGap: number,
            padding: number,
            maxW: number,
            nCar: number
        ) {
            line1El.style.fontSize = fontSizeStr
            line1El.style.cssText += `opacity:1;transform:translateY(0);`

            carouselAnchor.style.fontSize = fontSizeStr
            carouselAnchor.style.top = glyphH + lineGap + "px"

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

            positionTagline(glyphH, lineGap)
        }

        function play() {
            const { fontSizeStr, lineH, glyphH, travelPx, reachStart, reachEnd, carSeq, nCar, allColors, maxW, padding, lineGap } = calcLayout()

            resolvedNCar = nCar
            resolvedColors = allColors
            resolvedLineH = lineH
            const finalColor = allColors[nCar]

            // Line 1
            line1El.style.fontSize = fontSizeStr
            line1El.style.cssText += `opacity:0;transform:translateY(${travelPx}px);`

            // Line 2 (carousel)
            carouselAnchor.style.fontSize = fontSizeStr
            carouselAnchor.style.top = glyphH + lineGap + "px"

            const outerH = lineH + padding * 2
            slotOuter.style.height = outerH + "px"
            slotOuter.style.width = maxW + "px"
            slotOuter.style.opacity = "1"
            setMask(outerH, lineH, padding, reachStart)

            slotTrack.innerHTML = ""
            ;[...carSeq, FINAL].forEach((text, i) => {
                const div = document.createElement("div")
                div.style.cssText = `height:${lineH}px;line-height:${lineH}px;font-size:${fontSizeStr};font-weight:${getType().OPENING.weight};white-space:nowrap;display:block;color:${rgbStr(allColors[i])};`
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

            positionTagline(glyphH, lineGap)

            const t0 = performance.now()

            function frame(now: number) {
                if (!running) return
                const elapsed = now - t0

                // Line 1 fade/rise
                const lp = Math.min(elapsed / CFG.FADE_DUR, 1)
                const le = easeOutQuart(lp)
                line1El.style.opacity = le.toFixed(4)
                line1El.style.transform = `translateY(${(CFG.TRAVEL_PX * (1 - le)).toFixed(2)}px)`

                // Line 2 carousel
                const ct = Math.max(0, elapsed - CFG.DELAY_MS)
                const cp = Math.min(ct / CFG.CAR_DUR, 1)
                const ce = easeOutQuart(cp)

                const trackY = trackStart - ce * trackDist
                slotTrack.style.transform = `translateY(${trackY.toFixed(3)}px)`
                finalEl.style.top = (trackY + nCar * lineH).toFixed(3) + "px"

                const reach = reachStart + (reachEnd - reachStart) * ce
                setMask(outerH, lineH, padding, reach)

                // Crossfade — finalEl solid underneath, slotOuter fades away on top
                const fadeT = Math.max(0, (cp - 0.5) / 0.5)
                const fadeE = easeInOutCubic(fadeT)
                slotOuter.style.opacity = (1 - fadeE).toFixed(4)
                finalEl.style.opacity = cp >= 0.5 ? "1" : "0"

                // Color settle — only begins once crossfade is fully resolved
                const settleElapsed = Math.max(0, ct - CFG.CAR_DUR - CFG.COLOR_SETTLE_DELAY)
                const colorP = Math.min(settleElapsed / CFG.COLOR_SETTLE_DUR, 1)
                finalEl.style.color = rgbStr(colorToWhite(finalColor, colorP))

                if (lp < 1 || cp < 1 || colorP < 1) {
                    rafId = requestAnimationFrame(frame)
                } else {
                    line1El.style.opacity = "1"
                    line1El.style.transform = "translateY(0)"
                    slotOuter.style.opacity = "0"
                    finalEl.style.top = "0px"
                    finalEl.style.opacity = "1"
                    finalEl.style.color = "rgb(255,255,255)"
                    hasResolved = true
                    rafId = 0
                }
            }

            rafId = requestAnimationFrame(frame)

            let taglineRaf = 0
            setTimeout(() => {
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
                    const { fontSizeStr, lineH, glyphH, lineGap, padding, maxW } = calcLayout()
                    applyResolvedState(fontSizeStr, lineH, glyphH, lineGap, padding, maxW, resolvedNCar)
                }
            }, 100)
        }

        function handleScroll() {
            const scrollY = window.scrollY
            const raw = (scrollY - SCROLL_FADE.fadeStart) / (SCROLL_FADE.fadeEnd - SCROLL_FADE.fadeStart)
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