# shtooky.com — Project Bible v75

*Supersedes v74. Updated 2026-08-24 after a long working session that moved
from "catch me up" through a dozen concrete fixes across Who I Am, Let's
Talk, Welcome and Work, built the first real spacing layer in the tokens
file, and ended by finding a genuinely obscure Safari/Lottie bug. Mark also
reset the session-start ritual (see Purpose & context) and granted
screen-recording access, which changes what Claude can verify.*

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

**Session-start ritual (REVISED this session — standing instruction):**
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

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am
(`/who-i-am`), How I Think (`/how-i-think`), and Let's Talk (`/lets-talk`).

**Site vision — "single room" (standing instruction):** The site is one
continuous atmospheric space. Content hangs like banners from the ceiling.
Each page region has its own ambient lighting (five page colors).
Navigation is a camera moving through that space.

**Leftmost-element principle (standing instruction):** NavBar and Footer
are deliberately the leftmost elements on any page, at any breakpoint —
all other content indents from that shared edge, via `FRAME_INSET_VW`.
*Knowingly bent once this session:* the Who I Am skills-sphere canvas is
now full-bleed on mobile/tablet, the same treatment `SiteBackground` gets,
because the atmospheric layer isn't "content." Commented at the change.

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`.
When superseding, write the new file under its own correctly-dated name
and remove the old one rather than reusing the path.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## THE THROUGH-LINE — tokens-first (read this first)

v74 closed on Mark's still-open architectural concern: too many places
deciding sizing and position, making consistency across pages hard. **This
session that stopped being a question and became the working direction.**
His words: *"lets use hardcoded sizes in the tokens file. i think we try
to move as much back in there as we can"* and later *"that is the next
thing that needs taming."*

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

### The second half that tokens alone don't solve

Three different mechanisms resolve values on three different schedules,
and every layout bug of the last two sessions has been a mismatch between
them, not a wrong number:

- **CSS-live** — a `vw`/`vh`/`clamp()` string. Re-resolved every paint.
  Never stale; JS can't read it.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`. Updates on
  resize and on hot-reload edits.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an
  effect, written to `el.style.*`. Correct at the instant it ran, stale
  forever after unless something re-runs it.

**Rule: one mechanism per visual unit.** If a headline and its tagline read
as one thing, both must be CSS-live or both JS-computed. The Welcome hero
was split down the middle, which is exactly why its failure was
unfollowable. (Partly fixed this session — the tagline moved from live
`vw` to the same token read as everything else.)

**Enforceable version: stop importing `getType`/`TYPE`.** The static
exports are desktop-only *and* frozen — two failure modes in one import.

---

## Current state — what shipped this session

### Build was broken on Vercel (FIXED)
A dead file in a `deprecated/` folder had a wrong relative import. `npm run
dev` is lazy and never compiles unimported files; `next build` type-checks
everything. Invisible locally, fatal on deploy. Solved by excluding the
junk drawer in `tsconfig.json` — now `"exclude": ["node_modules",
"can_probs_delete"]`. **Note the folder had to be renamed to match** (no
spaces). Also: *"Command npm run build exited with 1"* is only the summary
line; the real error is further up the Vercel log.

### SPACE — the first real spacing layer in SiteTokens (NEW, the big one)
`SiteTokens.tsx` had roles for type, column, visibility and timing but
**nothing for space between things** — which is precisely why every
tunable gap escaped into a component. That was a missing shelf, not
carelessness. Now:

```
SPACE.layout.*   explicit px per breakpoint, all three tiers on one line
SPACE.text.*     em RATIOS, one number, tier-independent
useSpace()  → (v) => v[bp]      for components
getSpace(v) → v[getBreakpoint()] for imperative/canvas code
```

Grouped **subject-first** (`whoNavClearance`, `talkLabelGap`) rather than
tier-first like `TYPE_TIERS`, deliberately: for spacing you compare tiers
constantly, so all three belong on one line. Mark chose this explicitly
("I like the easier tuning"). The file now has two organising principles;
that's an accepted trade.

Nine values migrated, all pure relocation with no visual change:
`whoNavClearance`, `whoSphereBoxHeight`, `thinkNavClearance`,
`thinkBlurbGap`, `talkNavClearance`, `talkBlurbGap`, `talkLabelGap`,
`welcomeCtaGap`, `welcomeHeroTaglineGap`.

