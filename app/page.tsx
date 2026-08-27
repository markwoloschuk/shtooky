"use client"

import { useState, useEffect } from "react"
import HeroAnimation from "./components/WelcomeHeroAnimationResponsive"
import ScrollFade from "./components/WelcomeScrollFade"
import EverythingIsInteresting from "./components/WelcomeEverythingIsInteresting"
import ClientLogoGrid from "./components/WelcomeClientLogoGrid"
import WelcomeCTA from "./components/WelcomeCTA"
import { useColumn, useType, bodyMaxWidth, useBreakpoint, SPACE, useSpace } from "./components/SiteTokens"

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

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <div style={{ height: "35vh" }} />
            <div style={{ width: `${col.vw}vw`, marginLeft: "auto", marginRight: "auto" }}>
                <HeroAnimation />
                <div style={{ height: "8vh" }} />
                <EverythingIsInteresting onComplete={() => setInterestingComplete(true)} />
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
