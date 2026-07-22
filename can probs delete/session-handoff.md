# Session Handoff — shtooky.com

Companion to `typography-spacing-audit.md`. This document summarises all work completed across two Claude Code sessions so that a new Claude chat conversation has full context.

---

## Project overview

**shtooky.com** — Mark Woloschuk's portfolio site. Next.js App Router. Single design token file at `app/components/Tokens.tsx` that exports all colours, type roles, column widths, spacing, timing, and visibility constants. Components are expected to consume these tokens rather than hardcode values.

The token system uses tiered breakpoints (desktop ≥ 1280px / tablet 768–1279px / mobile < 768px) with SSR-safe hooks (`useType()`, `useColumn()`, `useBreakpoint()`). There is also a legacy direct export (`TYPE`, `COLUMN`) that is permanently desktop-locked and only exists for backward compatibility.

---

## Work completed

### Content + API layer

- Created `app/data/ThinkCard01.md` through `ThinkCard13.md` — essays for the "How I Think" bento grid. Cards use YAML frontmatter (`title`, `narrowtitle`, `subtitle`, `imagePath`) plus block-notation body (`[paragraph]`, `[pullquote]`, `[gallery]`, etc.).
- Created `app/data/ThinkManifest.ts` — maps 13 grid slots to content files, also exports `THINK_GRID`, `coverImageFor()`, `offsetFor()`.
- Created `app/api/think/[file]/route.ts` — serves ThinkCard markdown files via GET, mirrors the existing `/api/case/[file]/route.ts` pattern.
- Created `app/components/ThinkCasePanel.tsx` — parses YAML frontmatter + block body, renders subtitle / paragraph / pullquote / img / gallery / video-carousel blocks with staggered fade-in.
- Wired `ThinkCasePanel` into `ThinkPageController.tsx`.
- Ran smartquotes conversion (`scripts/smartquotes.py`) across all 13 ThinkCard files — straight `'` → `'` (U+2019), straight `"` → curled open/close.

### Responsiveness audit + fixes

Audited every component for hardcoded `width: "76%"` (the legacy desktop column width) or use of the legacy `COLUMN` / `TYPE` direct exports. Fixed:

- `app/page.tsx` — `width: "76%"` → `col.vw vw` via `useColumn()`
- `app/lets-talk/page.tsx` — same
- `app/who-i-am/page.tsx` — same

Canvas-exception components (`WorkCarousel.tsx`, `ThinkGridCanvas.tsx`) were correctly left alone — they handle their own internal column math and must not be double-constrained.

Token cleanup pass on three components that hardcoded hex colours and font-family strings:
- `ThinkGridCanvas.tsx` — `'#fff'` → `COLORS.white`, `'Archivo'` → `TYPE.display`
- `ThinkPageController.tsx` — nav button colour hardcodes → `COLORS.thinking` / `COLORS.dark`
- `ThinkOpenAnimation.tsx` — particle colour → `COLORS.white`

### Typography & spacing audit (read-only pass)

Produced `typography-spacing-audit.md` — full inventory of every font size, spacing constant, and layout value across the codebase, grouped by conceptual role (BODY, CAPTION, DISPLAY/OPENING, NAV_NAME, pull text, spacing), with a tablet-tier completeness check and open questions. **No code was changed in that pass.**

### Token additions + OPENING consolidation (most recent pass)

This is the implementation pass that followed the audit. All changes below were made and TypeScript confirmed clean.

#### New type roles added to `Tokens.tsx`

| Role | Desktop | Tablet | Mobile | Notes |
|---|---|---|---|---|
| `PULLQUOTE` | 32px | 28px | 24px | panel pull-quote blocks |
| `SUBTITLE` | 22px | 20px | 18px | bold lead subtitles; intro blurbs |

Tablet values are interpolated (768px sits 36% of the way from mobile 390 to desktop 1440). All tablet values are marked `// interpolated placeholder — needs visual tuning`.

#### Tablet-tier vw roles updated (were desktop copies)

| Role | Was | Now |
|---|---|---|
| `OPENING` | 5vw (= desktop) | **7vw** |
| `DISPLAY_HERO` | 6.5vw (= desktop) | **9vw** |
| `DISPLAY` | 2.6vw (= desktop) | **3.8vw** |
| `SUBHEAD` | 2.6vw (= desktop) | **3.8vw** |

All marked `// interpolated placeholder — needs visual tuning`.

#### Components updated

**`WelcomeHeroAnimation.tsx`** — `calcLayout()` now reads `getType().OPENING.sizeVw` instead of the desktop-locked `TYPE.OPENING.sizeVw`. The animation now uses the correct vw value at each breakpoint (desktop 5vw / tablet 7vw / mobile 8vw).

**`WorkCarousel.tsx`** — resting-state headline below the carousel:
- `fontSize: clamp(28px, 4vw, 52px)` → `type.OPENING.sizeVw vw` (full role: weight, lineHeight, tracking also wired)
- `width: 900` (hardcoded px, overflowed on mobile) → `col.vw vw`

**`TalkRippleNetwork.tsx`** — `buildTextDOM()`:
- Removed local `TEXT_SCALE = 0.75` fudge factor
- Font size was `window.innerWidth × DISPLAY_HERO.sizeVw × 0.75` → now `window.innerWidth × getType().OPENING.sizeVw`
- lineHeight and tracking also updated from OPENING token

