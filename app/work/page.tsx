'use client'

import { useState } from 'react'
import WorkCarousel from '../components/WorkCarousel'
import CaseStudyPanel from '../components/CaseStudyPanel'
import { WORK_MANIFEST } from '../data/WorkManifest'

export default function WorkPage() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  function handleOpen(idx: number) {
    setActiveIdx(idx)
  }

  function handleClose() {
    setActiveIdx(null)
  }

  const manifest = activeIdx !== null ? WORK_MANIFEST[activeIdx] : null

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <WorkCarousel
        onOpen={handleOpen}
        onClose={handleClose}
        activeIdx={activeIdx}
      />
      <CaseStudyPanel
        caseFile={manifest?.contentFile ?? null}
        caseIdx={activeIdx}
        visible={activeIdx !== null}
      />
    </div>
  )
}
