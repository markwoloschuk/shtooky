'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';
import Lottie from 'lottie-react';
import { getColumn, NAV } from './Tokens';

// ── Tunable constants ────────────────────────────────────────────────────
export const CONFIG = {
  ANIMATION_PATH: '/animations/thinking-open.json',
  LOOP: false,           // plays once on load/reload, parks on the last frame
  NATIVE_W: 1440,         // comp width, px — the animation's own coordinate space
  NATIVE_H: 440,          // comp height, px

  SCALE: 0.75,            // rendered size as a fraction of the 76% content column's width
  ANCHOR_X: 500,           // px, within the comp — the point that stays pinned in place
  ANCHOR_Y: 248.84,        // px, within the comp — was 220 (see note below)
  Y_NUDGE: 0,              // small manual px offset on top of the anchor's vertical placement

  // The 220 above was the comp's geometric vertical midline — never a
  // deliberate choice, just half of 440. Measured via svg.getBBox() in
  // DevTools, the artwork's real bounds are y=135.12 to y=362.56 — its
  // own true center is 248.84. Anchoring on 220 left more empty space
  // above the text (135.12px) than below it (77.44px), which is why the
  // top gap looked oversized even after the bottom gap got fixed.
  // Anchoring on the artwork's real center splits it evenly instead.
  CONTENT_TOP_Y: 135.12,    // px — artwork's measured top edge
  CONTENT_BOTTOM_Y: 362.56, // px — artwork's measured bottom edge, read by ThinkBlurb.tsx
  TOP_MARGIN: 150,        // px — breathing room BELOW the fixed nav, not from the page's true top (nav is position:fixed, out of flow)
  SAFE_LEFT_INSET: 0,     // vw — true anchor-pinned-to-edge position; confirmed no clipping issue

  // Burst origin — the dot of the "i", within the comp's own coordinate space
  BURST_X: 621,
  BURST_Y: 148,
  BURST_FRAME: 14,        // Lottie frame number that triggers the burst

  // Flash — outer pop. All sizes below are authored in the comp's native
  // px space (same space the "How I think" text itself lives in), then
  // converted to vw via pxToVw at render time — this is what makes the
  // whole burst scale correctly relative to the text at any SCALE value.
  FLASH_OUTER_SIZE: 1200,
  FLASH_OUTER_FALLOFF: 60,  // %  — larger = softer/more gradual edge
  // Flash — inner hot core, layered on top
  FLASH_INNER_SIZE: 300,
  FLASH_INNER_FALLOFF: 50,
  // Flash — timing (shared by both layers)
  FLASH_POP_MS: 20,
  FLASH_FADE_MS: 900,
  FLASH_BRIGHTNESS: 1.0,
  FLASH_BLEND_SCREEN: true, // mix-blend-mode: screen — CSS approximation of Add mode

  // Particles — flight physics. Each particle gets its own random speed
  // and drag, integrated continuously per frame — not shared retargeting,
  // which is what caused particles to visibly synchronize in earlier
  // passes. Sizes/distances are native-px, converted via pxToVw; ms values
  // (birth stagger, lifespans, durations) are real time, NOT scaled.
  PARTICLE_COUNT: 60,
  PARTICLE_SCATTER_RADIUS: 10,     // px, native — spawn-position jitter
  PARTICLE_MIN_SPEED: 6,           // px/s, native
  PARTICLE_MAX_SPEED: 90,
  PARTICLE_MIN_DRAG: 0.20,         // fraction/s, independent per particle
  PARTICLE_MAX_DRAG: 0.80,
  PARTICLE_BIRTH_STAGGER: 50,      // ms
  PARTICLE_MIN_SIZE: 1,            // px, native
  PARTICLE_MAX_SIZE: 5,
  PARTICLE_MIN_LIFESPAN: 350,      // ms
  PARTICLE_MAX_LIFESPAN: 2500,
  PARTICLE_DEATH_FADE_PORTION: 0.20, // fraction of lifespan spent fading out
  PARTICLE_DEATH_SHRINK: 0.70,       // fraction shrunk by, at death
  PARTICLE_GLOW: 5,                // px, native — box-shadow blur radius
};