**`ThinkOpenAnimation.tsx`** (Lottie "How I Think" animation):
- `CONFIG.SCALE = 0.75` (hardcoded fraction of column width) replaced by `lottieScale = OPENING.sizeVw × NATIVE_W / (120 × col.vw)`
- `pxToVw` simplifies to `OPENING.sizeVw / 120`
- Result: the Lottie's authored 120px text now tracks the OPENING token at every breakpoint. On mobile (OPENING = 8vw) the animation expands to ~96vw, accommodated by the existing `overflow: visible` wrapper.
- Note: approach used col-percentage scaling rather than an outer `transform: scale()` — the burst/particle system uses vw units that are viewport-relative and would not scale correctly inside a CSS transform.

**`ThinkCasePanel.tsx`** — subtitle `fontSize: 22` → `type.SUBTITLE.sizePx`; pullquote `fontSize: 32` → `type.PULLQUOTE.sizePx` (weight and lineHeight also wired)

**`WorkCaseStudyPanel.tsx`** — pullquote `fontSize: 32` → `type.PULLQUOTE.sizePx`

**`ThinkBlurb.tsx`** — `clamp(22px, 2.4vw, 34px)` local CONFIG value → `type.SUBTITLE.sizePx`

#### Coding standard added

`AGENTS.md` now includes a **TYPE ROLES comment block** convention. Every component that sets a font size must include a header comment immediately after `'use client'` listing which `TYPE_TIERS` roles it uses and flagging any still-hardcoded values explicitly. All files touched in this pass have been updated to follow this convention.

---

## Current state of `TYPE_TIERS`

| Role | Shape | Desktop | Tablet | Mobile | Wired in components? |
|---|---|---|---|---|---|
| `OPENING` | sizeVw | 5 | 7 | 8 | ✅ WelcomeHeroAnimation, WorkCarousel, TalkRippleNetwork, ThinkOpenAnimation |
| `DISPLAY_HERO` | sizeVw | 6.5 | 9 | 10 | ✗ (WelcomeEverythingIsInteresting uses legacy TYPE) |
| `DISPLAY` | sizeVw | 2.6 | 3.8 | 4.5 | ✗ |
| `SUBHEAD` | sizeVw | 2.6 | 3.8 | 4.5 | ✗ |
| `TAGLINE` | sizePx | 28 | 26 | 22 | ✗ (WelcomeHeroAnimation uses hardcoded `1.944vw`) |
| `BODY_WELCOME` | sizePx | 28 | 26 | 22 | ✗ |
| `BODY` | sizePx | 20 | 18 | 18 | ✗ (panels use 17px hardcoded — pending decision) |
| `CAPTION` | sizePx | 13 | 13 | 13 | ✗ (partially matched, not wired) |
| `NAV_NAME` | sizePx | 38 | 32 | 28 | ✗ (NavBar reads NAV.nameFontSize = 38 flat) |
| `PULLQUOTE` | sizePx | 32 | 28 | 24 | ✅ ThinkCasePanel, WorkCaseStudyPanel |
| `SUBTITLE` | sizePx | 22 | 20 | 18 | ✅ ThinkCasePanel, ThinkBlurb |

---

## Still open / explicitly deferred

1. **BODY (body copy) size decision** — Token says 20px. Both case/think panels use 17px. TextBlock uses 24px. Three different answers. Needs a side-by-side visual before touching code.

2. **`WelcomeEverythingIsInteresting.tsx`** and **`WelcomeCTA.tsx`** — still use legacy `TYPE` and local constants for heading sizes. Same pattern fix as WelcomeHeroAnimation, deferred to a separate pass.

3. **`WelcomeHeroAnimation.tsx` tagline** — hardcoded `1.944vw` closely approximates the TAGLINE token's 28px desktop but isn't wired. Low-risk since values nearly match.

4. **`TextBlock.tsx`** — pull text `clamp(28px, 4vw, 52px)`, link `2.0vw`, paragraph 24px — all outside the token system. Needs a decision on whether TextBlock gets its own token roles or reuses existing ones.

5. **`NavBar.tsx`** — reads `NAV.nameFontSize = 38` (single flat value) instead of `TYPE_TIERS.NAV_NAME` (38/32/28 properly tiered). The two tokens currently conflict on tablet/mobile. Needs a decision: does the nav name shrink at smaller breakpoints?

6. **CAPTION sub-hierarchy** — the audit found values of 9px (nav hover labels), 11px (sphere labels), 12px (job box labels), 13px (video counter, figcaption), 14px (footer blurb) all serving different UI roles under one CAPTION token. Should these become separate named roles?

7. **`white-space: nowrap` in TalkRippleNetwork.tsx** — currently safe for the two short lines, but will clip on narrow viewports if copy ever changes. Worth a 30-second visual check; if the text wraps cleanly, remove both `flex-wrap:nowrap` (line div) and `white-space:nowrap` (span).

8. **Tablet/mobile visual tuning** — all interpolated tablet values and the existing mobile values are first-pass approximations. None have been reviewed on actual devices.

9. **`SPACE` token** — defined (`xs/sm/md/lg/xl/xxl = 4/8/16/32/48/64`) but imported by zero components. All spacing is raw px literals. Decision needed: adopt it or remove it.

10. **`who-i-am` sphere asymmetric layout** — `3%/76%/21%` spacers left unchanged. Whether the sphere container should widen on mobile is a design decision for Mark.
