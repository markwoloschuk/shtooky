# shtooky.com — Project Bible v83

*Supersedes v82. **The site is live and this session's work is pushed.** This
session finished band-spec §4's geometry, judged `anchorY` against its own
measurement and lost, **built §5 — the fixed band — and deleted the old scroll
model**, and built the "animation finished" signal the bible has carried as a
gap for three sessions.*

*The finding under all of it: **v82's habit was a value you never supplied.
v83's is a coordinate captured before the thing it refers to can change.**
`bandDocY` was `window.scrollY` read at click time. It was correct at the
instant it was read and wrong 300ms later, and every Think scroll symptom —
the vibrating band, the empty space above the content, the part-scrolled
next/prev, the card landing low with a gap, the close popping into place — was
a different consequence of that one habit. **Nothing that USED the coordinate
was wrong. Deleting the coordinate is what fixed them.***

*Companion documents: `spec_sequencing_2026-08-25_v01.md` (at v03, untouched)
and `spec_band_model_2026-08-27_v01.md` — **§3, §4, §5, §7 and §8 now BUILT**;
§6's deletions are done except the spacer.*

---

## Purpose & context

Mark (also goes by Marko) is a San Francisco Bay Area–based freelance Creative
Director with 25+ years of experience, building shtooky.com as a primary
portfolio site targeting Creative Lead and Creative Director roles at tech
companies. Next.js 16 / TypeScript / Turbopack, deployed on Vercel. Claude is
Mark's primary technical partner across all sessions.

Mark is not a coder by background — his mental model comes from motion graphics
and After Effects expressions, and he actively wants the underlying web concepts
explained plainly rather than just applied. He judges all visual outcomes and
makes every aesthetic decision himself.

**Session-start ritual (standing instruction):**
When Mark drops the bible in, do NOT go read the whole codebase and come back
twenty minutes later with a report. Catch up to where we left off and suggest the
areas we might work on. Fast. His words: *"this might be a place where I would
value speed of interaction over not knowing what's happening and why it's taking
so long… I like to talk things through and understand what we are doing and why.
I'd like to keep those interactions pretty speedy if we can."*

*This session: bible in, folder access requested, four-item menu, first
targeted read only after he picked. Under a minute.*

The one caveat Claude raised and Mark accepted: **the bible is a narrative of
what we decided; the repo is what's actually true.** They drift. When a specific
number matters to what's about to happen, check that number and say so —
targeted, not a sweep.

*Three axes of disagreement now recorded. v81: **the repo and the BROWSER can
disagree.** v82: **the browser and CLAUDE'S MODEL of the browser can disagree,
and only instrumentation settles it.** v83 adds: **the bible and the repo had
drifted on the very first thing checked** — v82 said `DEBUG.thinkBand` was
`true`; the repo said `false`. Mark had flipped it. Cost: nothing, because it
was checked. That is the whole argument for the caveat.*

For simple, single-value mechanical fixes, Mark prefers to be pointed at the
exact file/line. Claude makes the edit directly when a change spans multiple
files, needs verification against the shared token system, or involves an
architecture judgment call.

**Mark edits the same files, live, while Claude is working in them.** Always
re-read immediately before writing, match on the constant NAME rather than its
current value, and never assume a number is what it was two messages ago.
*This session Mark set `BAND_OPEN_LANDED_AT` to 0.88 himself while Claude was
still describing the knob. Claude re-read and updated the comment to record the
judged value rather than overwriting it with the proposed one.*

**One thing at a time (standing instruction).** Present one decision, make the
change, look at it, then the next.

**Let Mark describe the intent before proposing the fix.** A description of
intent is a diff against the implementation.

*This session, again and decisively. **"if i open a card and then scroll down
and close that card. if i reopen it — it fades the content in scrolled down and
then it jumps back"** named the gesture, the precondition (having scrolled), and
the discriminator (same card reopened). That last word is the whole diagnosis:
the panel's scroll effect is keyed on `[file]`, and reopening the same card does
not change the file.*

*And earlier: **"if i immediately close and reopen that card it opens
correctly."** A position bug does not heal on the second attempt. That sentence
turned the search from "where is it drawing" to "what is different the second
time," which is what produced the two traces that differed in one number.*

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am (`/who-i-am`),
How I Think (`/how-i-think`), and Let's Talk (`/lets-talk`), plus a 404
(`not-found.tsx`).

**Site vision — "single room" (standing instruction):** The site is one
continuous atmospheric space. Content hangs like banners from the ceiling. Each
page region has its own ambient lighting (five page colors). Navigation is a
camera moving through that space.

