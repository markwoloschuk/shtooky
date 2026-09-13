# shtooky.com – Project Bible v86

*Supersedes v85. A long session — five hours — that began with "let's talk about
variation in the work page" and ended up rebuilding how the whole site handles
width. Three separate pieces of work: a Work-page library/view split, a sweep of
small fixes, and THE STAGE, which is the one that matters.*

*The finding: **the site was designed at one width, and at that width `px` and
`vw` are indistinguishable — so the unit was never actually chosen.** Every
layout number is a `vw` that nobody decided should be a `vw`. It was invisible
at 1440 and is the single cause of almost everything that looked wrong above it:
a 1362px reading measure, a hero at 211px on a 4K display, a nav stranded at the
viewport edge while the content floated in the middle. The resolution is one
number — `STAGE_MAX_PX = 1440` — and a pair of self-gating CSS helpers that are
provably no-ops at and below the reference width.*

*Mark's own framing, which is the sorting rule going forward: **`vw` is right
for THE ROOM — background, full-bleed bands, the atmospheric layer. It is wrong
for THE FURNITURE — reading measure, type size, gaps, the logo grid — things
that have a correct absolute size.** The single-room metaphor turns out to hold
up as an architecture rule, not just a visual one.*

*And a design idea was explicitly retired this session. Mark: **"my original
conception was that all the type would scale in proportion to the page width —
so once we established nice layouts at 1440 we'd just scale them up. But I think
I've come to see that it's not what's commonly done and that it would also make
all of the type grotesquely big."** That premise is underneath most of the code
this session corrected.*

*Companion documents: `spec_sequencing_2026-08-25_v01.md` (untouched) and
`spec_band_model_2026-08-27_v01.md` (untouched). `spec_work_card_count_2026-09-02_v01.md`
is now **PARTLY EXECUTED and then some** — see Current State §1; the spec's
one-line fix was done and the library/view split went past what the spec
proposed.*

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
twenty minutes later with a report. Catch up to where we left off and suggest
the areas we might work on. Fast.

*This session: bible in, folder access requested, a short catch-up and a menu,
first targeted read only after he picked. Under a minute.*

**The 45-minute heartbeat is now standing, and the shape matters.** Mark:
*"that's effective use of that ask."* A single one-shot timer lapsed for three
hours in a previous session; **the working version RE-ARMS ITSELF** — every
firing chains the next one. Each beat reports elapsed time on the current task
plus an honest read on whether it still serves the goal. Set it at session
start, keep the chain alive.

**What actually carries between sessions.** Three layers, only two automatic:

- **Persistent memory** — durable facts about Mark and his active areas, shared
  across Cowork and claude.ai chat.
- **The Claude project** — carries these docs into any session attached to it.
  This is where the detail lives.
- **Conversations do not cross.**

*Which is the whole argument for the bible: it is the only layer that carries
the REASONING.*

**The bible is a narrative of what we decided; the repo is what's actually
true.** They drift. *Five axes of disagreement now recorded. v81: the repo and
the BROWSER can disagree. v82: the browser and CLAUDE'S MODEL of it can
disagree. v83: the bible and the repo had drifted on the very first thing
checked. v84: the bible and the NETWORK can disagree. **v86 adds the sharpest
one: the bible can be CONFIDENTLY WRONG about a whole subsystem.** Its
"eight copies of one scroll-fade system" was not a drift — it was a
misclassification that would have produced the wrong refactor. See §4.*

*Three bible claims were falsified by direct check this session: the SCROLL_FADE
framing, "all four DEBUG flags are false" (there is a fifth and it was true),
and "pull-quote highlights are orange on Let's Talk" (Let's Talk has no pull
quotes). Check the specific number before acting on it — every time.*

For simple, single-value mechanical fixes, Mark prefers to be pointed at the
exact file/line. Claude makes the edit directly when a change spans multiple
files, needs verification against the shared token system, or involves an
architecture judgment call.

**Mark edits the same files, live, while Claude is working in them.** Always
re-read immediately before writing, match on the constant NAME rather than its
current value, and never assume a number is what it was two messages ago.
*Instance this session: `WorkCarousel.tsx:43` was still `const N = 7` when the
library/view split was built, hours after it had been reported as changed.*

**One thing at a time (standing instruction).** Present one decision, make the
change, look at it, then the next.

**Let Mark describe the intent before proposing the fix.** A description of
intent is a diff against the implementation. *This session's instance: Mark
said "let's not adjust the height yet — reducing the Think card height was to
move content higher in frame." That sentence sent Claude to check whether the
band height was in fact growing with width. It is not — the formula looks
viewport-dependent and cancels exactly — and saying so stopped a change that
would have been made on a false premise.*

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am (`/who-i-am`),
How I Think (`/how-i-think`), and Let's Talk (`/lets-talk`), plus a 404.

**Site vision — "single room" (standing instruction):** The site is one
continuous atmospheric space. Content hangs like banners from the ceiling. Each
page region has its own ambient lighting (five page colors). Navigation is a
camera moving through that space.

**THE STAGE — new standing instruction, and it modifies the one below it.**
The whole page is a **1440-wide layout centred in the window**. Below 1440 the
stage IS the window and everything resolves to the plain `vw` it always was.
Above it the stage stops growing and the leftover width becomes empty margin —
the frame, the content column, and the reading measure all freeze together,
keeping their 1440 relationship to one another. Mark: *"it's like the 1440
layout becomes the fixed max width layout."*

**Leftmost-element principle (standing instruction, AMENDED).** NavBar and
Footer are deliberately the leftmost elements on any page — **leftmost ON THE
STAGE**, not in the window. Before this session `FRAME_INSET_VW` was measured
from the viewport edge, which meant that above 1440 the frame travelled
outward while the content travelled inward and the shared edge silently stopped
being true. *Knowingly bent twice, as before:* the Who I Am skills-sphere canvas
is full-bleed on mobile/tablet, and escapes the content column via `bleed: true`.

**Four standing widths, and they are not the same thing (clarified this
session).** At 1440:

```
                      what it is                          width   left edge
1. Full bleed         100vw                                1440          0
2. Frame edge         FRAME_INSET_VW = 2.5vw                  —         36
3. Content column     col.vw = 76vw, inset 12vw each side   1094        173
4. Text column        bodyMaxWidth = 53.2vw of viewport      766        173
```

