# shtooky.com – Project Bible v87

*Supersedes v86, same day. A short session by comparison — one capped headline
and then a single sustained piece of work: **THE WELCOME HANDOFF**, which is the
first real answer to a problem Mark says has bothered him for months.*

*The problem, in his words: **"I love how the welcome page builds on open. It's
the elevator pitch. And then we originally had a timeout where nothing happened
until the user scrolled. That was a cool idea, but created a possibility where
the user never scrolled and never discovered the rest of the content. So we
added a timeout and started fading in the rest. But that then creates a really
ugly empty space at the top of the page."***

*The resolution he chose: **the hero fades out entirely and the page closes up
behind it**, and — added later in the session, and it is the better half of the
idea — **the page does not scroll at all until the handoff is finished.***

*The finding that made the work small instead of frightening: **on desktop the
Welcome page was never a scroll chain. It was a timer chain, and its scroll
listener was never attached.** `WelcomeEverythingIsInteresting` measured itself
on mount, found itself in viewport — which at 1440×900 it always is — set
`autoFired`, and then returned before `addEventListener`. Forty lines of
scroll-driven fade logic that has never executed on a desktop.*

*Companion documents: `spec_sequencing_2026-08-25_v01.md` (untouched),
`spec_band_model_2026-08-27_v01.md` (untouched),
`spec_work_card_count_2026-09-02_v01.md` (see v86).
`spec_welcome_handoff_2026-09-13_v01.md` was a mid-session capture written while
Mark was away; **everything in it is absorbed here and it can be treated as
superseded**, kept only for the paper trail.*

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

**The 45-minute heartbeat is standing, and it RE-ARMS ITSELF** — every firing
chains the next one. Each beat reports elapsed time on the current task plus an
honest read on whether it still serves the goal.

**NEW — the heartbeat has a hole, and Mark named it.** He stepped away for
dinner and a film; six consecutive beats fired into an empty session, each one
re-arming the next and reporting the same two lines. Mark: *"the timer heartbeat
thing IS useful — but perhaps not when i step away like that? not sure how to
toggle it."* **Unresolved and explicitly deferred to a later conversation.** The
shape of the answer is probably a pause/resume the user can say in one word,
not a smarter timer. *Note for whoever builds it: deleting the scheduled task
was proposed and Mark declined the permission, so it stays armed by default —
disabling is the gentler verb.*

**What actually carries between sessions.** Three layers, only two automatic:

- **Persistent memory** — durable facts about Mark and his active areas, shared
  across Cowork and claude.ai chat.
- **The Claude project** — carries these docs into any session attached to it.
  This is where the detail lives.
- **Conversations do not cross.**

*Which is the whole argument for the bible: it is the only layer that carries
the REASONING.*

**The bible is a narrative of what we decided; the repo is what's actually
true.** They drift. *Six axes of disagreement now recorded. v81: the repo and
the BROWSER can disagree. v82: the browser and CLAUDE'S MODEL of it can
disagree. v83: the bible and the repo had drifted on the very first thing
checked. v84: the bible and the NETWORK can disagree. v85/v86: the bible can be
CONFIDENTLY WRONG about a whole subsystem.*

***v87 adds the one that should actually change behaviour: the bible was
confidently wrong AGAIN, in the very section v86 wrote to warn about being
confidently wrong.*** v86 states that `WelcomeHeroAnimationResponsive` *"takes
only `autoPlay`, unlike its two siblings which both have `onComplete`."`*
**None of the three had `onComplete`.** Had that sentence been trusted, the work
would have been scoped as a one-line passthrough and would have failed at the
first run. It took one grep to falsify.

> **Four bible claims falsified by direct check across v86 and v87. The rate is
> not falling. Treat every specific claim in this document as a HYPOTHESIS with
> a file path attached — the path is the useful part, the claim is not.**

For simple, single-value mechanical fixes, Mark prefers to be pointed at the
exact file/line. Claude makes the edit directly when a change spans multiple
files, needs verification against the shared token system, or involves an
architecture judgment call. *This session: the Talk headline was offered as a
pointer, Mark said "please go ahead," and everything after was Claude editing.*

**Mark edits the same files, live, while Claude is working in them.** Always
re-read immediately before writing, match on the constant NAME rather than its
current value, and never assume a number is what it was two messages ago.

**One thing at a time (standing instruction).** Present one decision, make the
change, look at it, then the next.

**Let Mark describe the intent before proposing the fix.** A description of
intent is a diff against the implementation.

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am (`/who-i-am`),
How I Think (`/how-i-think`), and Let's Talk (`/lets-talk`), plus a 404.

