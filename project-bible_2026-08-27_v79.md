# shtooky.com — Project Bible v79

*Supersedes v78. **The site is live.** This session was infrastructure and
polish rather than architecture: the contact form was wired end-to-end
(Resend, DNS, API route), the Let's Talk options panel got three fixes, the
Welcome logo grid was brought down to the reading measure, and a spacing token
that had quietly acquired three consumers was renamed to match what it
actually governs.*

*The finding under most of it: **v78's habit — transcription instead of import
— has a sibling. A number can also be wrong because it is attached to
something that never receives the value it depends on.** The `2.2em` on Let's
Talk and the `children` dependency in `Collapsible` are both that: wired to a
real thing, and the real thing never changes.*

*Companion document: `spec_sequencing_2026-08-25_v01.md` (at v03) still holds
the sequencing model in full. Untouched this session.*

---

## Purpose & context

Mark (also goes by Marko) is a San Francisco Bay Area–based freelance
Creative Director with 25+ years of experience, building shtooky.com as a
primary portfolio site targeting Creative Lead and Creative Director roles
at tech companies. Next.js 16 / TypeScript / Turbopack, deployed on Vercel.
Claude is Mark's primary technical partner across all sessions.

Mark is not a coder by background — his mental model comes from motion
graphics and After Effects expressions, and he actively wants the
underlying web concepts explained plainly rather than just applied. He
judges all visual outcomes and makes every aesthetic decision himself.

**Session-start ritual (standing instruction):**
When Mark drops the bible in, do NOT go read the whole codebase and come
back twenty minutes later with a report. Catch up to where we left off and
suggest the areas we might work on. Fast. His words: *"this might be a
place where I would value speed of interaction over not knowing what's
happening and why it's taking so long… I like to talk things through and
understand what we are doing and why. I'd like to keep those interactions
pretty speedy if we can."*

The one caveat Claude raised and Mark accepted: **the bible is a narrative
of what we decided; the repo is what's actually true.** They drift. When a
specific number matters to what's about to happen, check that number and
say so — targeted, not a sweep.

*This session proved it again, twice. v78 said the bible was "stored at
`/Users/marko/shtooky`" — it is not in the repo at all, only in the Claude
project. And v78's "Contact form + Resend still blocked on creating a Resend
account" undersold the situation: the FORM was already built and shipped, so
the site had a visibly working contact form that failed on every submission.*

For simple, single-value mechanical fixes, Mark prefers to be pointed at
the exact file/line. Claude makes the edit directly when a change spans
multiple files, needs verification against the shared token system, or
involves an architecture judgment call.

**One thing at a time (standing instruction).** Present one decision, make the
change, look at it, then the next.

**Let Mark describe the intent before proposing the fix.** A description of
intent is a diff against the implementation. Claude's role is to hold each
point up to the code and say where it aligns and where it doesn't.

*This session's clearest instance: Mark asked for the logo grid to "shrink to
the text column width" and, separately, for tablet and mobile to come down
"about 20%". Claude proposed a three-tier `widthPct` token. Mark's response —
"maybe the correct answer is that follow the text column width on all
breakpoints" — collapsed a new three-number token into an existing one-line
relationship, and the tablet tier landed on exactly the −20% he had asked for
by a different route. **The better answer deleted the thing Claude proposed.***

The site has five pages: Welcome (`/`), Work (`/work`), Who I Am
(`/who-i-am`), How I Think (`/how-i-think`), and Let's Talk (`/lets-talk`).

**Site vision — "single room" (standing instruction):** The site is one
continuous atmospheric space. Content hangs like banners from the ceiling.
Each page region has its own ambient lighting (five page colors).
Navigation is a camera moving through that space.

**Leftmost-element principle (standing instruction):** NavBar and Footer
are deliberately the leftmost elements on any page, at any breakpoint —
all other content indents from that shared edge, via `FRAME_INSET_VW`.
*Knowingly bent twice:* the Who I Am skills-sphere canvas is full-bleed on
mobile/tablet, and that canvas escapes the content column via `bleed: true`
on its `[slot]`, the same treatment `SiteBackground` gets, because the
atmospheric layer isn't "content." Commented at both.

**Naming convention:** bible files are `project-bible_YYYY-MM-DD_vNN.md`.
When superseding, write the new file under its own correctly-dated name
and remove the old one rather than reusing the path.

**Component naming.** A component used by more than one page takes the
`Site` prefix. Page-specific components keep their page prefix (`Who…`,
`Work…`, `Think…`, `Welcome…`, `Talk…`). Every component in
`app/components/` carries a prefix, so a file without one is a signal.

Key infrastructure: GitHub (`github.com/markwoloschuk/shtooky`), Vercel
(auto-deploy on push), VS Code, GitHub Desktop.

