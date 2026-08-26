# shtooky.com — Project Bible v77

*Supersedes v76 (same day). The session began as a question about
breakpoints, became a rebuild of the case-study content format — headlines
into the manifest, the job box as a block, comments and real paragraph
handling in the markdown, one shared parser for both panels — and then
turned into a sweep of everything the Work carousel and the How I Think
band were **describing twice**. Three separate duplications between those
two files were found and closed; one remains, named below.*

*Almost every good decision here came from Mark editing `WorkCase02.md`
directly and Claude reading what he'd written, or from Mark rejecting a
more complicated proposal. That loop is the finding, not just the code.*

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

For simple, single-value mechanical fixes, Mark prefers to be pointed at
the exact file/line. Claude makes the edit directly when a change spans
multiple files, needs verification against the shared token system, or
involves an architecture judgment call.

**One thing at a time (REINFORCED this session — standing instruction):**
Mark's repeated framing. When Claude offered a three-question batch about
the content format, the answer was *"Let's handle this one thing at a
time."* Present one decision, make the change, look at it, then the next.
This session's format redesign happened in five such rounds and was better
for it — several of Claude's recommendations were overruled productively,
which only happens if the decisions arrive one at a time and small enough
to judge.

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am
(`/who-i-am`), How I Think (`/how-i-think`), and Let's Talk (`/lets-talk`).

**Site vision — "single room" (standing instruction):** The site is one
continuous atmospheric space. Content hangs like banners from the ceiling.
Each page region has its own ambient lighting (five page colors).
Navigation is a camera moving through that space.

**Leftmost-element principle (standing instruction):** NavBar and Footer
are deliberately the leftmost elements on any page, at any breakpoint —
all other content indents from that shared edge, via `FRAME_INSET_VW`.
*Knowingly bent once:* the Who I Am skills-sphere canvas is full-bleed on
mobile/tablet, the same treatment `SiteBackground` gets, because the
atmospheric layer isn't "content." Commented at the change.

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`.
When superseding, write the new file under its own correctly-dated name
and remove the old one rather than reusing the path.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## THE THROUGH-LINE — tokens-first (read this first)

v74 closed on Mark's still-open architectural concern: too many places
deciding sizing and position, making consistency across pages hard. v75
made that the working direction. His words: *"lets use hardcoded sizes in
the tokens file. i think we try to move as much back in there as we can"*
and later *"that is the next thing that needs taming."*

**What "hardcode" turned out to mean** — worth writing down, because it
was ambiguous for a while and cost one wrong turn. It means **explicit
per-tier numbers, tuned by eye, living in the tokens file.** Not derived
formulas. Not local component constants. When Claude first read "hardcode"
as "put literal values in the component," Mark went looking for the number
in `SiteTokens.tsx`, found it, changed it, and nothing happened. That
reflex — where he instinctively looked — is the strongest available signal
about where a value belongs.

### The three kinds of number (agreed framing)

- **Input** — a number tuned by eye, nothing derives it. Font sizes, gaps,
  clearances, insets, box heights. → **Lives in the tokens file, tiered.**
- **Derived** — computed from inputs plus a real measurement. Container
  heights from glyph metrics, link x-positions, `bodyMaxWidth()`. →
  **Never a token.** Stays in the component, but every input it reads
  comes from tokens, and any fudge factor gets a name and a comment.
- **Exception** — a place that must differ. → `TOKEN + NAMED_OFFSET`,
  additive and named, never a fresh literal.

The value of the split: **the tokens file becomes the list of things you
are allowed to change by eye.** A token that's secretly computed is worse
than a computation in a component, because it looks tunable and isn't.

### The same principle applied to CONTENT (NEW this session)

The through-line generalised. `WorkManifest.ts` is now the work page's
config file the way `SiteTokens.tsx` is the site's: it holds the carousel
headlines and `JOB_FIELDS` (the job box's field order and labels). The
`.md` files hold the words. The panels hold only rendering.

The test that decided each case was the same one as for tokens: **where
would Mark's hand go looking for it.** Headlines went to the manifest
because they're per-slot carousel data sitting next to `image`, `offsetH`
and `offsetV`. Job box *values* went to the `.md` because they're the
case's own words; job box *order* stayed in the manifest because it's a
layout decision that should be consistent across all seven cases.

### The second half that tokens alone don't solve

Three different mechanisms resolve values on three different schedules,
and most layout bugs of recent sessions have been a mismatch between them,
not a wrong number:

- **CSS-live** — a `vw`/`vh`/`clamp()` string. Re-resolved every paint.
  Never stale; JS can't read it.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`. Updates on
  resize and on hot-reload edits.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an
  effect, written to `el.style.*`. Correct at the instant it ran, stale
  forever after unless something re-runs it.

**Rule: one mechanism per visual unit.** If a headline and its tagline read
as one thing, both must be CSS-live or both JS-computed.

