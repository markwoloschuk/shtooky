"use client"

// EverythingIsInteresting.tsx
// v5 — scroll-driven per-line opacity

import * as React from "react"
import ReactDOM from "react-dom"
import { useEffect, useRef, useState } from "react"
import { COLORS, TYPE, SPACE, TIMING } from "./Tokens"

// ─── Tuning ───────────────────────────────────────────────────────────────────

const CA = {
    layerMin: 2,
    layerMax: 8,
    distXMin: 25,
    distXMax: 90,
    distYMin: 15,
    distYMax: 30,
    opacMin: 0.6,
    opacMax: 0.8,
    speedMin: 0.5,
    speedMax: 1.0,
    opacFalloffMin: 0.0,
    opacFalloffMax: 0.5,
    scaleFalloffMin: 0.0,
    scaleFalloffMax: 1.0,
    radius: 250,
    yScale: 3,
    mouseBias: 0.3,
    easeIn: 0.05,
    easeOut: 0.015,
    canvasVMult: 3,
}

const FRONT_COLORS = [COLORS.work, COLORS.thinking]
const BACK_COLORS = [COLORS.welcome, COLORS.about, COLORS.contact]
const DEBUG = false // set to false to hide overlay

// ─── Scroll fade tuning ───────────────────────────────────────────────────────

