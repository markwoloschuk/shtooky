'use client'

// Shared machinery for the two case panels (WorkCaseStudyPanel, ThinkCasePanel).
//
// Those two files are the same machine built twice: fetch a markdown file,
// parse it, hold the parsed result, fade the blocks in one after another, and
// — as of the band-model spec §7 — fade OUT on a step, wait for the new file,
// scroll to the top, and fade back in. Only the last mile differs (Think draws
// a subtitle row and [img] blocks; Work draws the jobbox and carries its own
// top padding), so the last mile stays in the panels and everything else lives
// here, once.
//
// What deliberately does NOT live here: FADE_DUR. Work is 2000, Think is 1000.
// Those are tuned by eye and they are not the same number by accident, so the
// caller passes it in rather than the extraction quietly picking a winner.

import { useEffect, useRef, useState } from 'react'

interface Options<T> {
  /** Content file to show. null means "nothing open" — clears immediately. */
  file: string | null
  /** Whether the panel is on screen. Drives the fade in / reset. */
  visible: boolean
  /** Builds the fetch URL for a file, e.g. f => `/api/case/${f}`. */
  endpoint: (file: string) => string
  /** Raw markdown → whatever shape the panel renders. */
  parse: (raw: string) => T
  /**
   * How many independently-fading slots this parsed result needs. Work uses one
   * per block; Think uses blocks + 1 because its subtitle row fades too. The
   * panel owns that arithmetic because the panel owns the JSX it describes.
   */
  slots: (parsed: T) => number
  /** How long each block takes to fade IN, ms. The CSS transition duration. */
  fadeDurMs: number
  /**
   * How long the outgoing card takes to fade OUT on a step, ms — and therefore
   * how long a step waits before the new card can appear. SEPARATE from
   * fadeDurMs on purpose: one number was doing both jobs, so slowing the
   * fade-in also made you sit through that same delay after every press.
   * The two are not the same gesture and should not share a number.
   */
  fadeOutMs: number
  /** Stagger between successive slots on an OPEN, ms. Block i waits i × this. */
  fadeOffsetMs: number
  /**
   * The two timings for a STEP (prev/next), which is a different gesture from
   * opening a card and does not share its numbers. Opening is a reveal: blocks
   * arrive one after another, unhurried, because the reader has just got here.
   * Stepping is a replacement: the reader is already reading and wants the next
   * case, so the whole block stack comes in together — stepFadeOffsetMs is
   * normally 0 — and faster.
   */
  stepFadeInMs: number
  stepFadeOffsetMs: number
  /**
   * Lead-in before the OPEN reveal starts, ms. Applies to an open only, never
   * to a step. It exists because the panel's fade and the page's own open
   * animation are two sequences that know nothing about each other: on Think
   * the card expands into the band over ThinkGridCanvas's TRANSITION_DURATION,
   * and without a lead-in the body copy is already arriving while the card is
   * still travelling.
   *
   * This is a DURATION standing in for an EVENT. The honest version waits for
   * the open animation to report that it landed; neither page exposes that
   * moment yet, so until one does this number has to be kept in agreement with
   * the animation it is hiding behind BY HAND.
   */
  openDelayMs?: number
  /**
   * Where to scroll to when the new content is swapped in, in document px.
   * Defaults to the top of the page. Once the band is fixed rather than in
   * flow (spec §6) the top of the page IS the top of the content, and this
   * becomes redundant — it exists so the panels can differ in the meantime.
   */
  scrollTargetY?: () => number
}