**The content column and the text column share a left edge.** The text column
isn't a separate box — it's a `maxWidth` applied to elements inside the content
column. One left edge, two right edges. Which is why capping the measure alone
is safe and capping the column alone is the harder decision.

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`. When
superseding, write the new file under its own correctly-dated name and move the
old one to `can_probs_delete/old-bibles/`. *The repo's `old-bibles/` is missing
v78 and v81 — the canonical copies live in the Claude project.*

**Component naming.** A component used by more than one page takes the `Site`
prefix. Page-specific components keep their page prefix.

**Body copy dashes (in `AGENTS.md`).** Spaced en dash, never an em dash. The
space BEFORE it is a non-breaking space (U+00A0). Content `.md` carries the
literal character; `.tsx` string literals use the escape ` `; JSX text uses
`&nbsp;`.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## BEFORE THE NEXT PUSH

1. **`BAND_ANCHOR_Y` is 0.5 and it is still a TRIAL, carried unresolved from
   v84 and v85.** Mark's verdict after looking at all thirteen: *"It's not a
   1 size solve. Half of the cards are ok — the other half varying degrees of
   less so."* Either finish the per-card pass or set it back to `0`. **Raised
   three times this session and still open.** It is the only thing genuinely
   blocking a clean push.
2. **This session's changeset is large and was never committed.** Roughly a
   dozen files across four unrelated concerns. If something in the stage model
   proves wrong, bisecting it will be much harder than committing in pieces
   would have been. **Commit in separate chunks, not one.**
3. **`DEBUG` no longer has a fifth flag.** v85 said "all four DEBUG flags are
   false." There was a fifth, `disableScrollFades`, and it was `true` — see
   §5. It and everything it gated are now deleted. The remaining four
   (`visibility`, `sequence`, `thinkBand`, `thinkBandTrace`) are all `false`,
   verified.
4. **Nothing in the stage model has been seen on mobile or tablet.** Every
   helper is provably self-gating in arithmetic, and `tsc` is clean after every
   edit, but the only surfaces judged were desktop widths in Mark's browser.
   **A private tab on a real phone before pushing.**

---

## THE THROUGH-LINE — tokens-first (read this first)

**What "hardcode" means** — explicit per-tier numbers, tuned by eye, living in
the tokens file. Not derived formulas. Not local component constants.

### The kinds of number (agreed framing)

- **Input** — a number tuned by eye, nothing derives it. → **Lives in the tokens
  file, tiered.**
- **Derived** — computed from inputs plus a real measurement. → **Never a
  token.**
- **Exception** — a place that must differ. → `TOKEN + NAMED_OFFSET`.
- **A DURATION standing in for an EVENT** (v81).
- **A DEFAULT** (v82) — an optional parameter's value chosen once on behalf of
  every caller that does not pass one.
- **A CAPTURED COORDINATE** (v83) — a position read from the live document and
  stored. A measurement with an expiry date nobody wrote down.
- **A CONTESTED VALUE** (v84) — a value two systems both believe they own. The
  last writer wins without telling anyone.
- **NEW — A VALUE WHOSE UNIT WAS NEVER CHOSEN. The eighth kind, and the
  quietest yet.** At the reference width every unit agrees: 76vw and 1094px are
  the same number at 1440, and so are 5.5vw and 79px. So the choice between
  them never had to be made, was never discussed, and left no trace in the
  code. It only becomes a decision — and a visible one — away from the
  reference. *This is not a mistake repeated many times. It is one decision
  that was invisible at the moment it was made, repeated everywhere.*

> **v86's line: a number that is correct in two units is a decision you have
> not made yet. Design at one width and every unit agrees; the unit only
> declares itself somewhere you weren't looking.**

### The four resolution schedules

- **CSS-live** — a `vw`/`vh`/`min()`/`max()`/`clamp()` string. Re-resolved every
  paint. **The stage helpers are all this, deliberately.**
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
  Correct once, stale forever.
- **Fetched** — arrives after first paint.

**Rule: one mechanism per visual unit.**

### THE HABIT BEHIND THE BUGS — the eight generations

| version | the habit | example |
|---|---|---|
| v78 | a value **transcribed** from its token | visibility-zone literals |
| v79 | a value **wired to something that never changes** | `2.2em`; `[open, children]` |
| v80 | a value **you cannot see** | U+00A0 beside 30 en dashes |
| v81 | a **result you did not verify was produced by your code** | three "the fix didn't work" reports against a stale bundle |
| v82 | a value **you never supplied**, standing in as a plausible default | `scrollTargetY`; `offsetFor`; `caseIdx` |
| v83 | a **coordinate captured before the thing it refers to can change** | `bandDocY`; `TRANSITION_DURATION` as a stand-in for landing time |
| v84 | a value **two systems both believe they own** | `marginTop`; `768`; the rule's `0.5` |
| **v86** | a value whose **UNIT was never chosen**, because at the reference width every unit agrees | every layout `vw` on the site; `OPENING.sizeVw`; `18vh` |

---

## Current state – what shipped this session

### 1. Work page — the LIBRARY / VIEW split

**The problem, in Mark's words:** *"I want to create additional work cards for
more projects. And I want to make it easy to swap any one of the current 7 for
one of those new ones."*

**The blocker, which is why this needed architecture and not a content edit:**
`WORK_MANIFEST` was doing two jobs. It was the library of everything, AND the
running order of the page. `const N = 7` was a third, hand-maintained assertion
of the same fact. You could not grow the library without growing what's on
screen.

**What `WorkManifest.ts` exports now:**

```ts
export const WORK_MANIFEST = [ … ] as const              // the LIBRARY
export type  WorkCaseId = (typeof WORK_MANIFEST)[number]['contentFile']
export const WORK_CAROUSEL: WorkCaseId[] = [ … ]          // the VIEW, ordered ids
export const WORK_CARDS = WORK_CAROUSEL.map(…)            // resolved entries
```

- **`contentFile` IS the id.** Mark proposed a numeric `id` field; the argument
  against is concrete: with numbers, deleting a library entry forces either a
  gap or a renumber, and **a renumber silently repoints every view at different
  cards**. With string ids that failure cannot happen. The array also reads as
  itself — you can see what's in the carousel without a legend.
- **`WorkCaseId` is derived from the library**, so a typo in the view array is
  a **compile error**, not a blank slice.
- **`slot` is deleted.** It was the numeric id, hand-written, read by nothing
  (verified: the only `slot` hits in the app are Think's `titleForSlot` and the
  unrelated `[slot]` content block). Under the view model it would have become
  actively false — a case appearing at different positions in different views
  cannot own a position number.
- **All five consumers repointed to `WORK_CARDS`:** `WorkCarousel.tsx` lines
  4 / 43 / 180 / 181 / 390 / 783, and **`work/page.tsx:43`** — that last one is
  the one a naive change would have missed. It indexes the manifest by
  `activeIdx` to resolve `contentFile`, so a reordered view would have opened
  the wrong case study while the carousel drew correctly.

**To add a card:** a `WORK_MANIFEST` entry, a matching `WorkCase0N.md`, the id
added to `WORK_CAROUSEL`, and an id removed if staying at seven. *A library
entry alone shows nothing — that is the design working, not a bug.*

**Verified at six and five:** the geometry re-proportions correctly; slice width
goes 206 → 240 → 288. Mark: *"the individual cards read a little wide at 5 or
lower in desktop — but it looks fine in mobile and tablet."* Two candidate
causes were identified and not resolved: the crop (40% more image at 288) and
`CFG.HOV_EXPAND` being an absolute 300, which is +146% of base at seven and only
+104% at five — measurably calmer.

### 2. THE STAGE — the session's real work

**In `SiteTokens.tsx`:**

```ts
export const STAGE_MAX_PX = COLUMN_TIERS.desktop.referenceW   // 1440 — ONE owner

