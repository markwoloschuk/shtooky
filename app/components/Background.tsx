// Background.tsx — shtooky.com
// Multiplaning atmospheric background system — v13 canvas rewrite
// Nebula and bokeh moved from DOM divs to canvas for Safari performance.
// v14: position fixed so page content can scroll over the background.

"use client"
import { useEffect, useRef, useState } from "react"
import { PAGES, NAV, COLORS, getActivePage } from "../components/Tokens"

interface NebulaParticle {
    x: number
    y: number
    size: number
    vx: number
    vy: number
    r: number
    g: number
    b: number
    lifespan: number
    fadedur: number
    age: number
    targetOpacity: number
    pulsePhase: number
    pulseRate: number
}

interface BokehParticle {
    x: number
    y: number
    size: number
    vx: number
    vy: number
    r: number
    g: number
    b: number
    lifespan: number
    fadedur: number
    age: number
    targetOpacity: number
    wigCurrent: number
    wigTarget: number
}

interface Leader {
    x: number
    y: number
    vx: number
    vy: number
    tx: number
    ty: number
    bandY0: number
    bandY1: number
    bandX0: number
    bandX1: number
    dwellTimer: number
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PALETTE = ["#00ADEE", "#EB008B", "#FAAF40", "#D6DE23", "#885198"]

const PALETTE_PROXIMITY: Record<string, string[]> = {
    "#00ADEE": ["#885198", "#D6DE23", "#FAAF40", "#EB008B"],
    "#EB008B": ["#885198", "#FAAF40", "#00ADEE", "#D6DE23"],
    "#FAAF40": ["#EB008B", "#D6DE23", "#885198", "#00ADEE"],
    "#D6DE23": ["#FAAF40", "#00ADEE", "#EB008B", "#885198"],
    "#885198": ["#EB008B", "#00ADEE", "#FAAF40", "#D6DE23"],
}

const TINT_COMP: Record<string, number> = {
    "#00ADEE": 1.0,
    "#EB008B": 0.75,
    "#FAAF40": 0.78,
    "#D6DE23": 0.72,
    "#885198": 0.95,
}
const CFG = {
    NB_COUNT: 12,
    NB_SMIN: 20,
    NB_SMAX: 65,
    NB_BRIGHT: 0.65,
    NB_OPMAX: 0.76,
    NB_OPMIN: 0.2,
    NB_TINT: 1.0,
    NB_COLORVAR: 50,
    NB_DRIFT: 1.2,
    NB_SOFT: 0.1,
    NB_LIFEMIN: 5,
    NB_LIFEMAX: 14,
    NB_FADEDUR: 4,
    NB_FADEVAR: 0.4,
    NB_SCROLLINF: 1.0,
    NB_DEPTH: 0.7,

    BK_COUNT: 24,
    BK_SMIN: 30,
    BK_SMAX: 85,
    BK_SIZESKEW: 2,
    BK_OPMAX: 0.65,
    BK_OPMIN: 0.2,
    BK_COLORVAR: 50,
    BK_NLEADERS: 3,
    BK_LEADERSPD: 0.205,
    BK_MARGIN: 0.1,
    BK_DWELL: 3,
    BK_DWELLVAR: 0.2,
    BK_CPULL: 0.85,
    BK_SPREADX: 0.18,
    BK_SPREADY: 0.05,
    BK_DRIFT: 0.65,
    BK_DRIFTX: -1,
    BK_WIGSPD: 4,
    BK_WIGAMT: 0.15,
    BK_LIFEMIN: 3,
    BK_LIFEMAX: 10,
    BK_LIFESKEW: 1.0,
    BK_FADEDUR: 2.5,
    BK_FADEVAR: 0.5,
    BK_DEPTH: 0.4,

    NS_SCALE1: 300,
    NS_AMP1: 0.75,
    NS_SCALE2: 100,
    NS_AMP2: 0.3,
    NS_SCALE3: 30,
    NS_AMP3: 0.1,
    NS_BRIGHT: 0.25,
    NS_CONTRAST: 1.0,
    NS_OPACITY: 0.35,
    NS_SEED: 42,
    NS_XYRATIO: 1.0,

    GB2_DENSITY: 0.04,
    GB2_PSIZE: 1,
    GB2_BMIN: 1,
    GB2_BMAX: 1,
    GB2_CSCALE: 400,
    GB2_CINF: 1,
    GB2_OPACITY: 0.5,
    GB2_DRIFT: 2,
    GB2_SEED: 0,
    GB2_DEPTH: 0.35,

    GA_SIZE: 180,
    GA_THICK: 0.5,
    GA_LINEOPACITY: 1,
    GA_COLOR: 1,
    GA_PAGEMIX: 0.5,
    GA_FILL: 0,
    GA_OPACITY: 1,
    GA_SHIMMER: 1,
    GA_SHIMSPD: 0.35,
    GA_SHIMDEPTH: 1,
    GA_SHIMPHASE: 2,
    GA_DEPTH: 1.0,

    GB_SIZE: 4,
    GB_THICK: 2,
    GB_LINEOPACITY: 0.1,
    GB_COLOR: 0,
    GB_PAGEMIX: 0,
    GB_FILL: 0,
    GB_OPACITY: 0.75,
    GB_DEPTH: 0.5,

    //We’ve made this vignette just sides 2026.06.01
    VIG_INTENSITY: 0.85,
    VIG_CX: 0.5,
    VIG_CY: 0.5,
    VIG_RX: 0.65,
    VIG_RY: 1.2,
    VIG_TINT: 0.03,
}

const LAYERS = {
    noise: false,
    nebula: true,
    bokeh: true,
    grain: true,
    gridA: false,
    gridB: true,
    vignette: true,
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    }
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}
function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v))
}
function rand(lo: number, hi: number) {
    return lo + Math.random() * (hi - lo)
}