// Anchor expressed as a % of the comp's own box — this is what makes the
// placement scale-independent. translate() percentages resolve against the
// TRANSFORMED ELEMENT'S OWN size, not its parent's, so shifting by
// -ANCHOR_X_PCT/-ANCHOR_Y_PCT always lands the anchor point at the box's
// left/top (0,0) regardless of what SCALE currently is.
const ANCHOR_X_PCT = (CONFIG.ANCHOR_X / CONFIG.NATIVE_W) * 100;
const ANCHOR_Y_PCT = (CONFIG.ANCHOR_Y / CONFIG.NATIVE_H) * 100;

// Burst placement as a % of the comp box — resolves fine as a plain
// percentage since its containing block (the inner comp box) has a real,
// definite width. Everything INSIDE the burst group (flash, particles)
// doesn't get that luxury (their containing block is a zero-size anchor
// point), so those are expressed in vw via pxToVw instead.
const BURST_X_PCT = (CONFIG.BURST_X / CONFIG.NATIVE_W) * 100;
const BURST_Y_PCT = (CONFIG.BURST_Y / CONFIG.NATIVE_H) * 100;

function buildGradient(falloffPct: number): string {
  return `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 8%, rgba(255,255,255,0) ${falloffPct}%)`;
}

interface Particle {
  x: number;            // vw, relative to burst origin
  y: number;
  vx: number;            // vw/sec
  vy: number;
  drag: number;          // fraction/sec, unitless — not scaled by pxToVw
  birthTime: number;     // performance.now() ms
  lifespan: number;      // ms
  el: HTMLDivElement | null;
}

