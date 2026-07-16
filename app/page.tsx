"use client"

import { useState, useEffect } from "react"
import HeroAnimation from "./components/WelcomeHero2Line"
import ScrollFade from "./components/WelcomeScrollFade"
import EverythingIsInteresting from "./components/WelcomeEverythingIsInteresting"
import ClientLogoGrid from "./components/WelcomeClientLogoGrid"
import WelcomeCTA from "./components/WelcomeCTA"
import { useColumn, useType } from "./components/Tokens"

export default function Page() {
    const col = useColumn()
    const type = useType()
    const [interestingComplete, setInterestingComplete] = useState(false)
    const [gridComplete, setGridComplete] = useState(false)

    const bodyStyle = {
        fontFamily: type.display,
        fontSize: `${type.BODY_WELCOME.sizePx}px`,
        fontWeight: type.BODY_WELCOME.weight,
        letterSpacing: `${type.BODY_WELCOME.tracking}em`,
        lineHeight: type.BODY_WELCOME.lineHeight,
        color: "#ffffff",
        maxWidth: "54%",
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
                <div style={{ height: "5vh" }} />
                <ClientLogoGrid triggerOnScroll={true} onComplete={() => setTimeout(() => setGridComplete(true), 300)} />
                <div style={{ height: "6vh" }} />
               <ScrollFade enabled={gridComplete}>
                    <p style={{ ...bodyStyle, maxWidth: "70%" }}>
                        I&rsquo;ve worked with some great people. Why not you?
                    </p>
                </ScrollFade>
                <div style={{ height: "6vh" }} />
                <WelcomeCTA enabled={gridComplete} />
                <div style={{ height: "20vh" }} />
            </div>
        </div>
    )
}
