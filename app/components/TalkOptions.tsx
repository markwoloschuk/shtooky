"use client"

// TYPE ROLES USED IN THIS FILE:
//   option labels (Contact / Resume / Location) → CONFIG.LABEL_FONT_SIZE (30px) desktop/tablet
//                                               → TYPE_TIERS.CTA_LINK (sizePx) mobile — read via useType()

// TalkOptions.tsx
// app/components/
// Three single-line toggles — Contact / Location / Resume — sitting
// between the RippleNetwork intro and the body paragraphs on the Let's
// Talk page. One open at a time (accordion), content grows/shrinks in
// normal document flow directly below its own label — no portal, no
// document-position tracking, unlike the Think card mechanic. Closer in
// spirit to ThinkCasePanel's block fade-in than anything canvas-based.

import { useState, useRef, useEffect } from "react"
import { COLORS, TYPE, useBreakpoint, useType } from "./SiteTokens"
import { useSequence, unlock } from "./SequenceController"

const ACCENT = COLORS.contact

// ── Tunable constants ───────────────────────────────────────────────────
const CONFIG = {
    LABEL_FONT_SIZE: 30,
    LABEL_GAP: 100,          // gap between labels — horizontal (desktop)
    LABEL_GAP_VERTICAL: 24, // gap between labels — vertical stack (tablet/mobile)
    ROW_GAP_TOP: 16,        // space between a label and its open content
    ROW_GAP_BOTTOM: 40,     // space after open content, before next label
    TRANSITION_MS: 500,

    // Reveal — this block's own fade-in once seq 2 unlocks (after id1's
    // fade finishes). REVEAL_DELAY_MS is a deliberate beat so it doesn't
    // land the instant id1 finishes; REVEAL_FADE_MS is the actual fade
    // duration, and doubles as the real number the next unlock (seq 3,
    // the remaining paragraphs) chains off of — not a separate guess.
    REVEAL_DELAY_MS: 200,
    REVEAL_FADE_MS: 1000,
}

const RESUME_PATH = "/Mark_Woloschuk_Resume.pdf"
const MAP_PLACEHOLDER = "/images/talk/map_placeholder.jpg"

type PanelKey = "contact" | "location" | "resume"

// ── Collapsible wrapper — height-animates via measured scrollHeight,
// same "measure then transition" approach as CSS-grid-free height
// animation requires (grid-template-rows: 0fr/1fr would be simpler but
// this keeps timing explicit and consistent with the rest of the site's
// JS-driven transitions rather than mixing in a CSS-only technique). ──
function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
    const innerRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        const el = innerRef.current
        if (!el) return
        if (open) {
            setHeight(el.scrollHeight)
        } else {
            setHeight(0)
        }
    }, [open, children])

    return (
        <div
            style={{
                height,
                overflow: "hidden",
                transition: `height ${CONFIG.TRANSITION_MS}ms ease`,
            }}
        >
            <div ref={innerRef}>
                <div
                    style={{
                        opacity: open ? 1 : 0,
                        transition: `opacity ${CONFIG.TRANSITION_MS}ms ease`,
                        paddingTop: CONFIG.ROW_GAP_TOP,
                        paddingBottom: CONFIG.ROW_GAP_BOTTOM,
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}

// ── Label — the always-visible single-line toggle. Purple always (not
// just when active) per Mark's request — opacity is what now signals
// which one's open, instead of a color swap. ────────────────────────────
function OptionLabel({
    label,
    active,
    onClick,
}: {
    label: string
    active: boolean
    onClick: () => void
}) {
    const bp = useBreakpoint()
    const type = useType()
    const fontSize = bp === "mobile" ? type.CTA_LINK.sizePx : CONFIG.LABEL_FONT_SIZE
    return (
        <button
            onClick={onClick}
            style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: TYPE.display,
                fontSize,
                fontWeight: 700,
                color: ACCENT,
                opacity: active ? 1 : 0.65,
                transition: `opacity ${CONFIG.TRANSITION_MS}ms ease`,
            }}
        >
            {label}
        </button>
    )
}

