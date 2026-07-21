'use client'

import { useEffect, useRef, useCallback } from 'react'
import { WORK_MANIFEST } from '../data/WorkManifest'
import { TYPE, COLORS, useType, useColumn, MOBILE_BAND_HEIGHT_SCALE, getType, getColumn } from './SiteTokens'

// ── Locked animation constants (from work_carousel_v30.html) ─────────────────
const CFG = {
  HOV_EXPAND:      300,
  HOV_SPEED:       500,
  HOV_ZOOM:        1.10,
  IMG_PUSH:        0.90,
  CHROMA_ON:       true,
  CHROMA_AMT:      0.80,
  FULL_ZOOM:       1.30,
  FULL_DUR:        650,
  TEXT_RISE:       0,
  HL_Y:            20,
  HL_FADE_DUR:     650,
  FADE_DUR:        2000,
  FADE_OFFSET:     25,
  CLICK_TO_CLOSE:  true,
  SLICE_FADE_COLOR: true,
  SLICE_FADE_BLACK: false,
  COL_RANGE:       0.40,
  COL_OPACITY:     1.00,
  NAV_TYPE:        'partial' as const,
  NAV_DUR:         650,
  OUT_TRAVEL:      0.35,
  HL_DELAY:        0,
  HL_RIGHT_DELAY:  175,
  NAV_COL_FADE:    true,
  NAV_BTN_SIZE:    32,
  SYM_PCT:         0.50,
  STROKE_W:        1,
  VIG_OPACITY:     0.85,
  VIG_HEIGHT:      0.40,
}

const N    = 7
const CW   = 1440
const CH   = 480
const BASE_W = CW / N

// _ech (effective CH) — desktop/tablet = CH; mobile = CH * MOBILE_BAND_HEIGHT_SCALE.
// Updated by scaleStage on every resize. All drawing functions read this.
let _ech = CH
let _hlNativeSize = 52  // updated in scaleStage: mobile drives this to meet PULLQUOTE min-size on screen
let _hlPadNative = 104  // updated in scaleStage: col.marginVw * CW / 100 in native units


// ── Carousel headlines drawn on canvas ───────────────────────────────────────
const HEADLINES = [
  '12 products.\n1 Holiday hook.',
  'Time was short so we\nthrew away the best idea.',
  '360° of vibes',
  'Punching a signal\nthrough the noise.',
  //'Designing my escape from\nplanning department jail.',
  'Designing my escape\nfrom city planning jail.',
  'Hiding a secret\nin plain sight',
  'It was a beautiful day,\nit was beautiful data.',
]

// ── OKLab color helpers (from V30) ───────────────────────────────────────────
function sL(c: number) { const v = c / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
function lS(v: number) { return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)) }
function toOk(r: number, g: number, b: number): [number, number, number] {
  const l = sL(r), m = sL(g), s = sL(b)
  const l2 = Math.pow(0.4122214708 * l + 0.5363325363 * m + 0.0514459929 * s, 1 / 3)
  const m2 = Math.pow(0.2119034982 * l + 0.6806995451 * m + 0.1073969566 * s, 1 / 3)
  const s2 = Math.pow(0.0883024619 * l + 0.2817188376 * m + 0.6299787005 * s, 1 / 3)
  return [0.2104542553 * l2 + 0.793617785 * m2 - 0.0040720468 * s2, 1.9779984951 * l2 - 2.428592205 * m2 + 0.4505937099 * s2, 0.0259040371 * l2 + 0.7827717662 * m2 - 0.808675766 * s2]
}
function frOk(L: number, a: number, b: number): [number, number, number] {
  const l2 = L + 0.3963377774 * a + 0.2158037573 * b
  const m2 = L - 0.1055613458 * a - 0.0638541728 * b
  const s2 = L - 0.0894841775 * a - 1.291485548 * b
  const l = l2 * l2 * l2, m = m2 * m2 * m2, s = s2 * s2 * s2
  return [
    Math.max(0, Math.min(255, lS(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s))),
    Math.max(0, Math.min(255, lS(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s))),
    Math.max(0, Math.min(255, lS(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s))),
  ]
}
function lerpOk(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const la = toOk(...a), lb = toOk(...b)
  return frOk(la[0] + (lb[0] - la[0]) * t, la[1] + (lb[1] - la[1]) * t, la[2] + (lb[2] - la[2]) * t)
}

const PAGE_BASE: [number, number, number] = [235, 0, 139]
const PAGE_ADJ: [number, number, number][] = [[0, 173, 238], [136, 81, 152]]
const PAGE_FAR: [number, number, number][] = [[250, 175, 64], [214, 222, 35]]