**Leftmost-element principle (standing instruction):** NavBar and Footer are
deliberately the leftmost elements on any page, at any breakpoint — all other
content indents from that shared edge, via `FRAME_INSET_VW`. *Knowingly bent
twice:* the Who I Am skills-sphere canvas is full-bleed on mobile/tablet, and
that canvas escapes the content column via `bleed: true` on its `[slot]`, the
same treatment `SiteBackground` gets, because the atmospheric layer isn't
"content." Commented at both.

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`. When
superseding, write the new file under its own correctly-dated name and move the
old one to `can_probs_delete/old-bibles/` rather than reusing the path. *Note:
the repo's `old-bibles/` folder is missing v78 and v81 — the canonical copies
live in the Claude project.*

**Component naming.** A component used by more than one page takes the `Site`
prefix. Page-specific components keep their page prefix (`Who…`, `Work…`,
`Think…`, `Welcome…`, `Talk…`). Every component in `app/components/` carries a
prefix, so a file without one is a signal.

**Body copy dashes (in `AGENTS.md`).** Spaced en dash, never an em dash. The
space BEFORE it is a non-breaking space (U+00A0); the space after is a regular
space, so a dash can never be pushed to the start of a line. Content `.md`
carries the literal character; `.tsx` string literals use the escape ` `
so it is visible in source; JSX text uses `&nbsp;`.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## ⚠️ BEFORE THE NEXT PUSH

**Nothing outstanding.** Both debug flags (`DEBUG.thinkBand`,
`DEBUG.thinkBandTrace`) are `false` in the repo and the session's work is
pushed and live.

*But note what happened: the HUD flag was `true` for most of this session by
design, and the site was pushed with it on at least once. **A debug overlay
that renders on a live portfolio site is a different risk from one that renders
on localhost.** The next time a flag is left on deliberately, it belongs in
this section from the moment it is flipped, not at the end of the session.*

---

## THE THROUGH-LINE — tokens-first (read this first)

**What "hardcode" means** — explicit per-tier numbers, tuned by eye, living in
the tokens file. Not derived formulas. Not local component constants.

### The kinds of number (agreed framing)

- **Input** — a number tuned by eye, nothing derives it. → **Lives in the tokens
  file, tiered.**
- **Derived** — computed from inputs plus a real measurement. → **Never a
  token.** Stays in the component; every input it reads comes from tokens, and
  any fudge factor gets a name and a comment.
- **Exception** — a place that must differ. → `TOKEN + NAMED_OFFSET`.
- **A DURATION standing in for an EVENT** (v81) — **RESOLVED this session for
  Think.** See §4 below. The general form: a number that means "wait as long as
  X currently takes." It is a hand-maintained agreement between two files, and
  it is wrong the moment either changes. Work still has one.
- **A DEFAULT** (v82) — an optional parameter's value chosen once, at the
  definition site, on behalf of every caller that does not pass one.
- **NEW — a CAPTURED COORDINATE is a sixth kind, and it is the worst so far.**
  A position read from the live document and stored. It is not an input (nothing
  tuned it), not derived (nothing recomputes it), and not a default. It is a
  *measurement with an expiry date nobody wrote down*. `bandDocY = window.scrollY`
  was true for one frame. See everything in "Current state."

### The four resolution schedules

- **CSS-live** — a `vw`/`vh`/`clamp()` string. Re-resolved every paint.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
  Correct once, stale forever.
- **Fetched** — arrives after first paint. Anything that must be on screen before
  it resolves cannot live there.

**Rule: one mechanism per visual unit.**

*A captured coordinate is **Frozen**, applied to position rather than to size.
That is why it is worse: a stale size looks wrong, a stale position looks like
a completely different bug every time the page height changes.*

### THE HABIT BEHIND THE BUGS — the six generations

| version | the habit | example |
|---|---|---|
| v78 | a value **transcribed** from its token | visibility-zone literals |
| v79 | a value **wired to something that never changes** | `2.2em`; `[open, children]` |
| v80 | a value **you cannot see** | U+00A0 beside 30 en dashes |
| v81 | a **result you did not verify was produced by your code** | three "the fix didn't work" reports against a stale bundle |
| v82 | a value **you never supplied**, standing in as a plausible default | `scrollTargetY`; `offsetFor`; `caseIdx`; `activeIdx`; `containerWidth` |
| **v83** | a **coordinate captured before the thing it refers to can change** | `bandDocY`; `TRANSITION_DURATION` as a stand-in for landing time |

> **v83's line: a stored position is a measurement with an expiry nobody wrote
> down. If the document can change height, a document coordinate has already
> expired. The fix is never to refresh it — it is to stop needing it.**

---

## Current state — what shipped this session

### 1. `BAND_HEIGHT_TIERS` — §4's geometry, measured not derived

Band height was **one number, `480`, in NATIVE units on a 1440-wide stage**
(mobile × `MOBILE_BAND_HEIGHT_SCALE` 1.65), so the rendered band was always
`viewportW / 3`. A function of viewport WIDTH judged against viewport HEIGHT —
spec §2's core finding.

**The measuring method in the spec was wrong, and would have produced wrong
numbers.** §4 said: scroll until the crop reads right, read `window.scrollY`,
that is how many pixels to remove. It is not. On Think the band sits at
`bandDocY`, so the first `bandDocY` pixels of scroll only eat the nav clearance
above it — nothing is cropped until the band's top passes the viewport top. The
overstatement is `bandDocY`, and `thinkNavClearance` is tiered 177/136/104, so
it is a *different* error at each of the three widths being measured.

Replaced with a HUD line that reports the answer directly:

```
VISIBLE BAND H = min(bandTop + bandHpx, innerHeight) − max(bandTop, 0)
```

**And the first version of that line was also wrong** — it used
`getBoundingClientRect().height`, which returns the canvas's own box. The band
canvas is a full `window.innerHeight` element clipped down to a strip by
`clipPath`, and **`clipPath` does not change the layout box.** Mark's first
three readings — 721 / 997 / 795.5 — were viewport heights wearing a band's
label, and they looked entirely plausible. The second version computes the
strip from `_bandH` the way the drawing code does.

> **A measurement that returns a believable number is not a measurement. The
> instrument has to be verified against something already known — here, that
> `full strip` reads 480 / 256 / 214.5 at scroll zero.**

Mark's readings, and the result:

| width | was | now | removed |
|---|---|---|---|
| 1440 | 480 | **305** | −175 |
| 768 | 256 | **217** | −39 |
| 390 | 214.5 | **165** | −49.5 |

**No formula was fitted, and none exists.** As a share of viewport width the
three are 21% / 28% / 42%; as a share of height, 34% / 21% / 20%. Neither is
constant. That is the argument for tiers over a ramp, made by measurement
rather than by assertion.

**One resolver, `bandHeightPx(viewportW)`, replaced SIX copies** of
`viewportW * (_bandH / NATIVE_W)` across `ThinkGridCanvas` (five) and
`ThinkPageController` (one, which had drifted into its own comment claiming
`33.333vw`). `_bandH` is now derived — screen px in, native out, at one site in
`scaleStage` — so every existing consumer keeps working in its own coordinate
space. Verified by round-tripping eleven widths: exact at all of them.

**Accepted trade:** flat tiers drift across their range and step at the
breakpoint. A 2560-wide desktop now gets 305 where the old ramp gave it 853 —
which is the point.

Two dead exports went with it: `BAND_HEIGHT` and `NATIVE_W` from
`ThinkGridCanvas`, whose only importer was the controller doing the
recomputation.

### 2. `anchorY` — wired, set to 1 by the measurement, then overruled to 0

`anchorY` was v82's own built-and-unused flag, and was explicitly recorded as
"if the band work stalls, take it out." It didn't stall.

The measurement *implies* bottom-anchoring: heights were approved by scrolling,
which removes only the top, so shrinking the band at the default `0.5` would
tighten from both ends and show a frame that was never approved on all thirteen
cards. `BAND_ANCHOR_Y = 1` reproduces what was judged with no per-case numbers.

**Mark looked at the actual images and said top.** `BAND_ANCHOR_Y = 0`. The
comment above the token still argues for 1, and now says so explicitly, because
otherwise it reads as a mistake.

> **A measurement can settle a dimension without earning the right to settle
> the composition. The scroll test decided how TALL the band should be
> honestly; it had no standing to decide which part of the photograph survives.**

Threaded through `drawCardAt` / `drawImageCover` **explicitly**, not inferred
from the existing `unit` parameter. The two coincide at every current call site
— the band is the only caller with `unit !== 1` and the only one wanting a
non-centre anchor — but that is a coincidence of the callers, not a
relationship. (v79: a dependency on a proxy is not a dependency.)

### 3. §5 — THE FIXED BAND, BUILT, and the old scroll model deleted

The largest change of the project, and the prototype made it cheap.

**The prototype answered its question immediately.** Spec §6 called the handoff
frame — the moment the open animation lands and hands off to `position: fixed` —
"the one genuinely risky piece," and said prototype it first. It was smooth on
all three tiers on the first try, for a reason that was predictable and was
predicted: **scroll is locked for the whole open animation**, and `bandDocY` was
`window.scrollY` at click, so `absolute; top: bandDocY` and `fixed; top: 0`
resolve to the same screen position. The handoff was never a move. It was a
change of coordinate system.

**Then it turned out there should be no handoff at all.** The band is now
`position: fixed` **for its entire life** — from mount, through open, through
close, until it unmounts. `bandFixed` is not state; it is `bandMounted`.

That single decision deleted three bugs Claude had introduced in the previous
half hour trying to make a mid-animation handoff work:

| bug | cause |
|---|---|
| image still scrolled away | imperative `el.style.position` clobbered by any re-render re-applying the JSX inline style |
| card appeared low with a gap, then popped | `window.scrollTo` is synchronous, `setBandFixed` is a React state update — written adjacently, executed a frame apart |
| gap proportional to scroll depth, only when scrolled | the same one-frame window, seen at its worst |

> **Adjacent in source is not simultaneous. An imperative DOM call and a state
> update written on consecutive lines run on different clocks.**

**What was deleted:**

- **`enableScrollFloor` / `disableScrollFloor`** and their handler ref. Two
  things were wrong with the floor, and the fixed band removes both. *It could
  not work*: `{ passive: true }` means it can only correct a scroll that already
  happened, and its own `scrollTo` emits another `scroll` event — so pushing up
  at the floor set browser momentum against a per-frame yank, which is the
  **vibration**. *And it did not fire at all* on any card opened from the top of
  the page, where `bandDocY` is 0 and `scrollY < 0` is never true. **The default
  case had no floor.**
- **The document anchor.** Content is at a constant document position under a
  viewport-fixed band. This alone removed the empty space above the content, the
  part-scrolled next/prev, and the two-phase placement jump — one dependency,
  three symptoms.
- **The grid-bound clip** during opening/closing, built from `bandDocY` and
  `gridDocBottom`, and **`gridDocBottomRef`**, which existed only to feed it.
- **`onBandPositioned`** and the controller's `bandDocY` state. The parent no
  longer needs to know where the band is, because the band isn't anywhere in the
  document.
- **`bandFixed`**, which became a constant and then nothing.

`bandDocY` survives in `ThinkGridCanvas` with exactly one job: **the scroll
position to return the reader to when the card closes.** It positions nothing.
It is a bookmark, not an authority.

**`ThinkGridCanvas` went from 9 ESLint problems to 8.** The file got smaller.
That was §5's actual purpose and it is worth recording as the measurable part.

**Still outstanding from §6:** the spacer. Document height is still governed by
the grid rather than by the content — see item 5.

### 4. The "animation finished" signal — BUILT, and `TRANSITION_DURATION` is a rate

The bible has carried this as a gap for three sessions: *"Three places want the
same thing and none have it."* It now exists on Think.

`ThinkGridCanvas` fires **`onOpenLanded`**; `useCasePanel` takes a **`landed`**
prop and gates the open fade on it. `OPEN_DELAY` is demoted to a fallback for
callers with no signal, which is Work — so the two panels migrate
independently.

**And building it exposed that the number it replaced was not just fragile but
wrong.** `CFG.TRANSITION_DURATION: 750` is **not a duration.** Line 886 is an
exponential approach:

```js
sp2 = clamp(dt / CFG.TRANSITION_DURATION * 2.2, 0, 1)
openProg = lerp(openProg, target, sp2)   // lands at |openProg − 1| < 0.006
```

Simulated at 60fps, the card takes **~1717ms** to reach that threshold. So
`OPEN_DELAY = 750`, documented as "matching `TRANSITION_DURATION`," was **967ms
early** — it fired while the card was still crawling through its final tenth.
*That early start is what every Think open had ever been judged against.*

Which is why the honest version immediately felt too slow: nothing got slower,
the real end of the animation became visible for the first time.

The knob is therefore **not a delay**. `BAND_OPEN_LANDED_AT` is a fraction of
the card's own travel at which the landing is declared:

| value | copy starts | |
|---|---|---|
| 0.80 | ~550ms | |
| **0.88** | ~700ms | **judged** |
| 0.90 | ~767ms | the old behaviour |
| 1.00 | ~1717ms | full settle |

A fraction survives a change to `TRANSITION_DURATION`; the hand-matched 750 did
not.

**The scroll moved to the click to make the overlap possible.** While the
scroll-to-top happened at the landing, the fade could not start earlier without
the content appearing at the old scroll position and being yanked. It can only
move because the band is fixed and `fromRect` is captured in viewport space
before the scroll — so the card still starts exactly where it was clicked.

> **A constant named DURATION that is actually a RATE. Nothing in the file said
> the card takes 1717ms, and the value that was supposed to match it said 750.**

### 5. The spacer does not preserve document height — v82 said it did

v82 recorded, while killing a hypothesis: *"`spacerRef` inflates by exactly the
height `wrapRef` loses… **Document height is preserved to the pixel.**"*

Measured this session: `wrap.height` reads `301.919` against a `305` band strip.
The document ends up **~16px shorter** when a card is open. The claim was
asserted as exact and is not.

That 16px produced two real bugs, and both were fixed by **ordering**, not by
removing the mismatch:

- **Open.** Clicking within the last ~16px of scroll captured a `bandDocY`
  larger than the shortened page's `maxScroll`. The browser clamped the scroll
  up; the band, anchored below, sat 16px down the viewport with black above it.
  It healed on a second open because by then the clamp had already happened.
  **Fixed by the band being fixed from mount** — a viewport coordinate cannot be
  invalidated by a document height change.
- **Close.** `closeCard` scrolled to the bookmark *while the grid was still
  collapsed*, so the bookmark was past that document's `maxScroll` and got
  clamped; the page then grew back under a truncated scroll position and the
  card animated home ~16px off. **Fixed by restoring the grid height BEFORE
  scrolling.**

> **Same class, both ends: an operation performed while the document is a
> different height than the coordinate assumes.**

**The root is still there.** Removing the spacer — content in normal flow with
`padding-top: bandHeight` — deletes the 16px, both order dependencies, and the
last of §6's four authorities. Next session.

### 6. Claude's own failures this session, recorded

Four, all mine, all worth keeping because the pattern is consistent:

1. **Measured the wrong box.** `getBoundingClientRect()` on a `clipPath`-clipped
   canvas, handed to Mark as the measuring instrument. Returned viewport
   heights that looked like plausible band heights.
2. **Three confident mechanisms for the disappearing card**, in sequence: image
   load, the grid-bound clip, a stale start rect. All three were coherent, all
   three referred to real code, all three were wrong. The answer came from two
   HUD traces that differed in exactly one number: `bandDocY 1094.5` versus
   `1078.5`, against `maxScroll 1078`.
3. **A trace too short to see the bug.** The first instrument captured 8 frames
   of an animation whose problem was in the second half.
4. **A gate that failed closed.** The `landed` gate turned a timing problem into
   a *visibility* problem: if the signal never arrives, the content never
   appears at all, and the reader gets a blank card with nothing to scroll.
   Now falls back to `openDelayMs + LANDED_GRACE_MS`.

> **A gate on WHETHER something appears is a different and much worse thing than
> a delay before it appears. Any gate on content must fail open.**

---

## THE LOOP — how the diagnosis went, third session running

v81: three fixes declared broken against a stale bundle. v82: two wrong
mechanisms before turning the HUD on. v83's version is longer and the lesson is
sharper, because the pattern was unmistakable:

- **Every loop that went well started with an instrument. Every loop that went
  badly started with a theory.** The band heights, the vibration, the
  disappearing card and the close jump were all settled by numbers. The three
  wrong mechanisms cost the most time.
- **The instrument itself has to be verified.** Twice this session an instrument
  produced believable wrong output — the wrong box, and the too-short trace.
  *An unverified instrument is a theory with better formatting.*
- **Mark's descriptions did the discriminating work**, three times: "if I
  immediately close and reopen it opens correctly" (a load or a state, not a
  position), "if I reopen it" (the same file, so the effect does not re-run),
  and "sometimes it shows the top — but only sometimes" (content-dependent).
- **Claude owned each wrong claim in the message that corrected it**, per v80.
- **NEW — the useless correlation.** "It happens when I scroll down" was true
  and was not the cause; scrolling down is merely how you reach a state where a
  captured coordinate has expired. *A reliable reproduction is not a mechanism.*

Standing rules, carried and sharpened:

- **Confirm what is running before diagnosing why it isn't working.** *This
  session's instance: Mark reported iOS bugs "on the actual site" and it was
  not established whether the deployed build contained the fix under discussion.
  Asking took one message.*
- **A private tab is the only valid mobile test surface.**
- **Two plausible mechanisms is the signal to measure, not to pick.**
- **Prefer instrumentation that persists behind a flag.**
- **NEW — do not diagnose against production.** It has no HUD, no numbers, and a
  deploy cycle between each attempt. The LAN dev server plus Web Inspector is
  the surface; production is where you confirm, not where you investigate.
- **NEW — a debug flag left deliberately on belongs in BEFORE THE NEXT PUSH the
  moment it is flipped**, not at the end of the session.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see
v73/v74/v75/v77/v78/v79/v80/v81/v82.)*

- **NEW — A stored position is a measurement with an expiry nobody wrote down.**
  If the document can change height, a document coordinate has already expired.
- **NEW — Do not refresh a stale coordinate; stop needing it.** Four position
  authorities did not need reconciling, they needed deleting.
- **NEW — Adjacent in source is not simultaneous.** An imperative DOM call and a
  React state update on consecutive lines run a frame apart.
- **NEW — An imperative style on a React-rendered element is a hand-maintained
  agreement that any re-render breaks.** Drive it from state, or accept that it
  will be silently undone.
- **NEW — A gate on whether content appears must fail open.** A delay that
  misfires is a timing bug; a gate that misfires is a blank page.
- **NEW — A measurement that returns a believable number is not a measurement.**
  Verify the instrument against something already known before trusting it.
- **NEW — A constant named DURATION can be a RATE.** An exponential approach to
  a threshold takes far longer than its rate constant suggests — 750 meant 1717.
- **NEW — Express a timing knob as a fraction of the animation, not a
  millisecond count.** A fraction survives a change to the animation; a
  duplicated duration does not.
- **NEW — A measurement can settle a dimension without earning the right to
  settle the composition.**
- **NEW — A passive listener can only correct, never prevent** — and correcting
  a scroll emits a scroll, which is an oscillator.
- **NEW — A reliable reproduction is not a mechanism.** "It happens when I
  scroll down" was true and irrelevant.
- **NEW — A prototype's job is to kill a fear, and it is allowed to succeed
  immediately.** §6's "genuinely risky piece" was risk-free for a reason the
  spec had already written down.
- Carried forward from v82: an escape hatch added at extraction time is not
  wired just because it exists; a default is a decision made on behalf of every
  caller that doesn't pass one; a ref meaning "what is on screen" must be
  cleared by every path that clears the screen; a prop declared, passed and
  never read is worse than an unused variable; two plausible mechanisms means
  measure, not choose; instrumentation behind a flag survives, instrumentation
  behind a comment does not; verify a refactor by simulating both formulas over
  random inputs; a tier that has no tier still has a value.
- Carried forward from v81: before diagnosing why a change had no effect, prove
  the change is running; "clear on null" is not "clear on change"; a CSS
  transition that starts in the same commit as its element's mount does not
  animate; a cache can turn a timing race into a per-item behavioural difference;
  introducing a gate introduces a race; a `useCallback` with no deps can be
  load-bearing; an element whose only child is `position: absolute` measures zero;
  a duration standing in for an event is a countdown; two gestures sharing one
  number look like consistency and are a conflation; when the user says they
  don't understand the choice, explain the cost, don't simplify the question.
- Carried forward from v80: an invisible character is a value no search can
  confirm; never test for an invisible character with a literal copy of it; a
  search that comes back empty is not proof; when a repeated action reads as
  harsh, check whether it is doing something meant to happen once; a default that
  satisfies one caller lies to every other caller; a dimension derived from the
  wrong axis fails in one direction only; two tiers arriving at the same value
  from opposite directions are a gap; two pages doing the same thing at different
  cardinalities is not inconsistency; keying a list by index across a wholesale
  content replacement is a bug on its own terms; a bible entry can be stale by
  being FIXED; when you cannot find the mechanism, prove the symptom is older
  rather than assuming it.
- Carried forward from v79: a dependency on a proxy is not a dependency; when the
  fix makes a dependency unnecessary, delete it; a UI shipped without its backend
  fails exactly like a feature nobody used; a signal accepted and never read;
  prefer the address space where the collision cannot happen; a prop with a
  default no call site overrides is an untiered number in the costume of an API;
  when two of three tiers coincide with an existing token, say so out loud; the
  same token can require different arithmetic per container; record the check that
  came back clean; a description of intent can delete the proposal.
- Carried forward from v78: a value transcribed from a token is worse than no
  token; a count of on-screen items is a viewport-dependent number in a
  viewport-independent costume; moving something into a container silently
  rescales anything sized relative to the VIEWPORT; two numbers can be identical
  and mean opposite things; an index-arithmetic relationship between
  separately-authored things is one content edit from breaking silently; when a
  fast path skips the waiting, check what else the waiting was doing; design a
  diagnostic that can distinguish the hypotheses; simulate the property, don't
  spot-check it; a parameter accepted and never read is a lie the compiler won't
  catch; a capability built and never used should be found before it is defended.
- Carried forward from v77: a comment asking two copies to stay in sync is a
  countdown; encoding a value into a NAME makes every new value a code change;
  content needed before a fetch resolves cannot live in the fetched file; a
  silently-skipped block type is invisible failure; macOS lies to you about case;
  `[br]` at end of line is a break AND a collapsed newline; an explicit override
  that skips a fallback chain fails worse than no override; when one file says
  "matches the other file," that IS the bug report; a responsive rule that
  "helpfully" reduces can destroy an authored composition; check the coordinate
  space before declaring a scaling bug; a default that contradicts its own doc
  comment will mislead someone for months; a gap assembled from two paddings isn't
  a gap, it's a coincidence; read what the person actually wrote.
- Carried forward from v75: a track-matte layer that ends before the layer it
  mattes is a latent cross-browser bug; read a file's STRUCTURE before theorising;
  a shrink-to-fit fitter silently takes over the value it guards; where someone
  instinctively looks for a value is evidence about where it belongs; a canvas
  hard-clips at its own box mid-glyph; widening a container silently resizes
  anything sized from container width; a flat threshold compared against a resting
  position is a breakpoint bug waiting to happen.
- Carried forward from v74: `position: absolute` children contribute nothing to
  intrinsic height; a frozen JS pixel value and a live CSS `vw` are two trust
  models that can disagree; `ResizeObserver` reports settled boxes; imperative
  measurement plus declarative styling drift apart without an explicit dependency
  array; when a person says they can no longer follow how a system works, that's a
  signal about the system.

---

## Approach & patterns

- **NEW — Prototype the piece the spec calls risky, before the work that depends
  on it.** One flag, one evening, and §5 stopped being frightening.
- **NEW — Put the deletion in the same session as the migration.** The prototype
  briefly left the repo holding TWO scroll models, which is worse than either.
  The win is the deletion; a flag is not a destination.
- **NEW — When an instrument disagrees with the eye, verify the instrument
  first.**
- **NEW — Say which symptoms are expected to remain** after a partial change, so
  the next report separates signal from known noise.
- Carried forward from v82: sweep for the class after the second instance;
  record the audit that came back clean; name what you built and did not use, in
  the same message.
- Carried forward from v81: ask for instrumentation instead of guessing a fourth
  time; test in a private tab before reporting a result; extract at the moment you
  were going to rewrite it anyway; re-read immediately before writing and match on
  the NAME, not the value; when syncing values across files, confirm the scope of
  "both."
- Carried forward from v80: own the wrong claim in the same message that corrects
  it; assert-count, don't replace-and-hope; restore what you changed but were not
  asked to change; write the spec when the conversation has already found the
  model.
- Carried forward: write the spec before the code when the change spans a system;
  record the mistake, not just the fix; generate migrated content, never retype
  it; own the flagged risk that was not checked; one decision at a time, and let
  it be overruled; offer deletion before parameterisation; simulate a parser
  against real content before believing it; say which files change VISUALLY and
  how many; bible-drop means catch up fast and offer a menu; verify a test rig
  before trusting a null result; recalibrate in the same change that causes the
  drift; fix stale comments in the same pass as the code they describe; point to
  file/line for simple mechanical fixes; propose a mechanism plus a reasoned
  starting guess and let Mark's live judgment set the number; full-file
  replacement over accumulated patches; always read current file contents before
  editing; diagnose fully before touching code; explain the mechanism before
  proposing the fix, in the message that proposes it; change one visible thing per
  pass; name the thing you did NOT do; verify the claim you just made, with the
  thing itself.

---

## On the horizon

### ⚠️ OPEN DEFECTS ON THE LIVE SITE — Think, iOS first

**These were reported against the deployed build and are NOT diagnosed. Do not
theorise; instrument on the LAN dev server with `DEBUG.thinkBand` on.**

1. **Step (next/prev) keeps the previous scroll position — mobile Safari only.**
   Scrolled into a card, pressing next delivers the following card already
   scrolled, repeatedly. `useCasePanel` DOES call `window.scrollTo(0, 0)` on
   every step (the `[file]` effect); desktop obeys it, iOS apparently does not.
   iOS Safari ignoring a programmatic scroll issued from a promise while
   momentum is running is a real behaviour, but which frame is lost is unknown.
   **Untested against the fail-open build.**
2. **A stepped-to card showing NO content at all**, unscrollable, recovering when
   you step back. **Believed fixed** by the fail-open backstop (item 6 above),
   which landed after the report. Confirm before assuming.
3. **Image quality shifts on the last frame of a close.** Desktop Safari, worst
   on fine detail. Explained, not fixed: the band canvas is sized
   `innerWidth × devicePixelRatio`, the grid stage canvas is
   `NATIVE_W × TOTAL_H` scaled by CSS — two different effective resolutions
   resampling the same photograph, swapped at the handoff. **Pre-existing, not
   caused by this session.**
4. **The card motion wiggles, worse on close than open, desktop only.** Mobile
   and tablet went smooth with the fixed band; desktop did not. Untested
   hypothesis: the grid canvas draws each cover **centred** while the band
   canvas draws it **top-anchored from the animation's first frame**, so the
   framing slides as the rect changes height. The fix, if so, is to lerp the
   anchor from 0.5 to `BAND_ANCHOR_Y` alongside the shape.

### THE BAND MODEL — §3, §4, §5, §7, §8 built; the spacer is what's left

**`spec_band_model_2026-08-27_v01.md` in the project.**

**6. Delete the spacer — NEXT, and it is the root of item 5 above.** Content
into normal flow with `padding-top: bandHeight`, grid out of flow, spacer
deleted. That removes the ~16px document-height mismatch, both of this
session's ordering dependencies, and the last position authority. **Also
removes the need to scroll on open at all** — which would, in turn, make the
iOS step-scroll problem moot rather than fixed.

**§4's remainder: `sizePx` is still a native reference value** while
`tabletSizePx` and `mobileSizePx` are real screen pixels — three fields, one
object, two coordinate spaces, which is why `WorkCarousel` divides by its stage
scale and `ThinkGridCanvas` multiplies. **This became non-cosmetic this
session:** desktop's headline still ramps with width while the band it sits in
is now flat at 305 above 1280, so a 2560 display gets a 92px headline in a
305px band. Making it flat is the consistent answer. *Coupling to know:
`sizePx` also serves as the DENOMINATOR that turns `lineHeightPx` into a ratio
(`unitPx = actualSize / sizePx`). It survives the change — desktop `unitPx`
becomes exactly 1 — but the two fields are wired together in a way neither name
admits.*

**`lineHeightPx` needs no tiers.** Checked: it is a ratio wearing desktop
pixels, 1.058 at every tier (55/52, 42.3/40, 29.6/28), because both files scale
it by `unitPx`. Three Think cards are two-line (08, 12, 13) and none is broken.
Tiering it is a taste question — a 28px mobile headline gets the same tight
display leading as a 52px one — not a defect.

**Work is untouched.** Still `CH = 480`, still the old scroll model, still
`MOBILE_BAND_HEIGHT_SCALE` (which is why that token is not dead and is
commented as such). **Blocked on spec §11's open question:** Work is tall while
browsing the carousel and narrow when a case is open — two heights — where
Think has one. Confirm that asymmetry is intended before measuring Work's
tiers.

**Content audit is still the part only Mark can do:** twenty band images that
must survive losing their bottom (now that `anchorY` is 0, not 1). Think's
thirteen are doubly constrained because the covers are composed for the bento
grid *and* become the band.

### The "animation finished" signal — one of three places done

Think has it. Two remain, and both now have a pattern to copy:

- **Work's body copy** has the same latent problem; `OPEN_DELAY = 0` only
  because it is untuned. `useCasePanel` already accepts `landed`; Work simply
  does not pass it.
- **`WelcomeHeroAnimationResponsive`** takes only `autoPlay`, unlike its two
  siblings which both have `onComplete` — which is what blocks the Welcome
  bottom-heavy fix.

### `CASE_FADE` tokens

Six numbers per panel, tuned by eye, nothing derives them — inputs by the
through-line's own definition, currently twelve constants in two files with
nothing keeping them in sync. *Note: Think's OPEN values have still never been
properly judged — v82 found they were running step values, and this session
changed when they fire. Judge before consolidating.*

### Splitting the bible — proposed twice now, declined twice

The bible has grown 28KB (v75) → 40KB (v81) → larger again here, and it is
dropped in at the start of every session. **Proposal stands: split the
carried-forward principles into a `principles` doc updated rarely, leaving the
bible as current-state plus horizon.** Mark chose "v83 as usual" this session.

### Welcome — the bottom-heavy page, discussed and not built
`page.tsx:53` is a flat `35vh` spacer that never changes; every later component is
added BELOW it, so bottom-heavy is the arithmetic. **Moving the content beats
moving the viewport.** **Blocked on the completion signal above.** Open choice:
two settled positions, or a measured `(viewportH − revealedH)/2`.

### DMARC — top infrastructure item
Cloudflare is prompting. The Resend sender is proven. Start at `p=none`.

### Squarespace 404s — DECIDED, closed
~60 old project URLs, no redirect map. **One action left:** check LinkedIn's
website field, the résumé PDF in the Resume panel, and Vimeo/Behance/YouTube
descriptions for deep links to old project pages.

### Let's Talk — the location animation
`LocationPanel` shows `/images/talk/map_placeholder.jpg` at 16:9, with a comment
saying to swap it for the zoom animation, same slot.

### Reading measure for IMAGERY — Mark's bookmarked idea
**Not "narrower or not" — whether images are one category or several.**

### Untuned, deliberately
- **`BAND_HEIGHT_TIERS`** — 305/217/165, measured tonight at 1440/768/390 and
  judged good. Watch the flat tiers at the extremes: 1100–1279 and above 1920.
- **`BAND_ANCHOR_Y`** — 0. Gates on the content audit across twenty images.
- **`BAND_OPEN_LANDED_AT`** — 0.88. Re-judge if `TRANSITION_DURATION` changes.
- **`BAND_HEADLINE.tabletSizePx`** — 40. Judge at 768 and at 1100–1279.
- **All `CASE_FADE` numbers.**
- **`NOT_FOUND_COLOR_HOLD_MS`** — 4000. `COLOR_TRANSITION_SECS` (2) is **shared
  with navigation**.
- **`LOGO_GRID_TIERS.gapPx`** 14; **`logoPct`** 72.
- **`CONFIG.SENT_HOLD_MS`** in `TalkOptions` — 3000.
- **The Resume panel's `height: "70vh"`.**
- **`SEQUENCE` in `SiteTokens`** — whole pacing surface. **Known hazard: the
  deadzone is tested per scroll EVENT**, so holds may behave differently by INPUT
  DEVICE rather than reading speed.
- **All band-model geometry numbers** — spec §10.

### Open design question — the double height animation
After sending, the Let's Talk panel shrinks to fit the confirmation, holds, then
collapses. Two height animations back to back. Unchanged, uncalled.

### `BF0` / `BF100` desktop
*"Looks great on mobile, too eager on desktop."* Lower desktop `BF0` (95 → 92–90);
widen `BF0 − BF100`. `SiteTokens.tsx` ~657–658. Tune with `DEBUG.visibility` on.

### The top gradient
`SiteScrollConfig`'s top gradient is commented out and re-implemented in
`SiteNavBar` as `NAV_GRADIENT_HEIGHT` (180/120/90 **px**), a separate mechanism in
different units. `TF0` and `TF100` remain **dead tokens**.

### Also dead in `VISIBILITY_TIERS`
`getScrollConfig()` and the `_config` store have zero consumers. So do `revealMs`,
`staggerMs` and `idleMs`. `VISIBILITY_TIERS_DESKTOP` is a duplicate copy inside
`SiteScrollConfig`.

### The scroll-fade family — Welcome is the remaining job
**Eight separate `const SCROLL_FADE = {…}` objects in eight files.**
`WhoSkillsSphere` doesn't use its own — **and its only reader,
`getScrollOpacity`, is dead code deliberately left in place until this pass
happens.** Who I Am and Let's Talk are done.

### Type-role consolidation
`BODY` / `CASE_BODY` / `BODY_WELCOME` are three identical roles. **The test is not
"are these values identical" — it is "do these describe the same thing."**

### Content — remaining
- **`[note]` in `ThinkCard01`** holds an author comment. Convert when next in that
  file.
- **`ThinkCasePanel` renders `{fm.subtitle}` raw.** `[br]` works in card titles
  and body blocks and silently does not in the frontmatter subtitle.
- **`WorkCarousel` hardcodes `window.innerWidth < 768`** in `scaleStage` instead of
  `BREAKPOINTS.tablet` — **and that file contains both spellings**, since the
  tablet branch uses `BREAKPOINTS.laptop`. *`ThinkGridCanvas`'s copy was fixed
  this session as a side effect of the `_bandH` change.* One-line cleanup.
- **Trailing whitespace** in 13 content files.

### Work case 01 — 12 videos wired
`SiteGallery` has **no caption or title rendering at all**. Putting the twelve
episode titles on screen is a feature.

### Deferred by decision
**Gallery poster precedence** — chain is `maxresdefault → hqdefault → folder
image`, so a hand-made poster is the FALLBACK and never shows. Left as-is.

**Crop default stays `4by3`.** Decided, not deferred.

**The landscape / short-viewport guard.** Diagnosed in v77, not built.

**`interruptGapBefore` vs `interruptGapAfter`.** Equal at all three tiers.

**NBSP normalisation was rejected in favour of adoption.**

**The blocks' permanent `transition: opacity`.** Considered as a compositing
mitigation and **not built**. If ghosting returns, verify the layer count in Web
Inspector before acting.

### The tokens-first migration, continued
- **Still-flat spacing values:** `LINE_GAP_PX`, `ROW_GAP_TOP`/`ROW_GAP_BOTTOM`,
  `lineGapPx` (Welcome CTA), `marginTop: 24` on the Work text block.
- **The `vh` spacers.** Welcome five (`35vh`, `8vh`, `4vh`, `3vh`, `20vh`), Who I
  Am two, Let's Talk one.
- **Hardcoded font sizes on no token:** `TalkOptions` (16/15/17), `SiteNavBar` (9),
  `WhoSkillsSphere` (11), `ThinkGridCanvas` (11), the figcaption/counter 13s in
  both case panels, `clamp()` leftovers in `ThinkBelowPlaceholder` and
  `SiteTextBlock`.
- **Delete the legacy `TYPE`/`COLUMN` static exports.** Ten files still import
  `TYPE`.
- **`const N = 7` in `WorkCarousel.tsx`** duplicates `WORK_MANIFEST.length`.

### Duplication that has already drifted
- **RESOLVED this session: six copies of the band-height conversion.** Now
  `bandHeightPx()`.
- **RESOLVED in v82: the two cover-fit implementations.** Now
  `SiteCanvasCover.drawCover`.
- **RESOLVED in v81: the two case panels.** Now `useCasePanel`.
- **`TAGLINES` in both hero files — DELIBERATE, now recorded.** Four of seven lines
  differ. *No mechanism keeps them in sync.*
- Colour helpers (`rgbToHsl`/`hslToRgb`) duplicated across the two hero files.
- `BODY_WELCOME`/`BODY`/`CASE_BODY` are three identical token roles.

### The Welcome hero sizing race — still unresolved
Both heroes compute the headline font size from a one-time `window.innerWidth`
read frozen into pixels. *`not-found.tsx` demonstrates the CSS-live alternative in
three lines.*

### Known-wrong maths, flagged and not fixed
- `WhoSkillsSphere` fog: `coreR` produces a gradient radius in the tens of
  thousands of pixels.
- `WhoSkillsSphere` `particleSpread` used two ways in the same file.
- `WelcomeHeroAnimation`'s `lineH * 0.76` cap-height guess.
- `SPACE.layout.talkNavClearance` and `SCROLL_FADE_TIERS` must agree by hand.

### Other open items
**The AE source of the Lottie fix.** `thinking-open.json` is fixed in the repo; the
After Effects project is not. Two other layers have the same lifespan mismatch.

**Code health.** `npx eslint app` reports ~60 problems, nearly all pre-existing.
**`ThinkGridCanvas` dropped from 9 to 8 this session** — the file got smaller,
which was §5's point. *One known cluster: four "Cannot access refs during
render" errors from the callback-ref-sync pattern
(`someRef.current = someProp` at the top of the component). Worth fixing as a
group; fixing one of four would make it the odd one out.* Next 16 does not run
ESLint during `next build`. `npm audit` reports 7 vulnerabilities; **do not run
`npm audit fix --force`.**

**Carried over, untouched:** hamburger menu polish; navbar gradient 3-stop
proposal; backdrop-filter blur behind navbar; uncapped `COLUMN_TIERS.desktop.vw`;
fluid clamp-based body-copy scaling (paused); full five-page three-breakpoint
visual pass; Who I Am's perceived right-bias on tablet; the stale "copied from
desktop as placeholder" comment on `TYPE_TIERS`' mobile tier; coding-literacy side
project.

**Infrastructure.** Contact form: **DONE, with spam protection.** Remaining: delete
the unused `ftp` A record (`98.129.229.120`). **DMARC.** Squarespace redirects:
**closed, decided against.**

---

## Tools & resources

- **Stack:** Next.js 16.2.9 / TypeScript / Turbopack, Vercel (Hobby, auto-deploy),
  GitHub + GitHub Desktop, VS Code. `resend` ^6.24.0.
- **Domain & DNS:** `shtooky.com` — registered at GoDaddy, DNS at Cloudflare
  (Free), all records DNS-only, pointing at Vercel. MX/SPF route
  `mark@shtooky.com` through Laughing Squid/Rackspace. **`send.shtooky.com` is the
  Resend sending domain.** 11 DNS records total. Squarespace fully retired.
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then phone (same
  Wi-Fi) → `http://10.0.0.154:3000`. **This — not production — is where iOS bugs
  get diagnosed.**
