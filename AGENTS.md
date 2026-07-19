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
<!-- END:nextjs-agent-rules -->
