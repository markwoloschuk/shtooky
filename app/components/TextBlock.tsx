"use client"

// TextBlock.tsx
// app/components/
// Renders a list of content items by ID from a page content file.
// Handles paragraphs, pull text, and links. Sequenced via SequenceController.
// v02 — ported to Next.js 2026-06-22

import { useEffect, useRef } from "react"
import { COLORS, TYPE } from "./Tokens"
import { CONTENT as ABOUT_CONTENT, SPACING as ABOUT_SPACING } from "../data/AboutContent"
import { CONTENT as CONTACT_CONTENT, SPACING as CONTACT_SPACING } from "../data/ContactContent"
import {
    useSequence,
    unlock,
    registerSentinel,
    installScrollWatcher,
} from "./SequenceController"

// ─── Page content map ─────────────────────────────────────────────────────────

function getPageData(page: string) {
    switch (page) {
        case "about":
            return { content: ABOUT_CONTENT, spacing: ABOUT_SPACING }
        case "contact":
            return { content: CONTACT_CONTENT, spacing: CONTACT_SPACING }
        default:
            return { content: ABOUT_CONTENT, spacing: ABOUT_SPACING }
    }
}

// ─── Scroll fade tuning ───────────────────────────────────────────────────────

const SCROLL_FADE = {
    fadeInStart: 200,
    fadeInEnd: 350,
    fadeOutStart: 80,
    fadeOutEnd: 50,
    mountFadeIn: 1500,
    mountDelay: 1500,
}

const SCROLL_FADE_PULL = {
    fadeInStart: 200,
    fadeInEnd: 400,
    fadeOutStart: 250,
    fadeOutEnd: 50,
    mountFadeIn: 1500,
    mountDelay: 0,
}

// ─── Paragraph type style ─────────────────────────────────────────────────────

const PARA_STYLE = {
    fontFamily: TYPE.display,
    fontSize: 24,
    fontWeight: 300,
    letterSpacing: "0.010em",
    lineHeight: 1.72,
}

// ─── Link style ───────────────────────────────────────────────────────────────

