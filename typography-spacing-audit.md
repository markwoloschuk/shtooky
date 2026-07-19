# Typography & Spacing Audit — shtooky.com

*Read-only pass. No code was changed.*

---

## Context

This codebase uses a central design token file (`app/components/Tokens.tsx`) that defines named type roles, column widths, spacing units, and breakpoint tiers. The audit inventories every place font sizes, spacing, and layout constants are **actually set in components** — grouped by conceptual role, not by file — so they can be compared against the intended token values.

**Breakpoints:** desktop (≥1024px), tablet (768–1023px), mobile (<768px)  
**Token access:** `useType()` / `useColumn()` hooks are SSR-safe and breakpoint-aware. The legacy direct exports `TYPE` and `COLUMN` are always desktop-locked.

---

## Token Reference (Tokens.tsx)

### TYPE_TIERS — font sizes by role

| Role | Desktop | Tablet | Mobile | Notes |
|---|---|---|---|---|
| `OPENING` | 5vw | 5vw ⚠️ | 8vw | tablet = desktop (TODO in source) |
| `DISPLAY_HERO` | 6.5vw | 6.5vw ⚠️ | 10vw | tablet = desktop (TODO) |
| `DISPLAY` | 2.6vw | 2.6vw ⚠️ | 4.5vw | tablet = desktop (TODO) |
| `SUBHEAD` | 2.6vw | 2.6vw ⚠️ | 4.5vw | tablet = desktop (TODO) |
| `TAGLINE` | 28px | 26px ✅ | 22px ✅ | properly tiered |
| `BODY_WELCOME` | 28px | 26px ✅ | 22px ✅ | properly tiered; same values as TAGLINE |
| `BODY` | 20px | 18px ✅ | 18px ✅ | properly tiered |
| `CAPTION` | 13px | 13px | 13px | all tiers identical — intentional? |
| `NAV_NAME` | 38px | 32px ✅ | 28px ✅ | properly tiered — but NavBar doesn't use it (see Role 5) |

### COLUMN_TIERS — layout widths

| Tier | `vw` | `marginVw` | `bodyColPct` |
|---|---|---|---|
| desktop | 76% | 12% each side | 45% of column |
| tablet | 88% | 6% each side | 60% of column |
| mobile | 90% | 3% each side | 100% of column |

### SPACE — spacing token (defined but unused in components)

```
xs: 4    sm: 8    md: 16    lg: 32    xl: 48    xxl: 64
```

---

## Role 1: BODY — Essay & Case Study Body Copy

**Token:** `TYPE.BODY` — desktop **20px** / tablet **18px** / mobile **18px**

| Component | Actual value | Delta vs token | Method |
|---|---|---|---|
| `WorkCaseStudyPanel.tsx:235` | 17px | **−3px** | hardcoded |
| `ThinkCasePanel.tsx:227` | 17px | **−3px** | hardcoded |
| `TextBlock.tsx` (`PARA_STYLE`) | 24px | **+4px** | hardcoded module-level const |
| `ThinkBlurb.tsx` | `clamp(22px, 2.4vw, 34px)` | varies | local CONFIG object |
| `ThinkBelowPlaceholder.tsx` | `clamp(18px, 1.8vw, 24px)` | varies | hardcoded |
| `WelcomeCTA.tsx` | `2.0vw` (~29px @ 1440) | **+9px** | local `DEFAULTS.fontSizeVw` |

**Summary:** Six components render what is semantically "body copy" using six different values. None of them import `TYPE.BODY` for their body text. The two case/think panels agree at 17px (3px under token). TextBlock goes to 24px. ThinkBlurb and ThinkBelowPlaceholder use `clamp()` expressions entirely outside the token system. WelcomeCTA is vw-based and lands at ~29px on a 1440px screen.

---

## Role 2: BODY_WELCOME & TAGLINE — Welcome Page Copy

**Token:** `TYPE.BODY_WELCOME` — desktop **28px** / tablet **26px** / mobile **22px**
**Token:** `TYPE.TAGLINE` — desktop **28px** / tablet **26px** / mobile **22px**
*(Both tokens are identical at every tier.)*

| Component | Context | Actual value | Method |
|---|---|---|---|
| `WelcomeHeroAnimation.tsx` | tagline paragraph | `1.944vw` (~28px @ 1440) | hardcoded CSS string |
| `TextBlock.tsx` | paragraph body | 24px | hardcoded `PARA_STYLE.fontSize` |
| `TextBlock.tsx` | inline links | `2.0vw` (~29px @ 1440) | hardcoded `LINK_DEFAULTS.fontSizeVw` |
| `WelcomeCTA.tsx` | CTA text | `2.0vw` (~29px @ 1440) | local `DEFAULTS.fontSizeVw` |

