// lets-talk/page.tsx
// app/lets-talk/
// SERVER shell — reads Talk.md and hands the string to the client body.
// Same reasoning as who-i-am/page.tsx: the page body must be present on the
// first painted frame, so it is read here rather than fetched.

import { readFileSync } from "fs"
import { join } from "path"
import LetsTalkBody from "./LetsTalkBody"

export default function LetsTalk() {
    const md = readFileSync(join(process.cwd(), "app/data/Talk.md"), "utf8")
    return <LetsTalkBody md={md} />
}