**Site vision — "single room" (standing instruction):** The site is one
continuous atmospheric space. Content hangs like banners from the ceiling. Each
page region has its own ambient lighting (five page colors). Navigation is a
camera moving through that space.

**THE STAGE (from v86, unchanged).** The whole page is a **1440-wide layout
centred in the window**. Below 1440 the stage IS the window. Above it the stage
stops growing and the leftover width becomes empty margin. Mark: *"it's like the
1440 layout becomes the fixed max width layout."*

**`vw` for THE ROOM, pixels for THE FURNITURE (from v86, and now being acted
on).** Background, full-bleed bands and the atmospheric layer should scale with
the window. Reading measure, type size, gaps, grids and **vertical position**
have a correct absolute size and should not.

**Leftmost-element principle (standing, amended in v86).** NavBar and Footer are
deliberately the leftmost elements on any page — **leftmost ON THE STAGE**, not
in the window.

**Four standing widths** at 1440:

```
                      what it is                          width   left edge
1. Full bleed         100vw                                1440          0
2. Frame edge         FRAME_INSET_VW = 2.5vw                  —         36
3. Content column     col.vw = 76vw, inset 12vw each side   1094        173
4. Text column        bodyMaxWidth = 53.2vw of viewport      766        173
```

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`. When
superseding, write the new file under its own correctly-dated name and move the
old one to `can_probs_delete/old-bibles/`. *The repo's `old-bibles/` is missing
v78 and v81; the canonical copies live in the Claude project.*

**Component naming.** A component used by more than one page takes the `Site`
prefix. Page-specific components keep their page prefix.

**Body copy dashes (in `AGENTS.md`).** Spaced en dash, never an em dash. The
space BEFORE it is a non-breaking space (U+00A0). Content `.md` carries the
literal character; `.tsx` string literals use the escape ` `; JSX text uses
`&nbsp;`.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## BEFORE THE NEXT PUSH

1. **THE ENTIRE WELCOME HANDOFF IS UNJUDGED ON MOBILE AND TABLET.** Every
   desktop iteration was judged live in Mark's browser; not one phone or tablet
   frame has been looked at. The lock uses `touchmove` preventDefault, which is
   the single most platform-sensitive thing built this session. **A private tab
   on a real phone, before anything else.**
2. **`BAND_ANCHOR_Y` is 0.5 and it is still a TRIAL, carried unresolved from
   v84, v85 and v86.** Mark's verdict on all thirteen: *"It's not a 1 size
   solve. Half of the cards are ok — the other half varying degrees of less
   so."* Either finish the per-card pass or set it back to `0`. **Raised in four
   consecutive bibles.** Still the only thing genuinely blocking a clean push.
3. **The uncommitted changeset is now TWO sessions deep** — v86's dozen files
   across four concerns, plus this session's five. **Commit in separate chunks,
   not one.** If the handoff proves wrong, bisecting a single commit containing
   both the stage model and the handoff will be miserable.
4. **The handoff is still a live design question, not a finished feature.**
   Mark: *"it's definitely pointing in the right direction, but it's not quite
   right yet."* Do not treat it as settled.

---

## THE THROUGH-LINE — the reference viewport hides your decisions

### The kinds of number (agreed framing, carried)

- **Input** — tuned by eye, nothing derives it → tokens file, tiered.
- **Derived** — computed from inputs plus a real measurement → never a token.
- **Exception** — a place that must differ → `TOKEN + NAMED_OFFSET`.
- **A DURATION standing in for an EVENT** (v81).
- **A DEFAULT** (v82) — chosen once on behalf of every caller that passes none.
- **A CAPTURED COORDINATE** (v83) — a measurement with an unwritten expiry.
- **A CONTESTED VALUE** (v84) — two systems both believe they own it.
- **A VALUE WHOSE UNIT WAS NEVER CHOSEN** (v86) — at 1440 every unit agrees.
- **NEW — A GUARD THAT NEVER VARIES AT THE REFERENCE SIZE. The ninth kind, and
  it is v86's finding moved from VALUES into CONTROL FLOW.**

### v87's line

v86 found that a number correct in two units is a decision nobody made. The same
thing happens to `if` statements, and it is harder to see because control flow
looks deliberate:

> **A guard that never fires at the size you designed at is indistinguishable
> from no guard. A guard that ALWAYS fires is indistinguishable from no branch.
> Both are decisions you have not made — and unlike a wrong number, neither one
> leaves a visible mark at the reference viewport.**

**Three instances, all found this session, all invisible at 1440×900:**

| where | the guard | at desktop | elsewhere |
|---|---|---|---|
| `WelcomeEverythingIsInteresting:443` | `if (inViewport)` | **always true** → 40 lines of scroll code never attached | on a short viewport it would have been the only path |
| `WelcomeEverythingIsInteresting:280` | `minHeight: 64` | **never bites** (lineH 75) | mobile lineH is 35 — the floor nearly doubles the box |
| `TalkRippleNetwork:538` | *(no guard at all)* | correct by coincidence | 211px at 3840 |

*The first is a branch that is really a constant. The second is a clamp that is
really a mobile-only layout rule nobody wrote. The third is the absent guard
that v86 already diagnosed. Same root, three grammatical forms.*

### The four resolution schedules (carried)

- **CSS-live** — `vw`/`vh`/`min()`/`max()`/`clamp()`. Re-resolved every paint.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
- **Fetched** — arrives after first paint.

**Rule: one mechanism per visual unit.**

### THE HABIT BEHIND THE BUGS — the nine generations

| version | the habit | example |
|---|---|---|
| v78 | a value **transcribed** from its token | visibility-zone literals |
| v79 | a value **wired to something that never changes** | `2.2em`; `[open, children]` |
| v80 | a value **you cannot see** | U+00A0 beside 30 en dashes |
| v81 | a **result you did not verify was produced by your code** | three "the fix didn't work" reports against a stale bundle |
| v82 | a value **you never supplied**, standing in as a plausible default | `scrollTargetY`; `offsetFor`; `caseIdx` |
| v83 | a **coordinate captured before the thing it refers to can change** | `bandDocY` |
| v84 | a value **two systems both believe they own** | `marginTop`; `768` |
| v86 | a value whose **UNIT was never chosen** | every layout `vw`; `OPENING.sizeVw` |
| **v87** | a **BRANCH that never varies at the reference viewport** | `inViewport`; `minHeight: 64` |

---

## Current state – what shipped this session

### 1. Let's Talk headline — capped. DONE, verified by Mark.

**Reported:** *"the headline here on lets talk is still scaling with page width.
it's vertical position too."*

**One cause, not two.** `TalkRippleNetwork.tsx:538` computed
`Math.round(window.innerWidth * (opening.sizeVw / 100))` — raw and uncapped. The
vertical drift was not a separate bug: **the text layer is `position: absolute;
bottom: 0`, so a taller headline grows UPWARD into the wordmark.** Everything
else in that block was already flat tiered px (`CFG.HEIGHT: 350`,
`TEXT_BOTTOM_PADDING: 100`).

**Fix:** `const fontSize = openingPx() || 72`, plus `openingPx` added to the
import. `openingPx()` returns 0 with no window, so `|| 72` preserves the exact
SSR fallback the line always had.

```
viewport    before    after
  1440        79        79     ← control, pixel-identical
  1920       106        79
  2560       141        79
  3840       211        79
