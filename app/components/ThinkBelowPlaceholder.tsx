'use client';

import { useColumn } from './SiteTokens';

// ── Tunable constants ────────────────────────────────────────────────────
const CONFIG = {
  GAP_ABOVE: 40,  // px — locked v28 default (mockup's `.below-pull { margin: 40px auto 0 }`)
  PADDING_BOTTOM: 80, // px — locked v28 default
};

export default function ThinkBelowPlaceholder() {
  const col = useColumn();

  return (
    <div
      style={{
        width: `${col.vw}vw`,
        margin: `${CONFIG.GAP_ABOVE}px auto 0`,
        paddingBottom: `${CONFIG.PADDING_BOTTOM}px`,
      }}
    >
      <p
        style={{
          fontFamily: '"Archivo", sans-serif',
          fontWeight: 300,
          fontSize: 'clamp(18px, 1.8vw, 24px)',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.5)',
          margin: 0,
        }}
      >
        Placeholder — stand-in for whatever comes after the grid (closing
        statement, footer, etc.), so the recede transition can be judged
        against real content below the fold, not empty space.
      </p>
    </div>
  );
}