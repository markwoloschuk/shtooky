'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useColumn, COLORS, SPACE, useSpace, bandHeightPx, contentInset } from './SiteTokens';
import ThinkOpenAnimation from './ThinkOpenAnimation';
import ThinkBlurb from './ThinkBlurb';
import ThinkGridCanvas from './ThinkGridCanvas';
import ThinkBelowPlaceholder from './ThinkBelowPlaceholder';
import ThinkCasePanel from './ThinkCasePanel';
import { THINK_GRID, contentFileFor } from '../data/ThinkManifest';

export default function ThinkPageController() {
  const col = useColumn();
  const space = useSpace();
  const [cardOpen, setCardOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState(-1);
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

  // Has the open animation landed? Cleared at the START of every open — including
  // reopening the SAME card, which is the path that had no scroll of its own
  // (ThinkCasePanel's scroll effect is keyed on the file, and the file does not
  // change when you reopen what you just closed) and therefore depended
  // entirely on the landing scroll happening before the fade.
  const [landed, setLanded] = useState(false);
  function handleOpen(idx: number) { setLanded(false); setCardOpen(true); setOpenIdx(idx); }
  function handleClose() { setLanded(false); setCardOpen(false); }
  function handleRegisterControls(step: (dir: number) => void, close: () => void) {
    stepRef.current = step;
    closeRef.current = close;
  }

  // Band height in screen pixels. Was a local recomputation of the band
  // canvas's own sizing (480/1440 = 33.333vw, mobile x 1.65) — the sixth copy
  // of that conversion. Now the shared resolver, so this file and the canvas
  // cannot disagree about how tall the band is.
  const bandH = bandHeightPx(viewportW);
  // The content sits at a CONSTANT document position, under a band that is a
  // viewport object at top 0.
  //
  // It used to be anchored to bandDocY — window.scrollY at the instant the card
  // was clicked — so the content lived somewhere different depending on where
  // the reader happened to be. That one dependency produced every open symptom
  // at once: empty space reachable above the content, next/prev landing
  // part-scrolled, and the content being placed once and then replaced when
  // bandDocY arrived.
  //
  // bandDocY still exists in ThinkGridCanvas but positions nothing. Its only
  // remaining job is the scroll position to return the reader to on close — a
  // bookmark, not an authority.
  //
  // Same gap the Work carousel uses down to its case panel — both bands end in
  // the same vignette, so they read as the same edge.
  // Not a document coordinate any more — the detail panel is in NORMAL FLOW
  // and this is its padding-top. Everything above it (header, grid, the grid's
  // 40px margin) collapses to zero height at the landing frame, so the panel
  // starts at document 0 and this padding puts its first line just below the
  // viewport-fixed band. The document's height while open is the content's own
  // height, which is the whole point of deleting the spacer.
  const detailTopPx = bandH + space(SPACE.layout.bandDetailGap);
const cardFile = openIdx >= 0 ? contentFileFor(THINK_GRID[openIdx]) : null;

  return (
    <div>
      <div ref={headerRef} style={{ overflow: 'visible', opacity: cardOpen ? 0 : 1, transition: 'opacity 300ms ease' }}>
        <ThinkOpenAnimation />
        <ThinkBlurb />
        {/* The gap between the blurb and the grid. It was marginTop: '40px' on
            ThinkGridCanvas's own outer div, which meant collapsing it for an
            open card required writing to a style React had declared — and
            clearing that back on close deleted the gap permanently, because
            React still thought it had set it. As a child of the header it
            collapses along with everything else here, needs no imperative
            write, and ThinkGridCanvas's transform picks it up automatically via
            the header's scrollHeight. */}
        <div style={{ height: '40px' }} />
      </div>

<ThinkGridCanvas
        onOpen={handleOpen}
        onClose={handleClose}
        onRegisterControls={handleRegisterControls}
        headerRef={headerRef}
        onOpenLanded={() => setLanded(true)}
      />

{/* Detail text — document-positioned when open, right below the
band, so it scrolls naturally with the page instead of living
in its own fixed/scrolling box. */}
      <div
        id="think-detail"
        style={{
          width: '100%',
          boxSizing: 'border-box' as const,
          pointerEvents: cardOpen ? 'auto' : 'none',
          paddingLeft: contentInset(col),
          paddingRight: contentInset(col),
          ...(cardOpen ? {
            // position: absolute is gone. It was what made this panel
            // contribute no height to the document, which is what the spacer
            // was compensating for. In flow, the panel IS the document.
            paddingTop: `${detailTopPx}px`,
            paddingBottom: '24px',
          } : {
            marginTop: '56px',
          }),
        }}
      >
        {/* bandDocY is 0 and stays 0: this panel's content top is the top of
            the document, exactly as Work's is. The band is not in the document
            at all. */}
        <ThinkCasePanel cardFile={cardFile} visible={cardOpen} bandDocY={0} landed={landed} />
      </div>
      
      {/* Collapsed while a card is open, not just faded. Left at its natural
          height it adds a screenful of empty scroll below the case copy — the
          document is supposed to be the content and nothing else now. */}
      <div style={{
        opacity: cardOpen ? 0 : 1,
        transition: 'opacity 300ms ease',
        ...(cardOpen ? { height: 0, overflow: 'hidden' as const } : {}),
      }}>
        <ThinkBelowPlaceholder />
      </div>

      {cardOpen && createPortal(
        <div style={{
          position: 'fixed', bottom: '84px', right: contentInset(col), zIndex: 45,
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