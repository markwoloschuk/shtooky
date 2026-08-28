# spec — the band model (Work + Think) — v01

*Companion to `project-bible_2026-08-27_v79.md` and
`spec_sequencing_2026-08-25_v01.md`. Written before any code, because this
change spans two pages, two panels, a canvas coordinate system and the scroll
model.*

*Status: **nothing here is built.** Every number is untuned and marked as such.
The purpose of this document is to hold one model in one place so the two pages
can stop being two implementations of the same idea.*

---

## 1. The finding this rests on

Work and Think share the band's **appearance** — `BAND_HEADLINE`,
`BAND_VIGNETTE`, `SPACE.layout.bandDetailGap` — and share **nothing** about its
behaviour. Same picture, two machines.

The divergence isn't cosmetic. It is why the two pages have different bugs.

| | Work | Think |
|---|---|---|
| cover-fit maths | `max(CW/iw, _ech/ih)` | `max(rect.w/iw, rect.h/ih)` — same algorithm, second copy |
| per-item image offset | `offsetH`/`offsetV` in `WorkManifest`, wired | `THINK_OFFSETS` in `ThinkManifest` — **imported at line 9, never called** |
| per-item image scale | none | `scale` field exists, unused |
| headline size | `BAND_HEADLINE` in NATIVE units, ÷ stage scale on mobile | `BAND_HEADLINE` in SCREEN units, × width ratio |
| headline bottom pad | `_ech − 48 + HL_Y`, native, does not scale | `28 × unitPx`, scales — already commented as diverging on mobile |
| band height | `CH` | `BAND_HEIGHT` (exported from `ThinkGridCanvas`) |
| band scroll model | in flow, scrolls away | `position:absolute` at `top = scrollY-when-clicked`, plus a scroll-floor listener and a spacer |
| mobile breakpoint | hardcoded `innerWidth < 768` | `useBreakpoint()` |

---

## 2. Two numbers are derived from the wrong axis

`bandHpx = innerWidth × (_bandH / NATIVE_W)` and the headline is
`round(52 × innerWidth / 1440)`. **Both are functions of viewport WIDTH and are
judged against viewport HEIGHT.**

| viewport | band | % of screen height | headline |
|---|---|---|---|
| 1440 × 900 | 480 | **53%** | 52 |
| 2560 × 1440 | 853 | 59% | 92 |
| 2560 × 1080 | 853 | **79%** | 92 |
| 768 × 1024 | 410 | 40% | **28** |
| 390 × 844 | 214 | 25% | 28 |

Two consequences fall out of that table.

**The band eats the screen on desktop and barely registers on a phone** — the
inverse of intuition, and the reason the vertical-space problem was noticed on
desktop Work first.

**Tablet and mobile render the identical headline.** `52 × (768/1440) = 27.7`,
which rounds to `28` — the exact value the mobile override hardcodes. Nothing
decided that; tablet is simply wherever the desktop formula lands, and it lands
on mobile's number. On a screen twice as wide.

> **Two tiers arriving at the same value from opposite directions — a formula
> and a hardcoded override — look like agreement and are actually a gap.**

**Both numbers become tiered px and stop deriving from width.**

---

## 3. The model

One band, both pages, four rules:

1. The band opens, **resizes once**, and then never moves or resizes again.
2. Case content scrolls **beneath** it. The band is not in the scrolling document.
3. Next/prev **clears, returns to the top of the new content, and fades in**.
4. The band's image is framed by **one shared function** on both pages.

Optional, later: slow parallax of the image inside the fixed band. Safe, because
it moves pixels *inside* a fixed box rather than moving the box — see §6.

---

## 4. Geometry — tiered, not derived

```
BAND_HEIGHT_TIERS   { desktop: ?, tablet: ?, mobile: ? }   // narrow, resting
BAND_HEADLINE = {
    desktop: { sizePx: 52, lineHeightPx: 55 },
    tablet:  { sizePx: 40, lineHeightPx: 43 },   // UNTUNED — see below
    mobile:  { sizePx: 28, lineHeightPx: 30 },
}
```

Every `BAND_HEADLINE` value now means **screen pixels at every tier**. Today
`sizePx: 52` is a native value and `mobileSizePx: 28` is a screen value — two
fields, one object, two coordinate spaces, undocumented. That ambiguity is why
`WorkCarousel` divides by the stage scale for mobile and not for desktop while
`ThinkGridCanvas` multiplies. Make every tier a screen size and **both files do
the same arithmetic**.

**Tablet at 40 is a reasoned starting guess, not a preference.** Headline-to-
viewport-width ratios today are 0.036 desktop, 0.036 tablet (the coincidence),
0.072 mobile — mobile is deliberately double. Halfway between the two ratios
puts tablet at ~41px. Mark's eye sets the real number.

**Getting the band heights honestly:** scroll the live page until the crop looks
right, then read `window.scrollY` in the console. That value is exactly how many
pixels to remove from the current band at that width. Three readings at 1440 /
768 / 390 give three tuned numbers measured from the thing itself, each already
judged at the size it will render.