The three nav clearances are genuinely different numbers (177 / 80 / 75 on
desktop) — three page openings with different optical weight, not drift.

**`SPACE.text` is em, and that's the point.** Paragraph spacing lived in
the *content* files (`app/data/AboutContent.ts`, `TalkContent.ts`) with
three different units between them — em, raw px, and vh. Unified on the em
form and moved to tokens. An em is a ratio to the paragraph's own font
size, and font size is already tiered, so **one number stays correct at
every breakpoint and stays correct if BODY is ever resized.** Turning
these into three pixel values would create three numbers that silently
drift. Mark's call: paragraph gaps consistent across pages, tied to type
size. **Visible consequence: Who I Am's desktop paragraph gap went from
24px to ~53px.**

The old flat 8px `SPACE` scale was renamed `SPACE_SCALE` (one consumer
left, in `WelcomeEverythingIsInteresting`).

### Who I Am (DONE, Mark-tuned)
Five flat `vh` values, none breakpoint-aware. The sphere read as "too
small AND too low" on mobile/tablet — **one cause, not two**: the sphere's
size is a function of its container's **WIDTH only**
(`baseR = radius × W/800`; height is used solely to centre it), while the
box height was `vh`. On a narrow, tall viewport those go in opposite
directions — the box grows taller while the sphere shrinks, and it sinks
as it centres. Same coupling made the sphere appear to drift vertically on
desktop window resize.

Fixed with `SPHERE_RADIUS_*` (a trio in `WhoSkillsSphere.tsx`) plus the
box height in `SPACE.layout.whoSphereBoxHeight`.

`WhoSkillsSphere.tsx` also gained the **sparse-override pattern already
used by `TalkRippleNetwork.tsx`**: `CFG_BASE` (desktop) plus
`CFG_TABLET_OVERRIDES` / `CFG_MOBILE_OVERRIDES` listing only what differs.
All ~45 sphere values are now tierable without further wiring; Mark has
already used it for `orbitSpeedMin`, `breatheAmt`, `breatheSpeed`,
`scaleX/scaleY`, `textSizeW`. The merged config **shadows the module-level
name `CFG`**, so all ~70 existing `CFG.x` reads pick it up untouched — and
the canvas effect got `[CFG]` in its dependency array, where it had `[]`.

**Text was being hard-clipped mid-glyph** — the canvas element's own box,
not the viewport. Labels are painted onto the canvas, so anything outside
its rectangle is severed. Mobile/tablet went full-bleed; radius and text
size were recalibrated by the same ratio so nothing else moved.

`SPACE.layout.welcomeHeroTaglineGap` and an `offsetX` knob (a single
`ctx.translate()` inside the frame's save/restore, so sphere, labels, fog
and bokeh all move together) round it out.

**Still open on that page:** perceived right-bias on tablet. Measured as
centred to ~5px; the visual weight is the **bokeh**, which spawns at
random angles on every mount. Reload a few times — if the heaviness
moves, `offsetX` is the wrong lever and `particleCount` is the right one.

### Let's Talk — ripple network arriving dim (FIXED)
`handleScrollFade` reads `getBoundingClientRect().top` and gives full
opacity only at ≥ `fadeOutStart`. That was a flat **100**, but at rest the
block's top *is* the page's `paddingTop` — the nav clearance: 75 / 20 / 45.
All three below 100, so the network arrived at **92% / 82% / 73% opacity
before any scrolling**, worst on tablet where clearance is smallest. Now
`SCROLL_FADE_TIERS`, each `fadeOutStart` matching its tier's clearance.

**Coupling to watch:** those three numbers must track
`SPACE.layout.talkNavClearance`. Two files that have to agree by hand — a
derived `fadeOutStart = navClearance` would remove the trap.

### Welcome (DONE)
**`WelcomeEverythingIsInteresting.tsx` was importing the legacy
desktop-only `TYPE` export and never calling `getType()`/`useType()`** —
12 reads across three components in the file. On a phone it rendered
"interesting" at desktop's 5.5vw ≈ 21px instead of the mobile tier's value,
and "I believe ANY story can be" at 2.6vw ≈ 10px instead of 4.5vw. That
was the real cause of the "insanely small" symptom v74 attributed to the
hero sizing race. Fixed; three effects got `type` added to their dependency
arrays. Mobile `DISPLAY_HERO.sizeVw` was dropped 30 → 14, because that
tier had **never actually rendered** and 30 was untested.

