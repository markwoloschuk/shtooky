# Sequencing & Visibility — Spec v03

*shtooky.com — 2026-08-25. Written from Mark's point-by-point description of
the intended behaviour, checked against the code as it stands today. This
supersedes nothing; it is the first written statement of a system that was
designed, partly built, and then drifted apart.*

*v02 — folds in Mark's decisions on the gate-release rule, the footer, the
Venn diagram's play-once behaviour, and the two-edge trigger question.*
*v03 — the content format and the queue are BUILT and verified on device.
Items marked BUILT are no longer proposals.*

**Status: BUILT. Ordering verified at every scroll speed and on all three
tiers; pacing numbers still UNTUNED.** Numbers marked UNTUNED are
starting guesses for Mark to judge on screen.

---

## 0. Why this exists

The Who I Am page sequences badly: paragraphs arrive out of order when
scrolling at any speed, pull quotes snap in and out, and long empty stretches
resolve late. The audit found six defects, but they share one cause.

**The intended design was implemented as three disconnected mechanisms, and
the numbers that were supposed to tie them together were transcribed by hand
instead of imported.**

Three zone tokens exist in `VISIBILITY_TIERS`, tiered per breakpoint, fully
commented — and every one of them also exists somewhere in the code as a
desktop-measured literal:

| token | value (desktop) | in the code as | where |
|---|---|---|---|
| `TF100` | 24vh ≈ 216px | `fadeOutStart: 250` | `SiteTextBlock` |
| `TF0` | 6vh ≈ 54px | `fadeOutEnd: 50` | `SiteTextBlock` |
| `BF100` | 85vh | `window.innerHeight * 0.85` | ×3, two files |

None of the three import the token. That is not three coincidences; it is one
habit, and it is why the system reads as "designed but not connected."

`BF0` is absent from that table because it is **the one zone token that is
genuinely wired** — it is the opaque stop of the live bottom gradient, and has
no hardcoded twin. `TF0`/`TF100` are fully dead (their only reader, the top
gradient, is commented out). `BF100` is the odd one: live in the gradient *and*
separately transcribed as `0.85` for eligibility.

**A fourth measurement scheme, found later:** `WhoVennDiagram` and
`WelcomeClientLogoGrid` both compute
`viewH - rect.bottom + (rect.bottom - rect.top) * 0.5`, which simplifies to
`viewH - centreY` — they trigger on the element's **centre**, in pixels. For a
tall element that fires roughly half its own height late: the Venn was starting
about 400px after it should. BUILT — both now read `BF0`/`BF100` and trigger on
the leading edge.

**The root cause of the ordering bug specifically:** eligibility (position) and
sequence (order + pacing) are the same mechanism. Fast scrolling is supposed to
skip the *waiting*. Because the waiting was the only thing producing the
*ordering*, skipping it removes both.

> **The timers were never the sequence — they were only pacing it. When the
> fast path removed the timers, it removed the sequence with them.**

---

## 1. The model

Two separate jobs, currently fused, to be separated:

- **Eligibility — owned by position.** An item becomes *eligible* when its
  **leading edge** rises above the `BF0` line. Eligibility never reveals
  anything by itself. (`BF0`, not `BF100` — see §3.3.)
- **Sequence — owned by a queue.** The queue decides order and pacing. Items
  enter it in document order and leave it in document order, always.

Scroll speed affects only eligibility. A fast scroll makes many items eligible
at once, so the queue **drains faster** — it is never bypassed.

### 1.0 BUILT — `RevealQueue.tsx`

One module-level queue, like `SequenceController`. The pump walks items in
document order and **breaks** — not continues — at the first item that may not
go yet, so nothing can overtake anything.

Eligibility is injected per item, which is what lets one queue serve both kinds
of page without forking the reveal path:

- **position-driven** (Who I Am) — the item measures its own leading edge
  against `BF0`
