# Project Bible — v90 (2026-09-14, night session)

*Supersedes v89 (2026-09-14, earlier the same day). v89 is not deleted — it
stays in the doc list as the historical record of the mobile Safari flicker
chase, the seam fix, the nav-close fix, and the first skills-sphere pass. This
version picks up immediately after and covers a second session the same
night: finishing the skills-sphere fix, then pulling the site-wide vh/vw
audit thread all the way through a decision pass and one implemented fix.*

## Purpose & context

Standing instructions, unchanged from prior versions:
- Diagnose before fixing. Don't guess-and-check on a live visual bug.
- One change at a time. Confirm each one before layering the next.
- Test on both desktop Chrome and real iPhone Safari before calling anything done.
- A broken intermediate state is never acceptable — revert fully before trying the next approach.
- Verify every edit with `npx tsc --noEmit` (must stay clean) and `npx eslint <file>` (must match the known pre-existing baseline).

## Current state — what shipped this session

**1. Who I Am — skills sphere text/orbit "still scaling" (root-caused and fixed).**
v89 had fixed the sphere's orbit RADIUS to stop overflowing its box
vertically. Mark's follow-up: "the sphere itself is now the right size. but
the text is still scaling." Verified first, before touching anything, that
the v89 fix was holding — instrumented `CanvasRenderingContext2D.fillText`
to log every character's actual rendered position/size against the box
bounds, across desktop and mobile, including while hovering to trigger the
hover-scale boost. Zero overflow in ~1.2M captured draws. So the complaint
wasn't overflow — Mark clarified: "they definitely are scaling with the
width of the viewport. if i narrow it they get smaller. i think i basically
want it to just sit at the one size for each breakpoint."

Root cause: `SCALE = W / REFERENCE_W` was re-derived from the container's
**live** `clientWidth` on every resize. The sphere's box is only fixed in
HEIGHT (`SPACE.layout.whoSphereBoxHeight`); its WIDTH is a percentage of the
page's fluid stage (76%/100% of `contentWidth()`), which itself tracks the
viewport continuously up to the 1440 stage cap. So narrowing the browser
window shrank the container, which shrank the sphere's radius and every
label's font size — even without crossing a breakpoint boundary.

Fixed by pinning `SCALE` to one of three constants (`SCALE_TIERS`) instead of
deriving it live — each measured from this component's own box width at its
breakpoint's REFERENCE viewport (1440/768/390, the same points
`COLUMN_TIERS` uses): desktop 1083px box → 1.354, tablet 753px box → 0.941,
mobile 390px box → 0.487. Verified live: at 1440px the biggest label
rendered at 43.3px; narrowed the window to 1300px (container dropped to
977px wide) and it held at 43.1px — same range, no shrink.

