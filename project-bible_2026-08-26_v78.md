# shtooky.com — Project Bible v78

*Supersedes v77. The session began as a bible-drop catch-up, spent twenty
minutes closing the last band duplication, and then became a full rebuild of
the Who I Am page's sequencing — audit, spec, content-format migration, and a
new reveal queue. Along the way it found the habit behind most of the recent
layout bugs: **numbers that were designed as tokens and then transcribed by
hand into the code that uses them.** Three of the four visibility-zone tokens
existed twice.*

*Companion document: `spec_sequencing_2026-08-25_v01.md` (now at v03) holds the
sequencing model in full — the model, the zone geometry, the content format,
the delete list, the verification plan. This bible is the narrative; that spec
is the specification. Read it before touching sequencing.*

---

## Purpose & context

Mark (also goes by Marko) is a San Francisco Bay Area–based freelance
Creative Director with 25+ years of experience, building shtooky.com as a
primary portfolio site targeting Creative Lead and Creative Director roles
at tech companies. Next.js 16 / TypeScript / Turbopack, deployed on Vercel.
Claude is Mark's primary technical partner across all sessions.

Mark is not a coder by background — his mental model comes from motion
graphics and After Effects expressions, and he actively wants the
underlying web concepts explained plainly rather than just applied. He
judges all visual outcomes and makes every aesthetic decision himself.

**Session-start ritual (standing instruction):**
When Mark drops the bible in, do NOT go read the whole codebase and come
back twenty minutes later with a report. Catch up to where we left off and
suggest the areas we might work on. Fast. His words: *"this might be a
place where I would value speed of interaction over not knowing what's
happening and why it's taking so long… I like to talk things through and
understand what we are doing and why. I'd like to keep those interactions
pretty speedy if we can."*

The one caveat Claude raised and Mark accepted: **the bible is a narrative
of what we decided; the repo is what's actually true.** They drift. When a
specific number matters to what's about to happen, check that number and
say so — targeted, not a sweep. And when something genuinely needs a dig,
say "I think this needs me to go read the code for a few minutes, want me
to?" rather than going quiet.

*This session proved the caveat twice. v77 said `CaseStudyImages_1/youtube_link/`
contained zero images; it contains sixteen. v77 said Think hardcodes `0.6`
where Work has `CFG.VIG_HEIGHT`; both were true and the two numbers meant
opposite things.*

For simple, single-value mechanical fixes, Mark prefers to be pointed at
the exact file/line. Claude makes the edit directly when a change spans
multiple files, needs verification against the shared token system, or
involves an architecture judgment call.

**One thing at a time (standing instruction).** Present one decision, make the
change, look at it, then the next.

**NEW — Let Mark describe the intent before proposing the fix.** The best hour
of this session was Mark laying out, point by point, what he wanted sequencing
to do while Claude compared each point against the code. Five points produced
six findings, and two of them (the frozen zone tokens, the never-used colour
fade-out) would not have surfaced from reading the code alone. **A description
of intent is a diff against the implementation.** Claude's role there is to
hold each point up to the code and say where it aligns and where it doesn't —
not to start proposing.

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am
(`/who-i-am`), How I Think (`/how-i-think`), and Let's Talk (`/lets-talk`).

**Site vision — "single room" (standing instruction):** The site is one
continuous atmospheric space. Content hangs like banners from the ceiling.
Each page region has its own ambient lighting (five page colors).
Navigation is a camera moving through that space.

