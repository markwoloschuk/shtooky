# spec — Work carousel: a variable card count

*v01 — 2026-09-02. Companion to `project-bible_2026-09-02_v84.md`. Read alongside
the bible; this is an ADDENDUM, not a superseding document.*

---

## The ask, in Mark's words

> *"I know we designed the work manifest so that we could change up the content
> relatively easily... but must I always have 7? Is the carousel designed to work
> properly with 7 or does it scale up and down based on how the manifest is
> loaded?"*

And, once the direction was clear:

> *"I'm interested in being able to have less — not more. **7 as the upper bound**
> — but possibly reducing down to **6 or 5** in some special cases."*

So the capability wanted is **a Work page that can present five, six or seven
cases from the same manifest**, chosen per situation — most plausibly a version
of the site tailored to a particular role or application, where three of the
seven are not the right argument.

This is not a rebuild. It is one line of code, plus a bounded visual pass.

---

## What was verified (2026-09-02, by reading the repo — not assumed)

### The geometry already scales. The COUNT does not.

Everything about the carousel's layout derives from one constant:

```
WorkCarousel.tsx:43   const N      = 7
WorkCarousel.tsx:46   const BASE_W = CW / N          // CW = 1440 native
```

`N` drives all of it: slice width, every per-slice array (`new Array(N)` — widths,
zooms, chromas, image offsets, snapshots, slice colours), the hover share-out
(`shrink = exp / (N - 1)`), and the next/prev wrap (`(idx + dir + N) % N`).

**Change `N` and the carousel re-proportions itself correctly.** The strip always
sums to `CW`, so it fills edge to edge at any count with no gap to manage.

### But `N` is not connected to the manifest

`const N = 7` is a second, independent assertion of a fact `WORK_MANIFEST`
already states. They agree today at seven, which is exactly why nothing has gone
wrong yet. **This is the v84 habit — a value two systems both believe they own —
and it is currently latent rather than harmless.**

Consequences today:

| change | what happens |
|---|---|
| swap a card for an alternate, in place | **safe.** Image, headline, offsets and `contentFile` are all read per entry |
| reorder entries | **safe** |
| drop to 6 or 5 entries | **broken.** Seven slices still draw; the extra ones read `WORK_MANIFEST[5]`/`[6]` as `undefined` — a blank slice, no image, no headline |
| add an 8th | **silently ignored.** Never drawn |

### `slot` is a dead field — checked

`WORK_MANIFEST` entries carry `slot: 1..7`. **Nothing reads it.** Searched the
whole app; the only other `slot` hits are Think's `titleForSlot`/`bandTitleForSlot`
(unrelated, takes a grid index) and the `[slot]` content block (unrelated
markup).

So `slot` is decorative documentation of array order. **Removing an entry cannot
leave a gap, and the remaining entries do not need renumbering.** A five-card
manifest can be any five of the seven, in any order.

*Decision for next session: either delete `slot` as dead weight, or keep it and
say in a comment that it is documentation only. It should not survive as a field
that LOOKS load-bearing while being read by nothing — v78's "a parameter accepted
and never read is a lie the compiler won't catch."*

### Image loading is already manifest-driven

`imgsRef.current = WORK_MANIFEST.map(...)` — builds exactly as many images as
there are entries. No change needed.

---

## The change

```ts
// WorkCarousel.tsx:43
const N = WORK_MANIFEST.length
```

That is the whole structural fix. `WORK_MANIFEST` is already imported at line 4.

**Do it while it is still a no-op at seven.** Same argument as the `768` →
`BREAKPOINTS.tablet` fix in v84: make the count honest at a moment when the change
cannot alter anything, so that when the content DOES change there is only one
variable in play. Making this edit in the same session as a content change means
not knowing which one broke what.

### One thing to check when making it

`BASE_W` is a module-level `const` computed from `N` at module scope. Confirm it
still resolves correctly with `N` derived from an imported array — it should, since
the import is evaluated first, but **verify rather than assume**, because a
module-scope circular-ish dependency that yields `NaN` would produce a blank
carousel rather than an error.

