"use client"

// SkillsSphere.tsx
// app/components/
// Who I Am page — animated skills cloud
// v03 — ported to Next.js 2026-06-22

import { useEffect, useRef } from "react"
import { COLORS, DEBUG } from "./SiteTokens"

// ─── TUNING ───────────────────────────────────────────────────────────────────

const PLAY_DELAY = 0.5

const FOG_ENABLED = false

const playOnce = true

const SCROLL_FADE = {
    topStart: 1,
    topEnd: 0,
    bottomStart: 0.17,
    bottomEnd: 0.35,
}

const TEXTS = [
    "Video Editing",
    "Motion Graphics",
    "Documentaries",
    "Graphic Design",
    "Script Writing",
    "Interviewing",
    "Copy Editing",
    "Video Production",
    "Creative Direction",
    "Photography",
    "Art Direction",
    "Generative AI",
    "Color Correction",
    "Voice Over",
    "Casting",
    "Producing",
]

const CFG = {
    sphereRadius: 160,
    scaleX: 1.4,
    scaleY: 0.6,
    heightPad: 48,
    orbitSpeedMin: 3,
    orbitSpeedMax: 60,
    proxRadius: -10,
    textCase: "normal" as "normal" | "lower",
    textSizeW: 32,
    textWeight: 600,
    textTracking: -0.015,
    sizeFalloff: 0.55,
    colorDarkness: 0.7,
    textVariation: 5,
    textRange: 0,
    hoverRadiusW: 50,
    hoverBright: 1.0,
    hoverScale: 0.35,
    hoverEase: 0.05,
    hoverDecay: 0.01,
    hoverWhiteTime: 2.0,
    backOpacity: 0.65,
    dimCurve: 2.5,
    breatheAmt: 0.04,
    breatheSpeed: 0.05,
    bgFadeDuration: 2.0,
    textFadeDuration: 2.5,
    textStagger: 60,
    fogOpacity: 0.25,
    fogRadius: 0.25,
    fogFeather: 0.75,
    fogPulseAmt: 0.4,
    fogPulseSpeed: 0.15,
    particleCount: 100,
    particleSizeW: 3.5,
    particleSizeVar: 1.0,
    particleOpacity: 0.8,
    particleOpacityVar: 0.75,
    particleSpread: 126,
    particleSpeed: 0.05,
    particleSpeedVar: 0.5,
    travCount: 20,
    travSizeW: 2.5,
    travSizeVar: 1.0,
    travSpeed: 0.15,
    travOpacity: 1.0,
    travFade: 0.49,
    partVariation: 100,
    partRange: 35,
    travVariation: 100,
    travRange: 60,
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ORANGE = COLORS.about
const WHITE_HEX = "#E8E8E0"
const PAGE_COLORS = [
    COLORS.about,
    COLORS.welcome,
    COLORS.work,
    COLORS.thinking,
    COLORS.contact,
]

// ─── COLOR MATH ──────────────────────────────────────────────────────────────

function hexToRgb(h: string): [number, number, number] {
    return [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
    ]
}
function rgbStr(r: [number, number, number]) {
    return `${r[0]},${r[1]},${r[2]}`
}
function srgbToLinear(c: number) {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function linearToSrgb(v: number) {
    return Math.round(
        255 *
            (v <= 0.0031308
                ? 12.92 * v
                : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)
    )
}
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
    const l = srgbToLinear(r),
        m = srgbToLinear(g),
        s = srgbToLinear(b)
    const l2 = Math.pow(
        0.4122214708 * l + 0.5363325363 * m + 0.0514459929 * s,
        1 / 3
    )
    const m2 = Math.pow(
        0.2119034982 * l + 0.6806995451 * m + 0.1073969566 * s,
        1 / 3
    )
    const s2 = Math.pow(
        0.0883024619 * l + 0.2817188376 * m + 0.6299787005 * s,
        1 / 3
    )
    return [
        0.2104542553 * l2 + 0.793617785 * m2 - 0.0040720468 * s2,
        1.9779984951 * l2 - 2.428592205 * m2 + 0.4505937099 * s2,
        0.0259040371 * l2 + 0.7827717662 * m2 - 0.808675766 * s2,
    ]
}
function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
    const l2 = L + 0.3963377774 * a + 0.2158037573 * b
    const m2 = L - 0.1055613458 * a - 0.0638541728 * b
    const s2 = L - 0.0894841775 * a - 1.291485548 * b
    const l = l2 * l2 * l2,
        m = m2 * m2 * m2,
        s = s2 * s2 * s2
    return [
        Math.max(
            0,
            Math.min(
                255,
                linearToSrgb(
                    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
                )
            )
        ),
        Math.max(
            0,
            Math.min(
                255,
                linearToSrgb(
                    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
                )
            )
        ),
        Math.max(
            0,
            Math.min(
                255,
                linearToSrgb(
                    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
                )
            )
        ),
    ]
}
function lerpOklab(
    a: [number, number, number],
    b: [number, number, number],
    t: number
): [number, number, number] {
    const la = rgbToOklab(a[0], a[1], a[2]),
        lb = rgbToOklab(b[0], b[1], b[2])
    return oklabToRgb(
        la[0] + (lb[0] - la[0]) * t,
        la[1] + (lb[1] - la[1]) * t,
        la[2] + (lb[2] - la[2]) * t
    )
}
function buildPalette(
    baseKey: "orange" | "white",
    variation: number,
    range: number
): [number, number, number][] {
    const baseHex = baseKey === "white" ? WHITE_HEX : ORANGE
    const baseRgb = hexToRgb(baseHex)
    if (variation === 0) return [baseRgb]
    const colors: [number, number, number][] = [baseRgb]
    const numExtra = Math.round((variation / 100) * 7)
    const tintCount = Math.ceil(numExtra * 0.4)
    for (let i = 1; i <= tintCount; i++)
        colors.push(
            lerpOklab(baseRgb, [220, 220, 215], (i / (tintCount + 1)) * 0.55)
        )
    const shadeCount = Math.floor(numExtra * 0.25)
    for (let i = 1; i <= shadeCount; i++)
        colors.push(
            lerpOklab(baseRgb, [18, 18, 15], (i / (shadeCount + 1)) * 0.45)
        )
    if (range > 0) {
        let baseIdx = PAGE_COLORS.indexOf(baseHex)
        if (baseIdx < 0) baseIdx = 0
        const chromaCount = Math.round(
            (range / 100) * (numExtra - colors.length + 3)
        )
        for (let i = 0; i < chromaCount; i++) {
            let otherIdx = (baseIdx + 1 + i) % PAGE_COLORS.length
            if (otherIdx === baseIdx)
                otherIdx = (otherIdx + 1) % PAGE_COLORS.length
            colors.push(
                lerpOklab(
                    baseRgb,
                    hexToRgb(PAGE_COLORS[otherIdx]),
                    0.15 + (range / 100) * 0.7
                )
            )
        }
    }
    return colors
}
function pickRand<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Node {
    text: string
    ox: number
    oy: number
    oz: number
    sx: number
    sy: number
    sz: number
    depth: number
    fs: number
    sc: number
    bcy: number
    hov: number
    hovDwell: number
    whiteT: number
    alpha: number
}
interface Part {
    x: number
    y: number
    vx: number
    vy: number
    r: number
    ss: number
    ov: number
    color: [number, number, number]
}
interface Traveler {
    a: number
    b: number
    t: number
    color: [number, number, number]
    sizeScale: number
    speed: number
}

