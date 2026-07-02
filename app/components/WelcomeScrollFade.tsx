"use client"

import { useEffect, useRef, ReactNode } from "react"

interface Props {
    children: ReactNode
    enabled?: boolean        // when false, stays invisible and ignores scroll
    mountDelay?: number      // ms before fade-in begins once enabled and in view
    fadeDuration?: number    // ms for opacity transition
    fadeOutStart?: number    // rect.bottom px where fade-out begins (near top of viewport)
    fadeOutEnd?: number      // rect.bottom px where fade-out completes
}

export default function ScrollFade({
    children,
    enabled = true,
    mountDelay = 0,
    fadeDuration = 1000,
    fadeOutStart = 250,
    fadeOutEnd = 50,
}: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        el.style.opacity = "0"
        if (!enabled) return

        function handleScroll() {
            if (!el) return
            const rect = el.getBoundingClientRect()

            // Already scrolled off the top — stay visible
            if (rect.bottom < 0) {
                el.style.transition = "none"
                el.style.opacity = "1"
                return
            }

            // Fading out — bottom edge approaching top of viewport
            if (rect.bottom < fadeOutStart) {
                const raw = (rect.bottom - fadeOutEnd) / (fadeOutStart - fadeOutEnd)
                el.style.transition = "none"
                el.style.opacity = String(Math.max(0, Math.min(1, raw)))
                return
            }

            // Fully visible — stay at 1
            el.style.transition = "none"
            el.style.opacity = "1"
        }

        const rect = el.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight

        if (isVisible) {
            // Already in viewport — fade in after delay
            setTimeout(() => {
                if (!el) return
                el.style.transition = `opacity ${fadeDuration}ms linear`
                el.style.opacity = "1"
                setTimeout(() => {
                    window.addEventListener("scroll", handleScroll, { passive: true })
                }, fadeDuration)
            }, mountDelay)
        } else {
            // Off screen — wait for scroll into view
            function check() {
                if (!el) return
                const r = el.getBoundingClientRect()
                if (r.top < window.innerHeight) {
                    el.style.transition = `opacity ${fadeDuration}ms linear`
                    el.style.opacity = "1"
                    window.removeEventListener("scroll", check)
                    setTimeout(() => {
                        window.addEventListener("scroll", handleScroll, { passive: true })
                    }, fadeDuration)
                }
            }
            window.addEventListener("scroll", check, { passive: true })
        }

        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [enabled, mountDelay, fadeDuration, fadeOutStart, fadeOutEnd])

    return (
        <div ref={ref} style={{ width: "100%" }}>
            {children}
        </div>
    )
}