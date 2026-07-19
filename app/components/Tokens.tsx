// Tokens.tsx — shtooky.com design tokens
// Single source of truth for all components.
//
// 2026-05-23: TYPE object updated with new scale from Typography session.
//             COLUMN and SPACE added. Old TYPE.scale values replaced with named roles.
// 2026-06-06: Breakpoint-tiered architecture added.
//             COLUMN, TYPE sizes, and VISIBILITY now tiered by breakpoint.
//             getColumn(), getType(), getVisibility() getters return correct tier.
//             NAV.height added (measured 87px at desktop).
//             DEBUG.visibility flag added.

"use client"

// ─── DEBUG ───────────────────────────────────────────────────────────────────

export const DEBUG = {
    // Disables per-component scroll fade hooks (legacy, pre-ScrollConfig)
    disableScrollFades: true,
    // Shows zone lines (TF0, TF100, BF100, BF0) and false-color gradient in ScrollConfig
    visibility: false,
}

// ─── COLORS ──────────────────────────────────────────────────────────────────

export const COLORS = {
    welcome: "#00ADEE", // cyan
    work: "#EB008B", // magenta
    about: "#FAAF40", // orange
    thinking: "#D6DE23", // yellow-green
    contact: "#885198", // purple
    dark: "#0D0D0D", // base background
    white: "#FFFFFF",
    gradient: ["#EB008B", "#FAAF40", "#D6DE23", "#00ADEE", "#885198"],
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

export const PAGES = [
    { id: "welcome", label: "Welcome", url: "/", color: "#00ADEE" },
    { id: "work", label: "Work", url: "/work", color: "#EB008B" },
    { id: "about", label: "Who I Am", url: "/who-i-am", color: "#FAAF40" },
    {
        id: "thinking",
        label: "How I Think",
        url: "/how-i-think",
        color: "#D6DE23",
    },
    { id: "contact", label: "Let's Talk", url: "/lets-talk", color: "#885198" },
]

// ─── BREAKPOINTS ─────────────────────────────────────────────────────────────
// Reference viewport: 1440 × 900px (16" MacBook Pro, near-fullscreen).
// Breakpoint values are minimum widths — mobile-first.

export const BREAKPOINTS = {
    mobile: 390,
    tablet: 768,
    laptop: 1280,
    desktop: 1440,
}

// Helper — returns current breakpoint tier name
export function getBreakpoint(): "mobile" | "tablet" | "desktop" {
    if (typeof window === "undefined") return "desktop"
    const w = window.innerWidth
    if (w < BREAKPOINTS.tablet) return "mobile"
    if (w < BREAKPOINTS.laptop) return "tablet"
    return "desktop"
}

// ─── COLUMN SYSTEM ───────────────────────────────────────────────────────────
// Content column width and layout constants, tiered by breakpoint.
// Background layers are full bleed. All content sits inside the column.

const COLUMN_TIERS = {
    desktop: {
        vw: 76, // content column width as % of viewport
        marginVw: 12, // margin each side = (100 - vw) / 2
        bodyColPct: 45, // body copy column as % of content column (~34vw at 1440px)
        referenceW: 1440,
        referenceH: 900,
    },
    tablet: {
        // TODO: tune for tablet
        vw: 88,
        marginVw: 6,
        bodyColPct: 60,
        referenceW: 768,
        referenceH: 1024,
    },
    mobile: {
        // TODO: tune for mobile
        vw: 90,
        marginVw: 3,
        bodyColPct: 100,
        referenceW: 390,
        referenceH: 844,
    },
}

export function getColumn() {
    return COLUMN_TIERS[getBreakpoint()]
}

// Legacy direct export — use getColumn() for breakpoint-aware access
export const COLUMN = COLUMN_TIERS.desktop

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
// Named type roles — use as starting points.
// Components may override individual properties without guilt.
//
// vw sizes: relative to viewport, scale with column.
// px sizes: fixed real pixels.
// weight: font-weight value. Also set font-variation-settings for Source Serif 4.
// tracking: letter-spacing in em.
// lineHeight: unitless multiplier.
//
// Use getType() for breakpoint-aware access.
// TYPE (desktop) exported directly for legacy imports.

const TYPE_TIERS = {
    desktop: {
        // Typefaces
        display: '"Archivo", sans-serif',
        body: '"Source Serif 4", serif',

        // Named weight values
        weight: {
            thin: 100,
            light: 300,
            regular: 400,
            semibold: 600,
            bold: 700,
            extrabold: 800,
            black: 900,
        },

        // ── Type roles ────────────────────────────────────────────────────

        // "I'm a creative problem solver"
        OPENING: {
            sizeVw: 5,
            weight: 700,
            tracking: -0.025,
            lineHeight: 1.05,
        },

        // "interesting"
        DISPLAY_HERO: {
            sizeVw: 6.5,
            weight: 700,
            tracking: -0.025,
            lineHeight: 0.95,
        },

        // "I believe ANY story can be"
        DISPLAY: {
            sizeVw: 2.6,
            weight: 300,
            tracking: -0.01,
            lineHeight: 1.1,
        },

        // "if told to the right audience / and in the right way."
        SUBHEAD: {
            sizeVw: 2.6,
            weight: 300,
            tracking: -0.01,
            lineHeight: 1.2,
        },

        // Welcome page tagline blurb
        TAGLINE: {
            sizePx: 28,
            weight: 300,
            tracking: 0.015,
            lineHeight: 1.45,
        },

        // Welcome page body copy
        BODY_WELCOME: {
            sizePx: 28,
            weight: 300,
            tracking: 0.02,
            lineHeight: 1.72,
        },

        // Essay / case study body copy
        BODY: {
            sizePx: 20,
            weight: 300,
            tracking: 0.01,
            lineHeight: 1.72,
        },

        // Case-panel body copy — mirrors BODY intentionally.
        // Kept separate in case dense-layout or line-length adjustments are needed for case panels later.
        CASE_BODY: {
            sizePx: 20,
            weight: 300,
            tracking: 0.01,
            lineHeight: 1.72,
        },

        // Labels, eyebrows, UI text
        CAPTION: {
            sizePx: 13,
            weight: 300,
            tracking: 0.08,
            lineHeight: 1.4,
        },

        // Nav name
        NAV_NAME: {
            sizePx: 38,
            weight: 700,
            tracking: 0,
            lineHeight: 1.0,
        },

        // Panel pull-quotes
        PULLQUOTE: {
            sizePx: 32,
            weight: 700,
            tracking: 0,
            lineHeight: 1.2,
        },

        // Bold lead-in subtitle; also governs intro blurbs below opening animations
        SUBTITLE: {
            sizePx: 22,
            weight: 700,
            tracking: 0,
            lineHeight: 1.35,
        },

        // Job-detail grid labels (CLIENT / ROLE / TITLE / DELIVERY eyebrows)
        JOB_LABEL: {
            sizePx: 12,
            weight: 700,
            tracking: 0.12,
            lineHeight: 1.4,
        },

        // Site-wide footer blurb text
        FOOTER: {
            sizePx: 14,
            weight: 400,
            tracking: 0.04,
            lineHeight: 1.4,
        },
    },

    tablet: {
        // Vw-based roles below are interpolated between desktop and mobile values
        // (tablet 768 sits 36% of the way from mobile 390 toward desktop 1440).
        // All marked provisional — needs visual tuning on a real tablet.
        display: '"Archivo", sans-serif',
        body: '"Source Serif 4", serif',
        weight: {
            thin: 100,
            light: 300,
            regular: 400,
            semibold: 600,
            bold: 700,
            extrabold: 800,
            black: 900,
        },
        OPENING: { sizeVw: 7, weight: 700, tracking: -0.025, lineHeight: 1.05 }, // interpolated placeholder — needs visual tuning
        DISPLAY_HERO: {
            sizeVw: 9,   // interpolated placeholder — needs visual tuning
            weight: 700,
            tracking: -0.025,
            lineHeight: 0.95,
        },
        DISPLAY: { sizeVw: 3.8, weight: 300, tracking: -0.01, lineHeight: 1.1 }, // interpolated placeholder — needs visual tuning
        SUBHEAD: { sizeVw: 3.8, weight: 300, tracking: -0.01, lineHeight: 1.2 }, // interpolated placeholder — needs visual tuning
        TAGLINE: { sizePx: 26, weight: 300, tracking: 0.015, lineHeight: 1.45 },
        BODY_WELCOME: {
            sizePx: 26,
            weight: 300,
            tracking: 0.02,
            lineHeight: 1.72,
        },
        BODY: { sizePx: 18, weight: 300, tracking: 0.01, lineHeight: 1.72 },
        CASE_BODY: { sizePx: 18, weight: 300, tracking: 0.01, lineHeight: 1.72 }, // mirrors BODY
        CAPTION: { sizePx: 13, weight: 300, tracking: 0.08, lineHeight: 1.4 },
        NAV_NAME: { sizePx: 30, weight: 700, tracking: 0, lineHeight: 1.0 }, // interpolated placeholder — needs visual tuning
        PULLQUOTE: { sizePx: 28, weight: 700, tracking: 0, lineHeight: 1.2 }, // interpolated placeholder — needs visual tuning
        SUBTITLE: { sizePx: 20, weight: 700, tracking: 0, lineHeight: 1.35 }, // interpolated placeholder — needs visual tuning
        JOB_LABEL: { sizePx: 11, weight: 700, tracking: 0.12, lineHeight: 1.4 }, // interpolated placeholder — needs visual tuning
        FOOTER: { sizePx: 13, weight: 400, tracking: 0.04, lineHeight: 1.4 }, // interpolated placeholder — needs visual tuning
    },

    mobile: {
        // TODO: tune for mobile — copied from desktop as placeholder
        display: '"Archivo", sans-serif',
        body: '"Source Serif 4", serif',
        weight: {
            thin: 100,
            light: 300,
            regular: 400,
            semibold: 600,
            bold: 700,
            extrabold: 800,
            black: 900,
        },
        OPENING: { sizeVw: 8, weight: 700, tracking: -0.025, lineHeight: 1.05 },
        DISPLAY_HERO: {
            sizeVw: 10,
            weight: 700,
            tracking: -0.025,
            lineHeight: 0.95,
        },
        DISPLAY: { sizeVw: 4.5, weight: 300, tracking: -0.01, lineHeight: 1.1 },
        SUBHEAD: { sizeVw: 4.5, weight: 300, tracking: -0.01, lineHeight: 1.2 },
        TAGLINE: { sizePx: 22, weight: 300, tracking: 0.015, lineHeight: 1.45 },
        BODY_WELCOME: {
            sizePx: 22,
            weight: 300,
            tracking: 0.02,
            lineHeight: 1.72,
        },
        BODY: { sizePx: 18, weight: 300, tracking: 0.01, lineHeight: 1.72 },
        CASE_BODY: { sizePx: 18, weight: 300, tracking: 0.01, lineHeight: 1.72 }, // mirrors BODY
        CAPTION: { sizePx: 13, weight: 300, tracking: 0.08, lineHeight: 1.4 },
        NAV_NAME: { sizePx: 28, weight: 700, tracking: 0, lineHeight: 1.0 },
        PULLQUOTE: { sizePx: 24, weight: 700, tracking: 0, lineHeight: 1.2 }, // interpolated placeholder — needs visual tuning
        SUBTITLE: { sizePx: 18, weight: 700, tracking: 0, lineHeight: 1.35 }, // interpolated placeholder — needs visual tuning
        JOB_LABEL: { sizePx: 11, weight: 700, tracking: 0.12, lineHeight: 1.4 },
        FOOTER: { sizePx: 13, weight: 400, tracking: 0.04, lineHeight: 1.4 },
    },
}

export function getType() {
    return TYPE_TIERS[getBreakpoint()]
}

// Legacy direct export — use getType() for breakpoint-aware access
export const TYPE = TYPE_TIERS.desktop

// ─── SPACING RHYTHM ──────────────────────────────────────────────────────────
// Base unit 8px. All spacing is a multiple of 8.
// Scale proportionally in vw-based components.

export const SPACE = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 32,
    xl: 48,
    xxl: 64,
}