export function useCasePanel<T>({
  file, visible, endpoint, parse, slots, fadeDurMs, fadeOutMs, fadeOffsetMs,
  stepFadeInMs, stepFadeOffsetMs, openDelayMs = 0, scrollTargetY,
}: Options<T>) {
  const [parsed, setParsed] = useState<T | null>(null)
  const [blockOps, setBlockOps] = useState<number[]>([])

  // Which duration the blocks' CSS transition should currently use. The
  // fade-out has to run at the SAME length as the gate below, or the outgoing
  // text is only part-faded when the swap happens and visibly pops.
  const [fadeMs, setFadeMs] = useState(fadeDurMs)

  // How the content currently on screen ARRIVED. An open staggers; a step does
  // not. Set at swap time from whether anything was on screen to replace.
  const [arrival, setArrival] = useState<'open' | 'step'>('open')

  // Parsed results, keyed by filename. Seven Work cases and thirteen Think
  // cards, all small — after the first visit the fetch leaves the timing path
  // entirely and a step is gated only on the fade.
  const cacheRef = useRef<Map<string, T>>(new Map())

  // Whether anything is currently on screen to fade OUT. A ref rather than
  // reading `parsed`, because this is consulted inside the [file] effect and
  // adding `parsed` to that effect's deps would re-run it on every swap.
  const hasContentRef = useRef(false)

  // Monotonic id for the in-flight transition. Every async continuation checks
  // it before touching state, so a fast double-press can never let an earlier
  // step land after a later one.
  const runRef = useRef(0)

  useEffect(() => {
    const run = ++runRef.current

    if (!file) {
      hasContentRef.current = false
      setParsed(null); setBlockOps([])
      return
    }

    // Fade the outgoing content out and fetch the incoming one AT THE SAME
    // TIME, then wait for whichever finishes last.
    //
    // The alternative — setTimeout(fadeDur) and hope the fetch beat it — is a
    // number wired to something that does not deliver it. Gating on both gives
    // exactly fadeDur on a fast connection and degrades to a longer hold on a
    // slow one, rather than a flash of nothing.
    const hadContent = hasContentRef.current
    if (hadContent) {
      setFadeMs(fadeOutMs)
      setBlockOps(prev => new Array(prev.length).fill(0))
    }

    const cached = cacheRef.current.get(file)
    const content: Promise<T> = cached
      ? Promise.resolve(cached)
      : fetch(endpoint(file))
          .then(r => r.text())
          .then(raw => {
            const p = parse(raw)
            cacheRef.current.set(file, p)
            return p
          })

    const faded = hadContent
      ? new Promise<void>(res => setTimeout(res, fadeOutMs))
      : Promise.resolve()

    let cancelled = false
    Promise.all([content, faded]).then(([p]) => {
      if (cancelled || runRef.current !== run) return

      // The cut happens at opacity zero, so instant-vs-smooth is not a
      // question — there is nothing on screen to watch during the move. A
      // smooth scroll would also drag the viewport through the scroll-fade and
      // reveal-trigger geometry on the way past, firing reveals in content
      // that is about to be replaced.
      window.scrollTo(0, scrollTargetY ? scrollTargetY() : 0)

      hasContentRef.current = true
      setArrival(hadContent ? 'step' : 'open')
      setFadeMs(hadContent ? stepFadeInMs : fadeDurMs)
      setParsed(p)
      setBlockOps(new Array(slots(p)).fill(0))
    })

    return () => { cancelled = true }
    // endpoint/parse/slots/scrollTargetY are stable per panel by construction;
    // including them would re-run this on every render and restart the step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, fadeDurMs, fadeOutMs, stepFadeInMs])

  // Successive fade-in, once content exists and the panel is visible.
  //
  // The double requestAnimationFrame is load-bearing, not superstition. A CSS
  // transition only animates if the browser has PAINTED the starting value
  // first. Slot 0's timer fires at 0 * fadeOffsetMs = 0ms, so without this its
  // 0 → 1 change could land in the same commit as the block being mounted at
  // opacity 0 — nothing to interpolate from, so it snaps to full instead of
  // fading. That is why the job box, which is always block 0, faded correctly
  // on some cards and appeared instantly on others: a card fetched from the
  // network resolves in its own task, while one served from the cache above
  // resolves in a microtask and batches with the mount. Same code, two
  // timings, decided by whether that card had been visited before.
  //
  // Two frames: the first lets the mount commit, the second guarantees it has
  // been painted. Then the staggered timers start against a real zero state.
  useEffect(() => {
    if (!visible || !parsed) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const total = slots(parsed)
        const offset = arrival === 'step' ? stepFadeOffsetMs : fadeOffsetMs
        const lead = arrival === 'step' ? 0 : openDelayMs
        for (let i = 0; i < total; i++) {
          timers.push(setTimeout(() => {
            setBlockOps(prev => { const n = [...prev]; n[i] = 1; return n })
          }, lead + i * offset))
        }
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
      timers.forEach(t => clearTimeout(t))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, parsed, fadeOffsetMs, stepFadeOffsetMs, openDelayMs, arrival])

  // Reset opacities when hidden.
  useEffect(() => {
    if (!visible) setBlockOps(prev => new Array(prev.length).fill(0))
  }, [visible])

  return { parsed, blockOps, fadeMs }
}
