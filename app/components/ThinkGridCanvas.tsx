'use client';

// TYPE ROLES USED IN THIS FILE:
//   band title (canvas) → BAND_HEADLINE (shared with WorkCarousel.drawHL)

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useColumn, NAV, COLORS, TYPE, BAND_HEADLINE, BAND_VIGNETTE, BREAKPOINTS, DEBUG, bandHeightPx, BAND_ANCHOR_Y, BAND_OPEN_LANDED_AT } from './SiteTokens';
import { THINK_GRID, coverImageFor, offsetFor } from '../data/ThinkManifest';
import { drawCover } from './SiteCanvasCover';

// ── Layout — 13 cells, native units on a 1440-wide reference canvas ────────
// adjust gap value here 6 is current setting
const NATIVE_W = 1440;
const GAP = 6;

// _bandH — the band height in NATIVE units on the 1440-wide stage. It is no
// longer an authored constant: BAND_HEIGHT_TIERS is authored in SCREEN pixels
// and scaleStage converts it back to native here, once, so that every existing
// consumer (the five `logW * (_bandH / NATIVE_W)` sites and the stage-space
// maths in the open animation) keeps working in the space it already uses.
// Because the tiers are flat, _bandH now VARIES with viewport width — that is
// the conversion doing its job, not drift.
let _bandH = 305; // placeholder until the first scaleStage; see BAND_HEIGHT_TIERS
let _bandTitlePx = BAND_HEADLINE.sizePx; // SCREEN pixels; updated by scaleStage. See BAND_HEADLINE.

const ROW1_H = 357, ROW2_H = 300, ROW3_H = 355.5, ROW4_H = 280;
const row1Quarter = (NATIVE_W - 2 * GAP) / 4;
const row1Half = row1Quarter * 2;
const row24Width = (NATIVE_W - 2 * GAP) / 3;
const row3Width = (NATIVE_W - 3 * GAP) / 4;

const row1Y = 0;
const row2Y = row1Y + ROW1_H + GAP;
const row3Y = row2Y + ROW2_H + GAP;
const row4Y = row3Y + ROW3_H + GAP;

const LAYOUT = [
  { x: 0, y: row1Y, w: row1Half, h: ROW1_H },
  { x: row1Half + GAP, y: row1Y, w: row1Quarter, h: ROW1_H },
  { x: row1Half + GAP + row1Quarter + GAP, y: row1Y, w: row1Quarter, h: ROW1_H },
  { x: 0, y: row2Y, w: row24Width, h: ROW2_H },
  { x: row24Width + GAP, y: row2Y, w: row24Width, h: ROW2_H },
  { x: (row24Width + GAP) * 2, y: row2Y, w: row24Width, h: ROW2_H },
  { x: 0, y: row3Y, w: row3Width, h: ROW3_H },
  { x: row3Width + GAP, y: row3Y, w: row3Width, h: ROW3_H },
  { x: (row3Width + GAP) * 2, y: row3Y, w: row3Width, h: ROW3_H },
  { x: (row3Width + GAP) * 3, y: row3Y, w: row3Width, h: ROW3_H },
  { x: 0, y: row4Y, w: row24Width, h: ROW4_H },
  { x: row24Width + GAP, y: row4Y, w: row24Width, h: ROW4_H },
  { x: (row24Width + GAP) * 2, y: row4Y, w: row24Width, h: ROW4_H },
];
const TOTAL_H = row4Y + ROW4_H;
const N = LAYOUT.length;
// Retired: was 480 native units, the single authored band height. Replaced by
// BAND_HEIGHT_TIERS + bandHeightPx() in SiteTokens. ThinkPageController was its
// only importer and now calls the resolver directly.
// NATIVE_W's re-export went with BAND_HEIGHT: ThinkPageController imported both
// only to recompute the band height itself, and now calls bandHeightPx().
// (ThinkOpenAnimation has its own CONFIG.NATIVE_W and never read this one.)

const CFG = {
  HOVER_SPEED: 500,
  HOVER_ZOOM: 1.10,
  OVERLAY_DARKEN: 0.75,
  TITLE_SIZE: 25,
  FADE_DELAY_MS: 3000,
  FADE_DURATION_MS: 2000,
  TRANSITION_DURATION: 750,
  COL_RANGE: 0.40,
  COL_OPACITY: 1.00,
};

// Cover images resolve through the manifest — THINK_GRID maps each bento
// slot to a card number, coverImageFor() resolves that number to its
// flat-folder cover path. See ThinkManifest.ts.
//
// Titles resolve the same way, via /api/think/manifest — fetched once on
// mount below and looked up through THINK_GRID (see titleForSlot()), so
// slot→card resolution is identical for images and titles instead of
// titles bypassing THINK_GRID entirely.

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function easeIO(t: number) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function titleEaseOut(t: number, strength = 6) { return 1 - Math.pow(1 - clamp(t, 0, 1), strength); }
function titleEaseIn(t: number, strength = 6) { return Math.pow(clamp(t, 0, 1), strength); }

