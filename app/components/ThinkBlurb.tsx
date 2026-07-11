'use client';

import { getColumn } from './Tokens';

// ── Tunable constants ────────────────────────────────────────────────────
const CONFIG = {
  GAP_BELOW_CONTENT: 32, // px — direct gap from the animation's real
                          // visible bottom edge to this blurb. No pull-up
                          // math needed anymore: ThinkOpenAnimation's
                          // wrapper now ends exactly where the artwork
                          // itself ends, so a plain margin-top is correct.
  WIDTH_FACTOR: 0.5,      // fraction of the content column's width
  FONT_SIZE_MIN: 22,      // px
  FONT_SIZE_VW: 2.4,      // vw
  FONT_SIZE_MAX: 34,      // px
  LINE_HEIGHT: 1.3,
};

export default function ThinkBlurb() {
  const col = getColumn();

  return (
    <div
      style={{
        width: `${col.vw * CONFIG.WIDTH_FACTOR}vw`,
        margin: `${CONFIG.GAP_BELOW_CONTENT}px 0 0 ${col.marginVw}vw`,
      }}
    >
      <p
        style={{
          fontFamily: '"Archivo", sans-serif',
          fontWeight: 300,
          fontSize: `clamp(${CONFIG.FONT_SIZE_MIN}px, ${CONFIG.FONT_SIZE_VW}vw, ${CONFIG.FONT_SIZE_MAX}px)`,
          lineHeight: CONFIG.LINE_HEIGHT,
          color: '#fff',
          margin: 0,
        }}
      >
        I never studied design — everything I know about it came from doing.
        <br />
        Here’s some of what I’ve learned.
      </p>
    </div>
  );
}