function buildPalette(rf: number) {
  const p: [number, number, number][] = [PAGE_BASE]
  if (rf > 0) { const t = Math.min(1, rf * 2); for (const c of PAGE_ADJ) p.push(lerpOk(PAGE_BASE, c, 0.15 + t * 0.7)) }
  if (rf > 0.5) { const t = (rf - 0.5) * 2; for (const c of PAGE_FAR) p.push(lerpOk(PAGE_BASE, c, 0.15 + t * 0.7)) }
  return p
}
function pickColor(rf: number) {
  const p = buildPalette(rf)
  const c = p[Math.floor(Math.random() * p.length)]
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)) }
function easeIO(t: number) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 }
function easeOut(t: number) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t) }

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onOpen: (idx: number) => void
  onClose: () => void
  activeIdx: number | null
  onRegisterControls: (step: (dir: number) => void, close: () => void) => void
}

// TYPE ROLES USED IN THIS FILE:
//   resting-state headline (below-carousel pullquote) → TYPE_TIERS.OPENING
//     (sizeVw, weight, tracking, lineHeight — mobile gets an additional
//     fit-to-width scale-down pass so it never wraps; see fitPullquote)
//   in-image title (canvas) → TYPE_TIERS.PULLQUOTE (sizePx — mobile minimum; desktop = 52px native)

