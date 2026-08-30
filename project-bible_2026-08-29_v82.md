# shtooky.com — Project Bible v82

*Supersedes v81. **The site is live.** This session built band-spec §3, added the
missing tablet tier to the band headline, fixed two real bugs in the machinery
v81 shipped, and then swept for the class both of them belonged to — which found
three more instances.*

*The finding under all of it: **v81's habit was a result you did not verify. v82's
is a value you never supplied at all.** Twice this session the bug was an option
that existed, had a plausible default, and was never passed by the caller that
needed it — `scrollTargetY` in `useCasePanel` and `offsetFor` in `ThinkManifest`.
Neither failed loudly. One drew a centred crop; the other scrolled somewhere
believable. **A default is a decision made on behalf of every caller that does not
pass one.***

*Companion documents: `spec_sequencing_2026-08-25_v01.md` (at v03, untouched) and
`spec_band_model_2026-08-27_v01.md` — **§3, §7 and §8 now BUILT**, and §4 partly.*

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

*This session's version of that ritual worked: catch-up was one targeted read of
`ThinkCasePanel`'s constants to confirm the bible's numbers against the repo,
then a four-item menu. Total, well under a minute.*

The one caveat Claude raised and Mark accepted: **the bible is a narrative of
what we decided; the repo is what's actually true.** They drift. When a specific
number matters to what's about to happen, check that number and say so —
targeted, not a sweep.

*v81 added a second axis: **the repo and the BROWSER can disagree too.** v82 adds
a third: **the browser and CLAUDE'S MODEL of the browser can disagree, and only
instrumentation settles it.** Tonight Claude produced two confident, mechanically
detailed, wrong diagnoses of the same bug before turning the HUD on.*

For simple, single-value mechanical fixes, Mark prefers to be pointed at the
exact file/line. Claude makes the edit directly when a change spans multiple
files, needs verification against the shared token system, or involves an
architecture judgment call.

**Mark edits the same files, live, while Claude is working in them.** Always
re-read immediately before writing, match on the constant NAME rather than its
current value, and never assume a number is what it was two messages ago.

**One thing at a time (standing instruction).** Present one decision, make the
change, look at it, then the next.

**Let Mark describe the intent before proposing the fix.** A description of
intent is a diff against the implementation.

*This session, again, Mark's description was the diagnosis. "I see the content
fade in as expected. But if I close that card and then open another — the content
is just there, no fade. And then if I reload I get the correct fade on the first
card only" is a complete specification of the bug: it names the gesture, the
boundary (per page load), and the discriminator (first vs subsequent). Claude did
not have to guess at any of the three.*

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
prefix, so a file without one is a signal. *`SiteCanvasCover.ts` (NEW) follows
this: shared by both bands, so `Site`.*

**Body copy dashes (in `AGENTS.md`).** Spaced en dash, never an em dash. The
space BEFORE it is a non-breaking space (U+00A0); the space after is a regular
space, so a dash can never be pushed to the start of a line. Content `.md`
carries the literal character; `.tsx` string literals use the escape ` `
so it is visible in source; JSX text uses `&nbsp;`.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## ⚠️ BEFORE THE NEXT PUSH

**`DEBUG.thinkBand` in `SiteTokens.tsx` is currently `true`.** It renders a live
green diagnostic HUD over the How I Think page. Flip it to `false` before
pushing. It is deliberately left on because §4's measuring pass wants it.

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
- **A DURATION standing in for an EVENT** (v81) — `OPEN_DELAY = 750` in
  `ThinkCasePanel` is "wait for the card to land," expressed as "wait as long as
  landing currently takes." Not an input, not derived: a hand-maintained
  agreement between two files. A countdown.
- **NEW — a DEFAULT is a fifth kind, and the most dangerous.** An optional
  parameter's default is a value chosen once, at the definition site, on behalf
  of every caller that does not pass one. It is authored by someone thinking
  about the general case and consumed by someone who never thought about it at
  all. See both of tonight's bugs.

### The four resolution schedules

- **CSS-live** — a `vw`/`vh`/`clamp()` string. Re-resolved every paint.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
  Correct once, stale forever.
- **Fetched** — arrives after first paint. Anything that must be on screen before
  it resolves cannot live there.

**Rule: one mechanism per visual unit.**

*React-reactive's hidden first frame was fixed in v81 — `useBreakpoint` is a
layout effect now.*

