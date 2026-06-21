"use client"

import HeroAnimation from "./components/HeroAnimation"

export default function Page() {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Push hero to slightly above center */}
      <div style={{ height: "35vh" }} />
      <div style={{
        width: "76%",
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        <HeroAnimation />
      </div>
    </div>
  )
}