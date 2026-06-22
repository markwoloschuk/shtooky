"use client"

// who-i-am/page.tsx
// app/who-i-am/
// Who I Am page — full layout
// v01 — 2026-06-22

import { useEffect } from "react"
import { unlock } from "../components/SequenceController"
import SkillsSphere from "../components/SkillsSphere"
import VennDiagram from "../components/VennDiagram"
import TextBlock from "../components/TextBlock"

export default function WhoIAm() {
    // Unlock seq 1 on mount — first elements always visible on load
useEffect(() => {
        unlock(1)
    }, [])

    return (
        <div
            style={{
                paddingTop: "10vh",
                paddingBottom: "15vh",
            }}
        >
            {/* ── Sphere section ── */}
            <div
                style={{
                    width: "100%",
                    height: "40vh",
                    display: "flex",
                }}
            >
                <div style={{ width: "3%" }} />
                <div style={{ width: "76%", height: "100%" }}>
                    <SkillsSphere />
                </div>
                <div style={{ width: "21%" }} />
            </div>

            {/* ── 2vh spacer ── */}
            <div style={{ height: "2vh" }} />

            {/* ── 76% content column ── */}
            <div
                style={{
                    width: "76%",
                    marginLeft: "auto",
                    marginRight: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                }}
            >
                {/* Text blocks 1–7 */}
                <TextBlock page="about" ids="1-7" />

                {/* Venn Diagram */}
                <div style={{ marginTop: "4vh", marginBottom: "4vh" }}>
                    <VennDiagram scale={1} xOffset={0} triggerOnScroll={true} />
                </div>

                {/* Text blocks 8–26 */}
                <TextBlock page="about" ids="8-26" />
            </div>
        </div>
    )
}