// ── OKLab color helpers (ported from WorkCarousel) ───────────────────────
function sL(c: number) { const v = c / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function lS(v: number) { return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); }
function toOk(r: number, g: number, b: number): [number, number, number] {
  const l = sL(r), m = sL(g), s = sL(b);
  const l2 = Math.pow(0.4122214708 * l + 0.5363325363 * m + 0.0514459929 * s, 1 / 3);
  const m2 = Math.pow(0.2119034982 * l + 0.6806995451 * m + 0.1073969566 * s, 1 / 3);
  const s2 = Math.pow(0.0883024619 * l + 0.2817188376 * m + 0.6299787005 * s, 1 / 3);
  return [0.2104542553 * l2 + 0.793617785 * m2 - 0.0040720468 * s2, 1.9779984951 * l2 - 2.428592205 * m2 + 0.4505937099 * s2, 0.0259040371 * l2 + 0.7827717662 * m2 - 0.808675766 * s2];
}
function frOk(L: number, a: number, b: number): [number, number, number] {
  const l2 = L + 0.3963377774 * a + 0.2158037573 * b;
  const m2 = L - 0.1055613458 * a - 0.0638541728 * b;
  const s2 = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l2 * l2 * l2, m = m2 * m2 * m2, s = s2 * s2 * s2;
  return [
    Math.max(0, Math.min(255, lS(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s))),
    Math.max(0, Math.min(255, lS(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s))),
    Math.max(0, Math.min(255, lS(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s))),
  ];
}
function lerpOk(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const la = toOk(...a), lb = toOk(...b);
  return frOk(la[0] + (lb[0] - la[0]) * t, la[1] + (lb[1] - la[1]) * t, la[2] + (lb[2] - la[2]) * t);
}
// Think page palette — yellowgreen base, spreading through the site palette
const PAGE_BASE: [number, number, number] = [214, 222, 35];
const PAGE_ADJ: [number, number, number][] = [[0, 173, 238], [136, 81, 152]];
const PAGE_FAR: [number, number, number][] = [[235, 0, 139], [250, 175, 64]];
function buildPalette(rf: number) {
  const p: [number, number, number][] = [PAGE_BASE];
  if (rf > 0) { const t = Math.min(1, rf * 2); for (const c of PAGE_ADJ) p.push(lerpOk(PAGE_BASE, c, 0.15 + t * 0.7)); }
  if (rf > 0.5) { const t = (rf - 0.5) * 2; for (const c of PAGE_FAR) p.push(lerpOk(PAGE_BASE, c, 0.15 + t * 0.7)); }
  return p;
}
function pickColor(rf: number) {
  const p = buildPalette(rf);
  const c = p[Math.floor(Math.random() * p.length)];
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// ── Vignette — bottom-darkening gradient ───────────────────────
// Shares BAND_VIGNETTE with WorkCarousel.drawVignette — enforced by the
// import, not by a comment asking the two to stay in step.
// heightFrac is an AMOUNT (bottom 40%), so it converts to a start point
// with (1 - heightFrac). WorkCarousel does the same conversion; this is
// the mirror of it, not a second opinion.
function drawVignette(ctx: CanvasRenderingContext2D, rect: Rect) {
  const gradY = rect.y + rect.h * (1 - BAND_VIGNETTE.heightFrac);
  const vg = ctx.createLinearGradient(0, gradY, 0, rect.y + rect.h);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(0,0,0,${BAND_VIGNETTE.opacity})`);
  ctx.save();
  ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  ctx.fillStyle = vg;
  ctx.fillRect(rect.x, gradY, rect.w, rect.h - gradY + rect.y);
  ctx.restore();
}

// ── Scroll lock — blocks scroll INPUT (wheel, touch-drag, keyboard)
// without ever touching CSS overflow. The scrollbar track stays
// permanently visible ('scroll' set once in globals.css) — locking
// input instead of hiding the track means no layout-width flash from
// the track appearing/disappearing during open/close transitions.
let scrollLockActive = false;
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
function preventWheel(e: WheelEvent) { e.preventDefault(); }
function preventTouchMove(e: TouchEvent) { e.preventDefault(); }
function preventScrollKeys(e: KeyboardEvent) { if (SCROLL_KEYS.has(e.key)) e.preventDefault(); }
function lockScroll() {
  if (scrollLockActive) return;
  scrollLockActive = true;
  window.addEventListener('wheel', preventWheel, { passive: false });
  window.addEventListener('touchmove', preventTouchMove, { passive: false });
  window.addEventListener('keydown', preventScrollKeys, { passive: false });
}
function unlockScroll() {
  if (!scrollLockActive) return;
  scrollLockActive = false;
  window.removeEventListener('wheel', preventWheel);
  window.removeEventListener('touchmove', preventTouchMove);
  window.removeEventListener('keydown', preventScrollKeys);
}

// ── DELETED 2026-08-29: the scroll floor. ────────────────────────────────────
// It was a passive 'scroll' listener that snapped scrollY back whenever it fell
// below bandDocYRef, guarding the "an open card is the top of the page"
// invariant. Two things were wrong with it, and the fixed band removes both.
//
// It could not work. Being passive, it could only correct a scroll that had
// already happened, and its own scrollTo emitted another scroll event — so
// pushing up at the floor set the browser's momentum against a per-frame yank
// and the band visibly vibrated. And it did not fire at all on any card opened
// from the top of the page, where bandDocY is 0 and `scrollY < 0` is never true.
//
// It is not needed. With the band fixed and the content anchored at document 0
// there is no "above the band" to reach, so there is nothing to guard.


interface Rect { x: number; y: number; w: number; h: number; }

interface Props {
  onOpen: (idx: number) => void;
  onClose: () => void;
  onRegisterControls: (step: (dir: number) => void, close: () => void) => void;
  headerRef?: React.RefObject<HTMLDivElement | null>;
  /** Fired on the exact frame the open animation lands. The case panel's
   *  fade-in waits for this instead of counting OPEN_DELAY ms from the click. */
  onOpenLanded?: () => void;
}

// Clip + fallback fill stay here; the fit itself is drawCover, shared with
// WorkCarousel.
//
// `cardNum` is the THINK_GRID value, not the slot index — offsetFor is keyed by
// card number, the same key coverImageFor uses, so a THINK_GRID reorder can
// never slide the crops out from under the images.
//
// `unit` converts a NATIVE-unit offset into the units this context is drawing
// in: 1 for the grid canvas (already native), logW / NATIVE_W for the band
// canvas (real screen pixels). THINK_OFFSETS is authored in native units so it
// means one thing, the same thing WORK_MANIFEST's offsets mean.
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  rect: Rect,
  cardNum: number,
  unit: number,
  anchorY: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img && img.complete && img.naturalWidth > 0) {
    const [ox, oy, scalePct] = offsetFor(cardNum);
    drawCover(ctx, img, rect, {
      offsetX: ox * unit,
      offsetY: oy * unit,
      scalePct,
      anchorY,
    });
  } else {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
}

function drawTitleBlock(ctx: CanvasRenderingContext2D, rect: Rect, title: string, alpha: number, size: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.font = `700 ${size}px ${TYPE.display}`;
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const lines = title.split('\n');
  const lineH = size * 1.25;
  let maxW = 0;
  for (const line of lines) maxW = Math.max(maxW, ctx.measureText(line).width);
  const blockH = lines.length * lineH;
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  const blockX = cx - maxW / 2;
  const blockTopY = cy - blockH / 2;
  lines.forEach((line, li) => {
    ctx.fillText(line, blockX, blockTopY + (li + 1) * lineH - (lineH - size) / 2);
  });
  ctx.restore();
}

/** Band title — fixed at final position, clipped to the card's current shape.
 *  `clipRect` = card's animated shape (what you see through).
 *  `posRect`  = final band rect (where the title actually sits).
 *  This makes the title read as "rising into view through the growing image"
 *  rather than sliding sideways with it (matching grid-mockup_v28). */
function drawBandTitle(
  ctx: CanvasRenderingContext2D,
  clipRect: Rect, posRect: Rect, title: string,
  alpha: number, padL: number, riseOffset: number,
) {
  if (alpha <= 0) return;
  ctx.save();
  // Clip to the card's CURRENT animated shape — not the final band
  ctx.beginPath();
  ctx.rect(clipRect.x, clipRect.y, clipRect.w, clipRect.h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  // Size and line height come from BAND_HEADLINE, shared with
  // WorkCarousel.drawHL — here already in screen pixels.
  const unitPx = _bandTitlePx / BAND_HEADLINE.sizePx; // proportional unit
  const fontSize = _bandTitlePx;
  const lineH = BAND_HEADLINE.lineHeightPx * unitPx;
  // NOT shared: Work expresses the same bottom offset as CH - 48 + HL_Y(20),
  // in NATIVE units that do not scale with the headline. So the two agree on
  // desktop/tablet and diverge on mobile, where this one scales and Work's
  // doesn't. Left as-is rather than silently moving the Work headline.
  const padB = 28 * unitPx;
  ctx.font = `700 ${fontSize}px ${TYPE.display}`;
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  const lines = title.split('\n');
  const totalH = lines.length * lineH;
  // Position relative to the FINAL band rect — title never moves horizontally
  const baseY = posRect.y + posRect.h - padB - totalH + riseOffset;
  lines.forEach((line, i) => {
    ctx.fillText(line, posRect.x + padL, baseY + (i + 1) * lineH);
  });
  ctx.restore();
}

export default function ThinkGridCanvas({ onOpen, onClose, onRegisterControls, headerRef, onOpenLanded }: Props) {
    const col = useColumn();

  const wrapRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const prevTime = useRef<number | null>(null);
  const scaleRef = useRef(1);
  const headerNaturalHRef = useRef(0);
  // The open/closing card now renders on a SEPARATE canvas, portaled
  // to document.body — genuinely independent of the grid's own
  // container, matching the mockup's sibling-element architecture.
  // Positioned at a real DOCUMENT coordinate (not viewport-fixed, not
  // nested inside anything that moves), so it scrolls normally with
  // the page and is never affected by the grid collapsing around it.
  const bandCanvasRef = useRef<HTMLCanvasElement>(null);
const bandDocYRef = useRef(0);
  const gridDocTopRef = useRef(0);

  const fromRectRef = useRef<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [bandMounted, setBandMounted] = useState(false);
  // The band is fixed for its ENTIRE life, not handed over partway through.
  //
  // It used to become fixed at the landing frame, which meant that during the
  // open animation it was still anchored to a DOCUMENT coordinate captured at
  // click time (bandDocYRef = window.scrollY). Opening collapses the grid and
  // inflates the spacer, and those two do not cancel exactly — measured, the
  // document ends ~16px shorter — so the browser clamps scrollY upward and the
  // anchor is left pointing below the viewport top. Blank band at the top,
  // then a pop when the handoff arrived. Only when clicking within that last
  // ~16px of scroll, which is why it healed on a second open: by then the
  // clamp had already happened and the anchor was reachable.
  //
  // Fixed from mount removes the class, not the instance: scroll is LOCKED for
  // the whole animation, so fixed-at-0 and absolute-at-scrollY paint
  // identically — but a viewport coordinate cannot be invalidated by a
  // document height change, so there is nothing left to go stale.
  // Client-only gate for the debug HUD's portal: createPortal reads `document`
  // at render, which does not exist during SSR. bandMounted cannot stand in —
  // the HUD must be up BEFORE a card is opened.
  const [hudMounted, setHudMounted] = useState(false);
  // The standard mount gate: one setState, once, on a debug-only path. The
  // cascading render the lint rule warns about cannot happen with an empty dep
  // array and no reader outside the HUD's own portal condition.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHudMounted(true); }, []);
  const [gridVisible, setGridVisible] = useState(false);

const gridInsetRef = useRef({ offset: 0, scale: 1 });
  function cellToScreen(rect: Rect): Rect {
    const { offset, scale } = gridInsetRef.current;
    return { x: offset + rect.x * scale, y: rect.y, w: rect.w * scale, h: rect.h };
  }

  // Analytic version of the live-DOM measurement openCard() does —
  // needed because the grid is collapsed (no hit-test divs) during
  // fullview/nav, so a cell's rect can't be read from the DOM at that
  // point. Same math, same coordinate system (band-canvas-local,
  // relative to bandDocYRef), just derived instead of measured.
  function computeCellRect(i: number): Rect {
    const raw = cellToScreen(LAYOUT[i]);
    const s = scaleRef.current;
    const docY = gridDocTopRef.current + raw.y * s;
    return { x: raw.x * s, y: docY - bandDocYRef.current, w: raw.w * s, h: raw.h * s };
  }
  
  // Sizing the band canvas in openCard() itself isn't reliable — after a
  // full close, the portal unmounts it, so on the NEXT open,
  // bandCanvasRef.current is still null at the moment openCard() runs
  // (React hasn't re-mounted it yet). This effect re-fires every time
  // bandMounted flips true, guaranteeing correct sizing regardless of
  // whether it's the first open or the fifth.
useEffect(() => {
    if (bandMounted && bandCanvasRef.current) {
      const dpr = window.devicePixelRatio || 1;
      // CSS display size = logical pixels; backing store = physical pixels for sharpness on HiDPI.
      bandCanvasRef.current.style.width  = `${window.innerWidth}px`;
      // Tall enough to encompass both the card's starting position
      // (which can be anywhere in the viewport) AND the band's final
      // position (at the top). Was bandHeight before, which clipped
      // the card at its starting position — causing the "unmask" look.
      bandCanvasRef.current.style.height = `${window.innerHeight}px`;
      bandCanvasRef.current.width  = window.innerWidth  * dpr;
      bandCanvasRef.current.height = window.innerHeight * dpr;
    }    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandMounted]);

  const imgsRef = useRef<HTMLImageElement[]>([]);
  // cardNum -> { title, narrowtitle } text, [br] already converted to '\n' in
  // both fields to match drawTitleBlock()/drawBandTitle()'s existing
  // title.split('\n') parsing. Populated once by the fetch effect below;
  // empty until then (mirrors how a cover image renders blank until its
  // own onload fires).
  const titlesRef = useRef<Record<number, { title: string; narrowtitle: string }>>({});
  const hovIdx = useRef(-1);
const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onOpenLandedRef = useRef(onOpenLanded);
  onOpenLandedRef.current = onOpenLanded;

  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  const zoom = useRef(new Array(N).fill(1));
  const darken = useRef(new Array(N).fill(0));
  const titleA = useRef(new Array(N).fill(0));
  const targetZoom = useRef(new Array(N).fill(1));
  const targetDarken = useRef(new Array(N).fill(0));
  const targetTitleA = useRef(new Array(N).fill(0));

  // Open/close — single canvas, single coordinate system, matching the
  // locked mockup exactly. NO window.scrollTo anywhere. bandY is a LIVE
  // measurement of wherever the page currently happens to be scrolled to
  // (mockup's viewportFrame.scrollTop equivalent) — the band renders
  // AT that position, it never scrolls anything TO that position.
  const mode = useRef<'grid' | 'opening' | 'closing' | 'fullview' | 'nav'>('grid');
  const openIdx = useRef(-1);
  const openProg = useRef(0);
  // Gates progress advancement until bandY has actually been measured
  // AFTER the header's collapse has painted — see openCard() below.
  const bandYReadyRef = useRef(false);
  // Trace buffer for the opening animation. The symptom ("the card vanishes,
  // then pops in") lives entirely inside the transition, so a live HUD reading
  // taken at rest cannot see it. Captured per frame, held after the animation
  // ends so it can be read at leisure. DEBUG.thinkBand only.
  const traceRef = useRef<string[]>([]);
  // Fired-once guard for the landing signal, which now fires part-way through
  // the animation rather than at its end. Cleared at the start of every open.
  const landedFiredRef = useRef(false);

  // Band title — independent animation timeline (spec: 100ms delay →
  // 1000ms rise on open; 300ms drop on close, doesn't follow card motion)
  const bandTitleProg = useRef(0);
  const bandTitleStart = useRef(0); // timestamp when title anim begins (after delay)

  // ── Nav (prev/next) — horizontal push between cards ────────────────────
  const navFromIdx = useRef(-1);
  const navToIdx = useRef(-1);
  const navDir = useRef(0);     // +1 = next (push left), -1 = prev (push right)
  const navProg = useRef(0);
  const navSwapped = useRef(false);
  const NAV_DUR = 650;
  const OUT_TRAVEL = 0.35;

  // Color overlay — each cell gets a random palette color at open time
  const cellColors = useRef<string[]>(Array(N).fill(''));

  // `unit` is the native-to-context conversion for this card's crop offsets —
  // 1 on the grid canvas, logW / NATIVE_W on the band canvas. See
  // drawImageCover.
  // anchorY is passed EXPLICITLY rather than inferred from `unit`. The two
  // always coincide today — the band is the only caller with unit !== 1 and the
  // only one that wants a bottom anchor — but that is a coincidence of the
  // current call sites, not a relationship. Deriving the anchor from the
  // coordinate-space converter would be a dependency on a proxy.
  const drawCardAt = useCallback((ctx: CanvasRenderingContext2D, i: number, rect: Rect, zm: number, dk: number, unit = 1, anchorY = 0.5) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(zm, zm);
    ctx.translate(-cx, -cy);
    drawImageCover(ctx, imgsRef.current[i], rect, THINK_GRID[i], unit, anchorY);
    if (dk > 0) {
      ctx.fillStyle = `rgba(13,13,13,${dk})`;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }, []);

  // Slot index -> THINK_GRID -> card number -> fetched title.
  // Mirrors coverImageFor(THINK_GRID[i]) exactly, so title lookup can no
  // longer drift out of sync with image lookup if THINK_GRID is reordered.
  //
  // Grid tiles use the SHORT title (narrowtitle) — sized for the tight
  // card space. The expanded/band view uses the LONG title (title) —
  // these are two different fields, not the same text at two sizes.
  function titleForSlot(slot: number): string {
    const cardNum = THINK_GRID[slot];
    return titlesRef.current[cardNum]?.narrowtitle ?? '';
  }
  function bandTitleForSlot(slot: number): string {
    const cardNum = THINK_GRID[slot];
    return titlesRef.current[cardNum]?.title ?? '';
  }

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, NATIVE_W, TOTAL_H);

    const m = mode.current;
if (m === 'grid') {
      for (let i = 0; i < N; i++) {
        const screenRect = cellToScreen(LAYOUT[i]);
        drawCardAt(ctx, i, screenRect, zoom.current[i], darken.current[i]);
        drawVignette(ctx, screenRect);
        drawTitleBlock(ctx, screenRect, titleForSlot(i), titleA.current[i], CFG.TITLE_SIZE);
      }
      return;
    }

    const oi = openIdx.current;
    const ep = easeIO(m === 'fullview' || m === 'nav' ? 1 : openProg.current);
    // Smooth, continuous recede — the header slides fully out of view by
    // its own height, the grid slides up to close the gap behind it (its
    // own height PLUS the 40px margin that used to sit below the
    // header). Pure transform, no layout/reflow, same ep driving the
    // card's own growth — this is what eliminates the jump, in either
    // direction, since nothing here is an instant snap anymore.
    if (m !== 'fullview' && m !== 'nav') {
      const totalShift = headerNaturalHRef.current + 40;
      if (headerRef?.current) headerRef.current.style.transform = `translateY(${-headerNaturalHRef.current * ep}px)`;
      if (outerRef.current) outerRef.current.style.transform = `translateY(${-totalShift * ep}px)`;
    }

    // The growing/shrinking card itself is drawn on the SEPARATE band
    // canvas now (see renderBand()) — this canvas only fades the other
    // 12 cards out of view. The clicked card's own cell is left blank
    // here (nothing draws over it) since the band canvas shows it
    // instead, portaled independently of this shrinking container.
    if (ep < 0.999) {

for (let i = 0; i < N; i++) {
        if (i === oi) continue;
        const r = cellToScreen(LAYOUT[i]);
        // Two-phase fade: image stays while color grows (0→0.6),
        // then everything fades to nothing together (0.6→1).
        const fadeAll = ep < 0.6 ? 1 : 1 - (ep - 0.6) / 0.4;
        ctx.save();
        ctx.globalAlpha = fadeAll;
        drawCardAt(ctx, i, r, 1, 0);
        drawVignette(ctx, r);
        // Color overlay — grows over the image, then fades with it
        const colOp = ep * CFG.COL_OPACITY;
        if (colOp > 0) {
          ctx.globalAlpha = fadeAll * colOp;
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = cellColors.current[i];
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }
        ctx.restore();
      }




    }
  }, [drawCardAt]);

  // Draws JUST the open/closing card, on its own portaled canvas,
  // positioned at a real DOCUMENT coordinate (bandDocYRef) — genuinely
  // independent of the grid's own container, so it's never affected by
  // that container collapsing around it. This is what actually fixes the
  // "lands above the viewport after scrolling" bug: the previous version
  // computed a target position correctly, but drew it inside a container
  // that itself always snapped to the top of the page, making the two
  // contradict each other. This canvas has no such container to fight.
  const renderBand = useCallback(() => {
    const canvas = bandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Scale context to physical pixels so all subsequent drawing uses logical CSS pixel coords.
    const dpr = window.devicePixelRatio || 1;
    const logW = window.innerWidth;
    const logH = window.innerHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logW, logH);
    const oi = openIdx.current;
    if (oi < 0) return;
    const m = mode.current;
    const bandH = logW * (_bandH / NATIVE_W);
    const to: Rect = { x: 0, y: 0, w: logW, h: bandH };
    const s = logW / NATIVE_W;
    const padL = logW * col.marginVw / 100;

    // ── Nav mode — horizontal push between two cards ───────────────────
    if (m === 'nav') {
      const ep = easeIO(navProg.current);
      const nd = navDir.current;
      const nf = navFromIdx.current;
      const nt = navToIdx.current;
      const absOutShift = OUT_TRAVEL * to.w * ep;
      const absInShift = to.w * (1 - ep);

      // Outgoing card — slides partially out
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, to.w, to.h); ctx.clip();
      const outX = nd > 0 ? -absOutShift : absOutShift;
      drawCardAt(ctx, nf, { x: outX, y: 0, w: to.w, h: to.h }, 1, 0, s, BAND_ANCHOR_Y);
      drawVignette(ctx, { x: outX, y: 0, w: to.w, h: to.h });
      ctx.restore();

      // Incoming card — slides in from opposite side, on top
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, to.w, to.h); ctx.clip();
      const inX = nd > 0 ? absInShift : -absInShift;
      drawCardAt(ctx, nt, { x: inX, y: 0, w: to.w, h: to.h }, 1, 0, s, BAND_ANCHOR_Y);
      drawVignette(ctx, { x: inX, y: 0, w: to.w, h: to.h });
      ctx.restore();

      // Outgoing title — fades out + slides opposite to nav direction
      const titleOutAlpha = clamp(1 - ep * 2.5, 0, 1); // gone by ~40%
      if (titleOutAlpha > 0) {
        const titleOutSlide = -nd * 30 * s * (1 - titleOutAlpha);
        ctx.save();
        ctx.translate(titleOutSlide, 0);
        drawBandTitle(ctx, to, to, bandTitleForSlot(nf), titleOutAlpha, padL, 0);
        ctx.restore();
      }

      // Incoming title — clips + translates in lockstep with incoming card (matches WorkCarousel)
      const rawTP = bandTitleProg.current;
      const tp = titleEaseOut(rawTP);
      if (tp > 0) {
        const clipX = nd > 0 ? inX : 0;
        const clipW = nd > 0 ? to.w - inX : to.w + inX;
        if (clipW > 0) {
          drawBandTitle(
            ctx,
            { x: clipX, y: 0, w: clipW, h: to.h },
            { x: inX, y: 0, w: to.w, h: to.h },
            bandTitleForSlot(nt), tp, padL, 0
          );
        }
      }
      return;
    }

    // ── Open / close / fullview — single card growing/shrinking ────────
    const ep = easeIO(m === 'fullview' ? 1 : openProg.current);
    const from = fromRectRef.current;
    const cur: Rect = {
      x: lerp(from.x, to.x, ep), y: lerp(from.y, to.y, ep),
      w: lerp(from.w, to.w, ep), h: lerp(from.h, to.h, ep),
    };
    if (DEBUG.thinkBandTrace && traceRef.current.length < 40) {
      // Recorded HERE, at the draw call, not in tick(): this is the rect the
      // card is actually painted into. Everything else is inference.
      // cardTopOnScreen converts the canvas-local y into viewport space via the
      // canvas's own live rect, so it stays honest across the absolute->fixed
      // handoff instead of assuming which coordinate system is in force.
      const el = bandCanvasRef.current;
      const canvasTop = el ? el.getBoundingClientRect().top : NaN;
      traceRef.current.push(
        `${mode.current[0]} p=${openProg.current.toFixed(2)} y=${cur.y.toFixed(0)} h=${cur.h.toFixed(0)}` +
        ` cvTop=${canvasTop.toFixed(0)} onScr=${(canvasTop + cur.y).toFixed(0)}` +
        ` sY=${window.scrollY.toFixed(0)} pos=${el ? getComputedStyle(el).position[0] : '?'}` +
        ``
      );
    }
    drawCardAt(ctx, oi, cur, 1, 0, s, BAND_ANCHOR_Y);
    drawVignette(ctx, cur);
    // Title — fixed at final position, clipped to current card shape.
    const isClosing = mode.current === 'closing';
    const rawTP = bandTitleProg.current;
    const tp = isClosing ? titleEaseIn(rawTP) : titleEaseOut(rawTP);
    const riseNative = isClosing ? 20 : 30;
    const riseOffset = (1 - tp) * riseNative * s;
    drawBandTitle(ctx, cur, to, bandTitleForSlot(oi), tp, padL, riseOffset);
  }, [drawCardAt, col.marginVw]);

  const updateHitLayer = useCallback(() => {
    const hit = hitRef.current;
    if (!hit) return;
    hit.innerHTML = '';
    if (mode.current === 'grid') {
      LAYOUT.forEach((rawCell, i) => {
        const cell = cellToScreen(rawCell);
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;left:${cell.x}px;top:${cell.y}px;width:${cell.w}px;height:${cell.h}px;cursor:pointer;`;
        el.addEventListener('mouseenter', () => {
          hovIdx.current = i;
          targetZoom.current[i] = CFG.HOVER_ZOOM;
          targetDarken.current[i] = CFG.OVERLAY_DARKEN;
          targetTitleA.current[i] = 1;
        });
        el.addEventListener('mouseleave', () => {
          if (hovIdx.current !== i) return;
          hovIdx.current = -1;
          targetZoom.current[i] = 1;
          targetDarken.current[i] = 0;
          targetTitleA.current[i] = 0;
        });
        el.addEventListener('click', () => openCard(i));
        hit.appendChild(el);
      });
    }
    // 'fullview' close-click is now handled directly by the band
    // canvas's own onClick in the JSX — it's a real, independently
    // positioned element, so it doesn't need a synthetic hit-div here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCard(i: number) {
    if (mode.current !== 'grid') return;

    if (headerRef?.current) headerNaturalHRef.current = headerRef.current.scrollHeight;

    // Band position: a real DOCUMENT coordinate, computed once, directly
    // from current scroll position — not derived from the grid's own
    // container, which is what caused the previous bug (that container
    // always ends up at the top of the page once collapsed, contradicting
    // wherever bandY said the band should be).
    // The close bookmark: where the reader was when they clicked. Nothing
    // positions anything from this any more, so the parent no longer needs to
    // be told — onBandPositioned went with the document anchor it served.
    bandDocYRef.current = window.scrollY;
        const wrapRect = wrapRef.current?.getBoundingClientRect();
    if (wrapRect) {
      gridDocTopRef.current = wrapRect.top + window.scrollY;
    }
    // Starting rect: the clicked cell's REAL on-screen position, converted
    // to the band canvas's own local coordinate space (canvas's origin
    // sits at document-Y = bandDocYRef.current, so subtract that back out).
    const cellEl = hitRef.current?.children[i] as HTMLElement | undefined;
    const cellRect = cellEl?.getBoundingClientRect();
    if (cellRect) {
      fromRectRef.current = {
        x: cellRect.left,
        // The canvas origin IS the viewport origin, so the cell's on-screen
        // top is already the local y. (The old document round-trip,
        // cellRect.top + scrollY - bandDocY, reduced to this whenever bandDocY
        // equalled scrollY — which is exactly when it was correct.)
        y: cellRect.top,
        w: cellRect.width,
        h: cellRect.height,
      };
    }