**Leftmost-element principle (standing instruction):** NavBar and Footer
are deliberately the leftmost elements on any page, at any breakpoint —
all other content indents from that shared edge, via `FRAME_INSET_VW`.
*Knowingly bent twice:* the Who I Am skills-sphere canvas is full-bleed on
mobile/tablet, and — NEW — that canvas now escapes the content column via
`bleed: true` on its `[slot]`, the same treatment `SiteBackground` gets,
because the atmospheric layer isn't "content." Commented at both.

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`.
When superseding, write the new file under its own correctly-dated name
and remove the old one rather than reusing the path.

**NEW — component naming.** A component used by more than one page takes the
`Site` prefix. Page-specific components keep their page prefix (`Who…`,
`Work…`, `Think…`, `Welcome…`, `Talk…`). `SiteRevealQueue.tsx`,
`SiteCaseMarkdown.tsx` and `SiteSequenceController.tsx` were all renamed under
this rule in the same pass. **Every component in
`app/components/` now carries a prefix**, so a file without one is a signal.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## THE THROUGH-LINE — tokens-first (read this first)

**What "hardcode" means** — explicit per-tier numbers, tuned by eye, living in
the tokens file. Not derived formulas. Not local component constants.

### The three kinds of number (agreed framing)

- **Input** — a number tuned by eye, nothing derives it. → **Lives in the
  tokens file, tiered.**
- **Derived** — computed from inputs plus a real measurement. → **Never a
  token.** Stays in the component; every input it reads comes from tokens, and
  any fudge factor gets a name and a comment.
- **Exception** — a place that must differ. → `TOKEN + NAMED_OFFSET`.

The value of the split: **the tokens file becomes the list of things you are
allowed to change by eye.**

### The four resolution schedules

- **CSS-live** — a `vw`/`vh`/`clamp()` string. Re-resolved every paint.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
  Correct once, stale forever.
- **Fetched** — arrives after first paint. Anything that must be on screen
  before it resolves cannot live there.

**Rule: one mechanism per visual unit.**

### NEW — THE HABIT BEHIND THE BUGS: transcription instead of import

This session's largest finding, and it explains most of the "designed but
doesn't work" feeling on this codebase. Three of the four visibility-zone
tokens existed **twice** — once as a tiered, commented token, and once as a
desktop-measured literal in the code that was supposed to read it:

| token | value (desktop) | in the code as | where |
|---|---|---|---|
| `TF100` | 24vh ≈ 216px | `fadeOutStart: 250` | `SiteTextBlock` |
| `TF0` | 6vh ≈ 54px | `fadeOutEnd: 50` | `SiteTextBlock` |
| `BF100` | 85vh | `window.innerHeight * 0.85` | ×3, two files |

`BF0` was the only one genuinely wired, because the bottom gradient reads it.

Two more of the same shape turned up the same day: `highlightColor: "#FAAF40"`
repeated on six pull quotes **is** `COLORS.about`, and `WhoVennDiagram` /
`WelcomeClientLogoGrid` each carried `150`/`300` px triggers where a tiered
`vh` token existed.

> **A value transcribed from a token is worse than no token at all: it looks
> tunable, tiers correctly in the file, and does nothing.** When a number in a
> component matches a token's desktop value, that is not a coincidence — it is
> a broken import.

### The same principle applied to CONTENT

`WorkManifest.ts` is the work page's config file the way `SiteTokens.tsx` is
the site's. The test that decides each case: **where would Mark's hand go
looking for it.**

**NEW — extended to the About and Let's Talk pages.** `AboutContent.ts` and
`TalkContent.ts` are gone. `About.md` and `Talk.md` hold the words, the
sequence, and the pull-quote choreography; the page files hold what things are
and how they are framed. See "The content format" below.

---

## Current state — what shipped this session

### The last band duplication is closed

`BAND_VIGNETTE { heightFrac: 0.40, opacity: 0.85 }` now sits next to
`BAND_HEADLINE` in `SiteTokens`, read by both `WorkCarousel` and
`ThinkGridCanvas`. **Zero visual change** — both files were already computing
`h * 0.6` and `0.85`.

**The interesting part: they held the same number under opposite meanings.**
Work's `VIG_HEIGHT: 0.40` meant "the fade occupies the bottom 40%"; Think's
hardcoded `0.6` meant "start 60% down." Change Work to `0.50` expecting a
taller fade, copy `0.50` into Think to match, and Think gets a *shorter* one.
The token keeps Work's convention (an amount, not a position) and the
`(1 - heightFrac)` conversion now lives in one commented line per file.

`SPACE.layout.bandDetailGap` is a shared number *justified by* those two
vignettes being identical, so this closes a real dependency, not just a tidy.

### `SPACE.text` — the `em` that never tiered

`paragraphGap` / `pullGapBefore` / `pullGapAfter` were `2.2em` / `3.5em` /
`2.5em` on the theory that `em` gives breakpoint-awareness for free.

**It doesn't, if the `em` lands on an element that never receives the tier
size.** These sat on bare layout wrappers — the flex column and the pull-quote
wrapper — which inherit no font-size, and nothing between `<body>` and them
sets one. All three resolved against the browser default **16px**, giving a
flat **35 / 56 / 40px at every breakpoint**. Against 24px desktop body copy
that read as slightly loose; against 16px mobile copy it was 2.2× the type.

Now tiered px, resolved with `useSpace()`.

**And the pull gaps were double-counted.** The flex `gap` applied between every
child *plus* the pull-quote wrapper's own margins, so the real distances were
`35+56 = 91px` and `35+40 = 75px`. The tokens now mean the TOTAL measured
distance and `SiteTextBlock` subtracts the shared gap back out in one commented
place. *(Mark has since set the two pull gaps equal and much smaller.)*

**No recorded reason for the asymmetry.** It goes back to the first version
(`4vh`/`3vh`) and was faithfully carried through three unit systems by three
successive refactors — including this one, until Claude checked. **A number
that survives three rewrites starts to look like a decision.**

### `ABOUT_PULLQUOTE` — a new type role

Who I Am's animated display pull quote was `clamp(28px, 4vw, 52px)` hardcoded
in `SiteTextBlock`. Now `ABOUT_PULLQUOTE` at **52 / 40 / 28**, carrying its own
`weight`, `lineHeight: 1.05` and `tracking: -0.025`.

Deliberately NOT the existing `PULLQUOTE` role (42/28/28, used by both case
panels): that one is a static paragraph in a body column, this is display type
that wipes and pushes. Sharing would mean tuning case-panel quotes silently
moved this page's largest type — the exact coupling deleted from the band pair.

**Desktop and mobile tier down losslessly** (the clamp was already flat at 52
and 28). **Tablet is the one real change:** the clamp ran fluid 31→51px across
768–1279 and is now a flat 40. If that reads badly it is the best argument on
the site for un-pausing fluid clamp-based scaling.

### The Who I Am sequencing rebuild — the big one

The page arrived out of order at any scroll speed, pull quotes snapped in and
out, and long stretches resolved late. **Six defects, one cause.**

**The audit found:**

1. **The gate chain was mathematically unable to advance.** The unlock rule was
   `_unlocked.has(seqIndex - 1)`, but `AboutContent`'s seqs ran 1, 3, 4, 5…
   with **no seq 2**. So seq 3 waited on an index no content would ever create,
   and 4 waited on 3, and so on: **13 of 14 gates were unreachable.** Only the
   fast-scroll rescue ever opened them, which is why it worked when you flicked
   and never when you scrolled gently.
2. **Every seq in a block shared one sentinel** — the block container's top. So
   nine sections reported the same position and the whole block unlocked in a
   single scroll event.
3. **`mountIndex * 400` counted across the whole block**, so the last paragraph
   waited `1500 + 14 × 400 = 7.1s`.
4. **`fadeInOnly` was accepted and never read**, so pull quotes ran the
   fade-out branch and snapped back to opacity 1 on passing the top.
5. **Nothing evaluated on load** — the watcher only ran on scroll events.
6. **`_unlocked` never reset on Who I Am**, so revisiting the page rendered it
   fully revealed with no animation at all.

**The root cause under all of it:** eligibility (position) and sequence (order +
pacing) were the same mechanism. Fast scrolling was supposed to skip the
*waiting*; because the waiting was the only thing producing the *ordering*, it
skipped both.

> **The timers were never the sequence — they were only pacing it. When the
> fast path removed the timers, it removed the sequence with them.**

### The model Mark specified

- **Order is absolute.** Nothing starts before anything above it, at any speed.
- **Pacing is elastic.** The designed rhythm is the RESTING pace; scroll
  pressure compresses it. Compression has a floor, so nothing ever cuts.
- **Everything transitions on.** No cuts anywhere — which ruled out Claude's
  proposed "instant reveal for anything already scrolled past."
- **Overlap is fine.** Sequence governs *start* order, not completion.
- **Pull quotes hold the queue — at rest only.** Never truncated; under
  pressure they simply overlap what follows.
- **Play once, per VISIT.** Scrolling never re-arms anything; arriving does.

### `SiteRevealQueue.tsx` — BUILT

One module-level queue. The pump walks items in document order and **breaks**,
not continues, at the first item that may not go yet — so ordering is
structural rather than probabilistic.

**Eligibility is injected per item**, which lets one queue serve two kinds of
page without forking the reveal path: position-driven pages measure their own
leading edge against `BF0`; choreographed pages (`sequence: manual`) ask
whether the page's timer opened the gate.

**`opacity = arrival × zone`**, computed in one place and written once. Arrival
is time-driven, the zone fade position-driven; they used to be two mechanisms
fighting over `el.style.opacity`, which is how a scroll scrub could snap an
element to 1 that the sequencer had not revealed.

**Two pressure sources, deliberately complementary:**

- **scroll** — the reader is moving. Decays in `pressureWindowMs`.
- **backlog** — content left the top of the screen unrevealed. Doesn't decay.

Backlog exists because scroll pressure decays too fast: landing at the bottom
of a long page dropped straight back to the resting pace, six pull quotes
holding in turn, **twelve seconds of catch-up watched from the bottom.** Found
in simulation, never on screen.

**Deleted:** `SCROLL_FADE`, `SCROLL_FADE_PULL`, `SCROLL_FADE_FAST`,
`useScrollFade`, the sentinel registry, `mountIndex`, `LinkItem` (dead —
nothing rendered it), `highlightColor`, `SiteFooter`'s own background gradient,
`WhoVennDiagram`'s scroll re-arm. `SiteTextBlock` went 795 → ~600 lines.

### The content format — `About.md` / `Talk.md`

`SiteCaseMarkdown.tsx` gained a third dialect. **One block = one gate, and block
order IS gate order** — so `id`, `seq`, and the `ids="1-7"` range props are all
gone. Adding a paragraph renumbers nothing.

```
[slot] sphere
hold: 1800
bleed: true