export default function WorkCarousel({ onOpen, onClose, activeIdx, onRegisterControls }: Props) {
const col  = useColumn()
const type = useType()
const canvasRef    = useRef<HTMLCanvasElement>(null)
const fadeRan = useRef(false)
const isMobileRef  = useRef(false)
  const hitRef       = useRef<HTMLDivElement>(null)
const fullHitRef   = useRef<HTMLDivElement>(null)
const navRef       = useRef<HTMLDivElement>(null)
const rafRef       = useRef<number>(0)
const wrapRef      = useRef<HTMLDivElement>(null)
const stageRef     = useRef<HTMLDivElement>(null)

  // ── Image loading ─────────────────────────────────────────────────────────
  const imgsRef = useRef<HTMLImageElement[]>([])

  // ── Per-slice image offsets from manifest ─────────────────────────────────
  const offsetsH = WORK_MANIFEST.map(m => m.offsetH)
  const offsetsV = WORK_MANIFEST.map(m => m.offsetV)

  // ── Mutable animation state — all in refs ─────────────────────────────────
  const widths      = useRef(new Array(N).fill(BASE_W))
  const targetW     = useRef(new Array(N).fill(BASE_W))
  const zooms       = useRef(new Array(N).fill(1))
  const targetZ     = useRef(new Array(N).fill(1))
  const chromas     = useRef(new Array(N).fill(0))
  const imgOffsets  = useRef(new Array(N).fill(0))
  const targetIO    = useRef(new Array(N).fill(0))
  const closingIO   = useRef(new Array(N).fill(0))

  const snapW       = useRef(new Array(N).fill(BASE_W))
  const snapZ       = useRef(new Array(N).fill(1))
  const snapC       = useRef(new Array(N).fill(0))
  const snapLeft    = useRef(0)

  const mode        = useRef<'carousel'|'opening'|'closing'|'fullview'|'nav'>('carousel')
  const openIdx     = useRef(-1)
  const openProg    = useRef(0)
  const hovIdx      = useRef(-1)
  const pendingHov  = useRef(false)

  const navProg     = useRef(0)
  const navDir      = useRef(0)
  const navFrom     = useRef(-1)
  const navTo       = useRef(-1)
  const navSwapped  = useRef(false)
  const navOutColor = useRef('rgb(235,0,139)')

  const sliceColors = useRef(new Array(N).fill('rgb(235,0,139)'))

  const hlInAlpha   = useRef(0)
  const hlInRise    = useRef(0)
  const hlInIdx     = useRef(-1)
  const hlInEl      = useRef(0)
  const hlInRun     = useRef(false)
  const hlOutAlpha  = useRef(0)
  const hlOutIdx    = useRef(-1)
  const hlOutEl     = useRef(0)
  const hlOutRun    = useRef(false)

  const carHL       = useRef(1)    // carousel-text opacity (managed as ref for tick)
  const carHLFading = useRef(false)

  const mouseX = useRef(-1)
  const mouseY = useRef(-1)

  const prevTime = useRef<number | null>(null)

  // ── Body text fade state (3 elements: meta, body, pullquote) ──────────────
  const elOp      = useRef([0, 0, 0])
  const elTarget  = useRef([0, 0, 0])
  const elFading  = useRef([false, false, false])
  const elTimers  = useRef<ReturnType<typeof setTimeout>[]>([])

  // ── DOM refs for body text elements (populated in page.tsx via callback) ──
  // We don't own these — we just talk to parent via onOpen/onClose.
  // Fade state is driven by the tick and applied via CSS vars on the canvas container.
  // The actual body elements live in CaseStudyPanel.

  // For the carousel-text (headline + blurb) rendered in JSX below:
  const carTextRef = useRef<HTMLDivElement>(null)
  const pullWrapRef  = useRef<HTMLParagraphElement>(null)
  const pullLine1Ref = useRef<HTMLSpanElement>(null)
  const pullLine2Ref = useRef<HTMLSpanElement>(null)

// Fit the below-carousel pullquote to the column without wrapping. It's
// rendered at OPENING size; on mobile that can be wide enough to break
// onto a third line within one of these two spans, so this measures the
// natural (nowrap) width of each line and scales the font down only if
// it actually overflows the 90% column. Desktop already fits at OPENING
// size, so this resolves to scale 1 there and does nothing visible.
useEffect(() => {
  function fitPullquote() {
    const wrap = carTextRef.current
    const p = pullWrapRef.current
    const l1 = pullLine1Ref.current
    const l2 = pullLine2Ref.current
    if (!wrap || !p || !l1 || !l2) return

    // Reset to the token's real size first — measuring a stale, already
    // scaled-down value from a prior pass would compound the shrink.
    const openingPx = window.innerWidth * (type.OPENING.sizeVw / 100)
    p.style.fontSize = `${openingPx}px`

    const availablePx = wrap.clientWidth
    const widest = Math.max(l1.scrollWidth, l2.scrollWidth)
    const scale = widest > availablePx ? availablePx / widest : 1
    p.style.fontSize = `${openingPx * scale}px`
  }

  fitPullquote()
  window.addEventListener('resize', fitPullquote)
  return () => window.removeEventListener('resize', fitPullquote)
}, [type.OPENING.sizeVw, type.OPENING.weight, type.OPENING.tracking, col.vw])


  // ── Helpers ───────────────────────────────────────────────────────────────
  const carouselCX = (i: number) => i * BASE_W + BASE_W / 2 + offsetsH[i]
  const fullviewCX = () => CW / 2

  function pickSliceColors() {
    for (let i = 0; i < N; i++) sliceColors.current[i] = pickColor(CFG.COL_RANGE)
  }

  function takeSnapshot(i: number) {
    snapW.current   = [...widths.current]
    snapZ.current   = [...zooms.current]
    snapC.current   = [...chromas.current]
    snapLeft.current = snapW.current.slice(0, i).reduce((a, b) => a + b, 0)
  }

  // ── Nav button visibility ─────────────────────────────────────────────────
function showNav() {
    const n = navRef.current; if (!n) return
    n.style.opacity = '1'; n.style.transform = 'scale(1)'; n.style.pointerEvents = 'auto'
  }
  function hideNav() {
    const n = navRef.current; if (!n) return
    n.style.opacity = '0'; n.style.transform = 'scale(0.85)'; n.style.pointerEvents = 'none'
  }

  // ── Headline helpers ──────────────────────────────────────────────────────
  function startHLIn(idx: number) {
    hlInIdx.current = idx; hlInEl.current = 0; hlInAlpha.current = 0
    hlInRise.current = CFG.TEXT_RISE; hlInRun.current = true
  }
  function startHLOut(idx: number) {
    hlOutIdx.current = idx; hlOutEl.current = 0; hlOutAlpha.current = 1; hlOutRun.current = true
  }

  // ── Body element fades ────────────────────────────────────────────────────
  function cancelFades() {
    elTimers.current.forEach(t => clearTimeout(t))
    elTimers.current = []
    elFading.current = [false, false, false]
  }
  function startSuccessiveFades(target: number, delay: number) {
    cancelFades()
    for (let i = 0; i < 3; i++) {
      elTimers.current[i] = setTimeout(() => {
        elFading.current[i] = true
        elTarget.current[i] = target
      }, delay + i * CFG.FADE_OFFSET)
    }
  }

  // ── Canvas draw functions ─────────────────────────────────────────────────
  const drawImage = useCallback((
    ctx: CanvasRenderingContext2D,
    idx: number, clipX: number, clipW: number,
    contentCX: number, zoom: number, chroma: number
  ) => {
    if (clipW < 0.5) return
    ctx.save()
    ctx.beginPath(); ctx.rect(clipX, 0, clipW, _ech); ctx.clip()
    ctx.translate(contentCX, _ech / 2); ctx.scale(zoom, zoom); ctx.translate(-contentCX, -_ech / 2)
    const img = imgsRef.current[idx]
    if (img && img.complete && img.naturalWidth > 0) {
      const iw = img.naturalWidth, ih = img.naturalHeight
      const scale = Math.max(CW / iw, _ech / ih)
      const dw = iw * scale, dh = ih * scale
      ctx.drawImage(img, contentCX - dw / 2, (_ech - dh) / 2 + offsetsV[idx], dw, dh)
    } else {
      ctx.fillStyle = '#222'
      ctx.fillRect(0, 0, CW, _ech)
    }
    if (chroma > 0) { ctx.fillStyle = `rgba(0,0,0,${chroma * 0.6})`; ctx.fillRect(0, 0, CW, _ech) }
    ctx.restore()
  }, [offsetsV])

  const drawVignette = useCallback((ctx: CanvasRenderingContext2D, clipX: number, clipW: number) => {
    if (CFG.VIG_OPACITY <= 0 || clipW < 0.5) return
    ctx.save()
    ctx.beginPath(); ctx.rect(clipX, 0, clipW, _ech); ctx.clip()
    const gradY = _ech * (1 - CFG.VIG_HEIGHT)
    const vg = ctx.createLinearGradient(0, gradY, 0, _ech)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, `rgba(0,0,0,${CFG.VIG_OPACITY})`)
    ctx.fillStyle = vg
    ctx.fillRect(clipX, gradY, clipW, _ech - gradY)
    ctx.restore()
  }, [])

  const drawHL = useCallback((
    ctx: CanvasRenderingContext2D,
    idx: number, alpha: number, rise: number,
    clipX: number, clipW: number, translateX?: number
  ) => {
    if (alpha <= 0 || idx < 0 || idx >= N) return
    if (clipW !== undefined && clipW < 1) return
    const lines = HEADLINES[idx].split('\n')
    ctx.save()
    if (clipX !== undefined) { ctx.beginPath(); ctx.rect(clipX, 0, clipW, _ech); ctx.clip() }
    if (translateX) ctx.translate(translateX, 0)
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
    const hlScale = _hlNativeSize / 52
    ctx.font = `bold ${_hlNativeSize}px Archivo`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    const pad = _hlPadNative, lineH = Math.round(55 * hlScale)
    const totalH = lines.length * lineH
    const baseY = _ech - 48 - totalH + CFG.HL_Y - rise
    lines.forEach((line, i) => ctx.fillText(line, pad, baseY + (i + 1) * lineH))
    ctx.restore()
  }, [])

  // ── Main render ───────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CW, _ech)
    const w = widths.current
    const z = zooms.current
    const c = chromas.current
    const io = imgOffsets.current
    const m = mode.current
    const oi = openIdx.current
    const op = openProg.current

    if (m === 'carousel') {
      let x = 0
      for (let i = 0; i < N; i++) { drawImage(ctx, i, x, w[i], carouselCX(i) + io[i], z[i], c[i]); x += w[i] }
      x = 0; for (let i = 0; i < N; i++) { drawVignette(ctx, x, w[i]); x += w[i] }
      return
    }

