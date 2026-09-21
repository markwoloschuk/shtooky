# Project Bible — v91 (2026-09-19, evening session)

*Supersedes v90 (2026-09-14, night session). v90 is not deleted — it stays as
the historical record of the skills-sphere `SCALE_TIERS` fix, the
`ThinkOpenAnimation` burst fix, and the viewport-sizing audit's three-way
categorization. This version covers a short, self-contained session that did
no work on the five main pages at all: it opened a new `/art/<slug>` route
family on the site and shipped the first page into it.*

## Purpose & context

Standing instructions, unchanged from prior versions:
- Diagnose before fixing. Don't guess-and-check on a live visual bug.
- One change at a time. Confirm each one before layering the next.
- Test on both desktop Chrome and real iPhone Safari before calling anything done.
- A broken intermediate state is never acceptable — revert fully before trying the next approach.
- Verify every edit with `npx tsc --noEmit` (must stay clean) and `npx eslint <file>` (must match the known pre-existing baseline).

## Current state — what shipped this session

**1. New `/art/<slug>` route family (built and live).**
The ask came in as a one-off: Mark is submitting a proposal to an outdoor
light festival at Oakland's Lake Merritt gardens — deadline Monday
2026-09-21 — and wanted a URL he owns to put on the submission form.
Original framing: "i was thinking shtooky.com/art/projectname."

The architectural decision, made before touching files: **standalone HTML in
`public/`, not a route in `app/`.** The artifact to be hosted is already a
complete, self-contained HTML document (canvas simulation, inline styles,
its own `<head>`). Serving it from `public/` means it bypasses the App
Router and `layout.tsx` entirely — no NavBar, no Footer, no
`SiteBackground`, no React port, and crucially nothing that can collide with
the band model, the stage/`contentWidth()` system, or the five-page
single-room vision. An art proposal page is a guest room, not a sixth page.

Two files:
- `public/art/kehai/index.html` — the page itself.
- `next.config.ts` — a rewrite, added after `allowedDevOrigins`:
  ```ts
  async rewrites() {
    return [{ source: '/art/:slug', destination: '/art/:slug/index.html' }];
  },
  ```

The rewrite is **wildcarded on purpose**, not hardcoded to `kehai`. Next
serves `public/` files at their literal path, so without it the clean URL
`/art/kehai` is not guaranteed to resolve to the folder's `index.html` — and
two days before a deadline is the wrong time to gamble on Vercel's
directory-index behavior. Wildcarding it means every future project is just
`public/art/<slug>/index.html` with **no config change ever again**.

Mark confirmed this is the intent: he expects to "use this art folder to host
other weird little projects like this in the future." So `/art/` is now a
standing, deliberate part of the site — a place for work that is Mark's but
isn't portfolio.

**2. First tenant — "Kehai — stalk study."**
A canvas simulator of a single illuminated stalk: a rod discretized into 18
segments with per-segment stiffness/damping, gust-modulated wind forcing,
drag-to-push interaction, a human silhouette at true scale for reference,
and an OKLCh colour ramp driving the tip LED from rest colour to full-bend
colour. It is the interactive proof of the piece's core idea — the LED
brightens and shifts hue the more the stalk bends, so wind and a passing
hand are the same signal.

Shipped with `<meta name="robots" content="noindex">` added, so it does not
surface in search next to the portfolio. The `<title>` was left as the
working title "Kehai — stalk study" — flagged at the time, and Mark's call
was explicit: "this is not the file we will post for the jurors."

**3. Verification.** `npx tsc --noEmit` clean. A local dev server returns
**HTTP 200** at `/art/kehai` with all 30,161 bytes intact, `<title>` and the
noindex meta both present in the served response — so the rewrite is
confirmed working, not assumed.

**4. Committed and pushed.** Mark committed via GitHub Desktop as
`84ea34d "adding art folder"`; `git fetch` confirmed local HEAD and
`origin/main` match. Working tree clean.