export default function ThinkOpenAnimation() {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const burstFiredRef = useRef(false);
  const flashOuterRef = useRef<HTMLDivElement>(null);
  const flashInnerRef = useRef<HTMLDivElement>(null);
  const burstGroupRef = useRef<HTMLDivElement>(null);
  const particleElRefs = useRef<(HTMLDivElement | null)[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const particleRAF = useRef<number | null>(null);
  const lastFrameTime = useRef(0);

  const col = getColumn();
  const pxToVw = (col.vw * CONFIG.SCALE) / CONFIG.NATIVE_W;

  useEffect(() => {
    let cancelled = false;
    fetch(CONFIG.ANIMATION_PATH)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch((err) => {
        console.error('Failed to load thinking-open animation:', err);
      });
    return () => {
      cancelled = true;
      if (particleRAF.current) cancelAnimationFrame(particleRAF.current);
    };
  }, []);

  // ── Flash: two-layer pop, same double-stage JS-driven transition as the
  // rest of this project's animations (transition:none -> rAF -> real
  // transition), applied to both layers together. ──────────────────────
  function fireFlash() {
    const outerW = CONFIG.FLASH_OUTER_SIZE * pxToVw;
    const innerW = CONFIG.FLASH_INNER_SIZE * pxToVw;

    const layers: [HTMLDivElement | null, number, number][] = [
      [flashOuterRef.current, outerW, CONFIG.FLASH_OUTER_FALLOFF],
      [flashInnerRef.current, innerW, CONFIG.FLASH_INNER_FALLOFF],
    ];

    layers.forEach(([el, sizeVw, falloff]) => {
      if (!el) return;
      el.style.background = buildGradient(falloff);
      el.style.transition = 'none';
      el.style.width = `${sizeVw}vw`;
      el.style.height = `${sizeVw}vw`;
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, -50%) scale(0.2)';
    });

    requestAnimationFrame(() => {
      layers.forEach(([el]) => {
        if (!el) return;
        el.style.transition = `opacity ${CONFIG.FLASH_POP_MS}ms ease-out, transform ${CONFIG.FLASH_POP_MS}ms ease-out`;
        el.style.opacity = String(CONFIG.FLASH_BRIGHTNESS);
        el.style.transform = 'translate(-50%, -50%) scale(1)';
        setTimeout(() => {
          el.style.transition = `opacity ${CONFIG.FLASH_FADE_MS}ms ease-in`;
          el.style.opacity = '0';
        }, CONFIG.FLASH_POP_MS);
      });
    });
  }

  // ── Particles: real physics, one shared rAF loop. Each particle is a
  // plain object with its own position/velocity/drag/lifespan, integrated
  // via actual delta-time every frame — not discrete CSS-transition
  // retargeting, which is what caused earlier passes to visibly
  // synchronize (every particle re-targeting on the same shared tick). ──
  function spawnParticles() {
    const now = performance.now();
    const scatterRadiusVw = CONFIG.PARTICLE_SCATTER_RADIUS * pxToVw;
    const minSpeedVw = CONFIG.PARTICLE_MIN_SPEED * pxToVw;
    const maxSpeedVw = CONFIG.PARTICLE_MAX_SPEED * pxToVw;
    const minSizeVw = CONFIG.PARTICLE_MIN_SIZE * pxToVw;
    const maxSizeVw = CONFIG.PARTICLE_MAX_SIZE * pxToVw;
    const glowVw = CONFIG.PARTICLE_GLOW * pxToVw;

    particlesRef.current = Array.from({ length: CONFIG.PARTICLE_COUNT }, (_, i) => {
      const scatterAngle = Math.random() * Math.PI * 2;
      const scatterDist = Math.random() * scatterRadiusVw;
      const flightAngle = Math.random() * Math.PI * 2;
      const speed = minSpeedVw + Math.random() * Math.max(0, maxSpeedVw - minSpeedVw);
      const drag = CONFIG.PARTICLE_MIN_DRAG + Math.random() * (CONFIG.PARTICLE_MAX_DRAG - CONFIG.PARTICLE_MIN_DRAG);
      const size = minSizeVw + Math.random() * Math.max(0, maxSizeVw - minSizeVw);
      const lifespan = CONFIG.PARTICLE_MIN_LIFESPAN + Math.random() * (CONFIG.PARTICLE_MAX_LIFESPAN - CONFIG.PARTICLE_MIN_LIFESPAN);
      const birthTime = now + Math.random() * CONFIG.PARTICLE_BIRTH_STAGGER;

      const el = particleElRefs.current[i];
      if (el) {
        el.style.width = `${size}vw`;
        el.style.height = `${size}vw`;
        el.style.boxShadow = glowVw > 0
          ? `0 0 ${glowVw}vw ${Math.max(0.05, glowVw / 3)}vw rgba(255,255,255,0.8)`
          : 'none';
        el.style.opacity = '0';
      }

      return {
        x: Math.cos(scatterAngle) * scatterDist,
        y: Math.sin(scatterAngle) * scatterDist,
        vx: Math.cos(flightAngle) * speed,
        vy: Math.sin(flightAngle) * speed,
        drag,
        birthTime,
        lifespan,
        el,
      };
    });

    lastFrameTime.current = now;
    particleRAF.current = requestAnimationFrame(stepParticles);
  }

  function stepParticles(t: number) {
    const dt = Math.min(0.05, (t - lastFrameTime.current) / 1000);
    lastFrameTime.current = t;
    let anyAlive = false;

    particlesRef.current.forEach((p) => {
      if (!p.el) return;
      if (t < p.birthTime) { anyAlive = true; return; }

      const age = t - p.birthTime;
      if (age >= p.lifespan) return;
      anyAlive = true;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const decay = Math.pow(1 - p.drag, dt);
      p.vx *= decay;
      p.vy *= decay;

      const lifeFrac = age / p.lifespan;
      const fadeInMs = Math.min(120, p.lifespan * 0.15);
      let opacity: number;
      let scale: number;

      if (age < fadeInMs) {
        const f = age / fadeInMs;
        opacity = f;
        scale = 0.5 + 0.5 * f;
      } else if (lifeFrac > 1 - CONFIG.PARTICLE_DEATH_FADE_PORTION) {
        const d = (lifeFrac - (1 - CONFIG.PARTICLE_DEATH_FADE_PORTION)) / CONFIG.PARTICLE_DEATH_FADE_PORTION;
        opacity = 1 - d;
        scale = 1 - d * CONFIG.PARTICLE_DEATH_SHRINK;
      } else {
        opacity = 1;
        scale = 1;
      }

      p.el.style.opacity = String(Math.max(0, opacity));
      p.el.style.transform = `translate(calc(-50% + ${p.x}vw), calc(-50% + ${p.y}vw)) scale(${Math.max(0, scale)})`;
    });

    if (anyAlive) {
      particleRAF.current = requestAnimationFrame(stepParticles);
    } else {
      particleRAF.current = null;
    }
  }

  // Fire once, driven by the animation's own actual frame position — not a
  // guessed ms delay — so it stays correct if the animation is retimed.
  // Typed off Lottie's own onEnterFrame prop rather than a hand-rolled
  // shape: lottie-react's real event union includes several event types
  // (and `undefined`) that don't carry currentTime at all — that mismatch
  // is exactly what the build's typecheck caught.
  type EnterFrameHandler = NonNullable<ComponentProps<typeof Lottie>['onEnterFrame']>;
  const handleEnterFrame: EnterFrameHandler = (e) => {
    if (!e || !('currentTime' in e)) return;
    if (!burstFiredRef.current && e.currentTime >= CONFIG.BURST_FRAME) {
      burstFiredRef.current = true;
      if (burstGroupRef.current) {
        burstGroupRef.current.style.mixBlendMode = CONFIG.FLASH_BLEND_SCREEN ? 'screen' : 'normal';
      }
      fireFlash();
      spawnParticles();
    }
  };

  if (!animationData) return null;

  return (
    <div
      data-debug="think-outer"
      style={{
        position: 'relative',
        width: `${col.vw}vw`,
        margin: `${NAV.height + CONFIG.TOP_MARGIN}px auto 0`,
        aspectRatio: `${CONFIG.NATIVE_W} / ${CONFIG.NATIVE_H}`,
        overflow: 'visible',
      }}
    >
<div
        data-debug="think-inner"
        style={{
          position: 'absolute',
          left: `${CONFIG.SAFE_LEFT_INSET}vw`,
          // 50% + Y_NUDGE, not just Y_NUDGE: the 50% is what makes the
          // translateY(-50%) below actually centered vertically in the
          // reserved box (classic top:50%/translate(-50%) pairing).
          // Y_NUDGE was always meant as a fine-tune on top of that
          // center point, not the box's whole vertical position.
          top: `calc(50% + ${CONFIG.Y_NUDGE}px)`,
          width: `${CONFIG.SCALE * 100}%`,
          aspectRatio: `${CONFIG.NATIVE_W} / ${CONFIG.NATIVE_H}`,
          transform: `translate(-${ANCHOR_X_PCT}%, -${ANCHOR_Y_PCT}%)`,
        }}
      >
        <Lottie
          animationData={animationData}
          loop={CONFIG.LOOP}
          autoplay
          onEnterFrame={handleEnterFrame}
        />

        {/* Burst layer — always rendered (not conditionally mounted), just
            invisible until fireFlash/spawnParticles trigger at frame 14.
            This is a one-shot lifetime event; no need for React state to
            drive mount/unmount cycling for something that fires once. */}
        <div
          ref={burstGroupRef}
          style={{
            position: 'absolute',
            left: `${BURST_X_PCT}%`,
            top: `${BURST_Y_PCT}%`,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
        >
          <div
            ref={flashOuterRef}
            style={{ position: 'absolute', left: 0, top: 0, borderRadius: '50%', opacity: 0 }}
          />
          <div
            ref={flashInnerRef}
            style={{ position: 'absolute', left: 0, top: 0, borderRadius: '50%', opacity: 0 }}
          />

          {Array.from({ length: CONFIG.PARTICLE_COUNT }).map((_, i) => (
            <div
              key={i}
              ref={(el) => { particleElRefs.current[i] = el; }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                borderRadius: '50%',
                background: '#fff',
                opacity: 0,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}