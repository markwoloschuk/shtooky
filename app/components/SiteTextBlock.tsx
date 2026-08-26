"use client"

// TextBlock.tsx
// app/components/
// Renders a list of content items by ID from a page content file.
// Handles paragraphs, pull text and slots. Order and pacing come from
// SiteRevealQueue; choreographed pages gate through SiteSequenceController.
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
import { COLORS, TYPE, SPACE, SEQUENCE, getVisibility, useColumn, useType, useSpace, bodyMaxWidth } from "./SiteTokens"
import {
    stripComments,
    parseFrontmatter,
    parseBlocks,
    type CaseBlock,
    type PullSpec,
    type PullChunk,
} from "./SiteCaseMarkdown"
import { useSequence } from "./SiteSequenceController"
import { useSequencedFade, installQueue, armQueue, isRevealed, registerItem } from "./SiteRevealQueue"

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
    manualSequence: boolean
}

export function parsePageMd(raw: string): PageDoc {
    const { fm, rest } = parseFrontmatter(stripComments(raw), { fast: '', sequence: '' })
    const blocks = parseBlocks(rest, {
        allowed: PAGE_BLOCKS,
        groupParagraphs: new Set(['paragraph', 'subtitle']),
        pullBlocks: new Set(['pull']),
        nameValue: new Set(['slot']),
    })
    return {
        blocks,
        fast: fm.fast === 'true',
        // `sequence: manual` — the PAGE drives every gate, position drives none.
        manualSequence: fm.sequence === 'manual',
    }
}

// The spacing rhythm is the same on both pages — it was two identical copies
// of SPACE.text in two content files, which existed only because the content
// files also carried per-page timing that has since moved to the pages.
const SPACING = {
    paragraphGap: SPACE.text.paragraphGap,
    pullGapBefore: SPACE.text.pullGapBefore,
    pullGapAfter: SPACE.text.pullGapAfter,
}

// Pacing now lives in SEQUENCE (SiteTokens) and is owned by SiteRevealQueue.
// SCROLL_FADE / SCROLL_FADE_PULL / SCROLL_FADE_FAST are gone: they mixed
// pacing (mountDelay, mountFadeIn) with zone geometry (fadeInStart/End,
// fadeOutStart/End) in one object, and the zone half was hardcoded px that
// were really TF100/TF0 measured at desktop. fadeInStart/fadeInEnd were never
// read here at all.

