'use client'

import { useEffect, useState } from 'react'
import { TYPE, COLORS } from './Tokens'

const ACCENT = COLORS.thinking
const FADE_DUR = 2000
const FADE_OFFSET = 25

interface Frontmatter {
  title: string
  narrowtitle: string
  subtitle: string
  imagePath: string
}

interface Block {
  type: 'paragraph' | 'pullquote' | 'video-carousel' | 'gallery' | 'img'
  content: string
}

interface ParsedCard {
  frontmatter: Frontmatter
  blocks: Block[]
}

function parseAccents(text: string): React.ReactNode[] {
  const parts = text.split(/(<[^>]+>)/)
  return parts.map((part, i) => {
    if (part.startsWith('<') && part.endsWith('>')) {
      return <span key={i} style={{ color: ACCENT }}>{part.slice(1, -1)}</span>
    }
    const lines = part.split('[br]')
    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>{line}{j < lines.length - 1 && <br />}</span>
    ))
  })
}

const BODY_BLOCK_TYPES = new Set(['paragraph', 'pullquote', 'video-carousel', 'gallery', 'img'])

// Simple `key: value` YAML frontmatter — not a general YAML parser,
// just enough for this fixed, known set of fields. Values are taken
// as-is (no quoting/escaping needed for this content).
function parseFrontmatter(raw: string): { fm: Frontmatter; rest: string } {
  const fm: Frontmatter = { title: '', narrowtitle: '', subtitle: '', imagePath: '' }
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { fm, rest: raw }
  const [, fmBlock, rest] = match
  for (const line of fmBlock.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const key = m[1] as keyof Frontmatter
    if (key in fm) fm[key] = m[2].trim()
  }
  return { fm, rest }
}

function resolveImagePath(imagePath: string, filename: string): string {
  const base = imagePath.endsWith('/') ? imagePath : `${imagePath}/`
  return `${base}${filename}`
}

function parseMd(raw: string): ParsedCard {
  const { fm, rest } = parseFrontmatter(raw)
  const blocks: Block[] = []

  const sections = rest.trim().split(/\n(?=\[)/)
  for (const sec of sections) {
    const match = sec.match(/^\[(\S+)\]\s*\n?([\s\S]*)/)
    if (!match) continue
    const key = match[1]
    const content = match[2].trim()
    if (BODY_BLOCK_TYPES.has(key)) {
      blocks.push({ type: key as Block['type'], content })
    }
    // Unknown block types are intentionally skipped
  }

  return { frontmatter: fm, blocks }
}

interface Props {
  cardFile: string | null
  visible: boolean
}

export default function ThinkCasePanel({ cardFile, visible }: Props) {
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
          fontSize: 22,
          fontWeight: 700,
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

        if (block.type === 'paragraph') {
          return (
            <p key={i} style={{ ...style, fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 760, marginBottom: 28, fontFamily: TYPE.display }}>
              {parseAccents(block.content)}
            </p>
          )
        }

        if (block.type === 'pullquote') {
          return (
            <p key={i} style={{ ...style, fontSize: 32, fontWeight: 700, lineHeight: 1.2, color: COLORS.white, maxWidth: 760, marginBottom: 28, fontFamily: TYPE.display }}>
              {parseAccents(block.content)}
            </p>
          )
        }

        if (block.type === 'img') {
          const lines = block.content.split('\n').map(l => l.trim()).filter(Boolean)
          const filename = lines[0]
          const caption = lines[1]
          const src = resolveImagePath(fm.imagePath, filename)
          return (
            <div key={i} style={{ ...style, maxWidth: 760, marginBottom: 28 }}>
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
          const folder = block.content.trim()
          const path = resolveImagePath(fm.imagePath, folder)
          return (
            <div key={i} style={style}>
              <GalleryInline path={path} />
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
  if (!urls.length) return null
  const embedUrl = toEmbed(urls[idx])
  return (
    <div style={{ marginBottom: 28, maxWidth: 760 }}>
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

function GalleryInline({ path }: { path: string }) {
  return (
    <div style={{ marginBottom: 28, color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: TYPE.display }}>
      [Gallery: {path}]
    </div>
  )
}