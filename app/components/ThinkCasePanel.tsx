'use client'

// TYPE ROLES USED IN THIS FILE:
//   body paragraphs      → TYPE_TIERS.CASE_BODY  (sizePx, weight, lineHeight, tracking)
//   card subtitle        → TYPE_TIERS.SUBTITLE   (sizePx, weight)
//   pull-quote blocks    → TYPE_TIERS.PULLQUOTE  (sizePx, weight, lineHeight)
//   figcaption / counter → TYPE_TIERS.CAPTION    (sizePx — matched, not yet wired)
//   [label] blocks       → TYPE_TIERS.JOB_LABEL  (shared with the Work job box labels)

import { useState } from 'react'
import { TYPE, COLORS, useType, useColumn, bodyMaxWidth } from './SiteTokens'
import SiteGallery from './SiteGallery'
import { useCasePanel } from './SiteCasePanel'
import {
  parseAccents, parseFrontmatter, parseBlocks, parseGalleryBlock, stripComments,
  resolveImagePath, resolveGalleryMedia,
  type CaseBlock, type GalleryData,
} from './SiteCaseMarkdown'

const ACCENT = COLORS.thinking
const FADE_DUR = 1000
// How long the OUTGOING card takes to clear on a step. Independent of
// FADE_DUR: the wait after pressing next and the luxury of the fade-in are
// two different gestures. Untuned starting value.
// ── STEP (prev/next) ─────────────────────────────────────────────────────────
// A different gesture from opening a card, so it gets its own numbers rather
// than borrowing the reveal's. No stagger: the reader is already reading and
// wants the next case, not a performance. All untuned starting values.
const STEP_OUT = 100      // outgoing card clears, and the wait before the swap
const STEP_IN = 750       // incoming blocks arrive, all together
const STEP_OFFSET = 10    // slight ripple, far tighter than the open's stagger
const FADE_OFFSET = 25
// Lead-in before the body copy starts arriving on an OPEN, so it does not race
// the card into place. Starting value = ThinkGridCanvas's TRANSITION_DURATION
// (750), i.e. "begin once the card has landed". NOT linked to it in code — if
// that number moves, this one has to be moved by hand.
const OPEN_DELAY = 750

interface Frontmatter {
  title: string
  narrowtitle: string
  subtitle: string
  imagePath: string
}

interface ParsedCard {
  frontmatter: Frontmatter
  blocks: CaseBlock[]
}

// Which blocks a Think card may use. The format itself — [br] handling,
// comments, blank-line paragraphs — lives in SiteCaseMarkdown.tsx, shared with
// the Work case panels.
//
// Note the frontmatter here is NOT optional the way Work's is: `title` and
// `narrowtitle` are read server-side by /api/think/manifest and painted on
// the grid by ThinkGridCanvas, so they have to stay frontmatter rather than
// moving into a block the way Work's job box did.
const THINK_BLOCKS = new Set(['label', 'paragraph', 'pullquote', 'video-carousel', 'gallery', 'img'])

function parseMd(raw: string): ParsedCard {
  const { fm, rest } = parseFrontmatter(stripComments(raw), {
    title: '', narrowtitle: '', subtitle: '', imagePath: '',
  })
  return {
    frontmatter: fm,
    blocks: parseBlocks(rest, {
      allowed: THINK_BLOCKS,
      splitParagraphs: new Set(['paragraph']),
    }),
  }
}

interface Props {
  cardFile: string | null
  visible: boolean
}