### THE HABIT BEHIND THE BUGS — the five generations

| version | the habit | example |
|---|---|---|
| v78 | a value **transcribed** from its token | visibility-zone literals |
| v79 | a value **wired to something that never changes** | `2.2em`; `[open, children]` |
| v80 | a value **you cannot see** | U+00A0 beside 30 en dashes |
| v81 | a **result you did not verify was produced by your code** | three "the fix didn't work" reports against a stale bundle |
| **v82** | a value **you never supplied**, standing in as a plausible default | `scrollTargetY`; `offsetFor`; `caseIdx`; `activeIdx`; `containerWidth` |

> **v82's line: an escape hatch added at extraction time is not wired just
> because it exists. The moment you add an option so one caller can differ, wire
> that caller — or the option is a comment that compiles.**

---

## Current state — what shipped this session

### 1. Think's fade only worked on the first card per page load

**Symptom (Mark, mobile Safari, private tab):** open a Think card, content fades
in correctly. Close it, open another — content is just *there*, no fade. Reload,
and the first card fades correctly again.

**Mechanism.** `useCasePanel` decides open-vs-step from `hasContentRef` — "was
there content on screen to replace?" Think's `handleClose` only sets
`setCardOpen(false)`; it leaves `openIdx` alone, so `cardFile` never goes null,
so the hook's `[file]` effect never re-runs, so `hasContentRef` stayed `true` for
the life of the page. Every open after the first was classified as a **step**:

| | first open (after reload) | every open after |
|---|---|---|
| fade duration | `FADE_DUR` 1000 | `STEP_IN` 750 |
| stagger | `FADE_OFFSET` 25 | `STEP_OFFSET` 10 |
| lead-in | `OPEN_DELAY` **750** | **0** |

The lead-in is what he saw. On a real open the copy waits 750ms for the card
expansion to finish, then fades. Misclassified, it starts at 0 and fades
*underneath* the expansion — so the card lands and the text is already there. It
genuinely faded; it faded while he was watching something else.

**Fix — one line, in the hook.** The reset-on-hide effect now clears
`hasContentRef` alongside the opacities. `hasContentRef` means "is content on
screen"; a hidden panel has none. Work never had this because its close sets
`activeIdx` to null and the file genuinely goes null.

> **A ref that means "what is on screen" must be cleared by everything that takes
> things off the screen — including the paths that only change visibility.**

*Consequence for tuning: every Think open Mark had judged since the extraction,
except the first of each reload, was running the step values. The open numbers
have not really been seen yet.*

### 2. `BAND_HEADLINE.tabletSizePx` — the missing third tier

