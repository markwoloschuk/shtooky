// Per-slot carousel data.
//
// `headline` is the two-line display line painted on the carousel canvas
// (WorkCarousel.tsx → drawHL). It lives here rather than in the WorkCase##.md
// files because the canvas needs it synchronously on the first frame, while
// the .md bodies are fetched lazily per-case when a panel opens.
// `\n` is the line break; the break is a deliberate rhetorical choice, so it
// is authored, not wrapped.
export const WORK_MANIFEST = [
  {
    slot: 1, contentFile: 'WorkCase01', image: '/images/work/02_carousel_01.jpg',
    offsetH: 0, offsetV: 140,
    headline: '12 products.\n1 Holiday hook.',
  },
  {
    slot: 2, contentFile: 'WorkCase02', image: '/images/work/02_carousel_02.jpg',
    offsetH: -259, offsetV: -4,
    headline: 'Time was short so we\nthrew out our best idea.',
  },
  {
    slot: 3, contentFile: 'WorkCase03', image: '/images/work/02_carousel_03.jpg',
    offsetH: 206, offsetV: -21,
    headline: '360° of vibes',
  },
  {
    slot: 4, contentFile: 'WorkCase04', image: '/images/work/02_carousel_04b.jpg',
    offsetH: -43, offsetV: 114,
    headline: 'Punching a signal\nthrough the noise.',
  },
  {
    slot: 5, contentFile: 'WorkCase05', image: '/images/work/02_carousel_05.jpg',
    offsetH: 0, offsetV: 0,
    // alt: 'Designing my escape from\nplanning department jail.'
    headline: 'Designing my escape\nfrom city planning jail.',
  },
  {
    slot: 6, contentFile: 'WorkCase06', image: '/images/work/02_carousel_06.jpg',
    offsetH: 0, offsetV: 0,
    headline: 'Hiding a secret\nin plain sight',
  },
  {
    slot: 7, contentFile: 'WorkCase07', image: '/images/work/02_carousel_07.jpg',
    offsetH: 0, offsetV: 0,
    headline: 'It was a beautiful day,\nit was beautiful data.',
  },
]

// ── Job box ──────────────────────────────────────────────────────────────────
// Field ORDER and LABELS for the case-panel job box. The .md files supply the
// values as `key: value` lines inside their [jobbox] block; this array decides
// what order they appear in and what the pink label above each one reads.
//
// The grid fills COLUMN-major, so this list reads down the left column first,
// then down the right:
//   TITLE     ROLE
//   CLIENT    DELIVERY
// Reorder this array to reorder the box. A key present in a .md but missing
// here simply won't render — this list is the whitelist.
export const JOB_FIELDS: { label: string; key: string }[] = [
  { label: 'Title',    key: 'title'    },
  { label: 'Client',   key: 'client'   },
  { label: 'Role',     key: 'role'     },
  { label: 'Delivery', key: 'delivery' },
]
