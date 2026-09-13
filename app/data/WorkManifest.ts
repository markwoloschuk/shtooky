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
    contentFile: 'WorkCase01', image: '/images/work/02_carousel_01.jpg',
    offsetH: 0, offsetV: 140,
    headline: '12 products.\n1 Holiday hook.',
  },
  {
    contentFile: 'WorkCase02', image: '/images/work/02_carousel_02.jpg',
    offsetH: -259, offsetV: -4,
    headline: 'Time was short so we\nthrew out our best idea.',
  },
  {
    contentFile: 'WorkCase03', image: '/images/work/02_carousel_03.jpg',
    offsetH: 206, offsetV: -21,
    headline: '360° of vibes',
  },
  {
    contentFile: 'WorkCase04', image: '/images/work/02_carousel_04b.jpg',
    offsetH: -43, offsetV: 114,
    headline: 'Punching a signal\nthrough the noise.',
  },
  {
    contentFile: 'WorkCase05', image: '/images/work/02_carousel_05.jpg',
    offsetH: 0, offsetV: 0,
    // alt: 'Designing my escape from\nplanning department jail.'
    headline: 'Designing my escape\nfrom city planning jail.',
  },
  {
    contentFile: 'WorkCase06', image: '/images/work/02_carousel_06.jpg',
    offsetH: 0, offsetV: 0,
    headline: 'Hiding a secret\nin plain sight',
  },
  {
    contentFile: 'WorkCase07', image: '/images/work/02_carousel_07.jpg',
    offsetH: 0, offsetV: 0,
    headline: 'It was a beautiful day,\nit was beautiful data.',
  },
] as const

// The carousel view.
//
// WORK_MANIFEST above is the LIBRARY: every case that exists. WORK_CAROUSEL is
// what /work actually draws - an ordered list of ids naming which of them
// appear, and in what sequence.
//
// To reorder: move a string. To shorten: delete one. To swap a case out for a
// different one: change the string. The carousel re-proportions itself to
// whatever length this array is; nothing else has to move.
//
// `contentFile` IS the id. There is deliberately no separate number, so a case
// can never be renumbered out from under a view. WorkCaseId is derived from the
// library, so a typo below is a compile error, not a blank slice.
export type WorkCaseId = (typeof WORK_MANIFEST)[number]['contentFile']

export const WORK_CAROUSEL: WorkCaseId[] = [
  'WorkCase01',
  'WorkCase02',
  'WorkCase03',
  'WorkCase04',
  'WorkCase05',
  'WorkCase06',
  'WorkCase07',
]

// The resolved view: WORK_CAROUSEL's ids, in order, as full manifest entries.
// Everything that draws or opens a card reads THIS, never WORK_MANIFEST - the
// library and the view stop being the same list the moment the library grows.
export const WORK_CARDS = WORK_CAROUSEL.map((id) => {
  const entry = WORK_MANIFEST.find((e) => e.contentFile === id)
  if (!entry) throw new Error('WORK_CAROUSEL references unknown id: ' + id)
  return entry
})

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