---

## THE THROUGH-LINE — tokens-first (read this first)

**What "hardcode" means** — explicit per-tier numbers, tuned by eye, living in
the tokens file. Not derived formulas. Not local component constants.

### The three kinds of number (agreed framing)

- **Input** — a number tuned by eye, nothing derives it. → **Lives in the
  tokens file, tiered.**
- **Derived** — computed from inputs plus a real measurement. → **Never a
  token.** Stays in the component; every input it reads comes from tokens, and
  any fudge factor gets a name and a comment.
- **Exception** — a place that must differ. → `TOKEN + NAMED_OFFSET`.

The value of the split: **the tokens file becomes the list of things you are
allowed to change by eye.**

### The four resolution schedules

- **CSS-live** — a `vw`/`vh`/`clamp()` string. Re-resolved every paint.
- **React-reactive** — `useType()`/`useColumn()`/`useSpace()`.
- **Frozen** — `getType()` plus a `window.innerWidth` read inside an effect.
  Correct once, stale forever.
- **Fetched** — arrives after first paint. Anything that must be on screen
  before it resolves cannot live there.

**Rule: one mechanism per visual unit.**

*Used as a decision procedure this session and it settled the question. Two
candidate designs for the logo grid width: desktop reads `bodyMaxWidth` while
tablet/mobile carry their own numbers (a relationship plus two literals — two
mechanisms), or all three tiers read `bodyMaxWidth` (one mechanism). The rule
picked the second, and the second turned out to be what Mark wanted anyway.*

### THE HABIT BEHIND THE BUGS — carried forward from v78

Three of the four visibility-zone tokens existed **twice** — once as a tiered,
commented token, and once as a desktop-measured literal in the code that was
supposed to read it.

> **A value transcribed from a token is worse than no token at all: it looks
> tunable, tiers correctly in the file, and does nothing.**

### NEW — THE SIBLING HABIT: attached to something that never changes

v78's failure mode was a number *copied* from its source. This session found
two of a related but distinct kind: a number *correctly wired to a real
thing*, where the real thing never delivers.

| what | wired to | why it never fired |
|---|---|---|
| `2.2em` slot gap, `LetsTalkBody` | the inherited font-size | nothing between `<body>` and it sets one, so it resolved against the browser's 16px default — a flat 35.2px at every breakpoint |
| `[open, children]`, `Collapsible` | the `children` prop | `children` only changes identity when the PARENT re-renders; every state that changes the panel's height lives inside the CHILD |

Neither is a typo, and neither would ever throw. Both look like they are
doing the thing they describe.

> **A dependency on a proxy is not a dependency. Check that the thing you
> are watching is the thing that changes.**

`children` is the sharper case, because it is **simultaneously too eager and
completely blind** — it fires on every parent render regardless of whether
anything changed, and never fires when only the child's state changed. The
fix was not a better dependency but a `ResizeObserver`, which made the
dependency unnecessary rather than merely unreliable, so it was deleted.

### The same principle applied to CONTENT

`WorkManifest.ts` is the work page's config file the way `SiteTokens.tsx` is
the site's. `About.md` and `Talk.md` hold the words, the sequence, and the
pull-quote choreography; the page files hold what things are and how they are
framed. The test that decides each case: **where would Mark's hand go looking
for it.**

---

## Current state — what shipped this session

### THE SITE IS LIVE

Pushed to production and serving. `DEBUG.sequence` and `DEBUG.visibility` are
both `false` — confirmed in the repo, not assumed.
(`DEBUG.disableScrollFades` remains `true`; it is the legacy pre-ScrollConfig
switch and is unrelated.)

### The contact form — wired end to end

**It was already live and already broken.** `ContactForm` has been built
inside `TalkOptions.tsx` for some time, POSTing to `/api/contact`. That route
did not exist. So every visitor who filled in all four fields and pressed Send
got *"Something went wrong — mind trying again?"*, and Mark had no way to know
it had happened, because a working form and a silently failing one look
identical from the receiving end: no mail either way.

> **A UI shipped without its backend does not fail loudly. It fails exactly
> like a feature nobody used.**

**Sending domain: `send.shtooky.com`, deliberately a SUBDOMAIN.**

v78 recorded the hazard as "SPF TXT will need merging, not duplicating." That
is true if you send from the root — Resend hands you an SPF record for a name
where one already lives, and two SPF TXT records on one name is a **hard
fail** that breaks `mark@shtooky.com` itself, not just the form.

The subdomain does not solve that problem. It makes it not exist: all three
records land on names that had nothing on them.

> **Prefer the address space where the collision cannot happen over the
> careful merge that avoids it.**

**The DNS, written by Resend's one-time Cloudflare authorization:**