- **choreographed** (Let's Talk, `sequence: manual`) — the page's own timer
  opened the gate

Verified by simulating the pump against the real `About.md` at five speeds
(still, 120px/s, 600px/s, 2500px/s, jump-to-bottom) on all three tiers. Order
correct in every run.

### 1.1 Ordering guarantee

An item may not begin revealing before every item above it in the document has
begun revealing. This is structural, not probabilistic:

```
revealAt(i) = max(eligibleAt(i), revealAt(i-1) + step)
```

Out-of-order arrival must be impossible at any scroll speed, on any device,
under any frame budget. The current design is correct at slow speeds by luck.

### 1.2 Overlap is allowed

Sequence governs **start** order, not completion. Items may be mid-transition
together — that is already true today (400ms step against a 1500ms fade) and it
is wanted.

### 1.3 Gating on completion — at rest only

**Order is absolute. Pacing is elastic.**

The designed rhythm — first-item delay, the step between items, a pull quote
playing out in full before the next thing starts — is the **resting pace**. It
is what a still reader on a page with room to perform should get.

Scroll pressure compresses it. The next item still arrives *after*, still
fades on, just sooner. So the pull-quote gate is not "the next thing waits for
this to finish," it is **"at rest, the next thing waits for this to finish."**

Two consequences:

- **The pull quote is never truncated.** Under compression the *next* item
  stops waiting; the pull keeps playing at its own speed and simply overlaps
  what follows. Truncating it would be a cut (§2). A pull scrolled past keeps
  animating off-screen — costs nothing, avoids a special case.
- **Compression has a floor.** However far behind the queue falls, every item
  still gets a real fade: the step shrinks toward a minimum (UNTUNED, guess
  60-80ms), never toward zero. Heavy overlap, never a dump.

**Gate release rule (decided, BUILT):** only scrolling that brings new content
toward the queue releases the gate — a direction test plus a generous deadzone.
Not "any scroll," because mobile Safari generates scroll events nobody asked
for and rubber-band bounce would drop a gate mid-performance.

**Two pressure sources, and they must stay complementary — BUILT, after
getting this wrong once:**

- **scroll** — the reader is actively moving. Decays in `pressureWindowMs`.
- **backlog** — content left the top of the screen WITHOUT being revealed.
  Does not decay until worked off.

Backlog exists because scroll pressure decays too fast: land at the bottom of a
long page and it expires before the queue catches up, dropping back to the
resting pace with every pull quote holding in turn — twelve seconds of
catch-up watched from the bottom. Found in simulation, not on screen.

**The mistake worth recording.** Backlog first counted every
*eligible-but-unrevealed* item. At page load that is simply "everything on
screen" — the normal starting condition, not a queue that has fallen behind.
Worse, the COUNT of items above `BF0` is tier-dependent: mobile's short lines
stacked 6 above it, tablet 6, desktop 3. So the same threshold meant different
things at different widths, and the sphere's hold was released at load on
mobile and tablet but held correctly on desktop — looking for all the world
like a breakpoint bug in the hold.

> **A COUNT of on-screen items is a viewport-dependent number wearing a
> viewport-independent costume.** Same class of error as a hardcoded pixel
> value: it silently means something different at every size.

Diagnosed with `DEBUG.sequence`, which traces each reveal with its backlog and
which pressure source was active — and which was written specifically so that
"never held" and "held then released" could be told apart. As the code stood,
those two produced identical behaviour with nothing to distinguish them.

---

## 2. No cuts

Every item transitions on. Nothing appears instantaneously.

Three places the code currently cuts, all to be removed:

1. **The hard snap.** `if (rect.bottom < 0) { transition = "none"; opacity = 1 }`
   — an element passing above the viewport jumps to full opacity. This is the
   pull-quote pop.
2. **The fade-out is a scrub, not a transition.** It sets `transition: "none"`
   and writes opacity directly from scroll position on every event. Smooth while
   moving, frozen when stopped, reverses on scroll-up.
3. **Any "instant reveal for something already scrolled past."** Explicitly
   ruled out. An item scrolled past still fades on, just fast and in order.

The `opacity: 0` starting state is not a cut — that is a state, not an arrival.

---

## 3. Zones and gradients

### 3.1 Painted gradients — every page

A fixed viewport overlay, top and bottom, present on all five pages. This is
`SiteScrollConfig`, already rendered from `app/layout.tsx`.

- **Top:** 100% opacity at the top edge, reaching 0% at a tuned per-tier value.
- **Bottom:** 100% opacity at roughly the top of the footer, 0% above that.

**Current state:** the bottom gradient is live. **The top gradient is commented
out** — `{/* Top gradient - removed and added to navbar */}` — and re-implemented
in `SiteNavBar` as `NAV_GRADIENT_HEIGHT` (180/120/90 **px**), a separate
mechanism in different units with independently tuned tiers.

**To do:** one top gradient, from the zone tokens, in `vh`. Decide whether the
navbar keeps a second scrim of its own for legibility over the nav itself; if
so it must be a deliberate, commented pair, not two systems unaware of each
other.

### 3.2 The bottom gradient and the footer — BUILT

The bottom gradient must be **fully opaque by the top of the footer**. The
footer type is small and no content may ever pass behind it.

`SiteFooter` used to paint its *own* second scrim
(`rgba(13,13,13,0.9)` → transparent), so there were two overlapping bottom
gradients at different opacities, neither aware of the other. **That background
is deleted** — one gradient, in one place.

The guarantee is now structural rather than two numbers agreeing by hand:
`FOOTER.height` is a token (promoted from a bare `52` in `SiteFooter`), and
`SiteScrollConfig` takes the opaque stop as `max(BF0-derived px, FOOTER.height)`.
That subtraction is a **derived** value — it stays in the component, and it is
commented, because the failure it prevents is the one
`talkNavClearance`/`SCROLL_FADE_TIERS` already has.

Consequence worth knowing: `BF0` can now be tuned freely for *timing* without
ever breaking footer coverage.

*(Mark: "I really wish we'd been able to create an alpha mask" — that approach
was abandoned after a lot of fussing. This is the accepted substitute.)*

### 3.3 Element opacity from the same zones

Objects fade against the same lines that paint the gradients:

- Below `BF0` — not yet eligible. Opacity 0.
- `BF0` → `BF100` — ramping up.
- Between `BF100` and `TF100` — full opacity.
- Above `TF100` — fading out, reaching 0 at `TF0`.

**Which edge triggers what — leading edge in, trailing edge out.** Scrolling
down, an object rises: its **top** edge enters first, so the top edge crossing
`BF0` makes it eligible — it may start arriving the moment any part of it
appears. It exits at the top, where its **bottom** edge leaves last, so the
fade-out is keyed to the bottom edge crossing `TF100` → `TF0`. Net effect: an
object is lit from the moment any part enters the band until the last part
leaves.

This is not arbitrary. The edge choice matters *in proportion to the object's
height* — for a paragraph the two edges cross a line moments apart; for the
skills sphere or the Venn diagram they can be most of a screen apart. That is
almost certainly why two references existed in the first place
(`WhoSkillsSphere` carries a four-line, two-edge version of exactly this, in
viewport fractions, with its own numbers).

**Do not make the edge a per-object option** unless something actually needs
it. If the leading/trailing rule covers the sphere, the Venn and the
paragraphs, no knob is required; add one later with a reason attached.

**Objects taller than the band** satisfy both conditions at once (top past
`TF100`, bottom still below `BF100`). They clamp to full opacity — a `Math.min`
of the two ramps — and that needs a comment saying so.

Today the fade-out does exactly this, from hardcoded `250`/`50`. It must read
`TF100`/`TF0` and therefore tier correctly.

**Missing entirely:** the bottom-edge fade-*in* for text. `fadeInStart: 200` and
`fadeInEnd: 350` sit in `SCROLL_FADE` and **nothing in `SiteTextBlock` reads
them**. `WhoVennDiagram` and `WelcomeClientLogoGrid` each implement this
themselves from their own local copies of the same key names.

### 3.4 Composition — the important part

Arrival is time-driven; zone fade is position-driven. They are both correct and
must **compose**, not compete:

```
opacity = arrivalOpacity × zoneOpacity
```

Right now both write directly to `el.style.opacity`, which is why the scrub can
snap an element to `1` that the sequencer has not revealed. One value, computed
from two inputs, written once.

---

## 4. Play once

Items reveal once and stay revealed. Pull quote animations do not re-run when
scrolled back to. This is simpler than wrangling resets and is what the code
already mostly does.

**Two exceptions to settle:**

- **`WhoVennDiagram`'s scroll re-arm is deleted — BUILT.** It used to re-arm
  whenever it scrolled fully out of view, cancelling three rAF loops and
  resetting eight refs mid-flight. Mark: *"I keep seeing enough errors with
  this that it should only reset on reloading the page."* It now plays once per
  page **visit** — the component unmounts on navigation, so `animTriggered`
  resets naturally. Its opacity write still runs every scroll: that is the zone
  fade, which is a different thing from replaying the animation.
- **A per-page-visit reset — BUILT.** `_unlocked` is module state and Who I Am
  never called `reset()` (Let's Talk did). Navigate away and back and the page
  rendered fully revealed with no animation at all — not play-once,
  play-never-again. Who I Am now calls `reset()` on mount alongside its existing
  `scrollTo(0, 0)`.

**The rule, stated once: play-once is per VISIT. Scrolling never re-arms
anything; arriving at the page re-arms everything.**

---

## 5. Content format

`AboutContent.ts` becomes `About.md`, parsed by `CaseMarkdown.tsx` as a third
dialect alongside Work and Think.

### 5.1 Sequence becomes implicit

**One block = one gate.** Blank lines inside a block create additional
paragraphs sharing that gate. Block order *is* sequence order — the same
principle as `[jobbox]`, extended one step.

Verified: every current section is a pure run of one type, so nothing in
today's content needs a mixed section.

**This deletes three hand-maintained numbering systems:** `id`, `seq`, and the
`ids="1-7"` / `ids="8-26"` range props.

About uses only two item types today — `paragraph` and `pull`. Zero links, zero
`size`, zero `fast`. The dialect is small.

### 5.2 Slots — BUILT

Animations on the page — the skills sphere, the Venn diagram, anything added
later — become content items so they sit in the sequence rather than beside it.

**Content declares order and identity. The page declares what the thing is.**

```
[slot] sphere
hold: 1800
bleed: true
```

Slot options:

- **`hold: <ms>`** — everything after it waits. A pull quote can report
  completion; the sphere is a continuous canvas that never finishes, so its
  hold is a duration. Like every hold it is a RESTING-pace rule.
- **`bleed: true`** — escape the content column and span the viewport.
  **Required for the sphere.** Its 3%/76%/21% framing is a share of the SCREEN;
  moved into the column as a slot it became 76% of `col.vw`, so 57.8vw instead
  of 76vw on desktop, and 68.4vw instead of 100vw on mobile. Wrong on all three
  tiers, with no error anywhere. This is the knowing exception to the
  leftmost-element principle, same as `SiteBackground`.

> **Moving something into a container silently rescales anything sized relative
> to the VIEWPORT.** v75 recorded the same lesson running the other way
> ("widening a container silently resizes anything sized from container
> width"). The sphere is the third thing this has caught.

```jsx
<SiteTextBlock page="about" slots={{
    sphere: <SkillsSphere />,
    venn:   <VennDiagram scale={1} xOffset={0} />,
}} />
```

The content file never learns what a Venn diagram is or what props it takes.
Every layout and configuration decision stays in `page.tsx` where it already
lives. Same split as `JOB_FIELDS`: order in one file, substance in the other.

Two consequences:

- The Venn's `triggerOnScroll` independent trigger goes away — it gates like
  everything else, and holds the next section until it completes (at rest;
  §1.3).
- **Refactor hazard:** `WhoVennDiagram` writes opacity to
  `container.parentElement.style.opacity` — it reaches *up* and mutates its
  parent, which today is the `4vh`-margin wrapper in `page.tsx`. As a `[slot]`
  its parent changes, and that line will either target the wrong element or
  fight the queue for the same `opacity` channel. This is exactly the §3.4
  collision. Fix it in the same change that makes it a slot.
- The sphere's full-bleed treatment (the knowing exception to the
  leftmost-element principle) stays in `page.tsx`, since the page supplies the
  JSX. **Verify during build:** where the content inset is currently applied. If
  it is on a wrapper surrounding the text blocks, the sphere slot would inherit
  it and the inset must move onto the text items instead.

### 5.3 Pull quotes stay in the content

The per-chunk choreography is content-coupled — change the words and the
choreography changes with them — so it lives in `About.md`, not a side module.

**Rule: omit any field to get its documented default.** One rule, no
exceptions. Most defaults are `0`; two are not, which is exactly why the rule is
"documented default" and not "assume 0" (`duration: 0` would never animate,
`feather: 0` would give a hard wipe edge).

A `//` comment block at the bottom of the file lists them. Comments are stripped
before anything parses, so this can never leak onto the page:

```
// PULL QUOTE OPTIONS — omit any field to get its default.
//
//   duration    1500   ms — the chunk's fade / wipe / push duration
//   feather       60   %  — softness of the wipe edge
//   pushY          0   px — vertical offset it rises from
//   pushX          0   px — horizontal offset it slides from
//   colorDelay     0   ms — wait before the {highlight} starts colouring
//   colorDurIn     0   ms — ramp white -> page colour (0 = snap)
//   colorHold      0   ms — hold at full colour before fading back
//   colorDurOut    0   ms — ramp back to white (0 = stays coloured)
//
// Per chunk: delay, and the flags wipe / fade / push.
// {braces} mark a highlight. Highlight colour is the page colour.
```

**`highlightColor` is deleted.** All six quotes carry `"#FAAF40"`, which is
already exactly `COLORS.about`, and the code already falls back to it
(`timing.highlightColor || COLORS.about`). Removing the field is a zero-pixel
change. It was the same transcription habit as `250`/`50`/`0.85`.

**Fix while there:** `lerpColor` hardcodes white as the origin and the fade-out
resets to a literal `"#ffffff"`. If the resting colour is "the body colour," it
should be a token, not white in two places.

**Unknown keys must warn in the dev console.** Under "omitted = default," a
typo'd `pushy:` silently becomes `0` — the animation quietly does not do what
you told it, with no symptom to chase. Same trap as a typo'd `[pullqoute]`
vanishing. A one-line `console.warn` makes terse syntax safe to type fast.

### 5.4 Dialect note

Work/Think use `<text>` for static accent colour; pull quotes use `{text}` for
the animated highlight. Different effects — keep both, document the difference,
do not force them together.

---

## 6. What gets deleted

- `id` on every content item; the `ids=` prop; the range parser.
- `seq` on every content item.
- The `rect.bottom < 0` snap branch.
- The scroll-position opacity scrub (replaced by zone-composed opacity).
- `timing.highlightColor`.
- `getScrollConfig()` and the `_config` store — **zero consumers**.
- `SiteFooter`'s own background gradient — DONE.
- `WhoVennDiagram`'s `resetDelay` and scroll re-arm — DONE.
- `fadeInStart`/`fadeInEnd` in `WhoVennDiagram` and `WelcomeClientLogoGrid`,
  and their shared centre-measurement formula — DONE.
- `revealMs`, `staggerMs`, `idleMs` in `VISIBILITY_TIERS` — zero consumers, and
  `staggerMs: 600` is commented *"delay between items in same seq group"* while
  the code uses a hardcoded `400`. A token that describes itself accurately and
  is wired to nothing is worse than no token.
- `VISIBILITY_TIERS_DESKTOP`, the duplicate copy inside `SiteScrollConfig`.
- `fadeInOnly` and `wasEnabledOnMount` in `useScrollFade` — both accepted, both
  never read.

**Not in scope, but now sized.** There are **eight separate `const SCROLL_FADE`
objects in eight files** — `SiteTextBlock`, `WelcomeHero2Line`,
`WelcomeHeroAnimation`, `WhoVennDiagram`, `WhoSkillsSphere`,
`WelcomeClientLogoGrid`, `WelcomeEverythingIsInteresting` — plus
`WelcomeScrollFade`'s prop defaults and `TalkRippleNetwork`'s tiered
`SCROLL_FADE_TIERS`. Same name, different key sets, unrelated numbers.
`WhoSkillsSphere` does not even use its own (`const fadeOutStart = 300`, inline).

v77 recorded this as "the scroll-fade family, never swept" and framed it as a
threshold bug. It is actually **nine implementations of the behaviour `TF0`/
`TF100`/`BF100`/`BF0` were supposed to define.** This spec fixes Who I Am and
Let's Talk; the Welcome page components remain a separate job.

---

## 7. UNTUNED numbers

All starting guesses. To be judged on screen.

- **First-item delay.** `mountDelay: 1500` was tuned for scroll-triggered
  arrival where the delay masked the trigger. Anchored to unlock, 1500ms of
  dead air before the first item is likely too much. Guess: **300–500ms**.
- **Queue step.** Currently a hardcoded `400`. Guess: **150–250ms**.
- **Fast-scroll threshold.** `600px/s` is low enough that an ordinary flick
  trips it. Under the queue model this only changes drain rate, so it is far
  less dangerous — but it should still be a tuned, tiered number.
- **Tablet and mobile `VISIBILITY_TIERS`** are both marked *"TODO: tune —
  copied from desktop as placeholder."* Expected, since the top half never
  rendered. They need a real pass once it does.
- **`BF0`/`BF100` desktop.** With the Venn and logo grid now reading them,
  Mark's read is *"looks great on mobile, too eager on desktop."* Desktop
  triggers at 5vh from the bottom, mobile at 7vh — mobile was already the less
  eager tier. Lower desktop `BF0` (95 → 92-90) to delay; widen `BF0 - BF100`
  to slow the ramp. `SiteTokens.tsx` lines 626-627. Tune with
  `DEBUG.visibility` on — it draws the labelled zone lines.
- **`SPACE.text` gaps** (`paragraphGap`, `pullGapBefore`, `pullGapAfter`) were
  tiered earlier today and Mark has since set the two pull gaps equal and
  significantly smaller. Whether two pull-gap values are needed at all is an
  open cleanup — see §9.

---

## 8. Verification

Per the v77 practice of simulating against real content before believing it:

1. **Order proof.** Simulate the queue against the real `About.md` block list at
   several scroll speeds, including instant jump-to-bottom, and assert reveal
   order is document order every time. This is the property that must not be
   left to on-screen spot-checking.
2. **Parser proof.** Run the extended `CaseMarkdown` parser over all 21 content
   files (7 Work, 13 Think, 1 About), printing the block sequence per file, and
   diff old-rule against new-rule output. This is what caught the ThinkCard01
   change; it catches what `tsc` cannot.
3. **Two-speed proof.** Verify the resting pace and the compressed pace
   separately: a still reader gets full pull-quote completion before the next
   item; a scrolling reader never waits on it, and order still holds.
4. **Zone proof.** Turn on `DEBUG.visibility` — it draws labelled `TF0`/`TF100`/
   `BF100`/`BF0` lines across the viewport — and confirm element opacity
   actually changes at those lines, at all three tiers.
5. **Say which files change visually, and how many.**

---

## 9. Deferred, flagged during this session

- **Reduce the number of type roles.** Mark's call, for later. The count is high
  partly through genuine duplication — `BODY` / `CASE_BODY` / `BODY_WELCOME` are
  three identical roles, one of them commented as mirroring another "in case
  adjustments are needed later." But the counter-pressure is real: `BAND_HEADLINE`
  and `ABOUT_PULLQUOTE` both exist *because* shared roles caused silent coupling.
  **The test is not "are these values identical" but "do these describe the same
  thing."** Identical *and* same-thing should merge; identical *by coincidence*
  should stay apart. A script grouping roles by exact value tuple would find the
  candidates; each group is then a judgment call.
- **`pullGapBefore` vs `pullGapAfter`.** The asymmetry is original and has been
  faithfully carried through three unit systems (`4vh`/`3vh` → `3.5em`/`2.5em` →
  tiered px) with **no recorded rationale**. Mark has now set them equal. If that
  reads fine, three numbers per tier collapse to two.
- **`ABOUT_PULLQUOTE` tablet tier.** `40px` replaced a clamp that ran fluid from
  31px to 51px across the tablet range. If widths near 1279 read badly, that is
  the strongest argument on the site for un-pausing fluid clamp-based scaling.

---

## 10. What this does not change

- The site vision, the leftmost-element principle, the single-room model.
- Any Work or Think content, or the case-panel rendering.
- The Welcome page's own scroll-fade implementations.
- The five page colours and the ambient lighting model.
