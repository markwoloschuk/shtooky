# Project Bible — v89 (2026-09-14)

*Supersedes v88 (2026-09-13). v88 moves to can_probs_delete/old-bibles/ as the historical record of the fullview/nav rebuild and the reverted document-space-band experiment. This version picks up immediately after that work landed and covers a single session's worth of chasing a mobile-only flicker to its actual root, plus two smaller, related fixes and one deferred audit.*

## Purpose & context

We're building Mark's portfolio site together. This doc — "the bible" — is the living memory of the project: what shipped, what broke, what we learned about *why* it broke, and what's next. It's written so a future session (or a future Mark) can pick up the thread without re-deriving everything from git blame.

Standing instructions, unchanged from prior versions:
- Diagnose before fixing. Don't guess-and-check on a live visual bug.
- One change at a time. Confirm each one before layering the next.
- Test on both desktop Chrome and real iPhone Safari before calling anything done.
- A broken intermediate state is never acceptable — if an attempted fix regresses something else, revert it fully before trying the next approach. Don't leave the codebase in a worse spot while iterating.
- Reset debug flags (`DEBUG.thinkBand`, `DEBUG.thinkBandTrace` in `SiteTokens.tsx`) to `false` before ending work.
- Verify every edit with `npx tsc --noEmit` (must stay clean) and `npx eslint <file>` (must match the known pre-existing baseline — see Tools & resources).

## THE THROUGH-LINE, continued

v88 introduced "a coordinate is not a number, it is a number plus a frame of reference" as the session's governing idea, discovered via the fullview/nav rebuild. This session turned up two more entries for that running theory, and one new one:

**The kinds of number, continued:**
- A coordinate needs a frame of reference (v88).
- **A canvas has two sizes, and they must move together.** Its CSS box size (what the browser lays out and scrollbars/clipping respect) and its backing-store resolution (`canvas.width`/`.height`, what actually gets rasterized into) are two independent numbers that only *look* like one thing. Every bug this session — the flicker, the stretch, even in a sense the seam — was some variant of these two numbers drifting apart for a frame or a sub-pixel.
- **A pixel boundary is not exact until you round it.** Two clip regions computed independently from the same logical rect can still land on different physical pixels if either one carries a fractional remainder. "Same rect" isn't enough — it has to be *the same rounded rect*.
- **A native event can lag the thing it's reporting on.** iOS animates its toolbar collapse/expand in the compositor first and fires `resize` after, so code that reacts to `resize` is always describing a viewport that already changed. You can't out-race this by listening harder; you have to stop needing to react to it at all (see the buffer fix below).

**The ten generations, continued** (still the same shape from v88 — a bug shows up, gets partially fixed, and shows back up one layer down): this session's flicker bug is arguably generation eleven of that pattern, and it's the first one where the actual fix was to stop playing the reactive game entirely rather than getting faster at reacting.

## Current state — what shipped this session

**1. Mobile Safari image flicker during scroll (root-caused and fixed).**
The open card's image would visibly flash/disappear while scrolling on an iPhone in Safari — never reproduced on desktop, and for a while not reliably reproduced at all, which is what made this the longest thread of the session.

The diagnosis went through three refinements, each driven by a specific observation from Mark rather than a guess from me:
- First report: happens on mobile, not desktop.
- Refined: only scrolling *down*, never up.
- Refined again: only on *fast* scroll, not slow.

Root cause, in two parts:
- `ThinkGridCanvas.tsx`'s resize handler was setting `canvas.width`/`.height` on real resize events, which wipes the *entire* canvas backing store (not just the changed dimension) — but the repaint was deferred to the next animation frame via a `needsBandRepaintRef` flag, leaving a real window where the browser could paint a blank canvas. This alone explained a flicker, but not the up/down or fast/slow asymmetry.
- The direction- and speed-dependent part: iOS's dynamic toolbar collapses/expands natively in the compositor *before* the JS `resize` event fires. Scrolling down grows the visual viewport; the canvas's JS-driven box is briefly too small for it, exposing page content underneath. Scrolling up shrinks the viewport, so the (still large) old box already covers it — no gap. Fast scrolling widens that lag window enough to be visible; slow scrolling doesn't.