Tablet had no tier. Below 768 a flat `mobileSizePx`; at 768 and up
`sizePx × (viewport / refW)`. At exactly 768 that formula produces **28** — the
identical rendered size a 390-wide phone gets, on a screen twice as wide. The
spec had predicted this ("two tiers arriving at the same value from opposite
directions are a gap"); Mark found it by eye as "tablet is way too small."

Proportionally the ramp was defensible — the band is `viewportW / 3` tall, so the
headline is ~11% of its band at every width above mobile. What tablet lacks is
mobile's `MOBILE_BAND_HEIGHT_SCALE` of 1.65: the phone buys its 28 a much taller
room.

Now three tiers. `tabletSizePx: 40`, flat rendered pixels, same shape as
`mobileSizePx`, applied for `768 ≤ w < BREAKPOINTS.laptop` so it matches
`getBreakpoint()`'s own range:

| viewport | before | after |
|---|---|---|
| 767 | 28 | 28 |
| 768 | 28 | **40** |
| 1024 | 37 | **40** |
| 1279 | 46 | **40** |
| 1280 | 46 | 46 (desktop ramp resumes) |

Three-way branch in `WorkCarousel.scaleStage` (divides by the stage scale) and
`ThinkGridCanvas.scaleStage` (screen px, no conversion). **Accepted trade:** a
flat tier drifts across its own range and steps at 1280. Mobile already accepts
exactly this — its flat 28 is 13.1% of the band at 390 and 6.6% at 767.

**Partial §4.** The spec wants *every* tier expressed in screen pixels so both
files do identical arithmetic. Two of three now are; `sizePx` is still a native
reference. `lineHeightPx` is still one desktop-referenced 55 for all three tiers.

### 3. `SiteCanvasCover.ts` — spec §3, built

`WorkCarousel.drawImage` and `ThinkGridCanvas.drawImageCover` were the same
cover-fit algorithm written twice, fitted to different boxes. Now one function:

```ts
drawCover(ctx, img, box, { centerX, offsetX, offsetY, scalePct, anchorY })

scale = max(box.w/iw, box.h/ih) × (scalePct/100)
x     = (centerX ?? box.x + box.w/2) − dw/2 + offsetX
y     = box.y + (box.h − dh) × anchorY + offsetY
```

- **`centerX`** is what lets Work keep its sliding carousel centre without Think
  needing to know it exists.
- **Clipping and the missing-image fallback stayed in the callers** — those
  genuinely differ (different fill colours; Work clips a moving slice). Sharing
  them would have been parameterising a difference rather than a similarity.
- **`offsetFor` is finally called.** `drawImageCover` now takes `cardNum` and
  `unit`. `cardNum` is the `THINK_GRID` value, not the slot index — the same key
  `coverImageFor` uses, so a grid reorder cannot slide crops out from under
  images.
- **`unit` is the coordinate-space conversion:** `1` on the grid canvas (already
  native), `logW / NATIVE_W` on the band canvas (real screen pixels).
  `THINK_OFFSETS` is authored in **native units**, the same thing
  `WORK_MANIFEST`'s offsets mean. One meaning per manifest, one conversion at one
  site.
- **`anchorY` defaults to 0.5** — today's behaviour. §4/§5 makes it 1.

**Verified by simulation, not by looking.** Both old formulas and the new one
were run over 400,000 random combinations of image dimensions, band heights,
sliding centres and cell rects. **Zero mismatches** on x, y, width, height.
Combined with `THINK_OFFSETS` still being empty, §3 was provably a pixel-for-pixel
no-op — which is exactly what Mark then confirmed on screen.

### 4. Think's open card landed wherever the reader was scrolled

**Symptom:** scroll down the grid, click a lower card, and the expanded band
appears partway down the screen instead of at the top. Deeper card, lower band.

**Two wrong diagnoses first, both Claude's, both detailed and confident:**

1. *"It'll be fixed by the narrower band image."* No — that is §4, a crop change.
2. *"The page gets shorter when the grid collapses, so the scroll floor can't
   reach `bandDocY`."* No — `spacerRef` inflates by exactly the height `wrapRef`
   loses (`(TOTAL_H − _bandH) × scale`), and the header moves by transform.
   **Document height is preserved to the pixel.** The mechanism was invented, and
   it was plausible enough that it had already been half-believed once.

**The turn: instrumentation that already existed.** `ThinkGridCanvas` had a debug
HUD, written during the open/close work and then commented out. It was re-enabled
behind a new `DEBUG.thinkBand` flag, moved off centre-screen, and extended with
the four numbers that discriminate between the hypotheses. Mark read them off in
one pass:

```
band top on screen: 675      bandDocY: 675
band style.top:     675      maxScroll: 1136
floorGap (scrollY − bandDocY): −675
```

`style.top == bandDocY` killed the stale-ref hypothesis. `maxScroll > bandDocY`
killed the clamp hypothesis. `floorGap == −bandDocY` meant **`scrollY` was 0** —
the band was exactly where it should be, and the *viewport* was at the top of the
document.

**The cause.** `SiteCasePanel:156` runs
`window.scrollTo(0, scrollTargetY ? scrollTargetY() : 0)` when new content lands.
**`ThinkCasePanel` never passed `scrollTargetY`,** so it took the default and
scrolled to document 0. On Work that is right — its band is in flow at the top.
On Think the content's top is `bandDocY`. The scroll floor could not correct it
because that listener only fires on `scroll` **events**, and the jump happens
before `enableScrollFloor()` attaches, so nothing ever fired.

The option existed **specifically so the two panels could differ** — its own doc
comment says *"it exists so the panels can differ in the meantime"* — and was
never wired. It was added in the v81 extraction; the bug is a regression from
that work, not an old one.

**Fix.** `ThinkPageController` already held `bandDocY` in state (it is what
`detailTopPx` is built from) and now passes it to `ThinkCasePanel`, which reads
it through a ref behind a stable `useCallback`. The ref matters: `useCasePanel`
deliberately keeps `scrollTargetY` out of its effect deps, so a plain closure
over the prop could go stale. Ordering is safe — inside `openCard`,
`onBandPositioned` fires at line 670 and `onOpen` at 707, same click handler, so
React batches them into one render.

> **This bug did NOT require the fixed band (§5).** §5 would have prevented it,
> but it was one unpassed option. §5's ranking should fall accordingly: it is
> risk reduction and deletion, not an outstanding defect.

### 5. The sweep — the class, not the instance

Having hit the same failure mode twice in one evening, the rest of it was swept
for rather than waited for.

**`useCasePanel` option coverage: CLEAN.** Both panels now pass all twelve
options. *Recorded because this is the check that would have found bug 4 in five
seconds.*

**Three more instances found and deleted, both ends:**

| | shape |
|---|---|
| `caseIdx` | `WorkCaseStudyPanel` declared it, `work/page.tsx` passed it, the panel never read it. Its own comment: *"no longer used inside this file… left in Props since the caller may still pass/rely on it elsewhere."* Nobody did. |
| `activeIdx` | `WorkCarousel` declared it, `work/page.tsx` passed it, never read. **And line 832 still said *"Parent passes activeIdx; we watch it to detect external nav requests"*** — describing a mechanism replaced by `onRegisterControls`. |
| `containerWidth` | `WelcomeEverythingIsInteresting` declared it on `CACanvas`, passed it, never read it. **Removing it exposed that its `ResizeObserver` existed only to feed it** — a state update per resize frame for a value nobody consumed. Observer deleted too. |

Plus an unused `armQueue` import in `SiteTextBlock`.

**Deliberately NOT deleted: `getScrollOpacity` in `WhoSkillsSphere`.** It is dead,
but it is the only reader of that file's `SCROLL_FADE` object, which is already
queued as part of the eight-copies consolidation. Deleting it in isolation strands
`SCROLL_FADE` and makes that pass messier.

> **A prop that is declared, passed, and never read costs more than an unused
> variable: the passing looks like a dependency. Both `caseIdx` and `activeIdx`
> had survived multiple refactors because deleting them looked risky, and one of
> them had a comment actively vouching for a wire that wasn't there.**

---

## THE LOOP — how the diagnosis went, second session running

v81 recorded three fixes declared broken against a stale bundle. v82's version is
narrower and cheaper, and worth recording because the correction was faster:

- **Two wrong mechanisms, produced with full detail, before any measurement.**
  Detail is not evidence. Both were internally coherent and referred to real code.
- **The correction came from five numbers.** Not from more reasoning.
- **The instrument already existed** — commented out in the file, written during
  the work that introduced the bug. *The cost of turning a HUD off is that the
  next person does not know it is there.*
- **Claude owned the wrong claim in the message that corrected it**, per v80's
  rule, and said plainly that it should not have been handed over as the
  mechanism.

Standing rules, carried and sharpened:

- **Confirm what is running before diagnosing why it isn't working.** Private tab
  first, always.
- **A screenshot cannot distinguish a paint artifact from a duplicate render.
  One console query can.**
- **"Still happening" is not a test result until the test surface is known.**
- **NEW — Two plausible mechanisms is the signal to measure, not to pick.** The
  second theory is not evidence that the first was close.
- **NEW — Prefer instrumentation that persists behind a flag** to instrumentation
  that gets commented out. `DEBUG.thinkBand` is one word to flip; a comment block
  is invisible.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see
v73/v74/v75/v77/v78/v79/v80/v81.)*

