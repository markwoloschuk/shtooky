# Frame-trace instrumentation, removed 2026-09-13

Temporary per-frame tracing built to chase the How I Think card open/close
shimmy. Removed before pushing rather than left behind a flag, because it
adds a hot-path push to the draw call. Kept here so it can be rebuilt
without re-deriving it.

## What it measured

Buffered one sample per DRAW (not per frame - the band was being painted
twice per frame during an open, which is itself how that bug was found) and
dumped a table at the end of each gesture. Buffered rather than logged live
because console.log inside a rAF loop lengthens the very frames it reports.

## Findings it produced, so they are not lost with the code

- Frame times cluster at 16.7 / 33.3 / 50.0 ms - exactly 1, 2 and 3 vsync
  intervals. The page is not rendering slowly, it is DROPPING WHOLE FRAMES.
- maxDy tracks vertical TRAVEL almost linearly (~travel x 0.13). It is the
  bento ROW that predicts it, not the column: the two top corners were the
  smoothest cards measured and two centre cards were worse.
- Over half of every gesture is sub-pixel motion nobody can see. The
  completion test is |p - target| < 0.006 on RAW progress, and easeIO near
  its ends has almost no slope, so both open and close crawl for dozens of
  frames after the movement has visually finished. BAND_OPEN_LANDED_AT only
  truncates the CONTENT REVEAL, not the motion.
- Removing the double paint did NOT improve average frame time, but did move
  the fast head of an open from ~13% to ~67% of frames at 60Hz.

## Known blind spot in the FIRST version

It logged only y and h. That is the wrong axis for the top-left card, whose
vertical travel is the smallest of any cell while its right edge travels
~724px and its width grows ~897px. It was graded smoothest on the axis it
barely moves on. The version below logs x, y, w, h and a `move` column (the
largest absolute change across all four) - use that one.

## Still unresolved when this was removed

- Mark reports the top-left card looks WORSE after the double-paint fix.
  Its vertical numbers were unchanged (49.2 -> 49.5), so if real it is
  horizontal, and the x/w columns were never actually run.
- The bandFalloffMask theory is UNTESTED: that mask's gradient stops both
  clamp to 0px at exactly 1440, so it is inert at the width every trace was
  captured at. Above 1440 it has ~145px live ramps per side at 1730.
- The cover-fit crossover: scale = max(w/iw, h/ih) flips governing term when
  box aspect crosses the image's 1.78, which every card does, between ep
  0.09 and 0.29. Nothing measured so far can see it.

## The code

```tsx
interface FrameSample { m: string; dt: number; p: number; x: number; y: number; w: number; h: number }

/** Dump one gesture's frames as a table. Deltas are computed here rather than
 *  stored, so the hot path only pushes a few numbers.
 *
 *  Logs ALL FOUR rect components. The first version logged only y and h, which
 *  made it blind to horizontal motion - and for the top-left card that is the
 *  DOMINANT motion: it has the smallest vertical travel of any cell (so it
 *  scored as the smoothest) while its right edge travels ~724px and its width
 *  grows ~897px. Grading that card on dy measured the axis it barely moves on.
 *  `move` is the largest absolute change across all four, which is what the eye
 *  actually sees, and is what the sub-pixel count is now based on. */
function dumpFrameLog(tag: string, rows: FrameSample[]) {
  if (!rows.length) return;
  const n = rows.length;
  let out = `\n--- ${tag} - ${n} draws ---\n`;
  out += 'draw  m      dt      p       dp      dx      dy      dw      dh    move\n';
  let pp = rows[0].p, px = rows[0].x, py = rows[0].y, pw = rows[0].w, ph = rows[0].h;
  const moves: number[] = [];
  rows.forEach((r, i) => {
    const dx = r.x - px, dy = r.y - py, dw = r.w - pw, dh = r.h - ph;
    const move = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dw), Math.abs(dh));
    if (i > 0) moves.push(move);
    out += String(i).padStart(4) + '  ' + r.m + '  '
      + r.dt.toFixed(1).padStart(5) + '  '
      + r.p.toFixed(3) + '  ' + (r.p - pp >= 0 ? '+' : '') + (r.p - pp).toFixed(3) + '  '
      + dx.toFixed(1).padStart(6) + '  ' + dy.toFixed(1).padStart(6) + '  '
      + dw.toFixed(1).padStart(6) + '  ' + dh.toFixed(1).padStart(6) + '  '
      + move.toFixed(1).padStart(6) + '\n';
    pp = r.p; px = r.x; py = r.y; pw = r.w; ph = r.h;
  });
  const dts = rows.map(r => r.dt);
  const avg = dts.reduce((a, b) => a + b, 0) / n;
  const fast = dts.filter(d => d < 20).length;
  const sub = moves.filter(d => d < 1).length;
  out += `avg dt ${avg.toFixed(1)}ms (~${(1000 / avg).toFixed(0)}fps)  at60Hz ${fast}/${n}  worst ${Math.max(...dts).toFixed(1)}ms\n`;
  out += `draws where NOTHING moved 1px: ${sub}/${moves.length}  <- the invisible tail\n`;
  console.log(out);
}

  // Richer per-DRAW buffer for the console dump. Separate from traceRef, which
  // feeds the on-screen HUD and is capped at 40 to fit the panel. Buffered and
  // dumped once at the end of the gesture rather than logged per frame:
  // console.log inside a rAF loop is expensive enough to lengthen the very
  // frames being measured, which would corrupt the dt column it exists to show.
  const frameLogRef = useRef<FrameSample[]>([]);
  const dtRef = useRef(0);

    dtRef.current = dt;

    if (DEBUG.thinkBandTrace && frameLogRef.current.length < 400) {
      frameLogRef.current.push({
        m: mode.current[0], dt: dtRef.current,
        p: openProg.current, x: cur.x, y: cur.y, w: cur.w, h: cur.h,
      });
    }

            if (DEBUG.thinkBandTrace) { dumpFrameLog('OPEN', frameLogRef.current); frameLogRef.current = []; }

            if (DEBUG.thinkBandTrace) { dumpFrameLog('CLOSE', frameLogRef.current); frameLogRef.current = []; }
```