- **Safari Web Inspector over USB is the diagnostic tool of record for mobile.**
  iPhone Settings → Apps → Safari → Advanced → Web Inspector; Mac Safari →
  Settings → Advanced → Show features for web developers; plug in, Trust, then
  Develop → iPhone → the tab.
- **A private tab is the only valid mobile test surface.**
- **Live DevTools breakpoint workflow:** custom device presets at exact px (iPhone
  390×844, iPad Mini 768×1024, Desktop 1440×900), device toolbar undocked,
  side-by-side with a real non-emulated window.
- **`DEBUG` flags in `SiteTokens`:** `visibility` draws labelled zone lines;
  `sequence` traces every queue decision; **`thinkBand` draws a live HUD over How
  I Think** — mode, the band's on-screen top, `VISIBLE BAND H` and the full
  strip, `DETAIL TOP ON SCREEN` and the detail div's own `top`, `maxScroll`, doc
  height, `bandDocY` (labelled as the close bookmark); **`thinkBandTrace` (NEW)
  adds a 40-frame per-frame record of the opening animation**, kept after the
  animation ends so it can be read at rest. Split from `thinkBand` because 40
  lines swamps a phone screen. **Both `false`.**
  - *The HUD is portalled to `document.body`.* It used to render inside the grid
    wrapper, where an ancestor's stacking context capped its `z-index` no matter
    how large — it was not losing to the navbar (max 45), it was losing before
    the comparison happened.
