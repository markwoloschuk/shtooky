// Shared authoring format for the case-study markdown behind BOTH the Work
// case panels and the Think cards.
//
// Each panel used to carry its own copy of everything in this file, with a
// comment asking whoever edited one to keep the other in step. They drifted
// anyway — Work grew [jobbox] and [label], Think grew a stricter frontmatter
// parser and [img] — which is why the parsing lives here now and the panels
// keep only their own rendering.
//
// THE FORMAT
//
//   ---                        frontmatter: `key: value`, one per line
//   imagePath: /images/work/…
//   ---
//
//   [blockname]                a block runs until the next line starting with '['
//   content…
//
//   // any line starting with // is a comment and never reaches the page
//
// Inside block content:
//   <text>        renders in the page's accent colour
//   [br]          a line break. A [br] at the END of a line is ONE break —
//                 without that rule the collapsed newline leaves a stray
//                 leading space, and under white-space: pre-line it would
//                 produce a second break.
//   blank line    inside a paragraph-type block, starts a NEW block, so prose
//                 doesn't need a tag per paragraph.

import React from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface GalleryOffset {
  index: number   // 1-based, matches image position in folder order
  x: number       // position nudge, % (default 0)
  y: number       // position nudge, % (default 0)
  scale: number   // % (default 100 = no change)
}

export interface GalleryVideoLink {
  index: number                        // same 1-based full-folder-list numbering as offsets
  source: 'youtube' | 'vimeo' | 'file'
  id?: string                          // YouTube or Vimeo video ID
  src?: string                         // path to the video file (source: 'file')
  poster?: string                      // explicit override; omitted = auto
}

export interface GalleryData {
  source: string          // folder name (relative to imagePath) or full path
  columns: number         // desktop grid column count ("Nup")
  crop?: '4by3' | '16by9' | '1by1' | '2by3'  // 2by3 is portrait
  noClick?: boolean       // true = disable lightbox
  heroHeight?: number     // px; omitted = no hero, straight grid
  offsets: GalleryOffset[]
  videos: GalleryVideoLink[]
}

export interface CaseBlock {
  type: string
  content: string
  fields?: Record<string, string>   // key-value blocks (e.g. [jobbox]) only
  paragraphs?: string[]             // groupParagraphs blocks only
  pull?: PullSpec                   // pullBlocks only
}

// ── Pull quotes (About dialect) ──────────────────────────────────────────────
// The choreography lives in the CONTENT, not a side module, because it is
// content-coupled: change the words and the direction changes with them.

export interface PullChunk {
  text: string
  line: number      // chunks sharing a line render side by side
  delay: number
  wipe: boolean
  fade: boolean
  push: boolean
}

export interface PullSpec {
  duration: number
  feather: number
  pushX: number
  pushY: number
  colorDelay: number
  colorDurIn: number
  colorHold: number
  colorDurOut: number
  chunks: PullChunk[]
}

// Omit any field to get its default. ONE rule, no exceptions — which is why it
// is "documented default" and not "assume 0": duration 0 would never animate
// and feather 0 would give a hard wipe edge.
export const PULL_DEFAULTS = {
  duration:    1500,
  feather:       60,
  pushX:          0,
  pushY:          0,
  colorDelay:     0,
  colorDurIn:     0,
  colorHold:      0,
  colorDurOut:    0,
}
const PULL_FLAGS = new Set(['wipe', 'fade', 'push'])

// ── Text ─────────────────────────────────────────────────────────────────────

// `<text>` becomes accent-coloured; `[br]` becomes a line break.
export function parseAccents(text: string, accent: string): React.ReactNode[] {
  const parts = text.split(/(<[^>]+>)/)
  return parts.map((part, i) => {
    if (part.startsWith('<') && part.endsWith('>')) {
      return <span key={i} style={{ color: accent }}>{part.slice(1, -1)}</span>
    }
    const lines = part.split('[br]')
    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>{line}{j < lines.length - 1 && <br />}</span>
    ))
  })
}

// A `[br]` at end-of-line is one break; a trailing `[br]` is dropped.
export function normBreaks(t: string): string {
  return t.replace(/\[br\][ \t]*\n/g, '[br]').replace(/(?:\[br\][ \t]*)+$/, '').trim()
}

// Must run before anything else looks at the file — the block splitter would
// otherwise glue a stray note onto the END of the preceding block and render it.
export function stripComments(raw: string): string {
  return raw.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n')
}

// ── Frontmatter ──────────────────────────────────────────────────────────────