**Hero taglines** now read `getType().TAGLINE.sizePx` in both hero files.
They previously used a flat `TAGLINE_SIZE_VW: 1.944`, calibrated at
desktop (1.944% of 1440 = 28px) — the same percentage gave **14.9px at
tablet and 7.6px at mobile**. Briefly became a local `TAGLINE_SIZE_PX`
trio; moved into the token per Mark's direction above.

**Taglines now wrap.** They were `white-space: nowrap` and the container
height math explicitly assumed exactly one line. At readable sizes *every*
tagline needs two lines on mobile, so shortening the list was never going
to be enough. Now `white-space: pre-line` (honours `\n` for manual breaks
AND still wraps), and `contentH` **measures** `taglineEl.offsetHeight`
instead of assuming. Getting that wrong doesn't clip — every child is
`position: absolute` — it spills into the next section, which is the
overlap bug this calculation exists to prevent.

### Work page — headline and subhead (DONE, Mark-tuned)
The below-carousel pullquote is a chiasmus; the line break is the
rhetorical device, so it's hardcoded rather than wrapped. `fitPullquote()`
measured each nowrap line and scaled the whole thing down to fit.

**The trap: that made the longest line's character count decide the type
size, not the token.** Mark had raised mobile `OPENING.sizeVw` to 10 to
make it big; the fitter scaled it straight back to ~22px. Pushing the
token higher changed nothing.

Now: **one sentence, same words everywhere, breaks tiered.** Copy changed
to a comma — *"The work reveals the process, the process reveals the
person."* Desktop breaks in two and keeps the fitter (measured live at
~0.95, accepted). Tablet and mobile break in three and **do not run the
fitter**, so `OPENING.sizeVw` is the real control there. Mark tuned to
tablet **8**, mobile **9.4**.

`PULLQUOTE_LINES` and `SUBHEAD_LINES` are `Record<breakpoint, …>` at the
top of `WorkCarousel.tsx`. The subhead moved off a hardcoded `fontSize: 20`
onto the `TAGLINE` role (28/26/20) — at 20px flat it had been converging
with a shrinking mobile headline until the hierarchy collapsed.

### The Safari Lottie bug (SOLVED — see Key learnings)
`design mask` ended at frame 52 while the `design` layer it mattes runs to
180. `thinking-open.json` now carries the fix and the scratch variants are
in `can_probs_delete/lottie-safari-tests/`. **Still needs fixing in the AE
source**, or the next export reintroduces it.

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see v73/v74.)*

- **NEW — A track-matte layer that ends before the layer it mattes is a
  latent cross-browser bug, and nothing warns you.** `design mask` ran
  frames 46–52; `design` (inverted alpha matte, `tt: 2`) runs 46–180. For
  128 frames the matte pointed at a layer that no longer existed. Chrome
  reads the absent matte as empty → inverted → fully opaque → word visible.
  Safari held the last matte state and left a blurred smear across "des".
  **After Effects gives no signal**, because it simply stops evaluating a
  layer past its out-point. `about mask` — same live text, same inverted
  matte, same Gaussian-blurred mask layer — runs to the end of the comp,
  and "about" never broke. That was the only structural difference.
  Fix: extend the matte layer to the comp's end and keyframe it clear of
  the artwork, rather than letting it cease to exist.
- **NEW — When a browser bug resists explanation, read the file's
  STRUCTURE before theorising about the browser's engine.** Three rounds
  of plausible hypotheses (blend mode, Fill effect, blurred matte) each
  cost a test cycle and were all wrong. What cracked it was tabulating
  every matte layer's lifespan against its consumer's — a five-line script.
  Features were the wrong lens; relationships were the right one.
- **NEW — A shrink-to-fit fitter silently takes over the value it's
  guarding.** `fitPullquote` scaled the Work headline to fit, which meant
  the longest line's character count determined the type size and
  `OPENING.sizeVw` became decorative. This is the same "I changed the
  number and nothing happened" class as v74's reactivity bug, wearing a
  different costume. A fitter should be a guard that warns when it fires,
  not the thing deciding your type.
- **NEW — `em` is breakpoint-awareness for free, and forcing it into
  tiered pixels makes things worse.** A ratio to a value that is already
  tiered stays correct everywhere with one number. Not every spacing value
  wants three numbers; the unit is part of the design decision.
