'use client';

import { useRef, useState } from 'react';
import { useColumn } from './Tokens';
import ThinkOpenAnimation from './ThinkOpenAnimation';
import ThinkBlurb from './ThinkBlurb';
import ThinkGridCanvas, { CARD_DATA, BAND_HEIGHT, NATIVE_W } from './ThinkGridCanvas';
import ThinkBelowPlaceholder from './ThinkBelowPlaceholder';

export default function ThinkPageController() {
  const col = useColumn();
  const [cardOpen, setCardOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState(-1);
  const closeRef = useRef<() => void>(() => {});

  // Passed down to ThinkGridCanvas, which now owns the actual timing of
  // this block's space-collapse (snapping it at the same instant as its
  // own internal layout snaps, not independently). This div's OPACITY
  // still just follows cardOpen normally — only its height/space is
  // ref-driven now.
  const headerRef = useRef<HTMLDivElement>(null);

  function handleOpen(idx: number) { setCardOpen(true); setOpenIdx(idx); }
  function handleClose() { setCardOpen(false); }
  function handleRegisterControls(step: (dir: number) => void, close: () => void) {
    closeRef.current = close;
  }

  const data = openIdx >= 0 ? CARD_DATA[openIdx % CARD_DATA.length] : null;
  // Band height as a CSS calc — responsive, no window measurement needed.
  // 480/1440 = 33.333...vw, matching the band canvas's own sizing.
  const bandTopCalc = `calc(${(BAND_HEIGHT / NATIVE_W) * 100}vw + 56px)`;

  return (
    <div>
      <div ref={headerRef} style={{ overflow: 'hidden', opacity: cardOpen ? 0 : 1, transition: 'opacity 300ms ease' }}>
        <ThinkOpenAnimation />
        <ThinkBlurb />
      </div>

      <ThinkGridCanvas
        onOpen={handleOpen}
        onClose={handleClose}
        onRegisterControls={handleRegisterControls}
        headerRef={headerRef}
      />

      {/* Detail text — fixed-positioned when open so it always sits 56px
          below the band regardless of scroll position (matching mockup's
          cutBody.style.top = bandY + BAND_HEIGHT + 56). */}
      <div
        style={{
          width: `${col.vw}vw`,
          pointerEvents: cardOpen ? 'auto' : 'none',
          ...(cardOpen ? {
            position: 'fixed' as const,
            top: bandTopCalc,
            left: '0',
            right: '0',
            margin: '0 auto',
            zIndex: 100,
          } : {
            margin: '56px auto 0',
          }),
        }}
      >
        {data && (
          <>
            <div style={{
              fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#D6DE23', marginBottom: '10px',
              opacity: cardOpen ? 1 : 0, transition: 'opacity 650ms ease',
              transitionDelay: cardOpen ? '0ms' : '0ms',
            }}>
              {data.tag}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '14px', maxWidth: '640px',
              opacity: cardOpen ? 1 : 0, transition: 'opacity 650ms ease',
              transitionDelay: cardOpen ? '25ms' : '0ms',
            }}>
              {data.subtitle}
            </div>
            <div style={{
              fontSize: '16px', lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', maxWidth: '620px',
              opacity: cardOpen ? 1 : 0, transition: 'opacity 650ms ease',
              transitionDelay: cardOpen ? '50ms' : '0ms',
            }}>
              {data.excerpt}
            </div>
          </>
        )}
      </div>

      <div style={{ opacity: cardOpen ? 0 : 1, transition: 'opacity 300ms ease' }}>
        <ThinkBelowPlaceholder />
      </div>

      {cardOpen && (
        <button
          onClick={() => closeRef.current()}
          style={{
            position: 'fixed', bottom: '32px', right: '32px', zIndex: 200,
            background: '#D6DE23', border: 'none', width: '32px', height: '32px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '16px', height: '16px' }}>
            <line x1="25" y1="25" x2="75" y2="75" stroke="#0d0d0d" strokeWidth={10} strokeLinecap="round" />
            <line x1="75" y1="25" x2="25" y2="75" stroke="#0d0d0d" strokeWidth={10} strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}