// A `fast` item shortens its own fade. It never lets it jump the queue.
export const FAST_FADE_SCALE = 0.6
export function itemFadeMs(fast: boolean): number {
    return fast ? SEQUENCE.fadeMs * FAST_FADE_SCALE : SEQUENCE.fadeMs
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
// SiteCaseMarkdown as PullChunk / PullSpec, and there is no ContentItem any more —
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

// ─── ParagraphItem ────────────────────────────────────────────────────────────

function ParagraphItem({
    text,
    queueIndex,
    eligible,
    size = "body",
    fast = false,
}: {
    text: string
    queueIndex: number
    eligible?: () => boolean
    size?: "body" | "subtitle"
    fast?: boolean
}) {
    // Order and pacing come from the queue; this item just says where it is.
    // `fast` shortens its own fade — it never lets it jump the queue.
    const ref = useSequencedFade(queueIndex, {
        eligible,
        fadeMs: itemFadeMs(fast),
    })
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

// ─── PullTextItem ─────────────────────────────────────────────────────────────

function PullTextItem({
    pull,
    queueIndex,
    eligible,
}: {
    pull: PullSpec
    queueIndex: number
    eligible?: () => boolean
}) {
    const space = useSpace()
    const type = useType()
    const rootRef = useRef<HTMLDivElement>(null)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const hasPlayed = useRef(false)
    const isPlaying = useRef(false)

    // The only element permitted to hold the queue. At rest the next item waits
    // for this to play out in full; under scroll pressure the hold is released
    // and this simply keeps playing, overlapping what follows. Never truncated.
    const scrollRef = useSequencedFade(queueIndex, {
        eligible,
        holds: () => isPlaying.current,
    })

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
        isPlaying.current = true
        clearTimers()
        const root = rootRef.current
        if (!root) return
        chunks.forEach((chunk, i) => {
            const chunkEl = root.querySelector<HTMLElement>(`[data-chunk="${i}"]`)
            if (!chunkEl) return
            const t = setTimeout(() => {
                animateChunk(chunkEl, chunk)
                if (i === chunks.length - 1) {
                    // Releasing the hold IS "complete". The queue advances on
                    // its own from there — nothing unlocks a next gate by hand.
                    const done = setTimeout(() => {
                        isPlaying.current = false
                    }, timing.duration + 100)
                    timers.current.push(done)
                }
            }, chunk.delay)
            timers.current.push(t)
        })
    }

    // The queue decides WHEN. This used to run its own in-view check on every
    // scroll event, which is how a pull quote could start before the paragraphs
    // above it — a second mechanism racing the first.
    useEffect(() => {
        let raf = 0
        const tick = () => {
            if (isRevealed(queueIndex)) play()
            else raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [queueIndex])

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

    // The markdown arrives as a STRING, already read server-side and passed in
    // as a prop. Deliberately not fetched: this is the page's whole body, and
    // anything that must be on screen before a fetch resolves cannot live in a
    // fetched file. Parsing is the only boundary — the source is interchangeable.
    const doc = useMemo(() => parsePageMd(md), [md])
    const { blocks, fast, manualSequence } = doc
    const spacing = SPACING

    useEffect(() => installQueue(), [])

    // ── Queue indices ───────────────────────────────────────────────────────
    // One FLAT sequence across the whole page, in document order. The queue
    // owns ordering, so there is no per-section gate chain any more and no
    // sentinel registry: an item's place in the order IS its index.
    //
    // Slots take an index too — the sphere and the Venn diagram sit IN the
    // sequence rather than beside it, which is the point of making them
    // content. They simply never hold the queue.
    const indexed = useMemo(() => {
        let n = 0
        return blocks.map((block) => {
            const paragraphs = block.paragraphs ?? (block.type === "slot" ? [] : [block.content])
            const count = block.type === "paragraph" || block.type === "subtitle" ? paragraphs.length : 1
            const first = n
            n += count
            return { block, first, paragraphs }
        })
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
            {indexed.map(({ block, first, paragraphs }, i) => (
                <div key={i} style={columnStyle}>
                    <BlockRenderer
                        block={block}
                        paragraphs={paragraphs}
                        firstIndex={first}
                        seq={i + 1}
                        fast={fast}
                        manualSequence={manualSequence}
                        slots={slots}
                    />
                </div>
            ))}
        </div>
    )
}

// ─── SlotGate ─────────────────────────────────────────────────────────────────
// A slot is IN the sequence, not beside it — that is the point of making the
// sphere and the Venn diagram content rather than JSX in the page file. It
// takes a queue index like anything else.
//
// `hold: <ms>` makes everything after it wait, the way a pull quote does. The
// difference is that a slot has no completion signal to offer: the sphere is a
// continuous canvas that never "finishes". So the hold is a DURATION, which is
// the honest shape for it — and like every hold it is a RESTING-pace rule,
// released the moment the reader is scrolling toward new content.
//
// The slot's children keep painting themselves. SlotGate deliberately does not
// touch their opacity: WhoVennDiagram writes its own (reaching up to its
// parent), and the sphere is a canvas that manages its own fade.
function SlotGate({
    queueIndex,
    holdMs,
    bleed,
    eligible,
    children,
}: {
    queueIndex: number
    holdMs: number
    bleed: boolean
    eligible?: () => boolean
    children: React.ReactNode
}) {
    const ref = useRef<HTMLDivElement>(null)
    const startedAt = useRef(0)

    useEffect(() => {
        const unregister = registerItem({
            index: queueIndex,
            eligible: () => {
                if (eligibleRef.current) return eligibleRef.current()
                const node = ref.current
                if (!node) return false
                const vis = getVisibility()
                const topVh = (node.getBoundingClientRect().top / window.innerHeight) * 100
                return topVh < vis.BF0
            },
            holds: () =>
                startedAt.current > 0 && performance.now() < startedAt.current + holdMs,
            passed: () => {
                const node = ref.current
                return !!node && node.getBoundingClientRect().bottom < 0
            },
            start: () => {
                startedAt.current = performance.now()
            },
        })
        return unregister
    }, [queueIndex, holdMs])

    const eligibleRef = useRef(eligible)
    eligibleRef.current = eligible

    // `bleed: true` escapes the content column and spans the viewport.
    //
    // This is the KNOWING exception to the leftmost-element principle, the same
    // one SiteBackground gets: the skills sphere is an atmospheric layer, not
    // "content", and its labels are painted ON the canvas so anything outside
    // its box is hard-clipped mid-glyph.
    //
    // It matters because the sphere used to sit OUTSIDE the content column, so
    // its 3%/76%/21% framing was measured against the whole screen. Moved into
    // the column as a slot, 76% of col.vw (76vw on desktop) is 57.8vw — a
    // quarter narrower, with no error anywhere. Any slot holding something
    // sized as a share of the viewport needs this.
    const style: React.CSSProperties = bleed
        ? { width: "100vw", marginLeft: "calc(50% - 50vw)" }
        : { width: "100%" }

    return <div ref={ref} style={style}>{children}</div>
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function BlockRenderer({
    block,
    paragraphs,
    firstIndex,
    seq,
    fast,
    manualSequence,
    slots,
}: {
    block: CaseBlock
    paragraphs: string[]
    firstIndex: number
    seq: number
    fast: boolean
    manualSequence: boolean
    slots?: Record<string, React.ReactNode>
}) {
    // Two kinds of eligibility, one queue.
    //   position-driven — omitted, so the item measures its own leading edge
    //                     against BF0 (Who I Am)
    //   choreographed   — the page's timer opened this gate (Let's Talk)
    const gateOpen = useSequence(seq)
    const eligible = manualSequence ? () => gateOpen : undefined

    if (block.type === "slot") {
        // The content file names the slot and says how long it holds; the PAGE
        // supplies the element and every layout decision about it. The content
        // never learns what a Venn diagram is or what props it takes.
        return (
            <SlotGate
                queueIndex={firstIndex}
                holdMs={parseInt(block.fields?.hold ?? "0", 10) || 0}
                bleed={block.fields?.bleed === "true"}
                eligible={eligible}
            >
                {slots?.[block.content.trim()] ?? null}
            </SlotGate>
        )
    }

    if (block.type === "pull") {
        return (
            <PullTextItem
                pull={block.pull!}
                queueIndex={firstIndex}
                eligible={eligible}
            />
        )
    }

    // paragraph | subtitle — consecutive queue indices, so they arrive in order
    // and pace themselves off each other exactly like everything else. There is
    // no per-section stagger index any more: the queue is the stagger.
    return (
        <>
            {paragraphs.map((text, j) => (
                <ParagraphItem
                    key={j}
                    text={text}
                    queueIndex={firstIndex + j}
                    eligible={eligible}
                    size={block.type === "subtitle" ? "subtitle" : "body"}
                    fast={fast}
                />
            ))}
        </>
    )
}