// Simple `key: value` frontmatter — not a general YAML parser, just enough for
// a fixed, known set of fields. `defaults` doubles as the whitelist: a key that
// isn't already on the object is ignored, so stray lines can't invent fields.
export function parseFrontmatter<T extends Record<string, string>>(
  raw: string, defaults: T,
): { fm: T; rest: string } {
  const fm = { ...defaults }
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { fm, rest: raw }
  const [, fmBlock, rest] = match
  for (const line of fmBlock.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const key = m[1] as keyof T
    if (key in fm) fm[key] = m[2].trim() as T[keyof T]
  }
  return { fm, rest }
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export interface ParseBlocksOptions {
  allowed: Set<string>            // whitelist — unknown block types are skipped
  keyValue?: Set<string>          // parsed into `fields` instead of `content`
  splitParagraphs?: Set<string>   // a blank line here starts a new SIBLING block
  groupParagraphs?: Set<string>   // a blank line here makes another paragraph
                                  // INSIDE one block -> block.paragraphs[]
  pullBlocks?: Set<string>        // parsed into `pull` (options + chunks)
}

// splitParagraphs vs groupParagraphs — the difference matters for sequencing.
// Work and Think want siblings: each paragraph is its own block with its own
// margin. About wants a GROUP: one block is one sequence gate, and the blank
// lines inside it are paragraphs that share that gate. Same authoring, two
// structures, so the dialect picks.

// ── [pull] ───────────────────────────────────────────────────────────────────
//   duration: 1000            <- options, one per line, any may be omitted
//   pushY: 18
//   > But wait,        | fade, push        <- '>' starts a new LINE
//   + there's {more}   | delay 500, fade   <- '+' continues the SAME line
//
// '>' / '+' replace hand-written line numbers, which were pure bookkeeping.
export function parsePullBlock(raw: string, warn = true): PullSpec {
  const spec: PullSpec = { ...PULL_DEFAULTS, chunks: [] }
  let line = 0

  for (const rawLine of raw.split('\n')) {
    const l = rawLine.trim()
    if (!l) continue

    if (l.startsWith('>') || l.startsWith('+')) {
      if (l.startsWith('>')) line += 1
      if (line === 0) line = 1          // a leading '+' still needs a line
      const [textPart, flagPart = ''] = l.slice(1).split('|')
      const chunk: PullChunk = {
        text: textPart.trim(),
        line,
        delay: 0,
        wipe: false,
        fade: false,
        push: false,
      }
      for (const tok of flagPart.split(',').map(t => t.trim()).filter(Boolean)) {
        const d = tok.match(/^delay\s+(\d+)$/)
        if (d) { chunk.delay = parseInt(d[1], 10); continue }
        if (PULL_FLAGS.has(tok)) { (chunk as never as Record<string, boolean>)[tok] = true; continue }
        if (warn) console.warn(`[pull] unknown flag "${tok}" in: ${l}`)
      }
      spec.chunks.push(chunk)
      continue
    }

    const m = l.match(/^(\w+):\s*(-?\d+)$/)
    if (m && m[1] in PULL_DEFAULTS) {
      (spec as never as Record<string, number>)[m[1]] = parseInt(m[2], 10)
      continue
    }
    // Silent drops are invisible failure: a typo'd `pushy:` would just become
    // the default and the animation would quietly not do what it was told.
    if (warn) console.warn(`[pull] unknown option line: ${l}`)
  }

  return spec
}

export function parseBlocks(body: string, opts: ParseBlocksOptions): CaseBlock[] {
  const { allowed, keyValue, splitParagraphs, groupParagraphs, pullBlocks } = opts
  const blocks: CaseBlock[] = []

  for (const sec of body.trim().split(/\n(?=\[)/)) {
    const match = sec.match(/^\[(\S+)\]\s*\n?([\s\S]*)/)
    if (!match) continue
    const type = match[1]
    if (!allowed.has(type)) continue
    const raw = match[2].trim()

    if (keyValue?.has(type)) {
      const fields: Record<string, string> = {}
      for (const line of raw.split('\n')) {
        const m = line.match(/^(\w+):\s*(.*)$/)
        if (m) fields[m[1]] = m[2].trim()
      }
      blocks.push({ type, content: '', fields })
      continue
    }

    if (pullBlocks?.has(type)) {
      blocks.push({ type, content: '', pull: parsePullBlock(raw) })
      continue
    }

    if (groupParagraphs?.has(type)) {
      const paragraphs = raw
        .split(/\n\s*\n/)
        .map(pa => normBreaks(pa))
        .filter(Boolean)
      if (paragraphs.length) blocks.push({ type, content: paragraphs.join('\n\n'), paragraphs })
      continue
    }

    if (splitParagraphs?.has(type)) {
      for (const para of raw.split(/\n\s*\n/)) {
        const t = normBreaks(para)
        if (t) blocks.push({ type, content: t })
      }
      continue
    }

    blocks.push({ type, content: normBreaks(raw) })
  }

  return blocks
}

// ── Paths ────────────────────────────────────────────────────────────────────

export function resolveImagePath(imagePath: string, filename: string): string {
  const base = imagePath.endsWith('/') ? imagePath : `${imagePath}/`
  return `${base}${filename}`
}

// Media referenced from a `video { }` entry is relative to the case's
// imagePath unless it starts with '/'.
export function resolveMedia(p: string, imagePath: string): string {
  return p.startsWith('/') ? p : resolveImagePath(imagePath, p)
}

// Rewrites a gallery's video src/poster to absolute URLs, so SiteGallery only
// ever sees plain absolute paths and needs to know nothing about imagePath.
export function resolveGalleryMedia(gallery: GalleryData, imagePath: string): GalleryData {
  return {
    ...gallery,
    videos: gallery.videos.map(v => ({
      ...v,
      src: v.src ? resolveMedia(v.src, imagePath) : v.src,
      poster: v.poster ? resolveMedia(v.poster, imagePath) : v.poster,
    })),
  }
}

// ── [gallery] ────────────────────────────────────────────────────────────────

// Expected shape:
//   folderName-or-/full/path/
//   Nup, crop(optional: 4by3|16by9|1by1|2by3), noClick(optional)
//   hero, heightPx        <- entire line omitted = no hero
//   offset {
//     [1, 20x, 50y, 100s],
//     [4, -50x, 25y, 120s]
//   }
//   video {
//     [3, youtube, dQw4w9WgXcQ],
//     [9, file, production/reel-01.mp4],
//     [12, vimeo, 76979871, custom-poster.jpg]
//   }
// Missing offset x/y/s values default to 0/0/100 (no change).
// video entries: index, source (youtube|vimeo|file), id-or-path, poster
// (optional override — omitted means auto: YouTube gets its free thumbnail,
// everything else falls back to the folder image already at that index).
// Paths are relative to the case's imagePath unless they start with '/'.
export function parseGalleryBlock(content: string): GalleryData {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)

  const source = lines[0] ?? ''

  const line2 = (lines[1] ?? '').split(',').map(s => s.trim())
  const columns = parseInt(line2[0]?.replace(/up$/i, '') ?? '', 10) || 3
  const CROP_TOKENS = new Set(['4by3', '16by9', '1by1', '2by3'])
  let crop: GalleryData['crop']
  let noClick = false
  for (const tok of line2.slice(1)) {
    if (CROP_TOKENS.has(tok)) crop = tok as GalleryData['crop']
    if (tok === 'noClick') noClick = true
  }

  let heroHeight: number | undefined
  let offsetStartLine = 2
  if (lines[2]?.toLowerCase().startsWith('hero')) {
    const parts = lines[2].split(',').map(s => s.trim())
    heroHeight = parseInt(parts[1] ?? '', 10) || undefined
    offsetStartLine = 3
  }

  const offsets: GalleryOffset[] = []
  const remaining = lines.slice(offsetStartLine).join(' ')
  // Non-greedy — with two possible bracketed blocks (offset, video) sharing
  // `remaining`, a greedy `[\s\S]*` would swallow past its own closing brace
  // into whichever block comes second.
  const offsetMatch = remaining.match(/offset\s*\{([\s\S]*?)\}/)
  if (offsetMatch) {
    const entries = offsetMatch[1].match(/\[[^\]]+\]/g) ?? []
    for (const entry of entries) {
      const parts = entry.slice(1, -1).split(',').map(s => s.trim())
      const index = parseInt(parts[0], 10)
      if (isNaN(index)) continue
      let x = 0, y = 0, scale = 100
      for (const p of parts.slice(1)) {
        if (p.endsWith('x')) x = parseFloat(p) || 0
        else if (p.endsWith('y')) y = parseFloat(p) || 0
        else if (p.endsWith('s')) scale = parseFloat(p) || 100
      }
      offsets.push({ index, x, y, scale })
    }
  }

  const videos: GalleryVideoLink[] = []
  const videoMatch = remaining.match(/video\s*\{([\s\S]*?)\}/)
  if (videoMatch) {
    const entries = videoMatch[1].match(/\[[^\]]+\]/g) ?? []
    for (const entry of entries) {
      const parts = entry.slice(1, -1).split(',').map(s => s.trim())
      const index = parseInt(parts[0], 10)
      const src = parts[1] as GalleryVideoLink['source']
      if (isNaN(index) || !['youtube', 'vimeo', 'file'].includes(src)) continue
      const video: GalleryVideoLink = { index, source: src }
      if (src === 'file') video.src = parts[2]
      else video.id = parts[2]
      if (parts[3]) video.poster = parts[3]
      videos.push(video)
    }
  }

  return { source, columns, crop, noClick, heroHeight, offsets, videos }
}
