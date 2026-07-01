'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import WorkCarousel from '../components/WorkCarousel'
import CaseStudyPanel from '../components/CaseStudyPanel'
import { WORK_MANIFEST } from '../data/WorkManifest'

const NAV_BTN_SIZE = 32
const SYM_PCT = 0.50
const STROKE_W = 1

export default function WorkPage() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef<((dir: number) => void) | null>(null)
  const closeRef = useRef<(() => void) | null>(null)

  useEffect(() => { setMounted(true) }, [])

  function handleOpen(idx: number) {
    setActiveIdx(idx)
    const n = navRef.current; if (!n) return
    n.style.opacity = '1'; n.style.transform = 'scale(1)'; n.style.pointerEvents = 'auto'
  }

  function handleClose() {
    setActiveIdx(null)
    const n = navRef.current; if (!n) return
    n.style.opacity = '0'; n.style.transform = 'scale(0.85)'; n.style.pointerEvents = 'none'
  }

  const manifest = activeIdx !== null ? WORK_MANIFEST[activeIdx] : null

  return (
    <>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WorkCarousel
          onOpen={handleOpen}
          onClose={handleClose}
          activeIdx={activeIdx}
          onRegisterControls={(step, close) => {
            stepRef.current = step
            closeRef.current = close
          }}
        />
        <CaseStudyPanel
          caseFile={manifest?.contentFile ?? null}
          caseIdx={activeIdx}
          visible={activeIdx !== null}
        />
      </div>

      {/* Nav buttons — portalled to body to escape stacking context */}
      {mounted && createPortal(<div
        ref={navRef}
        style={{
          position: 'fixed', bottom: 84, right: 32,
          display: 'flex', gap: 8, zIndex: 9999,
          pointerEvents: 'none', opacity: 0,
          transform: 'scale(0.85)',
          transition: 'opacity 500ms ease, transform 500ms ease',
        }}
      >
        <button
          onClick={e => { e.stopPropagation(); stepRef.current?.(-1) }}
          style={{ width: NAV_BTN_SIZE, height: NAV_BTN_SIZE, background: '#e0057a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, pointerEvents: 'auto' }}
        >
          <svg viewBox="0 0 100 100" style={{ width: NAV_BTN_SIZE * SYM_PCT, height: NAV_BTN_SIZE * SYM_PCT, display: 'block', overflow: 'visible' }}>
            <polyline points="65,20 35,50 65,80" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={STROKE_W} vectorEffect="non-scaling-stroke" />
          </svg>
        </button>
        <button
          onClick={e => { e.stopPropagation(); closeRef.current?.() }}
          style={{ width: NAV_BTN_SIZE, height: NAV_BTN_SIZE, background: '#e0057a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, pointerEvents: 'auto' }}
        >
          <svg viewBox="0 0 100 100" style={{ width: NAV_BTN_SIZE * SYM_PCT, height: NAV_BTN_SIZE * SYM_PCT, display: 'block', overflow: 'visible' }}>
            <line x1="25" y1="25" x2="75" y2="75" stroke="#fff" strokeLinecap="round" strokeWidth={STROKE_W} vectorEffect="non-scaling-stroke" />
            <line x1="75" y1="25" x2="25" y2="75" stroke="#fff" strokeLinecap="round" strokeWidth={STROKE_W} vectorEffect="non-scaling-stroke" />
          </svg>
        </button>
        <button
          onClick={e => { e.stopPropagation(); stepRef.current?.(1) }}
          style={{ width: NAV_BTN_SIZE, height: NAV_BTN_SIZE, background: '#e0057a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, pointerEvents: 'auto' }}
        >
          <svg viewBox="0 0 100 100" style={{ width: NAV_BTN_SIZE * SYM_PCT, height: NAV_BTN_SIZE * SYM_PCT, display: 'block', overflow: 'visible' }}>
            <polyline points="35,20 65,50 35,80" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={STROKE_W} vectorEffect="non-scaling-stroke" />
          </svg>
        </button>
      </div>, document.body)}
    </>
  )
}