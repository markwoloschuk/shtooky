# shtooky.com – Project Bible v88

*Supersedes v87, same day. The longest session in the record — about five hours — and the
one with the widest gap between what was learned and what shipped. Several small fixes
landed, one large experiment was built and reverted whole, and the session's most valuable
output is arguably a diagnosis of a problem that has not been touched.*

*Mark, near the end: **"i feel like i'm chasing my own tail now."** He was right, and he said
it roughly ninety minutes after it became true. Both of us were slow to it; he got there first.*

*Companion documents: **`claude/todo_site_wide_2026-09-13_v01.md` (NEW)** — non-page-specific
work, updated in place as items close, and the holding pen for anything that belongs to a
shared component or the asset pipeline rather than a page. Also `spec_sequencing_2026-08-25`,
`spec_band_model_2026-08-27`, `spec_work_card_count_2026-09-02` (all untouched).*

---

## Purpose & context

Mark (also goes by Marko) is a San Francisco Bay Area–based freelance Creative Director with
25+ years of experience, building shtooky.com as a primary portfolio site targeting Creative
Lead and Creative Director roles at tech companies. Next.js 16 / TypeScript / Turbopack,
deployed on Vercel. Claude is Mark's primary technical partner across all sessions.

Mark is not a coder by background — his mental model comes from motion graphics and After
Effects expressions, and he actively wants the underlying web concepts explained plainly
rather than just applied. He judges all visual outcomes and makes every aesthetic decision
himself. **This session produced the clearest evidence yet that his model is an asset and not
a limitation** — see THE LOOP.

**Session-start ritual (standing instruction):** when Mark drops the bible in, do NOT go read
the whole codebase and come back twenty minutes later with a report. Catch up to where we left
off and suggest the areas we might work on. Fast.

**The 45-minute heartbeat is standing and re-arms itself.** It fired six times this session and
each beat reported elapsed time, landed-versus-unjudged, and an honest Level 0 read. *The
pause-when-away problem from v87 remains unresolved and was not raised again.*

**NEW — READ-ONLY GIT IS NOW ALLOWED.** Mark lifted the no-git rule for `log`, `show`, `diff`
and `status` on 2026-09-13. **Writes are still off** — no checkout, reset, pull, commit,
branch. It paid for itself within minutes: `git log -S"position: 'fixed'"` found the exact
commit that introduced the fixed band, and `git show <sha>:<path>` produced the pre-band-model
implementation, which contained the answer to a question two hours of instrumentation had not
cracked. **Reach for history before building a probe.**

