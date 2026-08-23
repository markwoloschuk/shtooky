'use client';

// TYPE ROLES USED IN THIS FILE:
//   intro blurb → TYPE_TIERS.SUBTITLE  (sizePx — replaces local clamp CONFIG)

import { useEffect, useState } from 'react';
import { useColumn, useType, useBreakpoint, bodyMaxWidth } from './SiteTokens';

// Gap from the animation's real visible bottom edge down to this blurb.
// Three explicit per-breakpoint px values, same shape as the
// NAV_CLEARANCE_* trio in ThinkOpenAnimation.tsx and lets-talk/page.tsx.
// Tablet previously had no tier of its own and silently inherited
// desktop's 32; 24 is a straight-line interpolation between desktop and
// mobile — starting guess only, not yet tuned live.
const GAP_BELOW_CONTENT_DESKTOP = 32; // px
const GAP_BELOW_CONTENT_TABLET = 24;  // px — interpolated guess, tune live
const GAP_BELOW_CONTENT_MOBILE = 16;  // px — starting guess, tune live on device

// ── Tunable constants ────────────────────────────────────────────────────
const CONFIG = {
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
  const bp   = useBreakpoint();
  const [visible, setVisible] = useState(false);

  const gapBelowContent =
    bp === 'mobile' ? GAP_BELOW_CONTENT_MOBILE :
    bp === 'tablet' ? GAP_BELOW_CONTENT_TABLET :
    GAP_BELOW_CONTENT_DESKTOP;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), CONFIG.FADE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        width: bodyMaxWidth(col),
        margin: `${gapBelowContent}px 0 0 ${col.marginVw}vw`,        opacity: visible ? 1 : 0,
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