**Mobile is the constraint, not desktop.** `thinkNavClearance` is already
177 / 136 / 104. On a phone that is 104px plus the band before a word of case
text. Set the narrow heights at the small breakpoints first.

The band's fixed top reads `SPACE.layout.*NavClearance` — not a new constant.

---

## 5. Image framing — one function, both pages

```
drawCover(ctx, img, rect, { offsetX, offsetY, scalePct, anchorY })

scale = max(rect.w / iw, rect.h / ih) × (scalePct / 100)
y     = rect.y + (rect.h − dh) × anchorY + offsetY
```

`anchorY`: `0` top, `0.5` centre (today's behaviour on both pages), `1` bottom.

**Why `anchorY` exists.** Both pages centre the image in the band. Shrink the
band and the crop tightens equally from top and bottom around the image's
midpoint. That is **not** what was validated: the tighter band was previewed by
scrolling, which crops only the top, so what looked right was the *lower*
portion of each image. Shrinking in code without an anchor would show the middle
instead — a different frame, on every case.

Bottom-anchoring in the narrow state reproduces the approved crop **with no new
per-case numbers**, and puts the image on the same edge the headline already
hangs from (`baseY = _ech − 48 − totalH + HL_Y` on Work; `padB = 28 × unitPx` on
Think). Two things sharing a band should share an anchor.

**Neither manifest needs a new concept.** Work has `offsetH`/`offsetV` wired and
gains `scalePct`. Think has `[x, y, scale]` defined and gains a *connection* —
`offsetFor()` is imported and never called, and `THINK_OFFSETS` is an empty
object. Nothing catches that: ESLint would flag the unused import, and Next 16
does not run ESLint during `build`.

> **A capability built and never used should be found before it is defended.**

**Content audit required.** A bottom-anchored crop means every band image must
survive losing its top. Seven Work images, thirteen Think covers. The HP frame
works because the subject sits low; an image composed with the subject high gets
beheaded, and that would only be discovered by clicking through all twenty.
Any image that genuinely wants a different narrow frame gets a **named per-case
exception** (`narrowOffsetV`), present only where needed and falling back to
`offsetV` — `TOKEN + NAMED_OFFSET`, not a second mandatory field for all twenty
to service the two that differ.

---

## 6. The scroll model — the largest deletion

Today, Think's band is a canvas portalled to `document.body`:

```jsx
style={{ position: 'absolute', top: `${bandDocYRef.current}px` }}
```

with `bandDocYRef.current = window.scrollY` set at click time. The band is
anchored to **wherever the reader happened to be scrolled when they clicked**.
It is one viewport tall, clipped to a band-height strip, and a passive scroll
listener snaps back if `scrollY` drops below the anchor. When the open animation
lands, `wrapRef` collapses to band height and `spacerRef` inflates to
`(TOTAL_H − BAND_HEIGHT) × scale`.

That is four position authorities that must agree — anchor, clip inset, spacer
height, floor listener — each recomputed at a different moment. The reported
symptoms are what it looks like when they briefly don't:

- *"Scroll in the image and it scrolls off"* — it is an absolutely positioned
  document element; the floor clamps upward only.
- *"Doesn't scroll until suddenly it does"* — at the end of the open animation
  the document's total height changes, so the maximum scroll position moves
  mid-gesture. Worse on touch, where momentum is still running when the ground
  moves.

**A fixed band deletes all four.** No document anchor, no floor (there is no
"above the band" to reach), a constant clip, no spacer — the spacer exists
*only* to keep a document coordinate valid, and there is no document coordinate.
Content takes `padding-top: bandHeight`.

**It also removes the risk from the animation.** The open FLIP currently ends at
a *document* coordinate that depends on scroll position at click time. With a
fixed resting state the endpoint is a **viewport** coordinate — identical on
every card at every scroll position — and scroll is already locked during the
animation, so start and end are both viewport rects separated by a constant.

**The one genuinely risky piece** is the handoff frame where the animation lands
and hands off to `position: fixed`. That is where a one-pixel jump or a flash
would appear. Prototype it before committing to the rest.

Also retired: `top: ${bandDocYRef.current}px` reads a **ref** in a style. Refs
do not trigger re-renders, so that value is only correct because
`onBandPositioned` happens to fire a state update at the right moment. Same
family as the `[open, children]` dependency killed by the `ResizeObserver` in
v79. With a fixed band, `top` is a constant.

---

## 7. The step — next / prev

Today `stepCase()` changes `activeIdx` and nothing else. There is no `scrollTo`,
no `scrollIntoView`, no `sticky`, no `fixed` anywhere in `WorkCarousel`. The
content swaps under a viewport that never moves, which is why pressing next from
paragraph nine lands on paragraph nine of the next case.

**Sequence, in order:**

1. Press next. Current blocks fade to `0` over `FADE_DUR`.
2. The fetch for the new case starts **immediately, in parallel**.
3. When **both** finish — fade complete *and* content arrived — scroll to the
   top of the content and swap.
4. New blocks fade in on the successive reveal the panels already do.

**Scroll while invisible.** The cut happens at opacity zero, so instant-vs-smooth
stops being a question — there is nothing to look at during the move. A smooth
scroll would also drag the viewport through `ScrollFade` and the logo-grid-style
trigger geometry on the way past, firing reveals in content about to be
discarded.

**Gate on both, never on a guessed delay.** `setTimeout(FADE_DUR)` and hoping
the fetch beat it is the same class of mistake as the `2.2em` — a number wired
to something that does not deliver. Waiting for the slower of the two gives
exactly `FADE_DUR` on a fast connection and degrades to a longer hold on a slow
one, rather than a flash of nothing.

**Cache parsed cases** in a ref keyed by filename. Seven Work files, thirteen
Think cards, all small. After the first pass the fetch leaves the timing path
entirely.

---

## 8. The panels — keying, and a live rendering bug

Both panels render blocks as `<p key={i}>` and neither panel is keyed on the
file. On a step React sees the same list shape with new values and **reuses the
existing DOM nodes, mutating their text in place**.

Every one of those nodes carries an `opacity` transition, which promotes it to
its own composited layer. A layer whose contents are rewritten underneath it is
where Safari leaves a stale tile — which is the reported artifact: fragments of
the previous card's subtitle still painted beneath the new one.

**Keying by index across a wholesale content replacement is a bug on its own
terms**, independent of any browser.

- `key={cardFile}` **on the panel** remounts the component, which resets
  `parsed` to `null`, which clears the old content instantly — and solves the
  fetch-gap on its own. But a hard clear is *incompatible* with fading the old
  content out.
- `key={`${cardFile}-${i}`}` **on the blocks** keeps the fade-out possible; the
  clear then has to be explicit.

**The fade must not ship without the key fix.** Fading first would hide the
rendering bug behind an animation rather than remove it.

Note that the fade-out already exists and is simply never reached on a step:
`if (!visible) setBlockOps(prev => new Array(prev.length).fill(0))`. On a step
`visible` stays `true`. This is routing, not new machinery.

**Both panels need whichever change is picked, in identical code, in two
files.** Second consumer of an unextracted pattern — `parsed`, `blockOps`,
`FADE_DUR`, the same opacity transition, the same fetch shape. Decide extraction
here rather than editing it twice.

---

## 9. Incidental bugs found while tracing

- **`ThinkCasePanel:120` renders `{fm.subtitle}` raw.** `[br]` is handled for
  card titles (`ThinkGridCanvas:940` splits it) and for body blocks
  (`normBreaks`), but the frontmatter subtitle path touches neither — so `[br]`
  works above and below and silently does not in between. Currently latent: no
  Think subtitle uses `[br]` any more. Production still renders the old
  ThinkCard11 subtitle with a literal `[br]` visible.
- **`WorkCarousel:746` hardcodes `window.innerWidth < 768`** rather than reading
  `BREAKPOINTS.tablet`. Same value today.
- **`offsetFor` imported and never called** (§5).
- **`ThinkCard01` uses a `[note]` block** to hold an author comment. `//`
  comments *do* work in Think cards — `ThinkCasePanel:46` calls `stripComments`
  — so `[note]` works only because the whitelist silently drops unknown types,
  which is the same mechanism that hid the `[praragraph]` paragraph.

---

## 10. Untuned numbers

Every one of these is set by eye, by Mark, after the mechanism exists.

- `BAND_HEIGHT_TIERS` — desktop / tablet / mobile. Method in §4.
- `BAND_HEADLINE.tablet.sizePx` — 40 is a reasoned guess.
- `BAND_HEADLINE.*.lineHeightPx` — currently one ratio for all tiers.
- `anchorY` for the narrow state — 1 (bottom) reproduces what was approved;
  0.8–0.9 may read better once the images are audited.
- Any `narrowOffsetV` exceptions — unknown until the audit.
- Parallax rate, if built.

---

## 11. Open questions

**Does the tall state survive?** Work's carousel is tall when browsing and
narrow when a case is open — two heights. Think opens straight into the narrow
band from the grid — one height. Confirm that is intended rather than an
asymmetry to remove.

**Panel key or block key** (§8) — decides whether the old content fades out or
clears hard.

**Extract the panel, or edit both** (§8).

**Parallax** — deferred; it is additive and nothing else depends on it.

---

## 12. Suggested order

1. **Keying fix.** Smallest, fixes a live rendering bug, independent of
   everything else.
2. **Step behaviour + fade.** Fixes the loudest complaint. Needs no geometry
   change.
3. **`drawCover` extraction + `anchorY`.** Wires up `offsetFor`, deletes the
   duplicate cover-fit, prepares the narrow band.
4. **Tiered band height and headline.** Pure token work, judged by eye.
5. **Fixed band + scroll-model deletion.** Largest, riskiest, and the one that
   wants the handoff prototype first.

Steps 1 and 2 are worth doing before deciding anything about step 5 — they may
account for most of the felt problem on their own.
