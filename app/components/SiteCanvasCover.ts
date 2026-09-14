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
  /**
   * Per-item crop nudge, in the context's units.
   *
   * offsetY is CLAMPED so the image can never be nudged past its own cover -
   * see the note at the clamp below. offsetX is deliberately NOT clamped:
   * Work's carousel slides its content horizontally via centerX against a fit
   * box that stays the full band width, so a horizontal clamp would fight the
   * slide rather than protect it.
   */
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
  let y = box.y + (box.h - dh) * anchorY + offsetY

  // COVER GUARANTEE. An offsetY larger than the available vertical overflow
  // slides the image off its own box and exposes whatever is behind it, which
  // is a contradiction in a function called drawCover. Clamping here rather
  // than at each call site because every caller wants the same thing and none
  // of them can check it without redoing the fit maths.
  //
  // Found 2026-09-13 in Work's mobile carousel. The per-card offsetV values in
  // WorkManifest are authored in native px against the DESKTOP band (h = CH,
  // 480), where a 16:9 image overflows by ~330px and so has ~165px of slack
  // each way. Mobile multiplies the band height by MOBILE_BAND_HEIGHT_SCALE
  // (h ~792) while the image width, and therefore its drawn height, is
  // unchanged - so the overflow collapses to ~18px and the slack to ~9px. The
  // authored 140 and 114 then hung ~131px and ~105px of empty box above their
  // slices. The offsets were being obeyed exactly, into a box with no room.
  //
  // Self-gating on purpose: no tier flag, no per-breakpoint numbers, and a
  // no-op anywhere the offset already fits - which is every desktop case today.
  //
  // NOTE this makes the mobile crop CORRECT (no gap) but not the framing that
  // was authored - a clamped 140 is just 'as far down as it can go'. Expressing
  // offsetV as a fraction of available slack would preserve the intent at every
  // band height; that is a separate change and it needs the manifest values
  // re-expressed and re-judged.
  if (dh >= box.h) {
    y = Math.min(box.y, Math.max(box.y + box.h - dh, y))
  }

  ctx.drawImage(img, x, y, dw, dh)
}