- **Claude-side environment:**
  - **Screen recording is GRANTED.** Safari can only be granted at **read** tier.
  - `device_bash` runs in a sandboxed **Linux** VM with the repo mounted — NOT
    macOS. It cannot reach `localhost:3000`, cannot run `next build`, and **cannot
    delete files**. **It has no browser.**
  - **Do not run `git` commands from `device_bash`.** They create
    `.git/index.lock`, which git then cannot remove. *Consequence felt this
    session: Claude could not verify which commit was deployed and had to ask.*
  - **`npx tsc --noEmit` DOES work there** and was run after every edit this
    session. **`npx eslint app` also works.**
  - **`node` works** — used this session to simulate the open animation's
    exponential and establish that a 750 rate constant means a 1717ms landing.
  - The cloud container (the `Bash` tool) is a separate machine with restricted
    network — GitHub and Google Fonts are blocked.
  - **Heredocs normalise invisible characters.** Never pass a literal U+00A0
    through one. Base64 is the general form of the precaution.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS, COLUMN_TIERS,
  TYPE_TIERS, SPACE, SEQUENCE, TIMING, NAV, FOOTER, VISIBILITY_TIERS,
  LOGO_GRID_TIERS, BAND_HEADLINE, **BAND_HEIGHT_TIERS + `bandHeightPx()` (NEW)**,
  **BAND_ANCHOR_Y (NEW)**, **BAND_OPEN_LANDED_AT (NEW)**, BAND_VIGNETTE, DEBUG,
  hooks, `getActivePage` + `isKnownPage`, `useBreakpoint` — a LAYOUT effect);
  `SiteCanvasCover.ts` (`drawCover`); `SiteCasePanel.tsx` (`useCasePanel`, now
  with the `landed` gate); `SiteRevealQueue.tsx`; `SiteCaseMarkdown.tsx`;
  `SiteTextBlock.tsx`; `app/api/contact/route.ts`; `app/not-found.tsx`;
  `TalkOptions.tsx`; `WelcomeClientLogoGrid.tsx`; `WorkManifest.ts`;
  `ThinkManifest.ts`; `SiteGallery.tsx`; `SiteScrollConfig.tsx`;
  `WorkCarousel.tsx` is the recurring pattern reference.
