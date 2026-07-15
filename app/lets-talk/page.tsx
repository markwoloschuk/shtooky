"use client"

// lets-talk/page.tsx
// app/lets-talk/
// Let's Talk page — full layout
// v01 — 2026-06-22

import { useEffect } from "react"
import { unlock, reset } from "../components/SequenceController"
import RippleNetwork from "../components/TalkRippleNetwork"
import TextBlock from "../components/TextBlock"
import { useColumn } from "../components/Tokens"

export default function LetsTalk() {
    const col = useColumn()
    reset()
    unlock(1)

    useEffect(() => {
        window.scrollTo(0, 0)
        setTimeout(() => unlock(2), 3000)
    }, [])

    return (
        <div
            style={{
                paddingTop: "11vh",
                paddingBottom: "18vh",
            }}
        >
            <div
                style={{
                    width: `${col.vw}vw`,
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                <RippleNetwork />
                <div style={{ marginTop: "-80px" }}>
                    <TextBlock page="contact" ids="1-5" />
                </div>
            </div>
        </div>
    )
}