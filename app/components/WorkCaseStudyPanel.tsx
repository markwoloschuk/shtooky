'use client'

// TYPE ROLES USED IN THIS FILE:
//   body paragraphs  → TYPE_TIERS.CASE_BODY  (sizePx, weight, lineHeight, tracking)
//   pull-quote blocks → TYPE_TIERS.PULLQUOTE  (sizePx, weight, lineHeight)
//   job box labels   → TYPE_TIERS.JOB_LABEL  (sizePx only — weight/tracking retained hardcoded)
//   job box values   → TYPE_TIERS.JOB_VALUE  (sizePx only — was a bare 17)
//   case subtitle    → TYPE_TIERS.CASE_SUBTITLE (sizePx, weight, lineHeight, tracking)
//   [label] blocks   → TYPE_TIERS.JOB_LABEL  (shares the job box label treatment)
//   video counter    → TYPE_TIERS.CAPTION     (sizePx — matched, not yet wired)

import { useState } from 'react'
import { TYPE, COLORS, SPACE, useType, useColumn, useSpace, bodyMaxWidth } from './SiteTokens'
import SiteGallery from './SiteGallery'
import { useCasePanel } from './SiteCasePanel'
import { JOB_FIELDS } from '../data/WorkManifest'
import {
  parseAccents, parseFrontmatter, parseBlocks, parseGalleryBlock, stripComments,
  resolveImagePath, resolveGalleryMedia,
  type CaseBlock, type GalleryData,
} from './SiteCaseMarkdown'

const PINK = COLORS.work
const FADE_DUR = 2000
// How long the OUTGOING card takes to clear on a step. Independent of
// FADE_DUR: the wait after pressing next and the luxury of the fade-in are
// two different gestures. Untuned starting value.
// ── STEP (prev/next) ─────────────────────────────────────────────────────────
// A different gesture from opening a card, so it gets its own numbers rather
// than borrowing the reveal's. No stagger: the reader is already reading and
// wants the next case, not a performance. Tuned by eye 2026-08-28.
const STEP_OUT = 50      // outgoing card clears, and the wait before the swap
const STEP_IN = 1500       // incoming blocks arrive, all together
const STEP_OFFSET = 10    // slight ripple, far tighter than the open's stagger
const FADE_OFFSET = 10
// See ThinkCasePanel. 0 = unchanged behaviour; raise it if the body copy starts
// arriving before the carousel headline has settled.
const OPEN_DELAY = 0


// Frontmatter now carries ONLY imagePath. Title/client/role/delivery moved
// into the [jobbox] block so the file's block order is the render order.
interface Frontmatter {
  imagePath: string
}

interface ParsedCase {
  frontmatter: Frontmatter
  blocks: CaseBlock[]
}

// Which blocks a Work case may use, and how each behaves. Everything else —
// the format itself, [br] handling, comments — lives in SiteCaseMarkdown.tsx.
const WORK_BLOCKS = new Set(['jobbox', 'subtitle', 'label', 'paragraph', 'pullquote', 'video-carousel', 'gallery'])

function parseMd(raw: string): ParsedCase {
  const { fm, rest } = parseFrontmatter(stripComments(raw), { imagePath: '' })
  return {
    frontmatter: fm,
    blocks: parseBlocks(rest, {
      allowed: WORK_BLOCKS,
      keyValue: new Set(['jobbox']),
      splitParagraphs: new Set(['paragraph']),
    }),
  }
}


interface Props {
  caseFile: string | null   // e.g. 'WorkCase01'
  caseIdx: number | null    // 0-based index — no longer used inside this file (gallery paths now come from frontmatter's imagePath); left in Props since the caller may still pass/rely on it elsewhere
  visible: boolean
}

