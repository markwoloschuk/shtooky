"use client"

// TYPE ROLES USED IN THIS FILE:
//   text overlay headlines → TYPE_TIERS.OPENING  (sizeVw, weight, tracking, lineHeight — read via getType())

// RippleNetwork.tsx — shtooky.com
// Let's Talk page — ripple signal animation with text overlay
// v2 — ported to Next.js 2026-06-22

import { useEffect, useRef } from "react"
import { COLORS, TYPE, getType, useBreakpoint } from "./Tokens"

// ─── LAYOUT ───────────────────────────────────────────────────────────────────

const PLAY_DELAY = 0
export const TEXT_DELAY = 1000
const playOnce = true

// ─── SCROLL FADE ─────────────────────────────────────────────────────────────

const SCROLL_FADE = {
    fadeOutStart: 100,
    fadeOutEnd: -200,
}

// ─── TEXT ANIMATION ───────────────────────────────────────────────────────────

export const TIMING = {
    duration: 1750,
    pushY: 20,
    pushX: 0,
    feather: 60,
    colorDelay: 0,
    colorDurIn: 0,
    colorHold: 0,
    colorDurOut: 0,
    highlightColor: COLORS.contact,
}

export const CHUNKS = [
    {
        text: "Thanks for visiting",
        line: 1,
        delay: 0,
        wipe: 0,
        fade: 1,
        push: 1,
    },
    {
        text: "shall we {connect?}",
        line: 2,
        delay: 500,
        wipe: 0,
        fade: 1,
        push: 1,
    },
]

// ─── RIPPLE / LINE CFG ────────────────────────────────────────────────────────

const CFG = {
    HEIGHT: 350,

    maxPairs: 5,
    rampUp: 8,
    birthVar: 100,
    centerBias: 50,
    antiClump: 150,

    rippleCount: 3,
    rippleBirthRate: 400,
    rippleBirthRateVar: 50,
    maxRadius: 60,
    maxRadiusVar: 90,
    rippleSpeed: 8,
    rippleSpeedVar: 25,
    rippleSpeedNodeVar: 100,
    energyLoss: 65,
    fadePct: 25,
    rippleStroke: 1.5,
    rippleStrokeOp: 0.5,
    rippleFillOp: 0.15,
    rippleOpVar: 20,

    lineSpeed: 80,
    lineSpeedVar: 100,
    lineOp: 0.3,
    lineOpVar: 30,
    lineWeight: 1.5,
    tailLen: 0.95,
    tailLenVar: 100,
    minAngle: 30,
    dyingLineDuration: 1.1,

    colorVar: 70,
    colorRange: 40,

    blendMode: "screen" as GlobalCompositeOperation,
}

// Provisional overrides — needs Mark's live visual tuning on device.
const CFG_TABLET_OVERRIDES = {
    HEIGHT: 275,    // was 350
    maxRadius: 44,  // was 60
    maxRadiusVar: 90,
}

const CFG_MOBILE_OVERRIDES = {
    HEIGHT: 200,    // was 350
    maxRadius: 28,  // was 60
    maxRadiusVar: 90,
}

// ─── COLOR SYSTEM ─────────────────────────────────────────────────────────────

const BASE: [number, number, number] = [136, 81, 152]
const ADJACENT: [number, number, number][] = [
    [0, 173, 238],
    [235, 0, 139],
]
const FAR: [number, number, number][] = [
    [250, 175, 64],
    [214, 222, 35],
]