**NEW — nothing is ever settled (standing instruction, Mark's words).** *"Everything is always
open to debate or re-litigation examination under new light. If the facts change — maybe
settled law does too. If the thinking changes, same thing."* A recorded decision is
**decided once, with the reasoning written down** — a burden of proof, never immunity. The
useful test before reopening: ***is there new information, or am I back in the same mood?***
This session contains one of each: the band height was legitimately reopened by new evidence,
and the "creative producer" self-description was reopened by mood and had already been settled.

**What actually carries between sessions.** Three layers, only two automatic:

- **Persistent memory** — durable facts about Mark and his active areas.
- **The Claude project** — carries these docs into any attached session. Where the detail lives.
- **Conversations do not cross.**

*Which is the whole argument for the bible: it is the only layer that carries the REASONING.*

**The bible is a narrative of what we decided; the repo is what's actually true.** They drift.
*v81: the repo and the BROWSER can disagree. v82: the browser and CLAUDE'S MODEL of it can
disagree. v83: the bible and the repo had drifted on the very first thing checked. v84: the
bible and the NETWORK can disagree. v85/v86: the bible can be CONFIDENTLY WRONG about a whole
subsystem. v87: it was confidently wrong again, in the section written to warn about that.*

***v88 adds the one that cost real time: the bible and PRODUCTION can disagree, because a push
can be partial.*** v87 recorded the changeset as uncommitted and two sessions deep. It was not
— Mark had been pushing. But he had pushed a MID-SESSION state: the Welcome handoff and its
scroll lock were live while the post-collapse spacer was still the pre-tuning `12vh`. Twenty
minutes went into diagnosing a live site nobody had an accurate model of.

> **Standing rule, new: confirm what is DEPLOYED before diagnosing anything against
> production.** A DOM or bundle fingerprint of something the newest work changed costs one
> call and settles it. "It's pushed" is not a state; a push has a content.

For simple, single-value mechanical fixes, Mark prefers to be pointed at the exact file/line.
Claude makes the edit directly when a change spans multiple files, needs verification against
the shared token system, or involves an architecture judgment call.

**Mark edits the same files, live, while Claude is working in them.** Always re-read
immediately before writing, match on the constant NAME rather than its current value, and never
assume a number is what it was two messages ago.

**One thing at a time (standing instruction).** *Violated this session, at cost — see
§"The one that was built and reverted."*

**Let Mark describe the intent before proposing the fix.** A description of intent is a diff
against the implementation. *This session it was better than that: a description of WHEN a
symptom started was worth more than two hours of measurement.*

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am (`/who-i-am`), How I Think
(`/how-i-think`), and Let's Talk (`/lets-talk`), plus a 404.

**Site vision — "single room" (standing instruction):** the site is one continuous atmospheric
space. Content hangs like banners from the ceiling. Each page region has its own ambient
lighting (five page colours). Navigation is a camera moving through that space.

**THE STAGE (from v86, unchanged).** The whole page is a **1440-wide layout centred in the
window**. Below 1440 the stage IS the window. Above it the stage stops growing and the leftover
width becomes empty margin.

**`vw` for THE ROOM, pixels for THE FURNITURE (from v86).** Background, full-bleed bands and
the atmospheric layer scale with the window. Reading measure, type size, gaps, grids and
vertical position have a correct absolute size and should not.

**Leftmost-element principle (standing).** NavBar and Footer are deliberately the leftmost
elements on any page — **leftmost ON THE STAGE**, not in the window.

**Four standing widths** at 1440:

```
                      what it is                          width   left edge
1. Full bleed         100vw                                1440          0
2. Frame edge         FRAME_INSET_VW = 2.5vw                  —         36
3. Content column     col.vw = 76vw, inset 12vw each side   1094        173
4. Text column        bodyMaxWidth = 53.2vw of viewport      766        173
```

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`. When superseding,
write the new file under its own correctly-dated name and move the old one to
`can_probs_delete/old-bibles/`. *The repo's `old-bibles/` is missing v78 and v81; the canonical
copies live in the Claude project.*

**NEW — the bible lives in BOTH places, and v88 nearly did not.** It was written to the Claude
project first and Mark went looking for it in the repo. Write the file to the repo root AND to
the project; they are two audiences (the repo is where he looks, the project is what loads into
the next session).

**Component naming.** A component used by more than one page takes the `Site` prefix.
Page-specific components keep their page prefix.

**Body copy dashes (in `AGENTS.md`).** Spaced en dash, never an em dash. The space BEFORE it is
a non-breaking space (U+00A0). Content `.md` carries the literal character; `.tsx` string
literals use the escape; JSX text uses `&nbsp;`.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel (auto-deploy on push),
VS Code, GitHub Desktop.

---

## BEFORE THE NEXT PUSH

1. **NOTHING FROM THIS SESSION IS PUSHED.** Roughly fourteen local changes across nine files
   plus two new files and twenty replaced images. Production is still last night's partial
   build. **Every fix below is invisible to anyone but Mark.**
2. **PUSH IN CHUNKS, and the reason is concrete this time.** Suggested groups:

   | # | files | why separate |
   |---|---|---|
   | 1 | `public/images/think/01/stickers/*` | 27 MB, self-contained |
   | 2 | `SiteGallery.tsx`, `app/data/GalleryManifest.ts`, `scripts/gen-gallery-manifest.mjs`, `package.json` | the gallery fix is one idea |
   | 3 | `ThinkOpenAnimation.tsx`, `SiteCanvasCover.ts` | above-1440 sizing |
   | 4 | `SiteTokens.tsx`, `SiteFooter.tsx` | footer colour + band heights + flags |
   | 5 | `SiteBackground.tsx` | nebula resize |
   | 6 | `ThinkGridCanvas.tsx` | **the only uncertain one** — see §7 |
   | 7 | `can_probs_delete/frame-trace-instrumentation_2026-09-13.md`, this bible | paper trail |

   Group 6 alone is the point of the exercise. Mark reported the top-left card *may* look worse
   after it, and that is unresolved.
3. **DEBUG flags are back to `false` and the frame instrumentation is removed.** Verified.
   Check anyway — a green HUD reaching production would be the worst outcome of the day.
4. **`BAND_ANCHOR_Y` is 0.5 and still a TRIAL. FIFTH consecutive bible.** *A candidate escape
   appeared and was rejected: at a band height of 809 the cover crop vanishes and the anchor
   becomes moot. Mark ruled 809 out as far too tall. So the per-card pass or a revert to `0`
   remain the only options, and it is still the oldest unresolved item in the file.*
5. **The Welcome handoff remains unjudged on mobile and tablet** — carried from v87, untouched.

---

## THE THROUGH-LINE — the space a number lives in

### The kinds of number (carried, plus v88's)

- **Input** — tuned by eye, nothing derives it → tokens file, tiered.
- **Derived** — computed from inputs plus a real measurement → never a token.
- **Exception** — a place that must differ → `TOKEN + NAMED_OFFSET`.
- **A DURATION standing in for an EVENT** (v81).
- **A DEFAULT** (v82) — chosen once on behalf of every caller that passes none.
- **A CAPTURED COORDINATE** (v83) — a measurement with an unwritten expiry.
- **A CONTESTED VALUE** (v84) — two systems both believe they own it.
- **A VALUE WHOSE UNIT WAS NEVER CHOSEN** (v86) — at 1440 every unit agrees.
- **A GUARD THAT NEVER VARIES AT THE REFERENCE SIZE** (v87) — always-true is no branch.
- **NEW — A VALUE WHOSE COORDINATE SPACE IS DECLARED SOMEWHERE ELSE.**

### v88's line

v86 found that a number correct in two units is a decision nobody made. v87 moved that into
control flow. v88 moves it into **space**:

> **A coordinate is not a number. It is a number plus a frame of reference — and in this
> codebase the frame is set by a CSS property in a different file, hundreds of lines from the
> arithmetic that depends on it. Change the word `fixed` to `absolute` and every number stays
> exactly the same while every one of them becomes wrong.**

`fromRect.y` is a viewport coordinate or a document coordinate depending entirely on one word
in a style object 600 lines away. Nothing in the name says so. Nothing in the type says so.
The only thing that said so was **a comment**, which correctly named the assumption and the
condition it depended on — and a comment cannot fail a build.

**Three systems broke on that single word, and none of them mention it:**

| what broke | what it actually reads | why the word mattered |
|---|---|---|
| card lands above its cell | `fromRect.y` from `getBoundingClientRect()` | viewport value used as document value |
| card cropped along its bottom | the canvas is `window.innerHeight` tall | a viewport-sized canvas can only draw inside ONE viewport |
| content revealed in chunks; bokeh froze | `ScrollFade`, reveal queue, parallax | all measure document geometry |

*The middle row is the one to remember. It is not a bug, it is a CONSTRAINT: a canvas the
height of the viewport can only ever draw within one viewport. Parked at document 0 it covers
0–900, while a second-row cell lives at ~1100. The pre-band-model code's `top: bandDocY`
existed precisely to park that window where the reader was looking. It was not arbitrary and
it was not legacy cruft.*

### THE HABIT BEHIND THE BUGS — the ten generations

| version | the habit | example |
|---|---|---|
| v78 | a value **transcribed** from its token | visibility-zone literals |
| v79 | a value **wired to something that never changes** | `2.2em`; `[open, children]` |
| v80 | a value **you cannot see** | U+00A0 beside 30 en dashes |
| v81 | a **result you did not verify was produced by your code** | three fixes against a stale bundle |
| v82 | a value **you never supplied**, standing in as a default | `scrollTargetY`; `offsetFor` |
| v83 | a **coordinate captured before the thing it refers to can change** | `bandDocY` |
| v84 | a value **two systems both believe they own** | `marginTop`; `768` |
| v86 | a value whose **UNIT was never chosen** | every layout `vw` |
| v87 | a **BRANCH that never varies at the reference viewport** | `inViewport`; `minHeight: 64` |
| **v88** | a value whose **FRAME OF REFERENCE is declared elsewhere** | `fromRect.y`; the band canvas |

### The four resolution schedules (carried)

- **CSS-live** — `vw`/`vh`/`min()`/`max()`/`clamp()`. Re-resolved every paint.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
- **Fetched** — arrives after first paint.

**Rule: one mechanism per visual unit.** *v88 adds: and one coordinate space per canvas, named
where the arithmetic is, not only where the CSS is.*

---

## Current state — what shipped this session

### 1. Think band title — capped above 1440. JUDGED GOOD.

`ThinkGridCanvas.tsx` — `titleScale` was `window.innerWidth / BAND_HEADLINE.refW`, uncapped, so
the expanded card's title grew forever: 52px at 1440, 62 at 1728, 139 at 3840. Now
`Math.min(window.innerWidth, STAGE_MAX_PX) / refW`.

**The finding worth keeping:** `WorkCarousel` never did this. It uses a flat
`BAND_HEADLINE.sizePx`. So the two bands — which the token's own comment says must stay
identical — had silently disagreed above 1440 for as long as the cap was missing. *Mobile and
tablet take flat branches and never touched `titleScale`, so they were always correct.*

### 2. Think headline vertical spacing — re-derived. UNJUDGED.

`ThinkOpenAnimation.tsx`. The wrapper's WIDTH had been migrated to the stage
(`contentWidth(col)` → `stagePx`) and its HEIGHT had not. The Lottie is sized as a
**percentage of the wrapper**, so the artwork correctly froze at 1440 while the box kept
growing and the negative top offset kept pulling the frozen artwork further up out of it.

```
             box height   artwork pulled up   error vs correct
  1440          150              89                 —
  1728          180             107           +30 tall, 18 too high
  1990          207             123           +57 tall, 34 too high
```

Both now derive from `openingPx()`. **Sub-pixel change at 1440, not zero** — `openingPx()`
rounds 79.2 to 79, so height lands at 149.7 rather than 150.1. Recorded because "no-op at the
reference width" is the pattern and this one is 0.4px shy of it.

> **The shape of this one is the whole v88 line in miniature: the width was migrated and the
> height was not. They had always been the same number in the same unit, so nothing marked the
> moment they stopped agreeing.**

*Deliberately not done: the burst/particle system still converts through the uncapped `pxToVw`
and keeps growing above 1440 while the artwork it fires from does not. Labelled in the file as
deliberate. Own pass.*

### 3. The footer's cyan flash on every page load. UNJUDGED.

`SiteFooter.tsx:44` initialised `activePage` to the literal `"welcome"`, so frame 1 of **every**
page painted the rule in Welcome's `#00ADEE`, then cross-faded to the correct colour over the
rule's own `background 0.4s` transition.

**Why it hid so well:** someone had already found this exact fallback and guarded it — for the
404 route, using `isKnownPage(pathname)`, and `pathname` is correct on frame 1. So the *route*
case was protected and the *frame* case was not.

**Fix:** `getActivePage()` gained an optional `path` parameter, and the footer seeds
`useState(() => getActivePage(pathname))`. `usePathname()` is correct on the server and on the
first client render, so there is no hydration mismatch either. The parameter is optional, so
no existing call site changed.

*Same shape survives at `SiteNavBar.tsx:183` and `SiteBackground.tsx:284`. Neither has been
reported. Both are now one-line changes.*

### 4. Work carousel — per-card crop offsets clamped. UNJUDGED.

`SiteCanvasCover.ts`. `WorkManifest`'s `offsetV` values are authored in native px against the
DESKTOP band (h = 480), where a 16:9 image overflows by ~330px and has ~165px of slack each
way. **Mobile multiplies the band height by `MOBILE_BAND_HEIGHT_SCALE` while the image's drawn
height is unchanged, so the overflow collapses to ~18px and the slack to ~9px.** The authored
140 and 114 then hung ~131px and ~105px of empty box above their slices.

Now clamped so the image can never be nudged off its own cover — self-gating, no tier flags,
a no-op wherever the offset already fits. `offsetX` deliberately left unclamped: Work's carousel
slides horizontally via `centerX` and a clamp would fight the slide.

**Named limitation:** the clamp makes mobile CORRECT (no gap) but not AUTHORED — a clamped 140
is just "as far down as it can go." Expressing `offsetV` as a fraction of available slack would
preserve intent at every band height. Separate change; needs the seven manifest values
re-expressed and re-judged.

### 5. The nebulas. JUDGED GOOD — and the best-diagnosed bug of the session.

**Symptom:** on iOS, rubber-banding at the TOP of any page made the background nebulas go
haywire — for the entire duration of the stretch AND the release. The bottom was clean.

**The wrong theory, and why it was wrong.** Blamed on `NB_SCROLLINF`, a scroll-VELOCITY term
that integrates into particle position while the parallax in `drawParticles` is a pure function
of POSITION — reversible versus not. Plausible, and false. **Mark killed it in one sentence:**
it also happened while the band was merely *held* open, and a held stretch has almost no
velocity. *A velocity term cannot drive a fault that survives zero velocity.* Setting it to 0
changed nothing, as predicted by his observation and not by mine.

**The real cause:** `handleResize()` called `initNebula()`, which **destroys all twelve
particles and builds new ones at random positions** — and because `initNebula()` passes
`isRespawn: false`, they arrive with `age = Math.random() * particleFade`, i.e. already
partway through their fade-in and therefore **visible on the first frame**. A natural respawn
passes `true`, starts at age 0 and fades up from nothing. **Only that path pops.**

On iOS, overscrolling at the top animates the Safari toolbar, so `window.innerHeight` changes
repeatedly for the whole gesture, firing `resize` each time and swapping the entire field over
and over. At the bottom the toolbar is already collapsed, `innerHeight` never moves, and the
field is untouched. **That is the asymmetry, exactly as reported.**

**The clincher was three lines above it in the same function:** the bokeh leaders were already
being RESCALED and preserved on resize. Nebula was the only layer being destroyed. **The
correct pattern was already in the function.** Fixed by giving nebula the same treatment —
position and size scaled proportionally, age, colour, opacity and pulse phase preserved.

`NB_SCROLLINF` restored to `1.0`, with its comment rewritten to record that it was suspected
and **exonerated**, plus two properties of it that remain true but are not attributed to any
visible defect: the reversible/irreversible mismatch, and a filter (`Math.min(dt * 8, 1)`) that
reaches 1.0 — no smoothing at all — at `dt >= 0.125s`, so it damps least exactly when frames
drop.

> **Repro worth keeping for anything in `SiteBackground`: rubber-band at the TOP on iOS.**
> Binary and repeatable, unlike "scroll fast and look."

### 6. The gallery's two-second dead window. DONE.

**Symptom, on the live site:** open the Think card with the sticker gallery and the page cannot
be scrolled for about two seconds; then everything appears at once.

**Cause:** `SiteGallery` fetched its own file list from `/api/gallery/<path>` on mount and
returned `null` until it resolved — so the gallery contributed **zero height**. Opening a card
was a waterfall: fetch the markdown, parse it, mount the gallery, fetch the file list, and only
then did the document reach its real height. **Until that landed there was nothing to scroll
to.** Entirely independent of image weight; it would happen with 10 KB images.

**Fix:** the list is a directory listing that cannot change between deploys, so it is generated
at build time. `scripts/gen-gallery-manifest.mjs` walks `public/images` (17 folders, 132
images) and emits `app/data/GalleryManifest.ts`; wired to `predev` and `prebuild`.
`SiteGallery` seeds `useState` from it, so a baked path paints its reserved aspect-ratio boxes
on the **first render**. The runtime fetch survives as the fallback for a folder added without
regenerating.

> **The generator duplicates `sortGalleryFiles()` from `app/api/gallery/[...path]/route.ts` and
> MUST stay in step with it, or galleries reorder depending on which path served them.**

### 7. Think card open/close — one band paint per frame. UNCERTAIN.

`renderBand()` was called twice per frame during an OPEN (two blocks in the same tick both
painted) and once per frame FOREVER during `fullview`, where nothing changes. Now gated on
whether the band title actually moved.

**Measured before and after, at 1440:** draws per open fell from ~130 to ~94, and the fast head
of the animation went from **13% to 67% of frames at 60Hz**. But **average frame time did not
improve** — paint was not the bottleneck, which killed the theory it was built on.

**Mark's verdict: the top-left card may look WORSE.** Unresolved. Its vertical numbers are
unchanged (49.2 → 49.5), so if real it is horizontal — and the tracer never logged horizontal
motion. **This is why group 6 is its own commit.**

### 8. Images — 27 MB off the heaviest page. SWAPPED LOCALLY.

`public/images/think/01` held **32 MB**. Twenty sticker PNGs at 1200×1200 averaging 1.4 MB
each, plus an 11.7 MP phone photo at 4.5 MB.

**Correcting a wrong first instinct, on the record:** these were assumed to be oversized and
needing a resize. They were not — 1200×1200 is a reasonable grid tile. **They were too HEAVY,
not too big:** ~1.7 bytes per pixel is full 24/32-bit PNG carrying photographic content. Mark's
instinct was right and the first diagnosis was wrong. *The phone photo genuinely was a resize
case.*

**Result: 30.5 MB → 3.3 MB, 89% saved.** Progressive JPEG q80; the photo also downscaled to
2000px. Every source's alpha channel was checked rather than assumed — none had a single
non-opaque pixel, so nothing was lost.

**JPEG over WebP, settled with reasoning** (in the todo doc): the PNG → lossy step is worth
~89%, the JPEG → WebP step adds ~5 points. Against that, JPEG is progressive — a 20-image grid
paints roughly immediately rather than tile by tile — universal, and creates no friction when
Mark saves an image off his own site.

### 9. Band heights — a round trip, and the number that matters

```
tier       was    tried    now     screen share at 900   band aspect
desktop    305     480     360           40%                4.00
tablet     217     256     256            —                  —
mobile     165     215     215            —                  —
```

**Desktop 480 was too tall** — 53% of a 1440×900 screen, which is the exact figure the 08-29
note cites as its reason for reducing them in the first place. Mark rediscovered it from the
other direction. **Tablet and mobile were KEPT at the taller values: the 08-29 reduction had
been over-applied at those two tiers.**

**Why the height matters beyond taste, and this is the session's real technical win:** the card
is **STRETCHED** from its cell's aspect (0.76–1.52) to the band's, and cover-fit re-crops the
image continuously through that stretch. A shallower band means less stretch. 305 gives band
aspect 4.72; 360 gives 4.00; 480 gives 3.00. **This, not frame timing, is what reduced the
open/close shimmy.** The improvement is gradual — there is no cliff — so 360 is a judged middle,
not a solve.

**NOT restored: the old mechanism.** These stay flat screen pixels per tier. The 08-29 finding
still stands — 480 in NATIVE units scaled by stage width made band height a function of
viewport WIDTH judged against viewport HEIGHT, and reached 853px at 2560.

### 10. Debug instrumentation — removed, not flagged off

The frame tracer built this session was **deleted** rather than left behind a flag, because it
added a push to the draw call. Both `DEBUG.thinkBand` and `DEBUG.thinkBandTrace` are back to
`false`. The removed code and every finding it produced are preserved at
`can_probs_delete/frame-trace-instrumentation_2026-09-13.md`.

*This is a deliberate departure from v82's "instrumentation behind a flag survives, behind a
comment does not." The refinement: **instrumentation in a hot path survives as a document, not
as a flag.** A flag still costs the push.*

---

## THE ONE THAT WAS BUILT AND REVERTED

**The ask, in Mark's words:** *"bringing back the taller expanded card and scroll for all the
content might go far in reducing some of the shimmy behavior since it didn't come back till we
made those changes."*

**Implemented as:** band canvas `position: fixed` → `absolute` at document 0, so it scrolls away
with the page. Then, as each consequence surfaced: `fromRect` converted to document space, and
finally a camera move animating `window.scrollTo` from the same eased progress as the card.

**Reverted whole, the same session.** What survived is the band HEIGHT, which was in the same
change and was doing all the work.

**What it broke, in the order it was found** — each chased as a separate bug before the cause
was questioned:

1. Cards landed above their cells on close, then snapped when the grid redrew.
2. "Fixing" that made cards jump DOWN on open, because `openCard` still teleports to scroll 0.
3. Cards were cropped along the bottom mid-close — **the canvas is viewport-sized and the card
   animated out of it.**
4. Content began revealing in arbitrary chunks — `ScrollFade` and the reveal queue measure
   document geometry.
5. The bokeh stopped tracking — `SiteBackground`'s parallax reads `window.scrollY`.

**The constraint that makes it hard, stated plainly for whoever tries again: the band canvas is
sized to the viewport, so it can only ever draw inside ONE viewport.** The pre-band-model code
parked that window at `top: bandDocY` — over the region containing both the clicked cell and
the band, because that is where the reader was looking. **Any future attempt has to make the
canvas follow the card. That is the first problem, not the last.**

**What the old code was actually worth.** Retrieved via read-only git from `96ec7e9` — the
commit before `5ecd5d2 "Big changes to Think"`, and crucially *after* `c12c348 "fix to
think/work to kill overlapping content"`, so it already contained the fixes Mark was worried
about losing. Its line 379 reads: ***"NO window.scrollTo anywhere."***

> **The old implementation's virtue was not its coordinate system. It was that NOTHING EVER
> JUMPED.** That is a property, and properties can be carried into a new architecture; code
> cannot. Reverting to `bandDocY` anchoring would have brought back three problems v87 lists —
> reachable empty space above the content, part-scrolled next/prev landings, and content placed
> then replaced. Taking the property instead of the code is the right move; it just did not
> survive the canvas constraint.

**And the process failure, which is the part worth keeping.** Two changes — a height and a
coordinate space — **shipped as one**, against a standing instruction to do one thing at a
time. The height was judged good and the coordinate space was catastrophic, and for ninety
minutes it was impossible to tell which had done what. *Had the height gone alone, Mark would
have had the shimmy win an hour earlier and none of the rest.*

---

## OPEN — the named next job: THE CONTENT SPACE

**Raised by Mark, and it is the right next thing.** *"Maybe if we resolve this content space
issue that will fix the loading and background scrolling issues? I'm seeing problems with this
on the work page also."*

**That last clause is the strongest evidence in it.** Work was untouched this session. So this
is **pre-existing and shared, not a regression** — it has been live for weeks.

**The hypothesis, not yet verified:** both pages **collapse the document when a card opens.**
The grid, the header and the margin all go to zero, so the document becomes just the content.
Anything that measured geometry BEFORE that collapse is now measuring a different page — and
`ScrollFade`, `SiteRevealQueue` and `SiteBackground`'s parallax all measure geometry.

Reported symptoms, all consistent with that single cause:

- Content revealing in arbitrary chunks as you scroll a card.
- Scrolling into empty space below the content.
- The bokeh sticking while the content keeps moving — parallax and content disagreeing about
  how tall the page is.

**Instrument before chasing.** The cheapest first measurement is `document.documentElement.scrollHeight`
and `window.scrollY` logged across an open, a scroll and a close, on both pages — if the height
changes under a component that has already measured it, that is the whole story.

**Do this one fresh.** It spans four shared components and it is the kind of problem that gets
worse when tired.

---

## THE LOOP — how this session went

**Five hours. Six heartbeats. The pattern that produced every real finding was the same one,
and it was not measurement.**

- **The nebula bug was solved by Mark's sentence about a held rubber band**, not by
  instrumentation. A velocity theory died in one line.
- **The shimmy was solved by Mark's memory of when it started** — *"it didn't come back till we
  made those changes"* — after roughly two hours of frame tracing had produced numbers but no
  cause.
- **The band being too tall was caught by Mark's eye in seconds**, against a token comment that
  had already computed the same 53% figure two weeks earlier.
- **The failed experiment was called by Mark before Claude called it.** *"This is markedly
  worse in pretty much every respect."*

> **The lesson, stated once and worth more than the rest of this document: ask what CHANGED
> before measuring what is WRONG.** A regression with a known before-and-after is diagnosed by
> reverting, not by instrumenting around it. Read-only git makes that cheap now, and it should
> be an early move rather than a last resort.

**Three instrument failures, all self-inflicted, all worth remembering:**

1. **The instrument triggered what it measured.** A probe for the Welcome scroll lock dispatched
   a synthetic `wheel` event — not noticing that the *dismiss* listener binds `wheel` too. The
   first probe dismissed the hero and every later sample read "unlocked." Would have been
   reported as a broken lock.
2. **The instrument measured the wrong axis.** The frame tracer logged only `y` and `h` for two
   hours. The top-left card has the SMALLEST vertical travel of any cell (475px) and the
   LARGEST horizontal (right edge ~724px, width +897px). It was graded smoothest on the axis it
   barely moves on — while Mark was reporting it as the worst. **The conclusion drawn from it,
   "it's rows not columns," was an artifact of measuring one axis.** Computing horizontal
   centre travel afterwards reproduced Mark's original left/right observation exactly: centre
   cards move 0–137px sideways, edge cards 275–411px.
3. **The instrument could not run where it needed to.** An attempt to drive the test from a
   Claude-created Chrome tab produced zero animation frames — `visibilityState: "hidden"`.
   Background tabs suspend `requestAnimationFrame`. Frame-timing tests cannot be automated from
   a tab that is not frontmost, and the harness had to be handed to Mark to run.

**A fourth, smaller one:** during the frame-timing work, `dt` values clustered at 16.7 / 33.3 /
50.0ms — exactly one, two and three vsync intervals. **The page was never rendering slowly; it
was dropping whole frames.** That distinction was available from the first trace and was not
noticed for an hour.

**Standing rules, carried and sharpened:**

- **Confirm what is running before diagnosing why it isn't working.** *v88: and confirm what is
  DEPLOYED before diagnosing production.*
- **A private tab on a real phone is the only valid mobile test surface.**
- **Two plausible mechanisms is the signal to measure, not to pick.**
- **Before adding a second owner to a CSS property, check who already owns it.**
- **A self-gating formula beats a tier flag.**
- **Grep the signature before believing the bible about an API.**
- **When a feature is unjudged, say "typechecks" and nothing more.**
- **NEW — check whether the pattern you need already exists in the same function.** The nebula
  fix was three lines above the nebula bug.
- **NEW — a symptom that appears on an untouched page is not your regression.** Mark seeing the
  content-space problem on Work is what proved it pre-existing.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see v73–v87.)*

- **NEW – A coordinate is a number plus a frame of reference, and the frame can be declared in
  a different file.** `position: fixed` → `absolute` changed no arithmetic and invalidated all
  of it. The only thing recording the dependency was a comment, and a comment cannot fail a
  build.
- **NEW – A viewport-sized canvas can only draw inside one viewport.** Not a bug — a
  constraint. It determines where such a canvas may be parked, and the answer is "over the
  region the reader is looking at," which is what `top: bandDocY` was doing.
- **NEW – Take the PROPERTY, not the code.** The old implementation's value was "nothing ever
  jumps," not its coordinate system. Properties port to a new architecture; code drags its
  problems with it.
- **NEW – A change that alters a coordinate space and a change that alters a size are two
  changes.** Shipping them together made ninety minutes of symptoms unattributable.
- **NEW – Rebuilding a particle field is not the same as moving it.** `initNebula()` spawns at
  a random non-zero age, so re-initialised particles are visible on their first frame while
  respawned ones fade up from nothing. One path pops and the other does not.
- **NEW – A resize handler is a scroll handler on iOS.** Overscroll animates the toolbar,
  `innerHeight` changes, and `resize` fires repeatedly through a gesture that contains no
  resize in any intentional sense.
- **NEW – A velocity term cannot cause a fault that survives zero velocity.** One sentence from
  Mark falsified a theory that two code readings had supported.
- **NEW – "Too heavy" and "too big" are different image problems with different fixes.** 1200px
  at 2.5 MB needs re-encoding, not resizing. Check bytes-per-pixel before reaching for a
  resize.
- **NEW – Frame times that cluster at multiples of 16.7ms mean dropped frames, not slow
  rendering.** Different diagnosis, different fix.
- **NEW – A directory listing has no business being a runtime fetch.** It cannot change between
  deploys, and fetching it gated the document's height.
- Carried from v87: a guard that never varies at the reference viewport is not a guard; a state
  change cannot gate the event that caused it; the worst second owner is the one listening for
  the handover event itself; components at `opacity: 0` still make the document tall;
  `preventDefault` and `overflow: hidden` are not the same lock; a bottom-anchored element grows
  upward; coincidence is not tuning.
- Carried from v86: a number correct in two units is a decision not yet made; `vw` for the room,
  pixels for the furniture; a mask can only fade the element it is on; a value in the wrong
  coordinate space produces a picture, not an error; a uniform `scale()` cannot make something
  wider without making it taller; six consumers hide behind one token; one event, one writer;
  one id, one owner.
- Carried from v84/v85: a subtitle's size and its tracking solve for the same target width; a
  value with "no separate token" is a token not yet named; an approved number for one tier does
  not authorize the others; `height: 0` is not zero height if a child's margin can escape;
  derive a deadline, do not write it down; a breakpoint should say where the tier changes, not
  name a device; make it required and let the compiler find the call sites; a written lesson is
  a lookup table, not a habit.
- Carried from v83: a stored position is a measurement with an expiry nobody wrote down;
  adjacent in source is not simultaneous; a gate on whether content appears must fail open; a
  measurement that returns a believable number is not a measurement; a reliable reproduction is
  not a mechanism; a prototype's job is to kill a fear.
- Carried from v82: an escape hatch added at extraction time is not wired just because it
  exists; a default is a decision made for every caller that doesn't pass one; instrumentation
  behind a flag survives, behind a comment does not — **v88 amends: in a hot path, as a
  document rather than a flag.**
- Carried from v78–v81: before diagnosing why a change had no effect, prove the change is
  running; introducing a gate introduces a race; an invisible character is a value no search can
  confirm; a search that comes back empty is not proof; moving something into a container
  silently rescales anything sized relative to the VIEWPORT; two numbers can be identical and
  mean opposite things.

---

## Approach & patterns

- **NEW – Reach for `git log -S` and `git show` before building a probe.** Read-only git is
  allowed now. It answered in two minutes what instrumentation had not answered in two hours.
- **NEW – When a change is reverted, write down the constraint that killed it, not just that it
  failed.** "The canvas is viewport-sized" is reusable; "the scrolling band didn't work" is not.
- **NEW – Compute the metric the user is describing, not the one that is easy to log.** Vertical
  delta was easy. Horizontal centre travel was what Mark was seeing, and it took five minutes to
  compute once someone thought to.
- **NEW – Buffer instrumentation and dump once.** `console.log` inside a rAF loop lengthens the
  frames it is reporting on.
- **NEW – State which numbers are guesses in the same message that ships them.** Carried from
  v87 and used throughout.
- Carried: make the change a no-op at the reference width, then judge it elsewhere; assert every
  replacement matches exactly once and abort the script otherwise; do not rewrite a file whose
  invisible characters you have not counted; verify a size claim by rendering it, never by
  computing it by hand; when the small ask reveals a systemic gap, say so and let Mark decide
  the scope; name the thing you did NOT do; point to file/line for simple mechanical fixes;
  propose a mechanism plus a reasoned starting guess and let Mark's live judgment set the
  number; change one visible thing per pass.

---

## On the horizon

*(v87's horizon carries forward. Deltas noted.)*

### THE CONTENT SPACE — the named next job

See OPEN above. Shared across Work and Think, pre-existing, and the thing Mark most wants
resolved. **Start here next session.**

### Think — mid-repair

Shimmy much reduced at band height 360, and the architecture is back to where it was. The
close-landing behaviour has NOT been re-judged since the revert. The double-paint change
(group 6) is unresolved on the top-left card.

### Welcome — unchanged from v87, and now further behind

The handoff remains **unjudged on mobile and tablet**. `scrollRestoration` for the mobile
reload bug was diagnosed and never applied: `history.scrollRestoration` defaults to `"auto"`,
Safari restores asynchronously and can land after hydration, so a reload while scrolled leaves
the reader mid-page with the lock still on. **One line, `history.scrollRestoration = "manual"`,
never written.** The timer-path "hero pops off" was never tested on desktop.

### Work and Think band heights — units mismatch

Deferred at Mark's direction. Work authors `CH = 480` in native canvas units and grows above
1440 (`BAND_GROWTH` 0.4 → ~519px at 1730); Think authors flat screen pixels per tier and does
not grow. **That mismatch is why they drifted apart unnoticed.** Mark: *"probably something we
should fix on the work end."* Do not match them by moving Work while Think is still moving.

### Everything else, carried

`OPENING.sizeVw` consumers remaining: `WorkCarousel`, `ThinkOpenAnimation` (burst layer only
now), `not-found`. The `BREAKPOINTS` findings. Work page: more cards vs a CLIENT-axis carousel.
AI-generated video for the How I Think cards. The motion graphics reel with no home. THE
SHIMMY on Work's carousel. The per-card band anchor. Think's four open defects. THE BAND MODEL
(Work untouched, blocked on spec §11). Welcome's loading. Inline markup leftovers. **DMARC —
still the highest-value non-code item**, plus deleting the unused `ftp` A record
(`98.129.229.120`). Squarespace 404s. Let's Talk's location animation. Splitting the bible —
**proposed six times now**, though `todo_site_wide` is a partial answer. `BF0`/`BF100` desktop.
The dead tokens in `VISIBILITY_TIERS`. Type-role consolidation. Work case 01's twelve videos
with no caption rendering. Known-wrong maths in `WhoSkillsSphere`. Code health (~60 eslint
problems, 7 npm audit vulns — **do not run `npm audit fix --force`**).

---

## Beyond the site — the positioning conversation

**A long detour this session, at Mark's initiative, and it is not a detour.** It began with one
hedged sentence of Welcome body copy — *"I aim to be the gear that connects them all together
in turning out business goals"* — and became a question about whether Creative Director is the
right target at all.

**Captured in full in the Job Search project**, not here:
`2618 Job Search/finding_leadership_question_2026-09-13_v01.md`.

The single line worth carrying into site work: **the copy was hedged because the positioning is
unresolved, and no amount of rewriting fixes that from the sentence end.** Mark's own framing:
the site, the résumé and LinkedIn are three renders of one story, and the site is *"just a
facet of that larger meta goal."*

**The Welcome middle paragraph is therefore still unresolved**, and deliberately so. Current
live text is unchanged. The `page.tsx` NBSP fix (a plain space before an en dash, now at line
220, not 145) was left undone because a rewrite would delete the dash anyway.

---

## Tools & resources

- **Stack:** Next.js 16.2.9 / TypeScript / Turbopack, Vercel (Hobby, auto-deploy), GitHub +
  GitHub Desktop, VS Code. `resend` ^6.24.0.
- **Domain & DNS:** `shtooky.com` — GoDaddy registrar, Cloudflare DNS (Free), all records
  DNS-only, pointing at Vercel. MX/SPF route `mark@shtooky.com` through Laughing
  Squid/Rackspace. **`send.shtooky.com` is the Resend sending domain.**
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then the device to the address
  the **`Network:`** line prints. *A DHCP lease, not a constant.* **This — not production — is
  where iOS bugs get diagnosed.**
- **A private tab is the only valid mobile test surface.**
- **NEW — `npm run gen:gallery`** regenerates `app/data/GalleryManifest.ts`. Runs automatically
  on `predev` and `prebuild`. Add images to a gallery folder and it picks them up on the next
  dev start.
- **`DEBUG` flags in `SiteTokens`:** `visibility`, `sequence`, `thinkBand`, `thinkBandTrace`.
  **All false — verified at session end.** `thinkBand` shows a green HUD over How I Think and
  must never reach production.
- **Claude-side environment.**
  - `device_bash` runs on Mark's Mac, folders at `$HOME/mnt/<folder>`. **The shtooky folder is
    NOT connected at session start** — expect to call `device_request_folder_access` for
    `/Users/marko/shtooky`.
  - **NEW — the `2618 Job Search` folder can be connected too**, and was this session.
  - **NEW — READ-ONLY git is permitted**: `log`, `show`, `diff`, `status`. **No writes.**
  - Each call is a fresh, isolated shell. A dev server must already be running on Mark's end.
  - **The built-in browser pane cannot reach a `localhost` server.** Claude in Chrome can, but
    **a Claude-created tab is a BACKGROUND tab and gets zero `requestAnimationFrame` callbacks**
    — animation timing cannot be measured from it. Hand the harness to Mark.
  - Deleting files needs `device_request_delete_permission`.
  - `npx tsc --noEmit` works there.
  - Heredocs normalise invisible characters. Build escapes character-by-character.
  - **The edit pattern that works:** a Python script asserting every replacement matches exactly
    once, exiting non-zero otherwise, then `tsc`. Zero misfires across ~20 edits this session.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS, COLUMN_TIERS, TYPE_TIERS, SPACE,
  SEQUENCE, TIMING, NAV, FOOTER, VISIBILITY_TIERS, LOGO_GRID_TIERS, BAND_HEADLINE,
  **`BAND_HEIGHT_TIERS` — now 360/256/215**, BAND_ANCHOR_Y, BAND_VIGNETTE, RULE,
  VENN_SCALE_TIERS, DEBUG, `STAGE_MAX_PX`, `stageInset()`, `stagePx()`, `contentWidth()`,
  `contentInset()`, `frameInset()`, `openingPx()`, **`getActivePage(path?)` — now takes an
  optional path**, `isKnownPage()`, `BAND_GROWTH`, `bandFalloffMask()`,
  `CAROUSEL_EDGE_FADE_PX`, `stageFalloffMask()`, `ruleFalloffMask()`); `SiteInlineText.tsx`;
  `SiteCaseMarkdown.tsx`; **`SiteCanvasCover.ts` — `offsetY` now clamped**; `SiteCasePanel.tsx`;
  `SiteTextBlock.tsx`; `SiteRevealQueue.tsx`; `SiteSequenceController.tsx`; `SiteEasterEgg.ts`;
  `app/api/contact/route.ts`; **`app/api/gallery/[...path]/route.ts` — now the FALLBACK, not the
  primary**; `app/not-found.tsx`; `TalkOptions.tsx`; `WelcomeClientLogoGrid.tsx`;
  `WorkManifest.ts`; `ThinkManifest.ts`; **`SiteGallery.tsx` — seeds from the manifest**;
  `SiteScrollConfig.tsx`; `WorkCarousel.tsx`.
  **NEW:** `app/data/GalleryManifest.ts` (generated), `scripts/gen-gallery-manifest.mjs`.
- **Content:** `WorkCase0#.md` (7), `ThinkCard##.md` (13), `About.md`, `Talk.md`, all in
  `app/data/`.
- **INLINE MARKUP (one vocabulary):** `<text>` accent colour, `[br]` line break, `[text](url)`
  link. **Does NOT work in `[pull]` blocks.**
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention, the standing instruction to
  read `node_modules/next/dist/docs/` before writing Next code, and the body-copy dash
  convention.
- **Project bible:** v88 (this file). Superseded bibles live in `can_probs_delete/old-bibles/` —
  *missing v78 and v81; the project holds the canonical set.*
