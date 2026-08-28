# shtooky.com — Project Bible v80

*Supersedes v79. **The site is live.** This session was a content-and-copy pass,
a security fix, a new page, and — for the last third — a long design
conversation that produced a spec rather than code.*

*The finding under most of it: **v78's habit was a value transcribed from its
source. v79's sibling was a value wired to something that never changes. v80's
is smaller and nastier — a value you cannot see.** Thirty lines of content
carried non-breaking spaces that render identically to real ones and silently
defeat every exact-match search, including the ones used to verify the fix.*

*Companion documents: `spec_sequencing_2026-08-25_v01.md` (at v03, untouched)
and **`spec_band_model_2026-08-27_v01.md` (NEW — the shared Work/Think band
model, written this session, nothing in it built yet).***

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
say so — targeted, not a sweep.

*This session proved it a third time, in the good direction: v79 listed
`[praragraph]` in `ThinkCard02.md` as a paragraph missing from the LIVE site.
It is not there. The file reads `[paragraph]`, and a repo-wide grep for
`praragraph` returns nothing. It had already been fixed. **A bible entry can
be stale by being fixed, not only by being wrong.***

For simple, single-value mechanical fixes, Mark prefers to be pointed at
the exact file/line. Claude makes the edit directly when a change spans
multiple files, needs verification against the shared token system, or
involves an architecture judgment call.

**One thing at a time (standing instruction).** Present one decision, make the
change, look at it, then the next.

**Let Mark describe the intent before proposing the fix.** A description of
intent is a diff against the implementation. Claude's role is to hold each
point up to the code and say where it aligns and where it doesn't.

*This session's clearest instance ran across five messages. Mark's opening
intent for the Work/Think band was "partially pin the headline image." Claude
scoped a pinning build. Mark then reframed it — "the carousel can start taller
and then narrow down… and then that image band NEVER scrolls" — which turned
out to **delete** the risky part rather than add to it: a fixed band means the
open animation ends at a viewport coordinate instead of a document one. **The
better answer again deleted the proposal.***

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am
(`/who-i-am`), How I Think (`/how-i-think`), and Let's Talk (`/lets-talk`),
plus a 404 (`not-found.tsx`, NEW this session).

**Site vision — "single room" (standing instruction):** The site is one
continuous atmospheric space. Content hangs like banners from the ceiling.
Each page region has its own ambient lighting (five page colors).
Navigation is a camera moving through that space.

