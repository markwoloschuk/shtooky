'use client';
import { useEffect, useState } from 'react';
import { getColumn } from './Tokens';

// ── Tunable constants ────────────────────────────────────────────────────
const CONFIG = {
  GAP_ABOVE_GRID: 40,    // px — direct gap below the blurb.
  GAP: 6,                // px — card gap, locked v28 default
  TITLE_SIZE: 25,         // px — locked v28 default
  OVERLAY_DARKEN: 0.85,   // locked v28 default
  HOVER_SPEED: 500,       // ms — locked v28 default
  HOVER_SCALE: 1.10,      // locked v28 default (mockup's --hover-scale)
  ACCENT: '#D6DE23',      // COLORS.thinking

  FADE_DELAY_MS: 4500,    // starts once the blurb's own fade finishes (currently 3500)
  FADE_DURATION_MS: 1000, // matches the blurb's fade duration
};

// Same 1440-wide reference canvas as ThinkOpenAnimation's NATIVE_W — block
// dimensions below are native units in that space, converted to vw the
// same way (nativeUnits * col.vw / NATIVE_W), just without a SCALE factor
// since the grid isn't scaled down, it fills the content column directly.
const NATIVE_W = 1440;

// Locked v28 default layout — "Bento — Interleaved". Hand-authored, not
// procedurally generated (per the project's locked design principle).
const BENTO_INTERLEAVED = {
  rows: '480fr 480fr 360fr 360fr',
  totalHeight: 480 + 480 + 360 + 360, // 1680 native units
  areas: [
    'a a a a a a b b b c c c',
    'd d d d e e e e e e e e',
    'f f f f f f g g g g g g',
    'h h h h i i i i j j j j',
  ],
};

const IMAGE_PATH = '/images/how-i-think';
const IMAGE_COUNT = 10; // ThinkGrid_01.jpg through ThinkGrid_10.jpg, all 1920×1080

function imageSrc(i: number): string {
  const n = String((i % IMAGE_COUNT) + 1).padStart(2, '0');
  return `${IMAGE_PATH}/ThinkGrid_${n}.jpg`;
}

const CARD_LETTERS = 'abcdefghij';

// Placeholder copy, ported directly from grid-mockup.html — stand-ins
// until real photography/titles are in.
const TITLES = [
  'Sincerity as the\nsoul of design', 'Seeing with\nyour heart', 'Be a zoom lens',
  'WYSIWYG?', 'Design is a\nconversation', 'Paper is cheap', "Iterate but\ndon't thrash",
  'Done is better\nthan perfect', 'Consistency\ncreates connection', 'An uncomfortable hug?',
];

/*
// Deterministic placeholder image generator, ported directly from
// grid-mockup.html's placeholderSrc() — same seeded gradient + checker
// pattern, so this reads identically to the locked mockup until real
// photography replaces it.
function placeholderSrc(seed: number): string {
  const hue = (seed * 47) % 360;
  const hue2 = (hue + 35) % 360;
  const checkSize = 24;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='hsl(${hue},42%,30%)'/>
        <stop offset='100%' stop-color='hsl(${hue2},55%,16%)'/>
      </linearGradient>
      <pattern id='check' width='${checkSize * 2}' height='${checkSize * 2}' patternUnits='userSpaceOnUse'>
        <rect width='${checkSize}' height='${checkSize}' fill='rgba(255,255,255,0.06)'/>
        <rect x='${checkSize}' width='${checkSize}' height='${checkSize}' fill='rgba(0,0,0,0.06)'/>
        <rect y='${checkSize}' width='${checkSize}' height='${checkSize}' fill='rgba(0,0,0,0.06)'/>
        <rect x='${checkSize}' y='${checkSize}' width='${checkSize}' height='${checkSize}' fill='rgba(255,255,255,0.06)'/>
      </pattern>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <rect width='100%' height='100%' fill='url(#check)'/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
*/

export default function ThinkGrid() {
  const col = getColumn();
  const nativeToVw = col.vw / NATIVE_W;
  const gridHeightVw = BENTO_INTERLEAVED.totalHeight * nativeToVw;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), CONFIG.FADE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        width: `${col.vw}vw`,
        margin: `${CONFIG.GAP_ABOVE_GRID}px auto 0`,
        opacity: visible ? 1 : 0,
        transition: `opacity ${CONFIG.FADE_DURATION_MS}ms linear`,
      }}
    >
      <style>{`
        .think-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          background: #1a1a1a;
          border-radius: 2px;
        }
        .think-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform ${CONFIG.HOVER_SPEED}ms ease;
        }
        .think-card .think-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
          transition: background ${CONFIG.HOVER_SPEED}ms ease;
        }
        .think-card:hover .think-overlay {
          background: rgba(13,13,13,${CONFIG.OVERLAY_DARKEN});
        }
        .think-card:hover img {
          transform: scale(${CONFIG.HOVER_SCALE});
        }
        .think-card .think-title {
          font-family: "Archivo", sans-serif;
          font-size: ${CONFIG.TITLE_SIZE}px;
          font-weight: 700;
          letter-spacing: 0.01em;
          line-height: 1.25;
          text-align: left;
          color: #fff;
          white-space: pre-line;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity ${CONFIG.HOVER_SPEED}ms ease, transform ${CONFIG.HOVER_SPEED}ms ease;
        }
        .think-card:hover .think-title {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: BENTO_INTERLEAVED.rows,
          gridTemplateAreas: BENTO_INTERLEAVED.areas.map((row) => `"${row}"`).join(' '),
          height: `${gridHeightVw}vw`,
          gap: `${CONFIG.GAP}px`,
        }}
      >
        {CARD_LETTERS.split('').map((letter, i) => (
          <div key={letter} className="think-card" style={{ gridArea: letter }}>
            <img src={imageSrc(i)} alt="" />
            <div className="think-overlay">
              <div className="think-title">{TITLES[i % TITLES.length]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}