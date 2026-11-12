// app/api/string/route.ts
//
// Back end for the St. Ring confession quiz at /art/string
// (public/art/string/index.html). Spec: spec_string_2026-11-11_v01.md.
//
// NO TYPE ROLES — this file renders nothing.
//
// GET  /api/string?device=<id>
//      → { confessed, mine, results }
//      Called when the page opens and every few seconds on the results
//      screen. `mine` is this phone's own answers (null if it hasn't
//      confessed), used to show the person against everyone else.
//
// POST /api/string   body: { device, q1, q2, gen, key? }
//      → { ok, mine, results }   or   { ok: false, reason, ... }
//      Sent by "Final Confession".
//
// ── Two kinds of penitent ───────────────────────────────────────────────
// Guests get ONE confession per device. "Device" is a random ID the page
// keeps in the browser — soft enforcement by design: clearing the browser
// or private mode gets another vote, and that's accepted for a party.
//
// Mark, as interviewer, sends the secret from the INTERVIEWER_KEY env var
// (it rides in his bookmarked URL as ?key=…). With the right key there is
// no one-per-device limit and the entry is tagged `interviewed`. A wrong
// key is not an error — that person is simply treated as a guest.
//
// ── Why answers are stored as short codes ───────────────────────────────
// The database never sees the medieval wording — only `never`, `genx`,
// etc. The copy can be rewritten right up to the party without touching
// the data. The codes below must match the ones in the page.
//
// ── What lives in Redis (all keys start with `string:`) ─────────────────
// string:devices  hash   deviceId → JSON of that guest's answers.
//                        Doubles as the "already confessed" list.
// string:tally    hash   every running count, in one place, so a single
//                        read gets all the results:
//                          total, total:<gen>
//                          q1:<answer>, q1:<answer>:<gen>
//                          q2:<score>,  q2:<score>:<gen>
// string:log      list   one JSON line per confession, oldest first —
//                        the raw record for afterward.
//
// To wipe test data before the party: delete those three keys in the
// Upstash console (Data Browser).
// ────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// Never cache — results must be live.
export const dynamic = 'force-dynamic'

// Reads KV_REST_API_URL and KV_REST_API_TOKEN, which Vercel's Upstash
// connection provides (and .env.local mirrors for local dev).
const redis = Redis.fromEnv()

const KEY_DEVICES = 'string:devices'
const KEY_TALLY = 'string:tally'
const KEY_LOG = 'string:log'

// I. How oft dost thou ply the sacred thread?
const Q1 = ['never', 'seldom', 'monthly', 'weekly', 'often', 'daily', 'twice'] as const
// III. Of what generation art thou begotten?
const GEN = ['boomer', 'genx', 'millennial', 'genz', 'decline'] as const
// II. How doth the holy thread rest upon thy soul? — whole numbers 0–10
// (0–10 so that 5 sits dead center)
const Q2_MIN = 0
const Q2_MAX = 10

type Q1Code = (typeof Q1)[number]
type GenCode = (typeof GEN)[number]
type Answers = { q1: Q1Code; q2: number; gen: GenCode }

// Shape of a device ID the page will send (crypto.randomUUID, or similar).
// Anything else is refused so junk can't be written into the hash.
const DEVICE_SHAPE = /^[A-Za-z0-9-]{8,64}$/