stageInset(vwPct)  →  max(Xvw, (100vw - 1440px) / 2 + [X% of 1440]px)
stagePx(vwPct)     →  min(Xvw, [X% of 1440]px)

contentWidth(col)  =  stagePx(col.vw)
contentInset(col)  =  stageInset(col.marginVw)
frameInset()       =  stageInset(FRAME_INSET_VW)
bodyMaxWidth(col)  =  stagePx(col.vw * col.bodyColPct / 100)
openingPx()        =  round(min(innerWidth, 1440) * OPENING.sizeVw / 100)
```

**Both helpers are SELF-GATING**, which is the property that made the whole
thing safe to build at speed: below 1440 the `vw` term always wins, so **no tier
flags are needed and every change is provably a no-op at and under the
reference width**. An earlier draft had per-tier `maxBodyPx` / `maxContentPx`
tokens; they were deleted once the self-gating form was found. *A cap that
needs a tier flag is a cap you have expressed in the wrong form.*

**Both are CSS-live** — `min()`/`max()` re-resolve every paint. None of this is
a frozen `window.innerWidth` read.

**What moved onto the stage:** Welcome's whole stack; Who I Am's body; Let's
Talk's body; Think's open animation, below-placeholder and blurb; both case
panels' padding; the Work pullquote; **NavBar's wordmark, hamburger and menu
panel; the Footer's padding at both ends**; the Think grid; the Work carousel;
the background vignette; the nav's vertical `top` offset.

*Five of the five content-column wrappers already centred with `margin: auto`,
so capping the width alone centred them. Nothing needed restructuring.*

**The nav's vertical offset was capped too, and that was an inference beyond
the ask** — `top: 2.4vw` is a VERTICAL position expressed in viewport WIDTH, so
without capping it the nav slid down the screen while everything horizontal
froze. Flagged to Mark as easy to revert; not revisited.

### 3. The FALLOFF FAMILY — and the principle underneath it

Three separate falloffs now exist, and the reason they are three rather than one
is the most transferable thing this session produced:

> **A photograph fades. A structure gets an edge.**

- **`bandFalloffMask()`** — Think's expanded card image. The band grows past the
  stage by `BAND_GROWTH` (0.4) and **the overhang IS the falloff**: fully opaque
  across exactly the 1440 stage, pure gradient beyond it. One number, because
  the fade distance is not a separate decision.
- **`carouselFalloffMask` — computed in `scaleStage`, not as a static string.**
  The carousel grows the same way, but keeps nearly all of that width SOLID and
  softens only `CAROUSEL_EDGE_FADE_PX` (100) at the very edge. Fading the whole
  overhang of a strip of N equal slices dims only the outermost two and **reads
  as damage rather than framing** — it breaks the one rule the composition is
  built on.
- **`ruleFalloffMask()`** — the footer rule, with its own two numbers
  (`FOOTER.ruleFadeInsetPx` 140, `ruleFadeLengthPx` 320). It needs two because
  Mark's ask was *"the fade has to extend further in AND be wider"*, and on a
  single-knob mask those pull in opposite directions: a longer ramp necessarily
  reaches further out. **This is the only falloff that is NOT a no-op at 1440** —
  the rule now fades at both ends at every width. `ruleFadeInsetPx: 0` restores
  the hard edge.

**A geometric truth worth writing down:** a mask can only fade the element it is
on. Think's band works because the fade eats the *overhang* — extra image beyond
the composition. Near 1440 there is no overhang, so any soft edge must eat the
composition itself. **Between roughly 1440 and 1700 you can have a full-width
strip or a soft edge, but not both.** That is geometry, not tuning, and no value
of `BAND_GROWTH` escapes it.

### 4. The SCROLL-FADE survey — the bible was wrong

v85 described "eight separate `const SCROLL_FADE = {…}` objects in eight files"
and proposed consolidating them. **They are not eight copies of one system.
They are unrelated things sharing a name, in three different coordinate
spaces:**

```
WelcomeHeroAnimation    fadeStart:170 fadeEnd:340        absolute scrollY px
WelcomeHero2Line        fadeStart:170 fadeEnd:340        absolute scrollY px
WhoSkillsSphere         topStart/bottomEnd/…             viewport fractions   (DEAD — deleted)
WelcomeEverything…      scrollStart/fadeZone/lineStagger a staging system
WhoVennDiagram          animDelay: 200                   NOT A FADE — a delay
WelcomeClientLogoGrid   animDelay: 200                   NOT A FADE — a delay
TalkRippleNetwork       SCROLL_FADE_TIERS{…}             tiered, live
```

**The real shared system has a name and is already used by two pages:**
`SiteRevealQueue` (`armQueue` / `registerItem` / `isRevealed` / `zoneOpacity` /
`useSequencedFade`) + `getVisibility()`/`VISIBILITY_TIERS` +
`SiteSequenceController` + `SiteTextBlock`. **Who I Am AND Let's Talk both use
it.** `WhoVennDiagram` fades on the same zone system via `getVisibility()` — so
Mark's intuition that objects and text share a mechanism is correct, and the
local `SCROLL_FADE` next to the Venn is a ripple delay, not a fade.

**Welcome is the only genuine outlier**, bespoke in four ways, and its numbers
are absolute scroll pixels, which is why nothing else could adopt them. Work and
How I Think are canvas pages with no scroll fade at all.

**So "port the About system to the other pages" is ONE page**, and it is blocked
on the same missing completion signal as the Welcome bottom-heavy fix:
`WelcomeHeroAnimationResponsive` takes only `autoPlay` and has no `onComplete`,
unlike its two siblings. **Mark parked it deliberately** — wants to work on
Welcome's loading first and slot the port in if and when it fits.

*Correction recorded against Claude, not the bible: `SCROLL_FADE_TIERS` was
reported as having zero uses. It is read at `TalkRippleNetwork.tsx:357` as
`SCROLL_FADE_TIERS[breakpoint]`; a dot-notation grep missed it.*

### 5. `DEBUG.disableScrollFades` — a flag that did the opposite of its name

Diagnosed and then deleted. Two consumers, both in `WhoSkillsSphere.tsx`, doing
**opposite things**:

- Line 673, inside `getScrollOpacity()` — a function with exactly one reference
  in the entire app: its own definition. **Nothing called it.** The flag's
  nominal job was inert.
- Line 1042 — the flag being `true` **rendered a debug HUD**. Self-closing,
  with a `debugRef` that was declared, attached, and never written to. So a
  ~20×8px translucent black box, `position: fixed`, bottom-left, z-index 100,
  **shipping on the live Who I Am page**, invisible only because the page is
  dark.

**Deleted:** `getScrollOpacity` (21 lines), that file's `SCROLL_FADE` (used only
by it), the HUD div (22 lines), `debugRef`, and the flag itself. ~50 lines, zero
references left, `tsc` clean.

### 6. Small fixes

- **`SiteTextBlock` — `PullTextItem` now takes a required `accent` prop**
  instead of a hardcoded `COLORS.about`; `COLORS` dropped from that file's
  import. **Entirely latent**: `About.md` has 6 `[pull]` blocks, `Talk.md` has
  0, so Who I Am was the only page rendering them and its page colour already
  IS `COLORS.about`. Fixed while it was a guaranteed no-op — same argument as
  the `N` change.
- **Trailing whitespace** — 22 lines across 12 content files (v85 said 13).
  The strip removes spaces and tabs only; **NBSP counts were asserted unchanged
  in every file** (71 of them survive), and so were line counts.
- **`SPACE.layout.talkBottomPad`** — Let's Talk's `paddingBottom: "18vh"` became
  tiered px (162 / 184 / 152 = 18% of each tier's `referenceH`). Same reason
  `whoSphereBoxHeight` was converted from `40vh` in an earlier session.
- **Both Welcome heroes now call `openingPx()`** — capped at 79px rather than
  running to 211px at 3840.
- **Next/prev button clusters** moved from a hardcoded `right: 32px` to
  `contentInset(col)` on both Think and Work. **Not a no-op at 1440** — they sit
  173px in now rather than 32px.

### 7. Bugs introduced and fixed in the same session

Both worth recording, because both are the same class and it is a new one:

- **The nav-mode coordinate assumptions.** Damping the Think band's width gave
  `to.x` a non-zero value for the first time. Six coordinates in the nav block
  were written against `x = 0` as the band's left edge — two clip rects, the
  outgoing card and vignette, the incoming card and vignette, and `clipX`. The
  symptom Mark reported was *"a weird cropping of the image through the
  transition"*, which is exactly a clip boundary that no longer matches its
  content.
- **A `100vw` mask on a `CW`-wide scaled element.** The carousel's falloff was
  first written as a static CSS string using `100vw` stops and applied to the
  stage div — whose own box is 1440 wide and *then* transformed. **Gradient
  stops resolve against the element's own box, not the viewport.** Every stop
  was measured against the wrong ruler. Think's band was unaffected because that
  canvas genuinely is viewport-width.

> **The class: a number in the wrong COORDINATE SPACE. Both of these were
> correct values expressed against the wrong origin or the wrong ruler — and
> neither produced an error, only a picture that was subtly wrong.**

---

## THE LOOP – how this session actually went

Not a bug hunt and not a build. It was **design iteration against a live
browser**, and the shape was: Claude builds a mechanism with one tunable
number → Mark looks → Mark's reaction reveals a requirement nobody had stated →
repeat. Four iterations on the carousel alone.

That loop worked, and it is worth naming why: **every change was a no-op at
1440 by construction**, so each iteration could be judged purely on what it did
to the widths in question, with the design width acting as a control.

Process notes worth keeping:

- **The screenshot is the instrument.** Every one of Mark's corrections this
  session came from looking, and several of them — the black voids beside the
  carousel, the "pointy spear" footer rule, the narrow masked core — were things
  no amount of reading the code would have surfaced.
- **Reverting is part of the loop, not a failure of it.** The carousel got a
  falloff, then a hard cap, then a falloff with its own shorter edge. The hard
  cap was the wrong answer and Mark said so plainly; the argument that produced
  it (a segmented strip cannot fade unequally) was still the right argument, and
  it survived into the final shape as the *reason the two falloffs differ*.
- **State the arithmetic before the opinion.** The tables — band width, fade
  length, hero size at five viewports — did more to settle decisions than any
  description did.

Standing rules, carried and sharpened:

- **Confirm what is running before diagnosing why it isn't working.**
- **A private tab is the only valid mobile test surface.**
- **Two plausible mechanisms is the signal to measure, not to pick.**
- **Do not diagnose against production.**
- **Before writing imperatively to a DOM property, check whether React declares
  it in that element's JSX.**
- **NEW — before adding a second owner to a CSS property, check who already owns
  it.** `clipPath` on the Think band canvas is already owned by the open
  animation's height clip; the side falloff went on `mask-image` deliberately so
  the two stack rather than fight.
- **NEW — a mask belongs on the element that paints the background, not the one
  that paints the content.** The carousel's `#111` stage background was
  invisible until a mask on the canvas alone revealed it as a hard-edged
  rectangle.
