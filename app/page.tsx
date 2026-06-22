"use client"

import HeroAnimation from "./components/HeroAnimation"
import EverythingIsInteresting from "./components/EverythingIsInteresting"
import ClientLogoGrid from "./components/ClientLogoGrid"
import { TYPE } from "./components/Tokens"

const BODY_STYLE = {
    fontFamily: TYPE.display,
    fontSize: `${TYPE.BODY_WELCOME.sizePx}px`,
    fontWeight: TYPE.BODY_WELCOME.weight,
    letterSpacing: `${TYPE.BODY_WELCOME.tracking}em`,
    lineHeight: TYPE.BODY_WELCOME.lineHeight,
    color: "#ffffff",
        maxWidth: "54%",
}

export default function Page() {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ height: "35vh" }} />
      <div style={{ width: "76%", marginLeft: "auto", marginRight: "auto" }}>
        <HeroAnimation />
        <div style={{ height: "10vh" }} />
        <EverythingIsInteresting />
        <div style={{ height: "3vh" }} />
        <p style={BODY_STYLE}>
          This simple truth is in the heart of everything I do. I like to ask questions and think before I get my hands dirty. I want to understand all the whos and whats before I get to the hows.
        </p>
        <div style={{ height: "2vh" }} />
        <p style={BODY_STYLE}>
          Doing that means speaking fluent executive, marketer and engineer – I aim to be the gear that connects them all together in turning out business goals.
        </p>
        <div style={{ height: "5vh" }} />
        <ClientLogoGrid triggerOnScroll={true} />
      </div>
    </div>
  )
}