**Leftmost-element principle (standing instruction):** NavBar and Footer
are deliberately the leftmost elements on any page, at any breakpoint —
all other content indents from that shared edge, via `FRAME_INSET_VW`.
*Knowingly bent twice:* the Who I Am skills-sphere canvas is full-bleed on
mobile/tablet, and that canvas escapes the content column via `bleed: true`
on its `[slot]`, the same treatment `SiteBackground` gets, because the
atmospheric layer isn't "content." Commented at both.

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`.
When superseding, write the new file under its own correctly-dated name
and remove the old one rather than reusing the path.

**Component naming.** A component used by more than one page takes the
`Site` prefix. Page-specific components keep their page prefix (`Who…`,
`Work…`, `Think…`, `Welcome…`, `Talk…`). Every component in
`app/components/` carries a prefix, so a file without one is a signal.

**NEW — body copy dashes (now in `AGENTS.md`).** Spaced en dash, never an em
dash. The space BEFORE it is a non-breaking space (U+00A0); the space after is
a regular space, so a dash can never be pushed to the start of a line. Content
`.md` carries the literal character; `.tsx` string literals use the escape
` ` so it is visible in source; JSX text uses `&nbsp;`.

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

### The four resolution schedules

- **CSS-live** — a `vw`/`vh`/`clamp()` string. Re-resolved every paint.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
  Correct once, stale forever.
- **Fetched** — arrives after first paint. Anything that must be on screen
  before it resolves cannot live there.

**Rule: one mechanism per visual unit.**

### THE HABIT BEHIND THE BUGS — the three generations

| version | the habit | example |
|---|---|---|
| v78 | a value **transcribed** from its token | visibility-zone literals |
| v79 | a value **wired to something that never changes** | `2.2em` on an inherited font-size; `[open, children]` |
| **v80** | a value **you cannot see** | U+00A0 beside 30 en dashes |

> **v80's line: an invisible character is a value whose correctness no search
> can confirm and no diff will show you. Compare against an escape, never
> against a pasted copy of the thing itself.**

This bit twice in one session, both times in Claude's own tooling. A
find-and-replace reported "no match" on text plainly visible on screen (the
en dash was followed by an NBSP). Then the verification script for the NBSP
migration passed literal NBSP characters through a shell heredoc to test for
NBSP characters — they were flattened to plain spaces in transit, and all 139
correct edits were reported as failures. **The edit was right; the test was
wrong; the test looked more trustworthy than the edit.**

### The same principle applied to CONTENT

`WorkManifest.ts` is the work page's config file the way `SiteTokens.tsx` is
the site's. `About.md` and `Talk.md` hold the words, the sequence, and the
pull-quote choreography. The test that decides each case: **where would Mark's
hand go looking for it.**

---

## Current state — what shipped this session

### Contact form — spam protection (was v79's highest-priority open item)

Two checks, both in `app/api/contact/route.ts`, one hidden field in
`ContactForm`:

- **Honeypot.** A `website` input rendered off-screen (`position: absolute`,
  not `display:none` — some scripts skip fields they can tell are hidden but
  fill ones that are merely elsewhere). Absolute positioning also means it
  contributes nothing to the flex column: no height, no extra 20px gap, and
  nothing for `Collapsible`'s `ResizeObserver` to measure. `tabIndex={-1}` and
  `aria-hidden`.
- **Elapsed time.** `MIN_ELAPSED_MS = 3000`, measured on the CLIENT as
  `now − mount` and sent as a **DURATION, never a timestamp** — the server must
  not have to trust the visitor's clock, only their stopwatch.

Both return **`200 { ok: true }`** and send nothing. A bot given a 4xx retries
with variations; a bot told it succeeded leaves.

**A missing or non-numeric `elapsedMs` is allowed through deliberately.** It is
client-supplied and trivially omitted, so treating absence as guilt would only
catch honest edge cases (a stale cached bundle after a deploy) while a bot just
omits the field. The honeypot carries the weight; the timing check is a second
net, not a gate. Commented in the file, because it otherwise reads as an
oversight.

**Rate limiting deliberately NOT built.** In-memory counters don't work on
serverless (each instance has its own), and a shared store means an account, a
dependency and two env vars for a problem that doesn't exist yet. *The trigger
for revisiting is simple and self-announcing: spam actually arriving.*

### The content pass — 28 typos, 7 proper nouns, and a full typographic normalise

**Mark fixed the meaning-level items himself** (the unfinished sentence in
ThinkCard11 — *"My job is to "* — the broken ThinkCard08 paragraph, the
ThinkCard10 plural, the WorkCase03 double-*since*). Claude fixed the mechanical
ones.

Spelling and grammar: Microoft→Microsoft, Infogrphics→Infographics,
reaon→reason, rebiult→rebuilt, meaing→meaning, "neutron start"→star,
were't→weren't, "overlay repetitive"→overly, it's→its, then→than, were→was,
missing spaces, a stray "as", singular/plural.
Proper nouns: *une* pipe (Magritte, and it's a pull quote), René Magritte,
Leonardo da Vinci, ChatGPT, Jesse Thorn, SFMOMA, Google Map.

**Typography, all content plus visible component copy:**

- **139 en dashes** normalised across all 22 content files: em dashes (spaced
  and unspaced) and two bare hyphens all became spaced en dashes, then all
  received the NBSP-before convention.
- **Five straight apostrophes** — one in content (`WorkCase02`), four in
  components (`SiteTokens` footer blurbs ×3, `TalkOptions` send confirmation).
- **Two em dashes in JSX text** in `TalkOptions` that the first sweep missed
  because it only searched quoted strings — *found only after claiming the copy
  was clean.*
- Three double spaces. `layout.tsx`'s tab title and an iframe `title` keep
  their em dashes: metadata, cannot wrap, out of scope.

**Deliberately left:** "different than" in ThinkCard04 (*"different than from
above"* is a compressed clause; switching to *from* forces a deader rewrite).
Trailing whitespace in 13 files.

### The pull-quote `+` chunk — a space that could not be authored

*"But wait, there's more"* rendered as *"But wait,there's more"*. Not a
regression — **the system had no way to express that space.** `parsePullBlock`
trims each chunk's text (and JS `.trim()` strips U+00A0 too, so no kind of space
survives authoring), and `SiteTextBlock` lays same-line chunks out as flex
children with no `gap`, where a whitespace-only text node is not rendered as a
flex item at all.

Fixed at `SiteTextBlock:466` — `{ci > 0 && " "}` **inside** the chunk span,
because the pull-quote type styles live on that span and a space placed outside
it would be sized by the inherited font and come out the wrong width. `+` now
means "the next WORD on this line"; a future butted continuation wants an
explicit `tight` flag, not the removal of this default. Commented.

### The 404 page — `app/not-found.tsx`

Copy by Mark, with a link home and a link to `https://http.cat/`. Numeral and
paragraph centred as a block in `calc(100vh - FOOTER.height)`; the numeral
centred over the block, the paragraph ranged left; block width
`bodyMaxWidth(col)` so the rag matches every other page.

