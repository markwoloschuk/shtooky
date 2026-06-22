"use client"

import HeroAnimation from "./components/HeroAnimation"
import EverythingIsInteresting from "./components/EverythingIsInteresting"

export default function Page() {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ height: "35vh" }} />
      <div style={{
        width: "76%",
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        <HeroAnimation />
        <div style={{ height: "10vh" }} />
        <EverythingIsInteresting />
      </div>
    </div>
  )
}