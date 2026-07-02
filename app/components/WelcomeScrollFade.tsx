"use client"

import { useEffect, useRef, useState, ReactNode } from "react"

interface Props {
    children: ReactNode
    enabled?: boolean       // when false, stays invisible and ignores scroll
    fadeInStart?: number    // px from viewport bottom where fade begins
    fadeInEnd?: number      // px from viewport bottom where fade completes
    fadeOutStart?: number   // rect.top where fade-out begins
    fadeOutEnd?: number     // rect.top where fade-out completes
}

export default function ScrollFade({
    children,
    enabled = true,
    fadeInStart = 250,
    fadeInEnd = 350,
    fadeOutStart = 150,
    fadeOutEnd = 0,
}: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        el.style.opacity = "0"

        if (!enabled) return

        function handleScroll() {
            const rect = el!.getBoundingClientRect()
            const viewH = window.innerHeight

if (rect.bottom < fadeOutStart) {
    const raw = (rect.bottom - fadeOutEnd) / (fadeOutStart - fadeOutEnd)
    el!.style.opacity = String(Math.max(0, Math.min(1, raw)))
    return
}

            const distFromBottom = viewH - rect.top
            if (distFromBottom < 0) {
                el!.style.opacity = "0"
                return
            }
            const raw = (distFromBottom - fadeInStart) / (fadeInEnd - fadeInStart)
            el!.style.opacity = String(Math.max(0, Math.min(1, raw)))
        }

        window.addEventListener("scroll", handleScroll, { passive: true })

        // Run once on enable in case element is already in viewport
        handleScroll()

        return () => window.removeEventListener("scroll", handleScroll)
    }, [enabled, fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd])

    return (
        <div ref={ref} style={{ width: "100%" }}>
            {children}
        </div>
    )
}