[paragraph]
As a freelancer, I haven't had a lot of official titles…

It all started with a dream of making feature films…

[pull]
pushY: 20
colorDelay: 400
colorDurIn: 500
> A city that literally      | wipe
> {changed my life}          | delay 600, fade, push
```

- **`>` starts a new line, `+` continues the one before it.** These replaced
  hand-written `line:` numbers, which were pure bookkeeping.
- **Pull choreography stays in the content** — Mark's call, and the right one:
  change the words and the direction changes with them.
- **Omit any field to get its documented default.** One rule, no exceptions —
  which is why it is "documented default" and not "assume 0" (`duration: 0`
  would never animate, `feather: 0` gives a hard wipe edge). A `//` comment
  block at the bottom of `About.md` lists them all.
- **Unknown keys and flags warn in the console** rather than being silently
  dropped.
- **`groupParagraphs` is a new parser mode**, distinct from `splitParagraphs`.
  Work and Think want blank lines to make sibling blocks; About needs them to
  make paragraphs *inside* one block, because one block is one gate.

**Slots.** The sphere and the Venn diagram are `[slot]` items, so they sit IN
the sequence rather than beside it. **The content names the slot; the page
supplies the element and every layout decision about it.** Options: `hold: <ms>`
and `bleed: true`.

**Both pages are now a server shell plus a client body.** `page.tsx` reads the
markdown with `readFileSync` and passes the string down. Deliberately not
fetched: this is the page's entire body copy, and a fetch is the fourth
resolution schedule.

