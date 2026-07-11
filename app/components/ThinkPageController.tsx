'use client';

import { useEffect, useRef, useState } from 'react';
import { getColumn } from './Tokens';
import ThinkOpenAnimation from './ThinkOpenAnimation';
import ThinkBlurb from './ThinkBlurb';
import ThinkGrid, { CARD_DATA, CONFIG as GRID_CONFIG } from './ThinkGrid';
import ThinkBelowPlaceholder from './ThinkBelowPlaceholder';

// ── Tunable constants — locked v28 default values, ported 1:1 from
// grid-mockup.html's slider defaults. In the mockup these were live
// sliders for tuning; here they're fixed, since SCALE/tuning is done. ──
const CONFIG = {
  TRANSITION_DURATION: 750,    // ms — master open/close FLIP duration
  RECEDE_MULTIPLIER: 0.70,     // fraction of the grid's current on-screen
                                 // distance-from-viewport-top that it recedes by
  RECEDE_MIN: 80,              // px — floor on the recede distance
  FADE_GRID: true,             // whether recede also fades opacity 1→0
  FULL_ZOOM: 1.30,             // image zoom once fully open
  TITLE_RISE_OPEN: 30,         // px — title's rise-in distance, open
  TITLE_DURATION_OPEN: 1000,   // ms — title's own timeline duration, open
  TITLE_DELAY_OPEN: 100,       // ms — extra delay after the mask geometrically
                                 // reveals the title's position, open
  TITLE_EASE_STRENGTH: 6,      // higher = more pronounced ease curve
  TITLE_CLOSE_RISE: 20,        // px — title's rise distance, close
  TITLE_CLOSE_DURATION: 300,   // ms — title's own timeline duration, close
  OPEN_SETUP_DELAY: 160,       // ms — lets the card's own hover-retract CSS
                                 // transition finish before the FLIP takes over
  CLOSE_SETUP_DELAY: 200,      // ms — lets cutBody's own fade begin before
                                 // the reverse FLIP starts
  BAND_ASPECT: 480 / 1440,     // band height as a fraction of its own width
  TITLE_LEFT_RATIO: 0.072222,  // matches ThinkOpenAnimation's content padding
};

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function titleEaseOut(t: number, strength: number) {
  return 1 - Math.pow(1 - t, strength);
}
function titleEaseIn(t: number, strength: number) {
  return Math.pow(t, strength);
}

// Known fixed source size for every grid image (per project convention).
const NATIVE_IMG_W = 1920;
const NATIVE_IMG_H = 1080;

