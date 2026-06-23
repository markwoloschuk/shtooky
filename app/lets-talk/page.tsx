"use client"

// lets-talk/page.tsx
// app/lets-talk/
// Let's Talk page — full layout
// v01 — 2026-06-22

import { useEffect } from "react"
import { unlock, reset } from "../components/SequenceController"
import TextBlock from "../components/TextBlock"

export default function LetsTalk() {
    // Unlock seq 1 on mount — all contact content is seq 1
 useEffect(() => {
            window.scrollTo(0, 0)
        reset()
        unlock(1)
    }, [])

    return (
        <div
            style={{
                paddingTop: "10vh",
                paddingBottom: "15vh",
            }}
        >
            <div
                style={{
                    width: "76%",
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                <TextBlock page="contact" ids="1-5" />
            </div>
        </div>
    )
}