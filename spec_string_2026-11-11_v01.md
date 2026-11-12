# St. Ring — Confession Quiz — Spec v01 (2026-11-11)

A phone-based flossing confession for Room Service (theme: string). Guests scan a QR code, confess to St. Ring, and see live results. Mark can also run it as a live interviewer from his phone.

---

## 1. Where it lives

- **Page:** `public/art/string/index.html` — one self-contained file (HTML + CSS + JS), same pattern as kehai, noodle, rs, texhibit.
- **URL:** `shtooky.com/art/string` — served by the existing `/art/:slug` rewrite. No config change.
- **Walled off** from the portfolio: no NavBar, Footer, canvas or SiteTokens. Page carries `noindex`.
- **Data:** small API routes in `app/api/string/` (next to `/api/contact`), backed by Upstash Redis via the Vercel Marketplace.

## 2. Who uses it

**Guests (QR code)**
- One confession per device. On first visit the page saves a random device ID in the browser; the server records which IDs have confessed.
- Soft enforcement: clearing the browser or private mode lets someone vote again. Accepted for a party.
- Returning guests can view results any time.

**Mark (interviewer mode)**
- `shtooky.com/art/string?key=SECRET`. The key lives in a Vercel env var (`INTERVIEWER_KEY`), checked server-side. Wrong key = normal guest experience.
- No one-per-device limit. Entries tagged “interviewed” in the log; they count in the public results.
- After each Final Confession: results, then a **Next penitent** button back to Question I (no splash). Reloading the page also starts afresh.

---

## 3. The experience

Cut for now: the pox, floss facts, the verdicts.

### Splash (first visit)
1. Blackness. A Cheshire-cat smile glows.
2. A halo fades up; St. Ring is revealed, with the caption **“St. Ring will hear your confession.”**
3. **Enter the confessional** button appears and waits.
4. Tap → Gregorian chant starts (and plays under the whole experience) → white burst emanating from a tooth glint → fade into Question I.
- The tap is required: phones block audio until the person taps.
- Timing of steps 1–3 adjustable from the tuning panel.

### Question I — checkbox list
**I. How oft dost thou ply the sacred thread?**
- Never — I am a heretic of the gum.
- Seldom — Only when the spirit or a barber moveth me.
- Monthly — Once in each lunar turn.
- Weekly — Honoring each Sabbath.
- Often — Upon divers days of the week.
- Daily — As is meet and right!
- Twice Daily — At matins and compline.

Behavior: single choice. Tap to select, tap again to clear, tap another to switch. **Confess** stays dim until one is checked. Confess → page-turn animation → Question II.

### Question II — molar slider, 1–10
**II. How doth the holy thread rest upon thy soul?**
- Left (1): Foul penance! I loathe it.
- Center (between 5 and 6): ’Tis a tolerable burden.
- Right (10): Verily, it bringeth me rapture.

Behavior:
- Modeled on the alien-quiz slider, styled medieval.
- The thumb is a **white molar**; the current number shows in the center of the tooth.
- The **track** changes color: 1 dark red → 5 red | 6 purple → 10 very light blue. The red/purple switch falls at the center.
- The tooth starts unset (off-scale or faded). **Confess** stays dim until the slider is touched — no default 5s.
- **Recant** → back to Question I (previous answer kept). **Confess** → page turn → Question III.

### Question III — checkbox list
**III. Of what generation art thou begotten?**
- Boomer — From great fecundity following the War.
- Gen X — The forgotten middle, raised by latchkeys.
- Millennial — Born in the twilight of the old millennium.
- Gen Z — Raised into the age of glowing glass.
- I say not — ’Tis a matter betwixt me and THE LORD. (THE LORD possibly in small caps)

Behavior: same single-choice rules as Question I. **Recant** → Question II. **Final Confession** → submit → Results.

### Results
- **Pie chart:** how often people floss (Question I).
- **Stacked bars:** Question I broken down by generation.
- **Stats:** number of confessions; average and median love-of-flossing score (Question II), overall and per generation.
- **The person’s own answers shown in comparison** to everyone else’s (their slice, their score against the average, etc.).
- Refreshes live every few seconds.

### Return visit (device has already confessed)
- A short splash with a single button — **“Behold the Reckoning”** — then Results.

---

## 4. Data

Per confession: device ID, Q1 answer, Q2 score (1–10), Q3 generation, interviewer flag, timestamp.
- Running tallies for fast results.
- Set of device IDs that have confessed.
- Full log of entries, for afterward.
- Submissions retry if the connection drops (hotel Wi-Fi / cell).

### API routes (`app/api/string/`)
- **status** — has this device confessed?
- **submit** — record a confession (checks interviewer key; enforces one-per-device for guests).
- **results** — tallies and stats.

## 5. Tuning panel (hidden)
Like the alien quiz’s TUNING block: splash timings (smile, halo, caption, button), burst duration, page-turn speed, results refresh rate, chant volume.

## 6. Assets
- **St. Ring image:** stand-in for now; Mark generating the real one.
- **Chant:** recommendation “Pange lingua” (“Sing, O my tongue” — Aquinas), fallback a “Kyrie eleison.” Needs a public-domain recording.
- **Type:** Fondamento (from the Type Bench) as the starting point.
- **QR code:** pointing at `shtooky.com/art/string`, illuminated-manuscript style like the earlier test.

## 7. Mark’s setup steps (~5 min)
1. Vercel → Marketplace → add Upstash Redis to the shtooky project.
2. Add env var `INTERVIEWER_KEY`.
3. `npm install @upstash/redis`.

## 8. Build order (one step at a time)
1. API routes.
2. Page with bare-bones styling, tested end to end.
3. Splash, burst, page turns, molar slider, medieval styling.
4. Results charts.
5. Chant, real St. Ring image, QR code.

## 9. Open
- Results page layout and chart styling.
- Chant recording source.