- **NEW — when a helper takes a viewport-relative expression, check what box it
  will actually be measured against.**
- **NEW — a self-gating formula beats a tier flag.** If a cap needs a per-tier
  `null` to stay out of the way, the cap is expressed wrong.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see
v73–v85.)*

- **NEW – A number that is correct in two units is a decision you have not made
  yet.** Design at one width and `px` and `vw` agree everywhere; the unit only
  declares itself somewhere you weren't looking. This is the root of nearly
  everything this session touched.
- **NEW – `vw` for the room, pixels for the furniture.** The atmospheric layer,
  full-bleed bands and backgrounds SHOULD scale with the window. Reading
  measure, type size, gaps and grids have a correct absolute size and should
  not. The test is whether the thing has an intrinsic right size.
- **NEW – A photograph fades; a structure gets an edge.** Fading the edges of a
  single image reads as a vignette. Fading the edges of N equal slices dims two
  of them and reads as damage. Same mechanism, opposite result, because the
  composition's own grammar decides.
- **NEW – A mask can only fade the element it is on**, so a soft edge always
  eats *something*. It is free when there is overhang to eat and expensive when
  there is not — which is why the same falloff that works at 2560 is impossible
  at 1500.
- **NEW – A value in the wrong coordinate space produces a picture, not an
  error.** `100vw` stops on a `CW`-wide scaled element; an absolute viewport `x`
  added to a rect-relative origin. Both typechecked, both rendered, both wrong.
- **NEW – A formula that looks viewport-dependent may cancel.**
  `bandH = logW * (_bandH / NATIVE_W)` where `_bandH = bandHeightPx(logW) *
  NATIVE_W / logW` reduces exactly to `bandHeightPx(logW)`, a flat tier value.
  Nearly reported as a scaling bug. **Reduce the expression before describing
  its behaviour.**
- **NEW – A uniform `scale()` cannot make something wider without making it
  taller.** Mark asked for carousel slices that widen at constant height; that
  is not a tuning value, it is a different coordinate space. A wider slice under
  uniform scale shows the *same crop bigger*, not more of the photograph.
- **NEW – Six consumers hide behind one token.** `OPENING.sizeVw` is read by
  both Welcome heroes, WorkCarousel, TalkRippleNetwork, ThinkOpenAnimation and
  `not-found` — and Think *derives* its Lottie scale from it with a formula that
  assumes `vw`. **"Make the Talk headline a fixed size" is a five-page change**
  unless you add an opt-in helper instead, which is what `openingPx()` is.
- **NEW – Full-viewport overlays stop being correct the moment the composition
  stops being full-viewport.** The nav gradient is `mixBlendMode: multiply`
  across `left:0 right:0`; over the stage it multiplies a photograph, over the
  faded margin it multiplies the page background, and the seam lands exactly
  where the mask ramps.