- **NEW — An escape hatch added at extraction time is not wired just because it
  exists.** `scrollTargetY`, `offsetFor`.
- **NEW — A default is a decision made on behalf of every caller that doesn't
  pass one**, authored by someone thinking about the general case.
- **NEW — A ref meaning "what is on screen" must be cleared by every path that
  clears the screen**, including the ones that only change visibility.
- **NEW — A prop declared, passed, and never read is worse than an unused
  variable**: the passing looks like a dependency and protects it from deletion.
- **NEW — Two plausible mechanisms means measure, not choose.**
- **NEW — Instrumentation behind a flag survives; instrumentation behind a
  comment does not.**
- **NEW — Verify a refactor by simulating both formulas over random inputs.**
  400,000 comparisons, zero mismatches, before touching the browser.
- **NEW — A tier that has no tier still has a value.** Tablet wasn't unset; it was
  wherever the desktop formula happened to land.
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

- **NEW — Sweep for the class after the second instance.** Two bugs of one shape
  in one session is a pattern; the sweep found three more in minutes.
- **NEW — Record the audit that came back clean** (the `useCasePanel` option
  coverage), not just the ones that found something.
- **NEW — Name what you built and did not use, in the same message.** `anchorY`
  is Claude's own instance of tonight's pattern and is flagged as such.
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

