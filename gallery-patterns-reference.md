# Gallery Patterns Reference

One `[gallery]` block, one parser, three usage patterns depending on whether — and how much — of it points to video. The folder you point `source` at always contains still images. What changes between the three patterns is whether a `video { }` mapping is present, and how much of the grid it covers.

---

## 1. Photo gallery (no video)

Every image in the folder displays as itself — in the grid, and in the lightbox on click. This is the original, unchanged behavior.

**Folder:** `/images/work/CaseStudy_01/` — just photos, in whatever order they should read.

```
[gallery]
CaseStudy_01
3up, 4by3
hero, 480
offset {
  [1, 20x, 50y, 100s],
  [4, -50x, 25y, 120s]
}
```

- `3up, 4by3` — 3 columns desktop, 4:3 crop on grid cells.
- `hero, 480` — first image in the folder becomes a 480px-tall hero above the grid; omit this line for a straight grid with no hero.
- `offset { }` — optional per-image nudge/scale, keyed by 1-based folder position (hero counts as position 1).
- No `video { }` block at all. Nothing here changed from before.

---

## 2. Linked video gallery (every slot is a video)

The grid *looks* like a photo gallery, but every cell is actually a poster — clicking any of them opens a video instead of the still. Useful for a reel, a set of process clips, anything where the whole gallery's job is "launch a video."

**Folder:** still needs one still image per position — either your own chosen poster frame, or (for YouTube) just a placeholder, since YouTube's own thumbnail wins by default and the folder image only kicks in if that fails.

```
[gallery]
ReelClips
3up, 16by9
video {
  [1, youtube, dQw4w9WgXcQ],
  [2, youtube, 5qap5aO4i9A],
  [3, vimeo, 76979871],
  [4, file, /videos/reel-04.mp4]
}
```

- Every position (1–4) has a matching `video` entry, so every grid cell behaves as a launcher — none of them ever show as a plain photo in the lightbox.
- `16by9` crop on the grid matches typical video framing; not required, just usually right for this pattern.
- No `poster` override given here, so posters auto-resolve: YouTube tries its own thumbnail first, Vimeo and self-hosted fall through to the folder image at that position.

---

## 3. Image-based video gallery (mixed — most photos, a few videos)

A normal photo gallery where *some* images are just photos, and a handful of specific ones are actually posters for a linked video. This is the "case study gallery that happens to have two process clips in it" pattern — the common case for embedding video inside a larger photo set.

**Folder:** all images as normal; the ones you're turning into video launchers are still real files at their normal folder position — they're what shows if you never click, and what backs up the poster if a video source's thumbnail fails.

```
[gallery]
CaseStudy_03
4up, 4by3
offset {
  [1, 10x, 0y, 105s]
}
video {
  [5, youtube, dQw4w9WgXcQ],
  [9, file, /videos/detail-shot.mp4, /images/work/CaseStudy_03/09-poster-override.jpg]
}
```

- 9 or more images total, but only positions 5 and 9 are video launchers. Everything else in the grid is a plain photo, click-to-lightbox as usual.
- `offset { }` still applies to any image regardless of whether it's also a video poster — the two systems don't interfere.
- Position 9 shows an explicit `poster` override as its 4th value — useful when you don't want the browser's own first-frame guess, or want a specific still rather than whatever YouTube auto-picked.

---

## Quick reference: what each `video` entry needs

| `source` | required 3rd value | poster resolves from (if 4th value omitted) |
|---|---|---|
| `youtube` | video ID (the 11-char code from the URL) | YouTube's own thumbnail (`maxresdefault` → `hqdefault` → your folder image if both fail) |
| `vimeo` | video ID (numeric) | your folder image at that position |
| `file` | path to the mp4 | your folder image at that position |

All three patterns share the same lightbox chrome — same prev/next arrows, same close button, same fade — the only thing that changes per item is whether the content pane shows an `<img>` or an embed/`<video>`.
