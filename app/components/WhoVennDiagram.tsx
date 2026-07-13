"use client"

// VennDiagram.tsx
// app/components/
// Who I Am page — animated three-circle Venn diagram
// v02 — ported to Next.js 2026-06-22

import { useEffect, useRef, useCallback } from "react"
import { COLORS } from "./Tokens"

// ─── TUNING ───────────────────────────────────────────────────────────────────

const ANIM = {
    drawDur: 1500,
    textOffset: -250,
    textDur: 1500,
    c2Delay: 500,
    c3Delay: 1000,
    c2Rot: -46,
    c3Rot: 14,
    fillFadeDelay: 0,
    fillFadeDur: 600,
    hoverDur: 500,
    linger: 400,
}

const CIRCLE = {
    strokeWeight: 1.5,
    strokeOpacity: 0.7,
    fillOpacity: 0,
    labelSizeRatio: 0.22,
    labelWeight: 600,
    labelColor: COLORS.white,
}

const OVERLAP = {
    fillOp: 0.2,
    hoverOp: 0.7,
    colors: [
        COLORS.thinking,
        COLORS.welcome,
        COLORS.contact,
        COLORS.white,
    ],
    labels: ["Expression", "Discovery", "Utility", "Me"],
    labelRestRatio: 0.18,
    labelHoverRatio: 0.22,
    labelColor: COLORS.white,
    outsideOffset: 44,
    xOffsets: [0, 28, -14, 0],
}

const GEOMETRY = {
    overlapPct: 0.27,
    vertRatio: 0.86,
}