// ─── TIMING ──────────────────────────────────────────────────────────────────

export const TIMING = {
    pageTransition: 650,
    sliceExpand: 650,
    navGlitch: 80,
    textReveal: 380,
    wordStagger: 42,

    // ── Easing curves ─────────────────────────────────────────────────────
    easeSpring: "cubic-bezier(0.22, 1, 0.36, 1)",
    easeOut: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    easeSettle: "cubic-bezier(0.34, 0.20, 0.64, 1)",
    easeSpringOver: "cubic-bezier(0.34, 1.3, 0.64, 1)",
    easeMain: "cubic-bezier(0.76, 0, 0.24, 1)",
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

export const NAV = {
    height: 87, // measured desktop height in px — update if navbar changes
    nameFontSize: 38,
    nameWeight: 700,
    titleTracking: 0.205,
    lineSpacing: -2,
    stripHeight: 0.13,
    colorBarWidth: 6,
    zIndex: 40,
}

// ─── VISIBILITY & SEQUENCING ─────────────────────────────────────────────────
// Zone lines are in vh — relative to viewport height, not page height.
// TF0/BF0 anchor the gradient edges. TF100/BF100 define the fully-visible active zone.
// Gradient height is independent of zone lines — controls ramp size only.
//
// TF0:   distance from top of viewport where element is 0% opacity (fully gone)
// TF100: distance from top of viewport where element is 100% opacity (fully visible)
// BF100: distance from top of viewport where element is 100% opacity (fully visible)
// BF0:  distance from top of viewport where element is 0% opacity (fully gone)
//       also the fire trigger line for component/pulltext types
//
// Use getVisibility() for breakpoint-aware access.

const VISIBILITY_TIERS = {
    desktop: {
        TF0: 6, // vh from top — 0% opacity (fully gone)
        TF100: 24, // vh from top — 100% opacity (fully visible)
        BF100: 85, // vh from top — 100% opacity (fully visible)
        BF0: 95, // vh from top — 0% opacity (fully gone) + fire trigger line

        gradientHeight: 120, // px — gradient ramp height, independent of zone lines
        gradientOpacity: 0.95,

        revealMs: 800, // playOnOp ramp duration after firing
        staggerMs: 600, // delay between items in same seq group
        idleMs: 4000, // idle timeout before safety-net fire
    },

    tablet: {
        // TODO: tune for tablet — copied from desktop as placeholder
        TF0: 8,
        TF100: 18,
        BF100: 72,
        BF0: 88,
        gradientHeight: 100,
        gradientOpacity: 0.95,
        revealMs: 800,
        staggerMs: 500,
        idleMs: 4000,
    },

    mobile: {
        // TODO: tune for mobile — copied from desktop as placeholder
        TF0: 10,
        TF100: 20,
        BF100: 70,
        BF0: 86,
        gradientHeight: 80,
        gradientOpacity: 0.95,
        revealMs: 800,
        staggerMs: 400,
        idleMs: 3000,
    },
}

export function getVisibility() {
    return VISIBILITY_TIERS[getBreakpoint()]
}

// ─── BREAKPOINT-AWARE HOOKS (SSR-safe) ──────────────────────────────────────
// getColumn()/getType()/getVisibility() read window.innerWidth directly,
// which doesn't exist during server rendering — getBreakpoint() falls back
// to "desktop" there. If a component calls them plainly during render, the
// server-rendered HTML (always desktop-tier) can permanently disagree with
// what the client computes on first paint, and React does not repair that
// mismatch. useBreakpoint() fixes this the same way the project already
// handles getActivePage(): start at the safe SSR-matching default, then
// correct via useEffect once we're actually in the browser.
import { useEffect, useState } from "react"

export function useBreakpoint(): "mobile" | "tablet" | "desktop" {
    const [breakpoint, setBreakpoint] = useState<"mobile" | "tablet" | "desktop">("desktop")

    useEffect(() => {
        function update() {
            setBreakpoint(getBreakpoint())
        }
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [])

    return breakpoint
}

export function useColumn() {
    return COLUMN_TIERS[useBreakpoint()]
}
export function useType() {
    return TYPE_TIERS[useBreakpoint()]
}
export function useVisibility() {
    return VISIBILITY_TIERS[useBreakpoint()]
}




// ─── BACKGROUND ──────────────────────────────────────────────────────────────

export const BACKGROUND = {
    seedMode: "daily",
    fixedSeeds: {
        welcome: 42,
        work: 17,
        about: 93,
        thinking: 61,
        contact: 28,
    },
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

export const FOOTER = {
    blurbs: {
        welcome: [
            "25 years of learning to make things look the way I meant them to.",
            "Creative concepting, direction and execution – sometimes all before lunch.",
            "Making maps to places I've never been – one step at a time.",
        ],
        work: [
            "The work was real and so were the deadlines.",
            "Work will teach you as much about yourself as anything else.",
            "While I'm not all things to all people I am many things to some.",
        ],
        about: [
            "While I'm not all things to all people I am many things to some.",
            "Still learning to see and appreciate things in new ways.",
            "Making maps to places I've never been – one step at a time.",
        ],
        thinking: [
            "Unexpected connections create bridges to great ideas.",
            "Still learning to see and appreciate things in new ways.",
            "Making maps to places I've never been – one step at a time.",
        ],
        contact: [
            "Call me normal and I will call you often.",
            "The work was real and so were the deadlines.",
            "Unexpected connections create bridges to great ideas.",
        ],
    },
    social: [
        {
            id: "linkedin",
            label: "LinkedIn",
            url: "https://www.linkedin.com/in/mark-woloschuk/",
        },
        {
            id: "facebook",
            label: "Facebook",
            url: "https://www.facebook.com/mark.woloschuk",
        },
        { id: "instagram", label: "Instagram", url: "" },
        { id: "medium", label: "Medium", url: "" },
    ],
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

export function getActivePage(): string {
    if (typeof window === "undefined") return "welcome"
    const path = window.location.pathname
    if (path.startsWith("/work")) return "work"
    if (path.startsWith("/who-i-am")) return "about"
    if (path.startsWith("/how-i-think")) return "thinking"
    if (path.startsWith("/lets-talk")) return "contact"
    return "welcome"
}

export default {}

// ─── USAGE NOTES ─────────────────────────────────────────────────────────────
//
// Breakpoint-aware values — always use getters, not direct exports:
//   const col = getColumn()
//   const type = getType()
//   const vis = getVisibility()
//
// Legacy direct exports (desktop values only — avoid in new code):
//   COLUMN, TYPE
//
// Navbar height:
//   NAV.height  →  87px at desktop. Update if navbar is resized.
//
// Visibility zone lines (from getVisibility()):
//   vis.TF0, vis.TF100, vis.BF100, vis.BF0  →  all in vh
//   vis.gradientHeight                   →  in px
//
// vw-based sizing:
//   fontSize: `${getType().OPENING.sizeVw}vw`
//
// px-based sizing:
//   fontSize: `${getType().TAGLINE.sizePx}px`
//
// Column left edge:
//   paddingLeft: `${getColumn().marginVw}vw`
//
// Body copy max-width:
//   maxWidth: `${getColumn().vw * getColumn().bodyColPct / 100}vw`
//
// Source Serif 4 variable font weight axis:
//   fontVariationSettings: `'wght' ${getType().BODY_WELCOME.weight}`
//
// Debug visibility zones (in ScrollConfig):
//   DEBUG.visibility = true  →  shows zone lines + false-color gradient
