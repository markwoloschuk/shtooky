"use client"

import { useEffect, useRef, useState, ReactNode } from "react"

interface Props {
    children: ReactNode
    fadeInStart?: number  // px from viewport bottom where fade begins
    fadeInEnd?: number    // px from viewport bottom where fade completes
    fadeOutStart?: number // rect.top where fade-out begins
    fadeOutEnd?: number   // rect.top where fade-out completes
}

export default function ScrollFade({
    children,
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

        function handleScroll() {
            const rect = el!.getBoundingClientRect()
            const viewH = window.innerHeight

            if (rect.top < fadeOutStart) {
                const raw = (rect.top - fadeOutEnd) / (fadeOutStart - fadeOutEnd)
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
        return () => window.removeEventListener("scroll", handleScroll)
    }, [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd])

    return (
        <div ref={ref} style={{ width: "100%" }}>
            {children}
        </div>
    )
}