const SCROLL_FADE = {
    fadeInStart: 150,
    fadeInEnd: 300,
    animDelay: 200,
    resetDelay: 650,
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const OVERLAP_CI = [
    [0, 1],
    [1, 2],
    [0, 2],
    [0, 1, 2],
]

function easeF(t: number, type = "easeOut"): number {
    t = Math.max(0, Math.min(1, t))
    if (type === "linear") return t
    if (type === "easeIn") return t * t
    if (type === "easeOut") return 1 - (1 - t) * (1 - t)
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOut(t: number): number {
    return 1 - (1 - Math.max(0, Math.min(1, t))) ** 2
}

function hexRgb(hex: string): string {
    const h = hex.replace("#", "")
    return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
}

function applyCase(s: string): string {
    return s
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
}

function getCirclePositions(R: number, W: number, H: number, xOffset: number) {
    const cx = W / 2 + xOffset
    const cy = H / 2
    const d = R * (2 - GEOMETRY.overlapPct * 2)
    const vert = d * GEOMETRY.vertRatio
    return [
        { x: cx - d * 0.5, y: cy - vert * 0.4, label: "Design" },
        { x: cx + d * 0.5, y: cy - vert * 0.4, label: "Art" },
        { x: cx, y: cy + vert * 0.6, label: "Technology" },
    ]
}

function inCircle(
    px: number,
    py: number,
    ci: number,
    circles: { x: number; y: number }[],
    R: number
): boolean {
    const c = circles[ci]
    return (px - c.x) ** 2 + (py - c.y) ** 2 <= R * R
}

function inOverlap(
    px: number,
    py: number,
    oi: number,
    circles: { x: number; y: number }[],
    R: number
): boolean {
    const ci = OVERLAP_CI[oi]
    if (!ci.every((i) => inCircle(px, py, i, circles, R))) return false
    if (ci.length === 2) {
        const excl = [0, 1, 2].find((i) => !ci.includes(i))!
        if (inCircle(px, py, excl, circles, R)) return false
    }
    return true
}

function drawOverlapFill(
    ctx: CanvasRenderingContext2D,
    circles: { x: number; y: number }[],
    oi: number,
    alpha: number,
    color: string,
    R: number,
    W: number,
    H: number
) {
    if (alpha <= 0.001) return
    const ci = OVERLAP_CI[oi]
    const off = document.createElement("canvas")
    off.width = W
    off.height = H
    const oc = off.getContext("2d")!
    oc.fillStyle = `rgba(${hexRgb(color)},${alpha})`
    oc.beginPath()
    oc.arc(circles[ci[0]].x, circles[ci[0]].y, R, 0, Math.PI * 2)
    oc.fill()
    oc.globalCompositeOperation = "destination-in"
    oc.beginPath()
    oc.arc(circles[ci[1]].x, circles[ci[1]].y, R, 0, Math.PI * 2)
    oc.fill()
    if (ci.length === 3) {
        oc.beginPath()
        oc.arc(circles[ci[2]].x, circles[ci[2]].y, R, 0, Math.PI * 2)
        oc.fill()
    } else {
        const excl = [0, 1, 2].find((i) => !ci.includes(i))!
        oc.globalCompositeOperation = "destination-out"
        oc.beginPath()
        oc.arc(circles[excl].x, circles[excl].y, R, 0, Math.PI * 2)
        oc.fill()
    }
    ctx.drawImage(off, 0, 0)
}

function getOuterLabelPos(
    circles: { x: number; y: number }[],
    oi: number,
    R: number,
    xOffset: number
): { x: number; y: number } {
    const ci = OVERLAP_CI[oi]
    if (ci.length === 3) {
        return {
            x: circles.reduce((s, c) => s + c.x, 0) / 3,
            y: circles.reduce((s, c) => s + c.y, 0) / 3,
        }
    }
    const a = circles[ci[0]],
        b = circles[ci[1]]
    const excl = [0, 1, 2].find((i) => !ci.includes(i))!
    const tc = circles[excl]
    const dx = b.x - a.x,
        dy = b.y - a.y,
        dist = Math.sqrt(dx * dx + dy * dy) || 1
    const mx = (a.x + b.x) / 2,
        my = (a.y + b.y) / 2
    const nx = -dy / dist,
        ny = dx / dist
    const dot = (mx + nx - tc.x) * nx + (my + ny - tc.y) * ny
    const sign = dot > 0 ? 1 : -1
    const h = Math.sqrt(Math.max(0, R * R - (dist / 2) ** 2))
    const ix = mx + sign * nx * h,
        iy = my + sign * ny * h
    const allMx = circles.reduce((s, c) => s + c.x, 0) / 3
    const allMy = circles.reduce((s, c) => s + c.y, 0) / 3
    const ox = ix - allMx,
        oy = iy - allMy,
        od = Math.sqrt(ox * ox + oy * oy) || 1
    return {
        x: ix + (ox / od) * OVERLAP.outsideOffset + xOffset,
        y: iy + (oy / od) * OVERLAP.outsideOffset,
    }
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

interface Props {
    scale?: number
    xOffset?: number
    triggerOnScroll?: boolean
}

export default function VennDiagram({
    scale = 1,
    xOffset = 0,
    triggerOnScroll = false,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const progRef = useRef([0, 0, 0])
    const textAlphaRef = useRef([0, 0, 0])
    const oAlphaRef = useRef([0, 0, 0, 0])
    const oTargetAlphaRef = useRef([0, 0, 0, 0])
    const oLabelSzRef = useRef([0, 0, 0, 0])
    const hoveredOverlapRef = useRef(-1)
    const allDoneRef = useRef(false)
    const animRunningRef = useRef(false)

    const rafIdRef = useRef<number | null>(null)
    const hoverRafIdRef = useRef<number | null>(null)
    const fillFadeRafIdRef = useRef<number | null>(null)
    const fillFadeStartRef = useRef<number | null>(null)
    const animStartRef = useRef<number | null>(null)
    const lingerTimersRef = useRef<(ReturnType<typeof setTimeout> | null)[]>([
        null, null, null, null,
    ])

    const RRef = useRef(100)
    const scaleRef = useRef(scale)
    const xOffsetRef = useRef(xOffset)
    scaleRef.current = scale
    xOffsetRef.current = xOffset

    const drawScene = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const W = canvas.width,
            H = canvas.height
        const R = RRef.current
        const circles = getCirclePositions(R, W, H, xOffsetRef.current)
        const prog = progRef.current
        const textAlpha = textAlphaRef.current
        const oAlpha = oAlphaRef.current
        const oLabelSz = oLabelSzRef.current

        ctx.clearRect(0, 0, W, H)

        for (let oi = 0; oi < 4; oi++) {
            drawOverlapFill(ctx, circles, oi, oAlpha[oi], OVERLAP.colors[oi], R, W, H)
        }

        for (let ci = 0; ci < 3; ci++) {
            if (CIRCLE.fillOpacity > 0) {
                ctx.save()
                ctx.beginPath()
                ctx.arc(circles[ci].x, circles[ci].y, R, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${hexRgb(COLORS.white)},${CIRCLE.fillOpacity})`
                ctx.fill()
                ctx.restore()
            }
            if (CIRCLE.strokeWeight > 0 && CIRCLE.strokeOpacity > 0 && prog[ci] > 0) {
                const rotDeg = ci === 1 ? ANIM.c2Rot : ci === 2 ? ANIM.c3Rot : 0
                const startA = -Math.PI / 2 + (rotDeg * Math.PI) / 180
                ctx.save()
                ctx.beginPath()
                ctx.arc(circles[ci].x, circles[ci].y, R, startA, startA + Math.PI * 2 * prog[ci])
                ctx.strokeStyle = `rgba(${hexRgb(COLORS.white)},${CIRCLE.strokeOpacity})`
                ctx.lineWidth = CIRCLE.strokeWeight
                ctx.stroke()
                ctx.restore()
            }
        }

        const labelSz = R * CIRCLE.labelSizeRatio
        for (let ci = 0; ci < 3; ci++) {
            if (textAlpha[ci] <= 0) continue
            ctx.save()
            ctx.globalAlpha = textAlpha[ci]
            ctx.font = `${CIRCLE.labelWeight} ${labelSz}px Archivo, sans-serif`
            ctx.fillStyle = CIRCLE.labelColor
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(applyCase(circles[ci].label), circles[ci].x, circles[ci].y)
            ctx.restore()
        }

        for (let oi = 0; oi < 4; oi++) {
            const sz = oLabelSz[oi]
            const restSz = R * OVERLAP.labelRestRatio
            const hoverSz = R * OVERLAP.labelHoverRatio
            const range = hoverSz - restSz || 1
            const alpha = Math.max(0, Math.min(1, (sz - restSz) / range))
            if (alpha <= 0.01) continue

            const pos =
                oi !== 3
                    ? getOuterLabelPos(circles, oi, R, OVERLAP.xOffsets[oi])
                    : (() => {
                          const pts = OVERLAP_CI[oi].map((i) => circles[i])
                          return {
                              x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
                              y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
                          }
                      })()

            ctx.save()
            ctx.globalAlpha = alpha
            ctx.font = `600 ${sz}px Archivo, sans-serif`
            ctx.fillStyle = OVERLAP.labelColor
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(OVERLAP.labels[oi], pos.x, pos.y)
            ctx.restore()
        }
    }, [])

    const tickHover = useCallback(() => {
        const dur = Math.max(ANIM.hoverDur, 1)
        const step = 16 / dur
        let active = false
        const oAlpha = oAlphaRef.current
        const oTarget = oTargetAlphaRef.current
        const oLabelSz = oLabelSzRef.current
        const hovered = hoveredOverlapRef.current
        const R = RRef.current
        const restSz = R * OVERLAP.labelRestRatio
        const hoverSz = R * OVERLAP.labelHoverRatio

        for (let oi = 0; oi < 4; oi++) {
            const diff = oTarget[oi] - oAlpha[oi]
            if (Math.abs(diff) > 0.002) {
                oAlpha[oi] += diff * step * 2
                if (Math.abs(oTarget[oi] - oAlpha[oi]) < 0.002) oAlpha[oi] = oTarget[oi]
                active = true
            } else oAlpha[oi] = oTarget[oi]

            const tSz = oi === hovered ? hoverSz : restSz
            const sdiff = tSz - oLabelSz[oi]
            if (Math.abs(sdiff) > 0.05) {
                oLabelSz[oi] += sdiff * step * 2.5
                if (Math.abs(tSz - oLabelSz[oi]) < 0.05) oLabelSz[oi] = tSz
                active = true
            } else oLabelSz[oi] = tSz
        }

        drawScene()
        if (active) hoverRafIdRef.current = requestAnimationFrame(tickHover)
        else hoverRafIdRef.current = null
    }, [drawScene])

    const startHoverAnim = useCallback(() => {
        if (hoverRafIdRef.current) cancelAnimationFrame(hoverRafIdRef.current)
        hoverRafIdRef.current = requestAnimationFrame(tickHover)
    }, [tickHover])

    const setHovered = useCallback(
        (oi: number) => {
            if (!allDoneRef.current) return
            lingerTimersRef.current.forEach((t, i) => {
                if (t) {
                    clearTimeout(t)
                    lingerTimersRef.current[i] = null
                }
            })
            hoveredOverlapRef.current = oi
            for (let i = 0; i < 4; i++) {
                oTargetAlphaRef.current[i] = i === oi ? OVERLAP.hoverOp : OVERLAP.fillOp
            }
            startHoverAnim()
        },
        [startHoverAnim]
    )

    const clearHovered = useCallback(() => {
        if (!allDoneRef.current) return
        const prev = hoveredOverlapRef.current
        hoveredOverlapRef.current = -1
        if (prev < 0) return
        lingerTimersRef.current[prev] = setTimeout(() => {
            oTargetAlphaRef.current[prev] = OVERLAP.fillOp
            startHoverAnim()
        }, ANIM.linger)
    }, [startHoverAnim])

    const runFillFadeIn = useCallback(
        (ts: number) => {
            if (!fillFadeStartRef.current) fillFadeStartRef.current = ts
            const t = easeOut(
                (ts - fillFadeStartRef.current - ANIM.fillFadeDelay) / ANIM.fillFadeDur
            )
            for (let i = 0; i < 4; i++) {
                if (hoveredOverlapRef.current !== i) {
                    oAlphaRef.current[i] = t * OVERLAP.fillOp
                    oTargetAlphaRef.current[i] = OVERLAP.fillOp
                }
            }
            drawScene()
            if (t < 1) {
                fillFadeRafIdRef.current = requestAnimationFrame(runFillFadeIn)
            } else {
                for (let i = 0; i < 4; i++) {
                    if (hoveredOverlapRef.current !== i) {
                        oAlphaRef.current[i] = OVERLAP.fillOp
                        oTargetAlphaRef.current[i] = OVERLAP.fillOp
                    }
                }
                drawScene()
                fillFadeRafIdRef.current = null
            }
        },
        [drawScene]
    )

    const animFrame = useCallback(
        (ts: number) => {
            if (!animStartRef.current) animStartRef.current = ts
            const el = ts - animStartRef.current
            const delays = [0, ANIM.c2Delay, ANIM.c3Delay]
            let done = true

            for (let ci = 0; ci < 3; ci++) {
                progRef.current[ci] = easeF((el - delays[ci]) / ANIM.drawDur)
                textAlphaRef.current[ci] = easeF(
                    (el - delays[ci] - ANIM.textOffset) / ANIM.textDur
                )
                if (progRef.current[ci] < 1 || textAlphaRef.current[ci] < 1) done = false
            }

            drawScene()

            if (!done) {
                rafIdRef.current = requestAnimationFrame(animFrame)
            } else {
                progRef.current = [1, 1, 1]
                textAlphaRef.current = [1, 1, 1]
                allDoneRef.current = true
                drawScene()
                animRunningRef.current = false
                rafIdRef.current = null
                fillFadeStartRef.current = null
                requestAnimationFrame(runFillFadeIn)
            }
        },
        [drawScene, runFillFadeIn]
    )

    const playAnimation = useCallback(() => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
        if (hoverRafIdRef.current) cancelAnimationFrame(hoverRafIdRef.current)
        if (fillFadeRafIdRef.current) cancelAnimationFrame(fillFadeRafIdRef.current)
        lingerTimersRef.current.forEach((t, i) => {
            if (t) {
                clearTimeout(t)
                lingerTimersRef.current[i] = null
            }
        })

        progRef.current = [0, 0, 0]
        textAlphaRef.current = [0, 0, 0]
        oAlphaRef.current = [0, 0, 0, 0]
        oTargetAlphaRef.current = [0, 0, 0, 0]
        const R = RRef.current
        oLabelSzRef.current = [
            R * OVERLAP.labelRestRatio,
            R * OVERLAP.labelRestRatio,
            R * OVERLAP.labelRestRatio,
            R * OVERLAP.labelRestRatio,
        ]
        allDoneRef.current = false
        hoveredOverlapRef.current = -1
        fillFadeStartRef.current = null
        animStartRef.current = null
        animRunningRef.current = true
        rafIdRef.current = requestAnimationFrame(animFrame)
    }, [animFrame])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const containerW = entry.contentRect.width
            const canvas = canvasRef.current
            if (!canvas) return

            const R = containerW * 0.18 * scaleRef.current
            RRef.current = R

            const d = R * (2 - GEOMETRY.overlapPct * 2)
            const vert = d * GEOMETRY.vertRatio
            const canvasH = vert * 1.0 + R * 2.4
            canvas.width = containerW
            canvas.height = canvasH
            container.style.height = `${canvasH}px`

            oLabelSzRef.current = oLabelSzRef.current.map((sz, i) =>
                hoveredOverlapRef.current === i
                    ? R * OVERLAP.labelHoverRatio
                    : R * OVERLAP.labelRestRatio
            )

            drawScene()
        })

        observer.observe(container)
        return () => observer.disconnect()
    }, [drawScene])

    useEffect(() => {
        if (!triggerOnScroll) {
            playAnimation()
            return
        }

        let animTriggered = false
        let resetTimer: ReturnType<typeof setTimeout> | null = null

        function handleScroll() {
            const container = containerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            const viewH = window.innerHeight
            const distFromBottom =
                viewH - rect.bottom + (rect.bottom - rect.top) * 0.5
            const raw =
                (distFromBottom - SCROLL_FADE.fadeInStart) /
                (SCROLL_FADE.fadeInEnd - SCROLL_FADE.fadeInStart)
            const opacity = Math.max(0, Math.min(1, raw))

            if (container.parentElement) {
                container.parentElement.style.opacity = String(opacity)
            }

            if (opacity === 0 && animTriggered) {
                if (!resetTimer) {
                    resetTimer = setTimeout(() => {
                        animTriggered = false
                        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
                        if (hoverRafIdRef.current) cancelAnimationFrame(hoverRafIdRef.current)
                        if (fillFadeRafIdRef.current) cancelAnimationFrame(fillFadeRafIdRef.current)
                        progRef.current = [0, 0, 0]
                        textAlphaRef.current = [0, 0, 0]
                        oAlphaRef.current = [0, 0, 0, 0]
                        oTargetAlphaRef.current = [0, 0, 0, 0]
                        allDoneRef.current = false
                        hoveredOverlapRef.current = -1
                        animRunningRef.current = false
                        resetTimer = null
                    }, SCROLL_FADE.resetDelay)
                }
            } else {
                if (resetTimer) {
                    clearTimeout(resetTimer)
                    resetTimer = null
                }
            }

            if (opacity > 0 && !animTriggered) {
                animTriggered = true
                setTimeout(() => playAnimation(), SCROLL_FADE.animDelay)
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener("scroll", handleScroll)
    }, [triggerOnScroll, playAnimation])

    useEffect(() => {
        function handleMouseMove(e: MouseEvent) {
            if (animRunningRef.current || !allDoneRef.current) return
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const mx = e.clientX - rect.left
            const my = e.clientY - rect.top
            const R = RRef.current
            const circles = getCirclePositions(R, canvas.width, canvas.height, xOffsetRef.current)

            let found = -1
            for (let oi = 3; oi >= 0; oi--) {
                if (inOverlap(mx, my, oi, circles, R)) {
                    found = oi
                    break
                }
            }

            if (found !== hoveredOverlapRef.current) {
                if (found >= 0) setHovered(found)
                else clearHovered()
            }
        }

        function handleMouseLeave() {
            if (!animRunningRef.current && allDoneRef.current && hoveredOverlapRef.current !== -1) {
                clearHovered()
            }
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseleave", handleMouseLeave)
        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [setHovered, clearHovered])

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <div
                ref={containerRef}
                style={{ position: "relative", width: "100%" }}
            >
                <canvas
                    ref={canvasRef}
                    style={{ display: "block", width: "100%" }}
                />
            </div>
        </div>
    )
}