**Enforceable version: stop importing `getType`/`TYPE`.** The static
exports are desktop-only *and* frozen — two failure modes in one import.

**A fourth schedule showed up this session: fetched.** The case `.md`
files are fetched per-case when a panel opens. Anything that must be on
screen before that fetch resolves — the canvas headlines — cannot live in
them. See the headline decision below.

---

## Current state — what shipped this session

### The case-study markdown format (NEW, the big one)

The whole session's work. The format is now:

```
---                              frontmatter — `key: value`, one per line
imagePath: /images/work/…        (Work: imagePath only)
---

[jobbox]                         key: value lines; order/labels from JOB_FIELDS
title: HP Business Jet Launch
client: HP Inc.

[subtitle]                       display deck; honours newlines and [br]
A crazy schedule demanded…

[label]                          section label, e.g. THE SITUATION
THE SITUATION

[paragraph]                      a BLANK LINE starts a new paragraph
First para.

Second para.

// any line starting with // is a comment and never reaches the page
```

Inside block content: `<text>` renders in the page's accent colour; `[br]`
is a line break.

**Block order in the file IS render order.** That was the decision that
made everything else fall out. Claude had built a `SUBTITLE_POSITION`
flag to place the subtitle above or below a job box that was rendered
separately, ahead of all blocks. Mark's instinct was better: make the job
box a block too. The flag, the `HEAD_SLOTS` fade-offset arithmetic, and
the special-casing all evaporated, and the file now reads as what you see.

**Headlines moved from `WorkCarousel.tsx` to `WorkManifest.ts`.** They
were a module-level `HEADLINES` array read synchronously inside
`drawHL()`. Mark's first instinct was to move them into the `.md` files
alongside the rest of each case's content — but the carousel needs all
seven on the first painted frame, while the `.md` files are fetched
lazily, one at a time, when a panel opens. Two options were on the table
(a `/api/case/manifest` route returning frontmatter-only JSON, or
server-rendering `app/work/page.tsx` and passing them as props). **Mark
proposed a third and better one: put them in `WorkManifest.ts`**, which is
a plain TS import already imported by the carousel for its offsets and
images. Zero plumbing, synchronous, multi-line strings work natively.

**`JOB_FIELDS` lives in `WorkManifest.ts`.** It sets the field ORDER and
the pink LABELS; the `.md` supplies values by key. It's a whitelist — a
key present in a `.md` but missing from the array simply won't render.
The box is a 2×2 grid filled **column-major** (`gridAutoFlow: 'column'`),
so the array reads down the left column then down the right:

```
TITLE      ROLE
CLIENT     DELIVERY
```

Mark's order, dictated as *"title top left, client bottom left, role top
right, delivery bottom right."* **A fifth field would grow a third COLUMN
rather than a third row** — revisit the flow if the box ever gains one.
Commented in place.

**`[label]` instead of a block type per section.** Mark's first draft used
`[situation_paragraph]` and `[solution_paragraph]`. That makes every new
label a code change — a new block type and a new render branch, forever.
His own annotation said what it actually was: *"this gets a label above
it, THE SITUATION, same size/color as the job box labels."* That's a
separate element, not a paragraph variant. `[label]` is one branch, reuses
the `JOB_LABEL` role, composes with anything, and adding THE OUTCOME later
is a content edit.

**Blank lines split paragraphs.** One `[paragraph]` block holds as many as
you like; each gets the full `marginBottom: 28`. Single newlines inside a
paragraph are ignored so prose wraps normally. Mark: *"i love the idea of
just using natural spaces as a substitute for more paragraph blocks."*

**`[br]` normalisation.** A `[br]` at the END of a line is ONE break. Without
that rule the collapsed newline leaves a stray leading space on every
following line — visible as a ragged left edge on left-aligned display
type — and under `white-space: pre-line` it would produce a second break.
A trailing `[br]` is also dropped. `[pullquote]` and `[subtitle]` got
`pre-line`, so bare newlines work too; both authoring styles are valid and
neither doubles.

**`//` comments** are stripped before anything else parses, so they work in
frontmatter AND body. This replaced Mark's improvised `***note***` syntax,
which would have **rendered on the page** — the section splitter breaks
*before* a `[`, so a note sitting above a block was being absorbed into
the END of the preceding block's content.

**Video paths resolve against `imagePath`.** `production/hp_animatic.mp4`
becomes `/images/work/CaseStudyImages_2/production/hp_animatic.mp4`. A
leading `/` is the escape hatch for anything outside the case folder.
Done at the panel's parse boundary via `resolveGalleryMedia()`, so
`SiteGallery` still only ever sees plain absolute URLs and needed no
changes.

### `CaseMarkdown.tsx` — one parser, two panels (NEW)