| type | full name | job |
|---|---|---|
| MX | `send.send.shtooky.com` | bounce handling |
| TXT | `send.send.shtooky.com` | `v=spf1 include:amazonses.com ~all` |
| TXT | `resend._domainkey.send.shtooky.com` | DKIM |

`send.send` is correct and is two things stacking: Cloudflare displays names
relative to the zone, and Resend puts the return-path records on a `send.`
subdomain **of whatever domain you register** — so its prefix landed on top of
Mark's. It looks exactly like the double-append typo it isn't.

**Why nothing needed to touch the root:** SPF and DKIM are doing different
jobs. SPF covers the invisible return-path (`send.send.shtooky.com`); DKIM is
what authenticates the visible `@send.shtooky.com` From address. Verified by
eye afterwards rather than assumed — root `MX` (`mx1`/`mx2.emailsrvr.com`) and
root `TXT` (`v=spf1 include:emailsrvr.com ~all`) are byte-identical to before,
and the record count went 8 → 11.

**`app/api/contact/route.ts`.** Validates and trims all four fields, caps
lengths (200 / 320 / 300 / 10000) as a brake on someone POSTing a megabyte
into a mail send, checks a deliberately loose email shape, and sends via
Resend with `replyTo` set to the visitor so hitting reply answers the person.
`From` is `noreply@send.shtooky.com` and is never seen by a visitor — which
also makes it the reliable thing to filter on, unlike the subject, which
contains visitor-supplied text. *Mark has routed it to a dedicated mailbox in
his work folder.*

**The one non-obvious thing in that file:** the Resend SDK reports failures by
**returning** `{ data: null, error }` rather than throwing. A plain
`try/catch` catches nothing, and the visitor is told the message was sent when
it wasn't. There is an explicit `if (error)` check alongside the `catch`.

> **Same family as `fadeInOnly`: a signal accepted and never read. There it
> was a parameter; here it would have been a return value.**

**`RESEND_API_KEY`** lives in two independent stores: `.env.local` on Mark's
Mac (gitignored via `.env*`, verified with `git check-ignore`) and Vercel's
environment variables (added as **Secret** type — write-only, so the
`.env.local` copy is the only readable one). Production is confirmed; Preview
and Development were not confirmed set. Env vars are baked in at build time,
so a redeploy is required before a change takes effect.

### Let's Talk — the options panel

**`Collapsible` now measures the box.** See the sibling-habit section above.
Symptom: after sending, the form was replaced by a one-line confirmation and
the container stayed as tall as a four-field form — a block of empty space
until the visitor closed the panel by hand. A second symptom of the same cause
had not been hit yet: the message textarea is `resize: "vertical"`, so a
visitor dragging it taller would have had their own typing clipped. One fix
covered both.

**The panel auto-closes.** `CONFIG.SENT_HOLD_MS` (3000, a reasoned starting
guess and not yet tuned) after the confirmation appears. `ContactForm` takes
an `onSent` callback; `TalkOptions` supplies a `useCallback`-stable
`setOpen(null)`. The timer clears on unmount, so closing by hand or switching
to Resume/Location cancels it rather than firing later and shutting whatever
the visitor opened next.

*Note the visual sequence: shrink to fit the confirmation (`TRANSITION_MS`),
hold, then collapse. Two height animations back to back. Mark has not yet
called it — if it reads as a stutter, the alternative is to hold full height
on `sent` specifically, as a deliberate commented exception.*

**All three panels match the TEXT column.** Applied once, on the element the
`ResizeObserver` measures, for two reasons: Contact / Resume / Location cannot
drift apart, and **narrower content is taller — constrain after measuring and
the recorded height belongs to a wider, shorter box, so the panel opens short
and clips.** A stray `maxWidth: 500` on the confirmation went with it.

**The gaps around the button row.** Were `marginTop: "2.2em"` /
`marginBottom: "2.2em"` on the slot wrapper in `LetsTalkBody`. Two things
wrong, both from v78's `SPACE.text` finding, surviving here because **the PAGE
adds this wrapper from outside `SiteTextBlock`'s gap system**:

- It never tiered — flat 35.2px everywhere.
- It stacked raw on the flex `paragraphGap`. Real distances were 65 / 57 /
  55px, of which the untiered part was **64% on mobile**.

Now `interruptGapBefore`/`After` with the shared gap subtracted back out.

### Welcome — the client logo grid

**It follows the text column at every breakpoint.** Was `width: "100%"` of the
content column while the paragraphs directly above and below used
`bodyMaxWidth(col)` — so on desktop the logos ran 76vw against 53.2vw of copy.
That gap is what read as "overstuffed."

| tier | was | now |
|---|---|---|
| desktop | 76vw | 53.2vw (−30%) |
| tablet | 86vw | 68.8vw (−20%) |
| mobile | 90vw | unchanged — `bodyColPct` is 100 there |