- **NEW — Where someone instinctively looks for a value is evidence about
  where it belongs.** Mark went to `SiteTokens.tsx` to change the tagline
  size. It wasn't there, because "hardcode" had been read as "local
  constant." The reflex was the correct answer.
- **NEW — A canvas element hard-clips at its own box, mid-glyph.** Text
  painted onto a canvas is severed at the rectangle's edge, not the
  viewport's. If labels should reach the screen edge, the canvas has to
  be full-bleed; shrinking the art is solving the wrong problem.
- **NEW — Widening a container silently resizes anything sized from
  container width.** Going full-bleed raised `W`, which raised
  `SCALE = W/REFERENCE_W`, which grew the sphere and its labels for free.
  Recalibrate by the same ratio in the same commit, or you can't tell
  which change caused what.
- **NEW — A flat threshold compared against a resting position is a
  breakpoint bug waiting to happen.** The ripple network's `fadeOutStart:
  100` was above its resting `top` at every tier, so it arrived
  pre-faded, and the error grew as the viewport shrank.
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

- **NEW — Bible-drop means catch up fast and offer a menu, not audit the
  repo.** See Purpose & context. Targeted verification of specific numbers
  is fine and encouraged; a silent sweep is not.
- **NEW — Verify a test rig before trusting a null result.** Three JSON
  variants "changed nothing," which looked like three dead hypotheses and
  was actually a signal worth checking directly. Give every test a
  guaranteed-visible control.
- **NEW — Say when a diagnostic is contaminated.** Switching the Lottie
  renderer to canvas was offered as a clean discriminator; canvas has its
  own incomplete track-matte support, so the result was meaningless.
  Owning that immediately was cheaper than letting it mislead.
- **NEW — Recalibrate in the same change that causes the drift**, and say
  by how much, so "nothing else moved" is a checkable claim.
- **NEW — Fix stale comments in the same pass as the code they describe.**
  Nine comments pointing at constants that had moved were cleaned when the
  SPACE migration landed. A comment naming a constant that no longer
  exists sends you to the wrong file weeks later.
- Carried forward: point to file/line for simple mechanical fixes; flag
  discrepancies rather than picking silently; propose a mechanism plus a
  reasoned starting guess and let Mark's live judgment set the number;
  full-file replacement over accumulated patches; always read current file
  contents before editing; screenshot-driven live tuning as the default
  mode for breakpoint-visual work; diagnose fully before touching code;
  explain a diagnosis honestly as a working theory when it can't be
  directly verified.

---

## On the horizon — the site-wide problems

**The tokens-first migration, continued.** The shelf exists; most of the
site hasn't moved onto it yet.

- **Still-flat spacing values:** `LINE_GAP_PX` (mobile hero, 1.5),
  `ROW_GAP_TOP`/`ROW_GAP_BOTTOM` (Let's Talk accordion, 16/40),
  `lineGapPx` (Welcome CTA, 30), `marginTop: 24` and `margin: '0 0 10px 0'`
  on the Work text block.
- **The `vh` spacers.** Welcome has eight (`35/8/4/3/5/6/6/20`), Who I Am
  three (`2vh` spacer, `4vh` Venn margins, `15vh` bottom), Let's Talk one
  (`18vh` bottom). **Deliberately deferred on Welcome** — Mark has a
  revised vision for how that page sequences, and naming eight things
  about to change is wasted work.
- **Hardcoded font sizes on no token:** `TalkOptions` (16/15/15),
  `ThinkCasePanel` (13/20), `WorkCaseStudyPanel` (13/20), `SiteNavBar` (9),
  `WhoSkillsSphere` (11), `ThinkGridCanvas` (11), plus `clamp()` leftovers
  in `ThinkBelowPlaceholder` and `SiteTextBlock`.
- **Delete the legacy `TYPE`/`COLUMN` static exports.** Ten files still
  import `TYPE`; most also call `useType()` and use the static one only
  for `display`/`weight`, which is survivable. Deleting them makes the
  desktop-only-by-accident bug structurally impossible. The compiler finds
  every site.

**The scroll-fade family — never swept.** The Let's Talk fix was one
instance of a shape that recurs: a resting position compared against a
flat threshold. `WhoSkillsSphere`, `WelcomeClientLogoGrid`,
`WhoVennDiagram`, `WelcomeEverythingIsInteresting` and both Welcome heroes
all have their own independent scroll-fade. Any of them could be dimming
on arrival, with the error growing as the viewport shrinks. Offered as a
read-only sweep; not yet run.

**Duplication that has already drifted.**
- `TAGLINES` exists in **both** hero files and the two copies **already
  differ** — "problems in the end" on mobile vs "problems at the end" on
  desktop/tablet. Nobody would catch that on one screen. Extract to a
  shared module before hand-placing line breaks in two places.
- Colour helpers (`rgbToHsl`/`hslToRgb`/etc.) duplicated across the two
  hero files — flagged in the file's own header comment, still deferred.
- `BODY_WELCOME`/`BODY`/`CASE_BODY` are three identical token roles.

**The Welcome hero sizing race — still unresolved.** Both heroes compute
the headline font size from a one-time `window.innerWidth` read frozen
into pixels. The proposed fix (re-run the full layout from the existing
`ResizeObserver`, which reports only settled boxes) is reasoned and
explained but not implemented. Half the original two-mechanism problem is
gone now that the tagline reads a token, so this is cleaner than it was.

**Known-wrong maths, flagged and not fixed.**
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

**The AE source of the Lottie fix.** `thinking-open.json` is fixed in the
repo; the After Effects project is not. Two other layers have the same
lifespan mismatch — `How mask` (134–150) against `How` (134–180), and
`think 5`/`think 6` mattes ending at 16. Not visibly broken, same shape.

**Code health.** `npx eslint app` reports ~60 errors, all pre-existing and
none in code touched this session — unescaped apostrophes, `setState` in
effects, refs read during render. Next 16 does **not** run ESLint during
`next build`, which is why they've never blocked a deploy. Worth a
dedicated pass.

**Carried over, untouched:** hamburger menu visual polish; navbar gradient
3-stop proposal (status ambiguous); backdrop-filter blur behind navbar;
`NAV_GRADIENT_HEIGHT` confirm; uncapped `COLUMN_TIERS.desktop.vw`; fluid
clamp-based body-copy scaling (paused, not declined); full five-page
three-breakpoint visual pass; Who I Am's orphaned pull-quote `clamp()`;
the stale "copied from desktop as placeholder" comment on `TYPE_TIERS`'
mobile tier, now inaccurate for several already-distinct roles;
coding-literacy side project.

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
- **Claude-side environment (UPDATED this session):**
  - **Screen recording is now GRANTED.** Claude can take screenshots of
    Mark's Mac. Safari can only be granted at **read** tier — visible in
    screenshots, but no clicking or typing. Navigation has to be Mark's;
    Claude watches. This is how the Lottie bug was finally seen.
  - `device_bash` runs in a sandboxed **Linux** VM with the repo mounted —
    NOT macOS. It cannot reach `localhost:3000`, cannot run `next build`
    (tries to download Linux SWC binaries with no network), and **cannot
    delete files** (`mv` to a junk folder instead).
  - **`npx tsc --noEmit` DOES work there** and is pure JavaScript — this
    is the fast way to verify edits. Used constantly this session.
  - The cloud container (the `Bash` tool) is a separate machine again,
    with restricted network — GitHub and Google Fonts are both blocked, so
    font metrics can't be measured offline.
- **A console snippet that earns its keep** — measuring what a fitter is
  actually doing, pasted into DevTools on `/work`: reset the element to
  the token size, read `scrollWidth` of each line, and report
  `scaleApplied` and `sizeToFillColumn`. Beats character-width estimates,
  which have been consistently ~10% off all session.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS,
  COLUMN_TIERS, TYPE_TIERS, **SPACE**, SPACE_SCALE, TIMING, NAV,
  VISIBILITY_TIERS, LOGO_GRID_TIERS, hooks); `WorkCarousel.tsx` is the
  recurring pattern reference; `TalkRippleNetwork.tsx` and
  `WhoSkillsSphere.tsx` share the sparse per-breakpoint override pattern.
- **Content:** per-case-study markdown with `[paragraph]`, `[pullquote]`,
  `[img]`, `[gallery]`, `[video-carousel]`, `[note]` block types;
  `ThinkCard##.md` (13 files); `app/data/AboutContent.ts` and
  `TalkContent.ts` hold page copy plus per-page `SPACING` (now reading
  `SPACE.text`) and `entryDelay`/`paragraphStagger` — the latter two are
  timing and arguably belong with `TIMING`.
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention.
- **Project bible:** v75 (this file), stored at `/Users/marko/shtooky`;
  local repo at `/Users/marko/shtooky`.
