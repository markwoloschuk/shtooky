import { NextRequest, NextResponse } from 'next/server'
import { readdirSync } from 'fs'
import { join } from 'path'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

// Sorts numbered-prefix files first, in numeric order (01-hero.jpg, 2_shot.png, 10-final.jpg),
// then remaining (non-numbered) files alphabetically after them.
// Matches an optional leading number followed by '-', '_', or nothing before the rest of the name.
function sortGalleryFiles(files: string[]): string[] {
  const numbered: { n: number; name: string }[] = []
  const unnumbered: string[] = []

  for (const name of files) {
    const match = name.match(/^(\d+)[-_]?/)
    if (match) {
      numbered.push({ n: parseInt(match[1], 10), name })
    } else {
      unnumbered.push(name)
    }
  }

  numbered.sort((a, b) => a.n - b.n)
  unnumbered.sort((a, b) => a.localeCompare(b))

  return [...numbered.map(f => f.name), ...unnumbered]
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params

    // Sanitize each path segment individually — alphanumeric, hyphen, underscore only.
    // Blocks '..' traversal and any other unexpected characters; a segment that sanitizes
    // to empty (e.g. was entirely '..') is dropped rather than silently collapsing the path.
    const safeSegments = path
      .map(seg => seg.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean)

    const folderPath = join(process.cwd(), 'public', ...safeSegments)
    const entries = readdirSync(folderPath, { withFileTypes: true })

    const files = entries
      .filter(e => e.isFile())
      .map(e => e.name)
      .filter(name => IMAGE_EXTENSIONS.has(name.slice(name.lastIndexOf('.')).toLowerCase()))

    const sorted = sortGalleryFiles(files)

    return NextResponse.json({ images: sorted })
  } catch {
    return NextResponse.json({ images: [] }, { status: 404 })
  }
}