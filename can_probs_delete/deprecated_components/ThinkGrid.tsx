'use client';
import { useEffect, useState } from 'react';
import { useColumn } from '../SiteTokens';

// ── Tunable constants ────────────────────────────────────────────────────
export const CONFIG = {
  GAP_ABOVE_GRID: 40,    // px — direct gap below the blurb.
  GAP: 6,                // px — card gap, locked v28 default
  TITLE_SIZE: 25,         // px — locked v28 default
  OVERLAY_DARKEN: 0.85,   // locked v28 default
  HOVER_SPEED: 500,       // ms — locked v28 default
  HOVER_SCALE: 1.10,      // locked v28 default (mockup's --hover-scale) —
                           // also read by ThinkPageController to seed the
                           // open transition's starting zoom
  ACCENT: '#D6DE23',      // COLORS.thinking — also used by ThinkPageController
                           // for the cut-tag color and close button

  FADE_DELAY_MS: 0,    // starts once the blurb's own fade finishes (currently 3500)
  FADE_DURATION_MS: 0, // matches the blurb's fade duration
};

// Same 1440-wide reference canvas as ThinkOpenAnimation's NATIVE_W — block
// dimensions below are native units in that space, converted to vw the
// same way (nativeUnits * col.vw / NATIVE_W), just without a SCALE factor
// since the grid isn't scaled down, it fills the content column directly.
const NATIVE_W = 1440;

// Locked v28 default layout — "Bento — Interleaved". Kept for reference/
// future use.
const BENTO_INTERLEAVED = {
  rows: '480fr 480fr 360fr 360fr',
  totalHeight: 480 + 480 + 360 + 360,
  areas: [
    'a a a a a a b b b c c c',
    'd d d d e e e e e e e e',
    'f f f f f f g g g g g g',
    'h h h h i i i i j j j j',
  ],
};

// Active default — every row is 3-across or 4-across, none wider.
const BENTO_COMPACT = {
  rows: '360fr 480fr 360fr',
  totalHeight: 360 + 480 + 360,
  areas: [
    'a a a b b b c c c d d d',
    'e e e e f f f f g g g g',
    'h h h h i i i i j j j j',
  ],
};

const ACTIVE_LAYOUT = BENTO_COMPACT;

const IMAGE_PATH = '/images/how-i-think';
const IMAGE_COUNT = 10; // ThinkGrid_01.jpg through ThinkGrid_10.jpg, all 1920×1080

function imageSrc(i: number): string {
  const n = String((i % IMAGE_COUNT) + 1).padStart(2, '0');
  return `${IMAGE_PATH}/ThinkGrid_${n}.jpg`;
}

const CARD_LETTERS = 'abcdefghij';

// Single source of truth for card content — title (grid overlay), tag/
// subtitle/excerpt (open detail view, read by ThinkPageController). Ported
// 1:1 from grid-mockup.html's titles/tags/subtitles/excerpts arrays,
// index-matched.
export const CARD_DATA = [
  { title: 'Sincerity as the\nsoul of design', tag: 'On intention', subtitle: 'Make every decision mean something', excerpt: 'Every choice — every color, font, line, edge — should carry intent.' },
  { title: 'Seeing with\nyour heart', tag: 'On empathy', subtitle: 'Empathy is the lens that focuses design', excerpt: 'The empathy lens is what helps you see the emotional hooks and where they can be placed.' },
  { title: 'Be a zoom lens', tag: 'On scale', subtitle: 'Relish the details but paint a bigger picture', excerpt: 'A designer who only sees pixels misses the point. A designer who only sees the picture misses the craft.' },
  { title: 'WYSIWYG?', tag: 'On perspective', subtitle: 'What you see depends on where you stand', excerpt: 'Two people looking at the same design see different things — informed by their experience, expertise, agenda.' },
  { title: 'Design is a\nconversation', tag: 'On dialogue', subtitle: "The brief starts the conversation, it doesn't end it", excerpt: 'Good design is never a monologue.' },
  { title: 'Paper is cheap', tag: 'On iteration', subtitle: 'Lo-fi exploration leads to hi-fi results', excerpt: 'The faster you can be wrong, the sooner you can be right.' },
  { title: "Iterate but\ndon't thrash", tag: 'On rhythm', subtitle: 'Patience is a creative skill, so is knowing when to move on', excerpt: 'Iteration without convergence is thrashing. The skill is recognizing the difference.' },
  { title: 'Done is better\nthan perfect', tag: 'On shipping', subtitle: 'Creative work is never finished, only abandoned', excerpt: 'Perfectionism is often fear with a thesaurus. Done is the only thing the world ever sees.' },
  { title: 'Consistency\ncreates connection', tag: 'On systems', subtitle: 'A shared language makes design speak more clearly', excerpt: "A system isn't a cage — it's a vocabulary." },
  { title: 'An uncomfortable hug?', tag: 'On change', subtitle: 'Embracing AI requires faith in change', excerpt: "The hug is uncomfortable. It's still a hug." },
];

/*
// Deterministic placeholder image generator, ported directly from
// grid-mockup.html's placeholderSrc() — no longer used now that real
// photography is in, kept only for reference.
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

interface ThinkGridProps {
  onCardClick: (index: number) => void;
  registerCardRef: (index: number, el: HTMLDivElement | null) => void;
  registerHoleFillRef: (index: number, el: HTMLDivElement | null) => void;
  hiddenIndex: number; // -1 when nothing is open
  locked: boolean;      // true while a card is opening/open/closing — suppresses hover
}

export default function ThinkGrid({
  onCardClick,
  registerCardRef,
  registerHoleFillRef,
  hiddenIndex,
  locked,
}: ThinkGridProps) {
  const col = useColumn();
  const nativeToVw = col.vw / NATIVE_W;
  const gridHeightVw = ACTIVE_LAYOUT.totalHeight * nativeToVw;
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
        .think-hole-fill {
          position: absolute;
          inset: 0;
          background: #1a1a1a;
          opacity: 0;
          pointer-events: none;
        }
        .think-card .think-overlay {
          position: absolute;
          inset: 0;
          background: rgba(13,13,13,0);
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
        /* While a card is opening/open/closing, suppress hover on every
           card — matches grid-mockup.html's #grid.locked rules. */
        .think-grid.locked .think-card:hover .think-overlay { background: rgba(13,13,13,0); }
        .think-grid.locked .think-card:hover .think-title { opacity: 0; transform: translateY(8px); }
        .think-grid.locked .think-card:hover img { transform: none; }
      `}</style>
      <div
        className={locked ? 'think-grid locked' : 'think-grid'}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: ACTIVE_LAYOUT.rows,
          gridTemplateAreas: ACTIVE_LAYOUT.areas.map((row) => `"${row}"`).join(' '),
          height: `${gridHeightVw}vw`,
          gap: `${CONFIG.GAP}px`,
        }}
      >
        {CARD_LETTERS.split('').map((letter, i) => (
          <div
            key={letter}
            className="think-card"
            style={{ gridArea: letter }}
            ref={(el) => registerCardRef(i, el)}
            onClick={() => onCardClick(i)}
          >
            <img
              src={imageSrc(i)}
              alt=""
              style={i === hiddenIndex ? { opacity: 0 } : undefined}
            />
            <div className="think-hole-fill" ref={(el) => registerHoleFillRef(i, el)} />
            <div
              className="think-overlay"
              style={i === hiddenIndex ? { opacity: 0 } : undefined}
            >
              <div className="think-title">{CARD_DATA[i % CARD_DATA.length].title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}