'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { COLORS, useBreakpoint } from './SiteTokens'

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// All tunable values live here, per project convention.

const CFG = {
  GRID_GAP_PX: 6,

  // Default column step-down per breakpoint tier, relative to the declared
  // desktop "Nup". No per-breakpoint override exists in the [gallery] markdown
  // syntax yet — revisit if a real gallery looks bad on a real phone.
  TABLET_COL_STEP: 1,
  MOBILE_COL_STEP: 2,

  LIGHTBOX_FADE_MS: 400,
  LIGHTBOX_FADE_OFFSET_PX: 16,
  LIGHTBOX_BACKDROP: 'rgba(0,0,0,0.9)',

  // Smaller, black-square/white-icon controls — sized for sitting over photos,
  // deliberately smaller than the Think/Work page nav controls they're modeled on.
  LIGHTBOX_BTN_SIZE: 28,
  LIGHTBOX_BTN_BG: '#000000',
  LIGHTBOX_BTN_ICON: '#FFFFFF',
  LIGHTBOX_BTN_GAP: 8,
  LIGHTBOX_BTN_INSET_PX: 16, // distance from the media's own bottom-right corner

  // Video-specific additions.
  VIDEO_DEFAULT_ASPECT: 16 / 9, // used for the lightbox embed box when no crop is set
  VIDEO_MAX_WIDTH_VW: 90,
  VIDEO_MAX_WIDTH_PX: 1200,

  GRID_PLAY_BTN_SIZE: 48,
  GRID_PLAY_BTN_BG: 'rgba(0,0,0,0.55)',
  GRID_PLAY_BTN_ICON: '#FFFFFF',
}

const CROP_RATIOS: Record<string, number> = {
  '4by3': 4 / 3,
  '16by9': 16 / 9,
  '1by1': 1,
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
// Mirrors the GalleryOffset/GalleryData shapes produced by parseGalleryBlock()
// in ThinkCasePanel.tsx / WorkCaseStudyPanel.tsx. Kept as a duplicate here
// (not imported) since those files own the markdown-parsing concern and this
// component only needs the resulting data shape.
//
// NOTE: parseGalleryBlock() will need a corresponding update to emit `videos`
// — that's out of scope for this file, flagging so it isn't forgotten.

export interface GalleryOffset {
  index: number   // 1-based position in the FULL sorted folder list (hero included)
  x: number       // % nudge
  y: number       // % nudge
  scale: number   // % (100 = no change)
}

export interface GalleryVideoLink {
  index: number                        // same 1-based full-folder-list numbering as offsets
  source: 'youtube' | 'vimeo' | 'file'
  id?: string                          // YouTube or Vimeo video ID (source: 'youtube' | 'vimeo')
  src?: string                         // path to the video file (source: 'file')
  poster?: string                      // explicit override; skips auto-derivation entirely
}

export interface GalleryData {
  source: string
  columns: number
  crop?: '4by3' | '16by9' | '1by1'
  noClick?: boolean
  heroHeight?: number
  offsets: GalleryOffset[]
  videos?: GalleryVideoLink[]
}

interface Props {
  path: string          // resolved folder path, e.g. '/images/work/CaseStudyImages_1'
  gallery: GalleryData
}

function columnsForBreakpoint(desktopCols: number, bp: 'mobile' | 'tablet' | 'desktop'): number {
  if (bp === 'desktop') return desktopCols
  if (bp === 'tablet') return Math.max(1, desktopCols - CFG.TABLET_COL_STEP)
  return Math.max(1, desktopCols - CFG.MOBILE_COL_STEP)
}

// Ordered list of poster URLs to try for a given grid position, most-specific
// first. An explicit `poster` override wins outright. Otherwise YouTube gets
// its free auto-thumbnail (with a resolution fallback), and everything else
// — including a YouTube video whose thumbnails somehow both fail — falls
// through to the folder image at that position, which is always guaranteed
// to exist since every video slot still has a real file backing it.
function posterCandidates(video: GalleryVideoLink | undefined, folderSrc: string): string[] {
  if (!video) return [folderSrc]
  if (video.poster) return [video.poster]
  if (video.source === 'youtube' && video.id) {
    return [
      `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
      folderSrc,
    ]
  }
  return [folderSrc]
}

export default function Gallery({ path, gallery }: Props) {
  const [images, setImages] = useState<string[] | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const bp = useBreakpoint()

  useEffect(() => {
    let cancelled = false
    fetch(`/api/gallery${path}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setImages(Array.isArray(data.images) ? data.images : []) })
      .catch(() => { if (!cancelled) setImages([]) })
    return () => { cancelled = true }
  }, [path])

  if (!images || images.length === 0) return null

  const hasHero = !!gallery.heroHeight
  const heroSrc = hasHero ? images[0] : null
  const gridImages = hasHero ? images.slice(1) : images
  const heroFolderIndex = 1 // full-list index of the hero, when present

  // Hero (if present) is lightbox position 0, grid images follow — so
  // prev/next cycles through everything in one continuous sequence and
  // the hero is reachable by clicking it, same as any grid cell.
  const lightboxFilenames = hasHero ? [heroSrc!, ...gridImages] : gridImages

  // Column count: full declared Nup once image count >= Nup (trailing cells
  // left empty by the grid's own row-wrapping); shrunk down to image count
  // when there are fewer images than Nup, so a single short row isn't
  // stretched wider than its content.
  const desktopCols = gallery.columns
  const cols = Math.min(columnsForBreakpoint(desktopCols, bp), gridImages.length || 1)

  const offsetByIndex = new Map(gallery.offsets.map(o => [o.index, o]))
  const videoByIndex = new Map((gallery.videos ?? []).map(v => [v.index, v]))
  const aspectRatio = CROP_RATIOS[gallery.crop ?? '4by3']
  const clickable = !gallery.noClick

  // Build the full lightbox item list (video-aware) in the same order as
  // lightboxFilenames, so lightboxIdx stays a single source of truth for
  // both the grid's onClick handlers and the lightbox's own content.
  // lightboxFilenames is always [hero?, ...grid] in full-folder order, so
  // its position i maps 1:1 onto the 1-based full-folder-list index (i+1)
  // — the same numbering offsets/videos already key off of.
  const lightboxItems = lightboxFilenames.map((filename, i) => ({
    filename,
    video: videoByIndex.get(i + 1),
  }))

  function openLightbox(i: number) {
    if (!clickable) return
    setLightboxIdx(i)
  }
  function closeLightbox() { setLightboxIdx(null) }
  function step(dir: number) {
    setLightboxIdx(prev => {
      if (prev === null || lightboxItems.length === 0) return prev
      return (prev + dir + lightboxItems.length) % lightboxItems.length
    })
  }

  const heroVideo = hasHero ? videoByIndex.get(heroFolderIndex) : undefined

  return (
    <div style={{ marginBottom: 28 }}>
      {heroSrc && (
        <HeroImage
          src={`${path}/${heroSrc}`}
          height={gallery.heroHeight!}
          offset={offsetByIndex.get(heroFolderIndex)}
          video={heroVideo}
          clickable={clickable}
          onClick={() => openLightbox(0)}
        />
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: `${CFG.GRID_GAP_PX}px`,
          marginTop: heroSrc ? CFG.GRID_GAP_PX : 0,
        }}
      >
        {gridImages.map((filename, i) => {
          const folderIndex = (hasHero ? 1 : 0) + i + 1
          const offset = offsetByIndex.get(folderIndex)
          const video = videoByIndex.get(folderIndex)
          const lightboxIndexForThisCell = (hasHero ? 1 : 0) + i
          return (
            <GridCell
              key={filename}
              src={`${path}/${filename}`}
              aspectRatio={aspectRatio}
              offset={offset}
              video={video}
              clickable={clickable}
              onClick={() => openLightbox(lightboxIndexForThisCell)}
            />
          )
        })}
      </div>

      {lightboxIdx !== null && createPortal(
        <Lightbox
          items={lightboxItems}
          path={path}
          index={lightboxIdx}
          videoAspect={gallery.crop ? CROP_RATIOS[gallery.crop] : CFG.VIDEO_DEFAULT_ASPECT}
          onClose={closeLightbox}
          onStep={step}
        />,
        document.body
      )}
    </div>
  )
}