`NUMERAL_SCALE = 3` multiplies `OPENING.sizeVw` — derived, so it keeps tiering
and still tracks `OPENING` when that is retuned. Rendered as a **CSS-live `vw`
string**, not a frozen `window.innerWidth` read, unlike both Welcome heroes.

**The background cycles all five page colours there**, because the 404 is not a
place in the building and has no colour of its own. It drives the SAME
`activePage` state navigation uses, so the cross-fade is the existing one.

> **NEW — when a repeated action reads as harsh, check whether it is doing
> something that was only ever meant to happen once.** The first version
> flashed. The lerp was never the problem: the `[activePage]` effect also
> retires every nebula and bokeh particle so they respawn in the new colour —
> right for a navigation, a strobe every four seconds. The cycle now moves the
> colour target and nothing else. The fix made the background *simpler*.

### `isKnownPage()` — one function was answering two questions

`getActivePage()` returns `"welcome"` for any unrecognised path. Correct for the
nav, which must highlight something. Wrong for anything asking *"is this a real
page?"* — and three things were asking that without knowing it:

1. `SiteBackground` would have given the 404 Welcome's cyan.
2. `SiteNavBar` believed it was **on** Welcome, so Welcome was highlighted as
   current and `if (targetPage === st.activePage) return` made the link **dead**.
3. `SiteFooter` drew Welcome's cyan in the rule above the footer.

`isKnownPage(path)` now sits directly beside `getActivePage()` with a comment
explaining why they cannot be collapsed. On an unknown route the nav's active
page is `""` — no id matches, so nothing is highlighted and every link works —
and the footer rule takes `rgba(255,255,255,0.35)`, the same neutral as its
links.

> **A default that exists to satisfy one caller becomes a lie to every other
> caller. Ask what the fallback is FOR before reusing the function that has it.**

*The footer rule was considered for a colour lerp instead. Rejected: the cycle
lives inside `SiteBackground`'s state, so following it means either lifting that
state to a shared owner or running a second timer that must stay in step with
`NOT_FOUND_COLOR_HOLD_MS` — a comment asking two copies to stay in sync, which
v77 already called a countdown.*

### `AGENTS.md` — the dash convention recorded

Because nothing else catches it: no lint, no type error, no visual difference in
the editor. The doc also carries the search warning, and — fittingly — had to be
repaired once, when a `unicode_escape` decode turned the literal text ` `
into an actual NBSP inside the paragraph explaining the hazard.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see
v73/v74/v75/v77/v78/v79.)*

- **NEW — An invisible character is a value no search can confirm.** `– word`
  and `– word` render identically and are different strings. Match on the
  smallest distinctive fragment and **count** the matches rather than trusting a
  replace to have found anything.