const SCROLL_FADE = {
    gateMs: 2000,
    scrollStart: 38, // scrollY where line 0 starts
    fadeZone: 120, // px of scroll for each line to go 0→1
    lineStagger: 40, // px between each line starting
    topMargin: 30,
    topFadeZone: 160,
    yOffset: 0,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexRgb(h: string): [number, number, number] {
    return [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
    ]
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function getLayerColor(i: number, backColors: string[]): string {
    if (i < FRONT_COLORS.length) return FRONT_COLORS[i]
    return backColors[(i - FRONT_COLORS.length) % backColors.length]
}

function sineDisp(
    t: number,
    i: number,
    mvx: number,
    mvy: number
): [number, number] {
    const p0 = i * 1.618,
        p1 = i * 2.399,
        p2 = i * 0.927
    const ddx =
        Math.sin(t * 1.1 + p0) * 0.5 +
        Math.sin(t * 0.37 + p1 + mvx * 0.8) * 0.32 +
        Math.sin(t * 2.71 - p2) * 0.18
    const ddy =
        Math.cos(t * 0.83 + p0) * 0.5 +
        Math.cos(t * 1.57 + p2 + mvy * 0.8) * 0.32 +
        Math.cos(t * 3.14 - p1) * 0.18
    return [ddx, ddy]
}

// ─── CA Canvas ────────────────────────────────────────────────────────────────

function CACanvas({
    opacity = 1,
    containerWidth,
}: {
    opacity?: number
    containerWidth: number
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const stateRef = useRef({
        proxF: 0,
        tProxF: 0,
        clock: 0,
        frame: 0,
        cursorIn: false,
        cursorX: 0,
        cursorY: 0,
        mdx: 0,
        mdy: 0,
        mouseVelX: 0,
        mouseVelY: 0,
        lastCX: 0,
        lastCY: 0,
        textCenterX: 0,
        backColors: [...BACK_COLORS].sort(() => Math.random() - 0.5),
        rafId: 0,
    })

    const fontSize = Math.round(
        (typeof window !== "undefined" ? window.innerWidth : 1440) *
            (TYPE.DISPLAY_HERO.sizeVw / 100)
    )
    const lineH = Math.round(fontSize * TYPE.DISPLAY_HERO.lineHeight)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const onMove = (e: MouseEvent) => {
            const r = canvas.getBoundingClientRect()
            const visibleRowCenterY = r.top + (r.height / CA.canvasVMult) * 0.5
            stateRef.current.cursorX =
                e.clientX - (r.left + stateRef.current.textCenterX)
            stateRef.current.cursorY = e.clientY - visibleRowCenterY
            stateRef.current.cursorIn = true
        }
        const onLeave = () => {
            stateRef.current.cursorIn = false
        }
        document.addEventListener("mousemove", onMove)
        document.addEventListener("mouseleave", onLeave)
        return () => {
            document.removeEventListener("mousemove", onMove)
            document.removeEventListener("mouseleave", onLeave)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const s = stateRef.current

        function loop() {
            s.rafId = requestAnimationFrame(loop)
            s.frame++
            const W = canvas!.width
            const H = canvas!.height
            const drawY = H / (CA.canvasVMult * 2)

            if (s.cursorIn) {
                const dist = Math.sqrt(
                    s.cursorX * s.cursorX +
                        s.cursorY * CA.yScale * (s.cursorY * CA.yScale)
                )
                s.tProxF = Math.max(0, Math.min(1, 1 - dist / CA.radius))
                const dLen = Math.max(1, dist)
                s.mdx += (-s.cursorX / dLen - s.mdx) * 0.08
                s.mdy += (-s.cursorY / dLen - s.mdy) * 0.08
                s.mouseVelX += (s.cursorX - s.lastCX - s.mouseVelX) * 0.1
                s.mouseVelY += (s.cursorY - s.lastCY - s.mouseVelY) * 0.1
                s.lastCX = s.cursorX
                s.lastCY = s.cursorY
            } else {
                s.tProxF = 0
                s.mdx += (0 - s.mdx) * 0.05
                s.mdy += (0 - s.mdy) * 0.05
                s.mouseVelX *= 0.95
                s.mouseVelY *= 0.95
            }

            const easeRate = s.tProxF > s.proxF ? CA.easeIn : CA.easeOut
            s.proxF += (s.tProxF - s.proxF) * easeRate
            const p = s.proxF
            const distX = lerp(CA.distXMin, CA.distXMax, p)
            const distY = lerp(CA.distYMin, CA.distYMax, p)
            const opac = lerp(CA.opacMin, CA.opacMax, p)
            const speed = lerp(CA.speedMin, CA.speedMax, p)
            const opacF = lerp(CA.opacFalloffMin, CA.opacFalloffMax, p)
            const scaleF = lerp(CA.scaleFalloffMin, CA.scaleFalloffMax, p)
            const layF = lerp(CA.layerMin, CA.layerMax, p)
            s.clock += speed * 0.016
            const mvx = Math.max(-1, Math.min(1, s.mouseVelX * 0.04))
            const mvy = Math.max(-1, Math.min(1, s.mouseVelY * 0.04))

            ctx!.clearRect(0, 0, W, H)
            const fs = Math.round(
                window.innerWidth * (TYPE.DISPLAY_HERO.sizeVw / 100)
            )
            const fontStr = `${TYPE.DISPLAY_HERO.weight} ${fs}px ${TYPE.display}`
            ctx!.font = fontStr
            s.textCenterX = ctx!.measureText("interesting").width * 0.5

            for (let i = CA.layerMax - 1; i >= 0; i--) {
                const presence = Math.max(0, Math.min(1, layF - i))
                if (presence <= 0) continue
                const tDepth = i / Math.max(CA.layerMax - 1, 1)
                const depthScale = 0.2 + tDepth * 0.8
                const [ddx, ddy] = sineDisp(s.clock, i, mvx, mvy)
                const biasStr = tDepth * p * CA.mouseBias
                const dx2 = (ddx + s.mdx * biasStr) * distX * depthScale
                const dy2 = (ddy + s.mdy * biasStr) * distY * depthScale
                const opacCurve = opacF > 0 ? Math.pow(1 - tDepth, opacF) : 1
                const scaleCurve =
                    scaleF > 0 ? Math.pow(1 - tDepth, scaleF * 0.35) : 1
                const alpha = opac * (0.15 + opacCurve * 0.85) * presence
                const scale = 0.75 + scaleCurve * 0.25
                const [r, g, b] = hexRgb(getLayerColor(i, s.backColors))
                ctx!.save()
                ctx!.globalAlpha = alpha
                ctx!.globalCompositeOperation = "screen"
                ctx!.translate(dx2, drawY + dy2)
                ctx!.scale(scale, scale)
                ctx!.font = fontStr
                ctx!.textAlign = "left"
                ctx!.textBaseline = "middle"
                ctx!.fillStyle = `rgb(${r},${g},${b})`
                ctx!.fillText("interesting", 0, 0)
                ctx!.restore()
            }

            ctx!.save()
            ctx!.globalAlpha = 1.0
            ctx!.globalCompositeOperation = "source-over"
            ctx!.font = fontStr
            ctx!.textAlign = "left"
            ctx!.textBaseline = "middle"
            ctx!.fillStyle = "#ffffff"
            ctx!.fillText("interesting", 0, drawY)
            ctx!.restore()
        }

        loop()
        return () => cancelAnimationFrame(s.rafId)
    }, [])

    useEffect(() => {
        const el = containerRef.current
        const canvas = canvasRef.current
        if (!el || !canvas) return
        const ro = new ResizeObserver(() => {
            canvas.width = el.offsetWidth
            canvas.height = el.offsetHeight * CA.canvasVMult
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: lineH,
                minHeight: 64,
                cursor: "default",
                pointerEvents: "auto",
                overflow: "visible",
                opacity: opacity,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${CA.canvasVMult * 100}%`,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

// ─── Text line ────────────────────────────────────────────────────────────────
const TextLine = React.forwardRef<
    HTMLDivElement,
    {
        children: React.ReactNode
        opacity?: number
        fontSize: number
    }
>(({ children, opacity = 1, fontSize }, ref) => (
    <div
        ref={ref}
        style={{
            opacity: opacity,
            fontSize: fontSize,
            fontFamily: TYPE.display,
            fontWeight: TYPE.DISPLAY.weight,
            letterSpacing: `${TYPE.DISPLAY.tracking}em`,
            lineHeight: TYPE.DISPLAY.lineHeight,
            color: "#ffffff",
            whiteSpace: "normal",
        }}
    >
        {children}
    </div>
))

function DebugOverlay() {
    if (!DEBUG) return null
    if (typeof document === "undefined") return null

    const lines = [
        {
            y: SCROLL_FADE.topMargin,
            label: "top fade starts",
            color: "#FF0000",
        },
        {
            y: SCROLL_FADE.topMargin + SCROLL_FADE.topFadeZone,
            label: "top fade ends",
            color: "#FF8800",
        },
        {
            y:
                window.innerHeight -
                SCROLL_FADE.scrollStart -
                SCROLL_FADE.fadeZone,
            label: "bottom fade ends",
            color: "#00FFAA",
        },
        {
            y: window.innerHeight - SCROLL_FADE.scrollStart,
            label: "bottom fade starts",
            color: "#00AAFF",
        },
    ]

    const el = (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 9999,
            }}
        >
            {lines.map((line, i) => (
                <div
                    key={i}
                    style={{
                        position: "fixed",
                        top: line.y + "px",
                        left: 0,
                        width: "100%",
                        height: "1px",
                        background: line.color,
                        opacity: 0.8,
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            left: "10px",
                            top: "-16px",
                            color: line.color,
                            fontSize: "11px",
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {line.label}: {line.y}px
                    </span>
                </div>
            ))}
        </div>
    )

    return ReactDOM.createPortal(el, document.body)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EverythingIsInteresting() {
    const blockRef = useRef<HTMLDivElement>(null)
    const lineRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
    const [lineOpacity, setLineOpacity] = useState([0, 0, 0, 0])
    const [containerWidth, setContainerWidth] = useState(0)
    const gateOpen = useRef(false)

    useEffect(() => {
        const block = blockRef.current
        if (!block) return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width)
            }
        })
        ro.observe(block)
        return () => ro.disconnect()
    }, [])

    const displayFontSize = Math.round(
        (typeof window !== "undefined" ? window.innerWidth : 1440) *
            (TYPE.DISPLAY.sizeVw / 100)
    )

    useEffect(() => {
        const block = blockRef.current
        if (!block) return

        const gateTimer = setTimeout(() => {
            gateOpen.current = true
        }, SCROLL_FADE.gateMs)

        function handleScroll() {
            if (!block || !gateOpen.current) return
            const rect = block.getBoundingClientRect()

            // ── Fade out — per-line, based on each line's own top and bottom ──
            if (rect.top < SCROLL_FADE.topFadeZone) {
                const fadeStart = SCROLL_FADE.topFadeZone // viewport y where fade begins
                const fadeEnd = SCROLL_FADE.topMargin // viewport y where fade ends (0 opacity)

                const opacities = [0, 1, 2, 3].map((i) => {
                    const lineEl = lineRefs.current[i]
                    const lineRect = lineEl
                        ? lineEl.getBoundingClientRect()
                        : rect

                    // For CACanvas (line 1), use visible bottom not actual bottom
                    const lineH = Math.round(
                        (typeof window !== "undefined"
                            ? window.innerWidth
                            : 1440) *
                            (TYPE.DISPLAY_HERO.sizeVw / 100) *
                            TYPE.DISPLAY_HERO.lineHeight
                    )
                    const bottom =
                        i === 1 ? lineRect.top + lineH : lineRect.bottom

                    const raw = (bottom - fadeEnd) / (fadeStart - fadeEnd)
                    return Math.max(0, Math.min(1, raw))
                })
                setLineOpacity(opacities)
                return
            }

            // ── Scroll-driven fade in ────────────────────────────────────
            const scrollY = window.scrollY
            const opacities = [0, 1, 2, 3].map((i) => {
                const start =
                    SCROLL_FADE.scrollStart + i * SCROLL_FADE.lineStagger
                const raw = (scrollY - start) / SCROLL_FADE.fadeZone
                return Math.max(0, Math.min(1, raw))
            })
            setLineOpacity(opacities)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            clearTimeout(gateTimer)
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    return (
        <div
            ref={blockRef}
            style={{
                width: "100%",
                paddingBottom: "0",
                display: "flex",
                flexDirection: "column",
                gap: `${SPACE.xs}px`,
                pointerEvents: "auto",
            }}
        >
            {DEBUG && <DebugOverlay />}
            <TextLine
                ref={(el) => {
                    lineRefs.current[0] = el
                }}
                opacity={lineOpacity[0]}
                fontSize={displayFontSize}
            >
                I believe ANY story can be
            </TextLine>
            <div
                ref={(el) => {
                    lineRefs.current[1] = el
                }}
            >
                <CACanvas
                    opacity={lineOpacity[1]}
                    containerWidth={containerWidth}
                />
            </div>

            <TextLine
                ref={(el) => {
                    lineRefs.current[2] = el
                }}
                opacity={lineOpacity[2]}
                fontSize={displayFontSize}
            >
                if it&rsquo;s told in the right way
            </TextLine>

            <TextLine
                ref={(el) => {
                    lineRefs.current[3] = el
                }}
                opacity={lineOpacity[3]}
                fontSize={displayFontSize}
            >
                and to the right audience.
            </TextLine>
        </div>
    )
}
