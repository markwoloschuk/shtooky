'use client'

// TYPE ROLES USED IN THIS FILE:
//   body paragraphs      → TYPE_TIERS.CASE_BODY  (sizePx, weight, lineHeight, tracking)
//   card subtitle        → TYPE_TIERS.SUBTITLE   (sizePx, weight)
//   pull-quote blocks    → TYPE_TIERS.PULLQUOTE  (sizePx, weight, lineHeight)
//   figcaption / counter → TYPE_TIERS.CAPTION    (sizePx — matched, not yet wired)
//   [label] blocks       → TYPE_TIERS.JOB_LABEL  (shared with the Work job box labels)

import { useEffect, useState } from 'react'
import { TYPE, COLORS, useType, useColumn, bodyMaxWidth } from './SiteTokens'
import SiteGallery from './SiteGallery'
import {
  parseAccents, parseFrontmatter, parseBlocks, parseGalleryBlock, stripComments,
  resolveImagePath, resolveGalleryMedia,
  type CaseBlock, type GalleryData,
} from './SiteCaseMarkdown'

const ACCENT = COLORS.thinking
const FADE_DUR = 1000
const FADE_OFFSET = 25

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
  const [parsed, setParsed] = useState<ParsedCard | null>(null)
  const [blockOps, setBlockOps] = useState<number[]>([])

  useEffect(() => {
    if (!cardFile) { setParsed(null); setBlockOps([]); return }
    fetch(`/api/think/${cardFile}`)
      .then(r => r.text())
      .then(raw => {
        const p = parseMd(raw)
        setParsed(p)
        setBlockOps(new Array(p.blocks.length + 1).fill(0)) // +1 for subtitle row
      })
  }, [cardFile])

  useEffect(() => {
    if (!visible || !parsed) return
    const total = parsed.blocks.length + 1
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < total; i++) {
      timers.push(setTimeout(() => {
        setBlockOps(prev => { const n = [...prev]; n[i] = 1; return n })
      }, i * FADE_OFFSET))
    }
    return () => timers.forEach(t => clearTimeout(t))
  }, [visible, parsed])

  useEffect(() => {
    if (!visible) setBlockOps(prev => new Array(prev.length).fill(0))
  }, [visible])

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
        transition: `opacity ${FADE_DUR}ms ease`,
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
        const style = { opacity: op, transition: `opacity ${FADE_DUR}ms ease` }

        // Section label — same treatment as the Work job box labels, in the
        // thinking accent rather than pink.
        if (block.type === 'label') {
          return (
            <p key={i} style={{ ...style, fontSize: type.JOB_LABEL.sizePx, fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display, marginBottom: 10 }}>
              {block.content}
            </p>
          )
        }

        if (block.type === 'paragraph') {
          return (
            <p key={i} style={{ ...style, fontSize: type.CASE_BODY.sizePx, fontWeight: type.CASE_BODY.weight, lineHeight: type.CASE_BODY.lineHeight, letterSpacing: `${type.CASE_BODY.tracking}em`, color: 'rgba(255,255,255,0.6)', maxWidth: bodyMaxWidth(col), marginBottom: 28, fontFamily: TYPE.display }}>
              {parseAccents(block.content, ACCENT)}
            </p>
          )
        }

        if (block.type === 'pullquote') {
          return (
            <p key={i} style={{ ...style, fontSize: type.PULLQUOTE.sizePx, fontWeight: type.PULLQUOTE.weight, lineHeight: type.PULLQUOTE.lineHeight, color: COLORS.white, maxWidth: bodyMaxWidth(col), marginBottom: 28, fontFamily: TYPE.display, whiteSpace: 'pre-line' }}>
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
            <div key={i} style={{ ...style, maxWidth: bodyMaxWidth(col), marginBottom: 28 }}>
              <ImageBlockInline src={src} caption={caption} />
            </div>
          )
        }

        if (block.type === 'video-carousel') {
          const urls = block.content.split('\n').map(u => u.trim()).filter(Boolean)
          return (
            <div key={i} style={style}>
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
            <div key={i} style={style}>
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