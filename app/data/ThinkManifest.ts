// ThinkManifest.ts — shtooky.com
// Two arrays: THINK_GRID (slot → card number, maps directly onto the
// bento layout) and THINK_OFFSETS (sparse per-card crop nudges).
// Cover images resolve via their own zero-padded path convention,
// independent of a card file's own `imagePath` frontmatter — the grid
// needs to render covers before any card markdown has been parsed.

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Array position = grid slot (reads top-to-bottom, left-to-right,
// matching the actual bento row layout). Value = card number.
// This is the single source of truth for slot placement — file/folder
// naming does NOT control order.
export const THINK_GRID: number[] = [
  1, 2, 3,
  4, 5, 6,
  7, 8, 9, 10,
  11, 12, 13,
];

// Sparse — most cards need no entry (dead-center crop is the default).
// [xOffset, yOffset, scale] — trailing values may be omitted.
// x/y default to 0. scale defaults to 100 (NOT 0 — a 0% scale would
// collapse the image to nothing). Add entries only once real
// photography is in and a specific crop is visibly wrong.
export const THINK_OFFSETS: Record<number, [number, number, number]> = {};

export function contentFileFor(cardNum: number): string {
  return `ThinkCard${pad(cardNum)}`;
}

export function coverImageFor(cardNum: number): string {
  return `/images/think/cover-${pad(cardNum)}.jpg`;
}

export function offsetFor(cardNum: number): [number, number, number] {
  const o = THINK_OFFSETS[cardNum] ?? [];
  return [o[0] ?? 0, o[1] ?? 0, o[2] ?? 100];
}