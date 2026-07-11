'use client';

import { getColumn } from './Tokens';
import { CONFIG as ANIM_CONFIG } from './ThinkOpenAnimation';

// ── Tunable constants ────────────────────────────────────────────────────
const CONFIG = {
  GAP_BELOW_CONTENT: 56, // px — desired space between the animation's actual
                          // visible artwork and this blurb. NOT measured from
                          // ThinkOpenAnimation's reserved box edge — that box
                          // is deliberately oversized (see pullUpVw below).
  WIDTH_FACTOR: 0.5,      // fraction of the content column's width
  FONT_SIZE_MIN: 22,      // px
  FONT_SIZE_VW: 2.4,      // vw
  FONT_SIZE_MAX: 34,      // px
  LINE_HEIGHT: 1.3,
};

export default function ThinkBlurb() {
  const col = getColumn();

// General form, anchor-relative: works for whatever ANCHOR_Y currently
  // is, rather than assuming symmetric box-centering. The anchor's native
  // point always renders at the outer box's own vertical center — so the
  // render position of any other native point (like the artwork's bottom
  // edge) is that center, offset by the native-to-vw-scaled distance from
  // the anchor. pullUpVw is just outer-box-bottom minus that position.
  const outerHeightVw = col.vw * (ANIM_CONFIG.NATIVE_H / ANIM_CONFIG.NATIVE_W);
  const innerHeightVw = outerHeightVw * ANIM_CONFIG.SCALE;
  const nativeToVw = innerHeightVw / ANIM_CONFIG.NATIVE_H;
  const pullUpVw =
    outerHeightVw / 2 -
    (ANIM_CONFIG.CONTENT_BOTTOM_Y - ANIM_CONFIG.ANCHOR_Y) * nativeToVw;

  return (
    <div
      style={{
        width: `${col.vw * CONFIG.WIDTH_FACTOR}vw`,
        margin: `calc(${CONFIG.GAP_BELOW_CONTENT}px - ${pullUpVw}vw) 0 0 ${col.marginVw}vw`,
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