function offsetTransform(offset?: GalleryOffset): string {
  const x = offset?.x ?? 0
  const y = offset?.y ?? 0
  const scale = (offset?.scale ?? 100) / 100
  return `translate(${x}%, ${y}%) scale(${scale})`
}

// ─── POSTER IMAGE (photo cell OR video poster, with fallback chain) ─────────

function PosterImg({
  video, folderSrc, style,
}: {
  video?: GalleryVideoLink
  folderSrc: string
  style: React.CSSProperties
}) {
  const candidates = posterCandidates(video, folderSrc)
  const [attempt, setAttempt] = useState(0)
  const src = candidates[Math.min(attempt, candidates.length - 1)]

  return (
    <img
      src={src}
      alt=""
      style={style}
      onError={() => {
        if (attempt < candidates.length - 1) setAttempt(a => a + 1)
      }}
    />
  )
}

function PlayBadge() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: CFG.GRID_PLAY_BTN_SIZE,
        height: CFG.GRID_PLAY_BTN_SIZE,
        borderRadius: '50%',
        background: CFG.GRID_PLAY_BTN_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '38%', height: '38%' }}>
        <polygon points="30,20 80,50 30,80" fill={CFG.GRID_PLAY_BTN_ICON} />
      </svg>
    </div>
  )
}

function HeroImage({
  src, height, offset, video, clickable, onClick,
}: {
  src: string
  height: number
  offset?: GalleryOffset
  video?: GalleryVideoLink
  clickable: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{ width: '100%', height, overflow: 'hidden', background: COLORS.dark, cursor: clickable ? 'pointer' : 'default', position: 'relative' }}
    >
      <PosterImg
        video={video}
        folderSrc={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transform: offsetTransform(offset),
        }}
      />
      {video && <PlayBadge />}
    </div>
  )
}

