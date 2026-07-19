'use client'

// TYPE ROLES USED IN THIS FILE:
//   body paragraphs  → TYPE_TIERS.CASE_BODY  (sizePx, weight, lineHeight, tracking)
//   pull-quote blocks → TYPE_TIERS.PULLQUOTE  (sizePx, weight, lineHeight)
//   job box labels   → TYPE_TIERS.JOB_LABEL  (sizePx only — weight/tracking retained hardcoded)
//   video counter    → TYPE_TIERS.CAPTION     (sizePx — matched, not yet wired)

import { useEffect, useState } from 'react'
import { TYPE, COLORS, useType } from './Tokens'
import Gallery from './Gallery'

const PINK = COLORS.work
const FADE_DUR = 2000
const FADE_OFFSET = 25

interface Frontmatter {
  title: string
  client: string
  role: string
  delivery: string
  imagePath: string
}

interface Block {
  type: 'paragraph' | 'pullquote' | 'video-carousel' | 'gallery'
  content: string
}

interface GalleryOffset {
  index: number   // 1-based, matches image position in folder order
  x: number       // position nudge, % (default 0)
  y: number       // position nudge, % (default 0)
  scale: number   // % (default 100 = no change)
}

interface GalleryData {
  source: string          // folder name (relative to imagePath) or full path
  columns: number         // desktop grid column count ("Nup")
  crop?: '4by3' | '16by9' | '1by1'  // omitted = native image aspect ratio
  noClick?: boolean       // true = disable lightbox
  heroHeight?: number     // px; omitted = no hero, straight grid
  offsets: GalleryOffset[]
}

interface ParsedCase {
  frontmatter: Frontmatter
  blocks: Block[]
}

function parseAccents(text: string): React.ReactNode[] {
  const parts = text.split(/(<[^>]+>)/)
  return parts.map((part, i) => {
    if (part.startsWith('<') && part.endsWith('>')) {
      return <span key={i} style={{ color: PINK }}>{part.slice(1, -1)}</span>
    }
    // Handle [br] line breaks
    const lines = part.split('[br]')
    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>{line}{j < lines.length - 1 && <br />}</span>
    ))
  })
}

function parseMd(raw: string): ParsedCase {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
  const frontmatter: Frontmatter = { title: '', client: '', role: '', delivery: '', imagePath: '' }
  if (fmMatch) {
    for (const line of fmMatch[1].split('\n')) {
      const [key, ...rest] = line.split(':')
      const val = rest.join(':').trim()
      if (key === 'title') frontmatter.title = val
      if (key === 'client') frontmatter.client = val
      if (key === 'role') frontmatter.role = val
      if (key === 'delivery') frontmatter.delivery = val
      if (key === 'imagePath') frontmatter.imagePath = val
    }
  }

  const body = fmMatch ? raw.slice(fmMatch[0].length).trim() : raw.trim()
  const blocks: Block[] = []
  const sections = body.split(/\n(?=\[)/)
  for (const sec of sections) {
    const match = sec.match(/^\[(\S+)\]\n([\s\S]*)/)
    if (!match) continue
    const type = match[1] as Block['type']
    const content = match[2].trim()
    blocks.push({ type, content })
  }

  return { frontmatter, blocks }
}

function resolveImagePath(imagePath: string, filename: string): string {
  const base = imagePath.endsWith('/') ? imagePath : `${imagePath}/`
  return `${base}${filename}`
}

// Parses a [gallery] block body. Expected shape:
//   folderName-or-/full/path/
//   Nup, crop(optional: 4by3|16by9|1by1), noClick(optional)
//   hero, heightPx        <- entire line omitted = no hero
//   offset {
//     [1, 20x, 50y, 100s],
//     [4, -50x, 25y, 120s]
//   }
// Missing offset x/y/s values default to 0/0/100 (no change).
// Kept identical to ThinkCasePanel.tsx's copy — same block syntax, same parser.
function parseGalleryBlock(content: string): GalleryData {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)

  const source = lines[0] ?? ''

  const line2 = (lines[1] ?? '').split(',').map(s => s.trim())
  const columns = parseInt(line2[0]?.replace(/up$/i, '') ?? '', 10) || 3
  const CROP_TOKENS = new Set(['4by3', '16by9', '1by1'])
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
  const offsetMatch = remaining.match(/offset\s*\{([\s\S]*)\}/)
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

  return { source, columns, crop, noClick, heroHeight, offsets }
}

