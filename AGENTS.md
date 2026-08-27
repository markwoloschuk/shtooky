<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Coding standards

## TYPE ROLES comment block
Every component that sets a font size must include a header comment listing which `TYPE_TIERS` roles it uses. Place it immediately after `'use client'` (or the first import if there is no directive):

```ts
// TYPE ROLES USED IN THIS FILE:
//   body paragraphs  → TYPE_TIERS.BODY      (sizePx)
//   pull-quotes      → TYPE_TIERS.PULLQUOTE (sizePx)
//   heading          → TYPE_TIERS.OPENING   (sizeVw — read via getType())
```

List every rendered text element that has a font size, named by its visual role. If a size is still hardcoded and pending a token decision, say so explicitly (e.g. `→ (hardcoded 17px — pending BODY decision)`). This makes the token coverage visible at a glance and flags technical debt without requiring a full audit.

## Body copy dashes

Use a spaced en dash (`–`), never an em dash. The space BEFORE it is a
non-breaking space (U+00A0); the space after is a regular space. This stops a
dash from ever being pushed to the start of a line.

- Content `.md` files carry the literal U+00A0 character.
- `.tsx` string literals write it as the escape `\u00A0`, so it is visible in
  source rather than an invisible byte.
- JSX text nodes use `&nbsp;`.

Metadata that cannot wrap — the `<title>` in `layout.tsx`, an iframe's
`title` attribute — is out of scope and keeps whatever dash reads best.

Note that U+00A0 defeats exact-match search: `– word` and `–\u00A0word` render
identically and are different strings. When editing content programmatically,
match on the smallest distinctive fragment and COUNT the matches rather than
trusting a replace to have found anything.
<!-- END:nextjs-agent-rules -->
