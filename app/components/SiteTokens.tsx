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
    // Traces every SiteRevealQueue decision to the console: what revealed, when,
    // whether pressure was on, and why a hold did or did not engage.
    sequence: false,
}

// ─── COLORS ──────────────────────────────────────────────────────────────────

export const COLORS = {
    welcome: "#00ADEE", // cyan
    work: "#EB008B", // magenta
    about: "#FAAF40", // orange
    thinking: "#D6DE23", // yellow-green
    contact: "#885198", // purple
    contact2: "#9d63af", // light-purple
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
    { id: "contact", label: "Let’s Talk", url: "/lets-talk", color: "#885198" },
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
        bodyColPct: 70, // body copy column as % of content column (~38vw at 1440px)
        referenceW: 1440,
        referenceH: 900,
    },
    tablet: {
        vw: 86,
        marginVw: 6,
        bodyColPct: 80,
        referenceW: 768,
        referenceH: 1024,
    },
    mobile: {
        vw: 90,
        marginVw: 5,
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
            sizeVw: 5.5,
            weight: 700,
            tracking: -0.025,
            lineHeight: 1.05,
        },

        // "interesting"
        DISPLAY_HERO: {
            sizeVw: 5.5,
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
            sizePx: 24,
            weight: 300,
            tracking: 0.02,
            lineHeight: 1.72,
        },

        // Essay / case study body copy
        BODY: {
            sizePx: 24,
            weight: 300,
            tracking: 0.01,
            lineHeight: 1.72,
        },

        // Case-panel body copy — mirrors BODY intentionally.
        // Kept separate in case dense-layout or line-length adjustments are needed for case panels later.
        CASE_BODY: {
            sizePx: 24,
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
            sizePx: 42,
            weight: 700,
            tracking: 0,
            lineHeight: 1.2,
        },

        // Who I Am's ANIMATED display pull quote (SiteTextBlock > PullTextItem).
        // Deliberately NOT the PULLQUOTE role above: that one is a static
        // paragraph inside a body-copy column, this is display type that wipes
        // and pushes on scroll, with its own tighter leading and tracking.
        // Sharing a role would mean tuning case-panel pull quotes silently
        // moved this page's largest type — the exact coupling just deleted from
        // the WorkCarousel/ThinkGridCanvas band pair.
        //
        // Was `clamp(28px, 4vw, 52px)` hardcoded in SiteTextBlock. Desktop and
        // mobile were already effectively flat at 52 and 28 and tier down
        // losslessly. TABLET IS THE ONE REAL CHANGE: the clamp ran fluid from
        // 31px at 768 to 51px at 1279, and 40 is its value at ~1024, so widths
        // near the top of the tablet tier now render smaller than they did.
        // If that reads badly, this is the best argument on the site for
        // un-pausing fluid clamp-based scaling — not for a fourth breakpoint.
        //
        // NOTE: PullTextItem is shared with Let's Talk, which has no [pull]
        // items today. If it ever gains one it inherits this role — rename
        // before that happens, not after.
        ABOUT_PULLQUOTE: {
            sizePx: 52,
            weight: 700,
            tracking: -0.025,
            lineHeight: 1.05,
        },

        // Bold lead-in subtitle; also governs intro blurbs below opening animations
        SUBTITLE: {
            sizePx: 29,
            weight: 400,
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

        // Job box VALUES (the text under each JOB_LABEL). Was a bare
        // `fontSize: 17` repeated four times in WorkCaseStudyPanel.tsx.
        // sizePx only — weight/colour stay on the span, same as JOB_LABEL.
        JOB_VALUE: {
            sizePx: 17,
            weight: 400,
            tracking: 0,
            lineHeight: 1.4,
        },

        // Case-panel subtitle — the deck that sits with the job box.
        // UNTUNED starting point: sized to sit clearly between the canvas
        // headline and CASE_BODY (24). Tune live.
        CASE_SUBTITLE: {
            sizePx: 32,
            weight: 300,
            tracking: -0.005,
            lineHeight: 1.3,
        },

        // Site-wide footer blurb text
        FOOTER: {
            sizePx: 18,
            weight: 400,
            tracking: 0.1,
            lineHeight: 1.4,
        },

        // Welcome page bottom CTA nav links ("See the work" / "Who I am" / "How I think")
        CTA_LINK: {
            sizePx: 36,
            weight: 700,
            tracking: -0.01,
            lineHeight: 1.0,
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
        OPENING: { sizeVw: 8, weight: 700, tracking: -0.025, lineHeight: 1.05 }, // tuned live against the 3-line Work pullquote
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
            sizePx: 18,
            weight: 300,
            tracking: 0.02,
            lineHeight: 1.72,
        },
        BODY: { sizePx: 18, weight: 300, tracking: 0.01, lineHeight: 1.72 },
        CASE_BODY: { sizePx: 18, weight: 300, tracking: 0.01, lineHeight: 1.72 }, // mirrors BODY
        CAPTION: { sizePx: 13, weight: 300, tracking: 0.08, lineHeight: 1.4 },
        NAV_NAME: { sizePx: 34, weight: 700, tracking: 0, lineHeight: 1.0 }, // interpolated placeholder — needs visual tuning
        PULLQUOTE: { sizePx: 28, weight: 700, tracking: 0, lineHeight: 1.2 }, // interpolated placeholder — needs visual tuning
        ABOUT_PULLQUOTE: { sizePx: 40, weight: 700, tracking: -0.025, lineHeight: 1.05 }, // UNTUNED — replaces a fluid 31-51px clamp; see desktop tier
        SUBTITLE: { sizePx: 20, weight: 400, tracking: 0, lineHeight: 1.35 }, // interpolated placeholder — needs visual tuning
        JOB_LABEL: { sizePx: 11, weight: 700, tracking: 0.12, lineHeight: 1.4 }, // interpolated placeholder — needs visual tuning
        JOB_VALUE: { sizePx: 16, weight: 400, tracking: 0, lineHeight: 1.4 }, // UNTUNED — never rendered at this tier
        CASE_SUBTITLE: { sizePx: 26, weight: 300, tracking: -0.005, lineHeight: 1.3 }, // UNTUNED — never rendered at this tier
        FOOTER: { sizePx: 13, weight: 400, tracking: 0.04, lineHeight: 1.4 }, // interpolated placeholder — needs visual tuning
        CTA_LINK: { sizePx: 29, weight: 700, tracking: -0.01, lineHeight: 1.0 }, // interpolated placeholder — needs visual tuning
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
        OPENING: { sizeVw: 9.4, weight: 700, tracking: -0.025, lineHeight: 1.05 },
        DISPLAY_HERO: {
            // Was 30. Until now this tier was never read — the component
            // used the desktop-only TYPE export — so 30 has never rendered
            // and is untested. At 390px it puts "interesting" at ~117px,
            // roughly 1.6x wider than the screen. 14 is a reasoned starting
            // point (fills ~85% of the mobile column) — tune live.
            sizeVw: 9.4,
            weight: 700,
            tracking: -0.025,
            lineHeight: 0.95,
        },
        DISPLAY: { sizeVw: 4.5, weight: 300, tracking: -0.01, lineHeight: 1.1 },
        SUBHEAD: { sizeVw: 4.5, weight: 300, tracking: -0.01, lineHeight: 1.2 },
        TAGLINE: { sizePx: 17, weight: 300, tracking: 0.01, lineHeight: 1.45 },
        BODY_WELCOME: {
            sizePx: 16,
            weight: 300,
            tracking: 0.02,
            lineHeight: 1.72,
        },
        BODY: { sizePx: 16, weight: 300, tracking: 0.01, lineHeight: 1.72 },
        CASE_BODY: { sizePx: 16, weight: 300, tracking: 0.01, lineHeight: 1.72 }, // mirrors BODY
        CAPTION: { sizePx: 13, weight: 300, tracking: 0.08, lineHeight: 1.4 },
        NAV_NAME: { sizePx: 30, weight: 700, tracking: 0, lineHeight: 1.0 },
        PULLQUOTE: { sizePx: 28, weight: 700, tracking: 0, lineHeight: 1.2 }, // interpolated placeholder — needs visual tuning
        ABOUT_PULLQUOTE: { sizePx: 28, weight: 700, tracking: -0.025, lineHeight: 1.05 }, // matches the old clamp's 28px floor exactly
        SUBTITLE: { sizePx: 20, weight: 400, tracking: 0, lineHeight: 1.35 }, // interpolated placeholder — needs visual tuning
        JOB_LABEL: { sizePx: 10, weight: 700, tracking: 0.12, lineHeight: 1.4 },
        JOB_VALUE: { sizePx: 15, weight: 400, tracking: 0, lineHeight: 1.4 }, // UNTUNED — never rendered at this tier
        CASE_SUBTITLE: { sizePx: 20, weight: 300, tracking: -0.005, lineHeight: 1.3 }, // UNTUNED — never rendered at this tier
        FOOTER: { sizePx: 10, weight: 400, tracking: 0.04, lineHeight: 1.4 },
        // Was 24 — at weight 700, "See my work" / "Who I am" / "How I think"
        // (WelcomeCTA.tsx) don't fit on one line in the mobile column
        // (~90vw of a ~390px phone, ≈351px) at any gap, including 0.
        // Dropped to 16 as a reasoned starting point with room for a real
        // gap on top — not a measured/confirmed value, tune live. Also
        // drives TalkOptions.tsx's Contact/Resume/Location labels on
        // mobile (shorter words, shouldn't be tight there).
        CTA_LINK: { sizePx: 20, weight: 700, tracking: -0.02, lineHeight: 1.0 },
    },
}

