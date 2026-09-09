"use client"

// Shared toggle between the NavBar wordmark click ("mark woloschuk" <-> the
// "shtooky" glitch state) and the Footer, so the footer can lock its blurb
// to a fixed line while the nav sits in its alternate state.
//
// ONE OWNER: NavBar's nameWrap click handler is the only place that calls
// setShtookyMode(). Everything else (Footer) only ever reads it via
// useShtookyMode(). No second writer, no derived copy — the exact shape v84
// spent a session learning to avoid getting wrong.
import { useSyncExternalStore } from "react"

let shtookyMode = false
const listeners = new Set<() => void>()

export function getShtookyMode(): boolean {
    return shtookyMode
}

export function setShtookyMode(value: boolean): void {
    if (shtookyMode === value) return
    shtookyMode = value
    listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

function getServerSnapshot(): boolean {
    return false
}

export function useShtookyMode(): boolean {
    return useSyncExternalStore(subscribe, getShtookyMode, getServerSnapshot)
}