- **The band pair.** `WorkCarousel.tsx` and `ThinkGridCanvas.tsx` share
  `BAND_HEADLINE`, `BAND_VIGNETTE`, `SPACE.layout.bandDetailGap` and `drawCover`.
  Their panels share `useCasePanel`. **What they no longer share is the scroll
  model — Think's is now fixed-band and Work's is not.** That divergence is
  deliberate and temporary; it is spec §5 applied to one page.
- **Content:** `WorkCase0#.md` (7), `ThinkCard##.md` (13), `About.md`, `Talk.md`,
  all in `app/data/`. Work blocks: `[jobbox]`, `[subtitle]`, `[label]`,
  `[paragraph]`, `[pullquote]`, `[gallery]`, `[video-carousel]`. Think: the same
  minus `[jobbox]`/`[subtitle]`, plus `[img]`. About/Talk: `[paragraph]`,
  `[subtitle]`, `[pull]`, `[slot]`. `[gallery]` line 2 is
  `Nup, crop(4by3|16by9|1by1|2by3), noClick`. **`//` comments work in all of
  them.**
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention, the standing
  instruction to read `node_modules/next/dist/docs/` before writing Next code, and
  the body-copy dash convention.
- **Project bible:** v83 (this file). Superseded bibles live in
  `can_probs_delete/old-bibles/` — *missing v78 and v81; the project holds the
  canonical set.*
