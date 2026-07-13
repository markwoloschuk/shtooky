'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useColumn, NAV } from './Tokens';

// ── Layout — 13 cells, native units on a 1440-wide reference canvas ────────
const NATIVE_W = 1440;
const GAP = 6;

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
export const BAND_HEIGHT = 480;
export { NATIVE_W };

const CFG = {
  HOVER_SPEED: 500,
  HOVER_ZOOM: 1.10,
  OVERLAY_DARKEN: 0.60,
  TITLE_SIZE: 25,
  FADE_DELAY_MS: 4500,
  FADE_DURATION_MS: 1000,
  TRANSITION_DURATION: 750,
};

const IMAGE_PATH = '/images/how-i-think';
const IMAGE_COUNT = 10;
function imageSrc(i: number): string {
  const n = String((i % IMAGE_COUNT) + 1).padStart(2, '0');
  return `${IMAGE_PATH}/ThinkGrid_${n}.jpg`;
}

export const CARD_DATA = [
  { title: 'Sincerity as the\nsoul of design', tag: 'On intention', subtitle: 'Make every decision mean something', excerpt: 'Every choice — every color, font, line, edge — should carry intent.' },
  { title: 'Seeing with\nyour heart', tag: 'On empathy', subtitle: 'Empathy is the lens that focuses design', excerpt: 'The empathy lens is what helps you see the emotional hooks and where they can be placed.' },
  { title: 'Be a zoom lens', tag: 'On scale', subtitle: 'Relish the details but paint a bigger picture', excerpt: 'A designer who only sees pixels misses the point. A designer who only sees the picture misses the craft.' },
  { title: 'WYSIWYG?', tag: 'On perspective', subtitle: 'What you see depends on where you stand', excerpt: 'Two people looking at the same design see different things — informed by their experience, expertise, agenda.' },
  { title: 'Design is a\nconversation', tag: 'On dialogue', subtitle: "The brief starts the conversation, it doesn't end it", excerpt: 'Good design is never a monologue.' },
  { title: 'Paper is cheap', tag: 'On iteration', subtitle: 'Lo-fi exploration leads to hi-fi results', excerpt: 'The faster you can be wrong, the sooner you can be right.' },
  { title: "Iterate but\ndon't thrash", tag: 'On rhythm', subtitle: 'Patience is a creative skill, so is knowing when to move on', excerpt: 'Iteration without convergence is thrashing. The skill is recognizing the difference.' },
  { title: 'Done is better\nthan perfect', tag: 'On shipping', subtitle: 'Creative work is never finished, only abandoned', excerpt: 'Perfectionism is often fear with a thesaurus. Done is the only thing the world ever sees.' },
  { title: 'Consistency\ncreates connection', tag: 'On systems', subtitle: 'A shared language makes design speak more clearly', excerpt: "A system isn't a cage — it's a vocabulary." },
  { title: 'An uncomfortable hug?', tag: 'On change', subtitle: 'Embracing AI requires faith in change', excerpt: "The hug is uncomfortable. It's still a hug." },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function easeIO(t: number) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
// Title ease — matches mockup's strength-parameterized curves (AE keyframe
// influence idea: higher strength = more pronounced deceleration/acceleration)
function titleEaseOut(t: number, strength = 6) { return 1 - Math.pow(1 - clamp(t, 0, 1), strength); }
function titleEaseIn(t: number, strength = 6) { return Math.pow(clamp(t, 0, 1), strength); }

interface Rect { x: number; y: number; w: number; h: number; }

interface Props {
  onOpen: (idx: number) => void;
  onClose: () => void;
  onRegisterControls: (step: (dir: number) => void, close: () => void) => void;
  headerRef?: React.RefObject<HTMLDivElement>;
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, rect: Rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img && img.complete && img.naturalWidth > 0) {
    const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
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
  ctx.font = `700 ${size}px Archivo`;
  ctx.fillStyle = '#fff';
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
  alpha: number, scale: number, riseOffset: number,
) {
  if (alpha <= 0) return;
  ctx.save();
  // Clip to the card's CURRENT animated shape — not the final band
  ctx.beginPath();
  ctx.rect(clipRect.x, clipRect.y, clipRect.w, clipRect.h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  // All values match WorkCarousel.drawHeadline, scaled to screen pixels
  const fontSize = 52 * scale;
  const padL = 104 * scale;
  const lineH = 55 * scale;
  const padB = 28 * scale; // Work carousel: CH(480) - 48 + HL_Y(20) = 452 → 28 from bottom
  ctx.font = `700 ${fontSize}px Archivo`;
  ctx.fillStyle = '#fff';
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

export default function ThinkGridCanvas({ onOpen, onClose, onRegisterControls, headerRef }: Props) {
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
  const gridDocBottomRef = useRef(99999);

  const fromRectRef = useRef<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [bandMounted, setBandMounted] = useState(false);

  const gridInsetRef = useRef({ offset: 0, scale: 1 });
  function cellToScreen(rect: Rect): Rect {
    const { offset, scale } = gridInsetRef.current;
    return { x: offset + rect.x * scale, y: rect.y, w: rect.w * scale, h: rect.h };
  }

  // Sizing the band canvas in openCard() itself isn't reliable — after a
  // full close, the portal unmounts it, so on the NEXT open,
  // bandCanvasRef.current is still null at the moment openCard() runs
  // (React hasn't re-mounted it yet). This effect re-fires every time
  // bandMounted flips true, guaranteeing correct sizing regardless of
  // whether it's the first open or the fifth.
useEffect(() => {
    if (bandMounted && bandCanvasRef.current) {
      bandCanvasRef.current.width = window.innerWidth;
      // Tall enough to encompass both the card's starting position
      // (which can be anywhere in the viewport) AND the band's final
      // position (at the top). Was bandHeight before, which clipped
      // the card at its starting position — causing the "unmask" look.
      bandCanvasRef.current.height = window.innerHeight;
    }    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandMounted]);

  const imgsRef = useRef<HTMLImageElement[]>([]);
  const hovIdx = useRef(-1);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
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
  const mode = useRef<'grid' | 'opening' | 'closing' | 'fullview'>('grid');
  const openIdx = useRef(-1);
  const openProg = useRef(0);
  // Gates progress advancement until bandY has actually been measured
  // AFTER the header's collapse has painted — see openCard() below.
  const bandYReadyRef = useRef(false);

  // Band title — independent animation timeline (spec: 100ms delay →
  // 1000ms rise on open; 300ms drop on close, doesn't follow card motion)
  const bandTitleProg = useRef(0);
  const bandTitleStart = useRef(0); // timestamp when title anim begins (after delay)

  const drawCardAt = useCallback((ctx: CanvasRenderingContext2D, i: number, rect: Rect, zm: number, dk: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(zm, zm);
    ctx.translate(-cx, -cy);
    drawImageCover(ctx, imgsRef.current[i], rect);
    if (dk > 0) {
      ctx.fillStyle = `rgba(13,13,13,${dk})`;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }, []);

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
        drawTitleBlock(ctx, screenRect, CARD_DATA[i % CARD_DATA.length].title, titleA.current[i], CFG.TITLE_SIZE);
      }
      return;
    }

    const oi = openIdx.current;
    const ep = easeIO(m === 'fullview' ? 1 : openProg.current);
    // Smooth, continuous recede — the header slides fully out of view by
    // its own height, the grid slides up to close the gap behind it (its
    // own height PLUS the 40px margin that used to sit below the
    // header). Pure transform, no layout/reflow, same ep driving the
    // card's own growth — this is what eliminates the jump, in either
    // direction, since nothing here is an instant snap anymore.
    if (m !== 'fullview') {
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
        ctx.save();
        ctx.globalAlpha = 1 - ep;
        drawCardAt(ctx, i, cellToScreen(LAYOUT[i]), 1, 0);
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const oi = openIdx.current;
    if (oi < 0) return;
    const m = mode.current;
    const ep = easeIO(m === 'fullview' ? 1 : openProg.current);
    const from = fromRectRef.current;
// Band fills just the top portion of the (now taller) canvas — not
    // the whole thing. Canvas is viewport-height so the starting card
    // position is never clipped; the band itself is still band-height.
    const bandH = canvas.width * (BAND_HEIGHT / NATIVE_W);
    const to: Rect = { x: 0, y: 0, w: canvas.width, h: bandH };    const cur: Rect = {
      x: lerp(from.x, to.x, ep), y: lerp(from.y, to.y, ep),
      w: lerp(from.w, to.w, ep), h: lerp(from.h, to.h, ep),
    };
    drawCardAt(ctx, oi, cur, 1, 0);
    // Title — fixed at final position, clipped to current card shape.
    // Matches mockup's architecture: title never moves with the card,
    // it just becomes visible through the growing image.
    const isClosing = mode.current === 'closing';
    const rawTP = bandTitleProg.current;
    const tp = isClosing ? titleEaseIn(rawTP) : titleEaseOut(rawTP);
    const s = canvas.width / NATIVE_W;
    const riseNative = isClosing ? 20 : 30; // spec: 30px rise open, 20px close
    const riseOffset = (1 - tp) * riseNative * s;
    drawBandTitle(ctx, cur, to, CARD_DATA[oi % CARD_DATA.length].title, tp, s, riseOffset);
  }, [drawCardAt]);

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
bandDocYRef.current = window.scrollY;
    const wrapRect = wrapRef.current?.getBoundingClientRect();
    if (wrapRect) {
      gridDocTopRef.current = wrapRect.top + window.scrollY;
      gridDocBottomRef.current = gridDocTopRef.current + wrapRect.height;
    }
    // Starting rect: the clicked cell's REAL on-screen position, converted
    // to the band canvas's own local coordinate space (canvas's origin
    // sits at document-Y = bandDocYRef.current, so subtract that back out).
    const cellEl = hitRef.current?.children[i] as HTMLElement | undefined;
    const cellRect = cellEl?.getBoundingClientRect();
    if (cellRect) {
      fromRectRef.current = {
        x: cellRect.left,
        y: cellRect.top + window.scrollY - bandDocYRef.current,
        w: cellRect.width,
        h: cellRect.height,
      };
    }

document.documentElement.style.overflowX = 'hidden';
    setBandMounted(true);

    mode.current = 'opening';
    openIdx.current = i;
    openProg.current = 0;
    bandYReadyRef.current = true;
    bandTitleProg.current = 0;
    bandTitleStart.current = 0;
    hovIdx.current = -1;
    for (let j = 0; j < N; j++) { targetZoom.current[j] = 1; targetDarken.current[j] = 0; targetTitleA.current[j] = 0; }
    updateHitLayer();
    onOpenRef.current(i);
  }

function closeCard(e?: React.MouseEvent<HTMLCanvasElement>) {
    if (mode.current !== 'fullview') return;
    // Only close if click is within the band's visible area — the canvas
    // is viewport-height for animation room, but the band itself is much shorter.
    if (e && bandCanvasRef.current) {
      const bandH = bandCanvasRef.current.width * (BAND_HEIGHT / NATIVE_W);
      if (e.nativeEvent.offsetY > bandH) return;
    }
    // Restore full grid height + collapse the spacer BEFORE the card
    // starts traveling back — same pairing logic as the height-snap.
    if (wrapRef.current) wrapRef.current.style.height = `${TOTAL_H * scaleRef.current}px`;
    if (spacerRef.current) spacerRef.current.style.height = '0px';
    // Header never had its height/margin removed (see above), so there's
    // nothing to restore here — it's already at its natural layout size,
    // just still transformed offscreen from the open. The closing
    // animation in render() will smoothly bring the transform back to 0.
    mode.current = 'closing';
    updateHitLayer();
  }

  const tick = useCallback((now: number) => {
    if (!prevTime.current) prevTime.current = now;
    const dt = Math.min(now - prevTime.current, 50);
    prevTime.current = now;
    const m = mode.current;

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
        if (Math.abs(openProg.current - target) < 0.006) {
          openProg.current = target;
          if (m === 'opening') {
            mode.current = 'fullview';
            const delta = (TOTAL_H - BAND_HEIGHT) * scaleRef.current;
            if (wrapRef.current) wrapRef.current.style.height = `${BAND_HEIGHT * scaleRef.current}px`;
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
            // scrollY before the page got shorter).            updateHitLayer();
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
            });

            bandTitleProg.current = 0;
            bandTitleStart.current = 0;
            for (let j = 0; j < N; j++) {
              zoom.current[j] = 1; darken.current[j] = 0; titleA.current[j] = 0;
              targetZoom.current[j] = 1; targetDarken.current[j] = 0; targetTitleA.current[j] = 0;
            }
            updateHitLayer();
            onCloseRef.current();
          }
        }
      }
      render();
      renderBand();
    }

    // ── Band title — independent timeline (runs in opening/fullview/closing) ──
    // Triggered geometrically: starts when the card's animated shape
    // reaches the title's final position (matching mockup's
    // triggerTitle logic), plus the tunable delay. This prevents the
    // title from fading in before it would be visible through the mask.
    if (m === 'opening' || m === 'fullview') {
      if (bandTitleStart.current === 0) {
        const canvas = bandCanvasRef.current;
        if (canvas) {
          const ep = easeIO(openProg.current);
          const from = fromRectRef.current;
          const bandH = canvas.width * (BAND_HEIGHT / NATIVE_W);
          const curX = lerp(from.x, 0, ep);
          const curY = lerp(from.y, 0, ep);
          const curW = lerp(from.w, canvas.width, ep);
          const curH = lerp(from.h, bandH, ep);
          const titleLeftX = 0.072222 * canvas.width;
          const titleRevealY = bandH * 0.9;
          if (curX <= titleLeftX && (curX + curW) >= canvas.width * 0.95 && (curY + curH) >= titleRevealY) {
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

    rafRef.current = requestAnimationFrame(tick);

    const hud = document.getElementById('think-debug-hud');
    if (hud) {
      hud.textContent =
        `mode: ${mode.current}\n` +
        `openIdx: ${openIdx.current}\n` +
        `openProg: ${openProg.current.toFixed(3)}\n` +
        `bandYReady: ${bandYReadyRef.current}\n` +
        `bandDocY: ${bandDocYRef.current.toFixed(1)}\n` +
        `bandTitleProg: ${bandTitleProg.current.toFixed(3)}\n` +
        `bandMounted: ${bandMounted}\n` +
        `wrap.height: ${wrapRef.current?.style.height || '(unset)'}\n` +
        `stage.top: ${stageRef.current?.style.top || '(unset)'}\n` +
        `scrollY: ${window.scrollY.toFixed(0)}`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [render, renderBand, updateHitLayer]);

  useEffect(() => {
    imgsRef.current = Array.from({ length: N }, (_, i) => {
      const img = new Image();
      img.src = imageSrc(i);
      img.onload = () => render();
      return img;
    });

    const scaleStage = () => {
      const wrap = wrapRef.current;
      const stage = stageRef.current;
      if (!wrap || !stage) return;
      const s = wrap.clientWidth / NATIVE_W;
      scaleRef.current = s;
      gridInsetRef.current = { offset: NATIVE_W * col.marginVw / 100, scale: col.vw / 100 };
      stage.style.transform = `scale(${s})`;
      if (mode.current === 'grid') wrap.style.height = `${TOTAL_H * s}px`;
      // Band canvas also needs to track viewport width on resize, same
      // reasoning as the grid's own scale — otherwise a resize mid-open
      // would leave it drawing at a stale width.
if (bandCanvasRef.current && mode.current !== 'grid') {
        bandCanvasRef.current.width = window.innerWidth;
        bandCanvasRef.current.height = window.innerHeight;
      }      updateHitLayer();
    };
    window.addEventListener('resize', scaleStage);
    scaleStage();

    onRegisterControls(() => {}, closeCard);
    updateHitLayer();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', scaleStage);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, render, updateHitLayer, col.vw, col.marginVw]);

  return (
    <div ref={outerRef} style={{ width: '100%', marginTop: '40px' }}>
      {/* TEMPORARY debug HUD — remove once the open/close mechanic is
          confirmed solid. Shows live state so bugs can be reported as
          exact numbers instead of visual impressions. */}
      <div
        id="think-debug-hud"
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 999,
          background: 'rgba(0,0,0,0.85)', color: '#0f0', fontFamily: 'monospace',
          fontSize: 11, padding: '8px 10px', lineHeight: 1.5, pointerEvents: 'none',
          whiteSpace: 'pre',
        }}
      />
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
            position: 'absolute',
            top: `${bandDocYRef.current}px`,
            left: 0,
            zIndex: 150,
            cursor: 'pointer',
            // Clip so the closing card sinks back into the grid rather
            // than flying over the footer. Top clip is relative to the
            // canvas's own top edge; bottom clip limits how far below
            // the band the card can be seen — the grid's bottom edge.
            clipPath: `inset(0px 0px ${Math.max(0, bandDocYRef.current + window.innerHeight - gridDocBottomRef.current)}px 0px)`,
          }}
        />,
        document.body
      )}
          </div>
  );
}