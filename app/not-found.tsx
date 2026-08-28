"use client"

// TYPE ROLES USED IN THIS FILE:
//   "404" numeral   → TYPE_TIERS.OPENING (sizeVw — CSS-live, see note below)
//   body paragraph  → TYPE_TIERS.BODY    (sizePx)
//
// app/not-found.tsx — the 404 page.
//
// Next renders this for any route that doesn't exist, which on this site is
// mostly the ~60 old Squarespace project URLs. Those are NOT redirected: the
// old pages have no successor among the five, and a bulk 301 to the homepage
// reads to a search engine as a soft 404 and to a visitor as a bait-and-switch.
// So they land here instead, and here has to be worth landing on.
//
// THE BACKGROUND CYCLES HERE. Every real page has one ambient colour; the 404
// is not a place in the building, so SiteBackground runs all five instead. That
// lives in SiteBackground (NOT_FOUND_COLOR_HOLD_MS), driven off isKnownPage(),
// so this file contains no colour logic of its own — one mechanism, one owner.

import Link from "next/link"
import {
    COLORS,
    TYPE,
    SPACE,
    FOOTER,
    useType,
    useSpace,
    useColumn,
    bodyMaxWidth,
} from "./components/SiteTokens"

const CAT_ERRORS = "https://http.cat/"

// The numeral is deliberately far larger than any headline on the site — it is
// the whole picture here, not a heading above content. DERIVED, not an input:
// it multiplies OPENING.sizeVw so it keeps tiering with the rest of the type
// system, and 3 is the named fudge factor rather than three hardcoded vw
// numbers that would silently stop tracking OPENING the day it is retuned.
const NUMERAL_SCALE = 3

export default function NotFound() {
    const type = useType()
    const space = useSpace()
    const col = useColumn()

    // The gap between the numeral and the copy. interruptGapAfter is exactly
    // this relationship — the space below a non-paragraph element sitting above
    // body copy — and it is used RAW here, not with paragraphGap subtracted,
    // because these are stacked blocks and not a flex column with a gap. See
    // the token's own comment: same number, different arithmetic per container.
    const gap = space(SPACE.text.interruptGapAfter)

    const linkStyle: React.CSSProperties = {
        color: COLORS.white,
        textDecoration: "underline",
        textUnderlineOffset: "0.18em",
    }

    return (
        <main
            style={{
                // Centred in the space ABOVE the footer rather than in the
                // viewport — centring on 100vh would push the page taller than
                // the screen by exactly the footer's height and introduce a
                // scrollbar on a page with nothing to scroll to.
                minHeight: `calc(100vh - ${FOOTER.height}px)`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            {/* The composition — numeral plus copy — is centred in the page,
                horizontally and vertically. Only the PARAGRAPH's text is ranged
                left inside it.

                The block is bodyMaxWidth(col) wide, the same reading measure
                the body copy uses everywhere else, so the rag falls in the same
                place it would on any other page. Widening it here would give
                this one paragraph a longer line than the rest of the site. */}
            <div
                style={{
                    width: bodyMaxWidth(col),
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                <div
                    style={{
                        fontFamily: TYPE.display,
                        // CSS-live vw string, re-resolved every paint — the same
                        // pattern WorkCarousel uses for OPENING. Deliberately NOT
                        // a window.innerWidth read frozen into pixels, which is
                        // what both Welcome heroes still do and what makes them
                        // wrong after a resize or a device rotation.
                        fontSize: `${type.OPENING.sizeVw * NUMERAL_SCALE}vw`,
                        fontWeight: type.OPENING.weight,
                        lineHeight: type.OPENING.lineHeight,
                        letterSpacing: `${type.OPENING.tracking}em`,
                        color: COLORS.white,
                        textAlign: "center",
                    }}
                >
                    404
                </div>

                <p
                    style={{
                        marginTop: gap,
                        textAlign: "left",
                        fontFamily: TYPE.display,
                        fontSize: type.BODY.sizePx,
                        fontWeight: type.BODY.weight,
                        lineHeight: type.BODY.lineHeight,
                        letterSpacing: `${type.BODY.tracking}em`,
                        color: COLORS.white,
                    }}
                >
                    Uh oh&nbsp;&ndash; the page you requested isn&rsquo;t here. Maybe
                    you imagined it?{" "}
                    <Link href="/" style={linkStyle}>
                        Click this link
                    </Link>{" "}
                    to go back to shtooky. Alternatively, if you ever wondered what
                    some of the other error messages were AND how they might be
                    interpreted through the medium of cats,{" "}
                    <a
                        href={CAT_ERRORS}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkStyle}
                    >
                        click here
                    </a>{" "}
                    instead.
                </p>
            </div>
        </main>
    )
}