const ep = easeIO(m === 'nav' ? navProg.current : m === 'fullview' ? 1 : op)
    const fCX = fullviewCX()
    const ct = CFG.CHROMA_ON ? CFG.CHROMA_AMT : 0
    const sliceFadeOp = CFG.SLICE_FADE_COLOR ? ep * CFG.COL_OPACITY : 0

    if (m === 'closing') {
      const clipX = lerp(oi * BASE_W, 0, ep)
      const clipW = lerp(BASE_W, CW, ep)
      const cCX = lerp(carouselCX(oi), fCX, ep)
      const cZoom = lerp(1, CFG.FULL_ZOOM, ep)
      for (let i = 0; i < N; i++) {
        if (i === oi) continue
        const ow = lerp(BASE_W, 0, ep)
        const ox = i < oi ? i * lerp(BASE_W, 0, ep) : clipX + clipW + (i - oi - 1) * lerp(BASE_W, 0, ep)
        const closingOff = closingIO.current[i] * ep
        drawImage(ctx, i, ox, Math.max(0, ow), carouselCX(i) + closingOff, 1, ct)
        if (sliceFadeOp > 0) { ctx.save(); ctx.globalAlpha = sliceFadeOp; ctx.fillStyle = sliceColors.current[i]; ctx.fillRect(ox, 0, Math.max(0, ow), _ech); ctx.restore() }
        drawVignette(ctx, ox, Math.max(0, ow))
      }
      drawImage(ctx, oi, clipX, clipW, cCX, cZoom, lerp(ct, 0, ep))
      drawVignette(ctx, clipX, clipW)
      drawHL(ctx, hlOutIdx.current, hlOutAlpha.current, 0, clipX, clipW)
      return
    }

    if (m === 'opening' || m === 'fullview') {
      const clipX = lerp(snapLeft.current, 0, ep)
      const clipW = lerp(snapW.current[oi], CW, ep)
      const cCX = lerp(carouselCX(oi), fCX, ep)
      const cZoom = lerp(snapZ.current[oi], CFG.FULL_ZOOM, ep)
      let sx = 0
      for (let i = 0; i < N; i++) {
        if (i === oi) { sx += snapW.current[i]; continue }
        const sw = snapW.current[i], ow = lerp(sw, 0, ep)
        const ox = i < oi ? lerp(sx, 0, ep) : clipX + clipW + lerp(sx - snapLeft.current - snapW.current[oi], 0, ep)
        drawImage(ctx, i, ox, Math.max(0, ow), ox + Math.max(0, ow) / 2, lerp(snapZ.current[i], 1, ep), lerp(snapC.current[i], 0, ep))
        if (sliceFadeOp > 0) { ctx.save(); ctx.globalAlpha = sliceFadeOp; ctx.fillStyle = sliceColors.current[i]; ctx.fillRect(ox, 0, Math.max(0, ow), _ech); ctx.restore() }
        drawVignette(ctx, ox, Math.max(0, ow)); sx += sw
      }
      drawImage(ctx, oi, clipX, clipW, cCX, cZoom, 0)
      drawVignette(ctx, clipX, clipW)
      drawHL(ctx, hlInIdx.current, hlInAlpha.current, hlInRise.current, clipX, clipW)
      return
    }

    if (m === 'nav') {
      const fZ = CFG.FULL_ZOOM
      const nf = navFrom.current, nt = navTo.current, nd = navDir.current
      const travel = CFG.OUT_TRAVEL
      const inOff = Math.round(nd * CW * (1 - ep))
      const outOff = Math.round(nd * travel * CW * ep)
      const navColOp = CFG.NAV_COL_FADE ? ep * CFG.COL_OPACITY : 0

      ctx.save(); ctx.translate(-outOff, 0)
      if (nd > 0) {
        drawImage(ctx, nf, outOff, CW, fCX, fZ, 0); drawVignette(ctx, outOff, CW)
        if (navColOp > 0) { ctx.save(); ctx.globalAlpha = navColOp; ctx.fillStyle = navOutColor.current; ctx.fillRect(outOff, 0, CW, _ech); ctx.restore() }
      } else {
        drawImage(ctx, nf, 0, CW + outOff, fCX, fZ, 0); drawVignette(ctx, 0, CW + outOff)
        if (navColOp > 0) { ctx.save(); ctx.globalAlpha = navColOp; ctx.fillStyle = navOutColor.current; ctx.fillRect(0, 0, CW + outOff, _ech); ctx.restore() }
      }
      if (!navSwapped.current) {
        if (nd > 0) { drawHL(ctx, hlOutIdx.current, hlOutAlpha.current, 0, outOff, Math.max(0, inOff - outOff), -outOff) }
        else { drawHL(ctx, hlOutIdx.current, hlOutAlpha.current, 0, CW + inOff, Math.max(0, -inOff + outOff), -outOff) }
      }
      ctx.restore()

      ctx.save()
      if (nd > 0) { ctx.beginPath(); ctx.rect(inOff, 0, CW - inOff, _ech); ctx.clip() }
      else { ctx.beginPath(); ctx.rect(0, 0, CW + inOff, _ech); ctx.clip() }
      ctx.translate(inOff, 0); drawImage(ctx, nt, 0, CW, fCX, fZ, 0); drawVignette(ctx, 0, CW)
      if (nd > 0) { drawHL(ctx, hlInIdx.current, hlInAlpha.current, hlInRise.current, inOff, CW - inOff, inOff) }
      else { drawHL(ctx, hlInIdx.current, hlInAlpha.current, hlInRise.current, 0, CW + inOff, inOff) }
      ctx.restore()
    }
  }, [drawImage, drawVignette, drawHL])

  // ── Hit layer ─────────────────────────────────────────────────────────────
  const updateHitLayer = useCallback(() => {
    const hit = hitRef.current
    const full = fullHitRef.current
    if (!hit || !full) return
    hit.innerHTML = ''
    if (mode.current === 'carousel') {
      hit.style.display = 'flex'; full.style.display = 'none'
      for (let i = 0; i < N; i++) {
        const sl = document.createElement('div')
        sl.style.cssText = `height:${_ech}px;flex-shrink:0;cursor:pointer;flex-basis:${BASE_W}px`
        const idx = i
        sl.addEventListener('mouseenter', () => {
          if (mode.current !== 'carousel') return
          hovIdx.current = idx
          const exp = CFG.HOV_EXPAND, shrink = exp / (N - 1), z = CFG.HOV_ZOOM, push = CFG.IMG_PUSH
          for (let j = 0; j < N; j++) {
            targetW.current[j] = j === idx ? BASE_W + exp : BASE_W - shrink
            targetZ.current[j] = j === idx ? z : 1
            targetIO.current[j] = j === idx ? 0 : (j < idx ? -(exp / (N - 1)) * push : (exp / (N - 1)) * push)
          }
        })
        sl.addEventListener('mouseleave', () => {
          if (mode.current !== 'carousel' || hovIdx.current !== idx) return
          hovIdx.current = -1
          for (let j = 0; j < N; j++) { targetW.current[j] = BASE_W; targetZ.current[j] = 1; targetIO.current[j] = 0 }
        })
        sl.addEventListener('click', () => openCase(idx))
        hit.appendChild(sl)
      }
    } else {
      hit.style.display = 'none'
      full.style.display = mode.current === 'fullview' ? 'block' : 'none'
    }
  }, [])

  // ── Open / close / nav ────────────────────────────────────────────────────
  const openCase = useCallback((i: number) => {
    if (mode.current !== 'carousel') return
    takeSnapshot(i)
    openIdx.current = i; openProg.current = 0; mode.current = 'opening'; hovIdx.current = -1
    pickSliceColors()
    hlOutAlpha.current = 0; hlOutIdx.current = -1; hlOutRun.current = false
    updateHitLayer()
    showNav()
    // Fade carousel text out
    if (carTextRef.current) {
      carTextRef.current.style.transition = 'opacity 300ms ease'
      carTextRef.current.style.opacity = '0'
    }
    carHL.current = 0
    // After carousel text clears, start headline + body
    setTimeout(() => {
      startHLIn(i)
      startSuccessiveFades(1, 0)
      onOpen(i)
    }, 300)
  }, [updateHitLayer, onOpen])

  const closeCase = useCallback(() => {
    if (mode.current !== 'fullview') return
    hideNav()
    mode.current = 'closing'
    cancelFades()
    openProg.current = 1
    closingIO.current = [...imgOffsets.current]
    startHLOut(openIdx.current)
    hlInAlpha.current = 0; hlInIdx.current = -1; hlInRun.current = false
    updateHitLayer()
    const hlOutDur = CFG.HL_FADE_DUR * 0.6
    setTimeout(() => {
      carHL.current = 0
      carHLFading.current = true
      if (carTextRef.current) carTextRef.current.style.transition = ''
    }, hlOutDur + 50)
    onClose()
  }, [updateHitLayer, onClose])