`WorkCaseStudyPanel.tsx` and `ThinkCasePanel.tsx` each carried their own
copy of the frontmatter parser, block splitter, `parseAccents`,
`parseGalleryBlock` and `resolveImagePath`, with a comment asking whoever
edited one to keep the other in step. **They had already drifted** — Work
grew `[jobbox]`/`[label]`, Think grew a stricter frontmatter parser and
`[img]` — and the comment asking for parity is what failed.

Now `app/components/CaseMarkdown.tsx` holds the format; each panel
declares only its own dialect and keeps its own rendering:

```ts
const WORK_BLOCKS  = new Set(['jobbox','subtitle','label','paragraph','pullquote','video-carousel','gallery'])
const THINK_BLOCKS = new Set(['label','paragraph','pullquote','video-carousel','gallery','img'])
```

`WorkCaseStudyPanel` went 365 → 244 lines, `ThinkCasePanel` 401 → 273.

**The port went both ways.** Think's frontmatter parser (a proper
`/^(\w+):\s*(.*)$/` regex with a `key in fm` whitelist) is better than
Work's naive `split(':')`, so the shared module took Think's. Think's
`BODY_BLOCK_TYPES` whitelist-and-skip also became the shared behaviour.

**Think's frontmatter cannot become blocks the way Work's did.** `title`
and `narrowtitle` are read server-side by `/api/think/manifest/route.ts`
with its own regex and painted on the grid by `ThinkGridCanvas.tsx`. Its
`subtitle` renders in a distinct header row with its own layout. Noted in
`parseMd` so nobody "finishes the job" later and breaks the grid.

**Verification:** the shared parser was simulated in Node against all 20
content files — 7 Work cases, 13 Think cards — checking frontmatter
survived and blocks came out as authored. Zero problems. Worth repeating
whenever the format changes; it catches what `tsc` can't.

### Content migration and the visual changes it caused

All seven `WorkCase##.md` files were migrated from frontmatter
`title/client/role/delivery` to a `[jobbox]` block. Supporting both would
have meant two ways to do the same thing forever.

**Exactly one Think card changes on screen — ThinkCard01**, verified by
diffing old-rule against new-rule block counts across all thirteen:

- A `[paragraph]` containing two paragraphs separated by a blank line was
  rendering as one run-together block. It now splits properly.
- Two pullquotes use `[br]` at end of line and lose their stray leading
  space.

Both are fixes, but that's the page to eyeball.

### New type roles

- **`JOB_VALUE`** (17/16/15) — absorbs the bare `fontSize: 17` that was
  repeated four times in the job box. Desktop is pixel-identical.
- **`CASE_SUBTITLE`** (32/26/20) — the case-panel deck.

Both tablet and mobile tiers are commented **`UNTUNED — never rendered at
this tier`**, the explicit lesson from v75's mobile `DISPLAY_HERO` value
of 30 that had never actually rendered.

### The band, described twice (NEW — the second half of the session)

`WorkCarousel.tsx` and `ThinkGridCanvas.tsx` paint the same gesture: a
full-bleed canvas band, 1440-wide reference stage, bottom vignette, a
display headline sitting on the image, detail text below. Almost every
number describing that gesture existed **independently in both files**.
Four instances surfaced; three are now closed.

**1. The parsers** — closed earlier in the session (`CaseMarkdown.tsx`).

**2. The gap under the band → `SPACE.layout.bandDetailGap` (40 / 40 / 16).**
Work's gap was split across two places — `panelPaddingTop` on the panel
*plus* `jobBoxPaddingTop` on the job box — which meant it silently changed
depending on which block led the file: 60px with `[jobbox]` first, 40px
with `[subtitle]` first, and the job box would have carried a stray 20px
into the middle of the page if it ever moved down. Think's was a bare
`+ 20` inside `detailTopPx = bandDocY + bandHeightPx + 20`.

Now one token, read by both. Justified because the thing above the gap is
**optically identical** — Think's `drawVignette` is commented *"matches
WorkCarousel"* and does exactly that: gradient from 60% down, black at
0.85. Same edge, same gap. Mark picked 40/40/16 from three options.
*Visible effect:* Work tightens 20px when a case leads with `[jobbox]`;
Think roughly doubles, 20 → 40, and gains a mobile tier it never had.

**3. The headline size → `BAND_HEADLINE`.**

```ts
export const BAND_HEADLINE = {
    sizePx:       52,   // REFERENCE size at refW, not a rendered px
    lineHeightPx: 55,
    mobileSizePx: 28,
    refW:         1440,
}
```

52 and 55 were bare literals in both files, kept in step by a hand-written
comment (*"All values match WorkCarousel.drawHeadline"*). Each file still
applies the scale its own way and **must** — Work draws into a 1440-wide
native canvas that is CSS-scaled, so it divides by the stage scale; Think's
band has its own canvas sized in real screen pixels, so it multiplies up
front. Commented in both as the mirror of the other, so the asymmetry
reads as deliberate.