- **NEW – A flag named "disable X" that renders a debug HUD is two features
  wearing one name**, and the give-away was that its two consumers had opposite
  polarity.
- **NEW – One event, one writer; one id, one owner.** A numeric id alongside a
  stable string id is a renumbering waiting to repoint every reference.
- Carried forward from v84/v85: a subtitle's size and its tracking are two axes
  solving for the same target width; a value with "no separate token" is a token
  that hasn't been named yet; before inventing a new scaling mechanism, check
  whether one already exists in the file; an approved number for one tier does
  not authorize extrapolating it to the others; a value two systems both believe
  they own is a deletion waiting for a re-render; `height: 0` is not zero height
  if a child's margin can escape; an absolutely-positioned panel does not care
  when the layout below it changes; a number standing in for a measurement of
  something else is worse than a stale number; derive a deadline, do not write
  it down; a breakpoint should say where the tier changes, not name a device;
  search for the literal before changing the token; make it required and let the
  compiler find the call sites; when markup and renderer disagree, the failure
  is silent in both directions; a written lesson is a lookup table, not a habit.
- Carried forward from v83: a stored position is a measurement with an expiry
  nobody wrote down; adjacent in source is not simultaneous; a gate on whether
  content appears must fail open; a measurement that returns a believable number
  is not a measurement; a constant named DURATION can be a RATE; a measurement
  can settle a dimension without earning the right to settle the composition; a
  reliable reproduction is not a mechanism; a prototype's job is to kill a fear.
- Carried forward from v82: an escape hatch added at extraction time is not
  wired just because it exists; a default is a decision made on behalf of every
  caller that doesn't pass one; a prop declared, passed and never read is worse
  than an unused variable; instrumentation behind a flag survives,
  instrumentation behind a comment does not; a tier that has no tier still has a
  value.
- Carried forward from v81: before diagnosing why a change had no effect, prove
  the change is running; introducing a gate introduces a race; an element whose
  only child is `position: absolute` measures zero; two gestures sharing one
  number look like consistency and are a conflation.
- Carried forward from v80: an invisible character is a value no search can
  confirm; a search that comes back empty is not proof; a default that satisfies
  one caller lies to every other caller; a dimension derived from the wrong axis
  fails in one direction only; a bible entry can be stale by being FIXED.
- Carried forward from v79: a dependency on a proxy is not a dependency; when
  the fix makes a dependency unnecessary, delete it; a prop with a default no
  call site overrides is an untiered number in the costume of an API; record the
  check that came back clean; a description of intent can delete the proposal.
- Carried forward from v78: a value transcribed from a token is worse than no
  token; a count of on-screen items is a viewport-dependent number in a
  viewport-independent costume; moving something into a container silently
  rescales anything sized relative to the VIEWPORT; two numbers can be identical
  and mean opposite things; a parameter accepted and never read is a lie the
  compiler won't catch.
- Carried forward from v77: a comment asking two copies to stay in sync is a
  countdown; content needed before a fetch resolves cannot live in the fetched
  file; macOS lies to you about case; a responsive rule that "helpfully" reduces
  can destroy an authored composition; check the coordinate space before
  declaring a scaling bug; a gap assembled from two paddings isn't a gap, it's a
  coincidence; read what the person actually wrote.
- Carried forward from v75/v74: a shrink-to-fit fitter silently takes over the
  value it guards; widening a container silently resizes anything sized from
  container width; `position: absolute` children contribute nothing to intrinsic
  height; a frozen JS pixel value and a live CSS `vw` are two trust models that
  can disagree; when a person says they can no longer follow how a system works,
  that's a signal about the system.

---

## Approach & patterns

- **NEW – Make the change a no-op at the reference width, then judge it
  elsewhere.** Every stage helper is self-gating, which turned five hours of
  iteration into something that could be judged safely: 1440 was the control.
  "Check that 1440 and below is pixel-identical" was the verification on every
  single change.
- **NEW – Show the arithmetic table before the opinion.** Band width, fade
  length, hero size, margin width — at four or five viewports. It settled more
  arguments than description did, and it caught two of Claude's own errors
  before Mark saw them.
- **NEW – Assert every replacement matches exactly once, and abort the whole
  script if not.** Every edit this session ran through a Python script that
  counted matches and exited non-zero on anything unexpected. It caught a
  duplicate `style` attribute and a stale `const N = 7` that would otherwise
  have been silent.
- **NEW – Audit the consumers before converting a token.** `OPENING.sizeVw`
  looked like a Talk-page value and turned out to be a five-page one.
- **NEW – When a mechanism needs two knobs, give it two.** The single
  `BAND_GROWTH` knob is right for the band because the overhang *is* the fade;
  it is wrong for the footer rule because "further in" and "wider" fight over
  one number.
- Carried forward from v85: verify a size or width claim by rendering it, never
  by computing it by hand; when corrected on scope, name exactly what changes
  and revert the part that wasn't asked for, in the same message; a stray
  blocking artifact gets cleared as part of finishing the task.
- Carried forward from v84: when the small ask reveals a systemic gap, say so
  and let Mark decide the scope; deliver the deliberate exclusion in the same
  message as the feature; name what changes size as a consequence, not just what
  you changed.
- Carried forward: write the spec before the code when the change spans a
  system; record the mistake, not just the fix; own the flagged risk that was
  not checked; say which files change VISUALLY and how many; bible-drop means
  catch up fast and offer a menu; recalibrate in the same change that causes the
  drift; fix stale comments in the same pass as the code they describe; point to
  file/line for simple mechanical fixes; propose a mechanism plus a reasoned
  starting guess and let Mark's live judgment set the number; full-file
  replacement over accumulated patches; always read current file contents before
  editing; diagnose fully before touching code; explain the mechanism before
  proposing the fix, in the message that proposes it; change one visible thing
  per pass; name the thing you did NOT do; verify the claim you just made, with
  the thing itself.

---

## On the horizon

### THE CAROUSEL'S COORDINATE SPACE — the named next job

**Mark's requirement, stated plainly:** *"beyond 1440 the carousel still grows
and gets wider (not taller), each slice gets wider."*

**Why no amount of tuning gets there.** The carousel stage is a fixed
`CW × CH` (1440 × 480) box with a **uniform** `scale(s)`. Width and height are
the same number:

```
viewport   scale   band height
   1440    1.00        480
   1920    1.13        544     (was 667 before BAND_GROWTH damping)
   2560    1.31        629     (was 853)
```

**The shape of the fix:** height becomes a flat px value — exactly what Think's
band already does at `BAND_HEIGHT_TIERS.desktop = 305` — and the width grows
independently, with images **re-cropping** to fill wider slices rather than
being scaled up. This is the same root as spec §4's remainder (*"`sizePx` is
still a native reference value… desktop's headline still ramps with width while
the band it sits in is flat"*), and it is why Think and Work diverge today.

**It is also the file the desktop shimmy lives in.** Do it fresh, not at the end
of a long session.

### THE VIEWPORT GRADIENTS — should they be on the stage?

Mark asked how the darkening layers interact with the transparency falloff. The
stack over the carousel:

