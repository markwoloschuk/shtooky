# shtooky.com – Project Bible v85

*Supersedes v84. Short session: three small, related NavBar/Footer changes for
the job search – matching the resume/LinkedIn title, plus a nav-triggered
footer easter egg. No bug hunt, no diagnosis loop. The interesting part wasn't
a bug; it was a scope correction Mark caught mid-build.*

*The finding: **a subtitle's font size and its tracking are two axes solving
for the same target width, and whichever one you fix, the other one has to be
derived.** The old code fixed tracking and solved size – which is also why
the size had no token at all (v84's own file comment said so) and silently
recomputed itself the moment the text changed. Making the subtitle bigger
meant flipping which axis is the input. First attempt fixed it as three
independently-guessed per-tier numbers; **Mark caught that this broke an
existing invariant** – the second line and the color strips are supposed to
shrink in lockstep with the name, not on their own schedule – and the fix
was to notice the file already had a mechanism for exactly that (the
`nameFontSize / NAV.nameFontSize` scale factor `nameHit`/`hitAbove`/etc. already
ride on) rather than inventing a parallel one.*

*Companion documents: `spec_sequencing_2026-08-25_v01.md` (untouched) and
`spec_band_model_2026-08-27_v01.md` (untouched) – neither touched this
session. `spec_work_card_count_2026-09-02_v01.md` (untouched, still queued).*

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

*This session: bible in, folder access requested, four-item menu, first targeted
read only after he picked. Under a minute.*

**What actually carries between sessions (asked and answered this session).**
Three layers, and only two of them are automatic:

- **Persistent memory** — a small set of files about Mark and his active areas,
  shared across Cowork and claude.ai chat. Durable facts only: the stack, the
  standing vision, the working style, the fact that a bible exists and what
  version it is. It does not hold anything about `bandDocY`.
- **The Claude project** — carries these docs (bibles, the two specs) into any
  session attached to it, on any surface. This is where the detail lives.
- **Conversations do not cross.** Work done in another project or another chat
  reaches a new session only if Mark says it, or if it is written into one of
  the two layers above.

*Which is the whole argument for the bible: it is the only layer that carries
the REASONING. Memory knows a bible exists; the bible knows why
`TRANSITION_DURATION` is a rate.*

The one caveat Claude raised and Mark accepted: **the bible is a narrative of
what we decided; the repo is what's actually true.** They drift. When a specific
number matters to what's about to happen, check that number and say so —
targeted, not a sweep.

*Four axes of disagreement now recorded. v81: **the repo and the BROWSER can
disagree.** v82: **the browser and CLAUDE'S MODEL of the browser can disagree,
and only instrumentation settles it.** v83: **the bible and the repo had drifted
on the very first thing checked.** v84 adds: **the bible and the NETWORK can
disagree** — the LAN address `10.0.0.154` is a DHCP lease written down once, and
"why can't the tablet reach the dev server" is a question whose most likely
answer is that a captured value expired. Same class as `bandDocY`, in a
different medium.*

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

*This session's decisive instance is a SCREENSHOT rather than a sentence. Three
theories were on the table for the first-open bug and Claude was about to build
an instrument for them. Mark sent two browser captures — grid low on load, grid
high after the first close — and the diagnosis was over. **"When you reload the
page the grid builds below the subtitle with a space between. When you close
that first card the entire grid has shifted upwards"** names a persistent state
change, which no theory on the table predicted. The 40px was gone.*

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
"content."

**Reading measure is now a THIRD standing width, and it grew this session.**
Body copy, pullquotes and `[img]` already used `bodyMaxWidth(col)`. Galleries
(both panels) and the Who I Am Venn diagram joined them. The content column is
now for atmosphere and the band; the text column is for everything read.
*`[video-carousel]` is the last block still at content-column width, and is
deliberately outstanding — see the horizon.*

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
carries the literal character; `.tsx` string literals use the escape `\u00A0`
so it is visible in source; JSX text uses `&nbsp;`.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## BEFORE THE NEXT PUSH

1. **`BAND_ANCHOR_Y` is 0.5 and that is still a TRIAL, not a decision.** Untouched
   this session – carried forward unresolved from v84. Mark's verdict after
   looking at all thirteen: *"It's not a 1 size solve. Half of the cards are ok
   – the other half varying degrees of less so."* Either finish the per-card
   pass (see the horizon) or set it back to `0` before pushing.
2. **RESOLVED this session.** `.git/index.lock` was still sitting there from
   v84's `git stash` mistake, blocking Mark's push. Confirmed present via
   `device_list_dir`, removed via `device_request_delete_permission` + `rm` –
   a plain filesystem delete, not a git command, so the standing "never run git
   from `device_bash`" rule wasn't in tension with clearing it.
3. All four `DEBUG` flags were `false` as of v84's verification. **Not
   re-checked this session** – nothing here touched `SiteTokens`' `DEBUG`
   object.

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
- **A DURATION standing in for an EVENT** (v81) — resolved for Think in v83.
  Work still has one.
- **A DEFAULT** (v82) — an optional parameter's value chosen once, at the
  definition site, on behalf of every caller that does not pass one.
- **A CAPTURED COORDINATE** (v83) — a position read from the live document and
  stored. A measurement with an expiry date nobody wrote down.
- **NEW — a CONTESTED VALUE is a seventh kind, and it is the quietest.** A value
  two systems both believe they own. Not stale (both copies are current), not a
  default (both were supplied), not captured (nothing measured it). It is simply
  written twice, and **the last writer wins without telling anyone**. `marginTop`
  declared in JSX and written by an effect. `768` as a token and as a literal.
  `0.5` as the rule's height in two files. Three inline vocabularies for one
  idea.

### The four resolution schedules

- **CSS-live** — a `vw`/`vh`/`clamp()` string. Re-resolved every paint.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
  Correct once, stale forever.
- **Fetched** — arrives after first paint. Anything that must be on screen before
  it resolves cannot live there.

**Rule: one mechanism per visual unit.**

*A contested value is a violation of that rule at the level of a single CSS
property: two mechanisms, one number.*

### THE HABIT BEHIND THE BUGS — the seven generations

| version | the habit | example |
|---|---|---|
| v78 | a value **transcribed** from its token | visibility-zone literals |
| v79 | a value **wired to something that never changes** | `2.2em`; `[open, children]` |
| v80 | a value **you cannot see** | U+00A0 beside 30 en dashes |
| v81 | a **result you did not verify was produced by your code** | three "the fix didn't work" reports against a stale bundle |
| v82 | a value **you never supplied**, standing in as a plausible default | `scrollTargetY`; `offsetFor`; `caseIdx` |
| v83 | a **coordinate captured before the thing it refers to can change** | `bandDocY`; `TRANSITION_DURATION` as a stand-in for landing time |
| **v84** | a value **two systems both believe they own** | `marginTop` (JSX vs effect); `768`; the rule's `0.5`; three markup vocabularies |

> **v84's line: writing imperatively to a property React declares is not a
> hack that might break — it is an edit that has already been reverted, and you
> will not be told. The fix is never to write it back. It is to give the value
> one owner.**

---

## Current state – what shipped this session

All in `SiteNavBar.tsx` / `SiteFooter.tsx` / `SiteTokens.tsx`, plus one new
file. Job-search motivated: the nav needed to match Mark's resume/LinkedIn
title.

### 1. Subtitle text – matches the resume now

`S.titleText`: `"Creative Lead & Designer"` – `"Creative Director & Producer"`.
One line. The subtitle's font size is solved to fit the name's width (see #3),
so a longer string just re-solved automatically – no ripple.

### 2. `"shtooky"` – `"shtooky are*"`, one named owner for four call sites

The alt wordmark text existed in **four separate literal occurrences** in the
glitch-animation code (`glitchForward`'s settle frame, `glitchReverse`'s start
frame, and one explicit `setNameText` call). Pulled into one constant,
`S.shtookyName = "shtooky are*"`, and pointed all four at it – exactly the
"search for the literal before changing the token" habit from v78/v84, applied
to a hand-authored string instead of a numeric token.

**Deliberately NOT touched:** two hand-authored partial-corruption glyph
strings (`"sh█ooky"`, `"sh▓oky"`) used mid-transition in the glitch animation.
Those are specific letter-corruption snapshots tuned by eye, not the base word
run through the randomizer – stretching them to fit a 12-character target is
an animation-design call, not a text swap. Flagged to Mark, left alone.

### 3. Subtitle SIZE became a real, owned input – and the mechanism got corrected mid-build

**What it was:** the subtitle had no token at all (the file's own header
comment said so explicitly). Its size was *solved* – `fitFontSize()`
binary-searched for whatever size, at a fixed tracking (`NAV.titleTracking`,
0.205em), made the current text exactly fill the name's width. It silently
recomputed itself any time the subtitle text changed length, which is exactly
what happened invisibly during change #1.

**Measured live before touching anything** (dev server + the built-in browser,
`getComputedStyle`, real Archivo metrics – a computed number, not a guess):
desktop was rendering the subtitle at **13.025px** against a 38px name, tracking
solved to +2.67px to hit the same 299px box the color strips use.

**First attempt (corrected):** added a fully tiered `TYPE_TIERS.NAV_TITLE`
token (14 / 12.5 / 11 across desktop/tablet/mobile, the last two an
unrequested proportional guess) and flipped the mechanism so **size is the
input, tracking is solved** (`fitTracking()`) – matching how the shtooky-state
line already worked, just applied to both states.

**Mark's correction:** *"I think what I'd like is for the size relationships to
remain the same. So we still base the width of the 2nd line and color bars off
of the name – if the name shrinks at all, then the 2nd line/color chips
shrink in direct proportion."* Three independently-tiered numbers break that
invariant the moment anyone changes one tier without the others. **The fix was
already in the file**: `applyLayout()` already computes
`scale = nameFontSize / NAV.nameFontSize` and rides `nameHit`, `lineHeight`,
`textGap`, `hitAbove`, `hitBelow`, and `stripGap` on that exact ratio. Replaced
the three-tier `NAV_TITLE` token with a single desktop-reference input,
`NAV.titleFontSize`, scaled the same way as those five constants:
`scaledTitleFontSize = Math.round(S.titleFontSize * scale)`.

Verified live at both ends: mobile (30px name) – 12px subtitle
(`round(15 × 30/38)`); desktop (38px name) – 15px subtitle. Both still land
at exactly 299px via solved tracking. **Mark: "it's 14 or 15 I think, not sure
which yet"** – currently at 15, one number to revisit, tablet/mobile follow
it automatically.

**Dead code removed as a direct consequence:** `fitFontSize()` and
`NAV.titleTracking` both went fully unused the moment size stopped being
solved. Deleted rather than left as unreferenced code (checked: neither had
any other caller in the app).

### 4. Footer easter egg – nav-to-footer coupling, one owner

**The ask:** while the nav wordmark is in its "shtooky" glitch state (an
existing click-to-toggle that already existed, unrelated to this session),
the footer should lock to a fixed line – *"It's plural you see–– one
shtooka, many shtooky."* – instead of its normal per-page random blurb, and
resume normal rotation the moment the nav is clicked back.

**The problem:** NavBar and Footer are unconnected siblings in `layout.tsx`.
NavBar's existing toggle (`st.glitched`) is a plain ref mutated inside an event
handler – not React state, not visible outside that component at all. No
channel existed for Footer to know the nav had been clicked.

**New file, `SiteEasterEgg.ts`:** a tiny `useSyncExternalStore`-backed shared
boolean. `setShtookyMode()` is the only writer; `useShtookyMode()` is the only
reader. **Single owner, single event:** the *same* `nameWrap` click handler
that already flips `st.glitched` also calls `setShtookyMode()` – nothing
derives the flag from `st.glitched` after the fact, which is exactly the shape
v84 spent its whole session learning to avoid getting wrong (a value two
places both think they own).

**Footer side:** `useShtookyMode()` read into the existing blurb-rotation
effect, dependency array widened to `[activePage, shtookyMode]`. When true, the
effect sets the blurb to the new `FOOTER.shtookyBlurb` token instead of
rerolling the random pool – same fade transition, same timing, just a
different source. Falls straight back to random rotation the instant the flag
flips false, on any page.

**Dash convention applied, per Mark's call:** *"Make it the standard dash for
now."* Spaced en dash, NBSP before – matching `AGENTS.md`. Built the escape
character-by-character in the writing script (`chr(92) + 'u00A0'`) rather than
embedding it directly in a shell command, per the standing heredoc-normalization
hazard – verified after writing that the file contains the six-character
literal `\u00A0` escape, not a real NBSP byte. **Mark floated em dashes as
"maybe classier"** for a future revisit – not actioned this session, logged
on the horizon.

**NOT YET VERIFIED LIVE.** `tsc --noEmit` is clean and the mechanism was
checked by inspection, but the actual click-through (toggle nav, watch footer
swap and hold across a page nav, toggle back, watch it resume rotating) got
interrupted by tool/session disconnects and was never completed in-browser.
**Do this first next time this file is touched.**

## THE LOOP – how this session actually went

No bug hunt this time – three related build-and-verify changes, checked at
each step rather than diagnosed after the fact. The one real "loop" was
architectural, not a debugging one: propose a mechanism → get corrected on
scope → find the fix was already sitting in the file (see #3 above). Two
process notes worth keeping:

- **A precise question deserves a measured answer, not a computed guess.**
  Asked "how big is the name vs. the subtitle," the honest move was starting
  the dev server and reading `getComputedStyle` in a real browser against the
  real Archivo font – not estimating from the binary-search algorithm by
  hand. A background process started from `device_bash` doesn't survive past
  that single call (each call is a fresh, isolated shell) and the built-in
  browser can't reach a server *it* didn't reach independently – so this only
  worked once Mark had `npm run dev` already running on his end.
- **An approved number is not a license to extrapolate it.** Mark greenlit 14
  for desktop; the first pass invented 12.5 and 11 for tablet/mobile without
  asking. Small numbers, still not his call to make silently – and it turned
  out the file already had the right mechanism (scale-from-name) sitting
  unused for exactly this purpose.

Standing rules, carried and sharpened:

- **Confirm what is running before diagnosing why it isn't working.**
- **A private tab is the only valid mobile test surface.**
- **Two plausible mechanisms is the signal to measure, not to pick.**
- **Prefer instrumentation that persists behind a flag.**
- **Do not diagnose against production.**
- **A debug flag left deliberately on belongs in BEFORE THE NEXT PUSH the moment
  it is flipped.**
- **NEW — before writing imperatively to a DOM property, check whether React
  declares it in that element's JSX.** If it does, the write is temporary and
  nothing will report it.
- **NEW — a value that is live behaviour rather than a debug flag belongs in
  BEFORE THE NEXT PUSH the moment it becomes a trial.** `BAND_ANCHOR_Y = 0.5` is
  the instance.
- **NEW — measure a rendered value in the real browser before reasoning about
  it further.** A binary-search-solved font size is only real once something
  has actually rendered it with the real font.
- **NEW — an approved number for one tier is not an approved number for the
  others.** Extrapolating proportionally is a reasonable starting guess; it is
  still a guess that needs saying out loud, not silently shipping.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward – see
v73/v74/v75/v77/v78/v79/v80/v81/v82/v83/v84.)*

- **NEW – A subtitle's size and its tracking are two axes solving for the
  same target width; fixing one always makes the other derived.** Whichever
  axis is the input needs a real, named token – the other one is computed,
  every time, with no exceptions.
- **NEW – A value with "no separate token" is not neutral – it's a token
  that hasn't been named yet, and it drifts the instant something upstream of
  it changes.** The subtitle's solved-for size silently recomputed the moment
  the subtitle text got longer; nobody had to touch a number for it to move.
- **NEW – Before inventing a new scaling mechanism, check whether one
  already exists in the file for exactly this relationship.** The name-relative
  `scale` factor was already there, already used by five other constants;
  the first draft invented three independent tiered numbers instead of finding
  it.
- **NEW – An approved number for one tier does not authorize extrapolating
  it to the others, however small the guess.** Say what you're inferring
  beyond the literal ask, in the same message, before building it.
- **NEW – One click, one writer.** When two components need to agree on a
  boolean, wire the SAME event that sets the first owner's state to also set
  the shared one – never derive the shared value from the private one
  afterward.
- **NEW – A stray permission-blocked filesystem operation (a stale lock
  file) is not the same category as the git command that created it.**
  Clearing `.git/index.lock` with `rm` doesn't violate "never run git from
  `device_bash`" – it isn't a git command.
- Carried forward from v84: a value two systems both believe they own is a
  deletion waiting for a re-render; give the value one owner rather than
  maintaining the agreement; `height: 0` is not zero height if a child's margin
  can escape the box; prefer a BFC property React does not declare; an
  absolutely-positioned panel does not care when the layout below it changes,
  an in-flow one IS the layout; a number standing in for a measurement of
  something else is worse than a stale number; derive a deadline, do not write
  it down; a breakpoint should say where the tier changes, not name a device;
  search for the literal before changing the token; make it required and let
  the compiler find the call sites; simulate a format change over all real
  content and diff the output; when markup and renderer disagree, the failure
  is silent in both directions; a written lesson is a lookup table, not a
  habit.
- Carried forward from v83: a stored position is a measurement with an expiry
  nobody wrote down; do not refresh a stale coordinate, stop needing it; adjacent
  in source is not simultaneous; an imperative style on a React-rendered element
  is a hand-maintained agreement that any re-render breaks; a gate on whether
  content appears must fail open; a measurement that returns a believable number
  is not a measurement; a constant named DURATION can be a RATE; express a timing
  knob as a fraction of the animation; a measurement can settle a dimension
  without earning the right to settle the composition; a passive listener can
  only correct, never prevent; a reliable reproduction is not a mechanism; a
  prototype's job is to kill a fear.
- Carried forward from v82: an escape hatch added at extraction time is not wired
  just because it exists; a default is a decision made on behalf of every caller
  that doesn't pass one; a ref meaning "what is on screen" must be cleared by
  every path that clears the screen; a prop declared, passed and never read is
  worse than an unused variable; two plausible mechanisms means measure, not
  choose; instrumentation behind a flag survives, instrumentation behind a
  comment does not; verify a refactor by simulating both formulas over random
  inputs; a tier that has no tier still has a value.
- Carried forward from v81: before diagnosing why a change had no effect, prove
  the change is running; "clear on null" is not "clear on change"; a CSS
  transition that starts in the same commit as its element's mount does not
  animate; a cache can turn a timing race into a per-item behavioural difference;
  introducing a gate introduces a race; a `useCallback` with no deps can be
  load-bearing; an element whose only child is `position: absolute` measures
  zero; a duration standing in for an event is a countdown; two gestures sharing
  one number look like consistency and are a conflation; when the user says they
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
  same token can require different arithmetic per container; record the check
  that came back clean; a description of intent can delete the proposal.
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
  comment will mislead someone for months; a gap assembled from two paddings
  isn't a gap, it's a coincidence; read what the person actually wrote.
- Carried forward from v75: a track-matte layer that ends before the layer it
  mattes is a latent cross-browser bug; read a file's STRUCTURE before theorising;
  a shrink-to-fit fitter silently takes over the value it guards; where someone
  instinctively looks for a value is evidence about where it belongs; a canvas
  hard-clips at its own box mid-glyph; widening a container silently resizes
  anything sized from container width; a flat threshold compared against a
  resting position is a breakpoint bug waiting to happen.
- Carried forward from v74: `position: absolute` children contribute nothing to
  intrinsic height; a frozen JS pixel value and a live CSS `vw` are two trust
  models that can disagree; `ResizeObserver` reports settled boxes; imperative
  measurement plus declarative styling drift apart without an explicit dependency
  array; when a person says they can no longer follow how a system works, that's
  a signal about the system.

---

## Approach & patterns

- **NEW – Verify a size or width claim by rendering it, never by computing it
  by hand.** Started the dev server, opened it in the real browser, read
  `getComputedStyle` against the real font, at both the mobile and desktop
  extremes, before reporting a number.
- **NEW – When corrected on scope, name exactly what changes and revert the
  part that wasn't asked for – in the same message, before moving on.** The
  three-tier `NAV_TITLE` guess was replaced with the scale-based single input
  as soon as Mark named the invariant it broke.
- **NEW – A stray blocking artifact (a lock file, a leftover process) gets
  investigated and cleared as part of finishing the task, not left for the
  person to hit and report separately.**
- Carried forward from v84: when the small ask reveals a systemic gap, say so
  and let Mark decide the scope; deliver the deliberate exclusion in the same
  message as the feature; fix the no-op prerequisite first; name what changes
  size as a consequence, not just what you changed.
- Carried forward from v83: prototype the piece the spec calls risky; put the
  deletion in the same session as the migration; when an instrument disagrees
  with the eye, verify the instrument first; say which symptoms are expected to
  remain.
- Carried forward from v82: sweep for the class after the second instance; record
  the audit that came back clean; name what you built and did not use, in the
  same message.
- Carried forward from v81: ask for instrumentation instead of guessing a fourth
  time; test in a private tab before reporting a result; extract at the moment
  you were going to rewrite it anyway; re-read immediately before writing and
  match on the NAME, not the value; when syncing values across files, confirm the
  scope of "both."
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
  proposing the fix, in the message that proposes it; change one visible thing
  per pass; name the thing you did NOT do; verify the claim you just made, with
  the thing itself.

---

## On the horizon

### Footer easter egg – needs a live click-through, first thing

Wiring is done and typechecks (`SiteEasterEgg.ts`, NavBar's click handler,
Footer's widened effect dependency), but the actual behavior was never watched
in a browser – click nav to shtooky state, confirm the footer swaps to the
fixed line AND holds it across a page navigation, click back, confirm random
rotation resumes. Do this before anything else touches these three files.

### Nav subtitle size – not fully settled

`NAV.titleFontSize` is `15` as of this session; Mark: *"it's 14 or 15 I think,
not sure which yet."* Tablet/mobile derive automatically from whatever desktop
value is chosen (same `scale` factor as `nameHit`/`hitAbove`/etc.) – no
separate tuning needed there once desktop is settled.

### Dash convention – em dash floated for a future revisit

Mark, after agreeing to the standard spaced-en-dash for the footer easter egg:
*"we should revisit dashes in the future – em dashes are maybe classier?"*
Not actioned. If taken up, it's a house-style change in `AGENTS.md` with a
real blast radius (body copy throughout, `.tsx` literals, JSX `&nbsp;` usage) –
worth its own session, not a drive-by.

### THE SHIMMY — next session, and it is the gate for two other things

**Defect: the card motion wiggles, worse on close than open, DESKTOP ONLY.**
Mobile and tablet went smooth with the fixed band; desktop did not.

**Untested hypothesis:** the grid canvas draws each cover **centred** while the
band canvas draws it **anchored from the animation's first frame**, so the
framing slides as the rect changes height. The fix, if so, is to lerp the anchor
from 0.5 to the card's anchor alongside the shape.

**Second candidate if that fails:** subpixel/resampling. The band canvas is
`innerWidth x devicePixelRatio`, the grid stage is `NATIVE_W x TOTAL_H` scaled by
CSS — two effective resolutions for the same photograph, which is also defect #3
below. Desktop-only fits a dPR of 1 where mobile gets 2 or 3. **Instrument
before chasing this; do not guess a third time.**

**Why it goes first:** the fix builds the per-frame ANCHOR RESOLVER, and both
remaining band jobs are inputs to that same resolver. Building either of them
against a constant means rewriting it.

### The per-card band anchor — designed, agreed, NOT BUILT

`BAND_ANCHOR_Y = 0.5` fails on about half the thirteen. Agreed shape:

- **`THINK_BAND_ANCHOR`** in `ThinkManifest.ts` — a sparse `Record<number, number>`
  with a `bandAnchorFor()` resolver defaulting to `BAND_ANCHOR_Y`, exactly the
  shape `THINK_OFFSETS` / `offsetFor` already has. Six or seven entries, not
  thirteen. It belongs with the CONTENT, not in `SiteTokens`: it is a property of
  the photograph and it has no tier.
- **A tuning affordance, behind `DEBUG.thinkBand`:** Shift+Up / Shift+Down nudges
  the open card's anchor live by 0.02 and the HUD prints
  `BAND ANCHOR — card 07: 0.34`. Mark drives the crop by eye, reads the number,
  moves on. Shift-modified because plain arrows scroll the copy once a card is
  open.
- The value is a **fraction of each image's overflow**, so it is only meaningful
  against the current `BAND_HEIGHT_TIERS`. If 305/217/165 move, these get
  re-judged. Judge at desktop, spot-check the two worst cards at 768 and 390.

### The image creep — Mark's idea, deliberately last

A slight parallax of the band image as the reader scrolls the copy. **Not at risk
from the shimmy fix; the shimmy fix is what makes it cheap.** Scroll is locked
for the entire open animation, so creep is identically zero while the anchor lerp
runs — they cannot overlap. Notes from the design conversation:

- Creep must START at the judged anchor and move in ONE direction. Centring the
  travel on the judged value means half the scroll shows a crop nobody approved.
- **The hard question is units.** Anchor is a fraction of overflow, and overflow
  differs per image and per breakpoint. Creep-as-fraction moves a tall image
  further in pixels than a short one — inconsistent motion across thirteen cards.
  Creep-as-pixels is consistent and what a camera would do, but an image with
  little overflow runs out and stops dead. **Expected answer: pixels with a
  clamp**, and a clamp becoming visible tells you which image is too tight.
- **The real cost is performance**, not architecture: redrawing the band image
  every scroll frame on a canvas sized `innerWidth x dPR`. Prototype that before
  committing, and note it is adjacent to defect #3.
- One edge to write down before building: the close begins with an instant
  `scrollTo` back to the bookmark, so creep must be frozen at close-start and
  lerped out rather than snapping.

### Remaining OPEN DEFECTS on Think

1. **Step (next/prev) keeps the previous scroll position — mobile Safari only.**
   `useCasePanel` calls `window.scrollTo(0, 0)` on every step; desktop obeys,
   iOS apparently does not. **Untested against the current build**, which has
   changed substantially — retest before diagnosing.
   *A variant discussed and NOT built: make the detail its own `overflow: auto`
   scroll container and reset `el.scrollTop = 0` per step. Element scrolling is
   not subject to the iOS momentum quirk. Rejected for now because it
   reintroduces a second scroll model — but it is the known fallback.*
2. **A stepped-to card showing NO content at all.** Believed fixed by the
   fail-open backstop. Confirm.
3. **Image quality shifts on the last frame of a close.** Desktop Safari.
   Explained, not fixed: two effective canvas resolutions resampling the same
   photograph. Pre-existing.
4. **The desktop shimmy** — see above.

*Note: v83's claim that deleting the spacer would make the iOS step-scroll
problem "moot" was WRONG, and was flagged as wrong before the work started.
Collapsing everything above the copy does not move the reader; it only clamps
them. The open and per-step `scrollTo(0, 0)` are still there. What changed is
that 0 is a coordinate that cannot expire, so the scroll stopped being a hazard.*

### THE BAND MODEL — §3, §4, §5, §6, §7, §8 all built

**`spec_band_model_2026-08-27_v01.md` in the project.** What is left is the
shimmy, the per-card anchor, and:

**§4's remainder: `sizePx` is still a native reference value** while
`tabletSizePx` and `mobileSizePx` are real screen pixels — three fields, one
object, two coordinate spaces. **Non-cosmetic:** desktop's headline still ramps
with width while the band it sits in is flat at 305 above 1280, so a 2560 display
gets a 92px headline in a 305px band. Making it flat is the consistent answer.
*Coupling to know: `sizePx` also serves as the DENOMINATOR that turns
`lineHeightPx` into a ratio (`unitPx = actualSize / sizePx`). It survives —
desktop `unitPx` becomes exactly 1 — but the two fields are wired together in a
way neither name admits.*

**`lineHeightPx` needs no tiers.** Checked: 1.058 at every tier. Tiering it is a
taste question, not a defect.

**Work is untouched.** Still `CH = 480`, still the old scroll model, still
`MOBILE_BAND_HEIGHT_SCALE`. **Blocked on spec §11's open question:** Work is tall
while browsing the carousel and narrow when a case is open — two heights — where
Think has one. Confirm that asymmetry is intended before measuring Work's tiers.

**Content audit is still the part only Mark can do:** twenty band images that
must survive their crop. Think's thirteen are doubly constrained because the
covers are composed for the bento grid *and* become the band.

### The "animation finished" signal — one of three places done

- **Work's body copy** has the same latent problem; `OPEN_DELAY = 0` only because
  it is untuned. `useCasePanel` already accepts `landed`; Work simply does not
  pass it.
- **`WelcomeHeroAnimationResponsive`** takes only `autoPlay`, unlike its two
  siblings which both have `onComplete` — which is what blocks the Welcome
  bottom-heavy fix.

### Inline markup — what the unification left open

- **`[video-carousel]` is the last block at content-column width**, in both
  panels, now that galleries moved. It will read as inconsistent the first time a
  card shows both. Left alone deliberately: 16:9 video and a grid of stills fail
  differently when narrowed. One-line change when Mark decides.
- **`{}` vs `<>` for accent** — two spellings, one idea, split across the pull
  quote's per-word animator and everything else. Recorded, not fixed.
- **Link hover state** — none. The links carry colour and a 1px underline at
  0.18em offset and do nothing on hover.
- **Footer links** are code, not content. If Mark wants links there they are
  ordinary JSX, unrelated to this vocabulary.

### `CASE_FADE` tokens

Six numbers per panel, tuned by eye — inputs by the through-line's definition,
currently twelve constants in two files with nothing keeping them in sync.
*Think's OPEN values have still never been properly judged.*

### Untuned, deliberately

- **`BAND_HEIGHT_TIERS`** — 305/217/165. Watch the flat tiers at 1100–1279 and
  above 1920.
- **`BAND_ANCHOR_Y`** — **0.5, A TRIAL, and wrong on half the cards. See BEFORE
  THE NEXT PUSH.**
- **`BAND_OPEN_LANDED_AT`** — 0.88. Re-judge if `TRANSITION_DURATION` changes.
  `EP_AT_LANDING` and the grid fade follow it automatically now.
- **`GRID_FADE_START`** — 0.6, newly named. This is the knob if the twelve now
  fade too eagerly; the deadline is not.
- **`LABEL_RULE_GAP_PX`** in `TalkOptions` — 30, borrowed from Welcome's
  `lineGapPx` and **never judged at Talk's type size.**
- **`VENN_SCALE_TIERS`** — mobile 1.25 judged; desktop/tablet 1 against a
  container that just shrank 30%/20%.
- **`BREAKPOINTS.tablet` 720** — confirmed better on the mini, not stress-tested
  in the 720–767 band.
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

### Welcome — the bottom-heavy page, discussed and not built
`page.tsx:53` is a flat `35vh` spacer that never changes; every later component
is added BELOW it, so bottom-heavy is the arithmetic. **Moving the content beats
moving the viewport.** **Blocked on the completion signal above.**

### DMARC — top infrastructure item
Cloudflare is prompting. The Resend sender is proven. Start at `p=none`.

### Squarespace 404s — DECIDED, closed
**One action left:** check LinkedIn's website field, the resume PDF in the Resume
panel, and Vimeo/Behance/YouTube descriptions for deep links to old project
pages.

### Let's Talk — the location animation
`LocationPanel` shows `/images/talk/map_placeholder.jpg` at 16:9, with a comment
saying to swap it for the zoom animation, same slot.

### Reading measure for IMAGERY — largely ANSWERED this session
Galleries and the Venn moved to the text column and Mark judged both better.
*"Not narrower or not — whether images are one category or several"* now has a
partial answer: **stills and diagrams are one category and belong at the text
measure.** Video is the open question.

### Splitting the bible — proposed three times, declined three times
28KB (v75) → 40KB (v81) → larger again. **Proposal stands: split the
carried-forward principles into a `principles` doc updated rarely, leaving the
bible as current-state plus horizon.**

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
`SiteScrollConfig`. *Deletion pass offered this session and not taken.*

### The scroll-fade family — Welcome is the remaining job
**Eight separate `const SCROLL_FADE = {…}` objects in eight files.**
`WhoSkillsSphere` doesn't use its own — **and its only reader,
`getScrollOpacity`, is dead code deliberately left in place until this pass
happens.** Who I Am and Let's Talk are done.

### Type-role consolidation
`BODY` / `CASE_BODY` / `BODY_WELCOME` are three identical roles. **The test is not
"are these values identical" — it is "do these describe the same thing."**

### Content — remaining
- **RESOLVED this session:** `[note]` in `ThinkCard01` is now `//` comments — it
  had to be, or the hardened parser would have rendered it.
- **RESOLVED this session:** `ThinkCasePanel`'s raw `{fm.subtitle}`. It now goes
  through `renderInline`, so `[br]` and `<accent>` work there.
- **`WorkCarousel` hardcodes `window.innerWidth < 768`** — **RESOLVED this
  session**, now `BREAKPOINTS.tablet`.
- **Trailing whitespace** in 13 content files. Still there.
- **`const N = 7` in `WorkCarousel.tsx`** duplicates `WORK_MANIFEST.length`.

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
mitigation and **not built**.

### The tokens-first migration, continued
- **Still-flat spacing values:** `LINE_GAP_PX`, `ROW_GAP_TOP`/`ROW_GAP_BOTTOM`,
  `lineGapPx` (Welcome CTA), `marginTop: 24` on the Work text block.
- **The `vh` spacers.** Welcome five (`35vh`, `8vh`, `4vh`, `3vh`, `20vh`), Who I
  Am two, Let's Talk one. *The Venn's `4vh` top/bottom margins are two more.*
- **Hardcoded font sizes on no token:** `TalkOptions` (16/15/17), `SiteNavBar` (9),
  `WhoSkillsSphere` (11), `ThinkGridCanvas` (11), the figcaption/counter 13s in
  both case panels, `clamp()` leftovers in `ThinkBelowPlaceholder` and
  `SiteTextBlock`.
- **Delete the legacy `TYPE`/`COLUMN` static exports.** Ten files still import
  `TYPE`.

### Duplication that has already drifted
- **RESOLVED this session: three inline-markup vocabularies.** Now
  `SiteInlineText.renderInline`.
- **RESOLVED this session: the horizontal rule's spec in two files.** Now `RULE`.
- **RESOLVED this session: `768` as a token and a literal.** Now one token.
- **RESOLVED in v83: six copies of the band-height conversion.** Now
  `bandHeightPx()`.
- **RESOLVED in v82: the two cover-fit implementations.** Now
  `SiteCanvasCover.drawCover`.
- **RESOLVED in v81: the two case panels.** Now `useCasePanel`.
- **`TAGLINES` in both hero files — DELIBERATE, now recorded.** Four of seven
  lines differ. *No mechanism keeps them in sync.*
- Colour helpers (`rgbToHsl`/`hslToRgb`) duplicated across the two hero files.
- `BODY_WELCOME`/`BODY`/`CASE_BODY` are three identical token roles.
- **`hlColor = COLORS.about` is hardcoded in `SiteTextBlock`** — noticed while
  threading `accent`. Pull-quote highlights are orange on Let's Talk too, which
  is almost certainly wrong now that the file knows its page colour. **One-line
  fix available: use the new `accent` prop.**

### The Welcome hero sizing race — still unresolved
Both heroes compute the headline font size from a one-time `window.innerWidth`
read frozen into pixels. *`not-found.tsx` demonstrates the CSS-live alternative
in three lines.*

### Known-wrong maths, flagged and not fixed
- `WhoSkillsSphere` fog: `coreR` produces a gradient radius in the tens of
  thousands of pixels.
- `WhoSkillsSphere` `particleSpread` used two ways in the same file.
- `WelcomeHeroAnimation`'s `lineH * 0.76` cap-height guess.
- `SPACE.layout.talkNavClearance` and `SCROLL_FADE_TIERS` must agree by hand.

### Other open items
**The AE source of the Lottie fix.** `thinking-open.json` is fixed in the repo;
the After Effects project is not. Two other layers have the same lifespan
mismatch.

**Code health.** `npx eslint app` reports ~60 problems, nearly all pre-existing.
**`SiteInlineText.tsx` lints clean.** *One known cluster: "Cannot access refs
during render" from the callback-ref-sync pattern. Worth fixing as a group.*
Next 16 does not run ESLint during `next build`. `npm audit` reports 7
vulnerabilities; **do not run `npm audit fix --force`.**

**Carried over, untouched:** hamburger menu polish; navbar gradient 3-stop
proposal; backdrop-filter blur behind navbar; uncapped `COLUMN_TIERS.desktop.vw`;
fluid clamp-based body-copy scaling (paused); full five-page three-breakpoint
visual pass; Who I Am's perceived right-bias on tablet; the stale "copied from
desktop as placeholder" comment on `TYPE_TIERS`' mobile tier; coding-literacy
side project.

**Infrastructure.** Contact form: **DONE, with spam protection.** Remaining:
delete the unused `ftp` A record (`98.129.229.120`). **DMARC.**

---

## Tools & resources

- **Stack:** Next.js 16.2.9 / TypeScript / Turbopack, Vercel (Hobby,
  auto-deploy), GitHub + GitHub Desktop, VS Code. `resend` ^6.24.0.
- **Domain & DNS:** `shtooky.com` — registered at GoDaddy, DNS at Cloudflare
  (Free), all records DNS-only, pointing at Vercel. MX/SPF route
  `mark@shtooky.com` through Laughing Squid/Rackspace. **`send.shtooky.com` is
  the Resend sending domain.** 11 DNS records total. Squarespace fully retired.
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then the device
  (same Wi-Fi) to the address `npm run dev` prints on its **`Network:`** line.
  *Historically `http://10.0.0.154:3000` — that is a DHCP lease, not a constant.
  Read the `Network:` line rather than retyping the remembered address; if there
  is no `Network:` line the server bound to loopback only and needs
  `npm run dev -- -H 0.0.0.0`. Other causes when a device cannot connect:
  `localhost` typed on the device, a guest/split SSID with client isolation, the
  macOS firewall blocking `node`, or Private Relay/VPN on the device.*
  **This — not production — is where iOS bugs get diagnosed.**
- **Safari Web Inspector over USB is the diagnostic tool of record for mobile.**
- **A private tab is the only valid mobile test surface.**
- **Live DevTools breakpoint workflow:** custom device presets at exact px
  (iPhone 390x844, iPad Mini **744x1133**, Desktop 1440x900), device toolbar
  undocked, side-by-side with a real non-emulated window.
- **`DEBUG` flags in `SiteTokens`:** `visibility` draws labelled zone lines;
  `sequence` traces every queue decision; **`thinkBand` draws a live HUD over How
  I Think**; **`thinkBandTrace` adds a 40-frame per-frame record of the opening
  animation.** **All false.**
  - *The HUD is portalled to `document.body`* — an ancestor's stacking context
    used to cap its z-index no matter how large.
- **Claude-side environment – CORRECTED this session.** v84's claim that
  `device_bash` is a sandboxed Linux VM separate from the Mac was either wrong
  or describes a different, now-superseded tool. **This session's `device_bash`
  (the `remote-devices` bridge) runs directly on Mark's actual Mac**, with his
  connected folders mounted at `$HOME/mnt/<folder>` (`$HOME/mnt/shtooky` –
  `/Users/marko/shtooky`, confirmed via matching file listings). It CAN see
  real `localhost` state on his machine.
  - **But each call is still a fresh, isolated shell.** A backgrounded process
    (`nohup npm run dev & disown`) does not survive past the single call that
    started it – confirmed by starting the dev server, then finding no
    `node` process and a refused connection on the very next call. There is no
    way to keep a long-running process alive across `device_bash` calls; a dev
    server has to already be running on Mark's own end before Claude can use it.
  - **The built-in browser pane is a separate context from `device_bash`'s
    shell**, even though both ultimately touch the same physical Mac – it
    cannot reach a `localhost` server `device_bash` started itself, only one
    Mark (or some other independent process) already has running.
  - **Still cannot delete files by default.** `rm` on a mounted path fails with
    "Operation not permitted" until `device_request_delete_permission` is
    called and a person approves it in-session – used this session to clear
    the stale `.git/index.lock`. Not a permanent incapability, a one-time gate.
  - **The built-in browser (`Claude_Browser__*` tools) is a real capability**,
    not previously used in this file: `navigate`, `javascript_tool`
    (`getComputedStyle`, DOM queries), `resize_window` (viewport-emulate a
    breakpoint), all against whatever Mark has open or running. This is how
    the subtitle's real rendered font size got measured this session, rather
    than computed by hand.
  - **Do not run `git` commands from `device_bash`.** Unchanged from v84 –
    not violated this session. The `.git/index.lock` fix used `rm`, a plain
    filesystem delete, never `git` itself.
  - **`npx tsc --noEmit` DOES work there** and was run after every edit this
    session.
  - **Heredocs normalise invisible characters.** Never pass a literal U+00A0
    through one – and note that they also normalise the ESCAPE `\u00A0` into
    the literal character. Applied correctly this session: the footer
    easter-egg string's `\u00A0` was built as `chr(92) + 'u00A0'` inside the
    writing script and verified byte-for-byte afterward to contain the six-char
    escape, not a real NBSP.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, **BREAKPOINTS — tablet is now
  720**, COLUMN_TIERS, TYPE_TIERS, SPACE, SEQUENCE, TIMING, NAV, FOOTER,
  VISIBILITY_TIERS, LOGO_GRID_TIERS, BAND_HEADLINE, BAND_HEIGHT_TIERS +
  `bandHeightPx()`, BAND_ANCHOR_Y, BAND_OPEN_LANDED_AT, BAND_VIGNETTE,
  **RULE (NEW)**, **VENN_SCALE_TIERS (NEW)**, DEBUG, hooks, `getActivePage` +
  `isKnownPage`, `useBreakpoint` — a LAYOUT effect);
  **`SiteInlineText.tsx` (NEW — `renderInline`, the one inline vocabulary)**;
  `SiteCaseMarkdown.tsx` (`parseBlocks`, now splitting on known block names
  only; `parseAccents` is GONE); `SiteCanvasCover.ts` (`drawCover`);
  `SiteCasePanel.tsx` (`useCasePanel`, with the `landed` gate);
  `SiteTextBlock.tsx` (now takes a required `accent` prop);
  `SiteRevealQueue.tsx`; `app/api/contact/route.ts`; `app/not-found.tsx`;
  `TalkOptions.tsx`; `WelcomeClientLogoGrid.tsx`; `WorkManifest.ts`;
  `ThinkManifest.ts`; `SiteGallery.tsx`; `SiteScrollConfig.tsx`;
  `WorkCarousel.tsx` is the recurring pattern reference. **`SiteNavBar.tsx`
  additions this session:** `S.shtookyName`, `NAV.titleFontSize` (in
  `SiteTokens`, scaled via the existing `nameFontSize/NAV.nameFontSize` ratio),
  `setShtookyMode()` call in the `nameWrap` click handler. **`SiteFooter.tsx`
  additions:** `useShtookyMode()`, `FOOTER.shtookyBlurb` (in `SiteTokens`).
  **`SiteEasterEgg.ts` (NEW)** – the nav↔footer shared toggle,
  `useSyncExternalStore`-backed, one writer (`setShtookyMode`, called only from
  `SiteNavBar`), one reader (`useShtookyMode`, called only from `SiteFooter`).
- **The band pair.** `WorkCarousel.tsx` and `ThinkGridCanvas.tsx` share
  `BAND_HEADLINE`, `BAND_VIGNETTE`, `SPACE.layout.bandDetailGap` and `drawCover`.
  Their panels share `useCasePanel` and now `renderInline`. **What they no longer
  share is the scroll model — Think's is fixed-band and Work's is not.** That
  divergence is deliberate and temporary.
- **Content:** `WorkCase0#.md` (7), `ThinkCard##.md` (13), `About.md`, `Talk.md`,
  all in `app/data/`. Work blocks: `[jobbox]`, `[subtitle]`, `[label]`,
  `[paragraph]`, `[pullquote]`, `[gallery]`, `[video-carousel]`. Think: the same
  minus `[jobbox]`/`[subtitle]`, plus `[img]`. About/Talk: `[paragraph]`,
  `[subtitle]`, `[pull]`, `[slot]`. `[gallery]` line 2 is
  `Nup, crop(4by3|16by9|1by1|2by3), noClick`. **`//` comments work in all of
  them — and are now the ONLY way to leave an author note, since an unknown
  `[block]` no longer splits and would render as text.**
- **INLINE MARKUP (one vocabulary, everywhere authored text renders):**
  - `<text>` — the page's accent colour
  - `[br]` — line break
  - `[text](url)` — link; a URL with a scheme opens in a new tab
  - Works in: Think paragraph / pullquote / **subtitle**; Work subtitle /
    paragraph / pullquote; About and Talk paragraphs.
  - **Does NOT work in `[pull]` blocks**, which keep `{highlight}` and are
    animated per word.
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention, the standing
  instruction to read `node_modules/next/dist/docs/` before writing Next code,
  and the body-copy dash convention.
- **Project bible:** v85 (this file). Superseded bibles live in
  `can_probs_delete/old-bibles/` – *missing v78 and v81; the project holds
  the canonical set.*