const stepCase = useCallback((dir: number) => {
    if (mode.current !== 'fullview') return
    navFrom.current = openIdx.current
    navTo.current = (openIdx.current + dir + N) % N
    navDir.current = dir; navProg.current = 0; navSwapped.current = false
    navOutColor.current = pickColor(CFG.COL_RANGE)
    startHLOut(navFrom.current)
    mode.current = 'nav'
    cancelFades()
    updateHitLayer()
  }, [updateHitLayer])

  // ── RAF tick ──────────────────────────────────────────────────────────────
  const tick = useCallback((now: number) => {
    if (!prevTime.current) prevTime.current = now
    const dt = Math.min(now - prevTime.current, 50)
    prevTime.current = now

    // Body element fades
    for (let i = 0; i < 3; i++) {
      if (elFading.current[i]) {
        const sp = clamp(dt / CFG.FADE_DUR, 0, 1) * 3
        elOp.current[i] = lerp(elOp.current[i], elTarget.current[i], sp)
        if (Math.abs(elOp.current[i] - elTarget.current[i]) < 0.01) { elOp.current[i] = elTarget.current[i]; elFading.current[i] = false }
      }
    }

    // Carousel text fade-in after close
    if (carHLFading.current) {
      carHL.current = Math.min(1, carHL.current + dt / 400)
      if (carTextRef.current) carTextRef.current.style.opacity = String(carHL.current)
      if (carHL.current >= 1) carHLFading.current = false
    }

    // Headline in/out
    if (hlInRun.current) {
      hlInEl.current += dt
      const t = clamp(hlInEl.current / CFG.HL_FADE_DUR, 0, 1)
      hlInAlpha.current = easeOut(t); hlInRise.current = CFG.TEXT_RISE * (1 - easeOut(t))
      if (t >= 1) { hlInRun.current = false; hlInAlpha.current = 1; hlInRise.current = 0 }
    }
    if (hlOutRun.current) {
      hlOutEl.current += dt
      const t = clamp(hlOutEl.current / (CFG.HL_FADE_DUR * 0.6), 0, 1)
      hlOutAlpha.current = 1 - easeOut(t)
      if (t >= 1) { hlOutRun.current = false; hlOutAlpha.current = 0; hlOutIdx.current = -1 }
    }

    const m = mode.current

    if (m === 'carousel') {
      const isMobile = isMobileRef.current
      const sp = clamp(dt / (CFG.HOV_SPEED * 0.45), 0, 1)
      let dirty = false, allSettled = true
      for (let i = 0; i < N; i++) {
        const nw = lerp(widths.current[i], targetW.current[i], sp)
        const nz = lerp(zooms.current[i], targetZ.current[i], sp)
        // Mobile: no hover system — all slices stay at full brightness always
        const chromaTarget = (!isMobile && CFG.CHROMA_ON && i !== hovIdx.current) ? CFG.CHROMA_AMT : 0
        const nc = lerp(chromas.current[i], chromaTarget, sp)
        const no = lerp(imgOffsets.current[i], targetIO.current[i], sp)
        if (Math.abs(nw - widths.current[i]) > 0.05 || Math.abs(nz - zooms.current[i]) > 0.0001 || Math.abs(nc - chromas.current[i]) > 0.001 || Math.abs(no - imgOffsets.current[i]) > 0.1) dirty = true
        if (Math.abs(nw - BASE_W) > 1) allSettled = false
        widths.current[i] = nw; zooms.current[i] = nz; chromas.current[i] = nc; imgOffsets.current[i] = no
      }
      if (pendingHov.current && allSettled) {
        pendingHov.current = false
        // Re-activate hover at cursor position — mouse-only, skip on touch
        if (!isMobile && mouseY.current >= 0 && mouseY.current <= _ech) {
          let x = 0
          for (let i = 0; i < N; i++) {
            x += BASE_W
            if (mouseX.current < x) { hovIdx.current = i; break }
          }
        }
      }
      if (dirty || hlInRun.current || hlOutRun.current) render()
    }

    if (m === 'opening' || m === 'closing') {
      const sp = clamp(dt / CFG.FULL_DUR * 2.2, 0, 1)
      const target = m === 'opening' ? 1 : 0
      openProg.current = lerp(openProg.current, target, sp)
      if (Math.abs(openProg.current - target) < 0.006) {
        openProg.current = target
        if (m === 'opening') {
          mode.current = 'fullview'
          updateHitLayer()
        } else {
          widths.current = new Array(N).fill(BASE_W)
          zooms.current = new Array(N).fill(1)
          imgOffsets.current = new Array(N).fill(0)
          targetW.current = new Array(N).fill(BASE_W)
          targetZ.current = new Array(N).fill(1)
          targetIO.current = new Array(N).fill(0)
          chromas.current = new Array(N).fill(CFG.CHROMA_ON && !isMobileRef.current ? CFG.CHROMA_AMT : 0)
          hovIdx.current = -1
          elOp.current = [0, 0, 0]; elTarget.current = [0, 0, 0]
          hlInAlpha.current = 0; hlInIdx.current = -1; hlInRun.current = false
          hlOutAlpha.current = 0; hlOutIdx.current = -1; hlOutRun.current = false
          mode.current = 'carousel'; openIdx.current = -1
          updateHitLayer()
          pendingHov.current = true
        }
      }
      render()
    }

if (m === 'nav') {
      const sp = clamp(dt / CFG.NAV_DUR * 2.2, 0, 1)
      navProg.current = lerp(navProg.current, 1, sp)

      if (navProg.current >= 0.5 && !navSwapped.current) {
        navSwapped.current = true
        elOp.current = [0, 0, 0]; elTarget.current = [0, 0, 0]; elFading.current = [false, false, false]
        hlOutAlpha.current = 0; hlOutIdx.current = -1; hlOutRun.current = false
        hlInAlpha.current = 0; hlInIdx.current = -1; hlInRun.current = false
        const nd = navDir.current, nt = navTo.current
        const rightDelay = nd > 0 ? CFG.HL_RIGHT_DELAY : 0
        const totalDelay = Math.max(0, CFG.HL_DELAY + rightDelay)
        if (totalDelay <= 0) { startHLIn(nt) } else { setTimeout(() => { if (mode.current === 'nav' || mode.current === 'fullview') startHLIn(nt) }, totalDelay) }
        startSuccessiveFades(1, totalDelay)
        onOpen(nt)
      }

      if (navProg.current > 0.994) {
        navProg.current = 1; openIdx.current = navTo.current; mode.current = 'fullview'
        hlInAlpha.current = 1; hlInRise.current = 0; hlInRun.current = false
        hlOutAlpha.current = 0; hlOutIdx.current = -1; hlOutRun.current = false
        updateHitLayer()
      }
      render()
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [render, updateHitLayer, onOpen])

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Load images
    imgsRef.current = WORK_MANIFEST.map(m => {
      const img = new Image()
      img.src = m.image
      img.onload = () => render()
      return img
    })

    // Mouse tracking
    const onMove = (e: MouseEvent) => {
      const wrap = canvasRef.current?.parentElement
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      const s = CW / rect.width
      mouseX.current = (e.clientX - rect.left) * s
      mouseY.current = (e.clientY - rect.top) * s
    }
    document.addEventListener('mousemove', onMove)

    // Scale stage on resize
 const scaleStage = () => {
  const wrap = wrapRef.current
  const stage = stageRef.current
  const canvas = canvasRef.current
  const hit = hitRef.current
  const full = fullHitRef.current
  if (!wrap || !stage) return
  isMobileRef.current = window.innerWidth < 768
  _ech = isMobileRef.current ? Math.round(CH * MOBILE_BAND_HEIGHT_SCALE) : CH
  const s = wrap.clientWidth / CW
  _hlNativeSize = isMobileRef.current ? Math.round(getType().PULLQUOTE.sizePx / s) : 52
  _hlPadNative = Math.round(getColumn().marginVw * CW / 100)
  stage.style.transform = `scale(${s})`
  stage.style.height = `${_ech}px`
  wrap.style.height = `${_ech * s}px`
  if (canvas) { canvas.width = CW; canvas.height = _ech; canvas.style.height = `${_ech}px` }
  if (hit) hit.style.height = `${_ech}px`
  if (full) full.style.height = `${_ech}px`
}
    window.addEventListener('resize', scaleStage)
    scaleStage()

onRegisterControls(stepCase, closeCase)
    updateHitLayer()
    rafRef.current = requestAnimationFrame(tick)

// Page load fade-in
if (!fadeRan.current) {
  fadeRan.current = true
  const wrap = wrapRef.current
  const carText = carTextRef.current
  if (wrap) {
    wrap.style.transition = 'none'
    wrap.style.opacity = '0'
    setTimeout(() => { wrap.style.transition = 'opacity 1000ms ease'; wrap.style.opacity = '1' }, 200)
  }
  if (carText) {
    carText.style.transition = 'none'
    carText.style.opacity = '0'
    carText.style.transform = 'translateY(12px)'
    setTimeout(() => { carText.style.transition = 'opacity 1000ms ease, transform 700ms cubic-bezier(0.22,1,0.36,1)'; carText.style.opacity = '1'; carText.style.transform = 'translateY(0px)' }, 600)
  }
}

    return () => {
      document.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', scaleStage)
      cancelAnimationFrame(rafRef.current)
      cancelFades()
    }
  }, [tick, render, updateHitLayer])

  // ── Expose stepCase / closeCase to parent via activeIdx ───────────────────
  // Parent passes activeIdx; we watch it to detect external nav requests.
  // For now parent drives nav via the buttons rendered here.


