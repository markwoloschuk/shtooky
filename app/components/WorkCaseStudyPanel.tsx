'use client'

import { useEffect, useState } from 'react'
import { TYPE, COLORS } from './Tokens'

const PINK = COLORS.work
const FADE_DUR = 2000
const FADE_OFFSET = 25

interface Frontmatter {
  title: string
  client: string
  role: string
  delivery: string
}

interface Block {
  type: 'paragraph' | 'pullquote' | 'video-carousel' | 'gallery'
  content: string
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
  const frontmatter: Frontmatter = { title: '', client: '', role: '', delivery: '' }
  if (fmMatch) {
    for (const line of fmMatch[1].split('\n')) {
      const [key, ...rest] = line.split(':')
      const val = rest.join(':').trim()
      if (key === 'title') frontmatter.title = val
      if (key === 'client') frontmatter.client = val
      if (key === 'role') frontmatter.role = val
      if (key === 'delivery') frontmatter.delivery = val
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

interface Props {
  caseFile: string | null   // e.g. 'WorkCase01'
  caseIdx: number | null    // 0-based index, used for gallery path
  visible: boolean
}

export default function CaseStudyPanel({ caseFile, caseIdx, visible }: Props) {
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
  const slot = caseIdx !== null ? caseIdx + 1 : 1

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
          <span style={{ fontSize: 12, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>Client</span>
          <span style={{ fontSize: 17, color: '#fff', fontFamily: TYPE.display }}>{fm.client}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>Role</span>
          <span style={{ fontSize: 17, color: '#fff', fontFamily: TYPE.display }}>{fm.role}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>Title</span>
          <span style={{ fontSize: 17, color: '#fff', fontFamily: TYPE.display }}>{fm.title}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: PINK, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: TYPE.display }}>Delivery</span>
          <span style={{ fontSize: 17, color: '#fff', fontFamily: TYPE.display }}>{fm.delivery}</span>
        </div>
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
            <p key={i} style={{ ...style, fontSize: 32, fontWeight: 700, lineHeight: 1.2, color: '#fff', maxWidth: 760, marginBottom: 28, fontFamily: TYPE.display }}>
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
          const folder = block.content.trim()
          return (
            <div key={i} style={style}>
              <GalleryInline path={`/images/case${String(slot).padStart(2, '0')}/${folder}`} />
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

function GalleryInline({ path }: { path: string }) {
  // Gallery images are not enumerable from the client — they must be listed via an API route.
  // This renders a placeholder until the gallery API route exists.
  return (
    <div style={{ marginBottom: 28, color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: TYPE.display }}>
      [Gallery: {path}]
    </div>
  )
}