document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    setBandMounted(true);

    mode.current = 'opening';
    openIdx.current = i;
    openProg.current = 0;
    bandYReadyRef.current = true;
    landedFiredRef.current = false;
    traceRef.current = [];
    {
      // Scroll to the content NOW, not at the landing.
      //
      // It used to happen at the landing, which forced the copy's fade to wait
      // for the landing too — fire the fade any earlier and the content
      // appeared at the old scroll position and was then yanked to the top.
      // That coupling is why the open could not overlap.
      //
      // Doing it here is safe only because of the fixed band: the band is a
      // viewport object so it does not move, and fromRect above was measured
      // from the cell's on-screen position BEFORE this call, so the card still
      // starts exactly where it was clicked. bandDocYRef keeps the pre-scroll
      // position as the close bookmark.
      window.scrollTo(0, 0);
    }
    bandTitleProg.current = 0;
    bandTitleStart.current = 0;
    hovIdx.current = -1;
    for (let j = 0; j < N; j++) {
      targetZoom.current[j] = 1; targetDarken.current[j] = 0; targetTitleA.current[j] = 0;
      cellColors.current[j] = pickColor(CFG.COL_RANGE);
    }
        lockScroll();
        updateHitLayer();
    onOpenRef.current(i);
  }

function closeCard(e?: React.MouseEvent<HTMLCanvasElement>) {
    if (mode.current !== 'fullview' && mode.current !== 'nav') return;
    // Only close if click is within the band's visible area — the canvas
    // is viewport-height for animation room, but the band itself is much shorter.
    if (e && bandCanvasRef.current) {
      const bandH = window.innerWidth * (_bandH / NATIVE_W);
      if (e.nativeEvent.offsetY > bandH) return;
    }
    // Snap back to exactly where the page was when this card was
    // opened — instant, not animated — then re-lock scroll for the
    // shrink animation. The user may have scrolled anywhere while
    // reading; the shrink assumes the cell is back at its real
    lockScroll();
    // ORDER: restore the grid's height BEFORE scrolling to the bookmark.
    //
    // These two used to be the other way round, so the scroll was issued while
    // the grid was still collapsed — a document short enough that the bookmark
    // was past its maxScroll, so the browser clamped it. The page then grew
    // back underneath a scroll position that had already been truncated,
    // leaving the reader ~16px from where they clicked. fromRect was measured
    // in that original viewport, so the card animated home to a spot that far
    // off and popped when the grid redrew.
    //
    // Same class as the open-side bug: an operation performed while the
    // document is a different height than the coordinate assumes.
    if (wrapRef.current) wrapRef.current.style.height = `${TOTAL_H * scaleRef.current}px`;
    if (spacerRef.current) spacerRef.current.style.height = '0px';
    // Band stays fixed through the close too. This restores the reader to the
    // bookmark so the cell is back at the on-screen position fromRect was
    // measured at, and the card travels home in the viewport space it left.
    window.scrollTo(0, bandDocYRef.current);
    mode.current = 'closing';
    updateHitLayer();
    // Fire immediately so detail text starts fading out NOW, not after
    // the card finishes traveling back to its cell.
    onCloseRef.current();
  }
  function stepCard(dir: number) {
    if (mode.current !== 'fullview') return;
    navFromIdx.current = openIdx.current;
    navToIdx.current = (openIdx.current + dir + N) % N;
    navDir.current = dir;
    navProg.current = 0;
    navSwapped.current = false;
    // Reset title for the incoming card
    bandTitleProg.current = 0;
    bandTitleStart.current = 0;
    mode.current = 'nav';
  }

  const tick = useCallback((now: number) => {
    if (!prevTime.current) prevTime.current = now;
    const dt = Math.min(now - prevTime.current, 50);
    prevTime.current = now;
    const m = mode.current;

// Keep the canvas's actual clickable/hoverable region matched to
    // what's visibly drawn. In fullview it's locked to just the band
    // height — otherwise the canvas's full window.innerHeight hit-box
    // silently swallows scroll/click input meant for the detail-text
    // column underneath. During opening/closing the card can be
    // anywhere along its travel path, so keep the looser grid-bound clip.
    const bandCanvas = bandCanvasRef.current;
    if (bandCanvas) {
      const logW = window.innerWidth;
      const logH = window.innerHeight;
      const bandHpx = logW * (_bandH / NATIVE_W);
      if (m === 'fullview' || m === 'nav') {
        bandCanvas.style.clipPath = `inset(0px 0px ${Math.max(0, logH - bandHpx)}px 0px)`;
      } else {
        // No clip while the card is travelling. The old grid-bound inset was
        // built from bandDocY and gridDocBottom, both document coordinates,
        // and is meaningless for a viewport-fixed canvas — the card travels
        // entirely inside the viewport. The hit-box concern it also served
        // cannot bite here because scroll is locked during opening and closing.
        bandCanvas.style.clipPath = 'none';
      }
    }

    const sp = clamp(dt / (CFG.HOVER_SPEED * 0.45), 0, 1);
    let dirty = false;
    for (let i = 0; i < N; i++) {
      const nz = lerp(zoom.current[i], targetZoom.current[i], sp);
      const nd = lerp(darken.current[i], targetDarken.current[i], sp);
      const nt = lerp(titleA.current[i], targetTitleA.current[i], sp);
      if (Math.abs(nz - zoom.current[i]) > 0.0001 || Math.abs(nd - darken.current[i]) > 0.001 || Math.abs(nt - titleA.current[i]) > 0.001) dirty = true;
      zoom.current[i] = nz; darken.current[i] = nd; titleA.current[i] = nt;
    }
    if (dirty) render();

    if (m === 'opening' || m === 'closing') {
      // Frozen at progress 0 until bandY has actually been measured
      // (see openCard()) — nothing incorrect gets drawn in the meantime,
      // since ep=0 just renders the card at its own resting position.
      const canProgress = !(m === 'opening' && !bandYReadyRef.current);
      if (canProgress) {
        const sp2 = clamp(dt / CFG.TRANSITION_DURATION * 2.2, 0, 1);
        const target = m === 'opening' ? 1 : 0;
        openProg.current = lerp(openProg.current, target, sp2);
        // The landing signal fires HERE, at a fraction of the travel, not at
        // the asymptote below. See BAND_OPEN_LANDED_AT for why the end of the
        // exponential is the wrong moment to hand to the reader.
        if (m === 'opening' && !landedFiredRef.current
            && openProg.current >= BAND_OPEN_LANDED_AT) {
          landedFiredRef.current = true;
          onOpenLandedRef.current?.();
        }
if (Math.abs(openProg.current - target) < 0.006) {
          openProg.current = target;
          if (m === 'opening') {
            mode.current = 'fullview';
            const delta = (TOTAL_H - _bandH) * scaleRef.current;
            if (wrapRef.current) wrapRef.current.style.height = `${_bandH * scaleRef.current}px`;
            if (spacerRef.current) spacerRef.current.style.height = `${delta}px`;
            // Shift the whole canvas up so the band's ACTUAL drawn
            // location (previously at a value that could be anywhere down the
            // tall canvas, not just row 1) lines up with wrap's
            // now-cropped [0, BAND_HEIGHT] viewing window. Without this,
            // the band was only visible by coincidence when bandY
            // happened to be ~0 — otherwise it landed exactly at the
            // clip boundary and got cut away the instant the grid
            // collapsed, which is the "disappears when it lands" bug.
            // stage.top shift removed — the band no longer lives inside
            // stage's clipped/scaled coordinate system at all, so there's
            // nothing here that needs realigning with it anymore.
            // Header stays at its natural height, just transformed
            // offscreen — don't actually remove its layout space, because
            // doing so shortens the page and invalidates the band's
            // document-coordinate position (which was computed from
            // scrollY before the page got shorter).
            updateHitLayer();
            // Growth animation is done — release the scroll lock so the
            // page (and the band riding along in it) scrolls normally.
            // Only vertical overflow is released; overflowX stays locked
            // until full close, same as before.
            unlockScroll();
            // Nothing to scroll and no floor to arm. The scroll happened at the
            // click and the landing signal fired at BAND_OPEN_LANDED_AT,
            // part-way through the travel.
            //
            // Safety net only — if the threshold were ever set to a value the
            // lerp cannot reach, the copy would never appear at all.
            if (!landedFiredRef.current) {
              landedFiredRef.current = true;
              onOpenLandedRef.current?.();
            }
            } else {
                        mode.current = 'grid';
            openIdx.current = -1;
            // Redraw the grid FIRST (with the card back in its cell)
            // BEFORE unmounting the band — otherwise there's a frame gap
            // where neither canvas shows the card, which reads as a pop.
            render();
            setBandMounted(false);

            // Clear the transforms now that closing is complete — header
            // and outer are back at their natural layout positions.

            if (headerRef?.current) headerRef.current.style.transform = 'none';
            if (outerRef.current) outerRef.current.style.transform = 'none';
            // Delay overflowX restore by one frame — setBandMounted(false)
            // is async (React), so the full-width canvas is still in the
            // DOM for one more frame after this runs. Restoring overflow
            // while it's still mounted causes a scrollbar flash.
            requestAnimationFrame(() => {
              document.documentElement.style.overflowX = '';
              document.body.style.overflowX = '';
            });
            unlockScroll();
            bandTitleProg.current = 0;
            bandTitleStart.current = 0;
            for (let j = 0; j < N; j++) {
              zoom.current[j] = 1; darken.current[j] = 0; titleA.current[j] = 0;
              targetZoom.current[j] = 1; targetDarken.current[j] = 0; targetTitleA.current[j] = 0;
            }
            updateHitLayer();
          }
        }
      }
      render();
      renderBand();
    }

    // ── Band title — independent timeline (runs in opening/fullview/closing) ──
    if (m === 'opening' || m === 'fullview') {
      if (bandTitleStart.current === 0) {
        if (bandCanvasRef.current) {
          const logW = window.innerWidth;
          const ep = easeIO(openProg.current);
          const from = fromRectRef.current;
          const bandH = logW * (_bandH / NATIVE_W);
          const curX = lerp(from.x, 0, ep);
          const curY = lerp(from.y, 0, ep);
          const curW = lerp(from.w, logW, ep);
          const curH = lerp(from.h, bandH, ep);
          const titleLeftX = 0.072222 * logW;
          const titleRevealY = bandH * 0.9;
          if (curX <= titleLeftX && (curX + curW) >= logW * 0.95 && (curY + curH) >= titleRevealY) {
            bandTitleStart.current = now + 100;
          }
        }
        if (m === 'fullview' && bandTitleStart.current === 0) bandTitleStart.current = now;
      }
      if (bandTitleStart.current > 0) {
        const elapsed = now - bandTitleStart.current;
        if (elapsed > 0) bandTitleProg.current = clamp(elapsed / 1000, 0, 1);
      }
      renderBand();
    } else if (m === 'closing') {
      bandTitleProg.current = clamp(bandTitleProg.current - dt / 300, 0, 1);
    }

    // ── Nav — horizontal push between cards ──────────────────────────────
    if (m === 'nav') {
      const sp = clamp(dt / NAV_DUR * 2.2, 0, 1);
      navProg.current = lerp(navProg.current, 1, sp);

      // Swap content at ~50% — update openIdx, trigger incoming title
if (navProg.current >= 0.5 && !navSwapped.current) {
        navSwapped.current = true;
        openIdx.current = navToIdx.current;
        // Keep fromRectRef in sync with whichever card is actually
        // open — without this, closing after a nav step shrinks back
        // into the ORIGINALLY opened card's cell, not the current
        // one (the intermittent wrong-slot-then-pop bug).
        fromRectRef.current = computeCellRect(navToIdx.current);
        // Incoming title: delay matches WorkCarousel's HL_RIGHT_DELAY for right-nav; none for left
        bandTitleStart.current = now + (navDir.current > 0 ? 175 : 0);
        onOpenRef.current(navToIdx.current);
      }
      
      // Drive incoming title during nav (same mechanism as open, but faster)
      if (navSwapped.current && bandTitleStart.current > 0) {
        const elapsed = now - bandTitleStart.current;
        if (elapsed > 0) bandTitleProg.current = clamp(elapsed / 350, 0, 1);
      }

      // Settle
      if (navProg.current > 0.994) {
        navProg.current = 1;
        openIdx.current = navToIdx.current;
        bandTitleProg.current = 1;
        mode.current = 'fullview';
      }
      renderBand();
    }

    rafRef.current = requestAnimationFrame(tick);

    const hud = document.getElementById('think-debug-hud');
    if (hud) {
      // The four lines that actually discriminate between hypotheses for
      // "the card opens in the wrong place":
      //   bandTop  — where the band canvas ACTUALLY is on screen. 0 = correct.
      //   floorGap — scrollY minus the anchor. The floor listener should hold
      //              this at 0; a positive value means the reader scrolled
      //              down, a negative one means the floor could not reach.
      //   maxScroll vs bandDocY — if maxScroll is the smaller number the page
      //              cannot scroll far enough for the anchor to reach the top
      //              of the viewport, and no listener can fix that.
      const bandEl = bandCanvasRef.current;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      hud.textContent =
        `mode: ${mode.current}\n` +
        `openIdx: ${openIdx.current}\n` +
        `openProg: ${openProg.current.toFixed(3)}\n` +
        `bandYReady: ${bandYReadyRef.current}\n` +
        `bandDocY (close bookmark): ${bandDocYRef.current.toFixed(1)}\n` +
        `band style.top: ${bandEl?.style.top || '(unmounted)'}\n` +
        `band position: ${bandEl ? getComputedStyle(bandEl).position : '-'}\n` +
        `BAND TOP ON SCREEN: ${bandEl ? bandEl.getBoundingClientRect().top.toFixed(1) : '-'}\n` +
        // §4 measuring line. NOT scrollY: the first bandDocY pixels of scroll
        // only eat the nav clearance above the band, so scrollY overstates the
        // crop by a tiered amount (thinkNavClearance is 177/136/104). This is
        // the band's on-screen height with the off-viewport parts subtracted —
        // scroll until the crop reads right, read this number, and it IS the
        // tuned BAND_HEIGHT_TIERS value at this width, in screen pixels.
        `VISIBLE BAND H: ${(() => {
          if (!bandEl) return '-';
          // NOT getBoundingClientRect().height — the canvas is a full
          // window.innerHeight box (line ~379) clipped down to the band strip
          // by clipPath, and clipPath does not change the layout box. The rect
          // reports the viewport height and looks entirely plausible.
          const top = bandEl.getBoundingClientRect().top;
          const bandHpx = window.innerWidth * (_bandH / NATIVE_W);
          const vis = Math.min(top + bandHpx, window.innerHeight) - Math.max(top, 0);
          return `${Math.max(0, vis).toFixed(1)}  (full strip: ${bandHpx.toFixed(1)})`;
        })()}\n` +
        `scrollY: ${window.scrollY.toFixed(0)}\n` +
        // The content half of the layout. Band top, detail top and scrollY
        // together fully determine what is on screen; the HUD reported only the
        // band, which is why "the card is low" could not be pinned to either
        // the band being wrong or the content being wrong.
        `DETAIL TOP ON SCREEN: ${(() => {
          const d = document.getElementById('think-detail');
          return d ? d.getBoundingClientRect().top.toFixed(1) : '-';
        })()}\n` +
        `detail style.top: ${document.getElementById('think-detail')?.style.top || '(none)'}\n` +

        `maxScroll: ${maxScroll.toFixed(0)}\n` +
        `docHeight: ${document.documentElement.scrollHeight}\n` +
        `bandTitleProg: ${bandTitleProg.current.toFixed(3)}\n` +
        `bandMounted: ${bandMounted}\n` +
        `wrap.height: ${wrapRef.current?.style.height || '(unset)'}\n` +
        `stage.top: ${stageRef.current?.style.top || '(unset)'}\n` +
        `innerH: ${window.innerHeight}\n` +
        (DEBUG.thinkBandTrace
          ? `--- opening trace ---\n` + (traceRef.current.length ? traceRef.current.join('\n') : '(none)')
          : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [render, renderBand, updateHitLayer]);

  useEffect(() => {
imgsRef.current = Array.from({ length: N }, (_, i) => {
      const img = new Image();
      img.src = coverImageFor(THINK_GRID[i]);
      img.onload = () => render();
      return img;
    });

    // Titles fetched once in bulk (all 13 cards' frontmatter) rather than
    // per-card, then looked up via titleForSlot() at draw time. Same
    // fire-and-render-on-arrival pattern as the cover images above.
    fetch('/api/think/manifest')
      .then(r => r.json())
      .then((data: Record<string, { title: string; narrowtitle: string }>) => {
        const titles: Record<number, { title: string; narrowtitle: string }> = {};
        for (const [cardNum, fields] of Object.entries(data)) {
          titles[Number(cardNum)] = {
            title: fields.title.split('[br]').join('\n'),
            narrowtitle: fields.narrowtitle.split('[br]').join('\n'),
          };
        }
        titlesRef.current = titles;
        render();
      })
      .catch(() => {
        // Manifest fetch failed — grid still renders, just with blank titles.
      });

    const scaleStage = () => {
      const wrap = wrapRef.current;
      const stage = stageRef.current;
      if (!wrap || !stage) return;
      const isMobile = window.innerWidth < BREAKPOINTS.tablet;
      // Screen pixels in, native units out — the one conversion site.
      _bandH = (bandHeightPx(window.innerWidth) * NATIVE_W) / window.innerWidth;
      const titleScale = window.innerWidth / BAND_HEADLINE.refW;
      const isTablet = !isMobile && window.innerWidth < BREAKPOINTS.laptop;
      // Already screen pixels here, so the DESKTOP reference size is scaled up
      // front — the mirror of WorkCarousel dividing by its stage scale. The two
      // flat tiers are already rendered sizes and need no conversion.
      _bandTitlePx = isMobile
        ? BAND_HEADLINE.mobileSizePx
        : isTablet
          ? BAND_HEADLINE.tabletSizePx
          : Math.round(BAND_HEADLINE.sizePx * titleScale);
      const s = wrap.clientWidth / NATIVE_W;
      scaleRef.current = s;
      gridInsetRef.current = { offset: NATIVE_W * col.marginVw / 100, scale: col.vw / 100 };
      stage.style.transform = `scale(${s})`;
      if (mode.current === 'grid') wrap.style.height = `${TOTAL_H * s}px`;
      // Band canvas also needs to track viewport width on resize, same
      // reasoning as the grid's own scale — otherwise a resize mid-open
      // would leave it drawing at a stale width.
if (bandCanvasRef.current && mode.current !== 'grid') {
        const dpr = window.devicePixelRatio || 1;
        bandCanvasRef.current.style.width  = `${window.innerWidth}px`;
        bandCanvasRef.current.style.height = `${window.innerHeight}px`;
        bandCanvasRef.current.width  = window.innerWidth  * dpr;
        bandCanvasRef.current.height = window.innerHeight * dpr;
      }      updateHitLayer();
    };
    window.addEventListener('resize', scaleStage);
    scaleStage();

    onRegisterControls(stepCard, closeCard);
    updateHitLayer();
    rafRef.current = requestAnimationFrame(tick);

return () => {
      window.removeEventListener('resize', scaleStage);
      cancelAnimationFrame(rafRef.current);
      document.documentElement.style.overflowX = '';
      document.body.style.overflowX = '';
      unlockScroll();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, render, updateHitLayer, col.vw, col.marginVw]);

  // Grid fade-in on page load — uses CFG timing (4.5s delay, 1s fade)
  useEffect(() => {
    const t = setTimeout(() => setGridVisible(true), CFG.FADE_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={outerRef} style={{
      width: '100%', marginTop: '40px',
      opacity: gridVisible ? 1 : 0,
      transition: `opacity ${CFG.FADE_DURATION_MS}ms ease`,
    }}>
      {/* Debug HUD — shows live state so bugs can be reported as exact numbers
          instead of visual impressions. Gated on DEBUG.thinkBand in SiteTokens,
          which is the one word to flip. Moved off centre-screen so it does not
          sit on top of the thing being judged. */}
      {DEBUG.thinkBand && hudMounted && createPortal(
        <div
          id="think-debug-hud"
          style={{
            position: 'fixed', top: 12, right: 12, zIndex: 2147483647,
            background: 'rgba(0,0,0,0.85)', color: '#0f0', fontFamily: 'monospace',
            fontSize: 11, padding: '8px 10px', lineHeight: 1.5, pointerEvents: 'none',
            whiteSpace: 'pre',
          }}
        />,
        document.body
      )}
      <div ref={wrapRef} id="think-wrap" style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
        <div ref={stageRef} id="think-stage" style={{ width: NATIVE_W, height: TOTAL_H, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0 }}>
          <canvas
            ref={canvasRef}
            width={NATIVE_W}
            height={TOTAL_H}
            style={{ position: 'absolute', top: 0, left: 0, width: NATIVE_W, height: TOTAL_H, pointerEvents: 'none' }}
          />
          <div ref={hitRef} style={{ position: 'absolute', top: 0, left: 0, width: NATIVE_W, height: TOTAL_H }} />
        </div>
      </div>
      <div ref={spacerRef} style={{ height: 0 }} />
{bandMounted && createPortal(
<canvas
          ref={bandCanvasRef}
          onClick={closeCard}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 10,
            cursor: 'pointer',
          }}
        />,
        document.body
      )}
          </div>
  );
}