## Key learnings & principles

- **`public/` is the escape hatch for anything that shouldn't inherit the
  site system.** The instinct with a Next site is to make everything a route,
  which drags the new thing through `layout.tsx`, the token system, the
  breakpoint machinery and the band model. When the content is already a
  complete HTML document and is *supposed* to be isolated, `public/` plus one
  rewrite is both faster and safer — it cannot regress the five main pages
  because it never touches them.
- **Wildcard the rewrite the first time, not the second.** `/art/:slug` cost
  nothing extra over `/art/kehai` and retires the whole category of future
  config edits. The moment a pattern is obviously going to repeat, spend the
  five seconds.
- **The connected-folder delete guard blocks the dev server, not just git.**
  v90 learned this as a `.git/index.lock` problem. This session it showed up
  as a second, less obvious form: `next dev` failed at startup with
  `EPERM: operation not permitted, unlink '.next/dev/.DS_Store'`. Same root
  cause — Claude's session could not delete inside the connected folder. The
  fix is the same (`device_request_delete_permission`), and the lesson is to
  **request it at the start of any session that will run a dev server or git**,
  rather than discovering it mid-verification.
- **Turbopack's persistent cache hits a file-descriptor ceiling in the
  device VM.** `next dev` (Turbopack, the Next 16 default) reported
  `Failed to open database … Too many open files (os error 24)` and died
  after printing "Ready", even with `ulimit -n` raised to 65536. Running
  `npx next dev --webpack` worked immediately. Worth reaching for that flag
  first when driving a dev server from the device shell.
- **"Give me a URL" is an architecture question, not a hosting question.**
  The five minutes spent deciding `public/` vs `app/`, and wildcard vs
  hardcoded, is what made this a twenty-minute job with nothing to unwind
  later.

## On the horizon

- **The real juror-facing `/art/kehai` page — not built.** Mark's description:
  "a black page with project title in english and japanese – set to vw
  percentage. and then an artifact that plays a looping video showing what
  the project looks like." The simulator currently at that URL is a
  placeholder standing in for it. Proposal deadline is **Monday 2026-09-21**.
  Decisions still open: the real `<title>`, whether the simulator stays
  embedded below the video treatment or is replaced by it, and whether the
  page keeps `noindex`.
- **Cat 3 remaining (carried from v90, untouched):** `WorkCarousel` title
  text and `ThinkGridCanvas` band headline — both need fixed
  px-per-breakpoint values, same `SCALE_TIERS`/`pxToPxBurst` pattern (see
  `spec_viewport_sizing_audit_2026-09-14_v01.md`).
- **Backlog, explicitly not-now:** `WelcomeEverythingIsInteresting` hero/
  display text fixed sizing (Mark: "eventually"); two-line hero mask
  recentering near line 1 (v89, "very low priority").
- **Cat 1, low priority:** `page.tsx`'s remaining `8vh`/`4vh`/`3vh`/`20vh`
  spacers.

## Tools & resources

- **`/art/<slug>` is now a documented pattern.** To add a project: drop a
  self-contained `index.html` at `public/art/<slug>/index.html` and push.
  The wildcard rewrite in `next.config.ts` handles the clean URL; no config
  change is needed. Add `<meta name="robots" content="noindex">` to the
  `<head>` for anything that shouldn't appear in search beside the portfolio.
- **Session-start checklist addition:** if the session will run a dev server
  or git commands, request delete permission on the shtooky folder up front
  (`device_request_delete_permission`) — see the learning above.
- **`npx next dev --webpack`** is the reliable way to run the dev server from
  the device shell; the Turbopack default fails on file-descriptor limits there.
- `claude/spec_viewport_sizing_audit_2026-09-14_v01.md` remains the live
  reference for viewport-sizing audit status.
- ESLint baseline unchanged this session — no TypeScript or component files
  were edited beyond `next.config.ts`.