The real gain is `mobileSizePx`. Both files previously read
`getType().PULLQUOTE.sizePx` on mobile, so **tuning pullquotes silently
moved the band headline on two pages**. Same value (28), no visual change,
coupling gone.

*Deliberately NOT shared:* the bottom padding. Think uses `28 * unitPx`;
Work expresses the same offset as `CH - 48 + HL_Y(20)` in native units that
do **not** scale with the headline. They agree on desktop/tablet and
diverge on mobile. Unifying would have moved the Work headline, so it's
commented as a known divergence instead.

**4. STILL OPEN — the vignette.** Think hardcodes `0.6` / `0.85` where Work
has `CFG.VIG_HEIGHT` / `CFG.VIG_OPACITY`. This is now sharper than it was:
`bandDetailGap` is a shared number *justified by those two vignettes being
identical*. Tune Work's vignette and the shared gap quietly stops being
defensible, with nothing to warn you.

### Galleries — the step-down is gone (NEW)

`SiteGallery` reduced columns by a fixed subtraction — `tablet = N-1`,
`mobile = N-2`. Because it was absolute rather than proportional, the
reduction varied wildly: a `2up` lost half its columns, a `5up` a fifth.
It also destroyed authored compositions — an 8-image `4up` reflowed to
3+3+2, and a 5-image `5up` stranded a single tile on its own row.

Claude proposed per-breakpoint Nup syntax (`5up, 3up, 2up`). **Mark's
counter was better and simpler: use the desktop Nup everywhere.** His
reasoning — there are enough galleries whose counts only make clean grids
at their declared number. **The Nup is a compositional decision, not a
density one**, so preserving it preserves the composition, and it needs no
new syntax at all.

Real tile sizes at the current content's Nup values (tablet 660px column,
mobile 351px, 6px gaps): `2up` → 327 / 172px, `4up` → 160 / 83px, `5up` →
127 / 65px. Tablet is comfortable everywhere. On mobile the grid becomes a
contact sheet and the lightbox is where the work is actually viewed —
accepted, with a mobile-only override to be added *if* 4up/5up proves too
tight in the flesh. `noClick` plus a high Nup on mobile would be the
dangerous combination (tiny *and* unopenable); nothing uses it yet.

`TABLET_COL_STEP`, `MOBILE_COL_STEP` and `columnsForBreakpoint()` are
deleted. The only surviving clamp is shrink-to-image-count, so a short row
isn't stretched.

**`2by3` crop added** for the poster page (06). And `SiteGallery` was still
carrying its own duplicate copies of `GalleryOffset`/`GalleryVideoLink`/
`GalleryData` — adding one crop token meant editing the union in two
places, so it now imports them from `CaseMarkdown.tsx`.

**Crop default: `4by3`, confirmed by Mark.** Note both doc comments claimed
*"omitted = native image aspect ratio"* while the code has always done
`CROP_RATIOS[gallery.crop ?? '4by3']`. The code was right and the comments
were wrong; Mark's call is that a tidy uniform grid beats native ratios.
Consequence worth remembering: a gallery with no crop token is being
letterboxed to landscape, which is why the posters needed `2by3`.

### Breakpoints — the conversation that started the session

Mark asked how the server knows what to send, and whether a desktop window
scaled down to mobile widths is a problem. The answers, since they'll
recur:

**The server doesn't know anything.** One HTML and one CSS bundle go to
every device; the browser decides which rules apply from the CSS viewport
width. UA sniffing exists and has been out of favour for a decade.

**This site is a third case.** It doesn't use media queries — it resolves
a breakpoint in JavaScript from `window.innerWidth` and feeds tokens off
it. Legitimate given how much layout is measured and absolutely
positioned, but it means the tier doesn't exist during server render, only
after hydration.

**A desktop window scaled into the mobile layout is correct, not a bug.**
Half-screened browsers, split-view iPad — and browser zoom, where a user
at 200% on a 1440 laptop makes the page see 720 CSS px. Zoom users
*should* get the tablet layout; that's the accessibility win. Corollary:
**nav mode is a fit question, not a device question.** Show the full nav
while the links fit, collapse when they'd collide, and the "does desktop
need a hamburger" question dissolves.

**Landscape iPhone is three stacked bugs, not vague badness.** 844×390
resolves by WIDTH to the tablet or desktop tier, then renders
desktop-calibrated `vw` type into 390px of height. `100vh` on iOS moves as
the URL bar hides (`dvh`/`svh`/`lvh` exist for this). And orientation
change fires `resize` with inconsistent timing relative to reflow, so a
measured `offsetHeight` may be read before or after settling — which is
exactly Mark's *"sometimes it resets, sometimes it doesn't."*