const NO_STORE = { 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

function validDevice(value: unknown): value is string {
  return typeof value === 'string' && DEVICE_SHAPE.test(value)
}

function parseAnswers(body: Record<string, unknown>): Answers | null {
  const { q1, q2, gen } = body
  if (typeof q1 !== 'string' || !(Q1 as readonly string[]).includes(q1)) return null
  if (typeof gen !== 'string' || !(GEN as readonly string[]).includes(gen)) return null
  if (typeof q2 !== 'number' || !Number.isInteger(q2) || q2 < Q2_MIN || q2 > Q2_MAX) return null
  return { q1: q1 as Q1Code, q2, gen: gen as GenCode }
}

function isInterviewer(key: unknown): boolean {
  const secret = process.env.INTERVIEWER_KEY
  return Boolean(secret) && typeof key === 'string' && key === secret
}

// ── Results ─────────────────────────────────────────────────────────────

type ScoreStats = { avg: number | null; median: number | null; dist: number[] }
type Group = { total: number; q1: Record<Q1Code, number>; q2: ScoreStats }

// dist[i] = number of people who chose score i (0–10).
function scoreStats(dist: number[]): ScoreStats {
  const n = dist.reduce((a, b) => a + b, 0)
  if (n === 0) return { avg: null, median: null, dist }

  const sum = dist.reduce((acc, count, i) => acc + count * (i + Q2_MIN), 0)

  // Median from the distribution: the middle value, or the average of the
  // two middle values when the count is even.
  const valueAt = (pos: number) => {
    let seen = 0
    for (let i = 0; i < dist.length; i++) {
      seen += dist[i]
      if (pos < seen) return i + Q2_MIN
    }
    return Q2_MAX
  }
  const median = n % 2 === 1
    ? valueAt((n - 1) / 2)
    : (valueAt(n / 2 - 1) + valueAt(n / 2)) / 2

  return { avg: Math.round((sum / n) * 10) / 10, median, dist }
}

function buildGroup(tally: Record<string, number>, suffix: string): Group {
  const q1 = Object.fromEntries(
    Q1.map(code => [code, tally[`q1:${code}${suffix}`] ?? 0]),
  ) as Record<Q1Code, number>
  const dist: number[] = []
  for (let s = Q2_MIN; s <= Q2_MAX; s++) dist.push(tally[`q2:${s}${suffix}`] ?? 0)
  return { total: tally[`total${suffix}`] ?? 0, q1, q2: scoreStats(dist) }
}

async function readResults() {
  const raw = (await redis.hgetall<Record<string, number | string>>(KEY_TALLY)) ?? {}
  const tally: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw)) tally[k] = Number(v) || 0

  return {
    ...buildGroup(tally, ''),
    byGen: Object.fromEntries(GEN.map(g => [g, buildGroup(tally, `:${g}`)])) as Record<GenCode, Group>,
  }
}

// Upstash may hand back stored JSON already parsed, or as a string.
function asAnswers(stored: unknown): Answers | null {
  if (!stored) return null
  if (typeof stored === 'object') return stored as Answers
  try { return JSON.parse(String(stored)) as Answers } catch { return null }
}

// ── GET: status + results ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const device = req.nextUrl.searchParams.get('device')

  try {
    const [stored, results] = await Promise.all([
      validDevice(device) ? redis.hget(KEY_DEVICES, device) : Promise.resolve(null),
      readResults(),
    ])
    const mine = asAnswers(stored)
    return json({ confessed: Boolean(mine), mine, results })
  } catch (err) {
    console.error('[api/string] GET failed', err)
    return json({ ok: false, reason: 'server' }, 500)
  }
}

// ── POST: record a confession ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, reason: 'bad-request' }, 400)
  }

  const { device, key } = body
  if (!validDevice(device)) return json({ ok: false, reason: 'bad-device' }, 400)

  const answers = parseAnswers(body)
  if (!answers) return json({ ok: false, reason: 'bad-answers' }, 400)

  const interviewed = isInterviewer(key)

  try {
    if (!interviewed) {
      // HSETNX writes only if this device has no entry yet, and does it
      // atomically — two taps at once can't both get through.
      const claimed = await redis.hsetnx(KEY_DEVICES, device, JSON.stringify(answers))
      if (!claimed) {
        const [stored, results] = await Promise.all([
          redis.hget(KEY_DEVICES, device),
          readResults(),
        ])
        return json({ ok: false, reason: 'already-confessed', mine: asAnswers(stored), results }, 409)
      }
    }

    // All counts and the log entry in one transaction: concurrent
    // confessions can't overwrite each other's increments.
    const { q1, q2, gen } = answers
    const tx = redis.multi()
    tx.hincrby(KEY_TALLY, 'total', 1)
    tx.hincrby(KEY_TALLY, `total:${gen}`, 1)
    tx.hincrby(KEY_TALLY, `q1:${q1}`, 1)
    tx.hincrby(KEY_TALLY, `q1:${q1}:${gen}`, 1)
    tx.hincrby(KEY_TALLY, `q2:${q2}`, 1)
    tx.hincrby(KEY_TALLY, `q2:${q2}:${gen}`, 1)
    tx.rpush(KEY_LOG, JSON.stringify({
      t: new Date().toISOString(),
      device,
      q1, q2, gen,
      interviewed,
    }))
    await tx.exec()

    return json({ ok: true, interviewed, mine: answers, results: await readResults() })
  } catch (err) {
    console.error('[api/string] POST failed', err)
    return json({ ok: false, reason: 'server' }, 500)
  }
}
