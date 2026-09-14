"use client"

import { useState, useEffect } from "react"
import HeroAnimation from "./components/WelcomeHeroAnimationResponsive"
import ScrollFade from "./components/WelcomeScrollFade"
import EverythingIsInteresting from "./components/WelcomeEverythingIsInteresting"
import ClientLogoGrid from "./components/WelcomeClientLogoGrid"
import WelcomeCTA from "./components/WelcomeCTA"
import { useColumn, useType, bodyMaxWidth, useBreakpoint, SPACE, useSpace, contentWidth } from "./components/SiteTokens"

// ─── HERO HANDOFF ──────────────────────────────────────────────
// The hero plays out fully, holds, then hands the page over. Two ways out
// of the hold, whichever lands first:
//   1. HERO_IDLE_MS with no interaction
//   2. any pointer / touch / wheel / scroll / key
// Then: fade the hero, collapse the space it held together with the
// oversized top spacer, then start the "interesting" sequence.
// The page does not scroll during the handoff. Five phases:
//   1  0 - ~3.55s        hero plays        LOCKED, gestures swallowed
//   2  + HERO_HOLD_MS    hero holds        LOCKED, gestures swallowed
//   3  armed             hero waits        LOCKED, gestures DISMISS
//   4  dismissed         fade + collapse   LOCKED
//   5  contentStart      content in        unlocked
//
// What changes when the hold expires is not the lock - it is what a
// gesture MEANS. Unlocking at phase 3 and re-locking at phase 4 loses a
// race: the dismiss listener fires on the wheel event, but the re-lock
// only lands a tick later, so the page drifts 50-100px before the
// collapse - exactly the unpredictable geometry the lock exists to stop.
const HERO_HOLD_MS = 3000
// If nobody moves at all, advance anyway. This is the whole reason the
// original timeout existed: a visitor who never scrolls must still reach
// the rest of the site. Total to auto-advance: 3550 + 3000 + 5500 ~= 12s.
const HERO_BACKSTOP_MS = 5500
const HERO_FADE_MS = 700
const HERO_COLLAPSE_MS = 600
// Reserved empty space above the hero while it plays. Was a raw "35vh" —
// converted 2026-09-14 to SPACE.layout.welcomeHeroTopSpacer (see SiteTokens.tsx
// for why: iOS's toolbar-collapsed-vs-visible viewport mismatch was pushing
// the hero lower in the frame than intended, worst right on page load).
// What TOP_SPACER becomes once the hero is gone - i.e. how far down the page the
// "interesting" block ends up sitting. Absolute px rather than vh, per the
// move away from viewport units for vertical position. These are the values
// a 12vh would have produced at each tier's referenceH, EXCEPT desktop -
// the one tier Mark asked to push lower.
//   desktop  12vh of 900  = 108  ->  165   <- the only visual change
//   tablet   12vh of 1024 = 123  ->  123
//   mobile   12vh of 844  = 101  ->  101
const TOP_SPACER_AFTER_PX = {
    desktop: 165,
    tablet: 123,
    mobile: 101,
}
// The second body paragraph waits this long after the first before it starts
// fading in. ScrollFade’s fadeDuration is 1000ms, so at 600 they overlap
// rather than queue - succession without a dead beat in the middle.
const PARA_STAGGER_MS = 600

