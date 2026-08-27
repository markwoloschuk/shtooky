// app/api/contact/route.ts
//
// Receives the Let's Talk contact form (ContactForm in TalkOptions.tsx)
// and relays it to Mark's inbox via Resend.
//
// NO TYPE ROLES — this file renders nothing.
//
// ── Why the addresses look the way they do ──────────────────────────────
// FROM must be on a domain verified in Resend. That domain is
// `send.shtooky.com` — a SUBDOMAIN, deliberately, so that Resend's SPF and
// DKIM records live on names of their own and the root `shtooky.com` SPF
// (which routes real mail through Rackspace) is never touched.
//
// Nobody except Mark ever sees FROM: this mail only goes to his own inbox.
// The visitor's address goes in `replyTo`, so hitting reply in a mail
// client answers the person, not the robot.
//
// FROM is also the reliable thing to filter on — it is set by us on every
// message, unlike the subject, which contains visitor-supplied text.
// ────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const FROM = 'Shtooky Contact Form <noreply@send.shtooky.com>'
const TO = 'mark@shtooky.com'
const SUBJECT_PREFIX = '[shtooky.com]'

// Length caps. These are not about Mark's reading comfort — they are the
// cheapest possible brake on someone POSTing a megabyte of text straight
// into an email send. Generous enough that no real message hits them.
const LIMITS = {
  name: 200,
  email: 320,      // the actual RFC maximum for an email address
  subject: 300,
  message: 10000,
}

// No human opens the Contact panel, reads four labels and types a real
// message in under this. A script POSTs in tens of milliseconds.
const MIN_ELAPSED_MS = 3000

type Payload = {
  name?: unknown
  email?: unknown
  subject?: unknown
  message?: unknown
  website?: unknown    // honeypot — must arrive empty
  elapsedMs?: unknown  // ms between the form mounting and the POST
}

// Deliberately loose. Real email validation is impossible with a regex, and
// a strict pattern's failure mode is rejecting somebody's legitimate
// address — which on a portfolio contact form means losing the exact
// message you built the form to receive. The real check is that a human
// typed something shaped like an address; anything past that is theatre.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > max) return null
  return trimmed
}

export async function POST(req: NextRequest) {
  // Read the key at request time, not module scope. At module scope a
  // missing key would blow up when the route file is first imported,
  // which reads as a mysterious 500 with no useful log line.
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set in this environment')
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  let body: Payload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // ── Spam gate ─────────────────────────────────────────────────────────
  // Both checks return 200 { ok: true } rather than an error. A bot that
  // gets a 4xx retries with variations; a bot told it succeeded marks the
  // job done and leaves. Nothing is sent either way.
  //
  // 1. Honeypot. `website` is rendered off-screen, unlabelled and
  //    untabbable, so no human ever fills it. Scripts fill every field
  //    they find.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    console.warn('[contact] honeypot tripped — dropped')
    return NextResponse.json({ ok: true })
  }

  // 2. Elapsed time. Measured on the CLIENT as (now − mount) and sent as a
  //    DURATION, not as a timestamp compared against the server's clock —
  //    so a visitor whose system clock is wrong is unaffected.
  //
  //    Absent or non-numeric is allowed through DELIBERATELY. It is
  //    client-supplied and trivially omitted, so treating a missing value
  //    as guilt would only ever catch the honest edge cases (a stale
  //    cached bundle after a deploy) while a bot just leaves the field
  //    out. The honeypot is the check carrying the weight here.
  if (typeof body.elapsedMs === 'number' && body.elapsedMs < MIN_ELAPSED_MS) {
    console.warn('[contact] submitted in', body.elapsedMs, 'ms — dropped')
    return NextResponse.json({ ok: true })
  }

  const name = clean(body.name, LIMITS.name)
  const email = clean(body.email, LIMITS.email)
  const subject = clean(body.subject, LIMITS.subject)
  const message = clean(body.message, LIMITS.message)

  if (!name || !email || !subject || !message || !EMAIL_SHAPE.test(email)) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  const resend = new Resend(apiKey)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `${SUBJECT_PREFIX} ${subject}`,
      text: [
        `From:    ${name} <${email}>`,
        `Subject: ${subject}`,
        '',
        '───────────────────────────────────────',
        '',
        message,
        '',
        '───────────────────────────────────────',
        'Sent from the contact form on shtooky.com',
      ].join('\n'),
    })

    // The Resend SDK reports failures by RETURNING an error object rather
    // than throwing, so a bare try/catch would let a failed send fall
    // through as a success and the visitor would be told their message
    // arrived when it hadn't.
    if (error) {
      console.error('[contact] Resend rejected the send:', error)
      return NextResponse.json({ error: 'Could not send' }, { status: 502 })
    }

    console.log('[contact] sent', data?.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] Unexpected failure:', err)
    return NextResponse.json({ error: 'Could not send' }, { status: 500 })
  }
}