### THE BAND MODEL — §3, §7, §8 built; §4 next

**`spec_band_model_2026-08-27_v01.md` in the project.** Steps 1, 2 and 3 of its
§12 order are done.

**4. Tiered band height and headline — NEXT.** Headline is now three tiers
(above); **band HEIGHT is still derived from viewport width and judged against
height.** Method for measuring honestly is spec §4: scroll the live page until
the crop reads right, read `window.scrollY`, at 1440 / 768 / 390. That number is
exactly how many pixels to remove at that width. **Mobile is the constraint, not
desktop** — `thinkNavClearance` is already 177/136/104. Also outstanding within
§4: make `sizePx` a screen value like the other two tiers so both files do
identical arithmetic, and decide whether `lineHeightPx` needs its own tiers.

**5. Fixed band + the scroll-model deletion.** **Re-ranked down.** Tonight's
position bug turned out to be one unpassed option, not the scroll model, so §5 is
now risk reduction and deletion rather than an outstanding defect. It still
deletes Think's four cooperating position authorities — anchor, clip inset,
spacer height, floor listener — and moves the FLIP's endpoint from a *document*
coordinate to a **viewport** one. Wants the handoff prototype first.

**Content audit is still the part only Mark can do:** twenty band images that must
survive losing their top; Think's thirteen are doubly constrained because the
covers are composed for the bento grid *and* become the band. **This now gates
`anchorY`**, which is built and unused.

### `anchorY` — Claude's own built-and-unused, flagged

Added tonight in `SiteCanvasCover`, defaulting to `0.5`, with no caller
overriding it. Justified only if §4/§5 follows reasonably soon. **If the band work
stalls, take it out** rather than let it sit there looking load-bearing. Recorded
here so the next session does not have to rediscover it.

### The missing "animation finished" signal

Three places want the same thing and none have it:

- `ThinkCasePanel`'s `OPEN_DELAY` waits 750ms because that is how long
  `ThinkGridCanvas`'s card expansion currently takes.
- Work's body copy has the same latent problem; `OPEN_DELAY = 0` only because it
  is untuned.
- `WelcomeHeroAnimationResponsive` takes only `autoPlay`, unlike its two siblings
  which both have `onComplete` — which is what blocks the Welcome bottom-heavy
  fix.

**One gap, not three notes.** Animations here do not report when they land, so
everything downstream is a hand-maintained duration.

### `CASE_FADE` tokens

Six numbers per panel, tuned by eye, nothing derives them — inputs by the
through-line's own definition, currently twelve constants in two files with
nothing keeping them in sync. Small, clean, and still next in line after §4.
*Note: Think's open values need re-judging first — see bug 1; they were only ever
seen on the first card of each reload.*

### Splitting the bible — NEW, proposed and not decided

The bible has grown 28KB (v75) → 40KB (v81) in four days, and it is dropped in at
the start of every session, so the growth comes straight off the top of each
session's working room. Most of it is the carried-forward learnings, which by
definition don't change. **Proposal: split the carried-forward principles into a
`principles` doc updated rarely, leaving the bible as current-state plus horizon.**
Mark's call; not done.

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
- **`BAND_HEADLINE.tabletSizePx`** — 40, brand new. Judge at 768 and at 1100–1279,
  where a flat tier is weakest and where the 1280 step shows.
- **All `CASE_FADE` numbers** — and Think's OPEN set has effectively never been
  judged (bug 1).
- **`ThinkCasePanel.OPEN_DELAY`** — 750, matching `TRANSITION_DURATION`. Mark may
  prefer a slight overlap (550–650).
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
`SiteScrollConfig`. *`offsetFor` is no longer on this list — it is wired.*

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
  `BREAKPOINTS.tablet` — **and now that file contains both spellings**, since the
  new tablet branch uses `BREAKPOINTS.laptop`. Same in `ThinkGridCanvas`. One-line
  cleanup, worth doing before it reads as intentional.
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
mitigation and **not built** — the claim that it keeps every block composited
forever was overstated and never verified. If ghosting returns, verify the layer
count in Web Inspector before acting.

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
- **RESOLVED this session: the two cover-fit implementations.** Now
  `SiteCanvasCover.drawCover`.
