/**
 * GlowingEdgeCard
 * Adapted from TSX to plain JSX.
 * Card bg re-themed to paper/forest palette.
 * Glow color softened to a warm cream for light mode.
 */

import { useEffect, useRef, useState } from 'react';

export function GlowingEdgeCard({
  mode = 'light',
  className = '',
  children,
  style = {},
  ...props
}) {
  const cardRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // ── Math helpers ────────────────────────────────────────────────────────────
  const round  = (v, p = 3) => parseFloat(v.toFixed(p));
  const clamp  = (v, mn = 0, mx = 100) => Math.min(Math.max(v, mn), mx);

  const centerOf = (rect) => [rect.width / 2, rect.height / 2];

  const pointerPos = (rect, e) => {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      pixels:  [x, y],
      percent: [clamp((100 / rect.width) * x), clamp((100 / rect.height) * y)],
    };
  };

  const angleFrom = (dx, dy) => {
    if (dx === 0 && dy === 0) return 0;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    return deg;
  };

  const edgeCloseness = (rect, x, y) => {
    const [cx, cy] = centerOf(rect);
    const dx = x - cx, dy = y - cy;
    const kx = dx !== 0 ? cx / Math.abs(dx) : Infinity;
    const ky = dy !== 0 ? cy / Math.abs(dy) : Infinity;
    return clamp(1 / Math.min(kx, ky), 0, 1);
  };

  // ── Pointer tracking ─────────────────────────────────────────────────────────
  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const { pixels: [px, py], percent: [perx, pery] } = pointerPos(rect, e);
    const [cx, cy] = centerOf(rect);
    const edge  = edgeCloseness(rect, px, py);
    const angle = angleFrom(px - cx, py - cy);

    cardRef.current.style.setProperty('--pointer-x',   `${round(perx)}%`);
    cardRef.current.style.setProperty('--pointer-y',   `${round(pery)}%`);
    cardRef.current.style.setProperty('--pointer-deg', `${round(angle)}deg`);
    cardRef.current.style.setProperty('--pointer-d',   `${round(edge * 100)}`);

    if (isAnimating) {
      setIsAnimating(false);
      cardRef.current.classList.remove('animating');
    }
  };

  // ── Intro animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cardRef.current) return;
      setIsAnimating(true);
      cardRef.current.classList.add('animating');

      const start = performance.now();
      const aStart = 110, aEnd = 465;
      cardRef.current.style.setProperty('--pointer-deg', `${aStart}deg`);

      const animate = (now) => {
        if (!cardRef.current || !cardRef.current.classList.contains('animating')) return;
        const t = now - start;

        // Phase 1: glow in
        if (t > 500 && t < 1000) {
          const p = (t - 500) / 500;
          cardRef.current.style.setProperty('--pointer-d', `${(1 - Math.pow(1 - p, 3)) * 100}`);
        }
        // Phase 2: rotate first half
        if (t > 500 && t < 2000) {
          const p = (t - 500) / 1500;
          const d = (aEnd - aStart) * (p * p * p * 0.5) + aStart;
          cardRef.current.style.setProperty('--pointer-deg', `${d}deg`);
        }
        // Phase 3: rotate second half
        if (t >= 2000 && t < 4250) {
          const p = (t - 2000) / 2250;
          const d = (aEnd - aStart) * (0.5 + (1 - Math.pow(1 - p, 3)) * 0.5) + aStart;
          cardRef.current.style.setProperty('--pointer-deg', `${d}deg`);
        }
        // Phase 4: glow out
        if (t > 3000 && t < 4500) {
          const p = (t - 3000) / 1500;
          cardRef.current.style.setProperty('--pointer-d', `${(1 - p * p * p) * 100}`);
        }

        if (t < 4500) requestAnimationFrame(animate);
        else {
          setIsAnimating(false);
          cardRef.current?.classList.remove('animating');
        }
      };

      requestAnimationFrame(animate);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // ── Theme values ─────────────────────────────────────────────────────────────
  const cardBg = mode === 'light'
    ? 'linear-gradient(8deg, #EEEEE9 75%, #F7F7F5 75.5%)'
    : 'linear-gradient(8deg, #0f1a14 75%, #162b1e 75.5%)';

  const cssVars = {
    '--glow-sens':   '30',
    '--pointer-x':   '50%',
    '--pointer-y':   '50%',
    '--pointer-deg': '45deg',
    '--pointer-d':   '0',
    '--color-sens':  'calc(var(--glow-sens) + 20)',
    '--card-bg':     cardBg,
    '--blend':       mode === 'light' ? 'darken'       : 'soft-light',
    '--glow-blend':  mode === 'light' ? 'luminosity'   : 'plus-lighter',
    // forest-warm cream glow in light mode
    '--glow-color':  mode === 'light' ? '145deg 55% 70%' : '40deg 80% 80%',
    '--glow-boost':  mode === 'light' ? '10%' : '0%',
    '--fg':          mode === 'light' ? '#1A3C2B' : '#F7F7F5',
  };

  return (
    <div
      ref={cardRef}
      className={`gec-root relative flex flex-col group transition-colors duration-300 ${className}`}
      style={{ ...cssVars, ...style }}
      onPointerMove={handlePointerMove}
      {...props}
    >
      {/* ── Injected CSS for pseudo-element glow layers ───────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .gec-root { border-radius: 14px; }

        /* Mesh gradient border */
        .gec-mesh-border {
          position: absolute; inset: 0; border-radius: inherit; z-index: 0;
          border: 1px solid transparent;
          background:
            linear-gradient(var(--card-bg) 0 100%) padding-box,
            linear-gradient(rgb(255 255 255 / 0%) 0 100%) border-box,
            radial-gradient(at 80% 55%, hsla(268,100%,76%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 69% 34%, hsla(349,100%,74%,1) 0px, transparent 50%) border-box,
            radial-gradient(at  8%  6%, hsla(136,100%,78%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 41% 38%, hsla(192,100%,64%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 86% 85%, hsla(186,100%,74%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 82% 18%, hsla( 52,100%,65%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 51%  4%, hsla( 12,100%,72%,1) 0px, transparent 50%) border-box,
            linear-gradient(#c299ff 0 100%) border-box;
          opacity: calc((var(--pointer-d) - var(--color-sens)) / (100 - var(--color-sens)));
          mask-image: conic-gradient(from var(--pointer-deg) at center, black 25%, transparent 40%, transparent 60%, black 75%);
          transition: opacity 0.25s ease-out;
        }

        /* Mesh gradient background blended overlay */
        .gec-mesh-bg {
          position: absolute; inset: 0; border-radius: inherit; z-index: 0;
          border: 1px solid transparent;
          background:
            radial-gradient(at 80% 55%, hsla(268,100%,76%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 69% 34%, hsla(349,100%,74%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at  8%  6%, hsla(136,100%,78%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 41% 38%, hsla(192,100%,64%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 86% 85%, hsla(186,100%,74%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 82% 18%, hsla( 52,100%,65%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 51%  4%, hsla( 12,100%,72%,1) 0px, transparent 50%) padding-box,
            linear-gradient(#c299ff 0 100%) padding-box;
          mask-image:
            linear-gradient(to bottom, black, black),
            radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%),
            radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%),
            radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%),
            radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%),
            radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%),
            conic-gradient(from var(--pointer-deg) at center, transparent 5%, black 15%, black 85%, transparent 95%);
          mask-composite: subtract, add, add, add, add, add, add;
          opacity: calc((var(--pointer-d) - var(--color-sens)) / (100 - var(--color-sens)));
          mix-blend-mode: var(--blend);
          transition: opacity 0.25s ease-out;
        }

        /* Outer glow layer */
        .gec-glow {
          position: absolute; inset: -32px; pointer-events: none; z-index: 1;
          mask-image: conic-gradient(from var(--pointer-deg) at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%);
          opacity: calc((var(--pointer-d) - var(--glow-sens)) / (100 - var(--glow-sens)));
          mix-blend-mode: var(--glow-blend);
          transition: opacity 0.25s ease-out;
          border-radius: inherit;
        }
        .gec-glow::before {
          content: "";
          position: absolute; inset: 32px; border-radius: inherit;
          box-shadow:
            inset 0 0 0  1px hsl(var(--glow-color) / 100%),
            inset 0 0  1px 0  hsl(var(--glow-color) / calc(var(--glow-boost) + 60%)),
            inset 0 0  3px 0  hsl(var(--glow-color) / calc(var(--glow-boost) + 50%)),
            inset 0 0  6px 0  hsl(var(--glow-color) / calc(var(--glow-boost) + 40%)),
            inset 0 0 15px 0  hsl(var(--glow-color) / calc(var(--glow-boost) + 30%)),
            inset 0 0 25px 2px hsl(var(--glow-color) / calc(var(--glow-boost) + 20%)),
            inset 0 0 50px 2px hsl(var(--glow-color) / calc(var(--glow-boost) + 10%)),
                  0 0  1px 0  hsl(var(--glow-color) / calc(var(--glow-boost) + 60%)),
                  0 0  3px 0  hsl(var(--glow-color) / calc(var(--glow-boost) + 50%)),
                  0 0  6px 0  hsl(var(--glow-color) / calc(var(--glow-boost) + 40%)),
                  0 0 15px 0  hsl(var(--glow-color) / calc(var(--glow-boost) + 30%)),
                  0 0 25px 2px hsl(var(--glow-color) / calc(var(--glow-boost) + 20%)),
                  0 0 50px 2px hsl(var(--glow-color) / calc(var(--glow-boost) + 10%));
        }

        /* Hide all effect layers when not hovering / animating */
        .gec-root:not(:hover):not(.animating) .gec-mesh-border,
        .gec-root:not(:hover):not(.animating) .gec-mesh-bg,
        .gec-root:not(:hover):not(.animating) .gec-glow {
          opacity: 0 !important;
          transition: opacity 0.75s ease-in-out;
        }
      ` }} />

      {/* Effect layers */}
      <div className="gec-mesh-border" />
      <div className="gec-mesh-bg" />
      <div className="gec-glow" />

      {/* Content */}
      <div
        className="relative z-10 w-full h-full overflow-hidden rounded-[inherit]"
        style={{
          background: cardBg,
          border: '1px solid rgba(26,60,43,0.12)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default GlowingEdgeCard;