return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={wrapRef}
style={{ width: '100%', position: 'relative', background: '#000', overflow: 'hidden' }}
      >
        <div
          ref={stageRef}
          style={{ width: CW, height: CH, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, background: '#111', overflow: 'hidden' }}
        >

       <canvas
  ref={canvasRef}
  width={CW}
  height={CH}
  style={{ position: 'absolute', top: 0, left: 0, width: CW, height: CH, pointerEvents: 'none' }}
/>
          {/* Hit layers */}
          <div
            ref={hitRef}
            style={{ position: 'absolute', top: 0, left: 0, width: CW, height: CH, display: 'flex', zIndex: 2 }}
          />
          <div
            ref={fullHitRef}
            onClick={() => { if (CFG.CLICK_TO_CLOSE) closeCase() }}
            style={{ position: 'absolute', top: 0, left: 0, width: CW, height: CH, cursor: 'pointer', zIndex: 2, display: 'none' }}
          />
          
</div>
      </div>
{/* Carousel text — resting state headline + subhead */}
      <div
  ref={carTextRef}
  style={{ position: 'absolute', top: '100%', left: `${col.marginVw}vw`, width: `${col.vw}vw`, pointerEvents: 'none', zIndex: 1, marginTop: 24, opacity: 0, transform: 'translateY(12px)' }}
>
<p
  ref={pullWrapRef}
  style={{ fontSize: `${type.OPENING.sizeVw}vw`, fontWeight: type.OPENING.weight, lineHeight: type.OPENING.lineHeight, letterSpacing: `${type.OPENING.tracking}em`, color: '#fff', margin: '0 0 10px 0', fontFamily: TYPE.display }}
>
  <span ref={pullLine1Ref} style={{ display: 'block', whiteSpace: 'nowrap' }}><span style={{ color: COLORS.work }}>The work</span> reveals the process.</span>
  <span ref={pullLine2Ref} style={{ display: 'block', whiteSpace: 'nowrap' }}>The process reveals <span style={{ color: COLORS.work }}>the person.</span></span>
</p>

            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.65)', fontFamily: TYPE.display, lineHeight: 1.5 }}>
              This is how I apply curiosity with empathy to solve creative problems.
            </p>
          </div>

      

    </div>
  )
}
