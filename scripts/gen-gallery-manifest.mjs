// Generates app/data/GalleryManifest.ts from the contents of public/images.
//
// WHY THIS EXISTS. SiteGallery used to fetch its own file list from
// /api/gallery/<path> on mount and return null until that resolved, so a card
// with a gallery contributed ZERO HEIGHT to the document until a second network
// round trip completed. Opening such a card meant: fetch the markdown, parse it,
// mount the gallery, fetch the file list, and only THEN did the page reach its
// real height - which is why the page could not be scrolled for ~2s after open.
// The list is a directory listing that cannot change between deploys, so it has
// no business being a runtime fetch.
//
// The sort MUST match sortGalleryFiles() in app/api/gallery/[...path]/route.ts
// or galleries silently reorder depending on which path served them. The route
// stays as the fallback for any folder added without regenerating.
import { readdirSync, writeFileSync, mkdirSync } from 'fs'
import { join, relative, sep } from 'path'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const ROOT = join(process.cwd(), 'public', 'images')
const OUT = join(process.cwd(), 'app', 'data', 'GalleryManifest.ts')

function sortGalleryFiles(files) {
  const numbered = []
  const unnumbered = []
  for (const name of files) {
    const match = name.match(/^(\d+)[-_]?/)
    if (match) numbered.push({ n: parseInt(match[1], 10), name })
    else unnumbered.push(name)
  }
  numbered.sort((a, b) => a.n - b.n)
  unnumbered.sort((a, b) => a.localeCompare(b))
  return [...numbered.map(f => f.name), ...unnumbered]
}

const manifest = {}
let dirCount = 0
let fileCount = 0

function walk(dir) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  const files = entries
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(n => IMAGE_EXTENSIONS.has(n.slice(n.lastIndexOf('.')).toLowerCase()))
  if (files.length) {
    const rel = relative(ROOT, dir).split(sep).filter(Boolean)
    manifest['/images' + (rel.length ? '/' + rel.join('/') : '')] = sortGalleryFiles(files)
    dirCount++
    fileCount += files.length
  }
  for (const e of entries) if (e.isDirectory()) walk(join(dir, e.name))
}

walk(ROOT)

const keys = Object.keys(manifest).sort()
const body = keys.map(k =>
  '    ' + JSON.stringify(k) + ': [\n' +
  manifest[k].map(f => '        ' + JSON.stringify(f) + ',').join('\n') +
  '\n    ],'
).join('\n')

const out = `// GENERATED FILE - do not edit by hand.
// Regenerate with: npm run gen:gallery   (also runs automatically on dev/build)
// Source: public/images, via scripts/gen-gallery-manifest.mjs
//
// Baked so SiteGallery can render its grid on the FIRST paint instead of after a
// second network round trip. See the script header for the full reasoning.

export const GALLERY_MANIFEST: Record<string, string[]> = {
${body}
}

export default GALLERY_MANIFEST
`

mkdirSync(join(process.cwd(), 'app', 'data'), { recursive: true })
writeFileSync(OUT, out, 'utf8')
console.log(`gallery manifest: ${dirCount} folders, ${fileCount} images -> app/data/GalleryManifest.ts`)
