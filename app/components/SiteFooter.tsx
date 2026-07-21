// Footer.tsx — shtooky.com
"use client"

// TYPE ROLES USED IN THIS FILE:
//   footer blurb text  → TYPE_TIERS.FOOTER (sizePx)

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { COLORS, FOOTER, PAGES, FRAME_INSET_VW, getActivePage, useType } from "../components/SiteTokens"

const FONT_DISPLAY = '"Archivo", sans-serif'

const ICONS = {
    linkedin: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    ),
    facebook: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    ),
    /*
    instagram: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
    ),
    medium: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
        </svg>
    ),
    */
}

export default function Footer() {
const [activePage, setActivePage] = useState("welcome")
    const [visible, setVisible] = useState(false)
    const pathname = usePathname()
    const type = useType()

    useEffect(() => {
        setActivePage(getActivePage())
    }, [pathname])

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 600)
        return () => clearTimeout(timer)
    }, [])

const pageBlurbs =
        FOOTER.blurbs[activePage as keyof typeof FOOTER.blurbs] ??
        FOOTER.blurbs.welcome
    const [blurb, setBlurb] = useState("")
    const [blurbVisible, setBlurbVisible] = useState(true)

    useEffect(() => {
        const blurbs = FOOTER.blurbs[activePage as keyof typeof FOOTER.blurbs] ?? FOOTER.blurbs.welcome
        setBlurbVisible(false)
        const t = setTimeout(() => {
            setBlurb(blurbs[Math.floor(Math.random() * blurbs.length)])
            setBlurbVisible(true)
        }, 500)
        return () => clearTimeout(t)
    }, [activePage])

    const pageColor =
        PAGES.find((p) => p.id === activePage)?.color ?? COLORS.welcome

    return (
        <div
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                // Adjust margin padding here
                paddingLeft: `${FRAME_INSET_VW}vw`,
                paddingRight: `${FRAME_INSET_VW}vw`,

                zIndex: 40,
                background:
                    "linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 100%)",
                opacity: activePage === "welcome" ? (visible ? 1 : 0) : 1,
                transition:
                    activePage === "welcome" ? "opacity 1500ms ease" : "none",
            }}
        >
    <div
    style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: pageColor,
        transition: "background 0.4s ease",
    }}
/>

            {/* Blurb */}
            <span
                style={{
                       fontFamily: FONT_DISPLAY,
                    fontSize: type.FOOTER.sizePx,
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                    color: "rgba(255,255,255,0.45)",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: "1 1 auto",
                    minWidth: 0,
                    marginRight: 16,
                    opacity: blurbVisible ? 1 : 0,
                    transition: "opacity 500ms ease",
                }}
            >
                {blurb}
            </span>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>        
                {FOOTER.social.filter((s) => ICONS[s.id as keyof typeof ICONS]).map((s) => (
                    <a
                        key={s.id}
                        href={s.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "rgba(255,255,255,0.35)",
                            display: "flex",
                            alignItems: "center",
                            transition: "color 500ms ease",
                            textDecoration: "none",
                        }}
                        onMouseEnter={(
                            e: React.MouseEvent<HTMLAnchorElement>
                        ) => (e.currentTarget.style.color = pageColor)}
                        onMouseLeave={(
                            e: React.MouseEvent<HTMLAnchorElement>
                        ) =>
                            (e.currentTarget.style.color =
                                "rgba(255,255,255,0.35)")
                        }
                    >
                        {ICONS[s.id as keyof typeof ICONS]}
                    </a>
                ))}
            </div>
        </div>
    )
}
