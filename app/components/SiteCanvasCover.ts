// SiteCanvasCover.ts — shtooky.com
//
// ONE cover-fit function, shared by both canvas bands. WorkCarousel.drawImage
// and ThinkGridCanvas.drawImageCover were the same algorithm written twice:
// scale the image by max(box.w/iw, box.h/ih) so it covers the box, then centre
// it. Same maths, two files, and only one of them had ever grown per-item crop
// offsets — which is how THINK_OFFSETS came to exist, be imported, and never
// be called.
//
// WHAT THIS FUNCTION DOES NOT DO, on purpose:
//   • clipping — Work clips a moving vertical slice of the carousel, Think
//     clips the cell or the band. Genuinely different, so it stays in the
//     callers rather than becoming a parameter that means two things.
//   • the missing-image fallback — different fill colours per page, and the
//     caller already has the `img.complete` test it needs.
//
// COORDINATE SPACE: every number here — box, offsets, the result — is in
// whatever space the CONTEXT is already in. Work draws into a 1440-wide native
// canvas; Think's grid does too, but Think's BAND canvas is in real screen
// pixels. So a per-item offset authored once in native units has to be
// converted by the band call site before it arrives here. This function has no
// idea which space it is in and must not acquire one.

export interface CoverBox {
  x: number
  y: number
  w: number
  h: number
}

export interface CoverOptions {
  /**
   * Horizontal centre to draw around. Defaults to the box's own centre.
   * Work needs this: its carousel content slides horizontally while the fit
   * box stays the full band width, so the centre is not the box's centre.
   */
  centerX?: number
  /** Per-item crop nudge, in the context's units. */
  offsetX?: number
  offsetY?: number
  /** Per-item zoom, percent. 100 = plain cover fit. */
  scalePct?: number
  /**
   * Where the image sits vertically inside the box when it is taller than the
   * box: 0 = top edge, 0.5 = centred (what both pages do today), 1 = bottom.
   *
   * This exists for the narrow band (spec §4/§5). Shrinking the band with a
   * centred anchor tightens the crop equally from top and bottom around the
   * image's midpoint — which is NOT the frame that was approved. That frame was
   * previewed by scrolling, which crops only the TOP, so what looked right was
   * the lower part of each image. Bottom-anchoring reproduces it with no new
   * per-case numbers, and puts the image on the same edge the headline already
   * hangs from.
   */
  anchorY?: number
}

export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: CoverBox,
  { centerX, offsetX = 0, offsetY = 0, scalePct = 100, anchorY = 0.5 }: CoverOptions = {},
) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return

  const scale = Math.max(box.w / iw, box.h / ih) * (scalePct / 100)
  const dw = iw * scale
  const dh = ih * scale

  const cx = centerX ?? box.x + box.w / 2
  const x = cx - dw / 2 + offsetX
  const y = box.y + (box.h - dh) * anchorY + offsetY

  ctx.drawImage(img, x, y, dw, dh)
}
