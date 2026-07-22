# Text Container Width Audit — shtooky.com

_Read-only pass. No code changed. Companion to `claude-code-handoff_textblock-bodycolpct-fix.md`._

---

## The token that's never been used

Before the inventory, one fact frames everything else:

`COLUMN_TIERS` defines a `bodyColPct` property on all three breakpoint tiers:

| Breakpoint | `col.vw` | `bodyColPct` | Resolved width | Approx px at ref viewport |
|---|---|---|---|---|
| Desktop | 76 | 45% | 34.2vw | 492px at 1440px |
| Tablet | 88 | 60% | 52.8vw | 405px at 768px |
| Mobile | 90 | 100% | 90vw | 351px at 390px |

The intended formula is documented in `Tokens.tsx:583`:
```ts
maxWidth: `${getColumn().vw * getColumn().bodyColPct / 100}vw`
```

**Zero components currently use this formula.** Every component that narrows its text independently arrived at a different number. `bodyColPct` is an orphan token.

---

## Inventory, by role

### 1. Welcome page — body paragraphs
**File:** `app/page.tsx` — lines 24, 54

| Element | Width value | Token connection | Resolved at desktop (76vw col) |
|---|---|---|---|
| Body paragraphs (2×) | `maxWidth: "54%"` of `col.vw` container | None | 41.0vw ≈ 590px |
| Closing one-liner ("I've worked with some great people") | `maxWidth: "70%"` of same container | None | 53.2vw ≈ 766px |

Both are `%` values relative to the `col.vw` wrapper div, so they respond to breakpoint via `useColumn()` already — but they respond proportionally to the _column_ scaling, not to a dedicated body-copy token. The closing line uses a different percentage from the body paragraphs; may be intentional (looser, one short line) or drift.

---

### 2. Who I Am / Work page — prose paragraphs (TextBlock)
**File:** `app/components/TextBlock.tsx` — line 231

| Element | Width value | Token connection | Resolved at desktop |
|---|---|---|---|
| Paragraph `<p>` | `maxWidth: "60%"` of `col.vw` container | None (`bodyColPct` = 45%) | 45.6vw ≈ 656px |

`60%` is hardcoded at module level inside `PARA_STYLE`-adjacent inline style. The companion brief is fixing this. Note that `bodyColPct`'s 45% would give 492px — significantly narrower than the current 656px. Either the token value needs updating, or the fix should use a different approach than raw `bodyColPct`.

---

### 3. How I Think — intro blurb
**File:** `app/components/ThinkBlurb.tsx` — line 38

| Element | Width value | Token connection | Resolved at desktop |
|---|---|---|---|
| Intro blurb `<p>` | `width: col.vw × 0.48 vw` | None — local `CONFIG.WIDTH_FACTOR = 0.48` | 36.5vw ≈ 525px |

The blurb is positioned manually (`margin-left: col.marginVw`) at the content-column inset and sized to 48% of the column. Context: this sits _below_ `ThinkOpenAnimation`, not inside it — it is plain page-body text in terms of role. The `0.48` constant was chosen independently and is close to but different from both `bodyColPct` (34.2vw) and the welcome body (41vw) and TextBlock (45.6vw).

---

### 4. Work & Think — case study body copy and pullquotes
**Files:** `app/components/WorkCaseStudyPanel.tsx` — lines 242, 250, 290 / `app/components/ThinkCasePanel.tsx` — lines 221, 234, 242, 254

| Element | Width value | Token connection | Notes |
|---|---|---|---|
| Body paragraphs | `maxWidth: 760` (absolute px) | None | Same value in both panel components |
| Pullquote blocks | `maxWidth: 760` (absolute px) | None | Same as paragraphs |
| Card subtitle (`ThinkCasePanel`) | `maxWidth: 640` (absolute px) | None | Narrower than body — independent choice |
| Inline image/video wrappers | `maxWidth: 760` (absolute px) | None | Aligns media with text |

These use **absolute pixel caps** (a different philosophy from the percentage-based widths above). Both panel components live inside their page's panel view, inset with `paddingLeft: 7.2222%` on each side in `WorkCaseStudyPanel` (ThinkCasePanel has no horizontal padding in the component itself — its parent provides inset). At 1440px, 760px is a line-length cap that kicks in well before the panel fills its available width. At 768px tablet viewport, 760px would fill the available width almost entirely — meaning the cap has no practical effect on tablet.

---

### 5. Let's Talk — contact form + confirmation
**File:** `app/components/TalkOptions.tsx` — lines 156, 163