**`sequence: manual`.** Let's Talk is choreographed, not scroll-driven — every
gate opened by a timer chained off the real duration of the animation before
it, and the whole page sits above the fold. It registers no sentinels. It had
only ever worked because the scroll watcher was asleep until the first scroll
event; adding a load-time evaluation exposed the race immediately.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see v73/v74/v75/v77.)*

- **NEW — A value transcribed from a token is worse than no token.** It looks
  tunable, tiers correctly in the file, and is wired to nothing. When a literal
  in a component equals a token's desktop value, that is a broken import, not a
  coincidence. Three of four zone tokens; two more the same day.
- **NEW — A count of on-screen items is a viewport-dependent number wearing a
  viewport-independent costume.** Backlog pressure counted eligible-but-unrevealed
  items with a threshold of 4. Mobile stacked 6 above the line, tablet 6,
  desktop 3 — so the sphere's hold was released at load on two tiers and held
  on the third, looking exactly like a breakpoint bug in the hold. Same class
  of error as a hardcoded pixel.
- **NEW — Moving something into a container silently rescales anything sized
  relative to the VIEWPORT.** The skills sphere's 3%/76%/21% framing is a share
  of the screen; moved into the content column as a slot it became 76% of
  `col.vw` — 57.8vw instead of 76vw on desktop, 68.4vw instead of 100vw on
  mobile. Wrong on all three tiers, no error anywhere. v75 recorded this lesson
  running the other way; the sphere is the third thing it has caught.
- **NEW — Two numbers can be identical and mean opposite things.** Work's
  vignette `0.40` (an amount) and Think's `0.6` (a position) produced the same
  pixel and would have diverged the moment either was tuned. Check the
  CONVENTION, not just the value.