```
SiteNavBar gradient    fixed, left:0 right:0, 180/120/90px
                       rgba(13,13,13,1) → transparent, zIndex 39
                       mixBlendMode: MULTIPLY            ← full viewport width
SiteScrollConfig       top + bottom viewport gradients from TF0/TF100/BF100/BF0
                       COLORS.dark → transparent          ← full viewport width
Band vignette          INSIDE the canvas: bottom 40%, black at 0.85
                       (well behaved — fades with the mask)
Background vignette    the side ellipse, now stage-aware
```

**The problem is the multiply.** Over the stage it multiplies a bright
photograph; over the faded margin it multiplies the dark page background. Same
gradient, two results, and the boundary lands exactly where the mask ramps — so
it reads as a seam rather than a falloff. **The nav gradient and the ScrollConfig
gradients are the last full-viewport layout decisions that have not moved onto
the stage.** Not built. Mark also noted his own edge-darkening inside certain
card images compounds this.

### TYPE AND VERTICAL SPACING → absolute values

Mark: *"let's start moving text sizes into absolute values. same with vertical
positioning."* Started, not finished:

- **DONE:** both Welcome heroes via `openingPx()`; Let's Talk's `18vh` →
  `SPACE.layout.talkBottomPad`.
- **REMAINING `vw` type:** `OPENING.sizeVw` still drives WorkCarousel (two
  sites plus the headline fitter), TalkRippleNetwork, ThinkOpenAnimation
  (derived — needs re-deriving, not re-typing) and `not-found`. Adopting
  `openingPx()` is the cheap path for the first two; Think needs thought.
- **REMAINING `vh` spacers:** Welcome five (`35vh`, `8vh`, `4vh`, `3vh`,
  `20vh`), Who I Am two, the Venn's `4vh` top/bottom margins. `TalkOptions`'
  Resume panel `height: "70vh"` is a **viewer, not spacing** — a fixed height
  there would overflow a short laptop. Left deliberately.
- **The proper next step is an INVENTORY, not a migration:** walk the codebase
  once, classify every `vw`/`vh` as room or furniture, write it down, then work
  through the furniture opportunistically.

### The `BREAKPOINTS` findings

- **`BREAKPOINTS.desktop: 1440` is not a breakpoint.** Nothing compares against
  it — `getBreakpoint()` only uses `tablet` (720) and `laptop` (1280). Desktop
  actually begins at **1280**, under a key named `laptop`. The 1440 is a
  reference width, duplicated from `COLUMN_TIERS.desktop.referenceW`. It now has
  a real job as `STAGE_MAX_PX`'s source, but the key still reads as a boundary.
- **The tiers do most of their work away from where they were tuned** — the
  file's own comment: mobile spans 390–719 on values judged at 390; tablet spans
  720–1279 on values judged at 768. **Desktop gets only 160px of genuine range
  (1280–1440) before the stage caps it.** A real fourth `laptop` tier is the fix
  if that band ever feels thin.

### Work page — the two directions Mark is weighing

Not decided. Captured because the thinking was substantial:

- **More cards, swapped in and out** — now trivially supported by the library/
  view split. This is his immediate want.
- **A CLIENT-axis carousel** — HP, Microsoft, Adobe, Cisco, Dolby, Flexport,
  plus personal. Each client panel with a tabbed layout: a featured case study
  plus a broader overview. **The content cost is the real cost:** of the seven
  existing cases, four map to three named clients (HP ×2, Microsoft, Flexport)
  and three are personal/other, so **Adobe, Cisco and Dolby would be built from
  scratch** — roughly 60% new content out of a 15-year archive.
- **The resolution Claude proposed and Mark did not reject:** these are two
  *named views over one library*, not two systems. A client card is just another
  library entry. The Projects/Clients switch is a UI affordance over the same
  data, and a URL (`/work` vs `/clients`) seeds its initial state — which also
  solves "does the view survive navigation."
- **The honest caution recorded:** a view per job posting is a treadmill. Two or
  three durable views mapped to kinds of role is sustainable. And the three
  personal cards are the most characterful things on the site; a client axis
  buries all three in a catch-all.

### AI-GENERATED VIDEO — Mark's idea, higher-level to-do

Mark wants to start using AI video tools (was looking at MinMax via OpenArt) and
*"feel[s] like I'm falling behind every day."* The idea: **short,
small-resolution, creative AI-generated films to accompany the How I Think
cards.** A good fit — those cards already have a block vocabulary that takes
video, so it is content work rather than a build.

### The motion graphics reel — no home for it

Mark needs to make a new reel and there is currently nowhere on the site to put
one. *Claude's suggestion, not actioned: it wants to be the opener of a
client-axis view — fifteen years in ninety seconds, then the logos below it.*

### Footer easter egg + nav subtitle — SETTLED

Both confirmed by Mark this session. `NAV.titleFontSize` stays at **15**
(tablet/mobile derive via the name-scale factor). The nav↔footer shtooky toggle
works. Both come off the horizon.

### THE SHIMMY — still next, and still the gate for two other things

**Defect: the card motion wiggles, worse on close than open, DESKTOP ONLY.**
Untested hypothesis: the grid canvas draws each cover **centred** while the band
canvas draws it **anchored from the animation's first frame**. Second candidate:
subpixel/resampling — two effective resolutions for the same photograph.
**Instrument before chasing this; do not guess a third time.**

*Note: this session added a centred band rect to the same code path. If fresh
wobble appears on open or close at wide widths, suspect `to.x` before suspecting
the old defect.*

### The per-card band anchor — designed, agreed, NOT BUILT

`BAND_ANCHOR_Y = 0.5` fails on about half the thirteen. Agreed shape:
`THINK_BAND_ANCHOR` in `ThinkManifest.ts`, a sparse `Record<number, number>`
with a `bandAnchorFor()` resolver, plus a tuning affordance behind
`DEBUG.thinkBand` (Shift+Up / Shift+Down nudges by 0.02, HUD prints the value).
It belongs with the CONTENT, not in `SiteTokens`. The value is a fraction of
each image's overflow, so it is only meaningful against the current
`BAND_HEIGHT_TIERS`.

### The image creep — Mark's idea, deliberately last

A slight parallax of the band image as the reader scrolls the copy. **Expected
answer: pixels with a clamp.** The real cost is performance, not architecture.
One edge to write down: the close begins with an instant `scrollTo` back to the
bookmark, so creep must be frozen at close-start and lerped out rather than
snapping.

### Remaining OPEN DEFECTS on Think

1. **Step keeps the previous scroll position — mobile Safari only.** Untested
   against the current build; retest before diagnosing.
2. **A stepped-to card showing NO content at all.** Believed fixed by the
   fail-open backstop. Confirm.
3. **Image quality shifts on the last frame of a close.** Desktop Safari. Two
   effective canvas resolutions. Pre-existing.
4. **The desktop shimmy** — see above.

### THE BAND MODEL — §3–§8 built

