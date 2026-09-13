"use client"

import { useBreakpoint } from "./SiteTokens"
import HeroAnimation from "./WelcomeHeroAnimation"
import HeroAnimationTwoLine from "./WelcomeHero2Line"

export default function HeroAnimationResponsive({
    autoPlay = true,
    onComplete,
    dismissed = false,
}: {
    autoPlay?: boolean
    onComplete?: () => void
    dismissed?: boolean
}) {
    const breakpoint = useBreakpoint()
    const props = { autoPlay, onComplete, dismissed }
//    return breakpoint === "mobile"
      return breakpoint !== "desktop"
        ? <HeroAnimationTwoLine {...props} />
        : <HeroAnimation {...props} />
}
