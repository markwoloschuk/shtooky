// NavBar.tsx — shtooky.com
// Ported from 00_nav-bar_v18.html
// Reads layout constants from tokens.tsx

// Adjust left /right padding at line 819

"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PAGES, COLORS, NAV, FOOTER, getActivePage } from "../components/Tokens"

// ── Locked defaults (from v18 prototype) ─────────────────────
const S = {
    fontSize: NAV.nameFontSize,
    tracking: NAV.titleTracking,
    lineHeight: NAV.lineSpacing,
    nameHit: 8,
    textGap: 3,
    stripHeightPct: NAV.stripHeight * 100,
    stripGap: 0,
    hitAbove: 10,
    hitBelow: 20,
    hoverScale: 2.0,
    spring: 20,
    speed: 600,
    labelDelay: 10,
    labelOffsetX: 8,
    labelOffsetY: 0,
    clickSpeed: 150,
    glitchDur: 550,
    glitchFade: 2000,
    titleText: "Creative Lead & Designer",
    shtookyTitle: "Stunts, Tricks & Tiny Pieces",
    carouselDelay: 3,
    wordStagger: 80,
    wordY: 30,
    outEase: 1.0,
    inEase: 1.0,
    wordDur: 500,
    openDur: 3000,
    //stagger is max at 0 and min at 100
    openStagger: 97,
    openY: 16,
    openDelay: 500,
}

const FONT_DISPLAY = '"Archivo", sans-serif'
const GLITCH_POOL = [
    "▓",
    "█",
    "▒",
    "░",
    "▔",
    "◼",
    "◾",
    "Ш",
    "Т",
    "К",
    "И",
    "Ю",
    "Й",
    "Ч",
    "Э",
    "Ж",
    "Д",
    "Ф",
]
const PALETTE = PAGES.map((p) => p.color)

// ── Measurement helpers ───────────────────────────────────────
function meas(
    span: HTMLElement,
    text: string,
    fs: number,
    fw: string,
    ls: string,
    tt: string
): number {
    span.style.cssText = `font-family:${FONT_DISPLAY};font-size:${fs}px;font-weight:${fw};letter-spacing:${ls};text-transform:${tt};position:absolute;top:-9999px;left:-9999px;visibility:hidden;white-space:nowrap;`
    span.textContent = text
    void span.offsetWidth
    return span.getBoundingClientRect().width
}

function measH(span: HTMLElement, fs: number, fw: string): number {
    span.style.cssText = `font-family:${FONT_DISPLAY};font-size:${fs}px;font-weight:${fw};letter-spacing:0em;text-transform:none;position:absolute;top:-9999px;left:-9999px;visibility:hidden;white-space:nowrap;`
    span.textContent = "Ag"
    void span.offsetHeight
    return span.getBoundingClientRect().height
}

function getNameWidth(span: HTMLElement): number {
    return (
        Math.ceil(
            meas(
                span,
                "mark woloschuk",
                S.fontSize,
                "700",
                "-0.01em",
                "lowercase"
            )
        ) + 8
    )
}

function fitFontSize(
    span: HTMLElement,
    text: string,
    tracking: number,
    targetW: number
): number {
    let lo = 3,
        hi = 200,
        mid = 10
    for (let i = 0; i < 32; i++) {
        mid = (lo + hi) / 2
        meas(span, text, mid, "500", tracking + "em", "uppercase") < targetW
            ? (lo = mid)
            : (hi = mid)
    }
    return mid
}

function fitTracking(
    span: HTMLElement,
    text: string,
    fs: number,
    targetW: number
): number {
    let lo = -0.05,
        hi = 2.0,
        mid = 0
    for (let i = 0; i < 32; i++) {
        mid = (lo + hi) / 2
        meas(span, text, fs, "500", mid + "em", "uppercase") < targetW
            ? (lo = mid)
            : (hi = mid)
    }
    return mid
}

// ── Glyph helpers ─────────────────────────────────────────────
function randGlyph(): string {
    return GLITCH_POOL[Math.floor(Math.random() * GLITCH_POOL.length)]
}
function randColor(): string {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}
function corrupt(t: string, l: number): string {
    let o = ""
    for (const ch of t) o += ch !== " " && Math.random() < l ? randGlyph() : ch
    return o
}

