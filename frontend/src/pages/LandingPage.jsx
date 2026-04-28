/**
 * LandingPage.jsx
 * Complete landing page integrating:
 *  - RadiantPromptInput (hero CTA input)
 *  - MagicBento (features section)
 *  - TiltedCard (product preview)
 *  - AnimatedStepper (how it works — read-only demo)
 *  - GenerateButton (final CTA)
 *  - GlowingEdgeCard (critical incident highlight teaser)
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { StaggeredMenu } from '../components/StaggeredMenu';
import { RadiantPromptInput } from '../components/RadiantPromptInput';
import { MagicBento } from '../components/MagicBento';
import { TiltedCard } from '../components/TiltedCard';
import { AnimatedStepper, Step } from '../components/AnimatedStepper';
import { GenerateButton } from '../components/GenerateButton';
import { GlowingEdgeCard } from '../components/GlowingEdgeCard';

// ─── Landing-page-only MagicBento card data ───────────────────────────────────
// Overrides the component's default cards with platform-specific content
const FEATURE_CARDS = [
  { label: 'Real-time',    title: 'Incident Tracking',   description: 'Live socket feed — every update streams instantly to all connected responders.' },
  { label: 'AI-powered',  title: 'Postmortem Summary',  description: 'Gemini AI generates root-cause analysis and resolution steps automatically.' },
  { label: 'Teamwork',    title: 'Collaboration',        description: 'Post live updates to a shared timeline. Role-based access for every team member.' },
  { label: 'Public',      title: 'Status Page',          description: 'A shareable, no-login status page so stakeholders are always informed.' },
  { label: 'Command',     title: 'Admin Panel',          description: 'Manage users, audit incidents, and track response metrics in one place.' },
  { label: 'Fast',        title: 'Reliable Backend',     description: 'Node.js + MongoDB with WebSocket support for sub-second updates.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [aiDemo, setAiDemo] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');  // controlled input state

  // Navigate to dashboard — with or without a search query
  const handleSearch = (val) => {
    const q = (val || heroSearch).trim();
    navigate(q ? `/dashboard?q=${encodeURIComponent(q)}` : '/dashboard');
  };

  // ── StaggeredMenu navigation items (mirrors the Navbar links) ────────────
  const menuItems = [
    { label: 'Dashboard', ariaLabel: 'Go to dashboard', link: '/dashboard' },
    { label: 'Status',    ariaLabel: 'View status page', link: '/status' },
    { label: 'Login',     ariaLabel: 'Login to your account', link: '/login' },
    { label: 'Sign Up',   ariaLabel: 'Create an account', link: '/signup' },
  ];

  const socialLinks = [
    { label: 'GitHub',    link: 'https://github.com' },
    { label: 'Twitter',   link: 'https://twitter.com' },
    { label: 'LinkedIn',  link: 'https://linkedin.com' },
  ];

  return (
    <div className="min-h-screen bg-paper text-forest">

      {/* ══ STAGGERED MENU — fixed overlay, replaces Navbar on landing ══ */}
      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        socialItems={socialLinks}
        displayItemNumbering
        colors={['#1A3C2B', '#2d5540', '#F7F7F5']}
        accentColor="#9EFFBF"
        menuButtonColor="#1A3C2B"
        logo={
          <Link
            to="/"
            className="flex items-center gap-2 text-forest font-display font-bold text-lg"
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="hidden sm:inline">IncidentResponse</span>
            <span className="sm:hidden">IR</span>
          </Link>
        }
      />

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 pt-24 pb-16 text-center lp-section">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-forest/15 font-mono text-[10px] uppercase tracking-widest text-forest/50 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-mint inline-block animate-pulse" />
          Live · Hackathon 2026
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-5">
          Smart Incident<br />
          <span className="text-forest/35">Response Platform</span>
        </h1>

        <p className="text-lg text-grid/65 max-w-xl mx-auto mb-10 leading-relaxed">
          Monitor, manage and resolve incidents faster with AI-generated postmortems
          and real-time team collaboration.
        </p>

        {/* ── RadiantPromptInput in Hero ── */}
        <div className="max-w-2xl mx-auto mb-10">
          <RadiantPromptInput
            placeholder="Search incidents, or press Enter to open dashboard..."
            value={heroSearch}
            onChange={setHeroSearch}
            onSubmit={handleSearch}
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/dashboard" className="btn-primary flex items-center gap-2">
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/status" className="flex items-center gap-2 px-5 py-3 border border-grid/20 font-mono text-xs uppercase tracking-widest text-grid/65 hover:border-forest/30 hover:text-forest transition-colors">
            View Status Page
          </Link>
        </div>
      </section>

      {/* ══ PRODUCT PREVIEW (TiltedCard) ══════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 pb-20 lp-section" style={{ animationDelay: '0.08s' }}>
        {/* TiltedCard wrapping the dashboard preview screenshot */}
        <TiltedCard
          imageSrc="/dashboard-preview.png"
          altText="Smart Incident Response Platform Dashboard"
          captionText="Live Dashboard"
          containerHeight="460px"
          containerWidth="100%"
          imageHeight="420px"
          imageWidth="100%"
          rotateAmplitude={6}
          scaleOnHover={1.02}
          showMobileWarning={false}
          showTooltip={true}
          className="w-full"
          displayOverlayContent={true}
          overlayContent={
            <div
              className="absolute bottom-4 left-4 right-4 flex items-center gap-2 px-3 py-2"
              style={{ background: 'rgba(26,60,43,0.7)', backdropFilter: 'blur(8px)' }}
            >
              <span className="w-2 h-2 rounded-full bg-mint" />
              <span className="font-mono text-xs text-paper/80 uppercase tracking-widest">Live Dashboard · localhost:5173</span>
            </div>
          }
        />
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-grid/35 mt-4">
          Dashboard Preview — hover to interact
        </p>
      </section>

      {/* ══ FEATURES (MagicBento) ══════════════════════════════════════════════ */}
      <section className="lp-section" style={{ animationDelay: '0.12s', background: '#1A3C2B' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-16 pb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-paper/40 block mb-2">Platform Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-bold text-paper mb-2">Everything you need</h2>
          <p className="text-paper/50 text-sm mb-0">Built for speed, reliability, and team coordination.</p>
        </div>
        {/* MagicBento — already themed for forest bg */}
        <MagicBento
          cardData={FEATURE_CARDS}
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={280}
          particleCount={10}
          glowColor="159, 255, 191"
        />
      </section>

      {/* ══ CRITICAL INCIDENT TEASER (GlowingEdgeCard) ════════════════════════ */}
      <section className="py-24 lp-section" style={{ animationDelay: '0.16s', background: '#F0F0ED' }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-forest/50 block mb-3">Critical Incidents</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Respond before it escalates</h2>
              <p className="text-grid/65 leading-relaxed text-sm mb-6">
                Critical incidents are highlighted with interactive glowing borders.
                Hover over the card to see the effect — a visual cue that demands immediate attention.
              </p>
              <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
                View Active Incidents <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* GlowingEdgeCard as a teaser UI preview */}
            <GlowingEdgeCard mode="light" className="h-64">
              <div className="p-6 flex flex-col justify-between h-full" style={{ color: '#1A3C2B' }}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-forest/50">Critical · Production</span>
                    <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">API Gateway Down</h3>
                  <p className="text-sm text-grid/60 leading-relaxed">
                    All API requests returning 503. 3 services affected. P0 incident declared.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-forest/10">
                  <span className="font-mono text-xs text-grid/50">Opened 4m ago</span>
                  <span className="font-mono text-xs text-coral border border-coral/30 px-2 py-0.5">CRITICAL</span>
                </div>
              </div>
            </GlowingEdgeCard>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS (AnimatedStepper — interactive demo) ════════════════ */}
      <section className="py-20 lp-section" style={{ animationDelay: '0.2s' }}>
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <span className="font-mono text-[10px] uppercase tracking-widest text-forest/50 block mb-3">Process</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How it works</h2>
            <p className="text-grid/55 text-sm">Click through the steps to see the incident lifecycle.</p>
          </div>
        </div>

        {/* AnimatedStepper as a live demo */}
        <div className="max-w-2xl mx-auto px-6">
          <AnimatedStepper
            nextButtonText="Next Step →"
            backButtonText="← Back"
            disableStepIndicators={false}
            onFinalStepCompleted={() => navigate('/dashboard')}
            stepCircleContainerClassName="border-forest/10"
          >
            <Step title="1 · Create Incident">
              <p className="text-sm leading-relaxed mb-4">
                Log a new incident with a title, description, and severity level.
                Use the 3-step wizard to capture all the details quickly.
              </p>
              <div className="p-4 border border-forest/10 bg-forest/3 font-mono text-xs text-grid/60">
                <span className="text-forest">POST</span> /api/incidents → <span className="text-mint">201 Created</span>
              </div>
            </Step>

            <Step title="2 · Investigate">
              <p className="text-sm leading-relaxed mb-4">
                Your team posts live timeline updates. Every update is broadcast
                in real-time via WebSocket to all connected responders.
              </p>
              <div className="p-4 border border-gold/20 bg-gold/5 text-xs font-mono text-grid/70">
                <span className="text-gold">●</span> Investigating · 3 updates · 2 responders online
              </div>
            </Step>

            <Step title="3 · Resolve">
              <p className="text-sm leading-relaxed mb-4">
                Mark the incident resolved when the issue is fixed.
                The status page updates automatically so stakeholders stay informed.
              </p>
              <div className="p-4 border border-mint/20 bg-mint/5 text-xs font-mono text-grid/70">
                <span className="text-mint">✓</span> Resolved · Total duration: 43 minutes
              </div>
            </Step>

            <Step title="4 · Generate AI Summary">
              <p className="text-sm leading-relaxed mb-4">
                One click generates a full postmortem: root-cause analysis,
                timeline, impact assessment, and recommended preventive actions.
              </p>
              <div className="p-4 border border-forest/15 bg-forest/4 text-xs font-mono text-grid/60">
                <span className="text-forest">✦</span> Gemini AI · Summary ready in ~3 seconds
              </div>
            </Step>
          </AnimatedStepper>
        </div>
      </section>

      {/* ══ FINAL CTA (GenerateButton) ════════════════════════════════════════ */}
      <section className="border-t border-grid/10 py-24 text-center lp-section" style={{ animationDelay: '0.24s' }}>
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to respond faster?</h2>
          <p className="text-grid/55 mb-10 text-sm leading-relaxed">
            Set up your incident command center in minutes.
          </p>

          {/* GenerateButton styled as "Open Dashboard" CTA */}
          <div className="flex flex-col items-center gap-4">
            <GenerateButton
              onClick={() => navigate('/dashboard')}
              isLoading={aiDemo}
              idleText="Open Dashboard"
              loadingText="Loading..."
              disabled={false}
            />
            <p className="font-mono text-[10px] text-grid/40 uppercase tracking-widest">
              No setup · No configuration
            </p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER (matches Layout footer) ════════════════════════════════ */}
      <footer className="border-t border-grid/20 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-grid/60">
        Hackathon Project • Smart Incident Response
      </footer>

      {/* Subtle fade-in for each section */}
      <style>{`
        .lp-section {
          animation: lpFade 0.55s ease both;
        }
        @keyframes lpFade {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