`aspectRatio` derives height from width, so the grid shortened proportionally
with no second number to keep in sync.

**`gapPx` and `logoPct` are now tiered** in `LOGO_GRID_TIERS`, both starting
at the flat values they had as component prop defaults (16 / 70) **so the only
visual change in that pass was the width.** Mark can now judge the width in
isolation before touching anything else.

They were previously **props with flat defaults that nothing ever passed** —
`page.tsx` sets only `triggerOnScroll` and `onComplete`.

> **A prop with a default that no call site overrides is an untiered number
> wearing the costume of an API.** Deleted rather than kept as an override:
> an override path that shadows a token is how two copies drift apart.

**Known and expected:** the 16px gap is now proportionally too large on
desktop, since the cells shrank 30% and it didn't. ~11–12 desktop and ~13
tablet would restore the old proportion. Untuned by choice.

**Three of Welcome's eight `vh` spacers are now tokens** — above and below the
logo grid, and above the CTA links.

**The last line splits on mobile only.** *"I've worked with some great people.
Why not you?"* breaks at the period below 768px. `useBreakpoint` starts at
`"desktop"` and corrects in an effect, so mobile renders it unsplit for one
frame — invisible here because `ScrollFade` holds it hidden until the grid
finishes, but the caveat matters if the pattern is reused somewhere visible on
load.

**Confirmed intentional:** there are 21 logos and 20 / 20 / 18 cells, so one
client is randomly absent from every desktop load and three from every mobile
load. Part of the randomness idea. Mark: *"it's quite likely to be so subtle
no one will ever catch it."*

### `interruptGapBefore` / `interruptGapAfter` — the rename

`pullGapBefore`/`pullGapAfter` acquired a second consumer (the Let's Talk
button row) and then, within the same hour, a third (three gaps on Welcome).
The comment written when the second appeared said *"if a third consumer
appears, rename it."* It did.

Now `interruptGapBefore` / `interruptGapAfter` — **the gap around any
non-paragraph element interrupting a column of body copy.** 45 / 33 / 30.
Three consumers:

1. pull quotes — `SiteTextBlock`
2. the Contact / Resume / Location row — `LetsTalkBody`
3. above/below the logo grid and above the CTA — `page.tsx`

These are one number **by intent, not by coincidence** — the v78 test applied
in the merge direction rather than the split direction. If a future case
genuinely wants to differ, it gets its own token rather than an override here.

**The subtlety that must survive:** the token means the TOTAL measured
distance. Inside `SiteTextBlock`, which lays children out in a flex column
with `gap: paragraphGap`, that shared gap is subtracted back out at the point
of use. On `page.tsx`, which stacks spacer divs with no flex gap, the value is
used **RAW**. Subtracting there would render the same token 30px tighter than
it appears on Let's Talk — which would look like a rendering bug rather than
an arithmetic one. Written into the token comment.

> **The same token can require different arithmetic depending on how its
> container lays out. Check which case you are in before reusing it.**

Mark on the result: *"I'm loving the consistency it brings."*

---

## Key learnings & principles

*(New entries marked **NEW**. Prior sets carried forward — see
v73/v74/v75/v77/v78.)*

- **NEW — A dependency on a proxy is not a dependency.** `[open, children]`
  watched whether the parent re-rendered, which correlates with content
  changing most of the time and is a different thing. Simultaneously too eager
  and completely blind.
- **NEW — When the fix makes a dependency unnecessary rather than more
  accurate, delete it.** The `ResizeObserver` didn't get a better dep array;
  it got a shorter one.
- **NEW — A UI shipped without its backend fails exactly like a feature nobody
  used.** No error reaches the person who could fix it. Worth asking, of any
  shipped form or action, what the *silent* failure looks like from the
  receiving end.
- **NEW — A signal accepted and never read, part two.** The Resend SDK returns
  errors instead of throwing. v78 found the parameter version (`fadeInOnly`);
  this is the return-value version, and the compiler catches neither.
- **NEW — Prefer the address space where the collision cannot happen.** The
  subdomain didn't carefully merge the SPF record; it made the merge
  unnecessary. Cheaper AND safer, which is rare enough to notice.
- **NEW — A prop with a default that no call site overrides is an untiered
  number wearing the costume of an API.** `gap = 16`, `logoSizePercent = 70`.
  It looks configurable, tiers nowhere, and adding an override path alongside
  a token just recreates the two-copies problem.
- **NEW — When two of three tiers coincide with an existing token, say so out
  loud.** A `widthPct` of 70/80/80 sits beside `bodyColPct` of 70/80/100. On
  this codebase a matching value is usually a broken import — so the one case
  where it isn't needs a comment, or someone "fixes" it and mobile silently
  grows back. *(Moot in the end: the design collapsed to reading the token
  directly. But the near-miss is the lesson.)*