function GridCell({
  src, aspectRatio, offset, video, clickable, onClick,
}: {
  src: string
  aspectRatio?: number
  offset?: GalleryOffset
  video?: GalleryVideoLink
  clickable: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: COLORS.dark,
        aspectRatio: aspectRatio ? String(aspectRatio) : undefined,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <PosterImg
        video={video}
        folderSrc={src}
        style={{
          width: '100%',
          height: aspectRatio ? '100%' : 'auto',
          objectFit: aspectRatio ? 'cover' : undefined,
          display: 'block',
          transform: offsetTransform(offset),
        }}
      />
      {video && <PlayBadge />}
    </div>
  )
}

// ─── LIGHTBOX ────────────────────────────────────────────────────────────────
// Fade-up, portaled to document.body per the project's established pattern for
// position:fixed overlays escaping transformed-ancestor stacking contexts.
// Shows the image at full native size/ratio, ignoring the grid's crop — or,
// for a video item, swaps in an embed/self-hosted player sized to a fixed
// aspect box (the gallery's own crop ratio if set, else 16:9).

interface LightboxItem {
  filename: string
  video?: GalleryVideoLink
}

function Lightbox({
  items, path, index, videoAspect, onClose, onStep,
}: {
  items: LightboxItem[]
  path: string
  index: number
  videoAspect: number
  onClose: () => void
  onStep: (dir: number) => void
}) {
  const [entered, setEntered] = useState(false)
  const current = items[index]

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onStep(-1)
      if (e.key === 'ArrowRight') onStep(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onStep])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: CFG.LIGHTBOX_BACKDROP,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: entered ? 1 : 0,
        transition: `opacity ${CFG.LIGHTBOX_FADE_MS}ms ease`,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        {current.video ? (
          <VideoEmbed
            key={index /* forces unmount+remount on nav, so playback stops cleanly */}
            video={current.video}
            aspect={videoAspect}
            entered={entered}
          />
        ) : (
          <img
            src={`${path}/${current.filename}`}
            alt=""
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              display: 'block',
              transform: entered ? 'translateY(0)' : `translateY(${CFG.LIGHTBOX_FADE_OFFSET_PX}px)`,
              transition: `transform ${CFG.LIGHTBOX_FADE_MS}ms ease`,
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            bottom: CFG.LIGHTBOX_BTN_INSET_PX,
            right: CFG.LIGHTBOX_BTN_INSET_PX,
            display: 'flex',
            gap: CFG.LIGHTBOX_BTN_GAP,
          }}
        >
          {items.length > 1 && (
            <LightboxBtn onClick={e => { e.stopPropagation(); onStep(-1) }}>
              <polyline points="60,20 35,50 60,80" fill="none" stroke={CFG.LIGHTBOX_BTN_ICON} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            </LightboxBtn>
          )}
          <LightboxBtn onClick={e => { e.stopPropagation(); onClose() }}>
            <line x1="25" y1="25" x2="75" y2="75" stroke={CFG.LIGHTBOX_BTN_ICON} strokeWidth={12} strokeLinecap="round" />
            <line x1="75" y1="25" x2="25" y2="75" stroke={CFG.LIGHTBOX_BTN_ICON} strokeWidth={12} strokeLinecap="round" />
          </LightboxBtn>
          {items.length > 1 && (
            <LightboxBtn onClick={e => { e.stopPropagation(); onStep(1) }}>
              <polyline points="40,20 65,50 40,80" fill="none" stroke={CFG.LIGHTBOX_BTN_ICON} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            </LightboxBtn>
          )}
        </div>
      </div>
    </div>
  )
}

function VideoEmbed({
  video, aspect, entered,
}: {
  video: GalleryVideoLink
  aspect: number
  entered: boolean
}) {
  const boxStyle: React.CSSProperties = {
    width: `min(${CFG.VIDEO_MAX_WIDTH_VW}vw, ${CFG.VIDEO_MAX_WIDTH_PX}px)`,
    aspectRatio: String(aspect),
    display: 'block',
    background: '#000000',
    transform: entered ? 'translateY(0)' : `translateY(${CFG.LIGHTBOX_FADE_OFFSET_PX}px)`,
    transition: `transform ${CFG.LIGHTBOX_FADE_MS}ms ease`,
  }

  if (video.source === 'youtube' && video.id) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
        style={{ ...boxStyle, border: 'none' }}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (video.source === 'vimeo' && video.id) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${video.id}?autoplay=1`}
        style={{ ...boxStyle, border: 'none' }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (video.source === 'file' && video.src) {
    return (
      <video
        src={video.src}
        style={{ ...boxStyle, objectFit: 'contain' }}
        controls
        autoPlay
        playsInline
      />
    )
  }

  // Malformed video entry (missing id/src for its declared source) — render
  // nothing rather than a broken player; the underlying folder poster still
  // showed correctly in the grid, so this fails quietly, not visibly.
  return null
}

function LightboxBtn({ children, onClick }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: CFG.LIGHTBOX_BTN_BG,
        border: 'none',
        width: CFG.LIGHTBOX_BTN_SIZE,
        height: CFG.LIGHTBOX_BTN_SIZE,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '55%', height: '55%' }}>
        {children}
      </svg>
    </button>
  )
}