export default function Page() {
    const col = useColumn()
    const type = useType()
    const space = useSpace()
    const breakpoint = useBreakpoint()
    const isMobile = breakpoint === "mobile"

    // The gaps around the logo grid, and above the CTA links, now read the
    // same tokens as the pull-quote gaps and the Let's Talk button row —
    // "a non-paragraph element interrupting a column of body copy."
    //
    // Used RAW here, unlike on Let's Talk. There the tokens mean the TOTAL
    // measured distance and the flex gap is subtracted back out, because
    // SiteTextBlock lays its children out in a flex column with
    // `gap: paragraphGap`. This page stacks blocks with explicit spacer divs
    // and no flex gap, so there is nothing to subtract — subtracting anyway
    // would silently make every gap here 30px tighter than the same token
    // produces on Let's Talk.
    //
    // Replaces `5vh` above the grid and `6vh` below it and above the CTA.
    // Those were viewport-relative, so they grew and shrank with window
    // HEIGHT while the type beside them did not.
    const interruptGapBefore = space(SPACE.text.interruptGapBefore)
    const interruptGapAfter = space(SPACE.text.interruptGapAfter)
    const [interestingComplete, setInterestingComplete] = useState(false)
    const [gridComplete, setGridComplete] = useState(false)
    const [heroDone, setHeroDone] = useState(false)
    const [armed, setArmed] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [contentStart, setContentStart] = useState(false)

    const bodyStyle = {
        fontFamily: type.display,
        fontSize: `${type.BODY_WELCOME.sizePx}px`,
        fontWeight: type.BODY_WELCOME.weight,
        letterSpacing: `${type.BODY_WELCOME.tracking}em`,
        lineHeight: type.BODY_WELCOME.lineHeight,
        color: "#ffffff",
        maxWidth: bodyMaxWidth(col),
    }

useEffect(() => {
    window.scrollTo(0, 0)
}, [])

    // ── Phase 2 -> 3. Hero has finished; hold, then arm. ──────────────
    useEffect(() => {
        if (!heroDone) return
        const t = setTimeout(() => setArmed(true), HERO_HOLD_MS)
        return () => clearTimeout(t)
    }, [heroDone])

    // ── Phase 3. Armed: a gesture now means "go". ─────────────────────
    // Document-level on purpose - a wheel or a key has no location, so
    // "near the hero" cannot be scoped for the triggers most likely to
    // fire. "scroll" is deliberately NOT in this list: the page is locked,
    // so no scroll event can ever be produced. The gestures are what we
    // read instead. These are passive; the lock below does the preventing.
    useEffect(() => {
        if (!armed || dismissed) return
        const dismiss = () => setDismissed(true)
        const timer = setTimeout(dismiss, HERO_BACKSTOP_MS)
        const events = ["pointerdown", "touchmove", "wheel", "keydown"]
        events.forEach((e) =>
            window.addEventListener(e, dismiss, { passive: true, once: true })
        )
        return () => {
            clearTimeout(timer)
            events.forEach((e) => window.removeEventListener(e, dismiss))
        }
    }, [armed, dismissed])

    // ── The lock. Held from mount until the content has settled. ──────
    // preventDefault rather than overflow:hidden on the body. Overflow-
    // hidden removes the scrollbar, which shifts the whole layout ~15px
    // sideways on any platform without overlay scrollbars - invisible on a
    // Mac, ugly on Windows. This is layout-neutral, and it leaves the
    // events themselves intact so phase 3 can still read them.
    useEffect(() => {
        if (contentStart) return
        const stop = (e: Event) => e.preventDefault()
        const KEYS = new Set([
            "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ",
        ])
        const stopKey = (e: KeyboardEvent) => {
            if (KEYS.has(e.key)) e.preventDefault()
        }
        window.addEventListener("wheel", stop, { passive: false })
        window.addEventListener("touchmove", stop, { passive: false })
        window.addEventListener("keydown", stopKey, { passive: false })
        return () => {
            window.removeEventListener("wheel", stop)
            window.removeEventListener("touchmove", stop)
            window.removeEventListener("keydown", stopKey)
        }
    }, [contentStart])

    // Fade, then collapse, then start the sequence. One owner of this
    // timing — EverythingIsInteresting's own autoDelay is now 0.
    useEffect(() => {
        if (!dismissed) return
        const t = setTimeout(
            () => setContentStart(true),
            HERO_FADE_MS + HERO_COLLAPSE_MS
        )
        return () => clearTimeout(t)
    }, [dismissed])

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <div
                style={{
                    height: dismissed
                        ? `${TOP_SPACER_AFTER_PX[breakpoint]}px`
                        : `${space(SPACE.layout.welcomeHeroTopSpacer)}px`,
                    // Only animate the deliberate dismiss-collapse. Before
                    // dismissal this height is breakpoint-derived (mobile vs
                    // desktop), and useBreakpoint() always renders "desktop"
                    // first (the SSR-safe default) before correcting to the
                    // real tier a moment after mount. An unconditional
                    // transition here animates THAT correction too - a
                    // visible "woosh" from the wrong tier's spacing to the
                    // right one, on every load, worst on mobile where the
                    // two values differ most.
                    transition: dismissed
                        ? `height ${HERO_COLLAPSE_MS}ms ease ${HERO_FADE_MS}ms`
                        : "none",
                }}
            />
            <div style={{ width: contentWidth(col), marginLeft: "auto", marginRight: "auto" }}>
                {/* Collapsing wrapper. grid-template-rows 1fr -> 0fr animates an
                    auto-height collapse with no measurement; the alternative is
                    reading offsetHeight and writing it back, which would freeze a
                    height the hero itself owns via its own setHeight(). The
                    collapse is delayed by HERO_FADE_MS so the two motions read as
                    one beat: fade out, then close the gap. */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateRows: dismissed ? "0fr" : "1fr",
                        opacity: dismissed ? 0 : 1,
                        pointerEvents: dismissed ? "none" : "auto",
                        transition:
                            `opacity ${HERO_FADE_MS}ms linear, ` +
                            `grid-template-rows ${HERO_COLLAPSE_MS}ms ease ${HERO_FADE_MS}ms`,
                    }}
                >
                    <div style={{ overflow: "hidden" }}>
                        <HeroAnimation
                            dismissed={dismissed}
                            onComplete={() => setHeroDone(true)}
                        />
                        <div style={{ height: "8vh" }} />
                    </div>
                </div>
                <EverythingIsInteresting
                    start={contentStart}
                    onComplete={() => setInterestingComplete(true)}
                />
                <div style={{ height: "4vh" }} />
                <ScrollFade enabled={interestingComplete} fadeOutStart={80} fadeOutEnd={-20}>
                    <p style={bodyStyle}>
                        This simple truth is in the heart of everything I do. I like to ask questions and think before I get my hands dirty. I want to understand all the whos and whats before I get to the hows.
                    </p>
                </ScrollFade>
                <div style={{ height: "3vh" }} />
                <ScrollFade
                    enabled={interestingComplete}
                    mountDelay={PARA_STAGGER_MS}
                    fadeOutStart={80}
                    fadeOutEnd={-20}
                >
                    <p style={bodyStyle}>
                        Doing that means speaking fluent executive, marketer and engineer – I aim to be the gear that connects them all together in turning out business goals.
                    </p>
                </ScrollFade>
                <div style={{ height: interruptGapBefore }} />
                <ClientLogoGrid triggerOnScroll={true} onComplete={() => setTimeout(() => setGridComplete(true), 300)} />
                <div style={{ height: interruptGapAfter }} />
               <ScrollFade enabled={gridComplete}>
                    <p style={bodyStyle}>
                        {/* Mobile breaks this at the period so it sits on two lines.
                            useBreakpoint starts at "desktop" and corrects in an
                            effect, so mobile renders unsplit for one frame — invisible
                            here, because ScrollFade keeps this hidden until the grid
                            finishes. */}
                        I&rsquo;ve worked with some great people.{isMobile ? <br /> : " "}Why not you?
                    </p>
                </ScrollFade>
                <div style={{ height: interruptGapBefore }} />
                <WelcomeCTA enabled={gridComplete} />
                <div style={{ height: "20vh" }} />
            </div>
        </div>
    )
}