**2. Site-wide viewport-sizing audit — resumed, categorized, one item fixed.**
Mark asked to "review the viewport sizing across the site" — a direct
continuation of v89's deferred audit, now sharpened by the sphere bug's real
mechanism (fluid-with-width, not just raw `vh`). Full pass documented as its
own doc, `claude/spec_viewport_sizing_audit_2026-09-14_v01.md` (replaces
v89's inline audit list as the live reference). Three-way split:

- **Cat 1 — plain leftover `vh` spacers.** `page.tsx`'s remaining `8vh`/
  `4vh`/`3vh`/`20vh`. Decision: leave for now, tuned well enough as-is.
- **Cat 2 — viewport-relative and intentional, not bugs.** `SiteBackground`'s
  full-bleed `100vw/100vh`, `SiteGallery`'s `90vh` lightbox cap,
  `not-found`'s centering, `TalkOptions`' `70vh` resume panel — all
  confirmed deliberate. Also reclassified into this bucket this session:
  **`WorkCarousel`'s width/fade behavior** and **`ThinkGridCanvas`'s
  expanded-card-image width** — both are supposed to be full viewport width
  below 1440 and fade out at the edges above it. Not bugs.
- **Cat 3 — fluid-with-width bugs, fix to one fixed px value per
  breakpoint.** `WorkCarousel` title text, `ThinkGridCanvas` band headline
  (both still open), and the `ThinkOpenAnimation` burst/particle system
  (fixed this session — see below). `WelcomeEverythingIsInteresting`'s
  hero/display font sizing is backlog, not this pass: "I do eventually want
  to set fixed values for the interesting text," but not now.

**3. `ThinkOpenAnimation` burst/particle sizing (root-caused and fixed).**
The flash pop and particle burst under the "How I Think" headline animation
were sized via `pxToVw = type.OPENING.sizeVw / 120`, applied as literal
`vw` units on every burst element — explicitly flagged in-file as "STILL
UNCAPPED," meaning it kept scaling continuously with the live window width
at *every* width, not even frozen above 1440 the way the Lottie artwork
itself is (via `openingPx()`). Mark: "let's fix those at their current
sizes under each breakpoint."

Fixed with the same pattern as the sphere: `pxToPxBurst`, a fixed
px-per-native-unit multiplier computed once per breakpoint from
`(type.OPENING.sizeVw / 120) * (BURST_REFERENCE_W[bp] / 100)`, using the
same 1440/768/390 reference points. All burst elements (flash outer/inner,
particle scatter radius, speed, size, glow) switched from `vw` units to
plain `px`. Verified live: flash renders at exactly 792px outer / 198px
inner at both 1440px and 1300px window width — no shrink narrowing within
the desktop breakpoint (previously would have dropped to ~715px/179px at
1300px).

`ThinkGridCanvas.tsx` has one pre-existing eslint error unrelated to this
change: `performance.now` flagged as an impure call inside `spawnParticles`
— confirmed present in the original code at the same call site before any
edit, not introduced this session.

**4. Everything committed and pushed.** A large uncommitted changeset had
built up (per v89's own note: "commit in separate chunks, not one" —
advice not followed). Mark: "i'm sending it all. we've done a lot today."
Went to push it and hit a stale `.git/index.lock` — turned out the
connected folder didn't have delete permission granted yet for this
session, so git couldn't clean up its own lock file after an earlier
(failed) `git stash`. Requested and got delete permission via
`device_request_delete_permission`, removed the lock, and found GitHub
Desktop (open on Mark's machine this whole time) had already committed and
pushed everything itself as `b835c12 "Massive push of changes"` — confirmed
via `git fetch` that local HEAD and `origin/main` already matched exactly.
Nothing left for me to do; noted for next time that GitHub Desktop being
open concurrently is the likely source of `.git` lock contention with any
git commands run from this side.

## Key learnings & principles

- **"The box is the right size but the content still feels off" is a
  different bug than the one you just fixed, not a sign the fix didn't
  work.** Verify the previous fix actually held (instrumented measurement,
  not eyeballing) before assuming the new complaint invalidates it — it
  didn't; it was a second, unrelated mechanism (live-width-driven SCALE)
  underneath the first (unclamped orbit radius).
- **A component can look identical at its own reference viewport width and
  still be fluid everywhere else.** The `contentWidth()`/`stagePx()` stage
  system is a deliberate, site-wide "fluid below 1440, frozen above" design
  — correct for body layout, carousel width, and expanded card images, but
  wrong for anything that's supposed to read as one fixed size per
  breakpoint (the sphere, the burst, and eventually carousel/grid titles
  and the "interesting" hero text). Same mechanism, opposite verdict
  depending on what the element actually is — categorize before fixing.
- **Freeze fluid sizing by evaluating the SAME formula at a fixed reference
  point, not by inventing a new one.** Both fixes this session (`SCALE_TIERS`
  for the sphere, `pxToPxBurst` for the burst) kept the existing formula and
  simply pinned its live input (`W`, `window.innerWidth`) to each
  breakpoint's reference viewport width — so the frozen value matches
  today's live value exactly at that reference point, and current
  appearance never changes, only the resize behavior does.
- **A stale git lock isn't necessarily a stuck process — it can be a
  permissions boundary.** The connected-folder delete guard blocks `rm`
  *and* blocks git's own internal cleanup of files it created in the same
  process (like `index.lock`), producing a confusing "operation not
  permitted" on a file the same user/process just wrote.
- **Another tool touching the same repo concurrently (GitHub Desktop here)
  can both cause lock contention and finish the job before you do.** Worth
  checking `git fetch` + comparing HEAD to `origin/main` before assuming a
  push is still needed.

## On the horizon

- **Cat 3 remaining, in order Mark hasn't picked yet:** `WorkCarousel` title
  text and `ThinkGridCanvas` band headline — both need fixed px-per-breakpoint
  values, same pattern as the burst fix (see
  `spec_viewport_sizing_audit_2026-09-14_v01.md`).
- **Backlog, explicitly not-now:** `WelcomeEverythingIsInteresting` hero/
  display text fixed sizing (Mark: "eventually"); two-line hero mask
  recentering near line 1 (v89, "very low priority").
- **Cat 1, low priority:** `page.tsx`'s remaining `8vh`/`4vh`/`3vh`/`20vh`
  spacers — same conversion pattern as `welcomeHeroTopSpacer` whenever
  picked up.

## Tools & resources

- `SCALE_TIERS` / `pxToPxBurst`-style breakpoint-pinning (fixed multiplier
  computed at each breakpoint's REFERENCE viewport width, indexed by
  `useBreakpoint()`/`getBreakpoint()`) is now the established pattern for
  "this should sit at one size per breakpoint, not float with live width" —
  used twice this session (`WhoSkillsSphere.tsx`, `ThinkOpenAnimation.tsx`),
  reach for it before inventing a new approach for the remaining Cat 3 items.
- `claude/spec_viewport_sizing_audit_2026-09-14_v01.md` is now the live
  reference for viewport-sizing audit status — read that instead of v89's
  now-superseded inline list.
- ESLint baseline additions this session: `ThinkOpenAnimation.tsx` has one
  pre-existing `react-hooks/purity` error (`performance.now` in
  `spawnParticles`), present before this session's edit, unrelated to it.
- Reminder for next session: GitHub Desktop being open on Mark's machine
  while running git commands from here can produce `.git/index.lock`
  contention — check `git fetch` + `origin/main` before assuming local
  changes still need pushing.