// Manual object-fit:cover, computed fresh each frame and compensated for
// cutOverlay's own non-uniform scale (sx, sy differ whenever the card's
// aspect ratio differs from the band's — nearly always). Without the
// compensation, the image inherits the parent's squash directly and comes
// out visibly stretched. containerWidth/bandHeight are cutOverlay's own
// frozen local layout size; sx/sy are its CURRENT scale this frame;
// visWidth/visHeight are the apparent on-screen box size this frame; zoom
// is the additional ken-burns factor (hoverScale → fullZoom) layered on top.
function imgCoverTransform(
  containerWidth: number, bandHeight: number,
  sx: number, sy: number,
  visWidth: number, visHeight: number,
  zoom: number
) {
  const sCover = Math.max(visWidth / NATIVE_IMG_W, visHeight / NATIVE_IMG_H) * zoom;
  const lsX = sCover / sx;
  const lsY = sCover / sy;
  const lx = containerWidth / 2 - (NATIVE_IMG_W * lsX) / 2;
  const ly = bandHeight / 2 - (NATIVE_IMG_H * lsY) / 2;
  return `translate(${lx}px, ${ly}px) scale(${lsX}, ${lsY})`;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function rectRelativeTo(el: HTMLElement, containerEl: HTMLElement): Rect {
  const c = containerEl.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  return { left: e.left - c.left, top: e.top - c.top, width: e.width, height: e.height };
}

export default function ThinkPageController() {
  const col = getColumn();

  const stageRef = useRef<HTMLDivElement>(null);
  const recedeCollapseRef = useRef<HTMLDivElement>(null);
  const recedeLayerRef = useRef<HTMLDivElement>(null);
  const cutOverlayRef = useRef<HTMLDivElement>(null);
  const cutImgRef = useRef<HTMLImageElement>(null);
  const cutTitleMaskRef = useRef<HTMLDivElement>(null);
  const cutTitleAnchorRef = useRef<HTMLDivElement>(null);
  const cutTitleRef = useRef<HTMLDivElement>(null);
  const cutBodyRef = useRef<HTMLDivElement>(null);
  const cutTagRef = useRef<HTMLDivElement>(null);
  const cutSubtitleRef = useRef<HTMLDivElement>(null);
  const cutExcerptRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const holeFillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const registerCardRef = (i: number, el: HTMLDivElement | null) => { cardRefs.current[i] = el; };
  const registerHoleFillRef = (i: number, el: HTMLDivElement | null) => { holeFillRefs.current[i] = el; };

  const [hiddenIndex, setHiddenIndex] = useState(-1);
  const [locked, setLocked] = useState(false);
  const [bodyShown, setBodyShown] = useState(false);

  const openIndexRef = useRef(-1);
  const hiddenIndexRef = useRef(-1);
  const savedRectRef = useRef<Rect>({ left: 0, top: 0, width: 0, height: 0 });
  const savedBandYRef = useRef(0);
  const savedBandHeightRef = useRef(0);
  const savedContainerWidthRef = useRef(0);
  const savedTranslateX0Ref = useRef(0);
  const savedTranslateY0Ref = useRef(0);
  const savedScaleX0Ref = useRef(1);
  const savedScaleY0Ref = useRef(1);
  const savedNaturalHRef = useRef(0);
  const savedRecedeAmtRef = useRef(0);
  const savedHoverScaleRef = useRef(1);
  const savedFullZoomRef = useRef(1);
  const savedTitleRiseRef = useRef(CONFIG.TITLE_RISE_OPEN);
  const animRAFRef = useRef<number | null>(null);
  const titleRAFRef = useRef<number | null>(null);
  const pendingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearPendingTimers() {
    pendingTimersRef.current.forEach((id) => clearTimeout(id));
    pendingTimersRef.current = [];
  }
  function cancelTitleTimeline() {
    if (titleRAFRef.current) { cancelAnimationFrame(titleRAFRef.current); titleRAFRef.current = null; }
  }
  function runTimeline(duration: number, onFrame: (eased: number) => void, onDone?: () => void) {
    if (animRAFRef.current) cancelAnimationFrame(animRAFRef.current);
    const start = performance.now();
    function frame(now: number) {
      const raw = Math.min(1, (now - start) / duration);
      try {
        onFrame(easeInOutCubic(raw));
      } catch (err) {
        console.error('Transition frame error, recovering:', err);
        animRAFRef.current = null;
        if (onDone) onDone();
        return;
      }
      if (raw < 1) {
        animRAFRef.current = requestAnimationFrame(frame);
      } else {
        animRAFRef.current = null;
        if (onDone) onDone();
      }
    }
    animRAFRef.current = requestAnimationFrame(frame);
  }
  function runTitleTimeline(
    duration: number,
    delay: number,
    easeFn: (t: number) => number,
    onFrame: (eased: number) => void
  ) {
    cancelTitleTimeline();
    const timerId = setTimeout(() => {
      const start = performance.now();
      function frame(now: number) {
        const raw = Math.min(1, (now - start) / duration);
        onFrame(easeFn(raw));
        if (raw < 1) {
          titleRAFRef.current = requestAnimationFrame(frame);
        } else {
          titleRAFRef.current = null;
        }
      }
      titleRAFRef.current = requestAnimationFrame(frame);
    }, delay);
    pendingTimersRef.current.push(timerId);
  }

  function fillContent(idx: number) {
    const data = CARD_DATA[idx % CARD_DATA.length];
    const cardImg = cardRefs.current[idx]?.querySelector('img') as HTMLImageElement | null;
    if (cutImgRef.current && cardImg) cutImgRef.current.src = cardImg.src;
    if (cutTitleRef.current) cutTitleRef.current.textContent = data.title;
    if (cutTagRef.current) cutTagRef.current.textContent = data.tag;
    if (cutSubtitleRef.current) cutSubtitleRef.current.textContent = data.subtitle;
    if (cutExcerptRef.current) cutExcerptRef.current.textContent = data.excerpt;
  }

  function updateSpacer() {
    if (!spacerRef.current || !cutBodyRef.current) return;
    const bandY = savedBandYRef.current;
    const bandHeight = savedBandHeightRef.current;
    const contentNeeded = bandY + bandHeight + cutBodyRef.current.scrollHeight + 100;
    const reachabilityNeeded = bandY + window.innerHeight;
    spacerRef.current.style.height = Math.max(contentNeeded, reachabilityNeeded) + 'px';
  }

  function openCardByIndex(idx: number) {
    if (openIndexRef.current !== -1) return;
    if (!stageRef.current || !recedeLayerRef.current || !recedeCollapseRef.current) return;
    if (!cutOverlayRef.current || !cutImgRef.current || !cutTitleMaskRef.current) return;
    if (!cutTitleAnchorRef.current || !cutTitleRef.current || !cutBodyRef.current) return;

    clearPendingTimers();
    cancelTitleTimeline();
    openIndexRef.current = idx;
    hiddenIndexRef.current = idx;
    setLocked(true);

    const card = cardRefs.current[idx];
    if (!card) return;

    const rect = rectRelativeTo(card, stageRef.current);
    const containerBox = stageRef.current.getBoundingClientRect();
    const bandY = Math.max(0, -containerBox.top);
    const containerWidth = containerBox.width;
    const bandHeight = containerWidth * CONFIG.BAND_ASPECT;

    savedRectRef.current = rect;
    savedBandYRef.current = bandY;
    savedBandHeightRef.current = bandHeight;
    savedContainerWidthRef.current = containerWidth;

    // FLIP inversion: the container's LAYOUT box is set ONCE below, at its
    // final full-band size, and never touched again this cycle. That
    // freezes object-fit:cover's crop computation for the whole
    // transition — nothing for the image content to swim against. The
    // starting-small look is faked entirely with a transform, animated
    // back to identity — GPU-composited, no per-frame layout/reflow.
    const translateX0 = rect.left;
    const translateY0 = rect.top - bandY;
    const scaleX0 = rect.width / containerWidth;
    const scaleY0 = rect.height / bandHeight;
    savedTranslateX0Ref.current = translateX0;
    savedTranslateY0Ref.current = translateY0;
    savedScaleX0Ref.current = scaleX0;
    savedScaleY0Ref.current = scaleY0;

    const layerScreenRect = recedeLayerRef.current.getBoundingClientRect();
    const gridTopInFrame = Math.max(0, layerScreenRect.top);
    savedRecedeAmtRef.current = Math.max(CONFIG.RECEDE_MIN, gridTopInFrame * CONFIG.RECEDE_MULTIPLIER);

    const timerId = setTimeout(() => {
      fillContent(idx);
      const cardImgEl = card.querySelector('img') as HTMLImageElement | null;
      const cardOverlayEl = card.querySelector('.think-overlay') as HTMLDivElement | null;
      if (cardImgEl) cardImgEl.style.opacity = '0';
      if (cardOverlayEl) cardOverlayEl.style.opacity = '0';
      setHiddenIndex(idx);

      const recedeCollapse = recedeCollapseRef.current!;
      const recedeLayer = recedeLayerRef.current!;
      const cutOverlay = cutOverlayRef.current!;
      const cutImg = cutImgRef.current!;
      const cutTitleMask = cutTitleMaskRef.current!;
      const cutTitleAnchor = cutTitleAnchorRef.current!;
      const cutTitle = cutTitleRef.current!;

      savedNaturalHRef.current = recedeCollapse.scrollHeight;
      recedeCollapse.style.transition = 'none';
      recedeCollapse.style.overflow = 'visible';
      recedeCollapse.style.height = savedNaturalHRef.current + 'px';
      recedeLayer.style.transition = 'none';
      cutTitle.style.transition = 'none';

      cutOverlay.style.display = 'block';
      cutOverlay.style.transition = 'none';
      cutOverlay.style.transformOrigin = '0 0';
      cutOverlay.style.left = '0px';
      cutOverlay.style.top = bandY + 'px';
      cutOverlay.style.width = containerWidth + 'px';
      cutOverlay.style.height = bandHeight + 'px';
      cutOverlay.style.transform = `translate(${translateX0}px, ${translateY0}px) scale(${scaleX0}, ${scaleY0})`;

      cutTitleMask.style.display = 'block';
      cutTitleMask.style.width = containerWidth + 'px';
      cutTitleAnchor.style.left = containerWidth * CONFIG.TITLE_LEFT_RATIO + 'px';
      cutTitleAnchor.style.top = bandY + bandHeight * 0.9 + 'px';
      cutTitleAnchor.style.transition = 'none';
      cutTitle.style.transform = 'translateX(0px)';
      cutTitle.style.opacity = '0';
      savedTitleRiseRef.current = CONFIG.TITLE_RISE_OPEN;
      cutTitleAnchor.style.transform = `translateY(calc(-100% + ${savedTitleRiseRef.current}px))`;

      const hoverScale = GRID_CONFIG.HOVER_SCALE;
      const fullZoom = CONFIG.FULL_ZOOM;
      savedHoverScaleRef.current = hoverScale;
      savedFullZoomRef.current = fullZoom;
      cutImg.style.transition = 'none';
      cutImg.style.transform = imgCoverTransform(containerWidth, bandHeight, scaleX0, scaleY0, rect.width, rect.height, hoverScale);
      const holeFill = holeFillRefs.current[idx];
      if (holeFill) holeFill.style.opacity = '0';

      const duration = CONFIG.TRANSITION_DURATION;
      const recedeAmt = savedRecedeAmtRef.current;
      const fadeOn = CONFIG.FADE_GRID;

      const titleRevealY = bandY + bandHeight * 0.9;
      const titleLeftX = containerWidth * CONFIG.TITLE_LEFT_RATIO;
      let titleTriggered = false;
      function triggerTitle() {
        if (titleTriggered) return;
        titleTriggered = true;
        const strength = CONFIG.TITLE_EASE_STRENGTH;
        runTitleTimeline(
          CONFIG.TITLE_DURATION_OPEN,
          CONFIG.TITLE_DELAY_OPEN,
          (t) => titleEaseOut(t, strength),
          (titleEased) => {
            cutTitle.style.opacity = String(titleEased);
            cutTitleAnchor.style.transform = `translateY(calc(-100% + ${(1 - titleEased) * savedTitleRiseRef.current}px))`;
          }
        );
      }

      requestAnimationFrame(() => {
        runTimeline(
          duration,
          (eased) => {
            const tx = lerp(translateX0, 0, eased);
            const ty = lerp(translateY0, 0, eased);
            const sx = lerp(scaleX0, 1, eased);
            const sy = lerp(scaleY0, 1, eased);
            cutOverlay.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;

            const visLeft = lerp(rect.left, 0, eased);
            const visTop = lerp(rect.top, bandY, eased);
            const visWidth = lerp(rect.width, containerWidth, eased);
            const visHeight = lerp(rect.height, bandHeight, eased);

            const zoom = lerp(hoverScale, fullZoom, eased);
            cutImg.style.transform = imgCoverTransform(containerWidth, bandHeight, sx, sy, visWidth, visHeight, zoom);
            if (holeFill) holeFill.style.opacity = String(eased);

            cutTitleMask.style.clipPath = `inset(${visTop}px ${containerWidth - visLeft - visWidth}px ${3000 - visTop - visHeight}px ${visLeft}px)`;
            if (visLeft <= titleLeftX && visLeft + visWidth >= containerWidth * 0.95 && visTop + visHeight >= titleRevealY) triggerTitle();

            recedeLayer.style.transform = `translateY(${lerp(0, -recedeAmt, eased)}px)`;
            if (fadeOn) recedeLayer.style.opacity = String(lerp(1, 0, eased));
          },
          () => {
            triggerTitle();
            recedeCollapse.style.overflow = 'hidden';
            recedeCollapse.style.height = '0px';
            cutBodyRef.current!.style.top = bandY + bandHeight + 56 + 'px';
            cutBodyRef.current!.classList.add('show');
            setBodyShown(true);
            updateSpacer();
            window.scrollTo({ top: containerBox.top + window.scrollY + bandY });
          }
        );
      });
    }, CONFIG.OPEN_SETUP_DELAY);
    pendingTimersRef.current.push(timerId);
  }

  function closeCard() {
    if (openIndexRef.current === -1) return;
    const idx = hiddenIndexRef.current;
    const card = cardRefs.current[idx];
    const holeFill = holeFillRefs.current[idx];
    const cutOverlay = cutOverlayRef.current!;
    const cutImg = cutImgRef.current!;
    const cutTitleMask = cutTitleMaskRef.current!;
    const cutTitleAnchor = cutTitleAnchorRef.current!;
    const cutTitle = cutTitleRef.current!;
    const recedeCollapse = recedeCollapseRef.current!;
    const recedeLayer = recedeLayerRef.current!;

    if (cutOverlay.style.display !== 'block') {
      clearPendingTimers();
      cancelTitleTimeline();
      openIndexRef.current = -1;
      hiddenIndexRef.current = -1;
      setHiddenIndex(-1);
      setLocked(false);
      setBodyShown(false);
      return;
    }

    clearPendingTimers();
    cancelTitleTimeline();
    const rect = savedRectRef.current;
    const bandY = savedBandYRef.current;
    const bandHeight = savedBandHeightRef.current;
    const containerWidth = savedContainerWidthRef.current;
    const translateX0 = savedTranslateX0Ref.current;
    const translateY0 = savedTranslateY0Ref.current;
    const scaleX0 = savedScaleX0Ref.current;
    const scaleY0 = savedScaleY0Ref.current;

    cutBodyRef.current!.classList.remove('show');
    setBodyShown(false);

    const timerId = setTimeout(() => {
      const duration = CONFIG.TRANSITION_DURATION;
      const recedeAmt = savedRecedeAmtRef.current;
      const fadeOn = CONFIG.FADE_GRID;

      cutTitle.style.transition = 'none';
      cutTitleAnchor.style.transition = 'none';
      recedeCollapse.style.transition = 'none';
      recedeLayer.style.transition = 'none';

      const closeTargetScale = card && card.matches(':hover') ? savedHoverScaleRef.current : 1;

      recedeCollapse.style.overflow = 'visible';
      recedeCollapse.style.height = savedNaturalHRef.current + 'px';

      const titleCloseDuration = CONFIG.TITLE_CLOSE_DURATION;
      const titleCloseRise = CONFIG.TITLE_CLOSE_RISE;
      const strength = CONFIG.TITLE_EASE_STRENGTH;
      runTitleTimeline(titleCloseDuration, 0, (t) => titleEaseIn(t, strength), (titleEased) => {
        const titleProgress = 1 - titleEased;
        cutTitle.style.opacity = String(titleProgress);
        cutTitleAnchor.style.transform = `translateY(calc(-100% + ${(1 - titleProgress) * titleCloseRise}px))`;
      });

      runTimeline(
        duration,
        (eased) => {
          const tx = lerp(0, translateX0, eased);
          const ty = lerp(0, translateY0, eased);
          const sx = lerp(1, scaleX0, eased);
          const sy = lerp(1, scaleY0, eased);
          cutOverlay.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;

          const visLeft = lerp(0, rect.left, eased);
          const visTop = lerp(bandY, rect.top, eased);
          const visWidth = lerp(containerWidth, rect.width, eased);
          const visHeight = lerp(bandHeight, rect.height, eased);

          const zoom = lerp(savedFullZoomRef.current, closeTargetScale, eased);
          cutImg.style.transform = imgCoverTransform(containerWidth, bandHeight, sx, sy, visWidth, visHeight, zoom);
          if (holeFill) holeFill.style.opacity = String(1 - eased);

          cutTitleMask.style.clipPath = `inset(${visTop}px ${containerWidth - visLeft - visWidth}px ${3000 - visTop - visHeight}px ${visLeft}px)`;

          recedeLayer.style.transform = `translateY(${lerp(-recedeAmt, 0, eased)}px)`;
          if (fadeOn) recedeLayer.style.opacity = String(lerp(0, 1, eased));
        },
        () => {
          cutOverlay.style.display = 'none';
          cutOverlay.style.transform = 'none';
          cutImg.style.transform = 'none';
          if (holeFill) holeFill.style.opacity = '0';
          cutTitleMask.style.display = 'none';
          cutTitle.style.opacity = '0';
          const cardImgEl = card?.querySelector('img') as HTMLImageElement | null;
          const cardOverlayEl = card?.querySelector('.think-overlay') as HTMLDivElement | null;
          if (cardImgEl) cardImgEl.style.opacity = '';
          if (cardOverlayEl) cardOverlayEl.style.opacity = '';
          setHiddenIndex(-1);
          recedeCollapse.style.height = 'auto';
          recedeCollapse.style.overflow = 'visible';
          recedeLayer.style.opacity = '1';
          recedeLayer.style.transform = 'translateY(0px)';
          if (spacerRef.current) spacerRef.current.style.height = '0px';
          openIndexRef.current = -1;
          hiddenIndexRef.current = -1;
          setLocked(false);
        }
      );
    }, CONFIG.CLOSE_SETUP_DELAY);
    pendingTimersRef.current.push(timerId);
  }

  useEffect(() => {
    function handleScroll() {
      if (openIndexRef.current === -1 || !stageRef.current) return;
      const containerBox = stageRef.current.getBoundingClientRect();
      const containerDocTop = containerBox.top + window.scrollY;
      const floor = containerDocTop + savedBandYRef.current;
      if (window.scrollY < floor) window.scrollTo({ top: floor });
    }
    function handleResize() {
      if (openIndexRef.current !== -1) updateSpacer();
    }
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={stageRef} style={{ position: 'relative', display: 'flow-root' }}>
      <div ref={recedeCollapseRef} style={{ overflow: 'visible' }}>
        <div ref={recedeLayerRef}>
          <ThinkOpenAnimation />
          <ThinkBlurb />
          <ThinkGrid
            onCardClick={openCardByIndex}
            registerCardRef={registerCardRef}
            registerHoleFillRef={registerHoleFillRef}
            hiddenIndex={hiddenIndex}
            locked={locked}
          />
          <ThinkBelowPlaceholder />
        </div>
      </div>

      <div
        ref={cutOverlayRef}
        onClick={closeCard}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '480px',
          zIndex: 100, overflow: 'hidden', background: '#000',
          display: 'none', cursor: 'pointer',
        }}
      >
        <img
          ref={cutImgRef}
          alt=""
          style={{ position: 'absolute', left: 0, top: 0, width: `${NATIVE_IMG_W}px`, height: `${NATIVE_IMG_H}px`, display: 'block', transformOrigin: '0 0' }}
        />
      </div>

      <div
        ref={cutTitleMaskRef}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '3000px',
          overflow: 'hidden', pointerEvents: 'none', zIndex: 101, display: 'none',
        }}
      >
        <div ref={cutTitleAnchorRef} style={{ position: 'absolute' }}>
          <div
            ref={cutTitleRef}
            style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1.15, color: '#fff', whiteSpace: 'nowrap', opacity: 0 }}
          />
        </div>
      </div>

      <div
        ref={cutBodyRef}
        className="think-cutbody"
        style={{ position: 'absolute', zIndex: 99, left: `${col.marginVw}vw`, width: `${col.vw}vw` }}
      >
        <style>{`
          .think-cutbody #cut-tag, .think-cutbody #cut-subtitle, .think-cutbody #cut-excerpt {
            opacity: 0;
            transition: opacity 650ms ease;
          }
          .think-cutbody.show #cut-tag { opacity: 1; transition-delay: 0ms; }
          .think-cutbody.show #cut-subtitle { opacity: 1; transition-delay: 25ms; }
          .think-cutbody.show #cut-excerpt { opacity: 1; transition-delay: 50ms; }
        `}</style>
        <div id="cut-tag" ref={cutTagRef} style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GRID_CONFIG.ACCENT, marginBottom: '10px' }} />
        <div id="cut-subtitle" ref={cutSubtitleRef} style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '14px', maxWidth: '640px' }} />
        <div id="cut-excerpt" ref={cutExcerptRef} style={{ fontSize: '16px', lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', maxWidth: '620px' }} />
      </div>

      {bodyShown && (
        <button
          onClick={closeCard}
          style={{
            position: 'fixed', bottom: '32px', right: '32px', zIndex: 200,
            background: GRID_CONFIG.ACCENT, border: 'none', width: '32px', height: '32px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '16px', height: '16px' }}>
            <line x1="25" y1="25" x2="75" y2="75" stroke="#0d0d0d" strokeWidth={10} strokeLinecap="round" />
            <line x1="75" y1="25" x2="25" y2="75" stroke="#0d0d0d" strokeWidth={10} strokeLinecap="round" />
          </svg>
        </button>
      )}

      <div ref={spacerRef} style={{ height: 0 }} />
    </div>
  );
}