"use client"

// TextBlock.tsx
// app/components/
// Renders a list of content items by ID from a page content file.
// Handles paragraphs, pull text, and links. Sequenced via SequenceController.
// v02 — ported to Next.js 2026-06-22
//
// TYPE ROLES USED
//   paragraphs        → TYPE_TIERS.BODY / SUBTITLE  (via getParaStyle)
//   pull-quote chunks → TYPE_TIERS.ABOUT_PULLQUOTE  (NOT the shared PULLQUOTE)
//   CTA links         → TYPE_TIERS.CTA_LINK
//
// SPACING
//   SPACE.text.paragraphGap / pullGapBefore / pullGapAfter, resolved with
//   useSpace(). The pull gaps are TOTAL measured distances; the flex gap is
//   subtracted back out at the pull wrapper so one number owns each gap.

import { useEffect, useMemo, useRef } from "react"
import { COLORS, TYPE, SPACE, useColumn, useType, useSpace, bodyMaxWidth } from "./SiteTokens"
import {
    stripComments,
    parseFrontmatter,
    parseBlocks,
    type CaseBlock,
    type PullSpec,
    type PullChunk,
} from "./CaseMarkdown"
import {
    useSequence,
    unlockNextAfter,
    registerSentinel,
    installScrollWatcher,
} from "./SequenceController"

// ─── Dialect ──────────────────────────────────────────────────────────────────
// About and Let's Talk share this one. Blocks are SECTIONS: one block is one
// sequence gate, and block order IS gate order — there are no authored `seq`
// numbers and no `id`s. Blank lines inside a [paragraph] make more paragraphs
// that share the gate (groupParagraphs), which is why this dialect does not
// use splitParagraphs the way Work and Think do.

const PAGE_BLOCKS = new Set(['paragraph', 'subtitle', 'pull', 'slot'])

export interface PageDoc {
    blocks: CaseBlock[]
    fast: boolean
}

export function parsePageMd(raw: string): PageDoc {
    const { fm, rest } = parseFrontmatter(stripComments(raw), { fast: '' })
    const blocks = parseBlocks(rest, {
        allowed: PAGE_BLOCKS,
        groupParagraphs: new Set(['paragraph', 'subtitle']),
        pullBlocks: new Set(['pull']),
    })
    return { blocks, fast: fm.fast === 'true' }
}

// The spacing rhythm is the same on both pages — it was two identical copies
// of SPACE.text in two content files, which existed only because the content
// files also carried per-page timing that has since moved to the pages.
const SPACING = {
    paragraphGap: SPACE.text.paragraphGap,
    pullGapBefore: SPACE.text.pullGapBefore,
    pullGapAfter: SPACE.text.pullGapAfter,
}

// ─── Scroll fade tuning ───────────────────────────────────────────────────────