const LINK_DEFAULTS = {
    fontSizeVw: 2.0,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    hoverScale: 1.04,
    lingerMs: 500,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChunkDef {
    text: string
    line: number
    delay: number
    wipe: 0 | 1
    fade: 0 | 1
    push: 0 | 1
}

interface PullTiming {
    duration: number
    pushY: number
    pushX: number
    feather: number
    colorDelay: number
    colorDurIn: number
    colorHold: number
    colorDurOut: number
    highlightColor: string
}

export interface ContentItem {
    id: number
    type: "paragraph" | "pull" | "link"
    seq: number
    text?: string
    href?: string
    color?: string
    timing?: PullTiming
    chunks?: ChunkDef[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeText(raw: string): string {
    return raw.replace(/\s+/g, " ").trim()
}

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

function lerpColor(t: number, hlColor: string): string {
    const r = parseInt(hlColor.slice(1, 3), 16)
    const g = parseInt(hlColor.slice(3, 5), 16)
    const b = parseInt(hlColor.slice(5, 7), 16)
    return `rgb(${Math.round(255 + (r - 255) * t)},${Math.round(255 + (g - 255) * t)},${Math.round(255 + (b - 255) * t)})`
}

function preventOrphan(text: string): string {
    const lastSpace = text.lastIndexOf(" ")
    if (lastSpace === -1) return text
    return text.slice(0, lastSpace) + "\u00A0" + text.slice(lastSpace + 1)
}

// ─── useScrollFade ────────────────────────────────────────────────────────────

function useScrollFade(
    enabled: boolean,
    config = SCROLL_FADE,
    fadeInOnly = false,
    mountIndex = 0
) {
    const ref = useRef<HTMLDivElement>(null)
    const mountComplete = useRef(false)
    const enabledRef = useRef(enabled)

    // Keep enabledRef in sync without re-running the effect
    useEffect(() => {
        enabledRef.current = enabled
    }, [enabled])

    // Scroll listener — set up once on mount, never torn down until unmount
    useEffect(() => {
        const el = ref.current
        if (!el) return

function handleScroll() {
            if (!mountComplete.current) return
            if (!el) return
            console.log("handleScroll firing — mountComplete:", mountComplete.current)
            const rect = el.getBoundingClientRect()
            const viewH = window.innerHeight

            if (rect.bottom < config.fadeOutStart) {
                const raw =
                    (rect.bottom - config.fadeOutEnd) /
                    (config.fadeOutStart - config.fadeOutEnd)
                el.style.opacity = String(Math.max(0, Math.min(1, raw)))
                return
            }

            if (fadeInOnly) return

            const distFromBottom = viewH - rect.top
            if (distFromBottom < 0) {
                el.style.opacity = "0"
                return
            }
            const raw =
                (distFromBottom - config.fadeInStart) /
                (config.fadeInEnd - config.fadeInStart)
            el.style.opacity = String(Math.max(0, Math.min(1, raw)))
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Mount animation — runs when enabled flips to true
    useEffect(() => {
        const el = ref.current
        if (!el) return

        if (!enabled) {
            el.style.opacity = "0"
            mountComplete.current = false
            return
        }

        const rect = el.getBoundingClientRect()
        const viewH = window.innerHeight
        const alreadyVisible = rect.top < viewH && rect.bottom > 0

        if (fadeInOnly) {
            mountComplete.current = true
            el.style.opacity = "1"
        } else if (alreadyVisible) {
            setTimeout(() => {
                const start = performance.now()
                function fadeInOnMount(ts: number) {
                    if (!enabledRef.current) return
                    const p = Math.min((ts - start) / config.mountFadeIn, 1)
                    el.style.opacity = String(p)
                    if (p < 1) {
                        requestAnimationFrame(fadeInOnMount)
                    } else {
                        mountComplete.current = true
                    }
                }
                requestAnimationFrame(fadeInOnMount)
            }, config.mountDelay + mountIndex * 400)
        } else {
            mountComplete.current = true
        }
    }, [enabled])

    return ref
}

// ─── ParagraphItem ────────────────────────────────────────────────────────────

function ParagraphItem({
    text,
    unlocked,
    mountIndex = 0,
}: {
    text: string
    unlocked: boolean
    mountIndex?: number
}) {
    const ref = useScrollFade(unlocked, SCROLL_FADE, false, mountIndex)

    return (
        <div ref={ref} style={{ width: "100%" }}>
            <p
                style={{
                    ...PARA_STYLE,
                    color: "#ffffff",
                    maxWidth: "60%",
                    margin: 0,
                    padding: 0,
                }}
            >
                {preventOrphan(normalizeText(text))}
            </p>
        </div>
    )
}

// ─── LinkItem ─────────────────────────────────────────────────────────────────

function LinkItem({
    text,
    href,
    color,
    unlocked,
    mountIndex = 0,
}: {
    text: string
    href: string
    color: string
    unlocked: boolean
    mountIndex?: number
}) {
    const wrapRef = useScrollFade(unlocked, SCROLL_FADE, false, mountIndex)
    const spanRef = useRef<HTMLSpanElement>(null)
    const lingerT = useRef<ReturnType<typeof setTimeout> | null>(null)

    // SSR-safe font size
    useEffect(() => {
        const el = spanRef.current
        if (!el) return
        const getFontPx = () =>
            Math.round((LINK_DEFAULTS.fontSizeVw / 100) * window.innerWidth)
        el.style.fontSize = getFontPx() + "px"
        const onResize = () => {
            el.style.fontSize = getFontPx() + "px"
        }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const el = spanRef.current
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
                if (lingerT.current) clearTimeout(lingerT.current)
                el.style.transition = "transform 220ms cubic-bezier(0.34,1.2,0.64,1)"
                el.style.transform = `scale(${LINK_DEFAULTS.hoverScale})`
            } else if (!inside && wasInside) {
                el.dataset.hovered = "false"
                if (lingerT.current) clearTimeout(lingerT.current)
                lingerT.current = setTimeout(() => {
                    el.style.transition = "transform 350ms cubic-bezier(0.34,0.8,0.64,1)"
                    el.style.transform = "scale(1)"
                }, 60)
            }
        }

        const handleClick = (e: MouseEvent) => {
            const el = spanRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const pad = 20
            const inside =
                e.clientX >= rect.left - pad &&
                e.clientX <= rect.right + pad &&
                e.clientY >= rect.top - pad &&
                e.clientY <= rect.bottom + pad
            if (inside) {
                el.style.transition = "color 120ms ease"
                el.style.color = "#ffffff"
                setTimeout(() => {
                    window.open(href, "_blank")
                    setTimeout(() => {
                        el.style.transition = "color 400ms ease"
                        el.style.color = color
                    }, 120)
                }, 150)
            }
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("click", handleClick)
        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("click", handleClick)
        }
    }, [href, color])

    return (
        <div ref={wrapRef} style={{ width: "100%" }}>
            <span
                ref={spanRef}
                style={{
                    display: "inline-block",
                    fontFamily: TYPE.display,
                    fontWeight: LINK_DEFAULTS.fontWeight,
                    fontSize: "2vw",
                    letterSpacing: LINK_DEFAULTS.letterSpacing,
                    lineHeight: 1,
                    color: color,
                    cursor: "pointer",
                    userSelect: "none",
                    transformOrigin: "left center",
                    willChange: "transform, color",
                }}
            >
                {text}
            </span>
        </div>
    )
}

// ─── PullTextItem ─────────────────────────────────────────────────────────────

function PullTextItem({
    item,
    unlocked,
    onComplete,
    spacing,
}: {
    item: ContentItem
    unlocked: boolean
    onComplete: () => void
    spacing: typeof ABOUT_SPACING
}) {
    const rootRef = useRef<HTMLDivElement>(null)
    const scrollRef = useScrollFade(unlocked, SCROLL_FADE_PULL, true)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const hasPlayed = useRef(false)
    const hasTriggered = useRef(false)

    const timing = item.timing!
    const chunks = item.chunks!

    const lines = chunks.reduce(
        (acc, chunk) => {
            const ln = chunk.line || 1
            if (!acc[ln]) acc[ln] = []
            acc[ln].push(chunk)
            return acc
        },
        {} as Record<number, ChunkDef[]>
    )

    function clearTimers() {
        timers.current.forEach(clearTimeout)
        timers.current = []
    }

    function animateChunk(chunkEl: HTMLElement, chunk: ChunkDef) {
        const dur = timing.duration
        const doWipe = !!chunk.wipe
        const doFade = !!chunk.fade
        const doPush = !!chunk.push
        const startX = doPush ? timing.pushX : 0
        const startY = doPush ? timing.pushY : 0

        if (!doFade && !doWipe) {
            chunkEl.style.opacity = "1"
        }

        if (doFade) {
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
            const start = performance.now()
            const frame = (ts: number) => {
                const raw = Math.min((ts - start) / dur, 1)
                const p = 1 - Math.pow(1 - raw, 3)
                chunkEl.style.transform = `translate(${startX * (1 - p)}px, ${startY * (1 - p)}px)`
                if (raw < 1) requestAnimationFrame(frame)
                else chunkEl.style.transform = "translate(0,0)"
            }
            requestAnimationFrame(frame)
        }

        if (doWipe) {
            if (!doFade && !doPush) chunkEl.style.opacity = "1"
            const feather = timing.feather
            const start = performance.now()
            chunkEl.style["-webkit-mask-image" as any] =
                `linear-gradient(to right, transparent 0%, transparent 100%)`
            chunkEl.style["mask-image" as any] =
                `linear-gradient(to right, transparent 0%, transparent 100%)`
            const frame = (ts: number) => {
                const p = Math.min((ts - start) / dur, 1)
                const pos = p * (100 + feather) - feather
                const val = `linear-gradient(to right, black 0%, black ${pos}%, transparent ${pos + feather}%, transparent 100%)`
                chunkEl.style["-webkit-mask-image" as any] = val
                chunkEl.style["mask-image" as any] = val
                if (p < 1) requestAnimationFrame(frame)
                else {
                    chunkEl.style["-webkit-mask-image" as any] = "none"
                    chunkEl.style["mask-image" as any] = "none"
                }
            }
            requestAnimationFrame(frame)
        }

        const hlEls = Array.from(chunkEl.querySelectorAll<HTMLElement>("[data-hl]"))
        if (hlEls.length > 0) {
            const t = setTimeout(() => {
                const hlColor = timing.highlightColor || COLORS.about
                if (timing.colorDurIn === 0) {
                    hlEls.forEach((el) => (el.style.color = hlColor))
                    scheduleColorOut(hlEls, hlColor)
                } else {
                    const s = performance.now()
                    const frame = (ts: number) => {
                        const p = Math.min((ts - s) / timing.colorDurIn, 1)
                        hlEls.forEach((el) => (el.style.color = lerpColor(p, hlColor)))
                        if (p < 1) requestAnimationFrame(frame)
                        else {
                            hlEls.forEach((el) => (el.style.color = hlColor))
                            scheduleColorOut(hlEls, hlColor)
                        }
                    }
                    requestAnimationFrame(frame)
                }
            }, timing.colorDelay)
            timers.current.push(t)
        }
    }

    function scheduleColorOut(els: HTMLElement[], hlColor: string) {
        if (timing.colorDurOut <= 0) return
        const t = setTimeout(() => {
            const s = performance.now()
            const frame = (ts: number) => {
                const p = Math.min((ts - s) / timing.colorDurOut, 1)
                els.forEach((el) => (el.style.color = lerpColor(1 - p, hlColor)))
                if (p < 1) requestAnimationFrame(frame)
                else els.forEach((el) => (el.style.color = "#ffffff"))
            }
            requestAnimationFrame(frame)
        }, timing.colorHold)
        timers.current.push(t)
    }

    function play() {
        if (hasPlayed.current) return
        hasPlayed.current = true
        clearTimers()
        const root = rootRef.current
        if (!root) return
        chunks.forEach((chunk, i) => {
            const chunkEl = root.querySelector<HTMLElement>(`[data-chunk="${i}"]`)
            if (!chunkEl) return
            const t = setTimeout(() => {
                animateChunk(chunkEl, chunk)
                if (i === chunks.length - 1) {
                    const done = setTimeout(onComplete, timing.duration + 100)
                    timers.current.push(done)
                }
            }, chunk.delay)
            timers.current.push(t)
        })
    }

    useEffect(() => {
        if (!unlocked) return
        if (hasTriggered.current) return

        function checkAndPlay() {
            if (hasTriggered.current) return
            const el = scrollRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const inView = rect.top < window.innerHeight * 0.85
            if (inView) {
                hasTriggered.current = true
                play()
            }
        }

        checkAndPlay()
        window.addEventListener("scroll", checkAndPlay, { passive: true })
        return () => window.removeEventListener("scroll", checkAndPlay)
    }, [unlocked])

    useEffect(() => () => clearTimers(), [])

    const sortedLineNums = Object.keys(lines).sort((a, b) => Number(a) - Number(b))

    return (
        <div
            ref={scrollRef}
            style={{
                marginTop: spacing.pullGapBefore,
                marginBottom: spacing.pullGapAfter,
                width: "100%",
            }}
        >
            <div ref={rootRef}>
                {sortedLineNums.map((ln) => (
                    <div
                        key={ln}
                        style={{
                            display: "flex",
                            flexWrap: "nowrap",
                            alignItems: "baseline",
                            marginBottom: 2,
                        }}
                    >
                        {lines[Number(ln)].map((chunk, ci) => {
                            const globalIdx = chunks.indexOf(chunk)
                            const doWipe = !!chunk.wipe
                            const doPush = !!chunk.push
                            const doFade = !!chunk.fade
                            const willAnimate = doFade || doWipe
                            const startX = doPush ? timing.pushX : 0
                            const startY = doPush ? timing.pushY : 0

                            return (
                                <span
                                    key={ci}
                                    data-chunk={globalIdx}
                                    style={{
                                        display: "inline-block",
                                        position: "relative",
                                        overflow: "visible",
                                WebkitMaskImage: doWipe
                                            ? `linear-gradient(to right, transparent 0%, transparent 0%, black ${timing.feather}%, black 100%)`
                                            : "none",
                                        maskImage: doWipe
                                            ? `linear-gradient(to right, transparent 0%, transparent 0%, black ${timing.feather}%, black 100%)`
                                            : "none",
                                        opacity: willAnimate ? 0 : 1,
                                        transform: doPush
                                            ? `translate(${startX}px, ${startY}px)`
                                            : "translate(0,0)",
                                        fontFamily: TYPE.display,
                                        fontWeight: 700,
                                        fontSize: "clamp(28px, 4vw, 52px)",
                                        lineHeight: 1.05,
                                        letterSpacing: "-0.025em",
                                        color: "#ffffff",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {parseChunkText(chunk.text).map((part, pi) => (
                                        <span
                                            key={pi}
                                            data-hl={part.hl ? "1" : undefined}
                                        >
                                            {part.t}
                                        </span>
                                    ))}
                                </span>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── TextBlock ────────────────────────────────────────────────────────────────

export default function TextBlock({
    page,
    ids,
}: {
    page: string
    ids: string
}) {
    const blockRef = useRef<HTMLDivElement>(null)
    const { content, spacing } = getPageData(page)

    const idList = ids.split(",").flatMap((part) => {
        const range = part.trim().match(/^(\d+)-(\d+)$/)
        if (range) {
            const start = parseInt(range[1], 10)
            const end = parseInt(range[2], 10)
            return Array.from({ length: end - start + 1 }, (_, i) => start + i)
        }
        const n = parseInt(part.trim(), 10)
        return isNaN(n) ? [] : [n]
    })

    const items = idList
        .map((id) => content.find((c: ContentItem) => c.id === id))
        .filter(Boolean) as ContentItem[]

    useEffect(() => {
        const unsub = installScrollWatcher()
        return unsub
    }, [])

    useEffect(() => {
        const block = blockRef.current
        if (!block) return
        const seqs = [...new Set(items.map((item) => item.seq))]
        const unsubs = seqs.map((seq) =>
            registerSentinel(seq, () => {
                const rect = block.getBoundingClientRect()
                return rect.top
            })
        )
        return () => unsubs.forEach((fn) => fn())
    }, [])

    return (
        <div
            ref={blockRef}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: spacing.paragraphGap,
            }}
        >
            {items.map((item) => {
                if (item.type === "paragraph") {
                    const mi =
                        items.filter(
                            (x, xi) =>
                                x.type === "paragraph" && xi <= items.indexOf(item)
                        ).length - 1
                    return (
                        <ParagraphItemWrapper
                            key={item.id}
                            item={item}
                            mountIndex={mi}
                            spacing={spacing}
                        />
                    )
                }
                if (item.type === "pull") {
                    return (
                        <PullTextItemWrapper
                            key={item.id}
                            item={item}
                            spacing={spacing}
                        />
                    )
                }
                if (item.type === "link") {
                    const mi =
                        items.filter(
                            (x, xi) =>
                                x.type === "link" && xi <= items.indexOf(item)
                        ).length - 1
                    return (
                        <LinkItemWrapper
                            key={item.id}
                            item={item}
                            mountIndex={mi}
                        />
                    )
                }
                return null
            })}
        </div>
    )
}

// ─── Wrappers ─────────────────────────────────────────────────────────────────

function ParagraphItemWrapper({
    item,
    mountIndex,
    spacing,
}: {
    item: ContentItem
    mountIndex: number
    spacing: any
}) {
    const unlocked = useSequence(item.seq)
    return (
        <ParagraphItem
            text={item.text!}
            unlocked={unlocked}
            mountIndex={mountIndex}
        />
    )
}

function PullTextItemWrapper({
    item,
    spacing,
}: {
    item: ContentItem
    spacing: any
}) {
    const unlocked = useSequence(item.seq)

    function handleComplete() {
        unlock(item.seq + 1)
    }

    return (
        <PullTextItem
            item={item}
            unlocked={unlocked}
            onComplete={handleComplete}
            spacing={spacing}
        />
    )
}

function LinkItemWrapper({
    item,
    mountIndex,
}: {
    item: ContentItem
    mountIndex: number
}) {
    const unlocked = useSequence(item.seq)
    return (
        <LinkItem
            text={item.text!}
            href={item.href!}
            color={item.color || COLORS.white}
            unlocked={unlocked}
            mountIndex={mountIndex}
        />
    )
}