function sL(c: number) {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function lS(v: number) {
    return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055))
}
function toOk(r: number, g: number, b: number): [number, number, number] {
    const l = sL(r), m = sL(g), s = sL(b)
    const l2 = Math.pow(0.4122214708 * l + 0.5363325363 * m + 0.0514459929 * s, 1 / 3)
    const m2 = Math.pow(0.2119034982 * l + 0.6806995451 * m + 0.1073969566 * s, 1 / 3)
    const s2 = Math.pow(0.0883024619 * l + 0.2817188376 * m + 0.6299787005 * s, 1 / 3)
    return [
        0.2104542553 * l2 + 0.793617785 * m2 - 0.0040720468 * s2,
        1.9779984951 * l2 - 2.428592205 * m2 + 0.4505937099 * s2,
        0.0259040371 * l2 + 0.7827717662 * m2 - 0.808675766 * s2,
    ]
}
function frOk(L: number, a: number, b: number): [number, number, number] {
    const l2 = L + 0.3963377774 * a + 0.2158037573 * b
    const m2 = L - 0.1055613458 * a - 0.0638541728 * b
    const s2 = L - 0.0894841775 * a - 1.291485548 * b
    const l = l2 * l2 * l2, m = m2 * m2 * m2, s = s2 * s2 * s2
    return [
        Math.max(0, Math.min(255, lS(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s))),
        Math.max(0, Math.min(255, lS(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s))),
        Math.max(0, Math.min(255, lS(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s))),
    ]
}
function lerpOk(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
    const la = toOk(...a), lb = toOk(...b)
    return frOk(la[0] + (lb[0] - la[0]) * t, la[1] + (lb[1] - la[1]) * t, la[2] + (lb[2] - la[2]) * t)
}
function buildPalette(rf: number): [number, number, number][] {
    const p: [number, number, number][] = [BASE]
    if (rf > 0) {
        const t = Math.min(1, rf * 2)
        for (const c of ADJACENT) p.push(lerpOk(BASE, c, 0.15 + t * 0.7))
    }
    if (rf > 0.5) {
        const t = (rf - 0.5) * 2
        for (const c of FAR) p.push(lerpOk(BASE, c, 0.15 + t * 0.7))
    }
    return p
}
function pickBirthColor(rf: number): [number, number, number] {
    const p = buildPalette(rf)
    return p[Math.floor(Math.random() * p.length)]
}
function varyColor(bc: [number, number, number], rf: number, vf: number): [number, number, number] {
    if (vf <= 0) return [...bc] as [number, number, number]
    const p = buildPalette(rf)
    return lerpOk(bc, p[Math.floor(Math.random() * p.length)], Math.random() * vf)
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function varyF(base: number, vPct: number) {
    const v = vPct / 100
    return base * (1 - v * 0.5 + Math.random() * v)
}

function easedProgress(p: number, el: number) {
    if (el <= 0) return p
    return 1 - Math.pow(1 - p, 1 + el * 3)
}

function rippleAlpha(progress: number, fadeStart: number) {
    if (progress <= fadeStart) return 1
    const t = Math.min(1, (progress - fadeStart) / (1 - fadeStart))
    return 1 - t * t * (3 - 2 * t)
}

// ─── TEXT ENGINE ──────────────────────────────────────────────────────────────

function parseChunkText(raw: string): { t: string; hl: boolean }[] {
    const parts: { t: string; hl: boolean }[] = []
    const re = /\{([^}]+)\}|([^{]+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(raw)) !== null) {
        if (m[1] !== undefined) parts.push({ t: m[1], hl: true })
        else if (m[2]) parts.push({ t: m[2], hl: false })
    }
    return parts
}