**Proposed, not built:** a `SHORT_VIEWPORT` guard layered on the width
tier (roughly "if height < 500, compress vertical spacing and cap type")
rather than a fourth breakpoint; resolving the tier from the smaller
dimension so a rotated phone stays on mobile; `ResizeObserver` on the
measured element instead of a window `resize` listener.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see v73/v74/v75.)*

- **NEW — A comment asking two copies to stay in sync is a countdown, not
  a safeguard.** `WorkCaseStudyPanel` and `ThinkCasePanel` carried exactly
  that comment and had drifted in both directions before anyone noticed.
  The drift wasn't sloppiness; it was two people solving local problems in
  the file in front of them, which is what always happens. Extract, or
  accept the divergence honestly — but don't write the comment and call it
  handled.
- **NEW — Encoding a value into a NAME makes every new value a code
  change.** `[situation_paragraph]` and `[solution_paragraph]` needed a new
  block type and a new render branch per section label. `[label]` plus its
  text needs neither. The same shape shows up whenever a variant is spelled
  into an identifier rather than passed as data.
- **NEW — Content that must be on screen before a fetch resolves cannot
  live in the fetched file.** The carousel headlines are painted on canvas
  on the first frame; the `.md` files arrive later and one at a time. This
  is the fourth resolution schedule (see the through-line) and it has the
  same failure mode as the others: the value looks like it's in the right
  place and simply isn't there yet.
- **NEW — A silently-skipped block type is invisible failure.** Unknown
  blocks are dropped by design, which is what makes `[note]` work as a
  comment — and also what would have let a typo'd `[pullqoute]` vanish
  without a word. An accepted trade, worth knowing about.
- **NEW — macOS lies to you about case.** A `[gallery]` pointing at
  `Production` when the folder is `production` works locally on a
  case-insensitive filesystem and 404s on Vercel's Linux. There is no
  local symptom at all.
- **NEW — `[br]` at the end of a line is a break AND a collapsed newline.**
  The stray leading space it leaves is invisible in a diff and visible on
  screen as a ragged left edge. Any authored-break token needs the parser
  to decide what an adjacent newline means.
- **NEW — An explicit override that skips a fallback chain fails worse
  than no override.** A wrong explicit gallery `poster` doesn't fall back
  to the folder image; it renders nothing. Overrides should be opt-in
  precisely because they turn a graceful chain off.
- **NEW — When one file says "matches the other file," that IS the bug
  report.** Both duplications closed in the second half of the session
  announced themselves in a comment: *"All values match
  WorkCarousel.drawHeadline"* and *"Vignette — matches WorkCarousel"*. A
  comment claiming parity is a developer telling you, in writing, that
  nothing enforces it. Grep for that phrasing; it's a reliable smell.
- **NEW — A responsive rule that "helpfully" reduces can destroy an
  authored composition.** The gallery step-down existed to be considerate
  on small screens and instead reflowed an 8-image 4up into 3+3+2 and
  stranded single tiles. The author chose the Nup *because* of the image
  count. Density is the system's business; composition is the author's.
- **NEW — Check the coordinate space before declaring a scaling bug.**
  Work's headline is 52 native units on a CSS-scaled 1440 stage; Think's is
  52 screen pixels on a viewport-sized canvas. Read side by side, Think
  looks double-scaled and its mobile path looks catastrophically small.
  Neither is true — they render identically. The theory was fully formed
  and wrong; five minutes confirming which canvas each drew into was what
  settled it. Same lesson as v75's Lottie bug: read the structure, not the
  symptom.
- **NEW — A default that contradicts its own doc comment will mislead
  someone for months.** `CROP_RATIOS[gallery.crop ?? '4by3']` silently
  letterboxes every gallery that omits a crop, while two comments promised
  native aspect ratio. Nobody was going to catch that by looking at a
  gallery — it just quietly looked slightly wrong.
- **NEW — A gap assembled from two paddings isn't a gap, it's a
  coincidence.** Work's carousel-to-text gap was a panel pad plus a job-box
  pad, which was invisible while the job box was always first and became a
  content-dependent number the moment block order started deciding layout.
  One visual relationship, one number.
