"use client"

// SiteRevealQueue.tsx
// app/components/
// SITE-WIDE. Named for what it serves: Who I Am and Let's Talk both run on it,
// and any page whose content is markdown blocks will.
// v01 — 2026-08-25
//
// ONE queue owns the order and pacing of every reveal on a page. It replaces a
// design where eligibility (position) and sequence (order + pacing) were the
// same mechanism — which is why fast scrolling, whose job was to skip the
// WAITING, also skipped the ORDERING: the waiting was the only thing producing
// the order.
//
//   ORDER IS ABSOLUTE.   An item never starts before anything above it.
//   PACING IS ELASTIC.   Scroll pressure compresses the gaps; it never
//                        reorders, never skips a fade, never dumps.
//
// The guarantee is structural, not probabilistic. The pump walks items in
// document order and BREAKS — not continues — at the first one that may not
// go yet. Nothing behind a blocked item can overtake it, at any scroll speed,
// on any device, under any frame budget.
//
// Eligibility is injected per item, which is what lets one queue serve two
// kinds of page:
//   position-driven (Who I Am) — eligible when the LEADING edge crosses BF0
//   choreographed   (Let's Talk) — eligible when the page's own timer says so
// See `sequence: manual` in the content frontmatter.

import { useEffect, useRef } from "react"
import { DEBUG, getBreakpoint, getVisibility, SEQUENCE } from "./SiteTokens"

// ─── Item registry ────────────────────────────────────────────────────────────

interface QueueItem {
    index: number
    eligible: () => boolean
    holds: () => boolean       // wants to hold the queue until it completes
    passed: () => boolean      // has scrolled off the TOP, still unrevealed
    start: () => void
}

const _items = new Map<number, QueueItem>()
const _revealed = new Set<number>()

let _armedAt = 0
let _lastRevealAt = 0
let _lastRevealedIndex = -1
let _raf = 0
let _installed = false

// Pressure — is the reader scrolling toward new content?
let _lastScrollY = 0
let _pressureUntil = 0

// ─── Arming ───────────────────────────────────────────────────────────────────

// Play-once is per VISIT. Scrolling never re-arms anything; arriving at the
// page re-arms everything.
export function armQueue(): void {
    _revealed.clear()
    _lastRevealAt = 0
    _lastRevealedIndex = -1
    _armedAt = typeof performance !== "undefined" ? performance.now() : 0
    _traced = new Set()
    _pressureUntil = 0
    schedule()
}

export function isRevealed(index: number): boolean {
    return _revealed.has(index)
}

export function registerItem(item: QueueItem): () => void {
    _items.set(item.index, item)
    schedule()
    return () => {
        _items.delete(item.index)
    }
}

// ─── The pump ─────────────────────────────────────────────────────────────────

function pump(): void {
    _raf = 0
    if (typeof window === "undefined") return

    const now = performance.now()
    const order = [..._items.keys()].sort((a, b) => a - b)

    // Two sources of pressure. Recent downward scrolling decays quickly, which
    // is right for "the reader is moving" — but it is not enough on its own:
    // land at the bottom of a long page and it decays before the queue has
    // caught up, dropping back to the resting pace with every pull quote
    // holding in turn. Backlog measures how far the queue has fallen behind
    // where the reader is LOOKING, and does not decay until it is worked off.
    let backlog = 0
    for (const i of order) {
        if (_revealed.has(i)) continue
        const it = _items.get(i)
        if (!it?.eligible()) break
        // Only what has gone PAST counts. Items on screen waiting their turn
        // are upcoming, not overdue.
        if (it.passed()) backlog += 1
    }
    const scrollPressure = now < _pressureUntil
    const backlogPressure = backlog >= SEQUENCE.backlogPressure
    const pressure = scrollPressure || backlogPressure
    const step = pressure ? SEQUENCE.minStepMs : SEQUENCE.stepMs

    for (const index of order) {
        if (_revealed.has(index)) continue
        const item = _items.get(index)
        if (!item) continue

        // Position (or the page's timer) says this one may not go yet.
        // BREAK, not continue — everything after it is behind it.
        if (!item.eligible()) break

        // Pacing. The first item of an armed page waits firstDelayMs from the
        // arm; every one after waits `step` from the previous START, not from
        // the previous COMPLETION — overlap is wanted.
        const anchor = _lastRevealAt === 0 ? _armedAt : _lastRevealAt
        const gap = _lastRevealAt === 0 ? SEQUENCE.firstDelayMs : step
        if (now < anchor + gap) break

        // A pull quote holds the queue until it finishes — AT REST. Scroll
        // pressure releases the hold; the pull keeps playing at its own speed
        // and simply overlaps what follows. It is never truncated.
        if (_lastRevealedIndex >= 0) {
            const prev = _items.get(_lastRevealedIndex)
            const wantsHold = prev?.holds() ?? false
            if (wantsHold && !pressure) {
                if (DEBUG.sequence) trace(index, "HELD by " + _lastRevealedIndex, backlog, scrollPressure, backlogPressure)
                break
            }
            if (DEBUG.sequence && wantsHold && pressure) {
                trace(index, "hold RELEASED by pressure", backlog, scrollPressure, backlogPressure)
            }
        }

        _revealed.add(index)
        _lastRevealAt = now
        _lastRevealedIndex = index
        item.start()
        if (DEBUG.sequence) trace(index, "reveal", backlog, scrollPressure, backlogPressure)
    }

    // Keep pumping while anything is still waiting. Items whose eligibility is
    // time-based (a held pull, a page timer) have no scroll event to wake them.
    if (order.some((i) => !_revealed.has(i))) schedule()
}