- **RESOLVED in v81: the two case panels.** Now `useCasePanel`.
- **RESOLVED in v80:** four straight apostrophes; every em dash in content and
  visible copy; the unauthorable pull-quote chunk space.
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

**Code health.** `npx eslint app` reports ~60 problems, nearly all pre-existing;
**the unused-variable count dropped by five tonight.** Next 16 does not run ESLint
during `next build` — *which is why `offsetFor` sat imported and unused, and why
`handleOpen`'s unstable identity was never flagged.* `npm audit` reports 7
vulnerabilities; **do not run `npm audit fix --force`.**

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
  Wi-Fi) → `http://10.0.0.154:3000`.
- **Safari Web Inspector over USB is the diagnostic tool of record for mobile.**
  iPhone Settings → Apps → Safari → Advanced → Web Inspector; Mac Safari →
  Settings → Advanced → Show features for web developers; plug in, Trust, then
  Develop → iPhone → the tab.
- **A private tab is the only valid mobile test surface.** iOS Safari caches
  bundles hard enough to invalidate a whole debugging session.
- **Live DevTools breakpoint workflow:** custom device presets at exact px (iPhone
  390×844, iPad Mini 768×1024, Desktop 1440×900), device toolbar undocked,
  side-by-side with a real non-emulated window. *Mark also uses scrolling itself as
  a live prototype — see band spec §4.*
- **`DEBUG` flags in `SiteTokens`:** `visibility` draws labelled zone lines;
  `sequence` traces every queue decision; **`thinkBand` (NEW) draws a live HUD over
  How I Think** — mode, `bandDocY`, the band's actual on-screen top, `floorGap`,
  `maxScroll`, doc height. **Currently `true` — turn it off before pushing.**
- **Claude-side environment:**
  - **Screen recording is GRANTED.** Safari can only be granted at **read** tier.
  - `device_bash` runs in a sandboxed **Linux** VM with the repo mounted — NOT
    macOS. It cannot reach `localhost:3000`, cannot run `next build`, and **cannot
    delete files**. **It has no browser.**
  - **Do not run `git` commands from `device_bash`.** They create
    `.git/index.lock`, which git then cannot remove.
  - **`npx tsc --noEmit` DOES work there** and was run after every edit this
    session. **`npx eslint app` also works** and is how the sweep was done.
  - **`node` works** — and was used to run the 400,000-case `drawCover`
    equivalence simulation before trusting the refactor.
  - The cloud container (the `Bash` tool) is a separate machine with restricted
    network — GitHub and Google Fonts are blocked.
  - **Heredocs normalise invisible characters.** Never pass a literal U+00A0
    through one. Base64 is the general form of the precaution.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS, COLUMN_TIERS,
  TYPE_TIERS, SPACE, SEQUENCE, TIMING, NAV, FOOTER, VISIBILITY_TIERS,
  LOGO_GRID_TIERS, **BAND_HEADLINE — now three tiers**, BAND_VIGNETTE, DEBUG,
  hooks, `getActivePage` + `isKnownPage`, `useBreakpoint` — a LAYOUT effect);
  **`SiteCanvasCover.ts` (NEW — `drawCover`)**; `SiteCasePanel.tsx`
  (`useCasePanel`); `SiteRevealQueue.tsx`; `SiteCaseMarkdown.tsx`;
  `SiteTextBlock.tsx`; `app/api/contact/route.ts`; `app/not-found.tsx`;
  `TalkOptions.tsx`; `WelcomeClientLogoGrid.tsx`; `WorkManifest.ts`;
  `ThinkManifest.ts`; `SiteGallery.tsx`; `SiteScrollConfig.tsx`;
  `WorkCarousel.tsx` is the recurring pattern reference.
- **The band pair.** `WorkCarousel.tsx` and `ThinkGridCanvas.tsx` share
  `BAND_HEADLINE`, `BAND_VIGNETTE`, `SPACE.layout.bandDetailGap` — **and, as of
  this session, `drawCover`.** Their panels share `useCasePanel`. What they still
  do not share is the scroll model (spec §5/§6).
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
- **Project bible:** v82 (this file). Superseded bibles live in
  `can_probs_delete/old-bibles/` — *missing v78 and v81; the project holds the
  canonical set.*