export function getType() {
    return TYPE_TIERS[getBreakpoint()]
}

// Legacy direct export — use getType() for breakpoint-aware access
export const TYPE = TYPE_TIERS.desktop

// ─── SPACING ─────────────────────────────────────────────────────────────────
// Two kinds of value live here, and the difference is the point:
//
//   SPACE.layout.*  Spacing unrelated to type — nav clearances, box heights,
//                   gaps between UI elements. Explicit pixels per breakpoint,
//                   all three tiers on one line so they can be compared and
//                   tuned together.
//
//   SPACE.text.*    Spacing between blocks of copy. An `em` RATIO, not pixels,
//                   because an em is relative to the paragraph's own font size
//                   — and font size is already tiered in TYPE_TIERS. One number
//                   therefore stays correct at every breakpoint, and stays
//                   correct if body copy is ever resized. Three pixel values
//                   would be three numbers to maintain that silently drift the
//                   moment BODY changes.
//
// Resolving a layout value:
//   const space = useSpace()                       // in a component
//   paddingTop: space(SPACE.layout.whoNavClearance)
//   getSpace(SPACE.layout.welcomeCtaGap)           // in imperative/canvas code

export type TieredPx = { desktop: number; tablet: number; mobile: number }

export const SPACE = {
    layout: {
        // Gap between the fixed navbar and the first element on each page.
        // Deliberately different per page — each opening element carries its
        // own optical weight. Three separate values, not drift.
        whoNavClearance:    { desktop:  80, tablet:  70, mobile:  60 },
        thinkNavClearance:  { desktop: 177, tablet: 136, mobile: 104 },
        talkNavClearance:   { desktop:  75, tablet:  45, mobile:  45 },

        // Who I Am — height of the skills-sphere section. Was 40vh, which
        // made the sphere drift vertically on resize (its size comes from
        // container WIDTH, so a vh box grows while the sphere doesn't).
        whoSphereBoxHeight: { desktop: 360, tablet: 260, mobile: 180 },

        // How I Think — gap from the opening animation down to the blurb.
        thinkBlurbGap:      { desktop:  32, tablet:  24, mobile:  16 },

        // Let's Talk — negative on purpose: pulls the blurb up under the
        // ripple network, whose box reserves more height than it paints.
        talkBlurbGap:       { desktop: -100, tablet: -60, mobile: -25 },

        // Let's Talk — gap between Contact / Resume / Location.
        talkLabelGap:       { desktop: 160, tablet:  86, mobile:  58 },

        // Welcome — gap between the three bottom CTA links.
        welcomeCtaGap:      { desktop: 110, tablet:  50, mobile:  24 },

        // Gap between a full-bleed canvas BAND and the detail text under it.
        // Shared by the Work carousel -> case panel and the How I Think grid
        // band -> card panel, because both bands end in the SAME vignette
        // (see BAND_VIGNETTE below — both files import it) and so read as
        // the same edge. That dependency is real: if the two vignettes ever
        // diverge, this shared number stops being defensible. They used to
        // be 60/60/24 and a flat 20 respectively, in two unrelated places,
        // for no reason anyone could name.
        bandDetailGap:      { desktop:  40, tablet:   40, mobile:  16 },

        // Welcome hero — gap between the headline/carousel and the tagline
        // under it. Desktop and tablet are served by WelcomeHeroAnimation,
        // mobile by WelcomeHero2Line; each file used to carry its own copy
        // of this number (5 and 35), so the 7x difference was invisible.
        welcomeHeroTaglineGap: { desktop: 5, tablet: 35, mobile: 18 },
    },

    text: {
        // Shared by every page — one paragraph rhythm site-wide.
        // Consumed by SiteTextBlock via useSpace(); see the note there.
        //
        // WHY THESE ARE TIERED PX AND NOT `em`:
        // These were "2.2em" / "3.5em" / "2.5em" on the theory that em gives
        // breakpoint-awareness for free. It doesn't here. `em` resolves against
        // the element's OWN font-size, and these land on bare layout wrappers —
        // the flex column and the pull-quote wrapper — which never receive a
        // tier size (that lives on the paragraphs and chunk spans inside them).
        // Nothing between <body> and those wrappers sets a font-size either, so
        // all three resolved against the browser default 16px and came out as a
        // FLAT 35 / 56 / 40 px at every breakpoint. Against 24px desktop body
        // copy that read as slightly loose; against 16px mobile body copy it was
        // 2.2x the type size. They are input numbers tuned by eye, so they are
        // tiered px like every other spacing token.
        //
        // interruptGapBefore/After — the gap around ANY non-paragraph element
        // interrupting a column of body copy. Renamed from pullGapBefore/After
        // once it had three consumers and "pull" described only the first:
        //
        //   1. pull quotes                     — SiteTextBlock
        //   2. the Contact / Resume / Location
        //      button row on Let's Talk        — LetsTalkBody, `options` slot
        //   3. above/below the logo grid, and
        //      above the CTA links, on Welcome — page.tsx
        //
        // These are ONE number by intent, not by coincidence: the same visual
        // relationship in three places. Tuning them moves all three, which is
        // the point. If some future case genuinely wants to differ, give that
        // case its own token rather than adding an override here.
        //
        // WHAT THE NUMBER MEANS: the TOTAL distance you would measure on
        // screen. Where the container already applies a flex `paragraphGap`
        // between children — SiteTextBlock does — that shared gap is
        // subtracted back out at the point of use, so one number owns each
        // relationship. They used to stack silently.
        //
        // Where the container does NOT lay out with a flex gap — Welcome's
        // page.tsx stacks spacer divs — the value is used RAW. Subtracting
        // there would make the same token render 30px tighter than it does
        // inside a text block. Check which case you are in before reusing it.
        paragraphGap:  { desktop:  30, tablet:  22, mobile:  20 },
        interruptGapBefore: { desktop:  45, tablet:  33, mobile:  30 },
        interruptGapAfter:  { desktop:  45, tablet:  33, mobile:  30 },
    },
}