export default function CaseStudyPanel({ caseFile, caseIdx, visible }: Props) {
  const type = useType()
  const col = useColumn()
  const space = useSpace()
  // One gap from the carousel's bottom edge to whatever block leads the file.
  // Previously this was split in two — a pad on the panel PLUS a pad on the
  // job box — which meant the gap silently changed depending on whether
  // [jobbox] or [subtitle] came first, and the job box carried a stray 20px
  // with it if it ever moved down the page.
  const panelPaddingTop = space(SPACE.layout.bandDetailGap)

  // Shared with ThinkCasePanel — see SiteCasePanel.tsx. Only the endpoint, the
  // parser, the slot count and this panel's own fade timings stay here.
  const { parsed, blockOps, fadeMs } = useCasePanel<ParsedCase>({
    file: caseFile,
    visible,
    endpoint: f => `/api/case/${f}`,
    parse: parseMd,
    slots: p => p.blocks.length,
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
      paddingLeft: `${col.marginVw}vw`,
      paddingRight: `${col.marginVw}vw`,
        paddingTop: panelPaddingTop,
        paddingBottom: 80,
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Content blocks */}
      {blocks.map((block, i) => {
        const op = blockOps[i] ?? 0
        const style = { opacity: op, transition: `opacity ${fadeMs}ms ease` }
        // Keyed by FILE + index, not index alone. On a next/prev step the
        // block list keeps its shape and only its values change, so an
        // index key lets React reuse the same DOM nodes and rewrite their
        // text in place. Each node carries an opacity transition, which
        // promotes it to its own composited layer — and a layer whose
        // contents are rewritten underneath it is where Safari leaves a
        // stale tile (fragments of the previous card painted under the
        // new one). The file in the key forces a real unmount/mount.
        const blockKey = `${caseFile}-${i}`

        if (block.type === 'jobbox') {
          const f = block.fields ?? {}
          return (
            <div key={blockKey} style={{
              ...style,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: 'auto auto',
              gridAutoFlow: 'column',
              gap: '24px 30px',
              marginBottom: 28,
            }}>
              {JOB_FIELDS.filter(({ key }) => f[key]).map(({ label, key }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: type.JOB_LABEL.sizePx, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>{label}</span>
                  <span style={{ fontSize: type.JOB_VALUE.sizePx, color: '#fff', fontFamily: TYPE.display }}>{f[key]}</span>
                </div>
              ))}
            </div>
          )
        }

        // Section label — same treatment as the job box labels, deliberately
        // sharing JOB_LABEL rather than earning a role of its own.
        if (block.type === 'label') {
          return (
            <p key={blockKey} style={{ ...style, fontSize: type.JOB_LABEL.sizePx, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display, marginBottom: 10 }}>
              {block.content}
            </p>
          )
        }

        if (block.type === 'subtitle') {
          return (
            <p key={blockKey} style={{ ...style, fontSize: type.CASE_SUBTITLE.sizePx, fontWeight: type.CASE_SUBTITLE.weight, lineHeight: type.CASE_SUBTITLE.lineHeight, letterSpacing: `${type.CASE_SUBTITLE.tracking}em`, color: '#fff', maxWidth: bodyMaxWidth(col), marginBottom: 28, fontFamily: TYPE.display, whiteSpace: 'pre-line' }}>
              {parseAccents(block.content, PINK)}
            </p>
          )
        }

        if (block.type === 'paragraph') {
          return (
            <p key={blockKey} style={{ ...style, fontSize: type.CASE_BODY.sizePx, fontWeight: type.CASE_BODY.weight, lineHeight: type.CASE_BODY.lineHeight, letterSpacing: `${type.CASE_BODY.tracking}em`, color: 'rgba(255,255,255,0.6)', maxWidth: bodyMaxWidth(col), marginBottom: 28, fontFamily: TYPE.display }}>
              {parseAccents(block.content, PINK)}
            </p>
          )
        }

        if (block.type === 'pullquote') {
          return (
            <p key={blockKey} style={{ ...style, fontSize: type.PULLQUOTE.sizePx, fontWeight: type.PULLQUOTE.weight, lineHeight: type.PULLQUOTE.lineHeight, color: '#fff', maxWidth: bodyMaxWidth(col), marginBottom: 28, fontFamily: TYPE.display, whiteSpace: 'pre-line' }}>
              {parseAccents(block.content, PINK)}
            </p>
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

// ── Inline sub-components (VideoCarousel and ImageGallery import separately) ──

function VideoCarouselInline({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0)
  const col = useColumn()
  if (!urls.length) return null
  const embedUrl = toEmbed(urls[idx])
  return (
    <div style={{ marginBottom: 28, maxWidth: bodyMaxWidth(col) }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
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
  background: PINK, border: 'none', color: COLORS.white, fontSize: 20,
  width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function GalleryInline({ path, gallery }: { path: string; gallery: GalleryData }) {
  return <SiteGallery path={path} gallery={gallery} />
}