// ── Contact form ─────────────────────────────────────────────────────────
function ContactForm() {
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })

    function update(field: keyof typeof form) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((f) => ({ ...f, [field]: e.target.value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setStatus("sending")
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error("Request failed")
            setStatus("sent")
        } catch {
            setStatus("error")
        }
    }

    const fieldStyle: React.CSSProperties = {
        width: "100%",
        background: "transparent",
        border: "none",
        borderBottom: `1px solid rgba(255,255,255,0.25)`,
        color: COLORS.white,
        fontFamily: TYPE.display,
        fontSize: 16,
        padding: "10px 0",
        outline: "none",
    }

    if (status === "sent") {
        return (
            <p style={{ fontFamily: TYPE.display, color: COLORS.white, fontSize: 17, maxWidth: 500 }}>
                Thanks — message sent. I'll get back to you soon.
            </p>
        )
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 500 }}>
            <input required placeholder="Name" value={form.name} onChange={update("name")} style={fieldStyle} />
            <input required type="email" placeholder="Email" value={form.email} onChange={update("email")} style={fieldStyle} />
            <input required placeholder="Subject" value={form.subject} onChange={update("subject")} style={fieldStyle} />
            <textarea required placeholder="Message" value={form.message} onChange={update("message")} rows={5} style={{ ...fieldStyle, resize: "vertical" as const }} />
            <button
                type="submit"
                disabled={status === "sending"}
                style={{
                    alignSelf: "flex-start",
                    background: ACCENT,
                    border: "none",
                    color: COLORS.white,
                    fontFamily: TYPE.display,
                    fontWeight: 700,
                    fontSize: 15,
                    padding: "12px 28px",
                    cursor: status === "sending" ? "default" : "pointer",
                    opacity: status === "sending" ? 0.6 : 1,
                }}
            >
                {status === "sending" ? "Sending…" : "Send"}
            </button>
            {status === "error" && (
                <p style={{ fontFamily: TYPE.display, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                    Something went wrong — mind trying again?
                </p>
            )}
        </form>
    )
}

// ── Location — placeholder image for now; swap for the zoom animation
// once that prototype's finished, same slot. ──────────────────────────
function LocationPanel() {
    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative", paddingBottom: "56.25%", background: COLORS.dark, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={MAP_PLACEHOLDER}
                    alt="San Francisco Bay Area"
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
            </div>
        </div>
    )
}

// ── Resume — viewable inline (native browser PDF render) + downloadable ─
function ResumePanel() {
    return (
        <div style={{ width: "100%" }}>
            <div style={{ marginBottom: 16 }}>
                <a
                    href={RESUME_PATH}
                    download
                    style={{
                        fontFamily: TYPE.display,
                        fontWeight: 700,
                        fontSize: 15,
                        color: ACCENT,
                        textDecoration: "none",
                    }}
                >
                    Download PDF ↓
                </a>
            </div>
            <div style={{ width: "100%", height: "70vh", background: COLORS.dark }}>
                <iframe
                    src={RESUME_PATH}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    title="Mark Woloschuk — Resume"
                />
            </div>
        </div>
    )
}

// ── Top-level accordion ──────────────────────────────────────────────────
export default function TalkOptions() {
    const [open, setOpen] = useState<PanelKey | null>(null)
    const bp = useBreakpoint()
    const revealed = useSequence(2)
    const [visible, setVisible] = useState(false)
    const firedNextRef = useRef(false)

    useEffect(() => {
        if (!revealed) return
        const showTimer = setTimeout(() => setVisible(true), CONFIG.REVEAL_DELAY_MS)
        // Chains off the real fade duration below (REVEAL_FADE_MS), not a
        // separately guessed number — same value drives both the CSS
        // transition and this unlock.
        const nextTimer = setTimeout(() => {
            if (firedNextRef.current) return
            firedNextRef.current = true
            unlock(3)
        }, CONFIG.REVEAL_DELAY_MS + CONFIG.REVEAL_FADE_MS)
        return () => { clearTimeout(showTimer); clearTimeout(nextTimer) }
    }, [revealed])

    function toggle(key: PanelKey) {
        setOpen((prev) => (prev === key ? null : key))
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                opacity: visible ? 1 : 0,
                transition: `opacity ${CONFIG.REVEAL_FADE_MS}ms ease`,
                pointerEvents: visible ? "auto" : "none",
            }}
        >
            <div style={{
                    display: "flex",
                    flexDirection: bp === "desktop" || bp === "mobile" ? "row" : "column",
                    justifyContent: bp === "mobile" ? "space-between" : undefined,
                    gap: bp === "desktop" ? CONFIG.LABEL_GAP : bp === "mobile" ? 0 : CONFIG.LABEL_GAP_VERTICAL,
                }}>
                <OptionLabel label="Contact" active={open === "contact"} onClick={() => toggle("contact")} />
                <OptionLabel label="Resume" active={open === "resume"} onClick={() => toggle("resume")} />
                <OptionLabel label="Location" active={open === "location"} onClick={() => toggle("location")} />
            </div>

            <Collapsible open={open !== null}>
                {open === "contact" && <ContactForm />}
                {open === "resume" && <ResumePanel />}
                {open === "location" && <LocationPanel />}
            </Collapsible>
        </div>
    )
}