- **NEW — An index-arithmetic relationship between separately-authored things
  is one content edit from breaking silently.** `seqIndex - 1` meant "the
  previous number" where the author meant "the previous item." Deleting one
  content item made 13 of 14 gates unreachable, with no error.
- **NEW — When a fast path skips the waiting, check what else the waiting was
  doing.** It was producing the ordering.
- **NEW — Design a diagnostic that can distinguish the hypotheses.** The
  sphere-hold bug was invisible because "never held" and "held then released"
  produced identical behaviour. Restructuring the check so the trace could tell
  them apart answered a question three plausible theories could not.
- **NEW — Simulate the property, don't spot-check it.** Ordering was verified
  by running the pump against the real content at five scroll speeds on three
  tiers. Both the twelve-second catch-up and the tier-dependent backlog were
  found in simulation, never on screen. But **say where the simulation is
  cruder than the code** — this one models scroll pressure per-frame where the
  real check is per-event, so its pressure counts are pessimistic.
- **NEW — A parameter accepted and never read is a lie the compiler won't
  catch.** `fadeInOnly` was passed `true` by every pull quote and referenced
  nowhere in the function body. So was `wasEnabledOnMount`.
- **NEW — A capability built and never used should be found before it is
  defended.** `colorHold` and `colorDurOut` implement a highlight that lights
  up and settles back to white. All six pull quotes set `colorDurOut: 0`, so
  the entire back half of that system has never executed once on the live site.
- **NEW — A description of intent is a diff against the implementation.** Five
  points of "here's what I want to happen" surfaced findings that reading the
  code alone had not.
- Carried forward from v77: a comment asking two copies to stay in sync is a
  countdown; encoding a value into a NAME makes every new value a code change;
  content needed before a fetch resolves cannot live in the fetched file; a
  silently-skipped block type is invisible failure; macOS lies to you about
  case; `[br]` at end of line is a break AND a collapsed newline; an explicit
  override that skips a fallback chain fails worse than no override; when one
  file says "matches the other file," that IS the bug report; a responsive rule
  that "helpfully" reduces can destroy an authored composition; check the
  coordinate space before declaring a scaling bug; a default that contradicts
  its own doc comment will mislead someone for months; a gap assembled from two
  paddings isn't a gap, it's a coincidence; read what the person actually wrote.
- Carried forward from v75: a track-matte layer that ends before the layer it
  mattes is a latent cross-browser bug; read a file's STRUCTURE before
  theorising; a shrink-to-fit fitter silently takes over the value it guards;
  where someone instinctively looks for a value is evidence about where it
  belongs; a canvas hard-clips at its own box mid-glyph; widening a container
  silently resizes anything sized from container width; a flat threshold
  compared against a resting position is a breakpoint bug waiting to happen.
- Carried forward from v74: `position: absolute` children contribute nothing to
  intrinsic height; a frozen JS pixel value and a live CSS `vw` are two trust
  models that can disagree; `ResizeObserver` reports settled boxes; imperative
  measurement plus declarative styling drift apart without an explicit
  dependency array; when a person says they can no longer follow how a system
  works, that's a signal about the system.

---

## Approach & patterns

- **NEW — Write the spec before the code when the change spans a system.** The
  sequencing rebuild got a document first, agreed point by point, then built
  against it. Every subsequent decision had somewhere to be checked, and the
  two mistakes made during the build were both caught because the spec said
  what should be true.
- **NEW — Record the mistake, not just the fix.** The backlog error is written
  up in the spec as a reusable lesson rather than quietly corrected.
- **NEW — Generate migrated content, never retype it.** `About.md` was produced
  by evaluating `AboutContent.ts` in Node and round-tripping the result
  through a mirror of the new parser: 20 paragraphs, 9 chunks, every timing
  field, IDENTICAL. Nothing was transcribed by hand — which is the same failure
  mode as the zone tokens, one layer up.
- **NEW — Own the flagged risk that was not checked.** Claude wrote the sphere
  container-inset hazard into the spec and then didn't verify it during the
  build. It shipped narrower on all three tiers.
