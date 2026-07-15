'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useColumn, COLORS } from './Tokens';
import ThinkOpenAnimation from './ThinkOpenAnimation';
import ThinkBlurb from './ThinkBlurb';
import ThinkGridCanvas, { BAND_HEIGHT, NATIVE_W } from './ThinkGridCanvas';
import ThinkBelowPlaceholder from './ThinkBelowPlaceholder';
import ThinkCasePanel from './ThinkCasePanel';
import { THINK_GRID, contentFileFor } from '../data/ThinkManifest';

export default function ThinkPageController() {
  const col = useColumn();
  const [cardOpen, setCardOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState(-1);
  const [bandDocY, setBandDocY] = useState(0);
  const [viewportW, setViewportW] = useState(0);
  const closeRef = useRef<() => void>(() => {});
  const stepRef = useRef<(dir: number) => void>(() => {});

  useEffect(() => {
    const update = () => setViewportW(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Passed down to ThinkGridCanvas, which now owns the actual timing of
  // this block's space-collapse (snapping it at the same instant as its
  // own internal layout snaps, not independently). This div's OPACITY
  // still just follows cardOpen normally — only its height/space is
  // ref-driven now.
  //
  // overflow was 'hidden' here, left over from before the collapse moved
  // to a transform driven by ThinkGridCanvas. It wasn't doing any layout
  // work anymore — this box's own height/exit is fully handled by opacity
  // + translateY — but it WAS clipping ThinkOpenAnimation's flash/particle
  // burst, which is absolutely positioned and extends well past this div's
  // normal-flow height. Switched to 'visible' so the burst isn't cut off
  // at this box's bottom edge.
  const headerRef = useRef<HTMLDivElement>(null);

  function handleOpen(idx: number) { setCardOpen(true); setOpenIdx(idx); }
  function handleClose() { setCardOpen(false); }
  function handleRegisterControls(step: (dir: number) => void, close: () => void) {
    stepRef.current = step;
    closeRef.current = close;
  }

  // Band height as a CSS calc — responsive, no window measurement needed.
  // 480/1440 = 33.333...vw, matching the band canvas's own sizing.
const bandHeightPx = viewportW * (BAND_HEIGHT / NATIVE_W);
  const detailTopPx = bandDocY + bandHeightPx + 56;
const cardFile = openIdx >= 0 ? contentFileFor(THINK_GRID[openIdx]) : null;

  return (
    <div>
      <div ref={headerRef} style={{ overflow: 'visible', opacity: cardOpen ? 0 : 1, transition: 'opacity 300ms ease' }}>
        <ThinkOpenAnimation />
        <ThinkBlurb />
      </div>

<ThinkGridCanvas
        onOpen={handleOpen}
        onClose={handleClose}
        onRegisterControls={handleRegisterControls}
        headerRef={headerRef}
        onBandPositioned={setBandDocY}
      />

{/* Detail text — document-positioned when open, right below the
          band, so it scrolls naturally with the page instead of living
          in its own fixed/scrolling box. */}
      <div
        style={{
          width: `${col.vw}vw`,
          paddingLeft: '7.2222%',
          paddingRight: '7.2222%',
          boxSizing: 'border-box' as const,
          pointerEvents: cardOpen ? 'auto' : 'none',
          ...(cardOpen ? {
            position: 'absolute' as const,
            top: `${detailTopPx}px`,
            left: '0',
            right: '0',
            margin: '0 auto',
            zIndex: 15,
            paddingBottom: '24px',
          } : {
            margin: '56px auto 0',
          }),
        }}
      >
        <ThinkCasePanel cardFile={cardFile} visible={cardOpen} />
      </div>
      
      <div style={{ opacity: cardOpen ? 0 : 1, transition: 'opacity 300ms ease' }}>
        <ThinkBelowPlaceholder />
      </div>

      {cardOpen && createPortal(
        <div style={{
          position: 'fixed', bottom: '84px', right: '32px', zIndex: 45,
          display: 'flex', gap: '8px',
        }}>
          <button
            onClick={() => stepRef.current(-1)}
            style={{
              background: COLORS.thinking, border: 'none', width: '32px', height: '32px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '14px', height: '14px' }}>
              <polyline points="60,20 35,50 60,80" fill="none" stroke={COLORS.dark} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => closeRef.current()}
            style={{
              background: COLORS.thinking, border: 'none', width: '32px', height: '32px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '16px', height: '16px' }}>
              <line x1="25" y1="25" x2="75" y2="75" stroke={COLORS.dark} strokeWidth={10} strokeLinecap="round" />
              <line x1="75" y1="25" x2="25" y2="75" stroke={COLORS.dark} strokeWidth={10} strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => stepRef.current(1)}
            style={{
              background: COLORS.thinking, border: 'none', width: '32px', height: '32px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '14px', height: '14px' }}>
              <polyline points="40,20 65,50 40,80" fill="none" stroke={COLORS.dark} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}