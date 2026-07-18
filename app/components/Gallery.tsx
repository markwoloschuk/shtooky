'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { COLORS, useBreakpoint } from './Tokens'

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
  LIGHTBOX_BTN_INSET_PX: 16, // distance from the image's own bottom-right corner
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

export interface GalleryOffset {
  index: number   // 1-based position in the FULL sorted folder list (hero included)
  x: number       // % nudge
  y: number       // % nudge
  scale: number   // % (100 = no change)
}

export interface GalleryData {
  source: string
  columns: number
  crop?: '4by3' | '16by9' | '1by1'
  noClick?: boolean
  heroHeight?: number
  offsets: GalleryOffset[]
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
  const lightboxImages = hasHero ? [heroSrc!, ...gridImages] : gridImages

  // Column count: full declared Nup once image count >= Nup (trailing cells
  // left empty by the grid's own row-wrapping); shrunk down to image count
  // when there are fewer images than Nup, so a single short row isn't
  // stretched wider than its content.
  const desktopCols = gallery.columns
  const cols = Math.min(columnsForBreakpoint(desktopCols, bp), gridImages.length || 1)

  const offsetByIndex = new Map(gallery.offsets.map(o => [o.index, o]))
  const aspectRatio = CROP_RATIOS[gallery.crop ?? '4by3']
  const clickable = !gallery.noClick

  function openLightbox(i: number) {
    if (!clickable) return
    setLightboxIdx(i)
  }
  function closeLightbox() { setLightboxIdx(null) }
  function step(dir: number) {
    setLightboxIdx(prev => {
      if (prev === null || lightboxImages.length === 0) return prev
      return (prev + dir + lightboxImages.length) % lightboxImages.length
    })
  }

  return (
    <div style={{ marginBottom: 28 }}>
      {heroSrc && (
        <HeroImage
          src={`${path}/${heroSrc}`}
          height={gallery.heroHeight!}
          offset={offsetByIndex.get(heroFolderIndex)}
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
          const lightboxIndexForThisCell = (hasHero ? 1 : 0) + i
          return (
            <GridCell
              key={filename}
              src={`${path}/${filename}`}
              aspectRatio={aspectRatio}
              offset={offset}
              clickable={clickable}
              onClick={() => openLightbox(lightboxIndexForThisCell)}
            />
          )
        })}
      </div>

      {lightboxIdx !== null && createPortal(
        <Lightbox
          images={lightboxImages}
          path={path}
          index={lightboxIdx}
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

function HeroImage({
  src, height, offset, clickable, onClick,
}: {
  src: string
  height: number
  offset?: GalleryOffset
  clickable: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{ width: '100%', height, overflow: 'hidden', background: COLORS.dark, cursor: clickable ? 'pointer' : 'default' }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transform: offsetTransform(offset),
        }}
      />
    </div>
  )
}

function GridCell({
  src, aspectRatio, offset, clickable, onClick,
}: {
  src: string
  aspectRatio?: number
  offset?: GalleryOffset
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
      <img
        src={src}
        alt=""
        style={{
          width: '100%',
          height: aspectRatio ? '100%' : 'auto',
          objectFit: aspectRatio ? 'cover' : undefined,
          display: 'block',
          transform: offsetTransform(offset),
        }}
      />
    </div>
  )
}

// ─── LIGHTBOX ────────────────────────────────────────────────────────────────
// Fade-up, portaled to document.body per the project's established pattern for
// position:fixed overlays escaping transformed-ancestor stacking contexts.
// Shows the image at full native size/ratio, ignoring the grid's crop.

function Lightbox({
  images, path, index, onClose, onStep,
}: {
  images: string[]
  path: string
  index: number
  onClose: () => void
  onStep: (dir: number) => void
}) {
  const [entered, setEntered] = useState(false)

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
        <img
          src={`${path}/${images[index]}`}
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

        <div
          style={{
            position: 'absolute',
            bottom: CFG.LIGHTBOX_BTN_INSET_PX,
            right: CFG.LIGHTBOX_BTN_INSET_PX,
            display: 'flex',
            gap: CFG.LIGHTBOX_BTN_GAP,
          }}
        >
          {images.length > 1 && (
            <LightboxBtn onClick={e => { e.stopPropagation(); onStep(-1) }}>
              <polyline points="60,20 35,50 60,80" fill="none" stroke={CFG.LIGHTBOX_BTN_ICON} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            </LightboxBtn>
          )}
          <LightboxBtn onClick={e => { e.stopPropagation(); onClose() }}>
            <line x1="25" y1="25" x2="75" y2="75" stroke={CFG.LIGHTBOX_BTN_ICON} strokeWidth={12} strokeLinecap="round" />
            <line x1="75" y1="25" x2="25" y2="75" stroke={CFG.LIGHTBOX_BTN_ICON} strokeWidth={12} strokeLinecap="round" />
          </LightboxBtn>
          {images.length > 1 && (
            <LightboxBtn onClick={e => { e.stopPropagation(); onStep(1) }}>
              <polyline points="40,20 65,50 40,80" fill="none" stroke={CFG.LIGHTBOX_BTN_ICON} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            </LightboxBtn>
          )}
        </div>
      </div>
    </div>
  )
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