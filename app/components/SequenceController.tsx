"use client"

// SequenceController.tsx
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
    return () => _sentinels.delete(seqIndex)
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

        _sentinels.forEach((sentinel, seqIndex) => {
            if (
                !_unlocked.has(seqIndex) &&
                sentinel.getTop() < window.innerHeight * 0.85
            ) {
                if (seqIndex <= 1 || _unlocked.has(seqIndex - 1)) {
                    unlock(seqIndex)
                }
            }
        })

        _lastScrollY = scrollY
        _lastScrollTime = now
    }

    window.addEventListener("scroll", onScroll, { passive: true })
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
        const unsub = subscribe(() => setUnlocked(isUnlocked(seqIndex)))
        return unsub
    }, [seqIndex])

    return unlocked
}