- **NEW — The same token can require different arithmetic per container.**
  Subtract the flex gap inside a flex column; use the raw value where blocks
  are stacked with spacers.
- **NEW — Record the check that came back clean.** `CELL_ASPECT` looked
  exactly like a desktop-frozen constant — `(20/9) / (5/4)` in a file whose
  grid tiers to 4×5 and 3×6. It is correctly derived and documented. Writing
  down "checked, not a bug" stops the next session re-running the same
  suspicion.
- **NEW — A description of intent can delete the proposal.** Claude proposed a
  three-tier width token; Mark's restatement collapsed it to an existing
  one-line relationship that also happened to produce the exact −20% he'd
  asked for on tablet.
- Carried forward from v78: a value transcribed from a token is worse than no
  token; a count of on-screen items is a viewport-dependent number in a
  viewport-independent costume; moving something into a container silently
  rescales anything sized relative to the VIEWPORT; two numbers can be
  identical and mean opposite things; an index-arithmetic relationship between
  separately-authored things is one content edit from breaking silently; when
  a fast path skips the waiting, check what else the waiting was doing; design
  a diagnostic that can distinguish the hypotheses; simulate the property,
  don't spot-check it; a parameter accepted and never read is a lie the
  compiler won't catch; a capability built and never used should be found
  before it is defended.
- Carried forward from v77: a comment asking two copies to stay in sync is a
  countdown; encoding a value into a NAME makes every new value a code change;
  content needed before a fetch resolves cannot live in the fetched file; a
  silently-skipped block type is invisible failure; macOS lies to you about
  case; `[br]` at end of line is a break AND a collapsed newline; an explicit
  override that skips a fallback chain fails worse than no override; when one
  file says "matches the other file," that IS the bug report; a responsive rule
  that "helpfully" reduces can destroy an authored composition; check the
  coordinate space before declaring a scaling bug; a default that contradicts
  its own doc comment will mislead someone for months; a gap assembled from two
  paddings isn't a gap, it's a coincidence; read what the person actually wrote.
- Carried forward from v75: a track-matte layer that ends before the layer it
  mattes is a latent cross-browser bug; read a file's STRUCTURE before
  theorising; a shrink-to-fit fitter silently takes over the value it guards;
  where someone instinctively looks for a value is evidence about where it
  belongs; a canvas hard-clips at its own box mid-glyph; widening a container
  silently resizes anything sized from container width; a flat threshold
  compared against a resting position is a breakpoint bug waiting to happen.
- Carried forward from v74: `position: absolute` children contribute nothing to
  intrinsic height; a frozen JS pixel value and a live CSS `vw` are two trust
  models that can disagree; `ResizeObserver` reports settled boxes; imperative
  measurement plus declarative styling drift apart without an explicit
  dependency array; when a person says they can no longer follow how a system
  works, that's a signal about the system.

---

## Approach & patterns

- **NEW — Verify the claim you just made, with the thing itself.** After
  Resend wrote the DNS, the root `MX` and root `TXT` were read back and
  compared before saying "your inbox is safe." The claim was cheap to check
  and would have been irresponsible to assert.
- **NEW — Change one visible thing per pass, even when adopting several
  tokens.** `gapPx` and `logoPct` were tiered at their existing flat values so
  the logo grid's width could be judged alone. The knobs arrived without
  arriving as changes.
- **NEW — Explain the mechanism before proposing the fix, in the message that
  proposes it.** Every accepted change this session came after a paragraph
  saying what was actually happening. Mark overruled two proposals on the
  strength of that explanation, both times toward something simpler.
- **NEW — Name the thing you did NOT do.** Spam protection was deliberately
  deferred, and saying so plainly kept it on the list instead of it looking
  finished.
- Carried forward: write the spec before the code when the change spans a
  system; record the mistake, not just the fix; generate migrated content,
  never retype it; own the flagged risk that was not checked; one decision at
  a time, and let it be overruled; offer deletion before parameterisation;
  simulate a parser against real content before believing it; say which files
  change VISUALLY and how many; bible-drop means catch up fast and offer a
  menu; verify a test rig before trusting a null result; recalibrate in the
  same change that causes the drift; fix stale comments in the same pass as
  the code they describe; point to file/line for simple mechanical fixes;
  propose a mechanism plus a reasoned starting guess and let Mark's live
  judgment set the number; full-file replacement over accumulated patches;
  always read current file contents before editing; diagnose fully before
  touching code.

---

## On the horizon

### THE CONTACT FORM HAS NO SPAM PROTECTION — highest priority