**Summary:** WelcomeHeroAnimation's tagline (`1.944vw`) lands almost exactly on the token at 1440px — but it's hardcoded, not wired to the token. TextBlock paragraphs are 4px below the BODY_WELCOME token. The link and CTA both land near 29px, 1px above the 28px token at full width, and won't follow the mobile tier.

---

## Role 3: CAPTION — Labels, UI Text, Metadata

**Token:** `TYPE.CAPTION` — **13px** at all three tiers (identical)

| Component | Context | Actual value | Delta vs token |
|---|---|---|---|
| `WorkCaseStudyPanel.tsx:211` | job box labels (Client, Role…) | 12px | **−1px** |
| `WorkCaseStudyPanel.tsx:296` | video counter (`1 / N`) | 13px | ✅ matches |
| `ThinkCasePanel.tsx:309` | `<figcaption>` text | 13px | ✅ matches |
| `ThinkCasePanel.tsx:335` | video counter (`1 / N`) | 13px | ✅ matches |
| `Footer.tsx:103` | footer blurb text | 14px | **+1px** |
| `WhoSkillsSphere.tsx` | sphere node labels | 11px | **−2px** |
| `NavBar.tsx:979` | nav hover labels ("think", "work"…) | 9px | **−4px** |

**Summary:** The 13px token is used correctly in two places (video counters, figcaption). Everything else deviates. The actual values in use — 9, 11, 12, 13, 14px — suggest a de facto sub-hierarchy within the CAPTION role that isn't formally documented. The nav hover labels at 9px and sphere labels at 11px may be intentionally smaller UI chrome rather than "caption" text.

---

## Role 4: DISPLAY / SUBHEAD / DISPLAY_HERO / OPENING — vw-Scale Headings

These roles use viewport-relative sizing. They appear in canvas-based animations where size is calculated at runtime.

| Component | Role used | Actual method | Breakpoint-aware? |
|---|---|---|---|
| `WelcomeHeroAnimation.tsx` | OPENING | `window.innerWidth × TYPE.OPENING.sizeVw / 100` | ✗ — legacy `TYPE` (desktop-locked at 5vw) |
| `WelcomeEverythingIsInteresting.tsx` | DISPLAY_HERO, DISPLAY | `window.innerWidth × TYPE.*.sizeVw / 100` | ✗ — legacy `TYPE` |
| `TalkRippleNetwork.tsx` | DISPLAY_HERO | `window.innerWidth × TYPE.DISPLAY_HERO.sizeVw / 100 × TEXT_SCALE` | ✗ — legacy `TYPE` |
| `ThinkGridCanvas.tsx` — band title | canvas-internal | `52 × scale` px in canvas space | N/A — canvas math |
| `ThinkGridCanvas.tsx` — card titles | canvas-internal | `CFG.TITLE_SIZE = 25` px | N/A — canvas math |

**Also in this space (not using TYPE tokens):**

| Component | Context | Actual value |
|---|---|---|
| `WelcomeHeroAnimation.tsx` | tagline line height / tracking | from `TYPE.TAGLINE` ✅ |
| `TextBlock.tsx` | pull text / large block quote | `clamp(28px, 4vw, 52px)` — hardcoded |
| `TextBlock.tsx` | inline links | `2.0vw` — hardcoded |
| `WelcomeCTA.tsx` | CTA | `2.0vw` — local const |
| `ThinkCasePanel.tsx:209` | card subtitle (bold lead) | 22px — hardcoded |
| `WorkCaseStudyPanel.tsx:243` | pullquote | 32px — hardcoded |
| `ThinkCasePanel.tsx:235` | pullquote | 32px — hardcoded |

**Summary:** All three animation components (WelcomeHero, WelcomeEverything, TalkRipple) compute heading size by multiplying `window.innerWidth` by the desktop token's sizeVw. On mobile, this gives the desktop rate (e.g., 5vw instead of 8vw for OPENING) — headings will be visually undersized. Canvas components are exempt from this concern since they handle scale internally. Pull quotes at 32px and the TextBlock pull text at `clamp(28–52px)` are design elements that don't have corresponding named token roles.

---

## Role 5: NAV_NAME — "mark woloschuk" / "shtooky"

**Token A:** `NAV.nameFontSize = 38` (single flat value — no tiers)
**Token B:** `TYPE_TIERS.NAV_NAME` — desktop **38px** / tablet **32px** / mobile **28px**

| Component | Method | Value used |
|---|---|---|
| `NavBar.tsx:15` | `S.fontSize = NAV.nameFontSize` | 38px — single value, no tier |

**Summary:** Two tokens define the nav name size and they disagree on what to do at smaller breakpoints. NavBar reads from `NAV.nameFontSize` (always 38). `TYPE_TIERS.NAV_NAME` has properly-tiered values (38/32/28) but nothing reads them. On tablet and mobile, the name stays at 38px.

---

## Role 6: Spacing & Layout Constants

### Panel interior padding

