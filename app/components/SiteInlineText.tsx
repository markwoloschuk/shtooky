"use client"

// SiteInlineText.tsx
// app/components/
// ONE inline vocabulary for every piece of authored text on the site.
// v01 - 2026-08-30
//
// TYPE ROLES USED: none - this renders spans/anchors inside whatever type role
// its caller has already established.
//
// --- WHY THIS FILE EXISTS ----------------------------------------------------
//
// Before this, three renderers each had their own idea of what markup a content
// file could contain:
//
//   parseAccents()   (Think + Work case panels)  <accent>  [br]
//   ParagraphItem    (About + Talk paragraphs)   nothing at all - a plain string
//   PullTextItem     (About + Talk pull quotes)  {highlight}
//
// So the same sentence meant different things depending on which page it was
// pasted into, and the failure was silent both ways: markup a renderer did not
// know rendered as literal punctuation, and Think's frontmatter subtitle - which
// bypassed all three and rendered raw - swallowed [br] without a word.
//
// This is the single vocabulary. Three tokens, and adding a fourth means editing
// one function:
//
//   <text>          accent colour
//   [br]            line break
//   [text](url)     link
//
// DELIBERATELY NOT UNIFIED: PullTextItem's {highlight}. A pull quote is animated
// per WORD - every chunk is its own span with the spaces inserted between them
// by the renderer - so a multi-word link there would come out as several
// separate <a> elements with the spaces outside them. That is a different
// rendering MODEL, not a different syntax, and it is excluded by decision
// (Mark, 2026-08-30) rather than by oversight.
//
// The asymmetry that leaves, named out loud so nobody rediscovers it as a bug:
// {} means accent inside a pull quote and <> means accent everywhere else. Same
// idea, two spellings. Not worth rewriting the chunk animator over today.

import React from "react"

// A link is EXTERNAL if it names a scheme. Everything else - "/work",
// "#section" - renders as an ordinary same-tab anchor.
//
// Internal links deliberately have NO router integration. Mark's answer when
// asked (2026-08-30) was that he links out, not across: a Medium article, a
// SoundCloud mix, a shared doc. Building next/router handling for a case he
// says will not happen is a capability built and never used. An internal link
// still works - it just costs a full page load, which is a real cost only
// against the single-room continuity, and that is the moment to add routing.
const EXTERNAL = /^(?:https?:|mailto:|tel:)/i

// One pass, one regex, and the ORDER of the alternatives matters.
//
// The link alternative is tested before the [br] alternative because both begin
// with "[". "[br]" cannot match the link pattern - nothing follows it in
// parentheses - so putting links first costs nothing, and it means link text
// containing the letters br is still a link.
const TOKEN = /(<[^<>]+>)|(\[[^\][]+\]\([^)\s]+\))|(\[br\])/g

// Replaces the LAST space in the text with a non-breaking one, so a paragraph
// cannot end with a single word alone on its own line.
//
// U+00A0 is written as an escape, never as the literal character: per AGENTS.md,
// .tsx string literals use \u00A0 so the thing is visible in source. An
// invisible character is a value no search can confirm.
//
// Applied to the last TEXT segment rather than to the whole string, because by
// now the text is a node list and a trailing link or accent span is not a place
// a space can be swapped. A paragraph ending in a link therefore gets no orphan
// guard - accepted: the widow is a typographic nicety, a misplaced nbsp inside
// markup is a bug.
function preventOrphanInPlace(parts: unknown[]): void {
    for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        if (typeof p !== "string") return
        const lastSpace = p.lastIndexOf(" ")
        if (lastSpace === -1) continue
        parts[i] = p.slice(0, lastSpace) + "\u00A0" + p.slice(lastSpace + 1)
        return
    }
}

type Token =
    | string
    | { kind: "accent"; text: string }
    | { kind: "link"; text: string; href: string }
    | { kind: "br" }

export type InlineOptions = {
    // Colour for <accent> spans and for links. Required rather than defaulted:
    // a default here would be a decision made on behalf of every caller that
    // does not pass one, and the five page colours are exactly the thing that
    // must not be guessed.
    accent: string
    // Paragraph-only. Off for subtitles and headings, where a widow is not a
    // widow - there is no following line for it to be alone on.
    orphanGuard?: boolean
}

export function renderInline(
    text: string,
    { accent, orphanGuard = false }: InlineOptions,
): React.ReactNode[] {
    const parts: Token[] = []
    let last = 0
    let m: RegExpExecArray | null

    TOKEN.lastIndex = 0
    while ((m = TOKEN.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index))
        last = m.index + m[0].length

        if (m[1] !== undefined) {
            parts.push({ kind: "accent", text: m[1].slice(1, -1) })
        } else if (m[2] !== undefined) {
            const split = m[2].indexOf("](")
            parts.push({
                kind: "link",
                text: m[2].slice(1, split),
                href: m[2].slice(split + 2, -1),
            })
        } else {
            parts.push({ kind: "br" })
        }
    }
    if (last < text.length) parts.push(text.slice(last))

    if (orphanGuard) preventOrphanInPlace(parts)

    return parts.map((part, i) => {
        if (typeof part === "string") return part
        if (part.kind === "br") return <br key={i} />
        if (part.kind === "accent") {
            return (
                <span key={i} style={{ color: accent }}>
                    {part.text}
                </span>
            )
        }
        const external = EXTERNAL.test(part.href)
        return (
            <a
                key={i}
                href={part.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                style={{
                    color: accent,
                    textDecoration: "underline",
                    // Set explicitly: the default underline sits on the
                    // baseline and cuts through descenders at display weights.
                    textUnderlineOffset: "0.18em",
                    textDecorationThickness: "1px",
                }}
            >
                {part.text}
            </a>
        )
    })
}