function makeEase(sp: number): string {
    const p2 = 0.8 + (sp / 100) * 1.6
    return `cubic-bezier(0.34,${p2.toFixed(2)},0.64,1)`
}

// ── Component ─────────────────────────────────────────────────
export default function NavBar() {
    const [activePage, setActivePage] = useState(getActivePage())
    useEffect(() => {
        setActivePage(getActivePage())
    }, [])
    const router = useRouter()
    const navRef = useRef<HTMLDivElement>(null)
    const nameWrapRef = useRef<HTMLDivElement>(null)
    const navNameRef = useRef<HTMLSpanElement>(null)
    const navNameOverRef = useRef<HTMLSpanElement>(null)
    const titleWrapRef = useRef<HTMLDivElement>(null)
    const navTitleRef = useRef<HTMLSpanElement>(null)
    const stripsAnchorRef = useRef<HTMLDivElement>(null)
    const stripsRowRef = useRef<HTMLDivElement>(null)
    const colorBarRef = useRef<HTMLDivElement>(null)
    const msRef = useRef<HTMLSpanElement>(null)

    const stateRef = useRef({
        activePage,
        hoveredWrap: null as HTMLDivElement | null,
        glitched: false,
        lockedWidth: null as number | null,
        glitchTimers: [] as ReturnType<typeof setTimeout>[],
        L: {
            nameW: 0,
            nameH: 0,
            titleH: 0,
            titleFs: 0,
            normalTracking: 0,
            shtookyTracking: 0,
            stripH: 0,
            titleTopY: 0,
            stripsTopY: 0,
        },
    })

    useEffect(() => {
        const nav = navRef.current!
        const nameWrap = nameWrapRef.current!
        const navName = navNameRef.current!
        const navNameOver = navNameOverRef.current!
        const titleWrap = titleWrapRef.current!
        const navTitle = navTitleRef.current!
        const stripsAnchor = stripsAnchorRef.current!
        const stripsRow = stripsRowRef.current!
        const colorBar = colorBarRef.current!
        const ms = msRef.current!

        if (
            !nav ||
            !nameWrap ||
            !navName ||
            !navNameOver ||
            !titleWrap ||
            !navTitle ||
            !stripsAnchor ||
            !stripsRow ||
            !ms
        )
            return

        document.body.appendChild(ms)
        const st = stateRef.current!
        const wraps = Array.from(
            stripsRow.querySelectorAll<HTMLDivElement>(".strip-wrap")
        )
        const strips = Array.from(
            stripsRow.querySelectorAll<HTMLDivElement>(".strip")
        )
        const hoverLabels = Array.from(
            stripsRow.querySelectorAll<HTMLDivElement>(".hover-label")
        )

        // ── Name helpers ────────────────────────────────────────────
        function setNameText(el: HTMLSpanElement, text: string, color: string) {
            el.innerHTML = ""
            const sp = document.createElement("span")
            sp.textContent = text
            sp.style.color = color
            el.appendChild(sp)
        }

        function spanifyName(
            el: HTMLSpanElement,
            text: string,
            colorFn: (ci: number, total: number) => string
        ) {
            el.innerHTML = ""
            const nc = [...text].filter((c) => c !== " ").length
            let ci = 0
            for (const ch of text) {
                const sp = document.createElement("span")
                sp.textContent = ch
                sp.style.color = ch === " " ? "transparent" : colorFn(ci++, nc)
                el.appendChild(sp)
            }
        }

        function nameColorFn(phase: number, dest: string) {
            return (ci: number, total: number) => {
                if (phase <= 0.3) return "#fff"
                if (phase <= 0.7) {
                    const r = (phase - 0.3) / 0.4
                    return r > (total > 1 ? ci / (total - 1) : 0.5)
                        ? Math.random() > 0.4
                            ? PALETTE[ci % 5]
                            : randColor()
                        : "#fff"
                }
                if (phase <= 0.9) {
                    const c = (phase - 0.7) / 0.2
                    return Math.random() < c ? dest : PALETTE[ci % 5]
                }
                return dest
            }
        }

        // ── Title helpers ───────────────────────────────────────────
        function splitWords(t: string): string[] {
            return t.split(/\s+/).filter((w) => w.length > 0)
        }

        function measureWordPositions(
            text: string,
            fs: number,
            tracking: number
        ): number[] {
            const words = splitWords(text)
            const spW = meas(
                ms!,
                "\u00A0",
                fs,
                "500",
                tracking + "em",
                "uppercase"
            )
            const pos: number[] = []
            let x = 0
            words.forEach((w, i) => {
                pos.push(x)
                x +=
                    meas(ms!, w, fs, "500", tracking + "em", "uppercase") +
                    (i < words.length - 1 ? spW : 0)
            })
            return pos
        }

        function renderTitleStatic(text: string, tracking: number, fs: number) {
            navTitle.innerHTML = ""
            navTitle.style.fontSize = fs + "px"
            const pos = measureWordPositions(text, fs, tracking)
            splitWords(text).forEach((w, i) => {
                const sp = document.createElement("span")
                sp.className = "title-word"
                sp.style.cssText = `left:${pos[i]}px;opacity:1;transform:translateY(0px);letter-spacing:${tracking}em;`
                sp.textContent = w
                navTitle.appendChild(sp)
            })
        }

        function runCarousel(
            outText: string,
            inText: string,
            fs: number,
            outT: number,
            inT: number
        ) {
            const oW = splitWords(outText),
                iW = splitWords(inText)
            const oP = measureWordPositions(outText, fs, outT),
                iP = measureWordPositions(inText, fs, inT)
            const outE = `cubic-bezier(${S.outEase.toFixed(2)},0,1,1)`
            const inE = `cubic-bezier(0,0,${S.inEase.toFixed(2)},1)`
            navTitle.innerHTML = ""
            navTitle.style.fontSize = fs + "px"
            const oS = oW.map((w, i) => {
                const sp = document.createElement("span")
                sp.className = "title-word"
                sp.style.cssText = `left:${oP[i]}px;letter-spacing:${outT}em;opacity:1;transform:translateY(0px);transition:none;`
                sp.textContent = w
                navTitle.appendChild(sp)
                return sp
            })
            const iS = iW.map((w, i) => {
                const sp = document.createElement("span")
                sp.className = "title-word"
                sp.style.cssText = `left:${iP[i]}px;letter-spacing:${inT}em;opacity:0;transform:translateY(${S.wordY}px);transition:none;`
                sp.textContent = w
                navTitle.appendChild(sp)
                return sp
            })
            oS.forEach((sp, i) =>
                st.glitchTimers.push(
                    setTimeout(() => {
                        sp.style.transition = `opacity ${S.wordDur}ms ${outE},transform ${S.wordDur}ms ${outE}`
                        sp.style.opacity = "0"
                        sp.style.transform = `translateY(-${S.wordY}px)`
                    }, i * S.wordStagger)
                )
            )
            iS.forEach((sp, i) =>
                st.glitchTimers.push(
                    setTimeout(() => {
                        sp.style.transition = `opacity ${S.wordDur}ms ${inE},transform ${S.wordDur}ms ${inE}`
                        sp.style.opacity = "1"
                        sp.style.transform = "translateY(0px)"
                    }, i * S.wordStagger)
                )
            )
            const total =
                (Math.max(oW.length, iW.length) - 1) * S.wordStagger +
                S.wordDur +
                40
            st.glitchTimers.push(
                setTimeout(() => {
                    navTitle.innerHTML = ""
                    renderTitleStatic(inText, inT, fs)
                }, total)
            )
        }

        // ── Layout ──────────────────────────────────────────────────
        function applyLayout() {
            if (st.glitched) return
            const nameW = getNameWidth(ms!)
            const nameH = measH(ms!, S.fontSize, "700") * .76
            const titleFs = fitFontSize(ms!, S.titleText, S.tracking, nameW)
            const titleH = Math.ceil(measH(ms!, titleFs, "500")) + 2
            const shtookyTracking = fitTracking(
                ms!,
                S.shtookyTitle,
                titleFs,
                nameW
            )
            const stripH = Math.max(
                1,
                Math.round((S.fontSize * S.stripHeightPct) / 100)
            )
            const titleTopY = nameH + S.lineHeight
            const stripsTopY = titleTopY + titleH + S.textGap
            st.L = {
                nameW,
                nameH,
                titleH,
                titleFs,
                normalTracking: S.tracking,
                shtookyTracking,
                stripH,
                titleTopY,
                stripsTopY,
            }

            nav.style.width = nameW + "px"
            nav.style.height = stripsTopY + stripH + S.hitBelow + "px"
            nameWrap.style.cssText += `top:0px;width:${nameW}px;`
            navName.style.fontSize = S.fontSize + "px"
            navName.style.letterSpacing = "-0.01em"
            navNameOver.style.fontSize = S.fontSize + "px"
            navNameOver.style.letterSpacing = "-0.01em"
            navNameOver.style.opacity = "0"
            setNameText(navName, "mark woloschuk", "#fff")

            titleWrap.style.cssText += `top:${titleTopY}px;width:${nameW}px;height:${titleH}px;`
            renderTitleStatic(S.titleText, S.tracking, titleFs)

            stripsAnchor.style.top = stripsTopY + "px"
            stripsAnchor.style.width = nameW + "px"
            stripsRow.style.width = nameW + "px"
            stripsRow.style.minWidth = nameW + "px"
            stripsRow.style.gap = S.stripGap + "px"
            strips.forEach((s) => {
                s.style.height = stripH + "px"
            })
            updateLabelPositions()
            applyWidths(st.hoveredWrap, nameW)
        }

        // ── Widths ──────────────────────────────────────────────────
        function applyWidths(
            hovered: HTMLDivElement | null,
            totalOverride?: number
        ) {
            const total =
                totalOverride !== undefined
                    ? totalOverride
                    : st.lockedWidth !== null
                      ? st.lockedWidth
                      : st.L.nameW
            const n = wraps.length,
                availW = total - S.stripGap * (n - 1)
            const widths =
                hovered === null
                    ? Array(n).fill(availW / n)
                    : wraps.map((w) => {
                          const u = availW / (S.hoverScale + n - 1)
                          return w === hovered ? S.hoverScale * u : u
                      })
            wraps.forEach((w, i) => {
                w.style.width =
                    w.style.minWidth =
                    w.style.maxWidth =
                        widths[i] + "px"
            })
        }

        // ── Active page ─────────────────────────────────────────────
        function setActive(page: string) {
            st.activePage = page
            const pageData = PAGES.find((p) => p.id === page)
            if (pageData && colorBar) colorBar.style.background = pageData.color
        }

        // ── Hit areas ───────────────────────────────────────────────
        function updateHitAreas() {
            let el = document.getElementById("navHitAreaStyle")
            if (!el) {
                el = document.createElement("style")
                el.id = "navHitAreaStyle"
                document.head.appendChild(el)
            }
            el.textContent = `.strip-wrap::before{height:${S.hitAbove}px!important}.strip-wrap::after{height:${S.hitBelow}px!important}`
        }

        function updateNameHit() {
            const h = S.nameHit
            nameWrap.style.padding = `${h}px ${h}px`
            nameWrap.style.margin = `-${h}px -${h}px`
        }

        // ── Label positions ─────────────────────────────────────────
        function updateLabelPositions() {
            hoverLabels.forEach((lbl) => {
                lbl.style.top = st.L.stripH + 4 + "px"
                lbl.style.left = "0px"
                lbl.style.transform = `translate(${S.labelOffsetX}px,${S.labelOffsetY}px)`
            })
        }

        function showLabel(wrap: HTMLDivElement) {
            const lbl = wrap.querySelector<HTMLDivElement>(".hover-label")
            if (!lbl) return
            const ease = "cubic-bezier(0.22,1,0.36,1)"
            const d = Math.max(0, S.labelDelay)
            lbl.style.transition = `color 300ms ${ease} ${d}ms,transform 400ms ${ease} ${d}ms`
            lbl.classList.add("visible")
            requestAnimationFrame(() => {
                lbl.style.transform = "translate(0px,0px)"
            })
        }

        function hideLabel(wrap: HTMLDivElement) {
            const lbl = wrap.querySelector<HTMLDivElement>(".hover-label")
            if (!lbl) return
            lbl.style.transition = "color 150ms ease,transform 150ms ease"
            lbl.classList.remove("visible")
            setTimeout(() => {
                lbl.style.transition = "none"
                lbl.style.transform = `translate(${S.labelOffsetX}px,${S.labelOffsetY}px)`
            }, 160)
        }

        function hideAllLabels() {
            wraps.forEach((w) => hideLabel(w))
        }

        function setHoverTransitions() {
            const e = makeEase(S.spring),
                d = S.speed + "ms"
            const cd = S.labelDelay < 0 ? Math.abs(S.labelDelay) + "ms" : "0ms"
            const t = `width ${d} ${e} ${cd},min-width ${d} ${e} ${cd},max-width ${d} ${e} ${cd}`
            wraps.forEach((w) => {
                w.style.transition = t
            })
        }

        // ── Click modes ─────────────────────────────────────────────
        function doFillClick(wrap: HTMLDivElement) {
            const total = st.lockedWidth !== null ? st.lockedWidth : st.L.nameW
            const availW = total - S.stripGap * (wraps.length - 1)
            const e = makeEase(S.spring),
                dur = S.clickSpeed + "ms"
            const t = `width ${dur} ${e},min-width ${dur} ${e},max-width ${dur} ${e}`
            wraps.forEach((w) => {
                w.style.transition = t
                const wd = w === wrap ? availW : 0
                w.style.width = w.style.minWidth = w.style.maxWidth = wd + "px"
            })
            setTimeout(() => {
                setActive(wrap.dataset.page!)
                st.hoveredWrap = null
                hideAllLabels()
                setHoverTransitions()
                applyWidths(null)
            }, S.clickSpeed + 60)
        }

        // ── Glitch ──────────────────────────────────────────────────
        function clearGlitchTimers() {
            st.glitchTimers.forEach(clearTimeout)
            st.glitchTimers = []
        }

        function glitchForward() {
            st.glitched = true
            st.lockedWidth = st.L.nameW
            applyWidths(null, st.lockedWidth)
            const dest =
                PAGES.find((p) => p.id === st.activePage)?.color ?? "#fff"
            const dur = S.glitchDur

            const nF = [
                { t: 0.0, text: "mark woloschuk", corr: 0.7, phase: 0.0 },
                { t: 0.1, text: "марк волощук", corr: 0.6, phase: 0.2 },
                { t: 0.2, text: "mark woloschuk", corr: 0.7, phase: 0.35 },
                { t: 0.32, text: "штука", corr: 0.5, phase: 0.5 },
                { t: 0.44, text: "штуки", corr: 0.4, phase: 0.62 },
                { t: 0.56, text: "sh█ooky", corr: 0.3, phase: 0.74 },
                { t: 0.68, text: "shtooky", corr: 0.15, phase: 0.84 },
                { t: 0.8, text: "sh▓oky", corr: 0.08, phase: 0.92 },
                { t: 1.0, text: "shtooky", corr: 0.0, phase: 1.0 },
            ]

            nF.forEach((f) => {
                st.glitchTimers.push(
                    setTimeout(() => {
                        const txt =
                            f.corr === 0 ? f.text : corrupt(f.text, f.corr)
                        spanifyName(navName, txt, nameColorFn(f.phase, dest))
                    }, f.t * dur)
                )
            })

            st.glitchTimers.push(
                setTimeout(
                    () => {
                        runCarousel(
                            S.titleText,
                            S.shtookyTitle,
                            st.L.titleFs,
                            st.L.normalTracking,
                            st.L.shtookyTracking
                        )
                    },
                    dur * (S.carouselDelay / 100)
                )
            )

            st.glitchTimers.push(
                setTimeout(() => {
                    setNameText(navName, "shtooky", dest)
                    setTimeout(() => {
                        navName.querySelectorAll("span").forEach((sp) => {
                            ;(sp as HTMLElement).style.transition =
                                `color ${S.glitchFade}ms ease`
                            ;(sp as HTMLElement).style.color = "#fff"
                        })
                    }, 40)
                    st.glitched = true
                }, dur + 20)
            )
        }

        function glitchReverse() {
            const dest = "#fff"
            const from =
                PAGES.find((p) => p.id === st.activePage)?.color ?? "#fff"
            const dur = S.glitchDur

            const nF = [
                { t: 0.0, text: "shtooky", corr: 0.7, phase: 1.0 },
                { t: 0.1, text: "sh▓oky", corr: 0.6, phase: 0.9 },
                { t: 0.22, text: "штуки", corr: 0.6, phase: 0.75 },
                { t: 0.34, text: "штука", corr: 0.5, phase: 0.6 },
                { t: 0.46, text: "mark woloschuk", corr: 0.6, phase: 0.5 },
                { t: 0.58, text: "марк волощук", corr: 0.4, phase: 0.35 },
                { t: 0.7, text: "mark woloschuk", corr: 0.25, phase: 0.2 },
                { t: 0.84, text: "mark woloschuk", corr: 0.08, phase: 0.1 },
                { t: 1.0, text: "mark woloschuk", corr: 0.0, phase: 0.0 },
            ]

            nF.forEach((f) => {
                st.glitchTimers.push(
                    setTimeout(() => {
                        const txt =
                            f.corr === 0 ? f.text : corrupt(f.text, f.corr)
                        spanifyName(navName, txt, (ci, total) => {
                            if (f.phase >= 0.8) return from
                            if (f.phase <= 0.1) return "#fff"
                            return Math.random() < 1 - f.phase
                                ? randColor()
                                : from
                        })
                    }, f.t * dur)
                )
            })

            st.glitchTimers.push(
                setTimeout(
                    () => {
                        runCarousel(
                            S.shtookyTitle,
                            S.titleText,
                            st.L.titleFs,
                            st.L.shtookyTracking,
                            st.L.normalTracking
                        )
                    },
                    dur * (S.carouselDelay / 100)
                )
            )

            st.glitchTimers.push(
                setTimeout(() => {
                    st.glitched = false
                    st.lockedWidth = null
                    setNameText(navName, "mark woloschuk", from)
                    applyWidths(null, st.L.nameW)
                    setTimeout(() => {
                        navName.querySelectorAll("span").forEach((sp) => {
                            ;(sp as HTMLElement).style.transition =
                                `color ${S.glitchFade}ms ease`
                            ;(sp as HTMLElement).style.color = "#fff"
                        })
                    }, 40)
                }, dur + 20)
            )
        }

        // ── Opening animation ───────────────────────────────────────
        function playOpenAnimation() {
            const els = [nameWrap, titleWrap, stripsAnchor]
            els.forEach((el) => {
                el.style.transition = "none"
                el.style.opacity = "0"
                el.style.transform = `translateY(${S.openY}px)`
            })
            const ease = "cubic-bezier(0.22,1,0.36,1)"
            const step = S.openDur * (1 - S.openStagger / 100)
            els.forEach((el, i) => {
                setTimeout(
                    () => {
                        el.style.transition = `opacity ${S.openDur}ms ${ease},transform ${S.openDur}ms ${ease}`
                        el.style.opacity = "1"
                        el.style.transform = "translateY(0px)"
                    },
                    S.openDelay + i * step
                )
            })
        }

        // ── Wire up events ──────────────────────────────────────────
        nameWrap.addEventListener("click", (e) => {
            e.stopPropagation()
            clearGlitchTimers()
            st.glitched ? glitchReverse() : glitchForward()
        })

        wraps.forEach((wrap) => {
            wrap.addEventListener("mouseenter", () => {
                st.hoveredWrap = wrap
                applyWidths(wrap)
                showLabel(wrap)
            })
            wrap.addEventListener("mouseleave", () => {
                st.hoveredWrap = null
                applyWidths(null)
                hideLabel(wrap)
            })
            wrap.addEventListener("click", (e) => {
                e.preventDefault()
                const targetPage = wrap.dataset.page!
                if (targetPage === st.activePage) return
                hideLabel(wrap)
                doFillClick(wrap)
                setTimeout(() => {
                router.push(wrap.getAttribute("href")!)
                }, S.clickSpeed + 80)
            })
        })

        // ── Init ────────────────────────────────────────────────────
        setActive(activePage)
        updateHitAreas()
        updateNameHit()
        stripsRow.style.gap = S.stripGap + "px"

        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                applyLayout()
                setHoverTransitions()
                const hasVisited =
                    typeof window !== "undefined" &&
                    sessionStorage.getItem("navOpened")
                if (!hasVisited) {
                    if (typeof window !== "undefined")
                        sessionStorage.setItem("navOpened", "1")
                    playOpenAnimation()
                } else {
                    // Skip animation — snap to final state
                    const els = [nameWrap, titleWrap, stripsAnchor]
                    els.forEach((el) => {
                        el.style.transition = "none"
                        el.style.opacity = "1"
                        el.style.transform = "translateY(0px)"
                    })
                }
            })
        )

        const onResize = () => {
            if (!st.glitched) applyLayout()
        }
        window.addEventListener("resize", onResize)

        return () => {
            window.removeEventListener("resize", onResize)
            clearGlitchTimers()
            if (ms.parentNode) ms.parentNode.removeChild(ms)
        }
    }, [])

    // ── Render ───────────────────────────────────────────────────
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "auto",
                zIndex: 38,
            }}
        >
            <span
                ref={msRef}
                style={{
                    position: "absolute",
                    top: -9999,
                    left: -9999,
                    visibility: "hidden",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                }}
            />
            {/* NAV GRADIENT — commented out v36, replaced by ScrollConfig.tsx
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 180,
                    background:
                        "linear-gradient(to bottom,rgba(13,13,13,0.82) 0%,transparent 100%)",
                    pointerEvents: "none",
                    zIndex: 39,
                }}
            />
            */}
            {/*}
            <div
                ref={colorBarRef}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: NAV.colorBarWidth,
                    height: "100vh",
                    zIndex: 38,
                    background: COLORS.welcome,
                    transition: "background 0.4s ease",
                }}
            />
            */}
            <nav
                ref={navRef}
                style={{
                    position: "fixed",
                    // Adjust spacing here
                    top: "2.4vw",
                    left: "2.5vw",
                    zIndex: 40,
                }}
            >
                <div
                    ref={nameWrapRef}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        overflow: "hidden",
                        cursor: "pointer",
                        userSelect: "none",
                        opacity: 0,
                        transform: "translateY(12px)",
                        paddingRight: 6,
                    }}
                >
                    <span
                        ref={navNameRef}
                        style={{
                            fontFamily: FONT_DISPLAY,
                            fontWeight: 700,
                            letterSpacing: "-0.01em",
                            color: "#fff",
                            lineHeight: 1,
                            textTransform: "lowercase",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            display: "block",
                            textAlign: "left",
                        }}
                    />
                    <span
                        ref={navNameOverRef}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            fontFamily: FONT_DISPLAY,
                            fontWeight: 700,
                            letterSpacing: "-0.01em",
                            lineHeight: 1,
                            textTransform: "lowercase",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            display: "block",
                            textAlign: "left",
                            opacity: 0,
                        }}
                    />
                </div>
                <div
                    ref={titleWrapRef}
                    style={{
                        position: "absolute",
                        left: 0,
                        overflow: "hidden",
                        opacity: 0,
                        transform: "translateY(12px)",
                    }}
                >
                    <span
                        ref={navTitleRef}
                        style={{
                            fontFamily: FONT_DISPLAY,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.55)",
                            textTransform: "uppercase",
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            display: "block",
                            position: "relative",
                        }}
                    />
                </div>
                <div
                    ref={stripsAnchorRef}
                    style={{
                        position: "absolute",
                        left: 0,
                        opacity: 0,
                        transform: "translateY(12px)",
                    }}
                >
                    <div
                        ref={stripsRowRef}
                        style={{
                            display: "flex",
                            gap: 0,
                            position: "relative",
                        }}
                    >
                        {PAGES.map((page) => (
                            <Link
                                key={page.id}
                                className="strip-wrap"
                                href={page.url}
                                data-page={page.id}
                                style={{
                                    position: "relative",
                                    flexShrink: 0,
                                    textDecoration: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    className="strip"
                                    data-page={page.id}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: 4,
                                        borderRadius: 1,
                                        cursor: "pointer",
                                        background: page.color,
                                        textDecoration: "none",
                                        pointerEvents: "auto",
                                    }}
                                />
                                <div
                                    className="hover-label"
                                    style={{
                                        position: "absolute",
                                        fontSize: 9,
                                        fontWeight: 600,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        color: "rgba(255,255,255,0)",
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                        fontFamily: FONT_DISPLAY,
                                    }}
                                >
                                    {page.label}
                                </div>
                            </Link> 
                        ))}
                    </div>
                </div>
            </nav>
            <style>{`
        .strip-wrap::before,.strip-wrap::after{content:'';position:absolute;left:0;right:0;pointer-events:auto;}
        .strip-wrap::before{bottom:100%;height:10px;}
        .strip-wrap::after{top:100%;height:20px;}
        .hover-label.visible{color:rgba(255,255,255,0.7)!important;}
        .title-word{display:inline-block;position:absolute;top:0;white-space:pre;}
      `}</style>
        </div>
    )
}