| Element | Width value | Token connection | Notes |
|---|---|---|---|
| Confirmation message `<p>` | `maxWidth: 500` (absolute px) | None | |
| Contact form wrapper | `maxWidth: 500` (absolute px) | None | |

Absolute px cap — a common UX convention for keeping forms narrow and easy to scan. The Let's Talk page places this inside a `col.vw` container, so at desktop it's 500px out of ~1094px. Different philosophy from reading-length cap vs. column-percent approaches elsewhere.

---

### 6. Footer blurb
**File:** `app/components/Footer.tsx` — line 116

| Element | Width value | Token connection | Notes |
|---|---|---|---|
| Rotating blurb text | `maxWidth: "60%"` | None | **60% of viewport**, not of content column |

The footer is `position: fixed, width: 100%` — full viewport width, not inside a column wrapper. The `60%` here is 60% of the viewport: 864px at 1440px, 461px at 768px. This is a layout constraint to prevent the blurb from colliding with the social icons on the right, not a reading-length constraint. **Legitimately independent** — should not share `bodyColPct`.

---

## Legitimately animation-specific (no change needed)

These components constrain text but the width is correctly tied to the animation's own geometry, not to the page column:

| Component | Width approach | Why it's correct |
|---|---|---|
| `WelcomeHeroAnimation.tsx` / `WelcomeHero2Line.tsx` | Fills 100% of column container | Animation derives its own internal text size from canvas geometry |
| `ThinkOpenAnimation.tsx` | Fills `col.vw` | `lottieScale` derived from `OPENING.sizeVw × NATIVE_W / (120 × col.vw)` — text size locked to OPENING token via animation math |
| `TalkRippleNetwork.tsx` | Canvas, fills container | Text sizes derived from `window.innerWidth × OPENING.sizeVw` — no independent text-width constraint |
| `WhoVennDiagram.tsx` | Canvas, 100% of container | Text sized/placed relative to circle radius |
| `WhoSkillsSphere.tsx` | Canvas, 100% of container | Text positioned relative to sphere geometry |
| `WelcomeEverythingIsInteresting.tsx` | 100vw canvas | Full-viewport canvas |

---

## The numbers, side by side

At 1440px desktop viewport (content column = 76vw = 1094px):

| Text role | Component | Width value | Effective px |
|---|---|---|---|
| `bodyColPct` formula (token, unused) | — | 34.2vw | 492px |
| ThinkBlurb intro | ThinkBlurb | 36.5vw (0.48 × col) | 525px |
| Welcome body copy | page.tsx | 41.0vw (54% of col) | 590px |
| TextBlock paragraphs | TextBlock | 45.6vw (60% of col) | 656px |
| Welcome closing line | page.tsx | 53.2vw (70% of col) | 766px |
| Case panel body/pullquotes | WorkCaseStudyPanel / ThinkCasePanel | 760px (absolute) | 760px |
| Footer blurb | Footer | 864px (60% of viewport) | 864px |
| Contact form | TalkOptions | 500px (absolute) | 500px |

---

## Open questions for Mark

### "These probably should share a token"
1. **Welcome body vs. TextBlock body (54% vs. 60%)** — these are both page-level prose paragraphs but arrive at different effective widths (590px vs. 656px). If the intent is the same reading width, they should use the same value. If TextBlock prose is meant to be wider (it lives in a denser, scrollable context where longer lines are OK), the difference is deliberate.

2. **ThinkBlurb's 0.48 × col.vw (525px)** — sits between welcome body (590px) and `bodyColPct` (492px). It reads as page-level text (below the animation, same hierarchy as the welcome paragraphs). If it should align with welcome body copy, change `WIDTH_FACTOR` to match. If it should be its own width because it's visually tied to the animation above it, keep it independent but name the constant better.

3. **`bodyColPct` is 45% (492px) but no component uses it** — either the token value is wrong (should it be ~54–60%?), or all the components are wider than intended. Worth setting one number and having the key components match it.

### "Probably legitimately independent"
4. **Case panel 760px absolute caps** — reading-length caps in a panel context are a valid technique (they prevent ultra-long lines at wide viewports regardless of layout). But at tablet widths (768px viewport, panel ≈ 680px), the 760px cap never activates — effectively full-width text on tablet. Whether that's fine or not is a design call.

5. **ThinkCasePanel subtitle at 640px vs. 760px body** — the subtitle is narrower than its body text, which is unusual. Could be intentional (subtitles are bold, narrower feels weightier) or it could be a leftover from a different design iteration.

6. **TalkOptions 500px form cap** — this is a standard form-width convention and is likely correct as-is; including it here for completeness.

7. **Footer 60% blurb** — legitimately independent (the footer is full-bleed, not inside the content column). Leave it.
