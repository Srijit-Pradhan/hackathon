/**
 * StaggeredMenu.jsx
 *
 * Adapted for the Smart Incident Response Platform.
 * - Design tokens: forest (#1A3C2B), paper (#F7F7F5), grid (#3A3A38), coral, mint
 * - Typography: General Sans (sans), JetBrains Mono (mono), Space Grotesk (display)
 * - Sharp corners to match the project's border-radius: 0 rule
 * - GSAP-powered staggered entrance/exit animations
 * - Replaces the traditional Navbar on LandingPage
 */

import { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * The animated ✕ / plus icon used on the toggle button.
 * Two spans that rotate into a cross when open.
 */
function ToggleIcon({ plusHRef, plusVRef, iconRef }) {
  return (
    <div ref={iconRef} className="relative w-4 h-4 shrink-0">
      <span
        ref={plusHRef}
        className="absolute top-1/2 left-0 w-full bg-current rounded-none -translate-y-1/2"
        style={{ height: '1.5px' }}
      />
      <span
        ref={plusVRef}
        className="absolute top-0 left-1/2 w-0.5 h-full bg-current rounded-none -translate-x-1/2"
      />
    </div>
  );
}

/**
 * Scrolling text ticker inside the toggle button: cycles through
 * 'Menu' → '...' → 'Close' (or reverse).
 */
function ToggleText({ textInnerRef, textLines }) {
  return (
    <div className="relative h-[1.2em] overflow-hidden min-w-[50px] text-left">
      <div
        ref={textInnerRef}
        className="flex flex-col font-mono font-bold uppercase tracking-widest text-xs"
      >
        {textLines.map((line, i) => (
          <span key={i} className="h-[1.2em] leading-tight flex items-center">
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {'left'|'right'} props.position        - Which side the panel slides from
 * @param {string[]}       props.colors           - Stagger layer colors + panel bg (last)
 * @param {object[]}       props.items            - Nav items: { label, ariaLabel, link }
 * @param {object[]}       props.socialItems       - Social items: { label, link }
 * @param {boolean}        props.displaySocials    - Show socials section
 * @param {boolean}        props.displayItemNumbering - Show '01', '02' prefixes
 * @param {string}         props.className
 * @param {React.ReactNode} props.logo            - Logo node
 * @param {string}         props.menuButtonColor  - Button color when closed
 * @param {string}         props.openMenuButtonColor - Button color when open
 * @param {string}         props.accentColor      - Hover accent color
 * @param {boolean}        props.isFixed          - Fixed to viewport?
 * @param {boolean}        props.closeOnClickAway
 * @param {()=>void}       props.onMenuOpen
 * @param {()=>void}       props.onMenuClose
 */
export function StaggeredMenu({
  position = 'right',
  colors = ['#1A3C2B', '#2d5540', '#F7F7F5'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logo,
  menuButtonColor = '#1A3C2B',
  openMenuButtonColor = '#1A3C2B',
  changeMenuColorOnOpen = false,
  accentColor = '#9EFFBF',
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
}) {
  // ── State & refs ──────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const panelRef = useRef(null);
  const preLayersRef = useRef(null);
  const preLayerElsRef = useRef([]);

  const plusHRef = useRef(null);
  const plusVRef = useRef(null);
  const iconRef = useRef(null);
  const textInnerRef = useRef(null);
  const toggleBtnRef = useRef(null);

  const [textLines, setTextLines] = useState(['Menu', 'Close']);

  const openTlRef = useRef(null);
  const closeTweenRef = useRef(null);
  const spinTweenRef = useRef(null);
  const textCycleAnimRef = useRef(null);
  const colorTweenRef = useRef(null);
  const busyRef = useRef(false);

  // ── Initial GSAP setup ────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;

      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      const preLayers = preContainer
        ? Array.from(preContainer.querySelectorAll('.sm-prelayer'))
        : [];
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen });
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });

      if (toggleBtnRef.current) {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  // ── Open timeline factory ─────────────────────────────────────────────────
  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const layerStates = layers.map((el) => ({
      el,
      start: Number(gsap.getProperty(el, 'xPercent')),
    }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 6 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 20, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.5, ease: 'power4.out' },
        i * 0.07
      );
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 0.9,
          ease: 'power4.out',
          stagger: { each: 0.09, from: 'start' },
        },
        panelInsertTime + panelDuration * 0.15
      );
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) {
        tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: { each: 0.07 } },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, []);

  // ── Play open ─────────────────────────────────────────────────────────────
  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => { busyRef.current = false; });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  // ── Play close ────────────────────────────────────────────────────────────
  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: offscreen,
      duration: 0.35,
      ease: 'power3.in',
      stagger: { each: 0.05, from: 'end' },
      overwrite: 'auto',
      onComplete: () => { busyRef.current = false; },
    });
  }, [position]);

  // ── Icon animation ────────────────────────────────────────────────────────
  const animateIcon = useCallback((opening) => {
    spinTweenRef.current?.kill();
    const h = plusHRef.current;
    const v = plusVRef.current;
    if (!h || !v) return;

    spinTweenRef.current = opening
      ? gsap.timeline({ defaults: { ease: 'power4.out' } })
          .to(h, { rotate: 45, duration: 0.5 }, 0)
          .to(v, { rotate: -45, duration: 0.5 }, 0)
      : gsap.timeline({ defaults: { ease: 'power3.inOut' } })
          .to(h, { rotate: 0, duration: 0.35 }, 0)
          .to(v, { rotate: 90, duration: 0.35 }, 0);
  }, []);

  // ── Color animation ───────────────────────────────────────────────────────
  const animateColor = useCallback((opening) => {
    if (!changeMenuColorOnOpen || !toggleBtnRef.current) return;
    colorTweenRef.current?.kill();
    colorTweenRef.current = gsap.to(toggleBtnRef.current, {
      color: opening ? openMenuButtonColor : menuButtonColor,
      delay: 0.18,
      duration: 0.3,
      ease: 'power2.out',
    });
  }, [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]);

  // ── Text cycling animation ────────────────────────────────────────────────
  const animateText = useCallback((opening) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const seq = opening ? ['Menu', '···', 'Close'] : ['Close', '···', 'Menu'];
    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });

    const finalShift = ((seq.length - 1) / seq.length) * 100;
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5,
      ease: 'power4.out',
    });
  }, []);

  // ── Toggle handler ────────────────────────────────────────────────────────
  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  // ── Click-away handler ────────────────────────────────────────────────────
  useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(e.target)
      ) {
        toggleMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeOnClickAway, open, toggleMenu]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'sm-scope select-none pointer-events-none',
        isFixed ? 'fixed inset-0 z-[100]' : 'relative w-full h-full',
        className
      )}
    >
      <div
        className="w-full h-full pointer-events-none"
        style={{ '--sm-accent': accentColor }}
        data-position={position}
      >
        {/* ── Stagger Background Layers ──────────────────────────────── */}
        <div
          ref={preLayersRef}
          className={cn(
            'absolute top-0 bottom-0 pointer-events-none z-[5]',
            'w-full sm:w-[55vw] md:w-[42vw] lg:w-[32vw]',
            position === 'left' ? 'left-0' : 'right-0'
          )}
        >
          {colors.slice(0, -1).map((c, i) => (
            <div
              key={i}
              className="sm-prelayer absolute inset-0"
              style={{ background: c }}
            />
          ))}
        </div>

        {/* ── Header: Logo + Toggle button ──────────────────────────── */}
        <header className="absolute top-0 left-0 w-full flex items-center justify-between px-6 sm:px-10 py-5 z-[20] pointer-events-none">
          {/* Logo */}
          <div className="pointer-events-auto">
            {logo ?? (
              <div className="flex items-center gap-2 text-forest">
                <Globe className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Toggle button */}
          <button
            ref={toggleBtnRef}
            onClick={toggleMenu}
            className={cn(
              'sm-toggle pointer-events-auto flex items-center gap-3',
              'px-5 py-2.5 border border-current/20',
              'hover:bg-current/5 transition-colors duration-200 focus:outline-none'
            )}
            aria-expanded={open}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <ToggleText textInnerRef={textInnerRef} textLines={textLines} />
            <ToggleIcon plusHRef={plusHRef} plusVRef={plusVRef} iconRef={iconRef} />
          </button>
        </header>

        {/* ── Sliding Menu Panel ─────────────────────────────────────── */}
        <aside
          ref={panelRef}
          className={cn(
            'absolute top-0 bottom-0 z-10 pointer-events-auto',
            'flex flex-col pt-28 pb-12 px-8 sm:px-14 overflow-y-auto',
            'w-full sm:w-[55vw] md:w-[42vw] lg:w-[32vw]',
            position === 'left' ? 'left-0' : 'right-0'
          )}
          style={{ background: colors[colors.length - 1] }}
          aria-hidden={!open}
        >
          <div className="flex-1 flex flex-col">
            {/* Navigation items */}
            <nav aria-label="Primary navigation">
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {items.map((item, idx) => (
                  <li key={idx} className="overflow-hidden">
                    <Link
                      to={item.link}
                      className="group relative flex items-baseline gap-4 no-underline py-2"
                      aria-label={item.ariaLabel}
                      onClick={(e) => {
                        if (item.onClick) {
                          e.preventDefault();
                          item.onClick(e);
                        }
                        if (open) toggleMenu();
                      }}
                    >
                      {displayItemNumbering && (
                        <span
                          className="font-mono text-[10px] uppercase tracking-widest opacity-35 translate-y-[-0.4rem] shrink-0"
                          aria-hidden="true"
                        >
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                      )}
                      <span
                        className="sm-panel-itemLabel inline-block font-display font-bold uppercase tracking-tighter transition-colors duration-200 group-hover:text-[var(--sm-accent)]"
                        style={{
                          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                          color: colors[colors.length - 1] === '#F7F7F5' || colors[colors.length - 1].toLowerCase() === '#f7f7f5'
                            ? '#1A3C2B'
                            : '#F7F7F5',
                          lineHeight: 1.05,
                        }}
                      >
                        {item.label}
                      </span>
                    </Link>

                    {/* Subtle rule below each item */}
                    <div
                      className="h-px w-full opacity-10"
                      style={{
                        background:
                          colors[colors.length - 1] === '#F7F7F5' || colors[colors.length - 1].toLowerCase() === '#f7f7f5'
                            ? '#1A3C2B'
                            : '#F7F7F5',
                      }}
                    />
                  </li>
                ))}
              </ul>
            </nav>

            {/* Socials */}
            {displaySocials && socialItems.length > 0 && (
              <div className="mt-auto pt-10">
                <h3
                  className="sm-socials-title font-mono text-[10px] uppercase tracking-widest mb-5 opacity-40"
                  style={{
                    color:
                      colors[colors.length - 1] === '#F7F7F5' || colors[colors.length - 1].toLowerCase() === '#f7f7f5'
                        ? '#1A3C2B'
                        : '#F7F7F5',
                  }}
                >
                  Connect
                </h3>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 list-none p-0 m-0">
                  {socialItems.map((social, i) => (
                    <li key={i}>
                      <a
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link font-mono text-xs uppercase tracking-widest no-underline hover:text-[var(--sm-accent)] transition-colors duration-200 py-1 inline-block"
                        style={{
                          color:
                            colors[colors.length - 1] === '#F7F7F5' || colors[colors.length - 1].toLowerCase() === '#f7f7f5'
                              ? '#1A3C2B'
                              : '#F7F7F5',
                          opacity: 0.7,
                        }}
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default StaggeredMenu;
