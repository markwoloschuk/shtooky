'use client';

import { getColumn } from './Tokens';

// ── Tunable constants ────────────────────────────────────────────────────
const CONFIG = {
  TOP_MARGIN: 56,      // px — space below the opening animation, matches
                        // grid-mockup.html's `.blurb-space { margin: 56px 0 0 12% }`
  WIDTH_FACTOR: 0.5,    // fraction of the content column's width — mockup's
                        // 38% of the 1440 stage is half of the 76% content
                        // column, so this rides the column system instead
                        // of a second hardcoded percentage
  FONT_SIZE_MIN: 22,    // px — clamp() floor
  FONT_SIZE_VW: 2.4,    // vw — clamp() fluid middle
  FONT_SIZE_MAX: 34,    // px — clamp() ceiling
  LINE_HEIGHT: 1.3,
};

export default function ThinkBlurb() {
  const col = getColumn();

  return (
    <div
      style={{
        width: `${col.vw * CONFIG.WIDTH_FACTOR}vw`,
        margin: `${CONFIG.TOP_MARGIN}px 0 0 ${col.marginVw}vw`,
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