export const SCROLL_FADE = {
    fadeInStart: 200,
    fadeInEnd: 350,
    fadeOutStart: 250,
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

// Lighter variant for sequenced reveals already on-screen when they unlock
// (Let's Talk's chained blurb → options → paragraphs). SCROLL_FADE's
// 1500/1500 was tuned for scroll-triggered arrival and was costing a full
// 3000ms at every step of an already-visible serial chain.
export const SCROLL_FADE_FAST = {
    ...SCROLL_FADE,
    mountDelay: 100,
    mountFadeIn: 1500,
}

// ─── Paragraph type style ─────────────────────────────────────────────────────

function getParaStyle(type: ReturnType<typeof useType>, size: "body" | "subtitle" = "body") {
    const tier = size === "subtitle" ? type.SUBTITLE : type.BODY
    return {
        fontFamily: TYPE.display,
        fontSize: `${tier.sizePx}px`,
        fontWeight: tier.weight,
        letterSpacing: `${tier.tracking}em`,
        lineHeight: tier.lineHeight,
    }
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

// PullChunk / PullTiming / ContentItem are gone. The pull-quote shape lives in
// CaseMarkdown as PullChunk / PullSpec, and there is no ContentItem any more —
// the content is markdown blocks, not numbered objects.

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
    const wasEnabledOnMount = useRef(enabled)

 useEffect(() => {
        const el = ref.current
        if (!el) return
        el.style.opacity = "0"
        if (!enabled) return

        function handleScroll() {
            if (!el) return
            const rect = el.getBoundingClientRect()

            if (rect.bottom < 0) {
                el.style.transition = "none"
                el.style.opacity = "1"
                return
            }

            if (rect.bottom < config.fadeOutStart) {
                const raw =
                    (rect.bottom - config.fadeOutEnd) /
                    (config.fadeOutStart - config.fadeOutEnd)
                el.style.transition = "none"
                el.style.opacity = String(Math.max(0, Math.min(1, raw)))
                return
            }

            el.style.transition = "none"
            el.style.opacity = "1"
        }

const rect2 = el.getBoundingClientRect()
        const isVisible = rect2.top < window.innerHeight * 0.85

        if (isVisible) {
            // Was enabled from the start — use mount delay
            setTimeout(() => {
                if (!el) return
                el.style.transition = `opacity ${config.mountFadeIn}ms ease`
                el.style.opacity = "1"
                window.addEventListener("scroll", handleScroll, { passive: true })
            }, config.mountDelay + mountIndex * 400)
        } else {
            // Was locked, just unlocked — wait for scroll into view
            function check() {
                if (!el) return
                const r = el.getBoundingClientRect()
                if (r.top < window.innerHeight * 0.85) {
                    el.style.transition = `opacity ${config.mountFadeIn}ms ease`
                    el.style.opacity = "1"
                    window.removeEventListener("scroll", check)
                    window.addEventListener("scroll", handleScroll, { passive: true })
                }
            }
            check()
            window.addEventListener("scroll", check, { passive: true })
        }

        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [enabled])

    return ref
}

// ─── ParagraphItem ────────────────────────────────────────────────────────────

function ParagraphItem({ text, unlocked, mountIndex = 0, size = "body", fast = false }: { text: string; unlocked: boolean; mountIndex?: number; size?: "body" | "subtitle"; fast?: boolean }) {
    const ref = useScrollFade(unlocked, fast ? SCROLL_FADE_FAST : SCROLL_FADE, false, mountIndex)
    const col = useColumn()
    const type = useType()

    return (
        <div ref={ref} style={{ width: "100%" }}>
            <p
                style={{
                    ...getParaStyle(type, size),
                    color: "#ffffff",
                    maxWidth: bodyMaxWidth(col),
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
    const type = useType() 

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
        fontWeight: type.CTA_LINK.weight,
        fontSize: `${type.CTA_LINK.sizePx}px`,
        letterSpacing: `${type.CTA_LINK.tracking}em`,
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
    pull,
    unlocked,
    onComplete,
}: {
    pull: PullSpec
    unlocked: boolean
    onComplete: () => void
}) {
    const space = useSpace()
    const type = useType()
    const rootRef = useRef<HTMLDivElement>(null)
    const scrollRef = useScrollFade(unlocked, SCROLL_FADE_PULL, true)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const hasPlayed = useRef(false)
    const hasTriggered = useRef(false)

    const spacing = SPACING
    const timing = pull
    const chunks = pull.chunks

    const lines = chunks.reduce(
        (acc, chunk) => {
            const ln = chunk.line || 1
            if (!acc[ln]) acc[ln] = []
            acc[ln].push(chunk)
            return acc
        },
        {} as Record<number, PullChunk[]>
    )

    function clearTimers() {
        timers.current.forEach(clearTimeout)
        timers.current = []
    }

    function animateChunk(chunkEl: HTMLElement, chunk: PullChunk) {
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
                // Page colour, always. The per-quote `highlightColor` field is
                // gone — all six quotes carried "#FAAF40", which IS COLORS.about.
                const hlColor = COLORS.about
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
                // DERIVED, not a token: the parent flex column already puts
                // `paragraphGap` between every child, so a raw margin here
                // would stack on top of it — the gap you saw was the sum of
                // two numbers and changed meaning depending on the neighbour.
                // pullGapBefore/After are the TOTAL measured distance, so the
                // shared gap is subtracted back out here, in one place.
                // Math.max guards a pull gap tighter than the paragraph gap.
                marginTop: Math.max(0, space(spacing.pullGapBefore) - space(spacing.paragraphGap)),
                marginBottom: Math.max(0, space(spacing.pullGapAfter) - space(spacing.paragraphGap)),
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
                                        // TYPE_TIERS.ABOUT_PULLQUOTE — its own
                                        // role, not the shared PULLQUOTE one.
                                        // See the comment on the desktop tier
                                        // for why, and for what the clamp this
                                        // replaced actually rendered.
                                        fontWeight: type.ABOUT_PULLQUOTE.weight,
                                        fontSize: type.ABOUT_PULLQUOTE.sizePx,
                                        lineHeight: type.ABOUT_PULLQUOTE.lineHeight,
                                        letterSpacing: `${type.ABOUT_PULLQUOTE.tracking}em`,
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
    md,
    slots,
}: {
    md: string
    slots?: Record<string, React.ReactNode>
}) {
    const space = useSpace()
    const groupRefs = useRef(new Map<number, HTMLDivElement | null>())

    // The markdown arrives as a STRING, already read server-side and passed in
    // as a prop. Deliberately not fetched: this is the page's whole body, and
    // anything that must be on screen before a fetch resolves cannot live in a
    // fetched file. Parsing is the only boundary — the source is interchangeable.
    const doc = useMemo(() => parsePageMd(md), [md])
    const { blocks, fast } = doc
    const spacing = SPACING

    useEffect(() => {
        const unsub = installScrollWatcher()
        return unsub
    }, [])

    // ── Sections ────────────────────────────────────────────────────────────
    // One block is one section is one gate. The seq number is the block's
    // POSITION, 1-based — there are no authored seq numbers to drift, and
    // adding a paragraph can no longer renumber anything.
    useEffect(() => {
        const unsubs = blocks.map((_, i) =>
            registerSentinel(i + 1, () => {
                const el = groupRefs.current.get(i + 1)
                // No element yet — report far below the fold so it cannot
                // unlock during the frame before its ref lands. A rect of
                // zeros would read as "at the top of the screen".
                if (!el) return Number.POSITIVE_INFINITY
                return el.getBoundingClientRect().top
            })
        )
        return () => unsubs.forEach((fn) => fn())
    }, [blocks])

    // The section wrapper repeats the parent's gap, so gap-between-sections and
    // gap-between-items stay the same number and the nesting is visually inert.
    const columnStyle = {
        width: "100%",
        display: "flex",
        flexDirection: "column" as const,
        gap: space(spacing.paragraphGap),
    }

    return (
        <div style={columnStyle}>
            {blocks.map((block, i) => {
                const seq = i + 1
                return (
                    <div
                        key={seq}
                        ref={(el) => {
                            groupRefs.current.set(seq, el)
                        }}
                        style={columnStyle}
                    >
                        <BlockRenderer
                            block={block}
                            seq={seq}
                            fast={fast}
                            slots={slots}
                            spacing={spacing}
                        />
                    </div>
                )
            })}
        </div>
    )
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function BlockRenderer({
    block,
    seq,
    fast,
    slots,
    spacing,
}: {
    block: CaseBlock
    seq: number
    fast: boolean
    slots?: Record<string, React.ReactNode>
    spacing: typeof SPACING
}) {
    const unlocked = useSequence(seq)

    if (block.type === "slot") {
        // The content file names the slot; the PAGE supplies the element and
        // every layout decision about it. The content never learns what a Venn
        // diagram is or what props it takes.
        return <>{slots?.[block.content.trim()] ?? null}</>
    }

    if (block.type === "pull") {
        return (
            <PullTextItem
                pull={block.pull!}
                unlocked={unlocked}
                // Pull quotes are the only element permitted to serialise the
                // queue: the next gate waits for this one to play out in full.
                onComplete={() => unlockNextAfter(seq)}
            />
        )
    }

    // paragraph | subtitle — one gate, N paragraphs sharing it.
    // mountIndex is per SECTION. It used to count every paragraph in the whole
    // block, so the last one waited mountDelay + 14 * 400 = ~7s.
    const paragraphs = block.paragraphs ?? [block.content]
    return (
        <>
            {paragraphs.map((text, j) => (
                <ParagraphItem
                    key={j}
                    text={text}
                    unlocked={unlocked}
                    mountIndex={j}
                    size={block.type === "subtitle" ? "subtitle" : "body"}
                    fast={fast}
                />
            ))}
        </>
    )
}