Two fix attempts were tried and **fully reverted** before landing on the one that stuck:
- Attempt 1: `100vw`/`100dvh` for both canvas dimensions. Broke desktop (cards landed shifted left — `100vw` includes the scrollbar gutter, so it's wider than `window.innerWidth`) and appeared to cause subtitle content to bleed below the grid on close.
- Attempt 2: keep width as plain JS px, switch only height to `100dvh`. Fixed the desktop regressions, but introduced a new bug: the open image would visibly stretch vertically and snap back, worst during elastic overscroll bounce at the top/bottom of the page. `100dvh` tracks the *entire* visual viewport including rubber-band bounce, but the canvas's backing-store resolution only updates on an actual `resize` event, which bounce doesn't fire — so the browser was stretching the raster to fill a box that had moved without it.

**Final fix — oversized buffer, not faster reaction:** stop trying to keep the canvas's box in sync with a viewport height that's structurally ahead of the events describing it. Instead, size the canvas element's height `BAND_CANVAS_H_BUFFER` (160px) taller than `window.innerHeight` at all times, so ordinary scroll-driven toolbar fluctuation never needs a resize at all. The resize handler now only touches `canvas.width`/`.height` (i.e. wipes and needs a repaint) when the real width changes, or when `window.innerHeight` actually exceeds the current buffered height — both now handled *synchronously* (`applyBandClip(); renderBand();` inline in the handler, no deferred flag). A new `applyBandClip()` helper is the single source of truth for the band canvas's clip-path, called from both `tick()` every frame and the resize handler, using the canvas's own tracked height (`bandCanvasHeightRef`) rather than `window.innerHeight` directly, since the box is deliberately larger than the viewport now.

Confirmed on real iPhone Safari at both scroll speeds, both directions: "looks good. thank you!"

**2. Faint gradient/seam line on card image edges (root-caused and fixed).**
A hairline seam, most visible along the bottom edge, flickering during open/close and faintly visible even at rest in the grid. Root cause: the image and its vignette overlay are drawn via two separate `ctx.clip()` calls, computed independently from geometrically-identical rects — but "identical" only down to floating point. Two independently-rounded fractional-pixel rects can rasterize with a slightly different anti-aliased boundary, and since the animation changes scale/position every frame, the sub-pixel phase (and the seam's visibility) flickers with it.

Fixed with a new `snapRect()` helper that rounds a rect's edges to whole device pixels, applied everywhere an image and its vignette need to share an exact boundary: grid-cell rendering, the fade-out-behind-opening-card pass, the nav-carousel outgoing/incoming blocks, and — the trickiest spot — the open/close/fullview path, where the image draws inside a `ctx.scale()` camera transform and the vignette draws in outer (unscaled) space. Solved by snapping the *outer*-space rect first, then converting that snapped rect back through the same camera transform to get a local-space clip rect — guaranteeing both draws land on literally the same device pixels regardless of which space they're drawn in.

Confirmed: "it's much improved on desktop. don't think i can really see it on mobile."

**3. Card closing to the wrong grid position after nav (root-caused and fixed).**
Pre-existing bug: open a card, use next/prev to navigate to a different card, then close — the shrink animation lands in the wrong spot on the grid, worst when jumping from the first card to the last. Mark noted this is mostly a desktop problem (mobile's taller stacked layout makes big document-Y jumps between adjacent cards less common).

Root-caused using the project's own built-in `DEBUG.thinkBand`/`thinkBandTrace` HUD (temporarily re-enabled) rather than guessing — a captured trace showed the close animation's target `fromRect.y` landing *below* the entire grid's rendered height. Cause: `bandDocYRef`, the scroll-position bookmark, is captured once when the *originally clicked* card is opened, and was being reused unconditionally as the anchor for converting any cell's document-Y into on-screen Y. That's only valid for the card that was actually clicked — the further away (in document Y) a nav'd-to card's cell is from that original bookmark, the more wrong the close position gets.

Mark specified the desired behavior directly, which became the fix's spec verbatim: *"Whatever image is open should close to a position on the grid where that card is visible on screen. If we don't have to move the grid, we don't — just go back to where we started. If we do have to move the grid, move just enough for that card to be visible."*

Implemented as `scrollAnchorForCell(i)` — a nearest-edge, `scrollIntoView`-style minimal adjustment: if the target cell is already within the current viewport (relative to the existing bookmark), don't move at all; otherwise move just enough to bring the nearer edge of the cell into view. `computeCellRect()` was changed to take an explicit `anchor` parameter instead of always reading the stale bookmark, and `closeCard()` now calls `scrollAnchorForCell()` fresh for whichever card is actually open, updating both `bandDocYRef` and `fromRectRef` before the close scroll happens.

Confirmed: "that works nicely."

**4. Who I Am page — skills sphere and surroundings visibly resizing (root-caused and fixed).**
Mark flagged that the skills sphere on the Who I Am page was visibly resizing/shifting — a smaller instance of the same "viewport-relative sizing causes visible movement" family as the mobile flicker work above, so it was a natural next stop. The sphere's own box height had already been fixed in a prior session; what remained was three `vh`-based spacing values still live in `WhoIAmBody.tsx` (bottom padding, a spacer above the sphere, and the Venn diagram's top/bottom margin), which shift whenever the viewport height changes — including from the iOS toolbar animation, not just window resizing.

Converted all three to the codebase's established tiered-px token pattern (`SPACE.layout`, consumed via `useSpace()`/`space()`), matching the precedent already set by `whoSphereBoxHeight`: `whoBottomPad`, `whoSphereSpacerTop`, `whoVennMargin`, each with `{ desktop, tablet, mobile }` values derived proportionally from the same reference heights used elsewhere in the file.

## OPEN — the site-wide vh audit

Once the Who I Am fix landed, Mark asked for a broader pass: find any other remaining places using viewport-relative (`vh`/`vw`) or live-viewport-height-driven sizing that could cause the same class of visible-movement bug. Full grep audit was done and reported; **no further fixes were made this session** — Mark chose to stop here rather than continue through the list. Recording it so it isn't lost:

**Live `vh` usage still in place, likely visible and worth fixing:**
- `app/page.tsx` — `TOP_SPACER = "35vh"` plus `8vh`/`4vh`/`3vh`/`20vh` spacer divs (lines ~199, 206, 212, 238).
- `app/components/TalkOptions.tsx:335` — `height: "70vh"`.
- `app/components/WelcomeEverythingIsInteresting.tsx:376` — `height: "100vh"` (this file also has several live `window.innerHeight` reads driving `setDisplayFontSize` and y-offsets — worth a look together).
- `app/components/SiteNavBar.tsx:889` — `height: "100vh"`.
- `app/components/SiteBackground.tsx:363,1246` — `100vw`/`100vh` on a `position:fixed` full-viewport layer. Not yet checked against the prior session's already-fixed particle-respawn bug on this same component — worth confirming the vh/vw sizing itself isn't a separate remaining risk on top of that.
- `app/components/SiteGallery.tsx:404` — `maxHeight: '90vh'`.
- `app/not-found.tsx:66` — `calc(100vh - ${FOOTER.height}px)`.

**Comment-only, no fix needed:** `WhoVennDiagram.tsx:73-74` and `WelcomeClientLogoGrid.tsx:38-39` reference `vh` values only in historical documentation comments (reveal-threshold notes like "BF0 (95vh)").

**One-off `window.innerHeight`/`innerWidth` reads, assessed as lower risk** (mostly scroll-trigger threshold reads rather than continuous sizing — not recommended for fixing unless one is actually reported as broken): `WhoVennDiagram.tsx`, `SiteTextBlock.tsx`, `SiteTokens.tsx` (breakpoint functions, width-only), `SiteRevealQueue.tsx`, `WelcomeClientLogoGrid.tsx`, `SiteSequenceController.tsx`, `WorkCarousel.tsx`, `WelcomeScrollFade.tsx`, `SiteScrollConfig.tsx` (also has several `vh`-based debug-overlay lines, likely dev-only), `WelcomeCTA.tsx`, `ThinkPageController.tsx`.

This list is the natural next-session starting point if/when Mark wants to keep pulling this thread. `page.tsx`'s spacers and `TalkOptions.tsx`'s 70vh block are probably the highest-visibility ones to start with.

## Key learnings & principles

- **A visible bug that "doesn't always happen" often has a direction and a speed, not just an on/off state.** Both refinements Mark supplied this session (down-only, fast-only) were the actual keys to the diagnosis — treat a partially-reproducing bug report as incomplete data, not flaky data.
- **When a fix causes a new, different visible bug, that's not noise — it's a clue about the mechanism.** The stretchy-image regression from attempt 2 directly pointed at the backing-store/CSS-box mismatch that was the real underlying issue the whole session, which the final buffer fix addressed head-on.
- **The fix for "this event fires late" is usually not "handle it faster," it's "stop needing to react to it."** The oversized buffer sidesteps the entire resize-lag problem instead of trying to win a race against a native compositor.
- **Two clip regions being "the same rect" isn't enough if they're independently computed** — floating-point rects need to be snapped to the same integer pixels before two separate draws can share a boundary invisibly.
- **A scroll bookmark captured at one moment is only valid for the thing it was captured for.** Reusing `bandDocYRef` across a nav'd-to card without recomputing it was the same shape of bug as v88's coordinate/frame-of-reference lesson, one layer further in.
- **When the user states the desired behavior as a rule ("don't move if we don't have to, move the minimum if we do"), that rule is the spec** — don't reach for a cleverer heuristic when the person describing the bug already handed you the fix's design.

## Approach & patterns

- Built-in debug tooling (`DEBUG.thinkBand` HUD, `DEBUG.thinkBandTrace` rolling frame trace, both in `SiteTokens.tsx`) is the project's own instrument for exactly this class of animation-geometry bug — used twice this session (nav-close bug) instead of guessing from visual inspection alone. Always flip both back to `false` before finishing.
- Every file edit this session went through `mcp__remote-devices__device_bash` running Python heredoc scripts that read the file, assert an anchor string occurs exactly once, replace it, and write back — never a blind rewrite from a possibly-truncated tool result.
- Every edit was verified with `npx tsc --noEmit` (must stay clean) and `npx eslint <file>` (must match the known baseline exactly — see Tools & resources) before moving to the next change.
- Confirmed pattern for canvas sizing bugs generally: check whether the CSS box size and the backing-store resolution can ever be set by two different mechanisms (a CSS unit like `vh` for one, JS for the other) — if so, that's the crack these bugs live in.

## On the horizon

- The site-wide vh audit list above, whenever Mark wants to resume it.
- No other open threads from v88 were revisited this session (the fullview/nav rebuild and the document-space-band experiment are settled per v88).

## Tools & resources

- ESLint baseline for `ThinkGridCanvas.tsx`, unchanged all session (9 pre-existing issues — confirm this exact count/nature after any future edit, don't just check "some baseline exists"): 2 unused-import warnings (`NAV`, `stageFalloffMask`), 1 unused-eslint-disable-directive warning, 3 "Cannot access refs during render" errors, 1 missing-dependency warning (`headerRef`), 2 "accessed before declared" errors (`openCard`, `tick`).
- `SiteTokens.tsx` has one pre-existing, unrelated `import/no-anonymous-default-export` warning around line 1303 — confirmed present before and after this session's edits, unrelated to anything touched.
- `SPACE.layout` tiered-px token pattern (`{ desktop, tablet, mobile }`, consumed via `useSpace()`/`space()`) is the established replacement for raw `vh` values — use it for every item in the OPEN audit list above rather than inventing a new pattern.