- **NEW — Never test for an invisible character using a literal copy of it.**
  Every hop — heredoc, clipboard, tool output — can normalise it. Compare
  against an escape, which no transport can quietly change.
- **NEW — A search that comes back empty is not proof the text isn't there.**
  Claude also asserted "Think has no `drawImage`" on the strength of a two-file
  grep piped through `head`, which filled its ten lines with Work's matches
  before reaching Think. Truncation and non-matching look identical.
- **NEW — When a repeated action reads as harsh, check whether it is doing
  something only meant to happen once.** The 404 colour flash.
- **NEW — A default that satisfies one caller lies to every other caller.**
  `getActivePage()`'s `"welcome"` fallback, three consumers.
- **NEW — A dimension derived from the wrong axis looks right at the size you
  designed it and fails in one direction only.** Band height and band headline
  are both functions of viewport WIDTH, judged against HEIGHT.
- **NEW — Two tiers arriving at the same value from opposite directions — a
  formula and a hardcoded override — look like agreement and are a gap.**
  Tablet's headline is `round(52 × 768/1440) = 28`, which is exactly what the
  mobile override hardcodes.
- **NEW — Two pages doing the same thing at different cardinalities is not
  inconsistency.** Work's browse state is one big image; Think's is thirteen
  arranged into a grid. Check what states MEAN before merging or splitting them.
- **NEW — Keying a list by index across a wholesale content replacement is a
  bug on its own terms.** React reuses the nodes and mutates their text; an
  `opacity` transition promotes each to its own composited layer; Safari leaves
  stale tiles. That is the "overlapping bits of the previous card" artifact.
- **NEW — A bible entry can be stale by being FIXED.** `[praragraph]`.
- **NEW — When you cannot find the mechanism by which your change caused a
  symptom, prove the symptom is older rather than assuming it.**
- Carried forward from v79: a dependency on a proxy is not a dependency; when
  the fix makes a dependency unnecessary, delete it; a UI shipped without its
  backend fails exactly like a feature nobody used; a signal accepted and never
  read; prefer the address space where the collision cannot happen; a prop with
  a default no call site overrides is an untiered number in the costume of an
  API; when two of three tiers coincide with an existing token, say so out loud;
  the same token can require different arithmetic per container; record the
  check that came back clean; a description of intent can delete the proposal.
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

- **NEW — Own the wrong claim in the same message that corrects it.** Claude was
  wrong three times this session in ways that mattered: that `//` comments don't
  work in ThinkCards (they do — `ThinkCasePanel:46` calls `stripComments`, which
  makes `[note]` a workaround rather than a necessity); that no em dashes
  remained in visible copy (two JSX text nodes); that Think has no `drawImage`.
  Each was caught by checking rather than by Mark.
- **NEW — Assert-count, don't replace-and-hope.** Every content edit this
  session ran as an exact-substring replace with a match count, reporting
  anything that matched zero or twice instead of silently doing nothing. That is
  what surfaced the first NBSP.
- **NEW — Restore what you changed but were not asked to change.** The
  double-space pass also collapsed hand-aligned padding before `|` in About.md's
  pull-quote chunks. Functionally irrelevant — the parser trims — but it was
  Mark's formatting, so it went back.
- **NEW — Write the spec when the conversation has already found the model.**
  The band work spans two pages, two panels, a canvas coordinate system and the
  scroll model. `spec_band_model_2026-08-27_v01.md` exists so the next session
  starts from the model rather than rediscovering it.
- Carried forward: write the spec before the code when the change spans a
  system; record the mistake, not just the fix; generate migrated content,
  never retype it; own the flagged risk that was not checked; one decision at
  a time, and let it be overruled; offer deletion before parameterisation;
  simulate a parser against real content before believing it; say which files
  change VISUALLY and how many; bible-drop means catch up fast and offer a
  menu; verify a test rig before trusting a null result; recalibrate in the
  same change that causes the drift; fix stale comments in the same pass as
  the code they describe; point to file/line for simple mechanical fixes;
  propose a mechanism plus a reasoned starting guess and let Mark's live
  judgment set the number; full-file replacement over accumulated patches;
  always read current file contents before editing; diagnose fully before
  touching code; explain the mechanism before proposing the fix, in the message
  that proposes it; change one visible thing per pass; name the thing you did
  NOT do; verify the claim you just made, with the thing itself.

