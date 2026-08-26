// who-i-am/page.tsx
// app/who-i-am/
// SERVER shell. Its only job is to read About.md and hand the string to the
// client body.
//
// WHY SERVER-READ AND NOT FETCHED: this markdown is the page's entire body
// copy. A fetched file is a fourth resolution schedule — the value looks like
// it is in the right place and simply is not there yet — which is what forced
// the carousel headlines out of the case .md files and into WorkManifest.ts.
// Read here, it is present on the first painted frame.

import { readFileSync } from "fs"
import { join } from "path"
import WhoIAmBody from "./WhoIAmBody"

export default function WhoIAm() {
    const md = readFileSync(join(process.cwd(), "app/data/About.md"), "utf8")
    return <WhoIAmBody md={md} />
}
