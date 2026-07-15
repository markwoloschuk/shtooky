import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  try {
    const { file } = await params
    const safe = file.replace(/[^a-z0-9]/gi, '')
    const filePath = join(process.cwd(), 'app', 'data', `${safe}.md`)
    const content = readFileSync(filePath, 'utf8')
    return new NextResponse(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