interface Props {
  caseFile: string | null   // e.g. 'WorkCase01'
  caseIdx: number | null    // 0-based index — no longer used inside this file (gallery paths now come from frontmatter's imagePath); left in Props since the caller may still pass/rely on it elsewhere
  visible: boolean
}

export default function CaseStudyPanel({ caseFile, caseIdx, visible }: Props) {
  const type = useType()
  const [parsed, setParsed] = useState<ParsedCase | null>(null)
  const [blockOps, setBlockOps] = useState<number[]>([])

  useEffect(() => {
    if (!caseFile) { setParsed(null); setBlockOps([]); return }
    fetch(`/api/case/${caseFile}`)
      .then(r => r.text())
      .then(raw => {
        const p = parseMd(raw)
        setParsed(p)
        setBlockOps(new Array(p.blocks.length + 1).fill(0)) // +1 for job box
      })
  }, [caseFile])

  // Fade blocks in successively when visible
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

  // Reset opacities when hidden
  useEffect(() => {
    if (!visible) setBlockOps(prev => new Array(prev.length).fill(0))
  }, [visible])

  if (!parsed) return null

  const { frontmatter: fm, blocks } = parsed

  return (
    <div style={{
      paddingLeft: '7.2222%',
      paddingRight: '7.2222%',
      paddingTop: 40,
      paddingBottom: 80,
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Job box */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px 30px',
        marginBottom: 28,
        paddingTop: 20,
        opacity: blockOps[0] ?? 0,
        transition: `opacity ${FADE_DUR}ms ease`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: type.JOB_LABEL.sizePx, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>Client</span>
          <span style={{ fontSize: 17, color: '#fff', fontFamily: TYPE.display }}>{fm.client}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: type.JOB_LABEL.sizePx, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>Role</span>
          <span style={{ fontSize: 17, color: '#fff', fontFamily: TYPE.display }}>{fm.role}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: type.JOB_LABEL.sizePx, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>Title</span>
          <span style={{ fontSize: 17, color: '#fff', fontFamily: TYPE.display }}>{fm.title}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: type.JOB_LABEL.sizePx, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>Delivery</span>
          <span style={{ fontSize: 17, color: '#fff', fontFamily: TYPE.display }}>{fm.delivery}</span>
        </div>
      </div>

      {/* Content blocks */}
      {blocks.map((block, i) => {
        const op = blockOps[i + 1] ?? 0
        const style = { opacity: op, transition: `opacity ${FADE_DUR}ms ease` }

        if (block.type === 'paragraph') {
          return (
            <p key={i} style={{ ...style, fontSize: type.CASE_BODY.sizePx, fontWeight: type.CASE_BODY.weight, lineHeight: type.CASE_BODY.lineHeight, letterSpacing: `${type.CASE_BODY.tracking}em`, color: 'rgba(255,255,255,0.6)', maxWidth: 760, marginBottom: 28, fontFamily: TYPE.display }}>
              {parseAccents(block.content)}
            </p>
          )
        }

        if (block.type === 'pullquote') {
          return (
            <p key={i} style={{ ...style, fontSize: type.PULLQUOTE.sizePx, fontWeight: type.PULLQUOTE.weight, lineHeight: type.PULLQUOTE.lineHeight, color: '#fff', maxWidth: 760, marginBottom: 28, fontFamily: TYPE.display }}>
              {parseAccents(block.content)}
            </p>
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
          return (
            <div key={i} style={style}>
              <GalleryInline path={path} gallery={gallery} />
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
  if (!urls.length) return null
  const embedUrl = toEmbed(urls[idx])
  return (
    <div style={{ marginBottom: 28, maxWidth: 760 }}>
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
  return <Gallery path={path} gallery={gallery} />
}