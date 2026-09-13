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
const HERO_IDLE_MS = 3000
const HERO_FADE_MS = 700
const HERO_COLLAPSE_MS = 600
// 35vh was composed for a page whose only content was the hero. Once the
// hero is gone it is pure dead space, so it collapses with it.
const TOP_SPACER = "35vh"
const TOP_SPACER_AFTER = "12vh"

export default function Page() {
    const col = useColumn()
    const type = useType()
    const space = useSpace()
    const isMobile = useBreakpoint() === "mobile"

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

    // Hold, then hand over. Listeners are document-level on purpose: a
    // scroll has no location, so "near the hero" cannot be scoped for the
    // one trigger most likely to fire. Nothing is armed until the hero
    // reports it has finished, so an early scroll cannot cut it short.
    useEffect(() => {
        if (!heroDone || dismissed) return
        const dismiss = () => setDismissed(true)
        const timer = setTimeout(dismiss, HERO_IDLE_MS)
        const events = ["pointerdown", "touchstart", "wheel", "scroll", "keydown"]
        events.forEach((e) =>
            window.addEventListener(e, dismiss, { passive: true, once: true })
        )
        return () => {
            clearTimeout(timer)
            events.forEach((e) => window.removeEventListener(e, dismiss))
        }
    }, [heroDone, dismissed])

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
                    height: dismissed ? TOP_SPACER_AFTER : TOP_SPACER,
                    transition: `height ${HERO_COLLAPSE_MS}ms ease ${HERO_FADE_MS}ms`,
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
                <ScrollFade enabled={interestingComplete} fadeOutStart={80} fadeOutEnd={-20}>
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