---

## On the horizon

### THE BAND MODEL — the big one, spec written, nothing built

**`spec_band_model_2026-08-27_v01.md` in the project.** Twelve sections. The
short version:

- A **fixed narrow band** on both pages that opens, resizes once, and never
  moves again. Content scrolls beneath it.
- **Deletes** Think's four cooperating position authorities: `bandDocYRef`
  (anchored to whatever `window.scrollY` was at click time), the scroll-floor
  listener, the scroll-derived `clipPath` inset, and the `spacerRef`/`wrapRef`
  height juggling. Also removes the FLIP's *document*-coordinate endpoint in
  favour of a **viewport** one, which is what takes the risk out.
- **Band height and headline size become tiered px** and stop deriving from
  viewport width. Method for measuring the heights honestly is in §4: scroll the
  live page until the crop reads right, read `window.scrollY`.
- **One shared `drawCover(ctx, img, rect, { offsetX, offsetY, scalePct, anchorY })`**
  replaces two copies of identical cover-fit maths, and finally connects
  `offsetFor` — which `ThinkGridCanvas` imports on line 9 and has never called.
- **`anchorY`** is why the narrow band matches what Mark approved: he previewed
  it by scrolling, which crops only the top, so what he liked was a
  bottom-anchored crop. Centring would show the middle instead.
- **Step behaviour:** fade out, fetch in parallel, gate on **both**, scroll to
  top while invisible, fade in. Plus the keying fix, which must land *before* the
  fade or the Safari artifact is merely hidden behind an animation.

**Content audit is the part only Mark can do:** twenty band images that must
survive losing their top. Think's thirteen are doubly constrained — the covers
are composed for the bento grid *and* become the band.

**Suggested order is in §12, and it front-loads the cheap wins:** keying fix,
then step behaviour + fade, then `drawCover`, then the tokens, then the fixed
band. The first two may account for most of the felt problem.

### Welcome — the bottom-heavy page, discussed and not built
`page.tsx:53` is a flat `35vh` spacer that never changes; every later component
is added BELOW it, so bottom-heavy is the arithmetic. **Moving the content beats
moving the viewport:** auto-scroll only *hides* the dead space (it's still there
when you scroll back up), it feeds the three scroll listeners on that page their
own trigger conditions, it fights the user, and it contradicts the
`window.scrollTo(0, 0)` on line 47. Collapsing the spacer removes the space
instead. **Either approach needs a completion signal the hero doesn't have** —
`WelcomeHeroAnimationResponsive` takes only `autoPlay`, unlike its two siblings
which both have `onComplete`. Open choice: two settled positions, or a measured
`(viewportH − revealedH)/2` that recentres continuously and makes "if the screen
size allows" stop being a branch.

### DMARC — now the top infrastructure item
Cloudflare is prompting. The Resend sender is proven, so the reason for deferring
is gone. Start at `p=none` (monitor only).

### Squarespace 404s — DECIDED, closed
~60 old project URLs, one per project. **No redirect map.** Mark: *"we can
consider the old site dead and gone."* Google drops 404s on its own; a bulk 301
to the homepage is read as a soft 404 and passes nothing. The custom 404 page
replaces the stock Next error page for all of them.
**One action left, and it is not about traffic:** check LinkedIn's website
field, the résumé PDF in the Resume panel, and Vimeo/Behance/YouTube
descriptions for deep links to old project pages. A dead link in Mark's own
résumé outranks sixty URLs nobody visits.

### Let's Talk — the location animation
Still Mark's stated next item on that page. `LocationPanel` shows
`/images/talk/map_placeholder.jpg` at 16:9, with a comment saying to swap it for
the zoom animation, same slot.

### Reading measure for IMAGERY — Mark's bookmarked idea
Unchanged from v79. **The question is not "narrower or not" — it is whether
images are one category or several.** The band model spec is effectively the
first serious instance.