| Component | Left/Right | Top | Bottom |
|---|---|---|---|
| `WorkCaseStudyPanel.tsx` | `7.2222%` (= 104px ÷ 1440px) | 40px | 80px |
| `ThinkCasePanel.tsx` | none (caller provides) | 0 | 80px |

### Between-block spacing

| Component | Value |
|---|---|
| Both panels — between each content block | `marginBottom: 28px` |
| `ThinkCasePanel.tsx` — subtitle row | `marginBottom: 32px` |
| `WorkCaseStudyPanel.tsx` — job box | `marginBottom: 28px`, `paddingTop: 20px` |

### Job box grid (WorkCaseStudyPanel)

| Property | Value |
|---|---|
| Columns | `1fr 1fr` |
| Row gap | 24px |
| Column gap | 30px |
| Inner label-to-value gap | 3px |

### SPACE token usage

Zero component files import or use `SPACE`. All spacing is raw pixel literals. `ThinkBlurb.tsx` has `GAP_BELOW_CONTENT = 32` which coincides with `SPACE.lg` but is defined as a local constant.

### Navigation & chrome

| Component | Property | Value | Method |
|---|---|---|---|
| `NavBar.tsx` | position | `top: 2.4vw`, `left: 2.5vw` | hardcoded vw |
| `NavBar.tsx` | title fontSize | computed via `fitFontSize()` | fills to name width |
| `Footer.tsx` | height | 52px | hardcoded |
| `Footer.tsx` | side padding | `2.5vw` each side | hardcoded vw |
| `Footer.tsx` | social icon gap | 16px | hardcoded |

### ThinkBlurb layout

| Property | Value | Notes |
|---|---|---|
| Gap below animation | 32px (`GAP_BELOW_CONTENT`) | = `SPACE.lg` numerically, but local const |
| Width | `0.48 × col.vw` | responsive via `useColumn()` ✅ |
| Font size | `clamp(22px, 2.4vw, 34px)` | local CONFIG, not from token |

---

## Tablet-Tier Completeness Check

| Token role | Tablet value | Status |
|---|---|---|
| `OPENING` | 5vw (= desktop) | ⚠️ placeholder — `// TODO` in source |
| `DISPLAY_HERO` | 6.5vw (= desktop) | ⚠️ placeholder — `// TODO` in source |
| `DISPLAY` | 2.6vw (= desktop) | ⚠️ placeholder — `// TODO` in source |
| `SUBHEAD` | 2.6vw (= desktop) | ⚠️ placeholder — `// TODO` in source |
| `TAGLINE` | 26px | ✅ properly tiered |
| `BODY_WELCOME` | 26px | ✅ properly tiered |
| `BODY` | 18px | ✅ properly tiered |
| `CAPTION` | 13px (= desktop) | ? all 3 tiers identical — intentional or placeholder? |
| `NAV_NAME` in TYPE_TIERS | 32px | ✅ tiered — but `NavBar` reads `NAV.nameFontSize = 38` instead |

---

## Open Questions

1. **What is the intended body copy size?** Token says 20px. Both case/think panels use 17px. TextBlock uses 24px. These are three different answers for the same role. Which one is correct?

2. **Is CAPTION (13px) the same at all three tiers by design?** The `// TODO` comment in `VISIBILITY_TIERS` suggests tablet/mobile tiers were copied from desktop. CAPTION has no such comment — but all three values are identical. Is this intentional, or also needs tuning?

3. **Should pull quotes have their own token?** Both panels use 32px. TextBlock's large pull text tops out at 52px. Is 32 the pullquote size, or is there a meaningful distinction between panel pullquotes and TextBlock hero quotes?

4. **What should the welcome animations do on mobile?** `WelcomeHeroAnimation`, `WelcomeEverythingIsInteresting`, and `TalkRippleNetwork` all use `window.innerWidth × TYPE.*.sizeVw` with the desktop-locked `TYPE` export. On mobile the heading size comes out too small (using 5vw instead of the token's 8vw). Is this a known limitation (animations are desktop-first) or a gap to fix?

5. **Does the nav name need to respond to breakpoints?** `TYPE_TIERS.NAV_NAME` has 38/32/28px. `NAV.nameFontSize` is flat at 38. NavBar uses `NAV`. At what point (if ever) does the navbar render on tablet/mobile, and should it shrink?

6. **Is the SPACE token aspirational or in use?** It's defined with a clean 8px grid but imported by zero components. Should components start using it, or is it just documentation?

7. **Are 22px (ThinkCasePanel subtitle) and 32px (panel pullquotes) candidates for named token roles?** Right now they live in the gap between `BODY` and `DISPLAY` with no formal name.

8. **Why are TAGLINE and BODY_WELCOME the same size at all tiers?** 28/26/22 in both. If they're meant to be visually equivalent, is one of them redundant? If they should diverge, what's the intended direction for each?