export function getSpace(v: TieredPx): number {
    return v[getBreakpoint()]
}

export function useSpace(): (v: TieredPx) => number {
    const bp = useBreakpoint()
    return (v: TieredPx) => v[bp]
}

// ─── SPACING RHYTHM (legacy 8px scale) ───────────────────────────────────────
// Base unit 8px. Predates SPACE above; only one consumer left.

export const SPACE_SCALE = {
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
// NavBar and Footer share the same left inset — both sit to the left of all
// page content at every breakpoint. Page content uses COLUMN_TIERS.marginVw.
export const FRAME_INSET_VW = 2.5

// Confirmed on-device 2026-07-20. Shared by WorkCarousel and ThinkGridCanvas
// so the two pages' mobile band heights always move together.
export const MOBILE_BAND_HEIGHT_SCALE = 1.65

// ─── BAND HEADLINE ───────────────────────────────────────────────────────────
// The display line painted at the bottom of a full-bleed canvas band: the Work
// carousel (WorkCarousel.drawHL) and the How I Think band
// (ThinkGridCanvas.drawBandTitle). Same gesture, same 1440-wide reference
// stage, so they share one set of numbers — they were previously a bare 52 and
// 55 restated as literals in BOTH files, kept in step by a hand-written
// comment.
//
// The two canvases work in different coordinate spaces — Work draws into a
// 1440-wide native canvas that is CSS-scaled to fit, Think's band canvas is
// sized in real screen pixels — so each file applies the scale its own way.
// The rendered result is the same and must stay that way.
//
//   desktop / tablet: sizePx is a REFERENCE size at refW. Rendered size is
//                     sizePx × (viewport / refW), so the headline scales with
//                     the band it sits in.
//   mobile:           the band stops tracking viewport width, so mobileSizePx
//                     is a real rendered pixel size. This used to read
//                     PULLQUOTE.sizePx, which meant tuning pullquotes silently
//                     moved the headline — an unrelated role doing double duty.
export const BAND_HEADLINE = {
    sizePx:       52,
    lineHeightPx: 55,
    mobileSizePx: 28,
    refW:         1440,
}

// ── BAND_VIGNETTE — the bottom scrim on the band image ───────────────────
// Shared by WorkCarousel and ThinkGridCanvas. Keeps display headlines
// readable over any photo. These MUST stay identical in both files:
// SPACE.layout.bandDetailGap is a single shared number justified by both
// bands ending in the SAME optical edge. Change this and both move together.
//
// CONVENTION: heightFrac is an AMOUNT, not a position — "the fade occupies
// the bottom 40% of the band." Both drawVignette() implementations convert
// it to a start point with (1 - heightFrac). Think's used to hardcode the
// converted value (0.6) directly, which meant the two files held the same
// number under opposite meanings. Don't reintroduce that.
export const BAND_VIGNETTE = {
    heightFrac: 0.40, // fraction of band height the fade occupies, bottom-up
    opacity:    0.85, // black at the very bottom edge
}

// ─── SEQUENCE — reveal pacing ────────────────────────────────────────────────
// ORDER IS ABSOLUTE; PACING IS ELASTIC. These numbers are the RESTING pace —
// what a still reader on a page with room to perform gets. Scroll pressure
// compresses the step toward minStepMs so the queue catches up; it never
// reorders and never skips a fade.
//
// All UNTUNED. mountDelay used to be 1500ms, tuned for a scroll-triggered
// arrival where the delay masked the trigger; anchored to the queue instead,
// that much dead air before the FIRST item is too much. The step was a
// hardcoded 400 counted across a whole block.
export const SEQUENCE = {
    firstDelayMs:  400,   // before the first item of an armed page
    stepMs:        200,   // between starts, at rest
    minStepMs:      70,   // between starts, fully compressed — never 0
    fadeMs:       1200,   // each item's own fade-in
    // Pressure = the reader is scrolling toward new content. Deadzone keeps a
    // fidget, or iOS rubber-band bounce, from collapsing the resting pace.
    pressureDeadzonePx: 40,
    pressureWindowMs:  600,
    // Backlog is the OTHER source of pressure, and the one that matters after
    // a jump. Recent scrolling decays in pressureWindowMs, so landing at the
    // bottom of a long page would drop straight back to the resting pace.
    //
    // BACKLOG COUNTS ONLY ITEMS THE READER HAS ALREADY SCROLLED PAST. It first
    // counted every eligible-but-unrevealed item, which at page load is simply
    // "everything on screen" — a normal starting condition, not the queue
    // falling behind. Worse, how many items fit above BF0 depends on the tier:
    // mobile's short lines stacked 5 above it, desktop's wide ones 3, so the
    // same count meant different things at different widths and the sphere's
    // hold was released at load on mobile and tablet but not desktop.
    //
    // The two pressure sources are now complementary rather than overlapping:
    //   scroll  — the reader is actively moving
    //   backlog — content went by without being revealed
    // Content that has left the top of the screen unrevealed is already wrong,
    // so the threshold is small.
    backlogPressure: 2,   // eligible-but-unrevealed items before compressing
}

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
        TF0: 4,
        TF100: 16,
        BF100: 84,
        BF0: 94,
        gradientHeight: 100,
        gradientOpacity: 0.95,
        revealMs: 800,
        staggerMs: 500,
        idleMs: 4000,
    },

    mobile: {
        // TODO: tune for mobile — copied from desktop as placeholder
        TF0: 3,
        TF100: 13,
        BF100: 84,
        BF0: 93,
        gradientHeight: 60,
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
import { useEffect, useLayoutEffect, useState } from "react"

// useEffect does not exist on the server, and useLayoutEffect logs a warning
// there. Every consumer of this is a "use client" component, so the effect only
// ever RUNS in the browser — this alias just keeps the server render quiet.
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

export function useBreakpoint(): "mobile" | "tablet" | "desktop" {
    // Starts at "desktop" because the SERVER has no viewport and the hydration
    // render must match what it produced. That initial value is wrong on a
    // phone for exactly one render, and the correction below is what makes it
    // invisible.
    const [breakpoint, setBreakpoint] = useState<"mobile" | "tablet" | "desktop">("desktop")

    // LAYOUT effect, not a plain effect, and the difference is visible.
    //
    // useEffect runs AFTER the browser paints. On a phone that meant a real
    // frame drawn at the DESKTOP tier — desktop font sizes, desktop column
    // width — followed by a relayout to mobile once this corrected. Everything
    // downstream (useType, useColumn, useSpace, bodyMaxWidth) shifted with it.
    //
    // That shift is what produced the mobile-Safari ghosting: the case panels
    // give every block a permanent opacity transition, so every block is its
    // own composited layer, and iOS left the pre-shift tiles painted underneath
    // the corrected ones. Both stacks visible, offset by the rewrap.
    //
    // useLayoutEffect commits before the browser paints, so the desktop frame
    // never reaches the screen and there is no shift to leave ghosts of.
    useIsomorphicLayoutEffect(() => {
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

// Returns a vw string for body-copy max-width, reading bodyColPct from the
// current column tier. Pass overridePct to deviate for a specific context.
export function bodyMaxWidth(
    col: ReturnType<typeof getColumn>,
    overridePct?: number
): string {
    return `${(col.vw * (overridePct ?? col.bodyColPct)) / 100}vw`
}
export function useType() {
    return TYPE_TIERS[useBreakpoint()]
}
export function useVisibility() {
    return VISIBILITY_TIERS[useBreakpoint()]
}

// The grid's WIDTH is deliberately not here: it follows the text column via
// bodyMaxWidth(), the same measure the body copy uses, at every breakpoint.
// One mechanism for one visual unit — so retuning the reading measure moves
// the logos with it rather than leaving them behind.
//
// gapPx and logoPct ARE here: both are tuned by eye and nothing derives them.
//   gapPx   — space between cells, px.
//   logoPct — how much of its cell each logo fills, %. Independent of the
//             grid's size, so it survives width changes unchanged; this is
//             the knob for "the logos read too heavy", not the width.
// Both start at the flat values they had as component prop defaults, so
// adopting them changed nothing on screen — the width did that on its own.
export const LOGO_GRID_TIERS = {
    desktop: { cols: 5, rows: 4, gapPx: 14, logoPct: 72 },
    tablet:  { cols: 4, rows: 5, gapPx: 10, logoPct: 72 },
    mobile:  { cols: 3, rows: 6, gapPx: 6, logoPct: 70 },
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
//"Creative concepting, direction and execution – often before lunch.",


export const FOOTER = {
    // Measured footer height in px — update if the footer changes.
    // SiteScrollConfig reads this: the bottom gradient must be FULLY opaque
    // by the top of the footer, because the footer type is small and nothing
    // may pass behind it. The footer therefore paints no background of its
    // own — it used to carry a second rgba(13,13,13,0.9) scrim, so there were
    // two overlapping bottom gradients at different opacities, neither aware
    // of the other.
    height: 52,

    blurbs: {
        welcome: [
            "25 years of learning to make things look the way I meant.",
            "Concepting, direction and execution\u00A0– often all before lunch.",
            "Making maps to places I’ve never been\u00A0– one step at a time.",
        ],
        work: [
            "The work was real and so were the deadlines.",
            "Work will teach you as much about yourself as anything else.",
            "While not all things to all people, I am many things to some.",
        ],
        about: [
            "While not all things to all people, I am many things to some.",
            "Still learning to see and appreciate things in new ways.",
            "Making maps to places I’ve never been\u00A0– one step at a time.",
        ],
        thinking: [
            "Unexpected connections create bridges to great ideas.",
            "Still learning to see and appreciate things in new ways.",
            "Making maps to places I’ve never been\u00A0– one step at a time.",
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

// Is this path one of the five pages? Kept directly beside getActivePage()
// because the two must agree and they answer different questions.
// getActivePage() falls back to "welcome" for an unknown path — correct for
// the nav, which must highlight something — but that fallback would also hand
// the 404 route the Welcome page colour, which it has no claim to. Anything
// that needs to know "is this a real page" must ask HERE, not infer it from
// getActivePage() returning the default.
export function isKnownPage(path: string): boolean {
    if (path === "/") return true
    return PAGES.some((pg) => pg.url !== "/" && path.startsWith(pg.url))
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
