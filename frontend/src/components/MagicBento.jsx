/**
 * MagicBento component — re-themed to project palette.
 * Section background: forest (#1A3C2B) — matches the navbar.
 * Cards: glass-effect on forest with mint glow.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';

// ─── Palette ──────────────────────────────────────────────────────────────────
const SECTION_BG  = '#1A3C2B';                   // forest — matches navbar
const CARD_BG     = 'rgba(255,255,255,0.06)';     // glass on forest
const CARD_HOVER  = 'rgba(255,255,255,0.10)';
const PAPER_RGB   = '247, 247, 245';              // off-white paper — replaces mint
const PAPER_HEX   = '#F7F7F5';

const MOBILE_BP   = 768;
const DEF_PARTS   = 12;
const DEF_RADIUS  = 280;
const DEF_GLOW    = PAPER_RGB;

// ─── Platform capability cards ────────────────────────────────────────────────
const cardData = [
  { label: 'Live',          title: 'Real-time Tracking',   description: 'Live incident feed powered by Socket.io — updates stream the moment they happen across every connected client.' },
  { label: 'Gemini AI',     title: 'AI Postmortem',        description: 'Gemini generates root-cause analysis and resolution steps from your incident timeline automatically.' },
  { label: 'Security',      title: 'Role-based Access',    description: 'Admin, Responder, and Viewer roles with JWT-protected routes and bcrypt password hashing.' },
  { label: 'Collaboration', title: 'Timeline Updates',     description: 'Live collaborative timeline — post updates that sync instantly across all open sessions via WebSocket.' },
  { label: 'Performance',   title: 'Smart Caching',        description: 'In-memory TTL cache on incident reads keeps response times in the single-digit milliseconds.' },
  { label: 'Transparency',  title: 'Public Status Page',   description: 'A shareable status page so stakeholders always know what\'s happening — no login required.' },
];

// ─── Particle helpers ─────────────────────────────────────────────────────────
function createParticle(x, y, color = DEF_GLOW) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute;width:3px;height:3px;border-radius:50%;
    background:rgba(${color},0.9);
    box-shadow:0 0 5px rgba(${color},0.5);
    pointer-events:none;z-index:100;left:${x}px;top:${y}px;
  `;
  return el;
}

// ─── ParticleCard ─────────────────────────────────────────────────────────────
function ParticleCard({ children, className = '', disableAnimations = false,
  particleCount = DEF_PARTS, glowColor = DEF_GLOW,
  enableTilt = true, clickEffect = false, enableMagnetism = false }) {

  const cardRef  = useRef(null);
  const parts    = useRef([]);
  const tids     = useRef([]);
  const hovered  = useRef(false);
  const magnAnim = useRef(null);

  const clearParts = useCallback(() => {
    tids.current.forEach(clearTimeout); tids.current = [];
    magnAnim.current?.kill();
    parts.current.forEach(p => gsap.to(p, { scale:0, opacity:0, duration:0.3, ease:'back.in(1.7)', onComplete:()=>p.parentNode?.removeChild(p) }));
    parts.current = [];
  }, []);

  const spawnParts = useCallback(() => {
    if (!cardRef.current || !hovered.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    for (let i = 0; i < particleCount; i++) {
      const tid = setTimeout(() => {
        if (!hovered.current || !cardRef.current) return;
        const p = createParticle(Math.random() * width, Math.random() * height, glowColor);
        cardRef.current.appendChild(p);
        parts.current.push(p);
        gsap.fromTo(p, { scale:0, opacity:0 }, { scale:1, opacity:1, duration:0.3, ease:'back.out(1.7)' });
        gsap.to(p, { x:(Math.random()-0.5)*80, y:(Math.random()-0.5)*80, rotation:Math.random()*360, duration:2+Math.random()*2, ease:'none', repeat:-1, yoyo:true });
      }, i * 80);
      tids.current.push(tid);
    }
  }, [particleCount, glowColor]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const el = cardRef.current;

    const onEnter = () => { hovered.current = true; spawnParts(); };
    const onLeave = () => {
      hovered.current = false; clearParts();
      gsap.to(el, { rotateX:0, rotateY:0, x:0, y:0, duration:0.4, ease:'power2.out' });
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.width/2, cy = r.height/2;
      const px = e.clientX - r.left, py = e.clientY - r.top;
      if (enableTilt) gsap.to(el, { rotateX:((py-cy)/cy)*-7, rotateY:((px-cx)/cx)*7, duration:0.1, ease:'power2.out', transformPerspective:1000 });
      if (enableMagnetism) magnAnim.current = gsap.to(el, { x:(px-cx)*0.04, y:(py-cy)*0.04, duration:0.3, ease:'power2.out' });
    };
    const onClick = (e) => {
      if (!clickEffect) return;
      const r = el.getBoundingClientRect();
      const ripple = document.createElement('div');
      ripple.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;background:rgba(${glowColor},0.45);left:${e.clientX-r.left}px;top:${e.clientY-r.top}px;pointer-events:none;z-index:1000;`;
      el.appendChild(ripple);
      gsap.fromTo(ripple, { scale:0, opacity:1 }, { scale:45, opacity:0, duration:0.7, ease:'power2.out', onComplete:()=>ripple.remove() });
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('click', onClick);
      clearParts();
    };
  }, [spawnParts, clearParts, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return (
    <div ref={cardRef} className={className} style={{ position:'relative', overflow:'hidden' }}>
      {children}
    </div>
  );
}

// ─── MagicBento ───────────────────────────────────────────────────────────────
export function MagicBento({
  cardData: propCardData,   // optional override
  textAutoHide    = false,
  enableStars     = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEF_RADIUS,
  particleCount   = DEF_PARTS,
  enableTilt      = true,
  glowColor       = DEF_GLOW,
  clickEffect     = true,
  enableMagnetism = true,
}) {
  // Use passed-in cards or fall back to the built-in platform cards
  const cards = propCardData || cardData;
  const gridRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BP);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const noAnim = disableAnimations || isMobile;

  // Spotlight tracking
  useEffect(() => {
    if (!enableSpotlight || noAnim) return;
    const onMove = (e) => {
      if (!gridRef.current) return;
      gridRef.current.querySelectorAll('.mb-card').forEach(card => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
        card.style.setProperty('--sr', `${spotlightRadius}px`);
        card.style.setProperty('--gc', `rgba(${glowColor},0.15)`);
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [enableSpotlight, noAnim, spotlightRadius, glowColor]);

  const cardInner = (card) => (
    <div className="mb-card h-full w-full p-5 flex flex-col justify-between group">
      <div className="mb-spotlight" />
      {enableBorderGlow && <div className="mb-border-glow" />}

      {/* Label */}
      <span
        className="font-mono text-[9px] uppercase tracking-[0.18em] mb-2 block"
        style={{ color: `rgba(${PAPER_RGB}, 0.5)` }}
      >
        {card.label}
      </span>

      {/* Title */}
      <h3
        className="text-base font-bold leading-tight mb-3 font-display"
        style={{ color: PAPER_HEX }}
      >
        {card.title}
      </h3>

      {/* Description */}
      <p
        className={`text-xs leading-relaxed ${textAutoHide ? 'line-clamp-2' : ''}`}
        style={{ color: 'rgba(247,247,245,0.5)' }}
      >
        {card.description}
      </p>
    </div>
  );

  return (
    <section style={{ background: SECTION_BG, borderRadius: '8px', overflow: 'hidden' }}>
      {/* Injected styles */}
      <style>{`
        .mb-grid {
          display: grid;
          gap: 0.75rem;
          width: 100%;
          padding: 1.75rem;
        }
        @media (min-width: 640px)  { .mb-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) {
          .mb-grid {
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(2, 160px);
          }
          .mb-c0 { grid-column: span 2; }
          .mb-c1 { grid-column: span 1; }
          .mb-c2 { grid-column: span 1; }
          .mb-c3 { grid-column: span 1; }
          .mb-c4 { grid-column: span 2; }
          .mb-c5 { grid-column: span 1; }
        }
        .mb-card {
          background: ${CARD_BG};
          border: 1px solid rgba(247,247,245,0.08);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          transition: background 0.25s ease, border-color 0.25s ease;
        }
        .mb-card:hover {
          background: ${CARD_HOVER};
          border-color: rgba(${glowColor}, 0.25);
        }
        .mb-spotlight {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(var(--sr,280px) circle at var(--mx,50%) var(--my,50%), var(--gc,transparent), transparent 80%);
          opacity: 0; transition: opacity 0.3s ease; border-radius: inherit;
        }
        .mb-card:hover .mb-spotlight { opacity: 1; }
        .mb-border-glow {
          position: absolute; inset: 0; pointer-events: none;
          border-radius: inherit; padding: 1px;
          background: radial-gradient(var(--sr,280px) circle at var(--mx,50%) var(--my,50%), rgba(${glowColor},0.5), transparent 40%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0; transition: opacity 0.3s ease;
        }
        .mb-card:hover .mb-border-glow { opacity: 1; }
      `}</style>

      <div ref={gridRef} className="mb-grid">
        {cards.map((card, i) =>
          enableStars ? (
            <ParticleCard
              key={i}
              className={`mb-c${i}`}
              particleCount={particleCount}
              glowColor={glowColor}
              enableTilt={enableTilt}
              enableMagnetism={enableMagnetism}
              clickEffect={clickEffect}
              disableAnimations={noAnim}
            >
              {cardInner(card)}
            </ParticleCard>
          ) : (
            <div key={i} className={`mb-c${i}`}>
              {cardInner(card)}
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default MagicBento;
