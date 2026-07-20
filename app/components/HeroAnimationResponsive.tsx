"use client"

import { useBreakpoint } from "./Tokens"
import HeroAnimation from "./WelcomeHeroAnimation"
import HeroAnimationTwoLine from "./WelcomeHero2Line"

export default function HeroAnimationResponsive({ autoPlay = true }: { autoPlay?: boolean }) {
    const breakpoint = useBreakpoint()
    return breakpoint === "mobile"
        ? <HeroAnimationTwoLine autoPlay={autoPlay} />
        : <HeroAnimation autoPlay={autoPlay} />
}