let _traced = new Set<string>()
function trace(
    index: number,
    what: string,
    backlog: number,
    scrollPressure: boolean,
    backlogPressure: boolean
): void {
    // One line per (item, event) so a 60fps pump cannot flood the console.
    const key = index + ":" + what
    if (_traced.has(key)) return
    _traced.add(key)
    const t = Math.round(performance.now() - _armedAt)
    console.log(
        `[queue ${getBreakpoint()}] +${String(t).padStart(5)}ms  #${String(index).padStart(2)}  ${what}` +
            `   backlog=${backlog}` +
            (scrollPressure ? "  SCROLL-PRESSURE" : "") +
            (backlogPressure ? "  BACKLOG-PRESSURE" : "")
    )
}

function schedule(): void {
    if (typeof window === "undefined") return
    if (_raf) return
    _raf = requestAnimationFrame(pump)
}

// ─── Scroll pressure ──────────────────────────────────────────────────────────

export function installQueue(): () => void {
    if (_installed || typeof window === "undefined") return () => {}
    _installed = true
    _lastScrollY = window.scrollY

    function onScroll() {
        const y = window.scrollY
        const dy = y - _lastScrollY
        // Only scrolling that brings NEW content toward the queue counts, and
        // only past a deadzone — a fidget, or iOS rubber-band bounce, must not
        // collapse the resting pace or drop a pull quote mid-performance.
        if (dy > SEQUENCE.pressureDeadzonePx) {
            _pressureUntil = performance.now() + SEQUENCE.pressureWindowMs
        }
        _lastScrollY = y
        schedule()
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
        window.removeEventListener("scroll", onScroll)
        _installed = false
    }
}

// ─── Zone opacity ─────────────────────────────────────────────────────────────

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

// Leading edge in, trailing edge out. Scrolling down an object rises: its TOP
// edge enters first, so the top edge crossing BF0 starts it; it exits at the
// top, where its BOTTOM edge leaves last, so the fade-out is keyed to the
// bottom edge crossing TF100 -> TF0. An object is lit from the moment any part
// of it enters the band until the last part leaves.
//
// The edge choice matters IN PROPORTION TO THE OBJECT'S HEIGHT — for a
// paragraph the two edges cross a line moments apart, for the skills sphere or
// the Venn diagram they can be most of a screen apart.
export function zoneOpacity(el: HTMLElement): number {
    const vis = getVisibility()
    const vh = window.innerHeight
    const rect = el.getBoundingClientRect()
    const topVh = (rect.top / vh) * 100
    const botVh = (rect.bottom / vh) * 100

    // Taller than the band: both ramps read as partial at once. Clamp to full
    // rather than letting them fight and dim something that fills the screen.
    if (topVh <= vis.TF100 && botVh >= vis.BF100) return 1

    const rampIn = (vis.BF0 - topVh) / (vis.BF0 - vis.BF100)
    const rampOut = (botVh - vis.TF0) / (vis.TF100 - vis.TF0)
    return clamp01(Math.min(rampIn, rampOut))
}

// ─── The hook ─────────────────────────────────────────────────────────────────

// Arrival is time-driven; the zone fade is position-driven. Both are correct
// and they must COMPOSE, not compete:
//
//     opacity = arrival x zone
//
// They used to be two mechanisms writing el.style.opacity directly, which is
// how a scroll-linked scrub could snap an element to 1 that the sequencer had
// not revealed. One value, from two inputs, written once.
export function useSequencedFade(
    index: number,
    opts: {
        eligible?: () => boolean      // omitted = position: leading edge vs BF0
        holds?: () => boolean
        fadeMs?: number
    } = {}
) {
    const ref = useRef<HTMLDivElement>(null)
    const arrival = useRef(0)
    const rafRef = useRef(0)
    const optsRef = useRef(opts)
    optsRef.current = opts

    useEffect(() => {
        const el = ref.current
        if (!el) return

        el.style.opacity = "0"

        function paint() {
            const node = ref.current
            if (!node) return
            node.style.opacity = String(arrival.current * zoneOpacity(node))
        }

        function ramp(from: number) {
            const dur = optsRef.current.fadeMs ?? SEQUENCE.fadeMs
            const t0 = performance.now()
            const frame = (ts: number) => {
                const p = Math.min((ts - t0) / dur, 1)
                arrival.current = from + (1 - from) * p
                paint()
                if (p < 1) rafRef.current = requestAnimationFrame(frame)
            }
            rafRef.current = requestAnimationFrame(frame)
        }

        const unregister = registerItem({
            index,
            eligible: () => {
                const custom = optsRef.current.eligible
                if (custom) return custom()
                const node = ref.current
                if (!node) return false
                // Leading edge above BF0.
                const vis = getVisibility()
                const topVh = (node.getBoundingClientRect().top / window.innerHeight) * 100
                return topVh < vis.BF0
            },
            holds: () => optsRef.current.holds?.() ?? false,
            passed: () => {
                const node = ref.current
                return !!node && node.getBoundingClientRect().bottom < 0
            },
            start: () => ramp(0),
        })

        // The zone half tracks position for the item's whole life, revealed or
        // not — but multiplied by arrival, so it can never show something the
        // queue has not started.
        window.addEventListener("scroll", paint, { passive: true })
        window.addEventListener("resize", paint)
        paint()

        return () => {
            unregister()
            window.removeEventListener("scroll", paint)
            window.removeEventListener("resize", paint)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [index])

    return ref
}
