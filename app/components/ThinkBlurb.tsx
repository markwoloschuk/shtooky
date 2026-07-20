'use client';

// TYPE ROLES USED IN THIS FILE:
//   intro blurb → TYPE_TIERS.SUBTITLE  (sizePx — replaces local clamp CONFIG)

import { useEffect, useState } from 'react';
import { useColumn, useType, bodyMaxWidth } from './SiteTokens';

// ── Tunable constants ────────────────────────────────────────────────────
const CONFIG = {
  GAP_BELOW_CONTENT: 32, // px — direct gap from the animation's real
                          // visible bottom edge to this blurb.
  FONT_SIZE_MIN: 22,      // px
  FONT_SIZE_VW: 2.4,      // vw
  FONT_SIZE_MAX: 34,      // px
  LINE_HEIGHT: 1.3,

  FADE_DELAY_MS: 2500,    // starts 5s after this component mounts, which is
                           // effectively "5s after the think animation
                           // starts" since both mount together in page.tsx
  FADE_DURATION_MS: 1000,
};

export default function ThinkBlurb() {
  const col  = useColumn();
  const type = useType();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), CONFIG.FADE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        width: bodyMaxWidth(col),
        margin: `${CONFIG.GAP_BELOW_CONTENT}px 0 0 ${col.marginVw}vw`,
        opacity: visible ? 1 : 0,
        transition: `opacity ${CONFIG.FADE_DURATION_MS}ms linear`,
      }}
    >
      <p
        style={{
          fontFamily: '"Archivo", sans-serif',
          fontWeight: 300,
          fontSize: `${type.SUBTITLE.sizePx}px`,
          lineHeight: type.SUBTITLE.lineHeight,
          color: '#fff',
          margin: 0,
        }}
      >
        I never studied design — everything I know about it came from doing. Here’s some of what I’ve learned.
      </p>
    </div>
  );
}