- Carried forward: one decision at a time, and let it be overruled; offer
  deletion before parameterisation; simulate a parser against real content
  before believing it; say which files change VISUALLY and how many; migrate
  all the content rather than leaving a compatibility fallback; bible-drop
  means catch up fast and offer a menu; verify a test rig before trusting a
  null result; recalibrate in the same change that causes the drift; fix stale
  comments in the same pass as the code they describe; point to file/line for
  simple mechanical fixes; propose a mechanism plus a reasoned starting guess
  and let Mark's live judgment set the number; full-file replacement over
  accumulated patches; always read current file contents before editing;
  diagnose fully before touching code.

---

## On the horizon

### Turn `DEBUG.sequence` back to `false`
It traces every queue decision to the console. One line per event per item, so
it won't flood, but it should not ship.

### Untuned — the whole pacing surface
`SEQUENCE` in `SiteTokens.tsx` is the entire surface, one place, nothing hidden
in components: `firstDelayMs 400`, `stepMs 200`, `minStepMs 70`, `fadeMs 1200`,
`pressureDeadzonePx 40`, `pressureWindowMs 600`, `backlogPressure 2`. Plus
`hold: 1800` on the sphere in `About.md` (stacks with `firstDelayMs`), and the
Venn's `hold: 0` if it should hold the pull quote after it.

**Known hazard: the deadzone is tested per scroll EVENT.** A mouse wheel notch
is 50–100px and trips it; a trackpad or touch drag is ~2px per event and never
will. So holds may behave differently by INPUT DEVICE rather than by actual
reading speed. If it shows up, accumulate distance over a short window. Not
pre-built.

### `BF0` / `BF100` desktop — Mark's open note
With the Venn and logo grid now reading them, Mark's read is *"looks great on
mobile, too eager on desktop."* Desktop triggers at 5vh from the bottom, mobile
at 7vh. Lower desktop `BF0` (95 → 92–90) to delay; widen `BF0 − BF100` to slow
the ramp. `SiteTokens.tsx` lines ~657–658. Tune with `DEBUG.visibility` on — it
draws labelled zone lines.

### The top gradient — the last structural piece of the spec
`SiteScrollConfig`'s top gradient is still commented out and re-implemented in
`SiteNavBar` as `NAV_GRADIENT_HEIGHT` (180/120/90 **px**), a separate mechanism
in different units. `TF0` and `TF100` remain **dead tokens** — tiered,
commented, read by nothing. Decide whether the navbar keeps a second scrim for
legibility over the nav itself; if so, make it a deliberate commented pair.

### Also dead in `VISIBILITY_TIERS`
`getScrollConfig()` and the `_config` store have **zero consumers**. So do
`revealMs`, `staggerMs` and `idleMs` — and `staggerMs: 600` is commented *"delay
between items in same seq group"*, which is exactly the number Mark would have
gone looking for while the code used a hardcoded 400. `VISIBILITY_TIERS_DESKTOP`
is a duplicate copy inside `SiteScrollConfig`.

### The scroll-fade family — bigger than v77 recorded
There are **eight separate `const SCROLL_FADE = {…}` objects in eight files** —
`WelcomeHero2Line`, `WelcomeHeroAnimation`, `WhoVennDiagram`, `WhoSkillsSphere`,
`WelcomeClientLogoGrid`, `WelcomeEverythingIsInteresting`, plus
`WelcomeScrollFade`'s prop defaults and `TalkRippleNetwork`'s tiered
`SCROLL_FADE_TIERS`. Same name, different key sets, unrelated numbers.
`WhoSkillsSphere` doesn't even use its own (`const fadeOutStart = 300`, inline).
`SiteTextBlock`'s copy is now deleted. **These are nine implementations of what
`TF0`/`TF100`/`BF100`/`BF0` were meant to define.** Who I Am and Let's Talk are
done; the Welcome page is the remaining job.

### Type-role consolidation — Mark's stated next cleanup
His words: *"one of the cleanup jobs I'm going to want to do later is reduce the
number of type tokens we have for greater consistency."* `BODY` / `CASE_BODY` /
`BODY_WELCOME` are three identical roles, one commented as mirroring another
"in case adjustments are needed later."

**But the test is not "are these values identical" — it is "do these describe
the same thing."** `BAND_HEADLINE` and `ABOUT_PULLQUOTE` both exist *because*
shared roles caused silent coupling. Identical AND same-thing should merge;
identical BY COINCIDENCE should stay apart. A script grouping roles by exact
value tuple finds the candidates; each group is then a judgment call.

### Content fixes still with Mark
- **`[praragraph]` in `ThinkCard02.md` line 31** — a typo'd block type, silently
  dropped, so **that paragraph is missing from the live site right now.** Found
  by simulating the parser over all 20 Work/Think files. (`[note]` in
  ThinkCard01 is the other skipped block and is deliberate.)