```

**Still frozen per load** — computed inside the `[breakpoint]` effect, so a
resize does not re-run it. Harmless now that the value cannot vary above 1440.
**Judge by reloading at each width, never by dragging the window.**

`OPENING.sizeVw` consumers remaining: `WorkCarousel`, `ThinkOpenAnimation`
(derived — needs re-deriving, not re-typing), `not-found`.

### 2. THE WELCOME HANDOFF — the session's real work

#### 2.1 What it does now

```
phase  window                    state          the page
  1    0 – ~3550ms               hero plays     LOCKED, gestures swallowed
  2    + HERO_HOLD_MS (3000)     hero holds     LOCKED, gestures swallowed
  3    armed                     hero waits     LOCKED, gestures DISMISS
  4    dismissed                 fade, collapse LOCKED
  5    contentStart              content in     unlocked
```

Backstop: if nobody moves at all in phase 3, `HERO_BACKSTOP_MS` (5500) advances
anyway — total ~12s. **That backstop is the whole reason the original timeout
existed and must not be removed:** a visitor who never scrolls must still reach
the rest of the site.

#### 2.2 The real completion moment

`TAGLINE_DELAY (2050) + TAGLINE_DUR (1500)` = **3550ms.** The tagline is the last
pixel to settle — *not* the headline resolve, which finishes earlier. `onComplete`
fires from the `else` branch of `taglineFrame`, guarded by `completeFired`. Same
numbers in both hero files.

*Pleasant accident worth knowing before anyone retunes: 3550 + 3000 = 6550, and
the old hardcoded `autoDelay` was 6000. **The pacing Mark already liked survived
by coincidence.** Do not read the new numbers as tuned.*

#### 2.3 THE SECOND OWNER — the sharpest finding

Both hero files own their own opacity on scroll (`WelcomeHeroAnimation.tsx:595`,
`WelcomeHero2Line.tsx:565`):

```js
function handleScroll() {
    const scrollY = window.scrollY
    const raw = (scrollY - SCROLL_FADE.fadeStart) / (SCROLL_FADE.fadeEnd - SCROLL_FADE.fadeStart)
    wrap.style.opacity = (1 - clamp(raw)).toFixed(3)
}
```

`fadeStart: 170`. **And scroll was to be a dismiss trigger.** So: user scrolls
5px → dismissal starts fading the hero → *the same scroll event* runs this
handler → 5 is far below 170 → **it writes opacity back to 1 and the hero snaps
back.** Not a theoretical collision; a certain one.

**Resolution:** a `dismissedRef` guard at the top of `handleScroll` in both
files. Once the page has dismissed the hero, the page owns that opacity.

> **v84 said two systems can both believe they own a value. v87's refinement:
> the collision is worst when THE EVENT THAT TRANSFERS OWNERSHIP IS THE SAME
> EVENT THE OLD OWNER LISTENS FOR.** Handover and conflict fire together, in one
> tick, and the old owner wins because it runs synchronously.

#### 2.4 Why the page is locked rather than scrolled

Mark's first instinct was to auto-scroll the page. Rejected, and the reason is
concrete: `ClientLogoGrid` has `triggerOnScroll={true}`, every `ScrollFade`
attaches a `handleScroll`, and `page.tsx` already owns scroll position via
`scrollTo(0, 0)`. A programmatic scroll fires real scroll events — it would trip
the grid early, re-measure every fade at once, and fight the user's wheel.
**v86's rule held: moving the content beats moving the viewport.**

Mark then proposed the better version himself: *"the hero no longer scrolls — at
all. you can't scroll the welcome page until the hero animation finishes + the
delay."*

**Why the page is scrollable at all before that:** every component below is
already in the DOM occupying layout — `ScrollFade` renders children at
`opacity: 0`, not `display: none`. The document is full height from the first
frame. Nothing is "not there yet"; it is merely invisible.

**The lock is `preventDefault` on `wheel` / `touchmove` / scroll keys, NOT
`overflow: hidden` on the body.** Overflow-hidden removes the scrollbar, which
shifts the whole layout ~15px sideways on any platform without overlay
scrollbars — invisible on Mark's Mac, ugly for a Windows visitor.
`preventDefault` is layout-neutral everywhere and leaves the events intact so
phase 3 can still read them.

#### 2.5 The race that was designed out

The first plan was: unlock at phase 3, re-lock at phase 4. **That loses a race.**
The dismiss listener fires on the wheel event, but the re-lock is React state and
only lands a tick later — the page drifts 50–100px before the collapse, which is
precisely the unpredictable geometry the lock exists to prevent.

**So the lock is held continuously from mount to `contentStart`. What changes at
the end of the hold is not the lock — it is what a gesture MEANS.**

> **NEW — a state change cannot gate the event that caused it.** Anything you
> want suppressed during a transition must already be suppressed before the
> transition's trigger fires.

#### 2.6 The collapse mechanism

`grid-template-rows: 1fr → 0fr` on a wrapper whose child has `overflow: hidden`,
with the transition delayed by `HERO_FADE_MS` so the two motions read as one
beat: fade out, then close the gap.

**Not a measured `offsetHeight`.** The hero sets its own height via
`setHeight(contentH)`; measuring it and writing it back would freeze a value it
owns — a captured coordinate (v83) in a component that recalculates on resize.
Requires Chrome 107+ / Safari 16+.

#### 2.7 `autoDelay: 6000` — a duration standing in for an event, retired

It stood in for "the hero has finished." Now **0**, with `page.tsx` owning the
entire wait. `WelcomeEverythingIsInteresting` gained a `start` prop and no
longer self-fires on mount. One owner of the sequence timing.

#### 2.8 The tuning pass Mark asked for

- **Desktop — "interesting" pushed lower.** `TOP_SPACER_AFTER` was a single
  `12vh`; now tiered px, which also moves it off viewport units for vertical
  position:
  ```
            was                now
  desktop   12vh of 900 = 108  →  165   ← the only visual change
  tablet    12vh of 1024 = 123 →  123
  mobile    12vh of 844 = 101  →  101
  ```
- **Mobile — the gap above and below "interesting" closed.** Removed
  `minHeight: 64`. See the guard table above: mobile's real `lineH` is ~35px, so
  the floor nearly doubled the box, and because the word is drawn centred in it
  the surplus split evenly top and bottom. **Provably mobile-only.**
- **Paragraph succession.** `ScrollFade` already had a `mountDelay` prop that
  nothing used. The second paragraph now passes `PARA_STAGGER_MS` (600) against
  a 1000ms fade, so they overlap rather than queue.

#### 2.9 Files changed

| file | change |
|---|---|
| `WelcomeHeroAnimation.tsx` | `onComplete` + `dismissed`; fires at tagline end; scroll-fade guard |
| `WelcomeHero2Line.tsx` | identical |
| `WelcomeHeroAnimationResponsive.tsx` | passes both through |
| `WelcomeEverythingIsInteresting.tsx` | `start` prop; `autoDelay` 6000 → 0; `minHeight` removed |
| `page.tsx` | five-phase state machine, the lock, collapsing wrapper, tiered spacer, stagger |
| `TalkRippleNetwork.tsx` | `openingPx()` |

**`tsc --noEmit` clean after every edit.** Every edit ran through a Python script
asserting each replacement matched **exactly once**, aborting otherwise.

#### 2.10 Untuned, and which are guesses

```
HERO_HOLD_MS        3000    Mark's number
HERO_BACKSTOP_MS    5500    GUESS
HERO_FADE_MS         700    GUESS
HERO_COLLAPSE_MS     600    GUESS
TOP_SPACER_AFTER_PX  165/123/101   desktop judged once; other two derived
PARA_STAGGER_MS      600    GUESS
```

**`HERO_HOLD_MS` is the one most likely to be wrong**, and for a reason worth
writing down: *three seconds of a page that refuses to move is longer than three
seconds of a page that will.* If it reads as stuck rather than composed, drop it
toward 1500 before touching anything else.

---

## OPEN — the named next job on Welcome

**Mark, on the fade-out: *"it's messing with the logo grid and the other content
below, but it might be solveable."*** Reported before the scroll lock existed and
**not re-checked since.** The lock should shrink it — the collapse now always
happens from scroll position zero — so **re-look before diagnosing.**

Untested hypothesis, recorded so nobody guesses twice: `ClientLogoGrid`'s
`triggerOnScroll` and the downstream `ScrollFade`s measure
`getBoundingClientRect()` on scroll, and the collapse moved ~200px of geometry
underneath them between measurements. **Instrument before chasing this.**

---

## THE LOOP – how this session went

Same shape as v86: Claude builds a mechanism with one tunable number → Mark looks
→ Mark's reaction reveals a requirement nobody had stated → repeat. **Four
rounds on the Welcome opening.**

Process notes worth keeping:

- **The best idea in the session came from Mark, after three rounds of looking.**
  The scroll lock was not in any plan Claude proposed; it arrived as *"here's
  what also might help"* once he had seen the fade-out behave badly. **Rounds of
  looking are not overhead — they are where the requirement comes from.**
- **Claude proposed a refinement with a race in it and caught it while building,
  not while designing.** The unlock/re-lock idea sounded right in prose and was
  wrong in event order. Saying so in the same message as the build, rather than
  quietly doing something different, is the behaviour to keep.
- **State the arithmetic before the opinion.** The `minHeight: 64` table settled
  the mobile question in one pass — three numbers, no discussion needed.
- **An honest "nothing happened" is a valid report.** Six heartbeats fired into
  an empty session; each one said so in two lines and started no work. The
  alternative — inventing progress to fill a check-in — is worse.

Standing rules, carried and sharpened:

- **Confirm what is running before diagnosing why it isn't working.**
- **A private tab is the only valid mobile test surface.**
- **Two plausible mechanisms is the signal to measure, not to pick.**
- **Do not diagnose against production.**
- **Before adding a second owner to a CSS property, check who already owns it.**
- **A mask belongs on the element that paints the background.**
- **A self-gating formula beats a tier flag.**
- **NEW — grep the signature before believing the bible about an API.** One
  command falsified a claim that would have mis-scoped the whole job.
- **NEW — when a feature is unjudged, say "typechecks" and nothing more.**
  "Built" and "working" are different words.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see v73–v86.)*

- **NEW – A guard that never varies at the reference viewport is not a guard.**
  Always-true and never-true are both invisible at the size you designed at, and
  both mean a decision was never made. `inViewport` was always true at 1440×900;
  `minHeight: 64` never bit above mobile. Same root as v86's units, moved into
  control flow.
- **NEW – A state change cannot gate the event that caused it.** React state
  lands a tick after the handler runs. Anything that must be suppressed during a
  transition has to be suppressed *before* the trigger fires — which is why the
  Welcome lock is continuous rather than toggled.
- **NEW – The worst second owner is the one listening for the handover event
  itself.** The hero's scroll-fade and the page's dismissal both keyed on scroll;
  the old owner wins because it runs synchronously in the same tick.
- **NEW – Components at `opacity: 0` still make the document tall.** "The page
  shouldn't scroll yet" is never true by default when the content below is
  faded rather than unmounted.
- **NEW – `preventDefault` and `overflow: hidden` are not the same lock.** One is
  layout-neutral and leaves the events readable; the other removes the scrollbar
  and shifts the layout on every platform without overlay scrollbars.
- **NEW – A bottom-anchored element grows upward.** The Let's Talk headline's
  "vertical drift" was not a position bug at all; it was the size bug expressing
  itself through `position: absolute; bottom: 0`. **Check the anchor before
  believing you have two problems.**
- **NEW – Coincidence is not tuning.** The new phase timings land within 550ms of
  the old hardcoded 6000 by accident. Recording that prevents the next session
  from treating them as judged.
- Carried from v86: a number correct in two units is a decision not yet made;
  `vw` for the room, pixels for the furniture; a photograph fades, a structure
  gets an edge; a mask can only fade the element it is on; a value in the wrong
  coordinate space produces a picture, not an error; a formula that looks
  viewport-dependent may cancel; a uniform `scale()` cannot make something wider
  without making it taller; six consumers hide behind one token; full-viewport
  overlays stop being correct when the composition stops being full-viewport;
  one event, one writer; one id, one owner.
- Carried from v84/v85: a subtitle's size and its tracking solve for the same
  target width; a value with "no separate token" is a token not yet named; check
  whether a scaling mechanism already exists in the file; an approved number for
  one tier does not authorize the others; `height: 0` is not zero height if a
  child's margin can escape; an absolutely-positioned panel does not care when
  the layout below it changes; derive a deadline, do not write it down; a
  breakpoint should say where the tier changes, not name a device; search for the
  literal before changing the token; make it required and let the compiler find
  the call sites; a written lesson is a lookup table, not a habit.
- Carried from v83: a stored position is a measurement with an expiry nobody
  wrote down; adjacent in source is not simultaneous; a gate on whether content
  appears must fail open; a measurement that returns a believable number is not a
  measurement; a constant named DURATION can be a RATE; a reliable reproduction
  is not a mechanism; a prototype's job is to kill a fear.
- Carried from v82: an escape hatch added at extraction time is not wired just
  because it exists; a default is a decision made for every caller that doesn't
  pass one; a prop declared, passed and never read is worse than an unused
  variable; instrumentation behind a flag survives, behind a comment does not.
- Carried from v81: before diagnosing why a change had no effect, prove the
  change is running; introducing a gate introduces a race; an element whose only
  child is `position: absolute` measures zero; two gestures sharing one number
  look like consistency and are a conflation.
- Carried from v80: an invisible character is a value no search can confirm; a
  search that comes back empty is not proof; a dimension derived from the wrong
  axis fails in one direction only; a bible entry can be stale by being FIXED.
- Carried from v79: a dependency on a proxy is not a dependency; when the fix
  makes a dependency unnecessary, delete it; record the check that came back
  clean; a description of intent can delete the proposal.
- Carried from v78: a value transcribed from a token is worse than no token; a
  count of on-screen items is a viewport-dependent number in a
  viewport-independent costume; moving something into a container silently
  rescales anything sized relative to the VIEWPORT; two numbers can be identical
  and mean opposite things.
- Carried from v77: a comment asking two copies to stay in sync is a countdown;
  macOS lies to you about case; a responsive rule that "helpfully" reduces can
  destroy an authored composition; a gap assembled from two paddings isn't a gap;
  read what the person actually wrote.
- Carried from v75/v74: a shrink-to-fit fitter silently takes over the value it
  guards; `position: absolute` children contribute nothing to intrinsic height; a
  frozen JS pixel value and a live CSS `vw` are two trust models that can
  disagree; when a person says they can no longer follow how a system works,
  that's a signal about the system.

---

## Approach & patterns

- **NEW – Make the change a no-op at the reference width, then judge it
  elsewhere.** Carried from v86 and it held again: every tuning change this
  session was scoped so that only one tier moved.
- **NEW – Name which numbers are guesses, in the same message that ships them.**
  Six constants shipped this session; one was Mark's and five were Claude's
  starting points. Saying which is which is what lets him aim his attention.
- **NEW – Assert every replacement matches exactly once, and abort the whole
  script if not.** Carried from v86, used on every edit, zero misfires.
- **NEW – Do not rewrite a file whose invisible characters you have not counted.**
  `page.tsx` was edited by targeted substring replacement rather than full-file
  rewrite specifically because its body copy carries en dashes and the NBSP
  convention. *(Finding: `page.tsx:145` has a plain space before its en dash, not
  the required NBSP. Predates this session. Recorded, not fixed.)*
- Carried from v85: verify a size or width claim by rendering it, never by
  computing it by hand; when corrected on scope, name exactly what changes and
  revert the part that wasn't asked for, in the same message.
- Carried from v84: when the small ask reveals a systemic gap, say so and let
  Mark decide the scope; deliver the deliberate exclusion in the same message as
  the feature; name what changes size as a consequence.
- Carried: write the spec before the code when the change spans a system; record
  the mistake, not just the fix; own the flagged risk that was not checked; say
  which files change VISUALLY and how many; bible-drop means catch up fast and
  offer a menu; fix stale comments in the same pass as the code they describe;
  point to file/line for simple mechanical fixes; propose a mechanism plus a
  reasoned starting guess and let Mark's live judgment set the number; always
  read current file contents before editing; diagnose fully before touching code;
  explain the mechanism before proposing the fix, in the message that proposes
  it; change one visible thing per pass; name the thing you did NOT do.

---

## On the horizon

*(v86's horizon carries forward essentially intact. Only deltas are noted.)*

### Welcome — no longer "bottom-heavy", now "unjudged"

The `35vh` spacer problem is **solved in principle** — it collapses with the
hero. What replaces it on the horizon is the logo-grid disturbance above, and
the fact that none of it has been seen on a phone.

**`WelcomeHeroAnimationResponsive` now HAS `onComplete`**, which was listed in
v86 as blocking both this fix *and* the scroll-fade port. **The scroll-fade port
is therefore unblocked** — see §4 of v86. Mark previously parked it deliberately
to work on Welcome's loading first; that preference stands and Welcome's loading
has still not been scoped.

### THE CAROUSEL'S COORDINATE SPACE — still the named next job

Unchanged from v86. Mark: *"beyond 1440 the carousel still grows and gets wider
(not taller), each slice gets wider."* The stage is a fixed `CW × CH` box under a
**uniform** `scale(s)`; width and height are the same number. The fix is a flat
px height, as Think's band already does, with images re-cropping rather than
scaling. **It is also the file the desktop shimmy lives in. Do it fresh.**

### THE VIEWPORT GRADIENTS — should they be on the stage?

Unchanged from v86. The nav gradient's `mixBlendMode: multiply` across
`left:0 right:0` multiplies a photograph over the stage and the page background
over the faded margin, and the seam lands exactly where the mask ramps. **The
last full-viewport layout decisions not yet moved onto the stage.**

### TYPE AND VERTICAL SPACING → absolute values

Progressing. **DONE:** both Welcome heroes (`openingPx()`); Let's Talk's `18vh`;
**NEW this session:** the Talk headline, and Welcome's post-collapse top spacer.
**REMAINING `vw` type:** `OPENING.sizeVw` in WorkCarousel, ThinkOpenAnimation
(derived — needs re-deriving), `not-found`. **REMAINING `vh` spacers:** Welcome's
`35vh` / `8vh` / `4vh` / `3vh` / `20vh` (the first two now collapse but are still
`vh` while visible), Who I Am's two, the Venn's `4vh` margins. `TalkOptions`'
Resume panel `70vh` is a **viewer, not spacing** — left deliberately.
**The proper next step is still an INVENTORY, not a migration.**

### Everything else, carried unchanged from v86

The `BREAKPOINTS` findings (`desktop: 1440` is not a breakpoint; desktop really
begins at 1280 under a key named `laptop`). Work page: more cards vs a
CLIENT-axis carousel, and the "two named views over one library" resolution.
AI-generated video for the How I Think cards. The motion graphics reel with no
home. THE SHIMMY. The per-card band anchor. The image creep. Think's four open
defects. THE BAND MODEL (Work untouched, blocked on spec §11). Welcome's loading.
Inline markup leftovers. **DMARC — still the highest-value non-code item**, plus
deleting the unused `ftp` A record (`98.129.229.120`). Squarespace 404s. Let's
Talk's location animation. Splitting the bible — **proposed five times now, and
this file is longer again.** `BF0`/`BF100` desktop. The top gradient. The dead
tokens in `VISIBILITY_TIERS` (**needs a real audit, not a drive-by delete** —
raw reference counts are nowhere near zero). Type-role consolidation. Work case
01's twelve videos with no caption rendering. Known-wrong maths in
`WhoSkillsSphere`. Code health (~60 eslint problems, 7 npm audit vulns — **do
not run `npm audit fix --force`**).

---

## Tools & resources

- **Stack:** Next.js 16.2.9 / TypeScript / Turbopack, Vercel (Hobby,
  auto-deploy), GitHub + GitHub Desktop, VS Code. `resend` ^6.24.0.
- **Domain & DNS:** `shtooky.com` — GoDaddy registrar, Cloudflare DNS (Free),
  all records DNS-only, pointing at Vercel. MX/SPF route `mark@shtooky.com`
  through Laughing Squid/Rackspace. **`send.shtooky.com` is the Resend sending
  domain.** Squarespace fully retired.
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then the device
  to the address the **`Network:`** line prints. *A DHCP lease, not a constant.*
  **This — not production — is where iOS bugs get diagnosed.**
- **Safari Web Inspector over USB is the diagnostic tool of record for mobile.**
- **A private tab is the only valid mobile test surface.**
- **Live DevTools breakpoint workflow:** custom device presets at exact px
  (iPhone 390x844, iPad Mini **744x1133**, Desktop 1440x900), device toolbar
  undocked, side-by-side with a real non-emulated window.
- **`DEBUG` flags in `SiteTokens`:** `visibility`, `sequence`, `thinkBand`,
  `thinkBandTrace`. All false. `disableScrollFades` is GONE (v86).
- **Claude-side environment.** `device_bash` runs directly on Mark's Mac, folders
  mounted at `$HOME/mnt/<folder>` (`$HOME/mnt/shtooky` → `/Users/marko/shtooky`).
  - **Each call is a fresh, isolated shell.** A dev server must already be
    running on Mark's end.
  - **The built-in browser pane cannot reach a `localhost` server.**
  - **Deleting files needs `device_request_delete_permission`.**
  - **Do not run `git` commands from `device_bash`.**
  - **`npx tsc --noEmit` DOES work there.**
  - **Heredocs normalise invisible characters.** Build escapes
    character-by-character inside the writing script.
  - **The edit pattern that works:** a Python script asserting every replacement
    matches exactly once, exiting non-zero otherwise, then `tsc`.
  - **NEW — the folder is NOT connected at session start.** It needed
    `device_request_folder_access` for `/Users/marko/shtooky` before any work
    could begin. Expect to ask.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS, COLUMN_TIERS,
  TYPE_TIERS, SPACE, SEQUENCE, TIMING, NAV, FOOTER, VISIBILITY_TIERS,
  LOGO_GRID_TIERS, BAND_HEADLINE, BAND_HEIGHT_TIERS, BAND_ANCHOR_Y,
  BAND_VIGNETTE, RULE, VENN_SCALE_TIERS, DEBUG, `STAGE_MAX_PX`, `stageInset()`,
  `stagePx()`, `contentWidth()`, `contentInset()`, `frameInset()`,
  **`openingPx()` — now read by the Talk headline too**, `BAND_GROWTH`,
  `bandFalloffMask()`, `CAROUSEL_EDGE_FADE_PX`, `stageFalloffMask()`,
  `ruleFalloffMask()`, `SPACE.layout.talkBottomPad`); `SiteInlineText.tsx`;
  `SiteCaseMarkdown.tsx`; `SiteCanvasCover.ts`; `SiteCasePanel.tsx`;
  `SiteTextBlock.tsx`; `SiteRevealQueue.tsx`; `SiteSequenceController.tsx`;
  `SiteEasterEgg.ts`; `app/api/contact/route.ts`; `app/not-found.tsx`;
  `TalkOptions.tsx`; `WelcomeClientLogoGrid.tsx`; `WorkManifest.ts`;
  `ThinkManifest.ts`; `SiteGallery.tsx`; `SiteScrollConfig.tsx`;
  `WorkCarousel.tsx`.
  **NEW — the Welcome handoff set:** `app/page.tsx` (the five-phase state
  machine and the lock), `WelcomeHeroAnimation.tsx`, `WelcomeHero2Line.tsx`,
  `WelcomeHeroAnimationResponsive.tsx`, `WelcomeEverythingIsInteresting.tsx`,
  `WelcomeScrollFade.tsx` (**`mountDelay` is now in use**).
- **Content:** `WorkCase0#.md` (7), `ThinkCard##.md` (13), `About.md`, `Talk.md`,
  all in `app/data/`. `About.md` has 6 `[pull]` blocks; `Talk.md` has none.
- **INLINE MARKUP (one vocabulary):** `<text>` accent colour, `[br]` line break,
  `[text](url)` link. **Does NOT work in `[pull]` blocks**, which keep
  `{highlight}` and are animated per word.
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention, the standing
  instruction to read `node_modules/next/dist/docs/` before writing Next code,
  and the body-copy dash convention.
- **Project bible:** v87 (this file). Superseded bibles live in
  `can_probs_delete/old-bibles/` — *missing v78 and v81; the project holds the
  canonical set.*