export default function ThinkCasePanel({ cardFile, visible }: Props) {
  const type = useType()
  const col = useColumn()
  // All of the fetch / cache / fade / step machinery lives in useCasePanel,
  // shared with WorkCaseStudyPanel. What stays here is the last mile: which
  // endpoint, how to parse it, how many fading slots the JSX below needs, and
  // this panel's own fade timings.
  const { parsed, blockOps, fadeMs } = useCasePanel<ParsedCard>({
    file: cardFile,
    visible,
    endpoint: f => `/api/think/${f}`,
    parse: parseMd,
    slots: p => p.blocks.length + 1, // +1 for the subtitle row, which fades too
    fadeDurMs: FADE_DUR,
    fadeOutMs: STEP_OUT,
    stepFadeInMs: STEP_IN,
    stepFadeOffsetMs: STEP_OFFSET,
    openDelayMs: OPEN_DELAY,
    fadeOffsetMs: FADE_OFFSET,
  })

  if (!parsed) return null

  const { frontmatter: fm, blocks } = parsed

  return (
    <div style={{
      paddingTop: 0,
      paddingBottom: 80,
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Subtitle row */}
      <div style={{
        marginBottom: 32,
        paddingTop: 0,
        opacity: blockOps[0] ?? 0,
        transition: `opacity ${fadeMs}ms ease`,
      }}>
        <p style={{
          fontSize: type.SUBTITLE.sizePx,
          fontWeight: type.SUBTITLE.weight,
          color: COLORS.white,
          fontFamily: TYPE.display,
          margin: 0,
          maxWidth: 640,
        }}>
          {fm.subtitle}
        </p>
      </div>

      {/* Content blocks */}
      {blocks.map((block, i) => {
        const op = blockOps[i + 1] ?? 0
        const style = { opacity: op, transition: `opacity ${fadeMs}ms ease` }
        // Keyed by FILE + index, not index alone. On a next/prev step the
        // block list keeps its shape and only its values change, so an
        // index key lets React reuse the same DOM nodes and rewrite their
        // text in place. Each node carries an opacity transition, which
        // promotes it to its own composited layer — and a layer whose
        // contents are rewritten underneath it is where Safari leaves a
        // stale tile (fragments of the previous card painted under the
        // new one). The file in the key forces a real unmount/mount.
        const blockKey = `${cardFile}-${i}`

        // Section label — same treatment as the Work job box labels, in the
        // thinking accent rather than pink.
        if (block.type === 'label') {
          return (
            <p key={blockKey} style={{ ...style, fontSize: type.JOB_LABEL.sizePx, fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display, marginBottom: 10 }}>
              {block.content}
            </p>
          )
        }

        if (block.type === 'paragraph') {
          return (
            <p key={blockKey} style={{ ...style, fontSize: type.CASE_BODY.sizePx, fontWeight: type.CASE_BODY.weight, lineHeight: type.CASE_BODY.lineHeight, letterSpacing: `${type.CASE_BODY.tracking}em`, color: 'rgba(255,255,255,0.6)', maxWidth: bodyMaxWidth(col), marginBottom: 28, fontFamily: TYPE.display }}>
              {parseAccents(block.content, ACCENT)}
            </p>
          )
        }

        if (block.type === 'pullquote') {
          return (
            <p key={blockKey} style={{ ...style, fontSize: type.PULLQUOTE.sizePx, fontWeight: type.PULLQUOTE.weight, lineHeight: type.PULLQUOTE.lineHeight, color: COLORS.white, maxWidth: bodyMaxWidth(col), marginBottom: 28, fontFamily: TYPE.display, whiteSpace: 'pre-line' }}>
              {parseAccents(block.content, ACCENT)}
            </p>
          )
        }

        if (block.type === 'img') {
          const lines = block.content.split('\n').map(l => l.trim()).filter(Boolean)
          const filename = lines[0]
          const caption = lines[1]
          const src = resolveImagePath(fm.imagePath, filename)
          return (
            <div key={blockKey} style={{ ...style, maxWidth: bodyMaxWidth(col), marginBottom: 28 }}>
              <ImageBlockInline src={src} caption={caption} />
            </div>
          )
        }

        if (block.type === 'video-carousel') {
          const urls = block.content.split('\n').map(u => u.trim()).filter(Boolean)
          return (
            <div key={blockKey} style={style}>
              <VideoCarouselInline urls={urls} />
            </div>
          )
        }

        if (block.type === 'gallery') {
          const gallery = parseGalleryBlock(block.content)
          const path = gallery.source.includes('/')
            ? gallery.source
            : resolveImagePath(fm.imagePath, gallery.source)
          const resolved = resolveGalleryMedia(gallery, fm.imagePath)
          return (
            <div key={blockKey} style={style}>
              <GalleryInline path={path} gallery={resolved} />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// Locked spec: fixed 16:9 frame, full text-column width, always
// dead-center crop. Wider-than-16:9 source crops at the sides and
// fills top-to-bottom; narrower-than-16:9 source scales up so width
// fills the frame. No per-instance width/aspect/offset options.
function ImageBlockInline({ src, caption }: { src: string; caption?: string }) {
  return (
    <figure style={{ margin: 0 }}>
      <div style={{
        position: 'relative',
        paddingBottom: '56.25%',
        background: COLORS.dark,
        overflow: 'hidden',
      }}>
        <img
          src={src}
          alt={caption || ''}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      </div>
      {caption && (
        <figcaption style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontFamily: TYPE.display }}>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

function VideoCarouselInline({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0)
  const col = useColumn()
  if (!urls.length) return null
  const embedUrl = toEmbed(urls[idx])
  return (
    <div style={{ marginBottom: 28, maxWidth: bodyMaxWidth(col) }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: COLORS.dark }}>
        <iframe
          key={embedUrl}
          src={embedUrl}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {urls.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)} style={navBtnStyle}>‹</button>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, alignSelf: 'center' }}>{idx + 1} / {urls.length}</span>
          <button onClick={() => setIdx(i => (i + 1) % urls.length)} style={navBtnStyle}>›</button>
        </div>
      )}
    </div>
  )
}

function toEmbed(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  return url
}

const navBtnStyle: React.CSSProperties = {
  background: COLORS.thinking, border: 'none', color: COLORS.dark, fontSize: 20,
  width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
}

function GalleryInline({ path, gallery }: { path: string; gallery: GalleryData }) {
  return <SiteGallery path={path} gallery={gallery} />
}