- **NEW — Read what the person actually wrote before proposing what they
  should write.** Every real improvement this session came from Mark
  editing `WorkCase02.md` by hand and Claude reading it — the `[jobbox]`
  block, folder-relative video paths, blank-line paragraphs. His
  annotations described the intent (*"same size/color as the job box
  labels"*) more precisely than any spec would have.
- Carried forward from v75: a track-matte layer that ends before the layer
  it mattes is a latent cross-browser bug; read a file's STRUCTURE before
  theorising about a browser engine; a shrink-to-fit fitter silently takes
  over the value it's guarding; `em` is breakpoint-awareness for free;
  where someone instinctively looks for a value is evidence about where it
  belongs; a canvas hard-clips at its own box mid-glyph; widening a
  container silently resizes anything sized from container width; a flat
  threshold compared against a resting position is a breakpoint bug
  waiting to happen.
- Carried forward from v74: `position: absolute` children contribute
  nothing to their parent's intrinsic height, and a wrong guessed height
  spills rather than clips; a frozen JS pixel value and a live CSS `vw`
  are two different trust models that can disagree; `ResizeObserver`
  reports settled boxes and can't be fooled by DevTools timing; imperative
  measurement plus declarative styling drift apart without an explicit
  dependency array; when a person says they can no longer follow how a
  system works, that's a signal about the system.

---

## Approach & patterns

*(New entries marked **NEW**; prior set carried forward.)*

- **NEW — One decision at a time, and let it be overruled.** See Purpose &
  context. Mark overruled Claude's recommendation twice this session
  (headlines into the manifest rather than the `.md`; job box as a block
  rather than a positioning flag) and both were the better call. Batching
  three questions got *"Let's handle this one thing at a time."*
- **NEW — Offer deletion before parameterisation.** Twice this session
  Claude proposed configurable machinery — a `SUBTITLE_POSITION` flag, a
  per-breakpoint Nup syntax — and both times Mark's answer was to remove
  the rule instead: make the job box a block, use the desktop Nup
  everywhere. Both were smaller, simpler and better. When the instinct is
  "let's make this tunable," check first whether the thing being tuned
  should exist.
- **NEW — Simulate a parser against real content before believing it.**
  The new block parser was run in Node over all 20 `.md` files, printing
  the block sequence per file, before anything was called done. `tsc`
  proves the types; only this proves the format. Diffing old-rule against
  new-rule output is also how the ThinkCard01 change was found rather than
  discovered later on screen.
- **NEW — Say which files change VISUALLY, and how many.** "One card
  changes, here's which and here's the paragraph" is checkable; "should be
  fine" isn't.
- **NEW — Migrate all the content rather than leaving a compatibility
  fallback.** Six case files still had frontmatter job data. Supporting
  both would have left two valid formats and a hidden branch forever.
- **NEW — Bible-drop means catch up fast and offer a menu, not audit the
  repo.** Targeted verification of specific numbers is fine and
  encouraged; a silent sweep is not.
- Carried forward: verify a test rig before trusting a null result; say
  when a diagnostic is contaminated; recalibrate in the same change that
  causes the drift; fix stale comments in the same pass as the code they
  describe; point to file/line for simple mechanical fixes; flag
  discrepancies rather than picking silently; propose a mechanism plus a
  reasoned starting guess and let Mark's live judgment set the number;
  full-file replacement over accumulated patches; always read current file
  contents before editing; screenshot-driven live tuning as the default
  mode for breakpoint-visual work; diagnose fully before touching code.

---

## On the horizon

### Immediately next — Mark is mid-flight
Mark is rewriting the remaining Work case files into the new format.
`WorkCase02.md` is the reference. The other six still hold their old copy
and have **no `imagePath`** — each will need one as it gains a gallery.
Known content typos: **"Microoft** Store 12 Days of Deals" (WorkCase01),
"Wedding **Infogrphics**" (WorkCase07), and **"Have a reaon"** in
ThinkCard01's second pullquote.

### The last band duplication — do this one
**Think's vignette hardcodes `0.6` / `0.85`** where Work has
`CFG.VIG_HEIGHT` / `CFG.VIG_OPACITY`. It is the only remaining number the
two band files describe twice, and `SPACE.layout.bandDetailGap` now
*depends* on the two vignettes being identical. Highest-value small fix
on this list.

### Untuned values from this session
- `SPACE.layout.bandDetailGap` (40 / 40 / 16) — a chosen compromise
  between Work's old 60 and Think's old 20, not yet judged on screen.
  **Think is the page to look at**; it has never had a gap this size.
- **Galleries on mobile at `4up` / `5up`** — 83px and 65px tiles. Accepted
  as a contact-sheet read, but this is the thing most likely to want a
  mobile-only override. If it does, add it then; don't pre-build syntax.
- `CASE_SUBTITLE` and `JOB_VALUE` tablet/mobile tiers — commented
  UNTUNED, never rendered.
- `[label]`'s `marginBottom: 10`, chosen to sit tight above its section.

### Broken right now
**`CaseStudyImages_1/youtube_link/` contains zero images**, so WorkCase01's
video gallery renders nothing at all — `SiteGallery` bails on
`images.length === 0` and the video has no tile to attach to. Drop any
poster frame into that folder and it appears. Same rule that makes
`video_poster.jpg` load-bearing in WorkCase02: **no image, no tile, no
video.**

### Deferred by decision
**Gallery poster precedence.** For a YouTube video the chain is
`maxresdefault → hqdefault → folder image`, so a hand-made poster sitting
in the folder is the FALLBACK, not the winner — and since `hqdefault`
effectively never fails, it is never shown. Claude recommended flipping it
(folder image wins; `poster: auto` opts into YouTube's thumbnail). Mark
chose to leave it for now — *"less work for me than ginning up more poster
images"* — and explicitly flagged it as a future change.

**Crop default stays `4by3`.** Decided, not deferred — but the doc
comments that said "native" were wrong and are worth not re-introducing.

**The landscape / short-viewport guard.** Diagnosed in detail above, not
built.

### The tokens-first migration, continued
- **Still-flat spacing values:** `LINE_GAP_PX` (mobile hero, 1.5),
  `ROW_GAP_TOP`/`ROW_GAP_BOTTOM` (Let's Talk accordion, 16/40),
  `lineGapPx` (Welcome CTA, 30), `marginTop: 24` and `margin: '0 0 10px 0'`
  on the Work text block.
- **The `vh` spacers.** Welcome has eight (`35/8/4/3/5/6/6/20`), Who I Am
  three, Let's Talk one. **Deliberately deferred on Welcome** — Mark has a
  revised vision for how that page sequences.
- **Hardcoded font sizes on no token:** `TalkOptions` (16/15/15),
  `SiteNavBar` (9), `WhoSkillsSphere` (11), `ThinkGridCanvas` (11), the
  figcaption/counter 13s in both case panels, plus `clamp()` leftovers in
  `ThinkBelowPlaceholder` and `SiteTextBlock`. (The job box's four
  repeated 17s are gone — now `JOB_VALUE`.)
- **Delete the legacy `TYPE`/`COLUMN` static exports.** Ten files still
  import `TYPE`. Deleting them makes the desktop-only-by-accident bug
  structurally impossible; the compiler finds every site.
- **`const N = 7` in `WorkCarousel.tsx`** now duplicates
  `WORK_MANIFEST.length`. One-line fix, offered and not yet taken.

### The scroll-fade family — never swept
The Let's Talk fix was one instance of a recurring shape: a resting
position compared against a flat threshold. `WhoSkillsSphere`,
`WelcomeClientLogoGrid`, `WhoVennDiagram`,
`WelcomeEverythingIsInteresting` and both Welcome heroes each have their
own independent scroll-fade. Any could be dimming on arrival, with the
error growing as the viewport shrinks. Offered as a read-only sweep; not
yet run.

### Duplication that has already drifted
- **RESOLVED this session:** the two case-panel parsers (now
  `CaseMarkdown.tsx`); the band→detail gap (now
  `SPACE.layout.bandDetailGap`); the band headline size and line height
  (now `BAND_HEADLINE`); `SiteGallery`'s duplicate gallery types (now
  imported from `CaseMarkdown.tsx`).
- **STILL OPEN between the same two files:** the vignette constants. See
  above.
- `TAGLINES` exists in **both** hero files and the two copies **already
  differ** — "problems in the end" on mobile vs "problems at the end" on
  desktop/tablet. Extract to a shared module before hand-placing line
  breaks in two places. *This is the same failure the case panels just
  had, and it's still open.*
- Colour helpers (`rgbToHsl`/`hslToRgb`/etc.) duplicated across the two
  hero files.
- `BODY_WELCOME`/`BODY`/`CASE_BODY` are three identical token roles.

### The Welcome hero sizing race — still unresolved
Both heroes compute the headline font size from a one-time
`window.innerWidth` read frozen into pixels. The proposed fix (re-run the
full layout from the existing `ResizeObserver`, which reports only settled
boxes) is reasoned and explained but not implemented.

### Known-wrong maths, flagged and not fixed
- `WhoSkillsSphere` fog: `coreR = W × sphereRadius × fogRadius × …`
  produces a gradient radius in the tens of thousands of pixels.
- `WhoSkillsSphere` `particleSpread` is used two different ways in the
  same file — `126 × SCALE` at spawn, `W × 126` for the recycle boundary.
  Effect: particles never recycle.
- `WelcomeHeroAnimation`'s `lineH * 0.76` cap-height guess is the same
  class of inaccuracy `WelcomeHero2Line` already replaced with real canvas
  glyph measurement.
- `SPACE.layout.talkNavClearance` and `SCROLL_FADE_TIERS` in
  `TalkRippleNetwork.tsx` must agree by hand.

### Other open items
**The AE source of the Lottie fix.** `thinking-open.json` is fixed in the
repo; the After Effects project is not. Two other layers have the same
lifespan mismatch — `How mask` (134–150) against `How` (134–180), and
`think 5`/`think 6` mattes ending at 16.

**Code health.** `npx eslint app` reports ~60 errors, all pre-existing —
unescaped apostrophes, `setState` in effects, refs read during render.
Next 16 does **not** run ESLint during `next build`, which is why they've
never blocked a deploy.

**Carried over, untouched:** hamburger menu visual polish; navbar gradient
3-stop proposal; backdrop-filter blur behind navbar; `NAV_GRADIENT_HEIGHT`
confirm; uncapped `COLUMN_TIERS.desktop.vw`; fluid clamp-based body-copy
scaling (paused, not declined — **and the breakpoint conversation above is
an argument for un-pausing it**, since it's what stops the widths between
tiers from being edge cases); full five-page three-breakpoint visual pass;
Who I Am's orphaned pull-quote `clamp()`; the stale "copied from desktop
as placeholder" comment on `TYPE_TIERS`' mobile tier; Who I Am's perceived
right-bias on tablet (likely bokeh spawn, not `offsetX`); coding-literacy
side project.

**Infrastructure.** Contact form `/api/contact` + Resend still blocked on
creating a Resend account (SPF TXT will need merging, not duplicating).
Decide on DMARC. Delete the unused `ftp` A record. Decide whether to add
`vercel.json` redirects for ~100+ old indexed Squarespace URLs that now
404.

---

## Tools & resources

- **Stack:** Next.js 16 / TypeScript / Turbopack, Vercel (Hobby,
  auto-deploy), GitHub + GitHub Desktop, VS Code.
- **Domain & DNS:** `shtooky.com` — registered at GoDaddy, DNS at
  Cloudflare (Free), all records DNS-only (unproxied), pointing at Vercel.
  MX/SPF route `mark@shtooky.com` through Laughing Squid/Rackspace,
  independent of hosting. Squarespace fully retired.
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then
  phone (same Wi-Fi) → `http://10.0.0.154:3000`.
- **Live DevTools breakpoint workflow:** custom device presets at exact px
  (iPhone 390×844, iPad Mini 768×1024, Desktop 1440×900), device toolbar
  undocked, side-by-side with a real non-emulated window. Watch the
  DevTools "device type" toggle (mobile vs desktop) — it changes rendering
  rules independent of the entered dimensions. Also watch client-side
  navigation vs hard reload as a variable.
- **Claude-side environment:**
  - **Screen recording is GRANTED.** Claude can take screenshots of Mark's
    Mac. Safari can only be granted at **read** tier — visible in
    screenshots, but no clicking or typing.
  - `device_bash` runs in a sandboxed **Linux** VM with the repo mounted —
    NOT macOS. It cannot reach `localhost:3000`, cannot run `next build`,
    and **cannot delete files** (`mv` to a junk folder instead).
  - **`npx tsc --noEmit` DOES work there** and is pure JavaScript — the
    fast way to verify edits. Used constantly.
  - **`node` also works there**, which is how the parser was simulated
    against real content this session. Cheap and worth doing.
  - The cloud container (the `Bash` tool) is a separate machine with
    restricted network — GitHub and Google Fonts are blocked.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS,
  COLUMN_TIERS, TYPE_TIERS, SPACE, SPACE_SCALE, TIMING, NAV,
  VISIBILITY_TIERS, LOGO_GRID_TIERS, **BAND_HEADLINE**, hooks);
  **`CaseMarkdown.tsx`** (the shared content format — read its header
  comment first); **`WorkManifest.ts`** (per-slot carousel data,
  headlines, `JOB_FIELDS`); `SiteGallery.tsx` (shared by both case
  panels — grid, lightbox, video posters); `WorkCarousel.tsx` is the
  recurring pattern reference; `TalkRippleNetwork.tsx` and
  `WhoSkillsSphere.tsx` share the sparse per-breakpoint override pattern.
- **The band pair.** `WorkCarousel.tsx` and `ThinkGridCanvas.tsx` paint the
  same gesture and share `BAND_HEADLINE` and
  `SPACE.layout.bandDetailGap`. Anything else describing that band —
  vignette, padding, timing — should be checked in BOTH files before
  being changed in one.
- **Content:** per-case markdown parsed by `CaseMarkdown.tsx`. Work blocks:
  `[jobbox]`, `[subtitle]`, `[label]`, `[paragraph]`, `[pullquote]`,
  `[gallery]`, `[video-carousel]`. Think blocks: the same minus
  `[jobbox]`/`[subtitle]`, plus `[img]`. `WorkCase0#.md` (7 files),
  `ThinkCard##.md` (13 files). `[gallery]` line 2 is
  `Nup, crop(4by3|16by9|1by1|2by3), noClick` — the Nup holds at every
  breakpoint, and an omitted crop means **4by3**, not native. `app/data/AboutContent.ts` and
  `TalkContent.ts` hold page copy plus per-page `SPACING` (reading
  `SPACE.text`) and `entryDelay`/`paragraphStagger` — the latter two are
  timing and arguably belong with `TIMING`.
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention.
- **Project bible:** v77 (this file), stored at `/Users/marko/shtooky`;
  local repo at `/Users/marko/shtooky`. Superseded bibles are moved to
  `can_probs_delete/old-bibles/` rather than deleted, since `device_bash`
  cannot remove files.
