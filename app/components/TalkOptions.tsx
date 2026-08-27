"use client"

// TYPE ROLES USED IN THIS FILE:
//   option labels (Contact / Resume / Location) → TYPE_TIERS.CTA_LINK
//     (sizePx, weight, tracking, lineHeight — read via useType()) at every
//     breakpoint, matching WelcomeCTA.tsx's "See the work" / "Who I am" /
//     "How I think" links. Previously desktop/tablet used a local flat
//     CONFIG.LABEL_FONT_SIZE (30px, fontWeight hardcoded 700) and only
//     mobile borrowed the token's sizePx — everything else (weight,
//     tracking) was ignored even there. Now fully token-driven, all tiers.

// TalkOptions.tsx
// app/components/
// Three single-line toggles — Contact / Location / Resume — sitting
// between the RippleNetwork intro and the body paragraphs on the Let's
// Talk page. One open at a time (accordion), content grows/shrinks in
// normal document flow directly below its own label — no portal, no
// document-position tracking, unlike the Think card mechanic. Closer in
// spirit to ThinkCasePanel's block fade-in than anything canvas-based.

import { useState, useRef, useEffect, useCallback } from "react"
import { COLORS, TYPE, useType, SPACE, useSpace, useColumn, bodyMaxWidth } from "./SiteTokens"
import { useSequence, unlock } from "./SiteSequenceController"

const ACCENT = COLORS.contact

// ── Tunable constants ───────────────────────────────────────────────────
const CONFIG = {
    // Gap between the three labels now lives in SPACE.layout.talkLabelGap
    // (SiteTokens.tsx). Tablet/mobile used to be "space-between" (auto-fills
    // the row width, ignores any gap value) rather than a real tunable.
    // Tablet/mobile are
    // reasoned starting guesses (scaled down from desktop for the narrower
    // column), not yet tuned live.
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

    // How long the "message sent" confirmation stays up before the panel
    // closes itself. The panel first shrinks to fit the confirmation, which
    // takes TRANSITION_MS, so the reader gets roughly
    // SENT_HOLD_MS - TRANSITION_MS of settled text. Reasoned starting
    // guess, not tuned by eye yet.
    SENT_HOLD_MS: 3000,
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
    // Every panel matches the TEXT column, not the content column. The slot
    // this sits in is not `bleed`, so SlotGate hands it width:100% of the
    // content column; body paragraphs then narrow themselves to the reading
    // measure individually via bodyMaxWidth(). Nothing in here was asking for
    // it, so all three panels ran full-column and read wider than the copy
    // above and below them.
    //
    // Applied HERE rather than on each panel for two reasons: one place means
    // Contact / Resume / Location cannot drift apart later, and it must be on
    // the MEASURED element — constrain after measuring and the recorded height
    // belongs to a wider box than the one on screen, so the panel opens short
    // and clips.
    //
    // Read from the token, never restated as a number: this is
    // col.vw * col.bodyColPct / 100, tiering to 53.2 / 68.8 / 90 vw. Mobile's
    // bodyColPct is 100, so there it correctly stays full-column.
    const col = useColumn()

    // Height tracks the CONTENT BOX rather than a guess about when the
    // content changed. The dep array used to be [open, children] — but
    // `children` only takes a new identity when TalkOptions itself
    // re-renders, and every state that changes this panel's height
    // (idle -> sending -> sent -> error, plus the visitor dragging the
    // textarea, which is resize:vertical) lives INSIDE the child. So the
    // effect never re-ran on send and the container stayed at the
    // four-field height while displaying a one-line confirmation.
    //
    // A ResizeObserver reports the settled box whatever caused it to
    // change, which makes the `children` dependency unnecessary rather
    // than merely unreliable — so it is gone.
    useEffect(() => {
        const el = innerRef.current
        if (!el) return
        if (!open) {
            setHeight(0)
            return
        }
        setHeight(el.scrollHeight)
        const ro = new ResizeObserver(() => setHeight(el.scrollHeight))
        ro.observe(el)
        return () => ro.disconnect()
    }, [open])

    return (
        <div
            style={{
                height,
                overflow: "hidden",
                transition: `height ${CONFIG.TRANSITION_MS}ms ease`,
            }}
        >
            <div ref={innerRef} style={{ maxWidth: bodyMaxWidth(col) }}>
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
    const type = useType()
    const ct = type.CTA_LINK
    return (
        <button
            onClick={onClick}
            style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: TYPE.display,
                fontSize: ct.sizePx,
                fontWeight: ct.weight,
                letterSpacing: `${ct.tracking}em`,
                lineHeight: ct.lineHeight,
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
function ContactForm({ onSent }: { onSent: () => void }) {
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })

    // ── Spam protection, client half. The route holds the other half. ────
    // The honeypot: a field no human ever sees, so anything in it came
    // from a script filling every input it found.
    const [website, setWebsite] = useState("")
    // How long the visitor has had the form open. ContactForm only mounts
    // when the Contact panel is opened, so this measures exactly that.
    // Sent as a DURATION, never as a timestamp — the server must not have to
    // trust the visitor's clock, only their stopwatch.
    const mountedAtRef = useRef(Date.now())

    // Auto-close, once the confirmation has been up for SENT_HOLD_MS.
    // Cleared on unmount, so closing the panel by hand — or switching to
    // Resume/Location — cancels the timer instead of letting it fire later
    // and shut whatever the visitor opened next.
    useEffect(() => {
        if (status !== "sent") return
        const t = setTimeout(onSent, CONFIG.SENT_HOLD_MS)
        return () => clearTimeout(t)
    }, [status, onSent])

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
                body: JSON.stringify({
                    ...form,
                    website,
                    elapsedMs: Date.now() - mountedAtRef.current,
                }),
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
            <p style={{ fontFamily: TYPE.display, color: COLORS.white, fontSize: 17 }}>
                Thanks — message sent. I'll get back to you soon.
            </p>
        )
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            {/* Honeypot. Positioned off-screen rather than display:none — some
                scripts skip fields they can tell are hidden, but fill ones
                that are merely somewhere else. position:absolute also means
                it contributes NOTHING to this flex column: no height, and
                no extra 20px gap. Untabbable and aria-hidden, so keyboard
                and screen-reader users never reach it either. */}
            <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, opacity: 0 }}
            />
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
    const space = useSpace()
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

    // useCallback so the identity is stable across renders — ContactForm's
    // auto-close effect depends on it, and a fresh function every render
    // would restart the timer each time.
    const handleSent = useCallback(() => setOpen(null), [])

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
            {/* Horizontal at every breakpoint, explicit tunable gap at each
                (SPACE.layout.talkLabelGap) — was column at
                tablet only (768–1279px), and mobile/tablet used
                "space-between" (auto-fills the row, not a real tunable)
                instead of a settable gap. */}
            <div style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: space(SPACE.layout.talkLabelGap),
                }}>
                <OptionLabel label="Contact" active={open === "contact"} onClick={() => toggle("contact")} />
                <OptionLabel label="Resume" active={open === "resume"} onClick={() => toggle("resume")} />
                <OptionLabel label="Location" active={open === "location"} onClick={() => toggle("location")} />
            </div>

            <Collapsible open={open !== null}>
                {open === "contact" && <ContactForm onSent={handleSent} />}
                {open === "resume" && <ResumePanel />}
                {open === "location" && <LocationPanel />}
            </Collapsible>
        </div>
    )
}