The route validates and caps lengths. Nothing else. No honeypot, no rate
limit, no proof-of-work. It is a public POST that sends mail, on an indexed
domain, and bots find those.

The pass needs to touch two files, which is why it was held back: a honeypot
needs a hidden field in `ContactForm` as well as the check in the route.
Rate limiting is the harder half — in-memory counters don't work reliably on
serverless, since each instance has its own. Honeypot plus length caps plus
a timing check is probably proportionate for a portfolio site; a shared store
is the heavier option if it isn't.

### DMARC — now genuinely worth doing
Cloudflare is prompting for it on the DNS page, and v78 already listed
"decide on DMARC." Deferred deliberately until the new sender is proven:
**adding an enforcing policy before confirming both Rackspace and Resend
authenticate cleanly is a good way to send your own mail to spam.** Start at
`p=none` (monitor only).

### Let's Talk — the location animation
Mark's stated next big item on that page. The `LocationPanel` currently shows
`/images/talk/map_placeholder.jpg` at 16:9, with a comment saying to swap it
for the zoom animation "once that prototype's finished, same slot."

### Reading measure for IMAGERY — Mark's bookmarked idea
His observation: hero images look big on desktop, and full-bleed imagery reads
well at the top of a page (carousel, header images) but overstuffed further
down. The logo grid is the first instance of the fix.

**The question is not "narrower or not" — it is whether images are one
category or several.** A four-up gallery tile, a full-bleed hero and a single
inline figure plausibly want different answers. And `bodyColPct` is named for
body copy, so pinning imagery to it would encode a meaning the name doesn't
carry — unless the same rename logic that produced `interruptGap` applies
again.

### Untuned, deliberately
- **`LOGO_GRID_TIERS.gapPx`** — 16 flat. Expected to want ~11–12 desktop,
  ~13 tablet after the width change.
- **`LOGO_GRID_TIERS.logoPct`** — 70 flat. The knob for "the logos read too
  heavy", independent of grid size.
- **`CONFIG.SENT_HOLD_MS`** in `TalkOptions` — 3000.
- **The Resume panel's `height: "70vh"`** — chosen against the old, wider
  panel. A portrait PDF now sits in a much taller-than-wide frame.
- **`SEQUENCE` in `SiteTokens`** — the whole pacing surface, still untuned
  from v78: `firstDelayMs 400`, `stepMs 200`, `minStepMs 70`, `fadeMs 1200`,
  `pressureDeadzonePx 40`, `pressureWindowMs 600`, `backlogPressure 2`.
  **Known hazard: the deadzone is tested per scroll EVENT**, so holds may
  behave differently by INPUT DEVICE rather than reading speed.

### Open design question — the double height animation
After sending, the panel shrinks to fit the confirmation, holds, then
collapses. Two height animations back to back. May read as settling, may read
as a stutter. Alternative: hold full height on `sent` as a commented
exception.

### `BF0` / `BF100` desktop — Mark's open note
*"Looks great on mobile, too eager on desktop."* Lower desktop `BF0` (95 →
92–90) to delay; widen `BF0 − BF100` to slow the ramp. `SiteTokens.tsx` lines
~657–658. Tune with `DEBUG.visibility` on.

### The top gradient — the last structural piece of the sequencing spec
`SiteScrollConfig`'s top gradient is still commented out and re-implemented in
`SiteNavBar` as `NAV_GRADIENT_HEIGHT` (180/120/90 **px**), a separate
mechanism in different units. `TF0` and `TF100` remain **dead tokens**.

### Also dead in `VISIBILITY_TIERS`
`getScrollConfig()` and the `_config` store have zero consumers. So do
`revealMs`, `staggerMs` and `idleMs`. `VISIBILITY_TIERS_DESKTOP` is a
duplicate copy inside `SiteScrollConfig`.

### The scroll-fade family — the Welcome page is the remaining job
**Eight separate `const SCROLL_FADE = {…}` objects in eight files** —
`WelcomeHero2Line`, `WelcomeHeroAnimation`, `WhoVennDiagram`,
`WhoSkillsSphere`, `WelcomeClientLogoGrid`, `WelcomeEverythingIsInteresting`,
plus `WelcomeScrollFade`'s prop defaults and `TalkRippleNetwork`'s tiered
`SCROLL_FADE_TIERS`. `WhoSkillsSphere` doesn't even use its own
(`const fadeOutStart = 300`, inline). Who I Am and Let's Talk are done.

*Note: `WelcomeClientLogoGrid`'s copy is now only `{ animDelay: 200 }` — its
trigger geometry already reads `BF0`/`BF100`.*

### Type-role consolidation — Mark's stated next cleanup
*"One of the cleanup jobs I'm going to want to do later is reduce the number
of type tokens we have for greater consistency."* `BODY` / `CASE_BODY` /
`BODY_WELCOME` are three identical roles.

