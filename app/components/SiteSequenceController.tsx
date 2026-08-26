"use client"

// SiteSequenceController.tsx
// app/components/
// Module-level sequence store. Import functions directly — no React context needed.
// v02 — ported to Next.js 2026-06-22

// ─── Types ────────────────────────────────────────────────────────────────────

type Listener = () => void

// ─── State ────────────────────────────────────────────────────────────────────

const _unlocked = new Set<number>()
const _listeners = new Set<Listener>()
let _scrollWatcherInstalled = false

// ─── Core API ─────────────────────────────────────────────────────────────────

export function unlock(index: number): void {
    if (_unlocked.has(index)) return
    _unlocked.add(index)
    _notify()
}

export function isUnlocked(index: number): boolean {
    return _unlocked.has(index)
}

export function subscribe(fn: Listener): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

export function forceUnlockUpTo(index: number): void {
    let changed = false
    for (let i = 1; i <= index; i++) {
        if (!_unlocked.has(i)) {
            _unlocked.add(i)
            changed = true
        }
    }
    if (changed) _notify()
}

export function reset(): void {
    _unlocked.clear()
    _notify()
}

function _notify(): void {
    _listeners.forEach((fn) => fn())
}

// ─── Scroll watcher ───────────────────────────────────────────────────────────

const _sentinels = new Map<number, { getTop: () => number }>()
let _lastScrollY = 0
let _lastScrollTime = 0
const FAST_SCROLL_THRESHOLD = 600

export function registerSentinel(
    seqIndex: number,
    getTop: () => number
): () => void {
    _sentinels.set(seqIndex, { getTop })
    const release = _claimSeq(seqIndex)
    return () => {
        _sentinels.delete(seqIndex)
        release()
    }
}

// ── Seq numbers are SPARSE. Do not assume seqIndex - 1 exists. ───────────────
// Content files number their items by hand (AboutContent runs 1, 3, 4, 5, …),
// so any rule written as "the previous index" silently breaks the whole chain
// the moment an item is edited out. That is exactly what had happened: nothing
// created seq 2, so seq 3 could never satisfy `_unlocked.has(seqIndex - 1)`,
// and because 4 waited on 3 and 5 on 4, everything below the first two
// paragraphs was unreachable except via the fast-scroll rescue below.
//
// Predecessor/successor are resolved against the seqs the app actually KNOWS
// ABOUT, so gaps are structurally harmless and content can be renumbered freely.
//
// "Known" is deliberately wider than "has a sentinel". Let's Talk's seq 2 is
// TalkOptions, which participates via useSequence(2) and registers no sentinel
// of its own — resolving predecessors from sentinels alone would make seq 1 the
// predecessor of seq 3 and let the scroll watcher unlock the closing paragraphs
// without waiting for the options block. Both entry points register here.
//
// Ref-counted because two components can claim the same seq, and a seq must
// stop being "known" when the last of them unmounts.
const _known = new Map<number, number>()

function _claimSeq(seqIndex: number): () => void {
    _known.set(seqIndex, (_known.get(seqIndex) ?? 0) + 1)
    return () => {
        const n = (_known.get(seqIndex) ?? 1) - 1
        if (n <= 0) _known.delete(seqIndex)
        else _known.set(seqIndex, n)
    }
}

function _sortedSeqs(): number[] {
    return [..._known.keys()].sort((a, b) => a - b)
}

// The registered seq immediately before `seqIndex`, or null if it is the first.
export function prevSeq(seqIndex: number): number | null {
    const all = _sortedSeqs()
    const i = all.indexOf(seqIndex)
    return i > 0 ? all[i - 1] : null
}

// Unlock the next REGISTERED seq after this one. Replaces `unlock(seq + 1)`,
// which quietly unlocked a phantom index whenever numbering had a gap.
export function unlockNextAfter(seqIndex: number): void {
    const all = _sortedSeqs()
    const i = all.indexOf(seqIndex)
    if (i >= 0 && i < all.length - 1) unlock(all[i + 1])
}

export function installScrollWatcher(): () => void {
    if (_scrollWatcherInstalled) return () => {}
    if (typeof window === "undefined") return () => {}
    _scrollWatcherInstalled = true

    function onScroll() {
        const now = performance.now()
        const scrollY = window.scrollY
        const dt = now - _lastScrollTime
        const dy = Math.abs(scrollY - _lastScrollY)
        const velocity = dt > 0 ? (dy / dt) * 1000 : 0

        if (velocity > FAST_SCROLL_THRESHOLD) {
            _sentinels.forEach((sentinel, seqIndex) => {
                if (sentinel.getTop() < 0) {
                    forceUnlockUpTo(seqIndex)
                }
            })
        }

        // Ascending order, not Map insertion order — the cascade depends on a
        // seq seeing its predecessor already unlocked within this same pass.
        for (const seqIndex of _sortedSeqs()) {
            const sentinel = _sentinels.get(seqIndex)
            if (!sentinel) continue
            if (
                !_unlocked.has(seqIndex) &&
                sentinel.getTop() < window.innerHeight * 0.85
            ) {
                const prev = prevSeq(seqIndex)
                if (prev === null || _unlocked.has(prev)) {
                    unlock(seqIndex)
                }
            }
        }

        _lastScrollY = scrollY
        _lastScrollTime = now
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    // Evaluate once on install. The watcher used to run ONLY on scroll events,
    // so anything already in view when the page settled stayed locked until the
    // reader happened to move. That was survivable while the page seeded its
    // own first gate directly; it is not, now that gate 1 is whatever block
    // comes first in the content. rAF so layout has settled before measuring.
    requestAnimationFrame(() => onScroll())

    return () => {
        window.removeEventListener("scroll", onScroll)
        _scrollWatcherInstalled = false
    }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"

export function useSequence(seqIndex: number): boolean {
    const [unlocked, setUnlocked] = useState(() => isUnlocked(seqIndex))

    useEffect(() => {
        setUnlocked(isUnlocked(seqIndex))
        // Claim the seq even without a sentinel, so it still counts as a link
        // in the chain for prevSeq()/unlockNextAfter(). See _known above.
        const release = _claimSeq(seqIndex)
        const unsub = subscribe(() => {
            const next = isUnlocked(seqIndex)
            setUnlocked(prev => prev === next ? prev : next)
        })
        return () => {
            unsub()
            release()
        }
    }, [seqIndex])

    return unlocked
}