function makePRNG(seed: number) {
    let s = seed >>> 0 || 1
    return () => {
        s += 0x6d2b79f5
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function makeValueNoise(seed: number) {
    const rng = makePRNG(seed)
    const TABLE_SIZE = 512
    const table = new Float32Array(TABLE_SIZE)
    for (let i = 0; i < TABLE_SIZE; i++) table[i] = rng()
    function fade(t: number) {
        return t * t * t * (t * (t * 6 - 15) + 10)
    }
    return function (x: number, y: number) {
        const xi = Math.floor(x) & (TABLE_SIZE - 1)
        const yi = Math.floor(y) & (TABLE_SIZE - 1)
        const xf = x - Math.floor(x)
        const yf = y - Math.floor(y)
        const u = fade(xf),
            v = fade(yf)
        const a = table[(xi + table[yi & (TABLE_SIZE - 1)]) & (TABLE_SIZE - 1)]
        const b =
            table[(xi + 1 + table[yi & (TABLE_SIZE - 1)]) & (TABLE_SIZE - 1)]
        const c =
            table[(xi + table[(yi + 1) & (TABLE_SIZE - 1)]) & (TABLE_SIZE - 1)]
        const d =
            table[
                (xi + 1 + table[(yi + 1) & (TABLE_SIZE - 1)]) & (TABLE_SIZE - 1)
            ]
        return lerp(lerp(a, b, u), lerp(c, d, u), v)
    }
}

function getDailySeed(baseSeed: number) {
    const d = new Date()
    const dayKey =
        d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
    return (baseSeed + dayKey) % 9999
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Background() {
    const [activePage, setActivePage] = useState(getActivePage())
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        setActivePage(getActivePage())
    }, [])
    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100)
        return () => clearTimeout(timer)
    }, [])
    const containerRef = useRef<HTMLDivElement>(null)
    const stateRef = useRef<any>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.style.cssText =
            "position:fixed;inset:0;overflow:hidden;pointer-events:none;width:100vw;height:100vh;"

        // ── DOM elements ───────────────────────────────────────────────────
        const baseDark = document.createElement("div")
        baseDark.style.cssText =
            "position:absolute;inset:0;background:#0D0D0D;z-index:0;pointer-events:none;"

        const fadeWrapper = document.createElement("div")
        fadeWrapper.style.cssText =
            "position:absolute;inset:0;pointer-events:none;"

        if (activePage === "welcome") {
            fadeWrapper.style.opacity = "0"
            fadeWrapper.style.transition = "opacity 8000ms ease"
            setTimeout(() => {
                fadeWrapper.style.opacity = "1"
            }, 200)
        }
        container.appendChild(fadeWrapper)

        fadeWrapper.appendChild(baseDark)

        const canvasNoise = document.createElement("canvas")
        canvasNoise.style.cssText =
            "position:absolute;inset:0;pointer-events:none;"
        fadeWrapper.appendChild(canvasNoise)

        const canvasParticles = document.createElement("canvas")
        canvasParticles.style.cssText =
            "position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;"
        fadeWrapper.appendChild(canvasParticles)

        const canvasGrainB = document.createElement("canvas")
        canvasGrainB.style.cssText =
            "position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;"
        fadeWrapper.appendChild(canvasGrainB)

        const canvasGridA = document.createElement("canvas")
        canvasGridA.style.cssText =
            "position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;"
        fadeWrapper.appendChild(canvasGridA)

        const canvasGridB = document.createElement("canvas")
        canvasGridB.style.cssText =
            "position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;"
        fadeWrapper.appendChild(canvasGridB)

        const vignetteLayer = document.createElement("div")
        vignetteLayer.style.cssText =
            "position:absolute;inset:0;pointer-events:none;"
        fadeWrapper.appendChild(vignetteLayer)

        // ── State ──────────────────────────────────────────────────────────
        const s: any = {
            pageColor: COLORS[activePage as keyof typeof COLORS] || COLORS.welcome,
            // Use window dimensions — background is viewport-fixed
            VW: window.innerWidth,
            VH: window.innerHeight,
            TILE_H: 0,
            tileGrainB: document.createElement("canvas"),
            tileGridA: document.createElement("canvas"),
            tileGridB: document.createElement("canvas"),
            nebulaParticles: [] as NebulaParticle[],
            bokehParticles: [] as BokehParticle[],
            bokehLeaders: [] as Leader[],
            lastTime: null as number | null,
            totalTime: 0,
            lastScrollY: 0,
            scrollVelocity: 0,
            grainDriftY: 0,
            gridALinePhases: [] as number[],
            gridALineRates: [] as number[],
            rafId: 0,
            running: true,
        }
        s.TILE_H = Math.max(Math.round(s.VH * 6), 8000)
        stateRef.current = s
        ;[s.tileGrainB, s.tileGridA, s.tileGridB].forEach((c) => {
            c.width = s.VW
            c.height = s.TILE_H
        })

        // ── Color helpers ──────────────────────────────────────────────────
        function getParticleColor(
            tint: number,
            colorVar: number,
            bright: number
        ) {
            const comp = TINT_COMP[s.pageColor] || 1.0
            const pc = hexToRgb(s.pageColor)
            const variation = colorVar / 100
            const proximity =
                PALETTE_PROXIMITY[s.pageColor] ||
                PALETTE.filter((c) => c !== s.pageColor)
            let targetColor: { r: number; g: number; b: number }
            if (variation <= 0) {
                targetColor = pc
            } else {
                const maxIdx = Math.floor(variation * proximity.length)
                const idx = Math.floor(Math.random() * (maxIdx + 1))
                const chosen = hexToRgb(
                    proximity[Math.min(idx, proximity.length - 1)]
                )
                const blendT = variation * Math.random()
                targetColor = {
                    r: lerp(pc.r, chosen.r, blendT),
                    g: lerp(pc.g, chosen.g, blendT),
                    b: lerp(pc.b, chosen.b, blendT),
                }
            }
            const effectiveBright = bright * comp
            const grey = 200 * effectiveBright
            return {
                r: Math.min(255, grey * (1 - tint) + targetColor.r * tint),
                g: Math.min(255, grey * (1 - tint) + targetColor.g * tint),
                b: Math.min(255, grey * (1 - tint) + targetColor.b * tint),
            }
        }

        // ── Parallax ───────────────────────────────────────────────────────
        function parallaxOffset(depth: number) {
            return window.scrollY * (1.0 - depth)
        }

        // ── Noise ──────────────────────────────────────────────────────────
        function regenNoise() {
            const seed = getDailySeed(CFG.NS_SEED)
            const noise1 = makeValueNoise(seed)
            const noise2 = makeValueNoise(seed + 1000)
            const noise3 = makeValueNoise(seed + 2000)
            const SCALE_DOWN = 4
            const gW = Math.ceil(s.VW / SCALE_DOWN)
            const gH = Math.ceil(s.VH / SCALE_DOWN)
            const genCanvas = document.createElement("canvas")
            genCanvas.width = gW
            genCanvas.height = gH
            const genCtx = genCanvas.getContext("2d")!
            const imgData = genCtx.createImageData(gW, gH)
            const data = imgData.data
            const totalAmp = CFG.NS_AMP1 + CFG.NS_AMP2 + CFG.NS_AMP3 || 1
            for (let y = 0; y < gH; y++) {
                for (let x = 0; x < gW; x++) {
                    const wx = x * SCALE_DOWN * CFG.NS_XYRATIO,
                        wy = y * SCALE_DOWN
                    let v =
                        (noise1(wx / CFG.NS_SCALE1, wy / CFG.NS_SCALE1) *
                            CFG.NS_AMP1 +
                            noise2(wx / CFG.NS_SCALE2, wy / CFG.NS_SCALE2) *
                                CFG.NS_AMP2 +
                            noise3(wx / CFG.NS_SCALE3, wy / CFG.NS_SCALE3) *
                                CFG.NS_AMP3) /
                        totalAmp
                    v = (v - 0.5) * CFG.NS_CONTRAST + CFG.NS_BRIGHT
                    v = Math.max(0, Math.min(1, v))
                    const pv = (v * 255) | 0
                    const idx = (y * gW + x) * 4
                    data[idx] = pv
                    data[idx + 1] = pv
                    data[idx + 2] = pv
                    data[idx + 3] = 255
                }
            }
            genCtx.putImageData(imgData, 0, 0)
            canvasNoise.width = s.VW
            canvasNoise.height = s.VH
            const ctx = canvasNoise.getContext("2d")!
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.drawImage(genCanvas, 0, 0, s.VW, s.VH)
            canvasNoise.style.mixBlendMode = "overlay"
            canvasNoise.style.opacity = String(CFG.NS_OPACITY)
        }

        // ── Grain ──────────────────────────────────────────────────────────
        function regenGrain() {
            const seed = getDailySeed(CFG.GB2_SEED) + 7000
            const rng = makePRNG(seed)
            const rng2 = makePRNG(seed + 999999)
            const ctx = s.tileGrainB.getContext("2d")!
            const coarseCols = Math.ceil(s.VW / CFG.GB2_CSCALE) + 2
            const coarseRows = Math.ceil(s.TILE_H / CFG.GB2_CSCALE) + 2
            const coarseMap = new Float32Array(coarseCols * coarseRows)
            for (let i = 0; i < coarseMap.length; i++) coarseMap[i] = rng2()
            function sampleCoarse(x: number, y: number) {
                const cx = x / CFG.GB2_CSCALE,
                    cy = y / CFG.GB2_CSCALE
                const x0 = Math.floor(cx) | 0,
                    y0 = Math.floor(cy) | 0
                const x1 = Math.min(x0 + 1, coarseCols - 1)
                const y1 = Math.min(y0 + 1, coarseRows - 1)
                const fx = cx - x0,
                    fy = cy - y0
                const v00 = coarseMap[y0 * coarseCols + x0]
                const v10 = coarseMap[y0 * coarseCols + x1]
                const v01 = coarseMap[y1 * coarseCols + x0]
                const v11 = coarseMap[y1 * coarseCols + x1]
                return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy)
            }
            ctx.clearRect(0, 0, s.VW, s.TILE_H)
            const total = Math.floor(s.VW * s.TILE_H * CFG.GB2_DENSITY)
            const imgData = ctx.createImageData(s.VW, s.TILE_H)
            const data = imgData.data
            for (let i = 0; i < total; i++) {
                const x = (rng() * s.VW) | 0,
                    y = (rng() * s.TILE_H) | 0
                const coarseMod = sampleCoarse(x, y)
                const localMod = lerp(1, coarseMod * 2, CFG.GB2_CINF)
                if (rng() > localMod) continue
                const v =
                    ((CFG.GB2_BMIN + rng() * (CFG.GB2_BMAX - CFG.GB2_BMIN)) *
                        255) |
                    0
                const a = ((0.3 + rng() * 0.7) * 255) | 0
                const idx = (y * s.VW + x) * 4
                data[idx] = v
                data[idx + 1] = v
                data[idx + 2] = v
                data[idx + 3] = a
            }
            ctx.putImageData(imgData, 0, 0)
        }

        // ── Grid A ─────────────────────────────────────────────────────────
        function initGridAShimmer() {
            const count = Math.ceil(s.VW / CFG.GA_SIZE) + 2
            s.gridALinePhases = []
            s.gridALineRates = []
            for (let i = 0; i < count; i++) {
                s.gridALinePhases.push(
                    Math.random() * Math.PI * 2 * CFG.GA_SHIMPHASE
                )
                s.gridALineRates.push(0.5 + Math.random() * 1.0)
            }
        }

        function tickGridAShimmer(totalTime: number) {
            if (!CFG.GA_SHIMMER) return
            const ctx = canvasGridA.getContext("2d")!
            ctx.clearRect(0, 0, s.VW, s.VH)
            const pc = hexToRgb(s.pageColor)
            const grey = (CFG.GA_COLOR * 255) | 0
            const r = (grey * (1 - CFG.GA_PAGEMIX) + pc.r * CFG.GA_PAGEMIX) | 0
            const g = (grey * (1 - CFG.GA_PAGEMIX) + pc.g * CFG.GA_PAGEMIX) | 0
            const b = (grey * (1 - CFG.GA_PAGEMIX) + pc.b * CFG.GA_PAGEMIX) | 0
            ctx.lineWidth = CFG.GA_THICK
            const t = totalTime * CFG.GA_SHIMSPD
            const count = Math.ceil(s.VW / CFG.GA_SIZE) + 2
            while (s.gridALinePhases.length < count) {
                s.gridALinePhases.push(
                    Math.random() * Math.PI * 2 * CFG.GA_SHIMPHASE
                )
                s.gridALineRates.push(0.5 + Math.random() * 1.0)
            }
            for (let i = 0; i <= count; i++) {
                const x = i * CFG.GA_SIZE
                const phase = s.gridALinePhases[i] || 0
                const rate = s.gridALineRates[i] || 1
                const sine = (Math.sin(t * rate + phase) + 1) * 0.5
                const lineOpacity =
                    CFG.GA_LINEOPACITY *
                    (1 - CFG.GA_SHIMDEPTH + CFG.GA_SHIMDEPTH * sine)
                ctx.strokeStyle = `rgba(${r},${g},${b},${lineOpacity})`
                ctx.beginPath()
                ctx.moveTo(x, 0)
                ctx.lineTo(x, s.VH)
                ctx.stroke()
            }
            canvasGridA.style.opacity = String(CFG.GA_OPACITY)
        }

        // ── Grid tile regen ────────────────────────────────────────────────
        function regenGrid(which: "a" | "b") {
            const cfg =
                which === "a"
                    ? {
                          size: CFG.GA_SIZE,
                          thick: CFG.GA_THICK,
                          lineOp: CFG.GA_LINEOPACITY,
                          col: CFG.GA_COLOR,
                          pmix: CFG.GA_PAGEMIX,
                          fill: CFG.GA_FILL,
                          opacity: CFG.GA_OPACITY,
                          mode: "v",
                      }
                    : {
                          size: CFG.GB_SIZE,
                          thick: CFG.GB_THICK,
                          lineOp: CFG.GB_LINEOPACITY,
                          col: CFG.GB_COLOR,
                          pmix: CFG.GB_PAGEMIX,
                          fill: CFG.GB_FILL,
                          opacity: CFG.GB_OPACITY,
                          mode: "h",
                      }
            const tile = which === "a" ? s.tileGridA : s.tileGridB
            const ctx = tile.getContext("2d")!
            const pc = hexToRgb(s.pageColor)
            const grey = (cfg.col * 255) | 0
            const r = (grey * (1 - cfg.pmix) + pc.r * cfg.pmix) | 0
            const g = (grey * (1 - cfg.pmix) + pc.g * cfg.pmix) | 0
            const b = (grey * (1 - cfg.pmix) + pc.b * cfg.pmix) | 0
            ctx.clearRect(0, 0, s.VW, s.TILE_H)
            if (cfg.fill > 0) {
                ctx.fillStyle = `rgba(0,0,0,${cfg.fill})`
                ctx.fillRect(0, 0, s.VW, s.TILE_H)
            }
            ctx.strokeStyle = `rgba(${r},${g},${b},${cfg.lineOp})`
            ctx.lineWidth = cfg.thick
            if (cfg.mode === "h" || cfg.mode === "both") {
                for (let y = 0; y <= s.TILE_H; y += cfg.size) {
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    ctx.lineTo(s.VW, y)
                    ctx.stroke()
                }
            }
            if (cfg.mode === "v" || cfg.mode === "both") {
                for (let x = 0; x <= s.VW; x += cfg.size) {
                    ctx.beginPath()
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x, s.TILE_H)
                    ctx.stroke()
                }
            }
        }

        // ── Static layer draw ──────────────────────────────────────────────
        function drawStaticLayer(
            canvas: HTMLCanvasElement,
            tile: HTMLCanvasElement,
            depth: number,
            extraYOffset: number = 0
        ) {
            const ctx = canvas.getContext("2d")!
            ctx.clearRect(0, 0, s.VW, s.VH)
            const pOffset = parallaxOffset(depth)
            const offset = Math.max(0, pOffset + extraYOffset)
            const period = s.TILE_H * 2
            const pos = ((offset % period) + period) % period
            let remaining = s.VH,
                destY = 0,
                p = pos
            let safety = 0
            while (remaining > 0 && safety++ < 10) {
                const flipped = p >= s.TILE_H
                const tilePos = flipped ? p - s.TILE_H : p
                const segEnd = flipped ? s.TILE_H * 2 : s.TILE_H
                const avail = segEnd - p
                const h = Math.min(remaining, avail)
                if (h <= 0) {
                    p = (p + 1) % period
                    continue
                }
                if (!flipped) {
                    ctx.drawImage(tile, 0, tilePos, s.VW, h, 0, destY, s.VW, h)
                } else {
                    const srcY = s.TILE_H - tilePos - h
                    ctx.save()
                    ctx.translate(0, destY + h)
                    ctx.scale(1, -1)
                    ctx.drawImage(tile, 0, srcY, s.VW, h, 0, 0, s.VW, h)
                    ctx.restore()
                }
                destY += h
                remaining -= h
                p = (p + h) % period
            }
        }

        // ── Vignette ───────────────────────────────────────────────────────
        function updateVignette() {
            const pc = hexToRgb(s.pageColor)
            const vr = (pc.r * CFG.VIG_TINT) | 0
            const vg = (pc.g * CFG.VIG_TINT) | 0
            const vb = (pc.b * CFG.VIG_TINT) | 0
            const cx = CFG.VIG_CX * 100,
                cy = CFG.VIG_CY * 100
            const rx = CFG.VIG_RX * 100
            const ry = CFG.VIG_RY * 100
            const i = CFG.VIG_INTENSITY
            vignetteLayer.style.background = `radial-gradient(ellipse ${rx}% ${ry}% at ${cx}% ${cy}%,transparent 0%,rgba(${vr},${vg},${vb},${(i * 0.45).toFixed(3)}) 55%,rgba(${vr},${vg},${vb},${i}) 100%)`
        }

        // ── Nebula — spawn ─────────────────────────────────────────────────
        function spawnNebula(isRespawn: boolean): NebulaParticle {
            const smin = (CFG.NB_SMIN / 100) * s.VW
            const smax = (CFG.NB_SMAX / 100) * s.VW
            const size = smin + Math.random() * (smax - smin)
            const lifespan =
                CFG.NB_LIFEMIN +
                Math.random() * (CFG.NB_LIFEMAX - CFG.NB_LIFEMIN)
            const fadeVariation = 1 + (Math.random() * 2 - 1) * CFG.NB_FADEVAR
            const particleFade = Math.max(0.8, CFG.NB_FADEDUR * fadeVariation)
            const col = getParticleColor(
                CFG.NB_TINT,
                CFG.NB_COLORVAR,
                CFG.NB_BRIGHT
            )
            const pOffset = isRespawn ? parallaxOffset(CFG.NB_DEPTH) : 0
            return {
                x: Math.random() * s.VW,
                y: Math.random() * s.VH + pOffset,
                size,
                vx: (Math.random() - 0.5) * 0.2,
                vy: -(0.03 + Math.random() * 0.1),
                r: col.r,
                g: col.g,
                b: col.b,
                lifespan,
                fadedur: particleFade,
                age: isRespawn ? 0 : Math.random() * particleFade,
                targetOpacity:
                    CFG.NB_OPMIN +
                    Math.random() * (CFG.NB_OPMAX - CFG.NB_OPMIN),
                pulsePhase: Math.random() * Math.PI * 2,
                pulseRate: 0.2 + Math.random() * 0.4,
            }
        }

        function initNebula() {
            s.nebulaParticles = []
            for (let i = 0; i < CFG.NB_COUNT; i++) {
                s.nebulaParticles.push(spawnNebula(false))
            }
        }

        // ── Bokeh leaders ──────────────────────────────────────────────────
        function getBokehSafeZone() {
            const m = CFG.BK_MARGIN
            return {
                x0: m * s.VW,
                x1: (1 - m) * s.VW,
                y0: m * s.VH,
                y1: (1 - m) * s.VH,
            }
        }

        function initLeaders() {
            const n = CFG.BK_NLEADERS
            const sz = getBokehSafeZone()
            s.bokehLeaders = []
            for (let i = 0; i < n; i++) {
                const bandH = (sz.y1 - sz.y0) / n
                const colW = (sz.x1 - sz.x0) / n
                const y = rand(sz.y0 + bandH * i, sz.y0 + bandH * (i + 1))
                const x = rand(sz.x0 + colW * i, sz.x0 + colW * (i + 1))
                const angle = rand(0, Math.PI * 2)
                s.bokehLeaders.push({
                    x,
                    y,
                    vx: Math.cos(angle),
                    vy: Math.sin(angle),
                    tx: rand(sz.x0, sz.x1),
                    ty: rand(sz.y0, sz.y1),
                    bandY0: sz.y0 + bandH * i,
                    bandY1: sz.y0 + bandH * (i + 1),
                    bandX0: sz.x0,
                    bandX1: sz.x1,
                    dwellTimer:
                        CFG.BK_DWELL * (1 - CFG.BK_DWELLVAR * Math.random()),
                })
            }
        }

        function tickLeaders(dt: number) {
            if (s.bokehLeaders.length === 0) return
            s.bokehLeaders.forEach((l: Leader) => {
                l.dwellTimer -= dt
                if (l.dwellTimer <= 0) {
                    l.x = rand(l.bandX0, l.bandX1)
                    l.y = rand(l.bandY0, l.bandY1)
                    l.dwellTimer =
                        CFG.BK_DWELL * (1 - CFG.BK_DWELLVAR * Math.random())
                }
            })
        }

        function getBokehSpawnPos(size: number) {
            const pOffset = parallaxOffset(CFG.BK_DEPTH)
            const r = size / 2
            if (s.bokehLeaders.length > 0 && Math.random() < CFG.BK_CPULL) {
                const l =
                    s.bokehLeaders[
                        Math.floor(Math.random() * s.bokehLeaders.length)
                    ]
                const angle = rand(0, Math.PI * 2)
                const dist = Math.sqrt(Math.random())
                const dx = Math.cos(angle) * dist * CFG.BK_SPREADX * s.VW
                const dy = Math.sin(angle) * dist * CFG.BK_SPREADY * s.VH
                return {
                    x: clamp(l.x + dx, r, s.VW - r),
                    y: clamp(l.y + dy, r, s.VH - r) + pOffset,
                }
            }
            return { x: rand(r, s.VW - r), y: rand(r, s.VH - r) + pOffset }
        }

        // ── Bokeh — spawn ──────────────────────────────────────────────────
        function spawnBokeh(isRespawn: boolean): BokehParticle {
            const size =
                CFG.BK_SMIN +
                (CFG.BK_SMAX - CFG.BK_SMIN) *
                    Math.pow(Math.random(), CFG.BK_SIZESKEW)
            const lifespan =
                CFG.BK_LIFEMIN +
                (CFG.BK_LIFEMAX - CFG.BK_LIFEMIN) *
                    Math.pow(Math.random(), CFG.BK_LIFESKEW)
            const actualFade = Math.max(
                0.5,
                CFG.BK_FADEDUR * (1 - CFG.BK_FADEVAR * Math.random())
            )
            const col = getParticleColor(1, CFG.BK_COLORVAR, 1)
            const pos = getBokehSpawnPos(size)
            const angle = rand(0, Math.PI * 2)
            const spd = rand(0.3, 1) * CFG.BK_DRIFT
            const vx = (Math.cos(angle) + CFG.BK_DRIFTX * 2) * spd * 0.01
            const vy = Math.sin(angle) * spd * 0.01
            return {
                x: pos.x,
                y: pos.y,
                size,
                vx,
                vy,
                r: col.r | 0,
                g: col.g | 0,
                b: col.b | 0,
                lifespan,
                fadedur: actualFade,
                age: isRespawn ? 0 : rand(0, lifespan * 0.8),
                targetOpacity: rand(CFG.BK_OPMIN, CFG.BK_OPMAX),
                wigCurrent: 0,
                wigTarget: rand(-1, 0),
            }
        }

        function initBokeh() {
            initLeaders()
            s.bokehParticles = []
            for (let i = 0; i < CFG.BK_COUNT; i++) {
                s.bokehParticles.push(spawnBokeh(false))
            }
        }

        // ── Canvas particle draw ───────────────────────────────────────────
        function drawParticles() {
            const ctx = canvasParticles.getContext("2d")!
            ctx.clearRect(0, 0, s.VW, s.VH)

            if (LAYERS.nebula) {
                const pOffset = parallaxOffset(CFG.NB_DEPTH)
                s.nebulaParticles.forEach((p: NebulaParticle) => {
                    const fadein = Math.min(p.age / p.fadedur, 1)
                    const fadeout = Math.min(
                        (p.lifespan - p.age) / p.fadedur,
                        1
                    )
                    let opacity =
                        Math.max(0, Math.min(fadein, fadeout)) *
                        p.targetOpacity *
                        CFG.NB_BRIGHT
                    if (opacity <= 0.005) return
                    const rendY = p.y - pOffset
                    const sz = Math.max(8, p.size)
                    const blurPx =
                        CFG.NB_SOFT > 0 ? Math.round(sz * CFG.NB_SOFT) : 0
                    const r = p.r | 0,
                        g = p.g | 0,
                        b = p.b | 0
                    if (blurPx > 0) {
                        ctx.save()
                        ctx.filter = `blur(${blurPx}px)`
                    }
                    const grad = ctx.createRadialGradient(
                        p.x,
                        rendY,
                        0,
                        p.x,
                        rendY,
                        sz / 2
                    )
                    grad.addColorStop(
                        0,
                        `rgba(${r},${g},${b},${(opacity * 0.9).toFixed(3)})`
                    )
                    grad.addColorStop(
                        0.45,
                        `rgba(${r},${g},${b},${(opacity * 0.4).toFixed(3)})`
                    )
                    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
                    ctx.fillStyle = grad
                    ctx.beginPath()
                    ctx.arc(p.x, rendY, sz / 2, 0, Math.PI * 2)
                    ctx.fill()
                    if (blurPx > 0) ctx.restore()
                })
            }

            if (LAYERS.bokeh) {
                const pOffset = parallaxOffset(CFG.BK_DEPTH)
                s.bokehParticles.forEach((p: BokehParticle) => {
                    const fadein = clamp(p.age / p.fadedur, 0, 1)
                    const fadeout = clamp(
                        (p.lifespan - p.age) / p.fadedur,
                        0,
                        1
                    )
                    const lifeFrac = Math.min(fadein, fadeout)
                    const wiggle = p.wigCurrent * CFG.BK_WIGAMT * lifeFrac
                    const opacity = clamp(
                        lifeFrac * p.targetOpacity + wiggle,
                        0,
                        p.targetOpacity
                    )
                    if (opacity <= 0.005) return
                    const rendY = p.y - pOffset
                    const sz = Math.max(1, p.size)
                    const r = p.r,
                        g = p.g,
                        b = p.b
                    const grad = ctx.createRadialGradient(
                        p.x,
                        rendY,
                        0,
                        p.x,
                        rendY,
                        sz / 2
                    )
                    grad.addColorStop(
                        0,
                        `rgba(${r},${g},${b},${opacity.toFixed(3)})`
                    )
                    grad.addColorStop(
                        0.55,
                        `rgba(${r},${g},${b},${(opacity * 0.5).toFixed(3)})`
                    )
                    grad.addColorStop(0.56, `rgba(${r},${g},${b},0)`)
                    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
                    ctx.fillStyle = grad
                    ctx.beginPath()
                    ctx.arc(p.x, rendY, sz / 2, 0, Math.PI * 2)
                    ctx.fill()
                })
            }
        }

        // ── Tick nebula ────────────────────────────────────────────────────
        function tickNebula(dt: number) {
            const scrollNudge =
                s.scrollVelocity * CFG.NB_SCROLLINF * (1 - CFG.NB_DEPTH) * 0.001
            s.nebulaParticles.forEach((p: NebulaParticle, i: number) => {
                p.age += dt
                p.y += p.vy * CFG.NB_DRIFT * 60 * dt + scrollNudge * 60 * dt
                p.x += p.vx * CFG.NB_DRIFT * 60 * dt
                if (p.age >= p.lifespan)
                    s.nebulaParticles[i] = spawnNebula(true)
            })
        }

        // ── Tick bokeh ─────────────────────────────────────────────────────
        function tickBokeh(dt: number) {
            tickLeaders(dt)
            s.bokehParticles.forEach((p: BokehParticle, i: number) => {
                p.age += dt
                p.x += p.vx * CFG.BK_DRIFT * 60 * dt
                p.y += p.vy * CFG.BK_DRIFT * 60 * dt
                if (p.x < -p.size) p.x = s.VW + p.size
                if (p.x > s.VW + p.size) p.x = -p.size
                if (CFG.BK_WIGSPD > 0 && CFG.BK_WIGAMT > 0) {
                    p.wigCurrent = lerp(
                        p.wigCurrent,
                        p.wigTarget,
                        clamp(CFG.BK_WIGSPD * dt, 0, 1)
                    )
                    if (Math.abs(p.wigCurrent - p.wigTarget) < 0.05)
                        p.wigTarget = rand(-1, 0)
                } else {
                    p.wigCurrent = 0
                }
                if (p.age >= p.lifespan) s.bokehParticles[i] = spawnBokeh(true)
            })
        }

        // ── Render loop ────────────────────────────────────────────────────
        function render(ts: number) {
            if (!s.running) return
            if (s.lastTime === null) s.lastTime = ts
            const dt = Math.min((ts - s.lastTime) / 1000, 0.05)
            s.lastTime = ts
            s.totalTime += dt

            const scrollY = window.scrollY
            const rawVel = (scrollY - s.lastScrollY) / Math.max(dt, 0.001)
            s.scrollVelocity +=
                (rawVel - s.scrollVelocity) * Math.min(dt * 8, 1)

            if (LAYERS.nebula) tickNebula(dt)
            if (LAYERS.bokeh) tickBokeh(dt)
            if (LAYERS.nebula || LAYERS.bokeh) drawParticles()

            const scrollChanged = scrollY !== s.lastScrollY
            if (LAYERS.grain) {
                s.grainDriftY += CFG.GB2_DRIFT * dt
                if (scrollChanged || CFG.GB2_DRIFT > 0) {
                    drawStaticLayer(
                        canvasGrainB,
                        s.tileGrainB,
                        CFG.GB2_DEPTH,
                        s.grainDriftY
                    )
                    canvasGrainB.style.opacity = String(CFG.GB2_OPACITY)
                }
            }
            if (LAYERS.gridB && scrollChanged) {
                drawStaticLayer(canvasGridB, s.tileGridB, CFG.GB_DEPTH)
                canvasGridB.style.opacity = String(CFG.GB_OPACITY)
            }
            if (LAYERS.gridA) tickGridAShimmer(s.totalTime)
            s.lastScrollY = scrollY
            s.rafId = requestAnimationFrame(render)
        }

        // ── Resize ─────────────────────────────────────────────────────────
        function handleResize() {
            const oldVW = s.VW,
                oldVH = s.VH
            s.VW = window.innerWidth
            s.VH = window.innerHeight
            if (s.bokehLeaders.length > 0 && oldVW > 0 && oldVH > 0) {
                s.bokehLeaders.forEach((l: Leader) => {
                    l.x = (l.x / oldVW) * s.VW
                    l.y = (l.y / oldVH) * s.VH
                    l.tx = (l.tx / oldVW) * s.VW
                    l.ty = (l.ty / oldVH) * s.VH
                    const sz = getBokehSafeZone()
                    l.x = clamp(l.x, sz.x0, sz.x1)
                    l.y = clamp(l.y, sz.y0, sz.y1)
                })
            }
            ;[canvasParticles, canvasGrainB, canvasGridA, canvasGridB].forEach(
                (c) => {
                    c.width = s.VW
                    c.height = s.VH
                }
            )
            ;[s.tileGrainB, s.tileGridA, s.tileGridB].forEach((c) => {
                c.width = s.VW
                c.height = s.TILE_H
            })
            if (LAYERS.noise) regenNoise()
            if (LAYERS.grain) regenGrain()
            if (LAYERS.gridA) regenGrid("a")
            if (LAYERS.gridB) regenGrid("b")
            if (LAYERS.nebula) initNebula()
            if (LAYERS.gridA) initGridAShimmer()
            if (LAYERS.vignette) updateVignette()
        }

        window.addEventListener("resize", handleResize)

        // ── Boot ───────────────────────────────────────────────────────────
        if (LAYERS.nebula) initNebula()
        if (LAYERS.bokeh) initBokeh()

        requestAnimationFrame(() => {
            if (!s.running) return
            s.VW = window.innerWidth
            s.VH = window.innerHeight
            s.TILE_H = Math.max(Math.round(s.VH * 6), 8000)
            ;[
                canvasParticles,
                canvasNoise,
                canvasGrainB,
                canvasGridA,
                canvasGridB,
            ].forEach((c) => {
                c.width = s.VW
                c.height = s.VH
            })
            ;[s.tileGrainB, s.tileGridA, s.tileGridB].forEach((c) => {
                c.width = s.VW
                c.height = s.TILE_H
            })
            if (LAYERS.noise) regenNoise()
            if (LAYERS.grain) regenGrain()
            if (LAYERS.gridA) regenGrid("a")
            if (LAYERS.gridB) regenGrid("b")
            if (LAYERS.gridA) initGridAShimmer()
            if (LAYERS.vignette) updateVignette()
            if (LAYERS.grain) {
                drawStaticLayer(canvasGrainB, s.tileGrainB, CFG.GB2_DEPTH, 0)
                canvasGrainB.style.opacity = String(CFG.GB2_OPACITY)
            }
            if (LAYERS.gridB) {
                drawStaticLayer(canvasGridB, s.tileGridB, CFG.GB_DEPTH)
                canvasGridB.style.opacity = String(CFG.GB2_OPACITY)
            }
            if (LAYERS.gridA) tickGridAShimmer(0)
        })

        s.rafId = requestAnimationFrame(render)

        return () => {
            s.running = false
            cancelAnimationFrame(s.rafId)
            window.removeEventListener("resize", handleResize)
            while (container.firstChild)
                container.removeChild(container.firstChild)
        }
    }, [activePage])

    return (
        <div
            ref={containerRef}
            style={{
                // position: fixed — viewport-locked, page content scrolls over it
                // width/height 100vw/100vh — always fills the viewport regardless of
                // what Framer sets on the frame in the template
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 0,
                opacity: visible ? 1 : 0,
                transition:
                    activePage === "welcome" ? "opacity 4000ms ease" : "none",
            }}
        />
    )
}