**The test is not "are these values identical" — it is "do these describe the
same thing."** `BAND_HEADLINE` and `ABOUT_PULLQUOTE` exist *because* shared
roles caused silent coupling. `interruptGap` is the same test applied in the
other direction and coming out "merge."

### Content fixes still with Mark
- **`[praragraph]` in `ThinkCard02.md` line 31** — a typo'd block type,
  silently dropped, so **that paragraph is missing from the live site right
  now.** This is on the LIVE site.
- **"Microoft** Store 12 Days of Deals" (WorkCase01), "Wedding
  **Infogrphics**" (WorkCase07), **"Have a reaon"** (ThinkCard01's second
  pullquote).

### Work case 01 — 12 videos wired
`SiteGallery` has **no caption or title rendering at all** — not on the tile,
not in the lightbox. Putting the twelve episode titles on screen is a feature,
not a syntax tweak.

### Deferred by decision
**Gallery poster precedence.** Chain is `maxresdefault → hqdefault → folder
image`, so a hand-made poster is the FALLBACK and never shows. Left as-is.

**Crop default stays `4by3`.** Decided, not deferred.

**The landscape / short-viewport guard.** Diagnosed in v77, not built.

**`interruptGapBefore` vs `interruptGapAfter`.** Equal at all three tiers. If
that keeps reading fine, three numbers per tier collapse to two.

### The tokens-first migration, continued
- **Still-flat spacing values:** `LINE_GAP_PX`, `ROW_GAP_TOP`/`ROW_GAP_BOTTOM`
  (in `TalkOptions.CONFIG`), `lineGapPx` (Welcome CTA), `marginTop: 24` on the
  Work text block.
- **The `vh` spacers.** Welcome had eight; **three are now tokens**, five
  remain (`35vh`, `8vh`, `4vh`, `3vh`, `20vh`). Who I Am two, Let's Talk one.
- **Hardcoded font sizes on no token:** `TalkOptions` (16/15/17 — the field
  text, button and confirmation), `SiteNavBar` (9), `WhoSkillsSphere` (11),
  `ThinkGridCanvas` (11), the figcaption/counter 13s in both case panels,
  `clamp()` leftovers in `ThinkBelowPlaceholder` and `SiteTextBlock`.
- **Delete the legacy `TYPE`/`COLUMN` static exports.** Ten files still import
  `TYPE`.
- **`const N = 7` in `WorkCarousel.tsx`** duplicates `WORK_MANIFEST.length`.

### Duplication that has already drifted
- **RESOLVED this session:** `TalkOptions`' `gap`/`logoSizePercent` props;
  three of Welcome's `vh` spacers; the `2.2em` slot margins; `maxWidth: 500`
  on the sent confirmation.
- **RESOLVED in v78:** the band vignette; the two page content files;
  `SiteFooter`'s second bottom gradient; `SiteTextBlock`'s `SCROLL_FADE`.
- `TAGLINES` exists in **both** hero files and the two copies **already
  differ** — "problems in the end" vs "problems at the end". *Still open.*
- Colour helpers (`rgbToHsl`/`hslToRgb`) duplicated across the two hero files.
- `BODY_WELCOME`/`BODY`/`CASE_BODY` are three identical token roles.

### The Welcome hero sizing race — still unresolved
Both heroes compute the headline font size from a one-time `window.innerWidth`
read frozen into pixels.

### Known-wrong maths, flagged and not fixed
- `WhoSkillsSphere` fog: `coreR` produces a gradient radius in the tens of
  thousands of pixels.
- `WhoSkillsSphere` `particleSpread` used two ways in the same file.
- `WelcomeHeroAnimation`'s `lineH * 0.76` cap-height guess.
- `SPACE.layout.talkNavClearance` and `SCROLL_FADE_TIERS` must agree by hand.

### Other open items
**The AE source of the Lottie fix.** `thinking-open.json` is fixed in the
repo; the After Effects project is not. Two other layers have the same
lifespan mismatch.

**Code health.** `npx eslint app` reports ~60 errors, all pre-existing. Next
16 does not run ESLint during `next build`. `npm audit` now reports 7
vulnerabilities (1 moderate, 6 high) across 376 packages — mostly
pre-existing; **do not run `npm audit fix --force`**, it upgrades majors.

