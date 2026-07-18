import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { THINK_GRID, contentFileFor } from '../../../data/ThinkManifest'

interface TitleFields {
  title: string
  narrowtitle: string
}

// Minimal frontmatter read — only pulls the two fields the grid needs.
// Not a general parser; matches the `key: value` frontmatter shape used
// throughout (see parseFrontmatter() in ThinkCasePanel.tsx).
function parseTitleFields(raw: string): TitleFields {
  const result: TitleFields = { title: '', narrowtitle: '' }
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (!match) return result
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    if (m[1] === 'title') result.title = m[2].trim()
    if (m[1] === 'narrowtitle') result.narrowtitle = m[2].trim()
  }
  return result
}

export async function GET() {
  const manifest: Record<number, TitleFields> = {}

  // Read every card number THINK_GRID actually references — not a hardcoded
  // 1..13 range — so this stays correct if the grid's slot count ever changes.
  const cardNumbers = Array.from(new Set(THINK_GRID))

  for (const cardNum of cardNumbers) {
    try {
      const filePath = join(process.cwd(), 'app', 'data', `${contentFileFor(cardNum)}.md`)
      const raw = readFileSync(filePath, 'utf8')
      manifest[cardNum] = parseTitleFields(raw)
    } catch {
      // Missing/unreadable card file — omitted from the response.
      // Caller (ThinkGridCanvas) shows a blank title for that slot rather
      // than erroring, same as an unloaded cover image renders blank.
    }
  }

  return NextResponse.json(manifest)
}