**Work is still untouched** — `CH = 480`, the old scroll model,
`MOBILE_BAND_HEIGHT_SCALE`. **Blocked on spec §11's open question:** Work is
tall while browsing and narrow when a case is open — two heights — where Think
has one. Confirm that asymmetry is intended before measuring Work's tiers.

**Content audit is still the part only Mark can do:** twenty band images that
must survive their crop.

### The "animation finished" signal — one of three places done

- **Work's body copy** has the same latent problem; `useCasePanel` already
  accepts `landed`, Work simply does not pass it.
- **`WelcomeHeroAnimationResponsive`** takes only `autoPlay`, unlike its two
  siblings which both have `onComplete`. **This blocks both the Welcome
  bottom-heavy fix AND the scroll-fade port.**

### Welcome — the bottom-heavy page, and now the loading

`page.tsx:53` is a flat `35vh` spacer; every later component is added BELOW it.
**Moving the content beats moving the viewport.** Blocked on the completion
signal. **Mark has also named "the Welcome page's loading" as something he wants
to work on next** — its own topic, not yet scoped.

### Inline markup — what the unification left open

- **`[video-carousel]` is the last block at content-column width**, in both
  panels, now that galleries moved. One-line change when Mark decides.
- **`{}` vs `<>` for accent** — two spellings, one idea. Recorded, not fixed.
- **Link hover state** — none.

### Untuned, deliberately

- **`BAND_GROWTH`** — 0.4. NEW. How far a band reaches past the stage.
- **`CAROUSEL_EDGE_FADE_PX`** — 100. NEW.
- **`FOOTER.ruleFadeInsetPx` / `ruleFadeLengthPx`** — 140 / 320. NEW, and **not
  a no-op at 1440**.
- **`SPACE.layout.talkBottomPad`** — 162/184/152. NEW, derived not judged.
- **`VIG_RX`** — 0.65, now frozen at 936px above the stage.
- **`BAND_HEIGHT_TIERS`** — 305/217/165.
- **`BAND_ANCHOR_Y`** — **0.5, A TRIAL, wrong on half the cards.**
- **`BAND_OPEN_LANDED_AT`** — 0.88. **`GRID_FADE_START`** — 0.6.
- **`LABEL_RULE_GAP_PX`** in `TalkOptions` — 30, never judged at Talk's type
  size.
- **`VENN_SCALE_TIERS`** — mobile 1.25 judged; desktop/tablet 1 against a
  container that shrank.
- **`BREAKPOINTS.tablet` 720** — not stress-tested in the 720–767 band.
- **`BAND_HEADLINE.tabletSizePx`** — 40.
- **All `CASE_FADE` numbers** — twelve constants in two files with nothing
  keeping them in sync. *Think's OPEN values have still never been properly
  judged.*
- **`NOT_FOUND_COLOR_HOLD_MS`** — 4000. **`LOGO_GRID_TIERS.gapPx`** 14,
  **`logoPct`** 72. **`CONFIG.SENT_HOLD_MS`** 3000. **The Resume panel's
  `height: "70vh"`.**
- **`SEQUENCE` in `SiteTokens`** — whole pacing surface. **Known hazard: the
  deadzone is tested per scroll EVENT**, so holds may behave differently by
  INPUT DEVICE rather than reading speed.

### DMARC — top infrastructure item

Cloudflare is prompting. The Resend sender is proven. Start at `p=none`.
**Still the highest-value non-code item on the list**, alongside deleting the
unused `ftp` A record (`98.129.229.120`).

### Squarespace 404s — one action left

Check LinkedIn's website field, the resume PDF in the Resume panel, and
Vimeo/Behance/YouTube descriptions for deep links to old project pages.

### Let's Talk — the location animation

`LocationPanel` shows `/images/talk/map_placeholder.jpg` at 16:9, with a comment
saying to swap it for the zoom animation, same slot.

### Splitting the bible — proposed four times, declined three times

28KB (v75) → 40KB (v81) → larger again → **larger again.** **Proposal stands
and is now materially stronger: split the carried-forward principles into a
`principles` doc updated rarely, leaving the bible as current-state plus
horizon.**

### `BF0` / `BF100` desktop

*"Looks great on mobile, too eager on desktop."* Lower desktop `BF0` (95 →
92–90); widen `BF0 − BF100`. Tune with `DEBUG.visibility` on.

### The top gradient

`SiteScrollConfig`'s top gradient and `SiteNavBar`'s `NAV_GRADIENT_HEIGHT`
(180/120/90 px) are two mechanisms in different units. `TF0` and `TF100` remain
**dead tokens**. *See THE VIEWPORT GRADIENTS above — this is no longer just a
tidiness item.*

### Also dead in `VISIBILITY_TIERS`

`getScrollConfig()` and the `_config` store. So do `revealMs`, `staggerMs` and
`idleMs`. `VISIBILITY_TIERS_DESKTOP` is a duplicate copy inside
`SiteScrollConfig`. **CAUTION: v85 called this a clean sweep with "zero
consumers." Raw reference counts are `getScrollConfig` 1, `_config` 3,
`revealMs` 4, `staggerMs` 8, `idleMs` 4, `TF0` 18, `TF100` 19,
`VISIBILITY_TIERS_DESKTOP` 2.** Counts include definitions and comments, but
this is nowhere near zero and needs a real audit, not a drive-by delete.

### The scroll-fade family — see §4

Reframed entirely. Welcome is the only port, and it is parked behind the
completion signal.

### Type-role consolidation

`BODY` / `CASE_BODY` / `BODY_WELCOME` are three identical roles. **The test is
not "are these values identical" — it is "do these describe the same thing."**

### Content — remaining

- **Trailing whitespace — RESOLVED this session** (22 lines, 12 files).
- **`const N = 7` in `WorkCarousel.tsx` — RESOLVED this session**, now
  `WORK_CARDS.length`.

### Work case 01 — 12 videos wired

`SiteGallery` has **no caption or title rendering at all**. Putting the twelve
episode titles on screen is a feature.

### Deferred by decision