### Untuned, deliberately
- **`NOT_FOUND_COLOR_HOLD_MS`** in `SiteBackground` — 4000. Below ~2000 the
  colours never fully arrive. `COLOR_TRANSITION_SECS` (2) is **shared with
  navigation**, so slowing the drift alone would need its own constant.
- **`LOGO_GRID_TIERS.gapPx`** — 14 (was 16 in v79's note; repo now reads 14).
- **`LOGO_GRID_TIERS.logoPct`** — 72.
- **`CONFIG.SENT_HOLD_MS`** in `TalkOptions` — 3000.
- **The Resume panel's `height: "70vh"`** — chosen against the old, wider panel.
- **`SEQUENCE` in `SiteTokens`** — the whole pacing surface, still untuned:
  `firstDelayMs 400`, `stepMs 200`, `minStepMs 70`, `fadeMs 1200`,
  `pressureDeadzonePx 40`, `pressureWindowMs 600`, `backlogPressure 2`.
  **Known hazard: the deadzone is tested per scroll EVENT**, so holds may behave
  differently by INPUT DEVICE rather than reading speed.
- **All band-model numbers** — see spec §10.

### Open design question — the double height animation
After sending, the Let's Talk panel shrinks to fit the confirmation, holds, then
collapses. Two height animations back to back. Unchanged, uncalled.

### `BF0` / `BF100` desktop — Mark's open note
*"Looks great on mobile, too eager on desktop."* Lower desktop `BF0` (95 →
92–90); widen `BF0 − BF100` to slow the ramp. `SiteTokens.tsx` ~657–658. Tune
with `DEBUG.visibility` on.

### The top gradient — the last structural piece of the sequencing spec
`SiteScrollConfig`'s top gradient is still commented out and re-implemented in
`SiteNavBar` as `NAV_GRADIENT_HEIGHT` (180/120/90 **px**), a separate mechanism
in different units. `TF0` and `TF100` remain **dead tokens**.

### Also dead in `VISIBILITY_TIERS`
`getScrollConfig()` and the `_config` store have zero consumers. So do
`revealMs`, `staggerMs` and `idleMs`. `VISIBILITY_TIERS_DESKTOP` is a duplicate
copy inside `SiteScrollConfig`. **And `offsetFor` in `ThinkManifest`** — imported
by `ThinkGridCanvas`, never called, `THINK_OFFSETS` empty. The band spec revives
it rather than deleting it.

### The scroll-fade family — the Welcome page is the remaining job
**Eight separate `const SCROLL_FADE = {…}` objects in eight files.**
`WhoSkillsSphere` doesn't even use its own (`const fadeOutStart = 300`, inline).
Who I Am and Let's Talk are done.

### Type-role consolidation — Mark's stated next cleanup
`BODY` / `CASE_BODY` / `BODY_WELCOME` are three identical roles. **The test is
not "are these values identical" — it is "do these describe the same thing."**

### Content — remaining
- **`[note]` in `ThinkCard01`** holds an author comment. `//` comments DO work
  in Think cards (`ThinkCasePanel:46` calls `stripComments`), so `[note]` works
  only because the whitelist silently drops unknown types — the same mechanism
  that hid `[praragraph]`. Convert when next in that file.
- **`ThinkCasePanel:120` renders `{fm.subtitle}` raw.** `[br]` works in card
  titles (`ThinkGridCanvas:940`) and body blocks (`normBreaks`) and silently
  does not in the frontmatter subtitle. Latent — no Think subtitle uses it any
  more — but production still shows ThinkCard11's literal `[br]` until deploy.
- **`WorkCarousel:746` hardcodes `window.innerWidth < 768`** instead of
  `BREAKPOINTS.tablet`.
- **Trailing whitespace** in 13 content files. Two files end a line with `[br]`
  followed by a space (`WorkCase01:51`, `WorkCase05:12`) — worth confirming the
  parser trims before it looks for `[br]`.

### Work case 01 — 12 videos wired
`SiteGallery` has **no caption or title rendering at all** — not on the tile,
not in the lightbox. Putting the twelve episode titles on screen is a feature.

### Deferred by decision
**Gallery poster precedence.** Chain is `maxresdefault → hqdefault → folder
image`, so a hand-made poster is the FALLBACK and never shows. Left as-is.

**Crop default stays `4by3`.** Decided, not deferred.

**The landscape / short-viewport guard.** Diagnosed in v77, not built.

**`interruptGapBefore` vs `interruptGapAfter`.** Equal at all three tiers.

**NBSP normalisation was rejected in favour of adoption.** The 30 stray NBSPs
were not cleaned up — the convention they hinted at was adopted deliberately
instead, applied to all 139 dashes, and written into `AGENTS.md`.

### The tokens-first migration, continued
- **Still-flat spacing values:** `LINE_GAP_PX`, `ROW_GAP_TOP`/`ROW_GAP_BOTTOM`
  (in `TalkOptions.CONFIG`), `lineGapPx` (Welcome CTA), `marginTop: 24` on the
  Work text block.
- **The `vh` spacers.** Welcome had eight; three are tokens, five remain
  (`35vh`, `8vh`, `4vh`, `3vh`, `20vh`). Who I Am two, Let's Talk one.
- **Hardcoded font sizes on no token:** `TalkOptions` (16/15/17),
  `SiteNavBar` (9), `WhoSkillsSphere` (11), `ThinkGridCanvas` (11), the
  figcaption/counter 13s in both case panels, `clamp()` leftovers in
  `ThinkBelowPlaceholder` and `SiteTextBlock`.
- **Delete the legacy `TYPE`/`COLUMN` static exports.** Ten files still import
  `TYPE`.
- **`const N = 7` in `WorkCarousel.tsx`** duplicates `WORK_MANIFEST.length`.

### Duplication that has already drifted
- **RESOLVED this session:** four straight apostrophes in component copy; every
  em dash in content and visible copy; the unauthorable pull-quote chunk space.
- **RESOLVED in v79:** `TalkOptions`' `gap`/`logoSizePercent` props; three of
  Welcome's `vh` spacers; the `2.2em` slot margins; `maxWidth: 500`.
- **`TAGLINES` in both hero files — DELIBERATE, now recorded.** Four of seven
  lines differ; the `WelcomeHero2Line` set is shortened to fit the two-line
  carousel. *There is no mechanism keeping them in sync, so a future edit to one
  is a silent divergence of a different kind. Check both when editing either.*
- Colour helpers (`rgbToHsl`/`hslToRgb`) duplicated across the two hero files.
- `BODY_WELCOME`/`BODY`/`CASE_BODY` are three identical token roles.
- **The two case panels** (`WorkCaseStudyPanel`, `ThinkCasePanel`) are the same
  component twice: `parsed`, `blockOps`, `FADE_DUR`, the same opacity
  transition, the same fetch shape, the same `key={i}`. Second consumer. The
  band spec asks whether to extract before editing both.

### The Welcome hero sizing race — still unresolved
Both heroes compute the headline font size from a one-time `window.innerWidth`
read frozen into pixels. *`not-found.tsx` now demonstrates the CSS-live
alternative in three lines.*

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

**Code health.** `npx eslint app` reports ~60 errors, all pre-existing. Next 16
does not run ESLint during `next build` — *which is why `offsetFor` sat imported
and unused without anything noticing.* `npm audit` reports 7 vulnerabilities
across 376 packages, mostly pre-existing; **do not run `npm audit fix --force`.**

**Carried over, untouched:** hamburger menu polish; navbar gradient 3-stop
proposal; backdrop-filter blur behind navbar; uncapped
`COLUMN_TIERS.desktop.vw`; fluid clamp-based body-copy scaling (paused);
full five-page three-breakpoint visual pass; Who I Am's perceived right-bias on
tablet; the stale "copied from desktop as placeholder" comment on `TYPE_TIERS`'
mobile tier; coding-literacy side project.

**Infrastructure.** Contact form: **DONE, now with spam protection.** Remaining:
delete the unused `ftp` A record (`98.129.229.120`, still pointing at
Rackspace). **DMARC.** Squarespace redirects: **closed, decided against.**

---

## Tools & resources

- **Stack:** Next.js 16.2.9 / TypeScript / Turbopack, Vercel (Hobby,
  auto-deploy), GitHub + GitHub Desktop, VS Code. `resend` ^6.24.0.
- **Domain & DNS:** `shtooky.com` — registered at GoDaddy, DNS at Cloudflare
  (Free), all records DNS-only, pointing at Vercel. MX/SPF route
  `mark@shtooky.com` through Laughing Squid/Rackspace. **`send.shtooky.com` is
  the Resend sending domain** — three records, all on names of their own.
  11 DNS records total. Squarespace fully retired.
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then phone
  (same Wi-Fi) → `http://10.0.0.154:3000`.
- **Live DevTools breakpoint workflow:** custom device presets at exact px
  (iPhone 390×844, iPad Mini 768×1024, Desktop 1440×900), device toolbar
  undocked, side-by-side with a real non-emulated window. *Mark also uses
  scrolling itself as a live prototype — see the band spec §4.*
- **`DEBUG` flags in `SiteTokens`:** `visibility` draws labelled
  `TF0`/`TF100`/`BF100`/`BF0` zone lines; `sequence` traces every queue
  decision. Both `false`.
- **Claude-side environment:**
  - **Screen recording is GRANTED.** Safari can only be granted at **read**
    tier — visible in screenshots, no clicking or typing.
  - `device_bash` runs in a sandboxed **Linux** VM with the repo mounted — NOT
    macOS. It cannot reach `localhost:3000`, cannot run `next build`, and
    **cannot delete files**. **It has no browser.**
  - **Do not run `git` commands from `device_bash`.** They create
    `.git/index.lock`, which git then cannot remove.
  - **`npx tsc --noEmit` DOES work there** and was run after every edit.
  - **`node` and `npm` both work.**
  - The cloud container (the `Bash` tool) is a separate machine with restricted
    network — GitHub and Google Fonts are blocked.
  - **NEW — heredocs normalise invisible characters.** Never pass a literal
    U+00A0 (or similar) through one; use `chr(0xA0)` / ` ` escapes.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS, COLUMN_TIERS,
  TYPE_TIERS, SPACE, SEQUENCE, TIMING, NAV, FOOTER, VISIBILITY_TIERS,
  LOGO_GRID_TIERS, BAND_HEADLINE, BAND_VIGNETTE, DEBUG, hooks,
  **`getActivePage` + `isKnownPage`**); `SiteRevealQueue.tsx`;
  `SiteCaseMarkdown.tsx`; `SiteTextBlock.tsx`; `app/api/contact/route.ts`;
  **`app/not-found.tsx`**; `TalkOptions.tsx`; `WelcomeClientLogoGrid.tsx`;
  `WorkManifest.ts`; **`ThinkManifest.ts`**; `SiteGallery.tsx`;
  `SiteScrollConfig.tsx`; `WorkCarousel.tsx` is the recurring pattern reference.
- **The band pair.** `WorkCarousel.tsx` and `ThinkGridCanvas.tsx` share
  `BAND_HEADLINE`, `BAND_VIGNETTE` and `SPACE.layout.bandDetailGap` — and
  nothing about their behaviour. See the band spec.
- **Content:** `WorkCase0#.md` (7), `ThinkCard##.md` (13), `About.md`,
  `Talk.md`. Work blocks: `[jobbox]`, `[subtitle]`, `[label]`, `[paragraph]`,
  `[pullquote]`, `[gallery]`, `[video-carousel]`. Think: the same minus
  `[jobbox]`/`[subtitle]`, plus `[img]`. About/Talk: `[paragraph]`,
  `[subtitle]`, `[pull]`, `[slot]`. `[gallery]` line 2 is
  `Nup, crop(4by3|16by9|1by1|2by3), noClick`. **`//` comments work in all of
  them** — `stripComments` runs in all three panels.
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention, the standing
  instruction to read `node_modules/next/dist/docs/` before writing Next code,
  and **the body-copy dash convention (NEW)**.
- **Project bible:** v80 (this file). Superseded bibles live in
  `can_probs_delete/old-bibles/` rather than being deleted, since `device_bash`
  cannot remove files.
