# spec — band model — STATUS as of 2026-08-29

*Read this alongside `spec_band_model_2026-08-27_v01.md`. **That document's own
status header is stale** — it says §§3–6 are unbuilt. This file is the current
state. The spec's body is still correct as the model; only its status block and
two specific claims are out of date.*

*Full narrative lives in `project-bible_2026-08-29_v83.md`.*

---

## Section by section

| § | subject | state |
|---|---|---|
| 1 | the finding — two machines, one appearance | still true, now mostly resolved |
| 2 | two numbers derived from the wrong axis | **RESOLVED for Think** (v83); Work still derives band height from width |
| 3 | the model — four rules | **BUILT for Think** |
| 4 | geometry — tiered, not derived | **BUILT for Think.** Heights done; `sizePx` coordinate-space cleanup outstanding |
| 5 | image framing — one function, both pages | **BUILT** (v82 `drawCover`; v83 wired `anchorY`) |
| 6 | the scroll model — the largest deletion | **BUILT for Think except the spacer** |
| 7 | the step — next/prev | BUILT (v81) |
| 8 | the panels — keying | BUILT (v81) |
| 9 | incidental bugs | 2 of 4 fixed |
| 10 | untuned numbers | mostly now tuned — see below |
| 11 | open questions | one still open, and it blocks Work |
| 12 | suggested order | steps 1–5 done for Think |

---

## Corrections to the spec's own text

**§4's measuring method was wrong.** The spec says: scroll until the crop reads
right, read `window.scrollY`, that is how many pixels to remove. It is not. The
band sits at `bandDocY`, so the first `bandDocY` pixels of scroll only consume
the nav clearance above it — nothing is cropped until the band's top passes the
viewport top. The error is `bandDocY`, and `thinkNavClearance` is tiered
177/136/104, so it is a *different* error at each of the three widths being
measured.

**Replaced by:** a `DEBUG.thinkBand` HUD line reporting the visible band height
directly — `min(bandTop + bandHpx, innerHeight) − max(bandTop, 0)` — so the
number read off the screen IS the tier value, with no arithmetic. Verify the
instrument before trusting it: `full strip` must read 480 / 256 / 214.5 at
scroll zero.

**§5's `anchorY` recommendation was followed and then overruled.** The spec
argues for `1` (bottom), correctly: heights were approved by scrolling, which
removes only the top. Mark looked at the thirteen actual covers and chose `0`
(top). `BAND_ANCHOR_Y = 0`. The content audit therefore concerns images
surviving the loss of their **bottom**, not their top.

**§6's "genuinely risky piece" was not risky.** The spec says prototype the
handoff frame — where the animation lands and hands off to `position: fixed` —
before committing. Done, and smooth on all three tiers first try, for a reason
the spec had already written down: scroll is locked for the whole animation and
`bandDocY` is `scrollY` at click, so `absolute; top: bandDocY` and
`fixed; top: 0` are the same screen position. **The right answer turned out to
be no handoff at all** — the band is `position: fixed` for its entire life, from
mount to unmount. A viewport coordinate cannot be invalidated by a document
height change; that is the whole benefit.

---

## What is actually built (Think only)

- `BAND_HEIGHT_TIERS { desktop: 305, tablet: 217, mobile: 165 }` — real screen
  pixels, measured on the live page at 1440 / 768 / 390.
- `bandHeightPx(viewportW)` — one resolver, replacing six copies of
  `viewportW * (_bandH / NATIVE_W)`.
- `BAND_ANCHOR_Y = 0`, passed at the three band call sites only; grid cells stay
  centred.
- The band is `position: fixed; top: 0` whenever mounted.
- Content sits at a constant document position; `detailTopPx = bandH + gap`.
- `onOpenLanded` + `BAND_OPEN_LANDED_AT = 0.88` — the animation reports when it
  lands, and the case copy's fade waits for that event rather than counting
  `OPEN_DELAY` milliseconds. **`CFG.TRANSITION_DURATION` is a RATE, not a
  duration:** at 750 the card takes ~1717ms to land, so the old `OPEN_DELAY =
  750` was ~967ms early.

## Deleted

`enableScrollFloor` / `disableScrollFloor`; the document anchor for content; the
grid-bound opening clip and `gridDocBottomRef`; `onBandPositioned` and the
controller's `bandDocY` state; `BAND_HEIGHT` and `NATIVE_W` exports.

`bandDocY` survives with one job — the scroll position to return the reader to
on close. A bookmark, not a position authority.

---

## Outstanding

**1 — Delete the spacer (§6's last piece).** Content into normal flow with
`padding-top: bandHeight`, grid out of flow. The spacer does **not** preserve
document height as v82 claimed: measured, the page is ~16px shorter when a card
is open (`wrap.height` 301.919 against a 305 strip). That mismatch caused two
bugs this session, both fixed by *ordering* rather than by removing the cause.
Deleting the spacer also removes the need to scroll on open at all.

**2 — `BAND_HEADLINE.sizePx` to a screen value (§4's remainder).** Still a
native reference while the other two tiers are real pixels. Now non-cosmetic:
the desktop headline ramps with width while its band is flat above 1280, so a
2560 display gets a 92px headline in a 305px band. *Coupling: `sizePx` also
serves as the denominator that makes `lineHeightPx` a ratio.* `lineHeightPx`
itself needs no tiers — checked, it is 1.058 at every tier already.

**3 — Work (§11 blocks it).** Work is tall while browsing and narrow when open;
Think has one height. Confirm that asymmetry is intended before measuring Work's
tiers or moving it to the fixed band.

**4 — Content audit.** Twenty band images that must survive losing their bottom.

**5 — Open defects on the live site**, iOS-first, not diagnosed. See the bible's
"OPEN DEFECTS" section. Diagnose on the LAN dev server with the HUD on, never
against production.