- **"Microoft** Store 12 Days of Deals" (WorkCase01), "Wedding **Infogrphics**"
  (WorkCase07), **"Have a reaon"** (ThinkCard01's second pullquote).

### Work case 01 — 12 videos wired
The `[gallery]` block for the Microsoft 12 Days of Deals campaign is written
with all twelve YouTube IDs, `4up, 16by9`, titles preserved as `//` comments.
**v77 was wrong that the folder was empty** — it held 16 placeholders, so four
extra tiles needed removing. Poster frames aren't needed: `hqdefault` never
fails, so the folder images are pure tile scaffolding. **No image, no tile, no
video** still holds.

`SiteGallery` has **no caption or title rendering at all** — not on the tile,
not in the lightbox. Putting the twelve episode titles on screen is a feature,
not a syntax tweak.

### Deferred by decision
**Gallery poster precedence.** Chain is `maxresdefault → hqdefault → folder
image`, so a hand-made poster is the FALLBACK and never shows. Mark chose to
leave it — *"less work for me than ginning up more poster images."* Note this
is what made the 12-video gallery easy.

**Crop default stays `4by3`.** Decided, not deferred.

**The landscape / short-viewport guard.** Diagnosed in v77, not built.

**`pullGapBefore` vs `pullGapAfter`.** Mark has set them equal; if that reads
fine, three numbers per tier collapse to two.

### The tokens-first migration, continued
- **Still-flat spacing values:** `LINE_GAP_PX`, `ROW_GAP_TOP`/`ROW_GAP_BOTTOM`,
  `lineGapPx` (Welcome CTA), `marginTop: 24` on the Work text block.
- **The `vh` spacers.** Welcome has eight, Who I Am two (one absorbed), Let's
  Talk one. **Deliberately deferred on Welcome** — Mark has a revised vision.
- **Hardcoded font sizes on no token:** `TalkOptions` (16/15/15), `SiteNavBar`
  (9), `WhoSkillsSphere` (11), `ThinkGridCanvas` (11), the figcaption/counter
  13s in both case panels, `clamp()` leftovers in `ThinkBelowPlaceholder` and
  `SiteTextBlock`.
- **Delete the legacy `TYPE`/`COLUMN` static exports.** Ten files still import
  `TYPE`. Deleting makes the desktop-only-by-accident bug structurally
  impossible; the compiler finds every site.
- **`const N = 7` in `WorkCarousel.tsx`** duplicates `WORK_MANIFEST.length`.

### Duplication that has already drifted
- **RESOLVED this session:** the band vignette (now `BAND_VIGNETTE`); the two
  page content files (now one markdown dialect); `SiteFooter`'s second bottom
  gradient; `SiteTextBlock`'s `SCROLL_FADE`.
- `TAGLINES` exists in **both** hero files and the two copies **already
  differ** — "problems in the end" vs "problems at the end". *Still open.*
- Colour helpers (`rgbToHsl`/`hslToRgb`) duplicated across the two hero files.
- `BODY_WELCOME`/`BODY`/`CASE_BODY` are three identical token roles.

### The Welcome hero sizing race — still unresolved
Both heroes compute the headline font size from a one-time `window.innerWidth`
read frozen into pixels.

### Known-wrong maths, flagged and not fixed
- `WhoSkillsSphere` fog: `coreR` produces a gradient radius in the tens of
  thousands of pixels.
- `WhoSkillsSphere` `particleSpread` used two ways in the same file — particles
  never recycle.
- `WelcomeHeroAnimation`'s `lineH * 0.76` cap-height guess.
- `SPACE.layout.talkNavClearance` and `SCROLL_FADE_TIERS` must agree by hand.

### Other open items
**The AE source of the Lottie fix.** `thinking-open.json` is fixed in the repo;
the After Effects project is not. Two other layers have the same lifespan
mismatch.

**Code health.** `npx eslint app` reports ~60 errors, all pre-existing. Next 16
does not run ESLint during `next build`.

**Carried over, untouched:** hamburger menu polish; navbar gradient 3-stop
proposal; backdrop-filter blur behind navbar; uncapped
`COLUMN_TIERS.desktop.vw`; fluid clamp-based body-copy scaling (paused —
`ABOUT_PULLQUOTE`'s tablet tier is now a second argument for un-pausing it);
full five-page three-breakpoint visual pass; Who I Am's perceived right-bias on
tablet; the stale "copied from desktop as placeholder" comment on `TYPE_TIERS`'
mobile tier; coding-literacy side project.

**Infrastructure.** Contact form `/api/contact` + Resend still blocked on
creating a Resend account (SPF TXT will need merging, not duplicating). Decide
on DMARC. Delete the unused `ftp` A record. Decide whether to add `vercel.json`
redirects for ~100+ old indexed Squarespace URLs that now 404.

---

## Tools & resources

- **Stack:** Next.js 16 / TypeScript / Turbopack, Vercel (Hobby, auto-deploy),
  GitHub + GitHub Desktop, VS Code.
- **Domain & DNS:** `shtooky.com` — registered at GoDaddy, DNS at Cloudflare
  (Free), all records DNS-only, pointing at Vercel. MX/SPF route
  `mark@shtooky.com` through Laughing Squid/Rackspace. Squarespace fully
  retired.
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then phone
  (same Wi-Fi) → `http://10.0.0.154:3000`.
- **Live DevTools breakpoint workflow:** custom device presets at exact px
  (iPhone 390×844, iPad Mini 768×1024, Desktop 1440×900), device toolbar
  undocked, side-by-side with a real non-emulated window.
- **NEW — `DEBUG` flags in `SiteTokens`:** `visibility` draws labelled
  `TF0`/`TF100`/`BF100`/`BF0` zone lines across the viewport; `sequence`
  traces every queue decision with its backlog and active pressure source.
  Between them, most sequencing questions are answerable in one reload.
- **Claude-side environment:**
  - **Screen recording is GRANTED.** Safari can only be granted at **read**
    tier — visible in screenshots, no clicking or typing.
  - `device_bash` runs in a sandboxed **Linux** VM with the repo mounted — NOT
    macOS. It cannot reach `localhost:3000`, cannot run `next build`, and
    **cannot delete files** (`mv` to a junk folder instead). **It has no
    browser**, so anything only reproducible in a running page needs Mark's
    console — design a diagnostic rather than guessing.
  - **`npx tsc --noEmit` DOES work there** and is the fast way to verify edits.
  - **`node` also works**, which is how the parser, the content migration and
    the queue's ordering guarantee were all verified this session.
  - The cloud container (the `Bash` tool) is a separate machine with restricted
    network — GitHub and Google Fonts are blocked.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS, COLUMN_TIERS,
  TYPE_TIERS, SPACE, **SEQUENCE**, TIMING, NAV, **FOOTER**, VISIBILITY_TIERS,
  LOGO_GRID_TIERS, BAND_HEADLINE, **BAND_VIGNETTE**, DEBUG, hooks);
  **`SiteRevealQueue.tsx`** (order and pacing for every reveal — read its
  header first); `SiteCaseMarkdown.tsx` (the shared content format);
  `SiteTextBlock.tsx` (renders the About/Talk dialect); `WorkManifest.ts`;
  `SiteGallery.tsx`; `SiteScrollConfig.tsx` (the viewport gradients);
  `WorkCarousel.tsx` is the recurring pattern reference.
- **The band pair.** `WorkCarousel.tsx` and `ThinkGridCanvas.tsx` share
  `BAND_HEADLINE`, `BAND_VIGNETTE` and `SPACE.layout.bandDetailGap`. Anything
  else describing that band should be checked in BOTH files before being
  changed in one.
- **Content:** `WorkCase0#.md` (7), `ThinkCard##.md` (13), **`About.md`**,
  **`Talk.md`** — all parsed by `CaseMarkdown.tsx`. Work blocks: `[jobbox]`,
  `[subtitle]`, `[label]`, `[paragraph]`, `[pullquote]`, `[gallery]`,
  `[video-carousel]`. Think: the same minus `[jobbox]`/`[subtitle]`, plus
  `[img]`. About/Talk: `[paragraph]`, `[subtitle]`, `[pull]`, `[slot]`.
  `[gallery]` line 2 is `Nup, crop(4by3|16by9|1by1|2by3), noClick` — the Nup
  holds at every breakpoint and an omitted crop means **4by3**, not native.
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention.
- **Project bible:** v78 (this file), stored at `/Users/marko/shtooky`.
  Superseded bibles are moved to `can_probs_delete/old-bibles/` rather than
  deleted, since `device_bash` cannot remove files.