function lerpColor(t: number, hlHex: string): string {
    const r = parseInt(hlHex.slice(1, 3), 16)
    const g = parseInt(hlHex.slice(3, 5), 16)
    const b = parseInt(hlHex.slice(5, 7), 16)
    return `rgb(${Math.round(255 + (r - 255) * t)},${Math.round(255 + (g - 255) * t)},${Math.round(255 + (b - 255) * t)})`
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Ripple {
    r: number
    progress: number
    maxR: number
    speed: number
    fadeStart: number
    strokeOp: number
    fillOp: number
    color: [number, number, number]
}

interface Node {
    x: number
    y: number
    ripples: Ripple[]
    ripplesSpawned: number
    nextRippleTs: number
    birthColor: [number, number, number]
    lineColor: [number, number, number] | null
    draining: boolean
    ghost: boolean
    nodeSpeedMult: number
    nodeBirthRate: number
    nodeR: number
}

interface Receiver {
    x: number
    y: number
    nodeR: number
}

interface Pair {
    sender: Node
    receiver: Receiver
    line: { t: number; speedMult: number; opMult: number; tailLen: number }
}

interface DyingLine {
    x1: number
    y1: number
    x2: number
    y2: number
    color: [number, number, number]
    peakAlpha: number
    weight: number
    tailLen: number
    age: number
    duration: number
}

interface SpawnPos {
    x: number
    y: number
    nodeR: number
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function RippleNetwork() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const textLayerRef = useRef<HTMLDivElement>(null)

    const breakpoint = useBreakpoint()
    const cfg = {
        ...CFG,
        ...(breakpoint === "mobile" ? CFG_MOBILE_OVERRIDES
            : breakpoint === "tablet" ? CFG_TABLET_OVERRIDES
            : {}),
    }

    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        const textLayer = textLayerRef.current
        if (!container || !canvas || !textLayer) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1

        function resize() {
            const w = container!.clientWidth
            const h = cfg.HEIGHT
            canvas!.width = Math.round(w * dpr)
            canvas!.height = Math.round(h * dpr)
            canvas!.style.width = w + "px"
            canvas!.style.height = h + "px"
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        const ro = new ResizeObserver(resize)
        ro.observe(container)
        resize()

        const CW = () => container!.clientWidth

        function rollSpawnPos(existing: { x: number; y: number }[]): SpawnPos {
            const h = cfg.HEIGHT
            const cb = CFG.centerBias / 100
            const minDist = CFG.antiClump
            const nodeR = Math.min(varyF(cfg.maxRadius, cfg.maxRadiusVar), CW() * 0.45, h * 0.45)
            const minX = nodeR, maxX = CW() - nodeR
            const minY = nodeR, maxY = h - nodeR
            if (maxX <= minX || maxY <= minY) return { x: CW() / 2, y: h / 2, nodeR }
            let best: SpawnPos | null = null
            let bestDist = -1
            for (let att = 0; att < 50; att++) {
                const rx = minX + Math.random() * (maxX - minX)
                const ry = minY + Math.random() * (maxY - minY)
                const t = cb * cb
                let x = rx + (CW() * 0.2 - rx) * t
                let y = ry + (h / 2 - ry) * t
                x = Math.max(minX, Math.min(maxX, x))
                y = Math.max(minY, Math.min(maxY, y))
                if (minDist <= 0) return { x, y, nodeR }
                let md = Infinity
                for (const n of existing) md = Math.min(md, Math.hypot(n.x - x, n.y - y))
                if (md >= minDist) return { x, y, nodeR }
                if (md > bestDist) { bestDist = md; best = { x, y, nodeR } }
            }
            return best || { x: minX + Math.random() * (maxX - minX), y: minY + Math.random() * (maxY - minY), nodeR }
        }

        function rollReceiverPos(sx: number, sy: number, existing: { x: number; y: number }[]): SpawnPos {
            const minA = (CFG.minAngle * Math.PI) / 180
            let best: SpawnPos | null = null
            let bestScore = -1
            for (let att = 0; att < 60; att++) {
                const pos = rollSpawnPos(existing)
                const dx = pos.x - sx, dy = pos.y - sy
                const dist = Math.hypot(dx, dy)
                const minSep = Math.max(80, pos.nodeR * 1.5)
                const angle = Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx)))
                const angleOk = minA <= 0 || angle >= minA
                const distOk = dist >= minSep
                if (angleOk && distOk) return pos
                const score = (angleOk ? 1 : 0) + (distOk ? 1 : 0)
                if (score > bestScore) { bestScore = score; best = pos }
            }
            return best || rollSpawnPos(existing)
        }

        function variedInterval() {
            const base = (CFG.rampUp * 1000) / Math.max(1, CFG.maxPairs)
            return varyF(base, CFG.birthVar)
        }

        function makeNode(pos: SpawnPos): Node {
            const rf = CFG.colorRange / 100
            const h = cfg.HEIGHT
            const x = Math.max(pos.nodeR, Math.min(CW() - pos.nodeR, pos.x))
            const y = Math.max(pos.nodeR, Math.min(h - pos.nodeR, pos.y))
            return {
                x, y,
                ripples: [],
                ripplesSpawned: 0,
                nextRippleTs: 0,
                birthColor: pickBirthColor(rf),
                lineColor: null,
                draining: false,
                ghost: false,
                nodeSpeedMult: varyF(1, CFG.rippleSpeedNodeVar),
                nodeBirthRate: varyF(CFG.rippleBirthRate, CFG.rippleBirthRateVar),
                nodeR: pos.nodeR,
            }
        }

        function spawnRipple(node: Node) {
            const rf = CFG.colorRange / 100
            const vf = CFG.colorVar / 100
            const opv = CFG.rippleOpVar / 100
            let col: [number, number, number]
            if (node.ripplesSpawned === 0) {
                col = [...node.birthColor] as [number, number, number]
                node.lineColor = col
            } else {
                col = varyColor(node.birthColor, rf, vf)
            }
            const spd = varyF(CFG.rippleSpeed, CFG.rippleSpeedVar) * node.nodeSpeedMult
            const fadeStart = 1 - CFG.fadePct / 100
            node.ripples.push({
                r: 0, progress: 0, maxR: node.nodeR, speed: spd, fadeStart,
                strokeOp: Math.min(1, CFG.rippleStrokeOp * varyF(1, opv)),
                fillOp: Math.min(1, CFG.rippleFillOp * varyF(1, opv)),
                color: col,
            })
            node.ripplesSpawned++
        }

        function nodeIsDead(node: Node) {
            if (!node.ghost) return false
            return node.ripples.every((r) => r.progress >= 1 && rippleAlpha(r.progress, r.fadeStart) <= 0)
        }

        function getAllActivePositions(): { x: number; y: number }[] {
            const pts: { x: number; y: number }[] = []
            for (const p of pairs) { pts.push({ x: p.sender.x, y: p.sender.y }); pts.push({ x: p.receiver.x, y: p.receiver.y }) }
            for (const gh of ghosts) pts.push({ x: gh.x, y: gh.y })
            return pts
        }

        function makePair(): Pair {
            const existing = getAllActivePositions()
            const sSpawn = rollSpawnPos(existing)
            existing.push({ x: sSpawn.x, y: sSpawn.y })
            const rSpawn = rollReceiverPos(sSpawn.x, sSpawn.y, existing)
            return {
                sender: makeNode(sSpawn),
                receiver: { x: rSpawn.x, y: rSpawn.y, nodeR: rSpawn.nodeR },
                line: { t: 0, speedMult: varyF(1, CFG.lineSpeedVar), opMult: varyF(1, CFG.lineOpVar), tailLen: varyF(CFG.tailLen, CFG.tailLenVar) },
            }
        }

        let pairs: Pair[] = []
        let ghosts: Node[] = []
        let dyingLines: DyingLine[] = []
        let pendingPairs: { spawnAt: number }[] = []
        let running = true
        let startTs = -1
        let lastTs = 0
        let mountTs = performance.now()

        // ── Text animation ────────────────────────────────────────────────────
        const textTimers: ReturnType<typeof setTimeout>[] = []
        let textPlayed = false

        function clearTextTimers() {
            textTimers.forEach(clearTimeout)
            textTimers.length = 0
        }

        function buildTextDOM() {
            textLayer!.innerHTML = ""
            const opening = getType().OPENING
            const fontSize = typeof window !== "undefined"
                ? Math.round(window.innerWidth * (opening.sizeVw / 100))
                : 72

            const lines: Record<number, { chunk: typeof CHUNKS[0]; idx: number }[]> = {}
            CHUNKS.forEach((chunk, i) => {
                const ln = chunk.line || 1
                if (!lines[ln]) lines[ln] = []
                lines[ln].push({ chunk, idx: i })
            })

            Object.keys(lines).sort((a, b) => Number(a) - Number(b)).forEach((ln) => {
                const lineEl = document.createElement("div")
                lineEl.style.cssText = "display:flex;flex-wrap:nowrap;align-items:baseline;margin-bottom:2px;overflow:visible"
                lines[Number(ln)].forEach(({ chunk, idx }) => {
                    const parts = parseChunkText(chunk.text)
                    const span = document.createElement("span")
                    span.dataset.chunk = String(idx)
                    span.style.cssText = [
                        "display:inline-block",
                        "position:relative",
                        "overflow:visible",
                        `font-family:${TYPE.display}`,
                        `font-weight:${opening.weight}`,
                        `font-size:${fontSize}px`,
                        `line-height:${opening.lineHeight}`,
                        `letter-spacing:${opening.tracking}em`,
                        "color:#ffffff",
                        "white-space:nowrap",
                        "opacity:0",
                        "filter:drop-shadow(0px 2px 12px rgba(0,0,0,0.8))",
                    ].join(";")
                    if (chunk.wipe) {
                        span.style.webkitMaskImage = "linear-gradient(to right, transparent 0%, transparent 100%)"
                        span.style.maskImage = "linear-gradient(to right, transparent 0%, transparent 100%)"
                    }
                    if (chunk.push) {
                        span.style.transform = `translate(${TIMING.pushX}px,${TIMING.pushY}px)`
                    }
                    parts.forEach((part) => {
                        const s = document.createElement("span")
                        if (part.hl) s.dataset.hl = "1"
                        s.textContent = part.t
                        span.appendChild(s)
                    })
                    lineEl.appendChild(span)
                })
                textLayer!.appendChild(lineEl)
            })
        }

        function scheduleColorOut(els: HTMLElement[]) {
            if (TIMING.colorDurOut <= 0) return
            const t = setTimeout(() => {
                const s = performance.now()
                const frame = (ts: number) => {
                    const p = Math.min((ts - s) / TIMING.colorDurOut, 1)
                    els.forEach((el) => (el.style.color = lerpColor(1 - p, TIMING.highlightColor)))
                    if (p < 1) requestAnimationFrame(frame)
                    else els.forEach((el) => (el.style.color = "#ffffff"))
                }
                requestAnimationFrame(frame)
            }, TIMING.colorHold)
            textTimers.push(t)
        }

        function animateChunk(chunkEl: HTMLElement, chunk: typeof CHUNKS[0]) {
            const dur = TIMING.duration
            const doWipe = !!chunk.wipe
            const doFade = !!chunk.fade
            const doPush = !!chunk.push
            chunkEl.style.opacity = "1"

            if (doFade) {
                chunkEl.style.opacity = "0"
                const start = performance.now()
                const frame = (ts: number) => {
                    const p = Math.min((ts - start) / dur, 1)
                    chunkEl.style.opacity = String(p)
                    if (p < 1) requestAnimationFrame(frame)
                    else chunkEl.style.opacity = "1"
                }
                requestAnimationFrame(frame)
            }

            if (doPush) {
                const startX = TIMING.pushX, startY = TIMING.pushY
                const start = performance.now()
                const frame = (ts: number) => {
                    const raw = Math.min((ts - start) / dur, 1)
                    const p = 1 - Math.pow(1 - raw, 3)
                    chunkEl.style.transform = `translate(${startX * (1 - p)}px,${startY * (1 - p)}px)`
                    if (raw < 1) requestAnimationFrame(frame)
                    else chunkEl.style.transform = "translate(0,0)"
                }
                requestAnimationFrame(frame)
            }

            if (doWipe) {
                chunkEl.style.opacity = "1"
                const feather = TIMING.feather
                const start = performance.now()
                const frame = (ts: number) => {
                    const p = Math.min((ts - start) / dur, 1)
                    const pos = p * (100 + feather) - feather
                    const val = `linear-gradient(to right, black 0%, black ${pos}%, transparent ${pos + feather}%, transparent 100%)`
                    chunkEl.style.webkitMaskImage = val
                    chunkEl.style.maskImage = val
                    if (p < 1) requestAnimationFrame(frame)
                    else {
                        chunkEl.style.webkitMaskImage = "none"
                        chunkEl.style.maskImage = "none"
                    }
                }
                requestAnimationFrame(frame)
            }

            const hlEls = Array.from(chunkEl.querySelectorAll<HTMLElement>("[data-hl]"))
            if (hlEls.length > 0) {
                const t = setTimeout(() => {
                    if (TIMING.colorDurIn === 0) {
                        hlEls.forEach((el) => (el.style.color = TIMING.highlightColor))
                        scheduleColorOut(hlEls)
                    } else {
                        const s = performance.now()
                        const frame = (ts: number) => {
                            const p = Math.min((ts - s) / TIMING.colorDurIn, 1)
                            hlEls.forEach((el) => (el.style.color = lerpColor(p, TIMING.highlightColor)))
                            if (p < 1) requestAnimationFrame(frame)
                            else {
                                hlEls.forEach((el) => (el.style.color = TIMING.highlightColor))
                                scheduleColorOut(hlEls)
                            }
                        }
                        requestAnimationFrame(frame)
                    }
                }, TIMING.colorDelay)
                textTimers.push(t)
            }
        }

        function playText() {
            if (playOnce && textPlayed) return
            textPlayed = true
            clearTextTimers()
            buildTextDOM()
            CHUNKS.forEach((chunk, i) => {
                const t = setTimeout(() => {
                    const chunkEl = textLayer!.querySelector<HTMLElement>(`[data-chunk="${i}"]`)
                    if (chunkEl) animateChunk(chunkEl, chunk)
                }, chunk.delay)
                textTimers.push(t)
            })
        }

        const textDelayTimer = setTimeout(playText, TEXT_DELAY)

        // ── Scroll fade ───────────────────────────────────────────────────────
        function handleScrollFade() {
            if (!container) return
            const rect = container.getBoundingClientRect()
            const top = rect.top
            if (top >= SCROLL_FADE.fadeOutStart) { container.style.opacity = "1"; return }
            if (top <= SCROLL_FADE.fadeOutEnd) { container.style.opacity = "0"; return }
            const raw = (top - SCROLL_FADE.fadeOutEnd) / (SCROLL_FADE.fadeOutStart - SCROLL_FADE.fadeOutEnd)
            container.style.opacity = String(Math.max(0, Math.min(1, raw)))
        }
        handleScrollFade()
        window.addEventListener("scroll", handleScrollFade, { passive: true })

        // ── Render loop ───────────────────────────────────────────────────────
        let rafId = 0

        function tick(ts: number) {
            if (!running) return
            rafId = requestAnimationFrame(tick)

            const wallAge = (ts - mountTs) / 1000
            if (wallAge < PLAY_DELAY) { ctx!.clearRect(0, 0, CW(), cfg.HEIGHT); return }
            if (startTs < 0) startTs = ts

            const dt = Math.min((ts - lastTs) / 1000, 0.05)
            lastTs = ts

            const el = CFG.energyLoss / 100
            const cw = CW()
            const h = cfg.HEIGHT

            const need = CFG.maxPairs - pairs.length - pendingPairs.length
            if (need > 0) {
                let t = ts
                for (let i = 0; i < need; i++) { t += variedInterval(); pendingPairs.push({ spawnAt: t }) }
            }
            for (let i = pendingPairs.length - 1; i >= 0; i--) {
                if (ts >= pendingPairs[i].spawnAt) { pendingPairs.splice(i, 1); pairs.push(makePair()) }
            }

            for (const p of pairs) {
                const s = p.sender
                if (!s.draining && ts >= s.nextRippleTs) {
                    spawnRipple(s)
                    s.nextRippleTs = ts + s.nodeBirthRate
                    if (s.ripplesSpawned >= CFG.rippleCount) s.draining = true
                }
                if (s.lineColor) {
                    const dx = p.receiver.x - s.x, dy = p.receiver.y - s.y
                    const dist = Math.hypot(dx, dy)
                    p.line.t = Math.min(1, p.line.t + (CFG.lineSpeed * p.line.speedMult * dt) / Math.max(1, dist))
                    if (p.line.t >= 1) {
                        dyingLines.push({
                            x1: s.x, y1: s.y, x2: p.receiver.x, y2: p.receiver.y,
                            color: [...s.lineColor] as [number, number, number],
                            peakAlpha: CFG.lineOp * p.line.opMult,
                            weight: CFG.lineWeight, tailLen: p.line.tailLen, age: 0, duration: CFG.dyingLineDuration,
                        })
                        s.ghost = true
                        ghosts.push(s)
                        const oldPos = p.receiver
                        const existing = getAllActivePositions()
                        const rSpawn = rollReceiverPos(oldPos.x, oldPos.y, existing)
                        p.sender = makeNode({ x: oldPos.x, y: oldPos.y, nodeR: oldPos.nodeR })
                        p.receiver = { x: rSpawn.x, y: rSpawn.y, nodeR: rSpawn.nodeR }
                        p.line = { t: 0, speedMult: varyF(1, CFG.lineSpeedVar), opMult: varyF(1, CFG.lineOpVar), tailLen: varyF(CFG.tailLen, CFG.tailLenVar) }
                    }
                }
                for (const r of p.sender.ripples) {
                    r.progress = Math.min(1, r.progress + (r.speed * dt) / r.maxR)
                    r.r = r.maxR * easedProgress(r.progress, el)
                }
            }

            for (const gh of ghosts) {
                for (const r of gh.ripples) {
                    r.progress = Math.min(1, r.progress + (r.speed * dt) / r.maxR)
                    r.r = r.maxR * easedProgress(r.progress, el)
                }
            }
            for (let i = ghosts.length - 1; i >= 0; i--) { if (nodeIsDead(ghosts[i])) ghosts.splice(i, 1) }
            for (let i = dyingLines.length - 1; i >= 0; i--) {
                dyingLines[i].age += dt
                if (dyingLines[i].age >= dyingLines[i].duration) dyingLines.splice(i, 1)
            }

            ctx!.clearRect(0, 0, cw, h)
            ctx!.lineCap = "round"
            ctx!.globalCompositeOperation = CFG.blendMode

            for (const dl of dyingLines) {
                const t = Math.min(1, dl.age / dl.duration)
                const alpha = dl.peakAlpha * (1 - t * t * t)
                if (alpha <= 0.005) continue
                const [cr, cg, cb] = dl.color
                const grad = ctx!.createLinearGradient(dl.x1, dl.y1, dl.x2, dl.y2)
                grad.addColorStop(0, `rgba(${cr},${cg},${cb},0)`)
                grad.addColorStop(Math.max(0.01, 1 - dl.tailLen), `rgba(${cr},${cg},${cb},0)`)
                grad.addColorStop(1, `rgba(${cr},${cg},${cb},${alpha})`)
                ctx!.beginPath(); ctx!.moveTo(dl.x1, dl.y1); ctx!.lineTo(dl.x2, dl.y2)
                ctx!.strokeStyle = grad; ctx!.lineWidth = dl.weight; ctx!.stroke()
            }

            for (const p of pairs) {
                const s = p.sender
                if (!s.lineColor || p.line.t <= 0) continue
                const dx = p.receiver.x - s.x, dy = p.receiver.y - s.y
                const t = p.line.t
                const tailT = Math.max(0, t - p.line.tailLen)
                const fx = s.x + dx * t, fy = s.y + dy * t
                const tx2 = s.x + dx * tailT, ty2 = s.y + dy * tailT
                const [cr, cg, cb] = s.lineColor
                const op = CFG.lineOp * p.line.opMult
                const grad = ctx!.createLinearGradient(tx2, ty2, fx, fy)
                grad.addColorStop(0, `rgba(${cr},${cg},${cb},0)`)
                grad.addColorStop(1, `rgba(${cr},${cg},${cb},${op})`)
                ctx!.beginPath(); ctx!.moveTo(tx2, ty2); ctx!.lineTo(fx, fy)
                ctx!.strokeStyle = grad; ctx!.lineWidth = CFG.lineWeight; ctx!.stroke()
            }

            function drawNodeRipples(node: Node) {
                for (const r of node.ripples) {
                    const alpha = rippleAlpha(r.progress, r.fadeStart)
                    if (alpha <= 0) continue
                    const [cr, cg, cb] = r.color
                    ctx!.beginPath()
                    ctx!.arc(node.x, node.y, Math.max(0.5, r.r), 0, Math.PI * 2)
                    if (r.strokeOp > 0) {
                        ctx!.strokeStyle = `rgba(${cr},${cg},${cb},${r.strokeOp * alpha})`
                        ctx!.lineWidth = CFG.rippleStroke
                        ctx!.stroke()
                    }
                    if (r.fillOp > 0) {
                        ctx!.fillStyle = `rgba(${cr},${cg},${cb},${r.fillOp * alpha})`
                        ctx!.fill()
                    }
                }
            }
            for (const p of pairs) drawNodeRipples(p.sender)
            for (const gh of ghosts) drawNodeRipples(gh)

            for (const p of pairs) {
                p.sender.ripples = p.sender.ripples.filter(
                    (r) => !(r.progress >= 1 && rippleAlpha(r.progress, r.fadeStart) <= 0)
                )
            }
            for (const gh of ghosts) {
                gh.ripples = gh.ripples.filter(
                    (r) => !(r.progress >= 1 && rippleAlpha(r.progress, r.fadeStart) <= 0)
                )
            }

            ctx!.globalCompositeOperation = "source-over"
        }

        mountTs = performance.now()
        rafId = requestAnimationFrame(tick)

        return () => {
            running = false
            cancelAnimationFrame(rafId)
            ro.disconnect()
            clearTextTimers()
            clearTimeout(textDelayTimer)
            window.removeEventListener("scroll", handleScrollFade)
        }
    }, [breakpoint])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: cfg.HEIGHT,
                overflow: "visible",
                background: "transparent",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    height: "100%",
                    mixBlendMode: CFG.blendMode as any,
                }}
            />
            <div
                ref={textLayerRef}
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    padding: "0 0 100px 0",
                    overflow: "visible",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}