---

## What changes visually, and what needs re-judging

Slice width in native units is `1440 / N`:

| cards | slice width | vs today |
|---|---|---|
| 7 | 206 | judged |
| 6 | 240 | +17% |
| 5 | 288 | +40% |

**Fewer cards is the friendly direction.** Slices get WIDER, so headlines gain
room rather than losing it, and the crop shows more of each photograph.

### 1. `offsetH` per card — the only real work

The manifest's horizontal nudges were tuned against a **206px-wide crop window**.
At 288 the window shows 40% more of the image horizontally, so a nudge that
centred a subject at seven will not centre it at five.

**The burden is smaller than it looks.** Only four of the seven carry a non-zero
`offsetH`:

```
WorkCase01  offsetH: 0     offsetV: 140
WorkCase02  offsetH: -259  offsetV: -4
WorkCase03  offsetH: 206   offsetV: -21
WorkCase04  offsetH: -43   offsetV: 114
WorkCase05  offsetH: 0     offsetV: 0
WorkCase06  offsetH: 0     offsetV: 0
WorkCase07  offsetH: 0     offsetV: 0
```

So a reduced set only needs a pass over whichever of **02, 03 and 04** survive
into it. `offsetV` should be unaffected — slice HEIGHT does not change with `N`.

**Open question for next session:** should `offsetH` become per-count? Almost
certainly not — that is a per-case number multiplied by three counts, which is the
kind of table that rots. More likely the reduced sets are rare enough that the
values are judged once for the set that gets built. **Decide before building
anything.**

### 2. Hover gets milder, not wilder

`CFG.HOV_EXPAND: 300` is an absolute native amount, so the hovered slice always
grows by 300px regardless of count, and the others give up `300 / (N - 1)` each —
50 at seven, 60 at six, 75 at five. Against a wider base that is a **smaller
proportional gesture.**

Expect five cards to feel calmer than seven. If it reads as too sedate,
`HOV_EXPAND` is the knob — and if it is ever tuned per count, it becomes a tiered
token rather than a constant.

### 3. Headlines gain room — a content decision

Two-liners like `'Time was short so we\nthrew out our best idea.'` have 40% more
width at five cards. Some may want to become one line. The `\n` in the manifest
headline is authored, so this is Mark's call per card, not a code change.

---

## What is NOT in scope

- **Going above seven.** Explicitly out — seven is the upper bound. Slices narrow
  to 160 at nine, and the headlines already run two lines at 206. If this ever
  comes back, the headline sizing is the first thing that breaks.
- **A per-count offsets table.** See the open question above.
- **Mobile.** Not investigated for this spec. `isMobileRef` / `MOBILE_BAND_HEIGHT_SCALE`
  exist, and whether the mobile presentation is also an N-wide strip or something
  else needs a look before a reduced count is trusted there. **Check this first
  next session** — it is the one place a five-card layout could be wrong in a way
  desktop does not reveal.

---

## Suggested order next session

1. Confirm how mobile presents the carousel, and whether `N` governs it too.
2. Make the one-line change at seven. Verify it is a no-op — the page should be
   pixel-identical.
3. Decide the `slot` field's fate (delete, or comment as documentation only).
4. Only then build a reduced manifest and judge `offsetH` on the survivors.

**Verification for step 2:** `npx tsc --noEmit`, then load `/work` and confirm the
strip is unchanged. If it renders blank, `BASE_W` resolved to `NaN` and the
module-scope evaluation order is the cause.

---

## Why this is filed as a spec rather than a horizon bullet

Mark's read: *"I think I need to have this capability more ready to go than I
thought."* The Work page is the primary artefact of a job search, and the ability
to present a five-case argument instead of a seven-case one is a **content
strategy capability**, not a refactor. It should be ready before it is needed,
not discovered as broken on the evening it is needed.