**Carried over, untouched:** hamburger menu polish; navbar gradient 3-stop
proposal; backdrop-filter blur behind navbar; uncapped
`COLUMN_TIERS.desktop.vw`; fluid clamp-based body-copy scaling (paused —
`ABOUT_PULLQUOTE`'s tablet tier is an argument for un-pausing); full five-page
three-breakpoint visual pass; Who I Am's perceived right-bias on tablet; the
stale "copied from desktop as placeholder" comment on `TYPE_TIERS`' mobile
tier; coding-literacy side project.

**Infrastructure.** Contact form: **DONE.** Remaining: delete the unused `ftp`
A record (`98.129.229.120`, still pointing at Rackspace). Decide on DMARC.
Decide whether to add `vercel.json` redirects for ~100+ old indexed
Squarespace URLs that now 404.

---

## Tools & resources

- **Stack:** Next.js 16.2.9 / TypeScript / Turbopack, Vercel (Hobby,
  auto-deploy), GitHub + GitHub Desktop, VS Code. **`resend` ^6.24.0** added
  this session.
- **Domain & DNS:** `shtooky.com` — registered at GoDaddy, DNS at Cloudflare
  (Free), all records DNS-only, pointing at Vercel. MX/SPF route
  `mark@shtooky.com` through Laughing Squid/Rackspace. **`send.shtooky.com` is
  the Resend sending domain** — three records, all on names of their own.
  11 DNS records total. Squarespace fully retired.
- **Local dev on LAN:** `cd /Users/marko/shtooky && npm run dev`, then phone
  (same Wi-Fi) → `http://10.0.0.154:3000`.
- **Live DevTools breakpoint workflow:** custom device presets at exact px
  (iPhone 390×844, iPad Mini 768×1024, Desktop 1440×900), device toolbar
  undocked, side-by-side with a real non-emulated window.
- **`DEBUG` flags in `SiteTokens`:** `visibility` draws labelled
  `TF0`/`TF100`/`BF100`/`BF0` zone lines; `sequence` traces every queue
  decision. **Both `false` as of this session — confirmed in the repo.**
- **Claude-side environment:**
  - **Screen recording is GRANTED.** Safari can only be granted at **read**
    tier — visible in screenshots, no clicking or typing.
  - `device_bash` runs in a sandboxed **Linux** VM with the repo mounted — NOT
    macOS. It cannot reach `localhost:3000`, cannot run `next build`, and
    **cannot delete files**. **It has no browser.**
  - **NEW — do not run `git` commands from `device_bash`.** They create
    `.git/index.lock`, which git then cannot remove, leaving a stale lock that
    blocks GitHub Desktop and VS Code until Mark deletes it by hand. Happened
    once this session. Read git state some other way, or ask.
  - **`npx tsc --noEmit` DOES work there** and was run after every edit this
    session.
  - **`node` and `npm` both work**, including installing from the registry.
  - The cloud container (the `Bash` tool) is a separate machine with restricted
    network — GitHub and Google Fonts are blocked.
- **Key files:** `SiteTokens.tsx` (COLORS, PAGES, BREAKPOINTS, COLUMN_TIERS,
  TYPE_TIERS, SPACE incl. **`interruptGapBefore`/`After`**, SEQUENCE, TIMING,
  NAV, FOOTER, VISIBILITY_TIERS, **LOGO_GRID_TIERS incl. `gapPx`/`logoPct`**,
  BAND_HEADLINE, BAND_VIGNETTE, DEBUG, hooks); `SiteRevealQueue.tsx`;
  `SiteCaseMarkdown.tsx`; `SiteTextBlock.tsx`; **`app/api/contact/route.ts`**;
  `TalkOptions.tsx`; `WelcomeClientLogoGrid.tsx`; `WorkManifest.ts`;
  `SiteGallery.tsx`; `SiteScrollConfig.tsx`; `WorkCarousel.tsx` is the
  recurring pattern reference.
- **The band pair.** `WorkCarousel.tsx` and `ThinkGridCanvas.tsx` share
  `BAND_HEADLINE`, `BAND_VIGNETTE` and `SPACE.layout.bandDetailGap`.
- **Content:** `WorkCase0#.md` (7), `ThinkCard##.md` (13), `About.md`,
  `Talk.md`. Work blocks: `[jobbox]`, `[subtitle]`, `[label]`, `[paragraph]`,
  `[pullquote]`, `[gallery]`, `[video-carousel]`. Think: the same minus
  `[jobbox]`/`[subtitle]`, plus `[img]`. About/Talk: `[paragraph]`,
  `[subtitle]`, `[pull]`, `[slot]`. `[gallery]` line 2 is
  `Nup, crop(4by3|16by9|1by1|2by3), noClick`.
- **`AGENTS.md`** — per-file "TYPE ROLES USED" header convention, plus the
  standing instruction to read `node_modules/next/dist/docs/` before writing
  Next code. Followed this session for the route handler.
- **Project bible:** v79 (this file). **Note: v78 was NOT on disk in the repo
  — only in the Claude project.** Superseded bibles live in
  `can_probs_delete/old-bibles/` (v75, v76, v77) rather than being deleted,
  since `device_bash` cannot remove files.