**Gallery poster precedence** — chain is `maxresdefault → hqdefault → folder
image`, so a hand-made poster is the FALLBACK and never shows. Left as-is.
**Crop default stays `4by3`.** **The landscape / short-viewport guard.**
**`interruptGapBefore` vs `interruptGapAfter`.** **NBSP normalisation was
rejected in favour of adoption.** **The blocks' permanent `transition:
opacity`.**

### Duplication that has already drifted

- **RESOLVED this session: `slot` in `WorkManifest`.** Deleted.
- **RESOLVED this session: `SiteTextBlock`'s hardcoded `hlColor`.** Now the
  `accent` prop.
- **KNOWING COMPROMISE, NEW: `BAND_GROWTH` is evaluated twice** — as CSS in
  `bandFalloffMask()` and as JS in `renderBand()` / `scaleStage()`. One token,
  one expression, two evaluators, because one consumer is canvas and one is CSS.
  **Commented at every site.**
- **`TAGLINES` in both hero files — DELIBERATE, now recorded.** Four of seven
  lines differ.
- Colour helpers (`rgbToHsl`/`hslToRgb`) duplicated across the two hero files.
- `BODY_WELCOME`/`BODY`/`CASE_BODY` are three identical token roles.

### The Welcome hero sizing race — partially addressed

Both heroes still compute their headline from a `window.innerWidth` read frozen
into pixels — **but the value is now capped by `openingPx()`**, so the frozen
number is at least bounded. *`not-found.tsx` still demonstrates the CSS-live
alternative in three lines.*

### Known-wrong maths, flagged and not fixed

- `WhoSkillsSphere` fog: `coreR` produces a gradient radius in the tens of
  thousands of pixels.
- `WhoSkillsSphere` `particleSpread` used two ways in the same file.
- `WelcomeHeroAnimation`'s `lineH * 0.76` cap-height guess.
- `SPACE.layout.talkNavClearance` and `SCROLL_FADE_TIERS` must agree by hand.

### Other open items

**The AE source of the Lottie fix.** `thinking-open.json` is fixed in the repo;
the After Effects project is not.

**Code health.** `npx eslint app` reports ~60 problems, nearly all pre-existing.
Next 16 does not run ESLint during `next build`. `npm audit` reports 7
vulnerabilities; **do not run `npm audit fix --force`.**

**Carried over, untouched:** hamburger menu polish; navbar gradient 3-stop
proposal; backdrop-filter blur behind navbar; fluid clamp-based body-copy
scaling (paused); full five-page three-breakpoint visual pass; Who I Am's
perceived right-bias on tablet; coding-literacy side project.

**Infrastructure.** Contact form: **DONE, with spam protection.** Remaining:
delete the unused `ftp` A record. **DMARC.**

---

## Tools & resources

- **Stack:** Next.js 16.2.9 / TypeScript / Turbopack, Vercel (Hobby,
  auto-deploy), GitHub + GitHub Desktop, VS Code. `resend` ^6.24.0.
- **Domain & DNS:** `shtooky.com` — GoDaddy registrar, Cloudflare DNS (Free),
  all records DNS-only, pointing at Vercel. MX/SPF route `mark@shtooky.com`
  through Laughing Squid/Rackspace. **`send.shtooky.com` is the Resend sending
  domain.** Squarespace fully retired.
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then the
  device to the address the **`Network:`** line prints. *Historically
  `http://10.0.0.154:3000` — that is a DHCP lease, not a constant.*
  **This — not production — is where iOS bugs get diagnosed.**
- **Safari Web Inspector over USB is the diagnostic tool of record for mobile.**
- **A private tab is the only valid mobile test surface.**
- **Live DevTools breakpoint workflow:** custom device presets at exact px
  (iPhone 390x844, iPad Mini **744x1133**, Desktop 1440x900), device toolbar
  undocked, side-by-side with a real non-emulated window.
- **`DEBUG` flags in `SiteTokens`:** `visibility`, `sequence`, `thinkBand`,
  `thinkBandTrace`. **All false, verified. `disableScrollFades` is GONE.**
- **Claude-side environment.** `device_bash` (the `remote-devices` bridge) runs
  directly on Mark's Mac, folders mounted at `$HOME/mnt/<folder>`
  (`$HOME/mnt/shtooky` → `/Users/marko/shtooky`).
  - **Each call is a fresh, isolated shell.** A backgrounded process does not
    survive past the call that started it. A dev server has to already be
    running on Mark's end.
  - **The built-in browser pane is a separate context** and cannot reach a
    `localhost` server `device_bash` started itself.
  - **Deleting files needs `device_request_delete_permission`** and a person's
    approval, once per session.
  - **Do not run `git` commands from `device_bash`.** Unchanged; not violated.
  - **`npx tsc --noEmit` DOES work there** and was run after every edit this
    session — roughly twenty times, clean every time.
  - **Heredocs normalise invisible characters**, including turning the ESCAPE
    ` ` into the literal character. Build such escapes character-by-
    character inside the writing script.
  - **NEW — the edit pattern that worked all session:** a Python script that
    asserts every replacement matches **exactly once** and exits non-zero
    otherwise, then `tsc`. It caught a stale `const N = 7`, a duplicate JSX
    `style` attribute, and several near-misses.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS, COLUMN_TIERS,
  TYPE_TIERS, SPACE, SEQUENCE, TIMING, NAV, FOOTER, VISIBILITY_TIERS,
  LOGO_GRID_TIERS, BAND_HEADLINE, BAND_HEIGHT_TIERS + `bandHeightPx()`,
  BAND_ANCHOR_Y, BAND_OPEN_LANDED_AT, BAND_VIGNETTE, RULE, VENN_SCALE_TIERS,
  DEBUG, hooks — **plus NEW: `STAGE_MAX_PX`, `stageInset()`, `stagePx()`,
  `contentWidth()`, `contentInset()`, `frameInset()`, `openingPx()`,
  `BAND_GROWTH`, `bandFalloffMask()`, `CAROUSEL_EDGE_FADE_PX`,
  `stageFalloffMask()`, `ruleFalloffMask()`, `SPACE.layout.talkBottomPad`**);
  `SiteInlineText.tsx` (`renderInline`); `SiteCaseMarkdown.tsx`;
  `SiteCanvasCover.ts`; `SiteCasePanel.tsx`; `SiteTextBlock.tsx` (**`PullTextItem`
  now takes a required `accent`**); `SiteRevealQueue.tsx`;
  `SiteSequenceController.tsx`; `SiteEasterEgg.ts`; `app/api/contact/route.ts`;
  `app/not-found.tsx`; `TalkOptions.tsx`; `WelcomeClientLogoGrid.tsx`;
  **`WorkManifest.ts` (LIBRARY + VIEW + resolver)**; `ThinkManifest.ts`;
  `SiteGallery.tsx`; `SiteScrollConfig.tsx`; `WorkCarousel.tsx`.
- **The band pair.** `WorkCarousel.tsx` and `ThinkGridCanvas.tsx` share
  `BAND_HEADLINE`, `BAND_VIGNETTE`, `SPACE.layout.bandDetailGap`, `drawCover`
  and now `BAND_GROWTH`. **What they no longer share is the scroll model, the
  height model, or the falloff** — Think's band fades across its overhang,
  the carousel keeps a hard core with a short edge, and Think's height is flat
  while Work's follows its width. All three divergences are deliberate and
  recorded.
- **Content:** `WorkCase0#.md` (7), `ThinkCard##.md` (13), `About.md`, `Talk.md`,
  all in `app/data/`. `About.md` has 6 `[pull]` blocks; `Talk.md` has none.
- **INLINE MARKUP (one vocabulary):** `<text>` accent colour, `[br]` line break,
  `[text](url)` link. **Does NOT work in `[pull]` blocks**, which keep
  `{highlight}` and are animated per word.
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention, the standing
  instruction to read `node_modules/next/dist/docs/` before writing Next code,
  and the body-copy dash convention.
- **Project bible:** v86 (this file). Superseded bibles live in
  `can_probs_delete/old-bibles/` — *missing v78 and v81; the project holds the
  canonical set.*