// ─── GEOMETRY ────────────────────────────────────────────────────────────────

function fibSphere(n: number): [number, number, number][] {
    const pts: [number, number, number][] = []
    const phi = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < n; i++) {
        const y = 1 - (i / Math.max(n - 1, 1)) * 2
        const r = Math.sqrt(Math.max(0, 1 - y * y))
        const t = phi * i
        pts.push([Math.cos(t) * r, y, Math.sin(t) * r])
    }
    return pts
}
function rotPt(ox: number, oy: number, oz: number, rx: number, ry: number) {
    const cx = Math.cos(rx),
        sx = Math.sin(rx)
    const y1 = oy * cx - oz * sx,
        z1 = oy * sx + oz * cx
    const cy = Math.cos(ry),
        sy = Math.sin(ry)
    return { x: ox * cy + z1 * sy, y: y1, z: -ox * sy + z1 * cy }
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function SkillsSphere() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const debugRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let W = 0,
            H = 0
        const dpr = window.devicePixelRatio || 1

        const REFERENCE_W = 800
        let SCALE = 1

        function resize() {
            W = container!.clientWidth
            H = container!.clientHeight
            SCALE = W / REFERENCE_W
            canvas!.width = Math.round(W * dpr)
            canvas!.height = Math.round(H * dpr)
            canvas!.style.width = W + "px"
            canvas!.style.height = H + "px"
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        const ro = new ResizeObserver(resize)
        ro.observe(container)
        resize()

        const mOff = document.createElement("canvas").getContext("2d")!
        function meas(text: string, size: number, weight: number) {
            mOff.font = `${weight} ${size}px Archivo, sans-serif`
            const m = mOff.measureText(text)
            return {
                w: m.width,
                asc: m.actualBoundingBoxAscent ?? size * 0.72,
                desc: m.actualBoundingBoxDescent ?? size * 0.2,
            }
        }

        function applyCase(s: string) {
            return CFG.textCase === "lower" ? s.toLowerCase() : s
        }

        let nodes: Node[] = []
        let nodeColors: [number, number, number][] = []
        let rotX = 0,
            rotY = 0
        let svx = 0.0006,
            svy = 0.0012

        function buildNodes() {
            const pts = fibSphere(TEXTS.length)
            const pal = buildPalette("orange", CFG.textVariation, CFG.textRange)
            nodeColors = TEXTS.map(() => pickRand(pal))
            nodes = TEXTS.map((text, i) => ({
                text,
                ox: pts[i][0],
                oy: pts[i][1],
                oz: pts[i][2],
                sx: 0,
                sy: 0,
                sz: 0,
                depth: 0,
                fs: 0,
                sc: 0,
                bcy: 0,
                hov: 0,
                hovDwell: 0,
                whiteT: 0,
                alpha: 0,
            }))
            buildTravelers()
        }

        let parts: Part[] = []
        function mkPart(): Part {
            const spreadR = CFG.particleSpread * SCALE
            const angle = Math.random() * Math.PI * 2
            const dist = spreadR * (0.3 + Math.random() * 0.8)
            const spd =
                CFG.particleSpeed *
                SCALE *
                (1 -
                    CFG.particleSpeedVar / 2 +
                    Math.random() * CFG.particleSpeedVar)
            const vAngle = Math.random() * Math.PI * 2
            const pal = buildPalette("orange", CFG.partVariation, CFG.partRange)
            return {
                x: W / 2 + Math.cos(angle) * dist,
                y: H / 2 + Math.sin(angle) * dist,
                vx: Math.cos(vAngle) * spd,
                vy: Math.sin(vAngle) * spd,
                r: 0.3 + Math.random() * 0.7,
                ss:
                    1 -
                    CFG.particleSizeVar / 2 +
                    Math.random() * CFG.particleSizeVar,
                ov:
                    1 -
                    CFG.particleOpacityVar / 2 +
                    Math.random() * CFG.particleOpacityVar,
                color: pickRand(pal),
            }
        }
        function syncParts() {
            while (parts.length < CFG.particleCount) parts.push(mkPart())
            parts.length = CFG.particleCount
        }

        let travelers: Traveler[] = []
        function mkTraveler(): Traveler | null {
            if (nodes.length < 2) return null
            let a = Math.floor(Math.random() * nodes.length),
                b: number
            do {
                b = Math.floor(Math.random() * nodes.length)
            } while (b === a)
            const pal = buildPalette("orange", CFG.travVariation, CFG.travRange)
            return {
                a,
                b,
                t: 0,
                color: pickRand(pal),
                sizeScale:
                    1 - CFG.travSizeVar / 2 + Math.random() * CFG.travSizeVar,
                speed: CFG.travSpeed * (0.6 + Math.random() * 0.8),
            }
        }
        function buildTravelers() {
            travelers = []
            for (let i = 0; i < CFG.travCount; i++) {
                const tr = mkTraveler()
                if (tr) travelers.push(tr)
            }
        }
        function syncTravelers() {
            while (travelers.length < CFG.travCount) {
                const tr = mkTraveler()
                if (tr) travelers.push(tr)
            }
            travelers.length = Math.min(travelers.length, CFG.travCount)
        }

        let mcx = 0,
            mcy = 0
        let proxF = 0,
            tProxF = 0
        let drag = { on: false, lx: 0, ly: 0, vx: 0, vy: 0 }

        function onMouseDown(e: MouseEvent) {
            drag = { on: true, lx: e.clientX, ly: e.clientY, vx: 0, vy: 0 }
            svx = 0
            svy = 0
            canvas!.style.cursor = "grabbing"
        }
        function onMouseUp() {
            drag.on = false
            canvas!.style.cursor = "grab"
        }
        function onMouseMove(e: MouseEvent) {
            if (drag.on) {
                drag.vx = (e.clientX - drag.lx) * 0.012
                drag.vy = (e.clientY - drag.ly) * 0.012
                rotY += drag.vx
                rotX -= drag.vy
                drag.lx = e.clientX
                drag.ly = e.clientY
            } else {
                const r = canvas!.getBoundingClientRect()
                mcx = e.clientX - r.left
                mcy = e.clientY - r.top
            }
        }
        function onTouchStart(e: TouchEvent) {
            e.preventDefault()
            const t = e.touches[0]
            drag = { on: true, lx: t.clientX, ly: t.clientY, vx: 0, vy: 0 }
        }
        function onTouchEnd() {
            drag.on = false
        }
        function onTouchMove(e: TouchEvent) {
            e.preventDefault()
            if (!drag.on) return
            const t = e.touches[0]
            drag.vx = (t.clientX - drag.lx) * 0.012
            drag.vy = (t.clientY - drag.ly) * 0.012
            rotY += drag.vx
            rotX -= drag.vy
            drag.lx = t.clientX
            drag.ly = t.clientY
        }

        document.addEventListener("mousedown", onMouseDown)
        document.addEventListener("mouseup", onMouseUp)
        document.addEventListener("mousemove", onMouseMove)
        canvas.addEventListener("touchstart", onTouchStart, { passive: false })
        canvas.addEventListener("touchend", onTouchEnd)
        canvas.addEventListener("touchmove", onTouchMove, { passive: false })

        let fogPulseT = 0
        function drawFog(dt: number, bgIntro: number) {
            if (!FOG_ENABLED || !CFG.fogOpacity || !W || !H) return
            fogPulseT += dt * CFG.fogPulseSpeed
            const pulse = Math.sin(fogPulseT * Math.PI * 2) * 0.5 + 0.5
            const pScale = 1 + pulse * CFG.fogPulseAmt
            const pOpacity = CFG.fogOpacity * (0.75 + pulse * 0.25) * bgIntro
            const coreR =
                W *
                CFG.sphereRadius *
                CFG.fogRadius *
                pScale *
                Math.max(CFG.scaleX, CFG.scaleY) *
                1.6
            const outerR = coreR * (1 + CFG.fogFeather)
            const col = hexToRgb(ORANGE)
            try {
                const g = ctx!.createRadialGradient(
                    W / 2,
                    H / 2,
                    0,
                    W / 2,
                    H / 2,
                    outerR
                )
                g.addColorStop(0, `rgba(${rgbStr(col)},${pOpacity})`)
                g.addColorStop(
                    Math.min(0.99, coreR / outerR),
                    `rgba(${rgbStr(col)},${pOpacity * 0.4})`
                )
                g.addColorStop(1, `rgba(${rgbStr(col)},0)`)
                ctx!.fillStyle = g
                ctx!.fillRect(0, 0, W, H)
            } catch (_) {}
        }

        function getScrollOpacity(): number {
            if (!container) return 1
            if (DEBUG.disableScrollFades) return 1
            const rect = container.getBoundingClientRect()
            const vh = window.innerHeight
            const bottomFrac = rect.bottom / vh
            if (bottomFrac < SCROLL_FADE.bottomStart) return 0
            if (bottomFrac < SCROLL_FADE.bottomEnd)
                return (
                    (bottomFrac - SCROLL_FADE.bottomStart) /
                    (SCROLL_FADE.bottomEnd - SCROLL_FADE.bottomStart)
                )
            const topFrac = rect.top / vh
            if (topFrac > SCROLL_FADE.topStart) return 1
            if (topFrac > SCROLL_FADE.topEnd)
                return (
                    (topFrac - SCROLL_FADE.topEnd) /
                    (SCROLL_FADE.topStart - SCROLL_FADE.topEnd)
                )
            return 1
        }

        const WHITE_RGB: [number, number, number] = [232, 232, 224]
        const DARK_RGB: [number, number, number] = [18, 12, 0]

        let startTs = -1
        let hasPlayed = false
        let breathT = 0
        let rafId = 0
        let running = true
        let mountTs = performance.now()

        function tick(ts: number) {
            if (!running) return
            rafId = requestAnimationFrame(tick)

            const wallAge = (ts - mountTs) / 1000
            if (wallAge < PLAY_DELAY) {
                ctx!.clearRect(0, 0, W, H)
                return
            }

            if (!hasPlayed) {
                if (startTs < 0) startTs = ts
            }

            const age = startTs < 0 ? 0 : (ts - startTs) / 1000
            const dt = Math.min(1 / 30, 1 / 60)
            const maxIntroAge =
                CFG.textFadeDuration +
                (CFG.textStagger / 100) * CFG.textFadeDuration * 0.8 +
                0.5
            if (age > maxIntroAge && !hasPlayed) hasPlayed = true

            breathT += dt

            const effectiveAge =
                hasPlayed && playOnce ? maxIntroAge + 1 : age
            const bgRaw =
                CFG.bgFadeDuration > 0
                    ? Math.min(1, effectiveAge / CFG.bgFadeDuration)
                    : 1
            const bgIntro = 3 * bgRaw * bgRaw - 2 * bgRaw * bgRaw * bgRaw
            const breathe =
                1 +
                Math.sin(breathT * CFG.breatheSpeed * Math.PI * 2) *
                    CFG.breatheAmt

            const baseR = CFG.sphereRadius * SCALE * breathe
            const cloudPx = (W / 2 / CFG.scaleX) * 0.85
            const boostPx = cloudPx * (1 + CFG.proxRadius / 100)
            const dx = mcx - W / 2,
                dy = mcy - H / 2
            const yscale = CFG.scaleY / Math.max(0.01, CFG.scaleX)
            const dist = Math.sqrt(dx * dx + dy * yscale * (dy * yscale))
            tProxF = dist < boostPx ? Math.max(0, 1 - dist / boostPx) : 0
            proxF += (tProxF - proxF) * (tProxF > proxF ? 0.05 : 0.015)
            const speedNorm =
                CFG.orbitSpeedMin / 100 +
                ((CFG.orbitSpeedMax - CFG.orbitSpeedMin) / 100) * proxF

            if (!drag.on) {
                const sf = speedNorm * 0.022
                const dmx = (mcx / W || 0.5) - 0.5
                const dmy = (mcy / H || 0.5) - 0.5
                svx += (-dmy * sf * 0.55 + sf * 0.07 - svx) * 0.035
                svy += (dmx * sf * 0.55 + sf * 0.16 - svy) * 0.035
                rotX += svx
                rotY += svy
            } else {
                svx = 0
                svy = 0
                drag.vx *= 0.85
                drag.vy *= 0.85
            }

            const hoverR = CFG.hoverRadiusW * SCALE
            const textSz = CFG.textSizeW * SCALE

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i]
                const p = rotPt(n.ox, n.oy, n.oz, rotX, rotY)
                n.sx = W / 2 + p.x * baseR * CFG.scaleX
                n.sy = H / 2 + p.y * baseR * CFG.scaleY
                n.sz = p.z
                n.depth = (p.z + 1) / 2

                const depthScale = Math.pow(n.depth, CFG.sizeFalloff * 0.5)
                const rawSc = 0.4 + depthScale * 0.6

                const hdx = n.sx - mcx
                const hdy = (n.bcy || n.sy) - mcy
                const hDist = Math.sqrt(hdx * hdx + hdy * hdy)
                const hovT = hDist < hoverR ? 1 - hDist / hoverR : 0
                if (hovT > n.hov) n.hov += (hovT - n.hov) * CFG.hoverEase
                else n.hov += (hovT - n.hov) * CFG.hoverDecay

                if (n.hov > 0.05) {
                    n.hovDwell = Math.min(
                        CFG.hoverWhiteTime,
                        n.hovDwell + dt * n.hov
                    )
                } else {
                    n.hovDwell = Math.max(
                        0,
                        n.hovDwell -
                            ((dt * (1 / Math.max(0.01, CFG.hoverWhiteTime))) /
                                CFG.hoverDecay) *
                                0.5
                    )
                }
                const whiteTarget =
                    CFG.hoverWhiteTime > 0
                        ? Math.min(1, n.hovDwell / CFG.hoverWhiteTime)
                        : 0
                const whiteEase = whiteTarget > n.whiteT ? 0.04 : 0.008
                n.whiteT += (whiteTarget - n.whiteT) * whiteEase
                n.sc = rawSc * (1 + n.hov * CFG.hoverScale)

                const fs = textSz * n.sc
                const m = meas(applyCase(n.text), fs, CFG.textWeight)
                n.fs = fs
                n.bcy = n.sy + (m.desc - m.asc) / 2

                const opacDimmed = Math.pow(n.depth, CFG.dimCurve)
                const baseAlpha =
                    CFG.backOpacity + (1 - CFG.backOpacity) * opacDimmed

                let textFade = 1
                if (CFG.textFadeDuration > 0) {
                    const ndx = n.sx - W / 2,
                        ndy = (n.bcy || n.sy) - H / 2
                    const ndist = Math.sqrt(ndx * ndx + ndy * ndy)
                    const maxDist = Math.sqrt(W * W + H * H) * 0.5 || 1
                    const staggerWindow =
                        (CFG.textStagger / 100) * CFG.textFadeDuration * 0.8
                    const nodeStart = (ndist / maxDist) * staggerWindow
                    const nodeDur = Math.max(
                        0.05,
                        CFG.textFadeDuration - staggerWindow * 0.5
                    )
                    const nodeAge = Math.max(0, effectiveAge - nodeStart)
                    const tt = Math.min(1, nodeAge / nodeDur)
                    textFade = 3 * tt * tt - 2 * tt * tt * tt
                }
                n.alpha = Math.min(
                    1,
                    (baseAlpha + n.hov * CFG.hoverBright) * textFade
                )
            }

            ctx!.clearRect(0, 0, W, H)
            ctx!.save()

            drawFog(dt, bgIntro)

            const spreadR = W * CFG.particleSpread
            const partSize = CFG.particleSizeW * SCALE
            for (let i = 0; i < parts.length; i++) {
                const pt = parts[i]
                pt.x += pt.vx
                pt.y += pt.vy
                pt.vx *= 0.99
                pt.vy *= 0.99
                const pdx = pt.x - W / 2,
                    pdy = pt.y - H / 2
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy)
                if (pdist > spreadR * 0.95) {
                    const angle = Math.random() * Math.PI * 2
                    const dist = spreadR * (0.3 + Math.random() * 0.5)
                    pt.x = W / 2 + Math.cos(angle) * dist
                    pt.y = H / 2 + Math.sin(angle) * dist
                    pt.vx =
                        (Math.random() - 0.5) * CFG.particleSpeed * SCALE * 2
                    pt.vy =
                        (Math.random() - 0.5) * CFG.particleSpeed * SCALE * 2
                }
                const a = Math.min(
                    1,
                    pt.r * CFG.particleOpacity * (pt.ov || 1) * bgIntro
                )
                ctx!.beginPath()
                ctx!.fillStyle = `rgba(${rgbStr(pt.color)},${a})`
                ctx!.arc(
                    pt.x,
                    pt.y,
                    Math.max(0.3, pt.r * partSize * pt.ss),
                    0,
                    Math.PI * 2
                )
                ctx!.fill()
            }

            const travSize = CFG.travSizeW * SCALE
            syncTravelers()
            for (let i = travelers.length - 1; i >= 0; i--) {
                const tr = travelers[i]
                if (tr.a >= nodes.length || tr.b >= nodes.length) {
                    travelers.splice(i, 1)
                    continue
                }
                const na = nodes[tr.a],
                    nb = nodes[tr.b]
                tr.t += tr.speed * dt
                if (tr.t >= 1) {
                    const nt = mkTraveler()
                    if (nt) travelers[i] = nt
                    else travelers.splice(i, 1)
                    continue
                }
                const tx = na.sx + (nb.sx - na.sx) * tr.t
                const ty = na.bcy + (nb.bcy - na.bcy) * tr.t
                const fade = CFG.travFade
                let talpha =
                    tr.t < fade
                        ? tr.t / fade
                        : tr.t > 1 - fade
                          ? (1 - tr.t) / fade
                          : 1
                talpha =
                    Math.max(0, Math.min(1, talpha)) *
                    CFG.travOpacity *
                    bgIntro
                ctx!.beginPath()
                ctx!.fillStyle = `rgba(${rgbStr(tr.color)},${talpha})`
                ctx!.arc(
                    tx,
                    ty,
                    Math.max(0.5, travSize * tr.sizeScale),
                    0,
                    Math.PI * 2
                )
                ctx!.fill()
            }

            const sorted = nodes.slice().sort((a, b) => a.sz - b.sz)
            for (let i = 0; i < sorted.length; i++) {
                const n = sorted[i]
                const nodeIdx = nodes.indexOf(n)
                const orangeCol = nodeColors[nodeIdx] || hexToRgb(ORANGE)
                const darkT = (1 - n.depth) * CFG.colorDarkness
                const backCol = lerpOklab(orangeCol, DARK_RGB, darkT)
                const depthCol = lerpOklab(backCol, WHITE_RGB, n.depth)
                const col = lerpOklab(depthCol, WHITE_RGB, n.whiteT)
                const displayText = applyCase(n.text)

                ctx!.save()
                ctx!.globalAlpha = Math.max(0, Math.min(1, n.alpha))
                ctx!.font = `${CFG.textWeight} ${n.fs.toFixed(1)}px Archivo, sans-serif`
                ctx!.textBaseline = "alphabetic"

                if (CFG.textTracking !== 0) {
                    const letters = displayText.split("")
                    const spacing = CFG.textTracking * n.fs
                    let totalW = 0
                    const ws = letters.map((ch) => {
                        mOff.font = `${CFG.textWeight} ${n.fs.toFixed(1)}px Archivo, sans-serif`
                        const w = mOff.measureText(ch).width + spacing
                        totalW += w
                        return w
                    })
                    let cxPos = n.sx - totalW / 2 + ws[0] / 2
                    for (let j = 0; j < letters.length; j++) {
                        ctx!.fillStyle = `rgba(${rgbStr(col)},1)`
                        ctx!.fillText(letters[j], cxPos, n.sy)
                        cxPos += ws[j]
                    }
                } else {
                    ctx!.textAlign = "center"
                    ctx!.fillStyle = `rgba(${rgbStr(col)},1)`
                    ctx!.fillText(displayText, n.sx, n.sy)
                }
                ctx!.restore()
            }

            ctx!.restore()
        }

        function handleScrollFade() {
            if (!container) return
            if (window.scrollY < 10) {
                container.style.opacity = "1"
                return
            }
            const rect = container.getBoundingClientRect()
            const fadeOutStart = 300
            const fadeOutEnd = 50
            if (rect.bottom > fadeOutStart) {
                container.style.opacity = "1"
                return
            }
            const raw = (rect.bottom - fadeOutEnd) / (fadeOutStart - fadeOutEnd)
            container.style.opacity = String(Math.max(0, Math.min(1, raw)))
        }

        requestAnimationFrame(() => handleScrollFade())
        window.addEventListener("scroll", handleScrollFade, { passive: true })

        buildNodes()
        syncParts()
        mountTs = performance.now()
        rafId = requestAnimationFrame(tick)

        return () => {
            running = false
            cancelAnimationFrame(rafId)
            ro.disconnect()
            document.removeEventListener("mousedown", onMouseDown)
            document.removeEventListener("mouseup", onMouseUp)
            document.removeEventListener("mousemove", onMouseMove)
            canvas.removeEventListener("touchstart", onTouchStart)
            canvas.removeEventListener("touchend", onTouchEnd)
            canvas.removeEventListener("touchmove", onTouchMove)
            window.removeEventListener("scroll", handleScrollFade)
        }
    }, [])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
            }}
        >
            <div
                ref={containerRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "transparent",
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        cursor: "grab",
                        mixBlendMode: "screen",
                    }}
                />
            </div>
            {DEBUG.disableScrollFades && (
                <div
                    ref={debugRef}
                    id="skills-sphere-debug"
                    style={{
                        position: "fixed",
                        bottom: 80,
                        left: 16,
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        fontFamily: '"Archivo", sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        borderRadius: 3,
                        pointerEvents: "none",
                        zIndex: 100,
                    }}
                />
            )}
        </div>
    )
}