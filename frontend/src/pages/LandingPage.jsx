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
  const [heroSearch, setHeroSearch] = useState('');  // controlled input state

  // Navigate to dashboard — with or without a search query
  const handleSearch = (val) => {
    const q = (val || heroSearch).trim();
    navigate(q ? `/dashboard?q=${encodeURIComponent(q)}` : '/dashboard');
  };

  return (
    <div className="min-h-screen bg-paper text-forest">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl px-6 pt-24 pb-16 mx-auto text-center md:px-12 lp-section">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-forest/15 font-mono text-[10px] uppercase tracking-widest text-forest/50 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-mint inline-block animate-pulse" />
          Live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-5">
          incident<span className="text-forest">IQ</span>
        </h1>

        <p className="max-w-xl mx-auto mb-10 text-lg leading-relaxed text-grid/65">
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

        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 btn-primary">
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/status" className="flex items-center gap-2 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors border border-grid/20 text-grid/65 hover:border-forest/30 hover:text-forest">
            View Status Page
          </Link>
        </div>
      </section>

      {/* ══ PRODUCT PREVIEW (TiltedCard) ══════════════════════════════════════ */}
      <section className="max-w-5xl px-6 pb-20 mx-auto md:px-12 lp-section" style={{ animationDelay: '0.08s' }}>
        {/* TiltedCard wrapping the dashboard preview screenshot */}
        <TiltedCard
          imageSrc="/dashboard-preview.png"
          altText="incidentIQ Dashboard"
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
              className="absolute flex items-center gap-2 px-3 py-2 bottom-4 left-4 right-4"
              style={{ background: 'rgba(26,60,43,0.7)', backdropFilter: 'blur(8px)' }}
            >
              <span className="w-2 h-2 rounded-full bg-mint" />
              <span className="font-mono text-xs tracking-widest uppercase text-paper/80">Live Dashboard · localhost:5173</span>
            </div>
          }
        />
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-grid/35 mt-4">
          Dashboard Preview — hover to interact
        </p>
      </section>

      {/* ══ FEATURES (MagicBento) ══════════════════════════════════════════════ */}
      <section className="lp-section" style={{ animationDelay: '0.12s', background: '#1A3C2B' }}>
        <div className="max-w-6xl px-6 pt-16 pb-4 mx-auto md:px-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-paper/40 block mb-2">Platform Capabilities</span>
          <h2 className="mb-2 text-3xl font-bold md:text-4xl text-paper">Everything you need</h2>
          <p className="mb-0 text-sm text-paper/50">Built for speed, reliability, and team coordination.</p>
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
        <div className="max-w-5xl px-6 mx-auto md:px-12">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-forest/50 block mb-3">Critical Incidents</span>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Respond before it escalates</h2>
              <p className="mb-6 text-sm leading-relaxed text-grid/65">
                Critical incidents are highlighted with interactive glowing borders.
                Hover over the card to see the effect — a visual cue that demands immediate attention.
              </p>
              <Link to="/dashboard" className="inline-flex items-center gap-2 btn-primary">
                View Active Incidents <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* GlowingEdgeCard as a teaser UI preview */}
            <GlowingEdgeCard mode="light" className="h-64">
              <div className="flex flex-col justify-between h-full p-6" style={{ color: '#1A3C2B' }}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-forest/50">Critical · Production</span>
                    <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                  </div>
                  <h3 className="mb-1 text-xl font-bold">API Gateway Down</h3>
                  <p className="text-sm leading-relaxed text-grid/60">
                    All API requests returning 503. 3 services affected. P0 incident declared.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-forest/10">
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
        <div className="max-w-4xl px-6 mx-auto md:px-12">
          <div className="mb-12 text-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-forest/50 block mb-3">Process</span>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="text-sm text-grid/55">Click through the steps to see the incident lifecycle.</p>
          </div>
        </div>

        {/* AnimatedStepper as a live demo */}
        <div className="max-w-2xl px-6 mx-auto">
          <AnimatedStepper
            nextButtonText="Next Step →"
            backButtonText="← Back"
            disableStepIndicators={false}
            onFinalStepCompleted={() => navigate('/dashboard')}
            stepCircleContainerClassName="border-forest/10"
          >
            <Step title="1 · Create Incident">
              <p className="mb-4 text-sm leading-relaxed">
                Log a new incident with title, description, and severity level.
                Example: Payment API Failure.
              </p>
              <div className="p-4 font-mono text-xs border border-forest/10 bg-forest/3 text-grid/60">
                <span className="text-forest">POST</span> /api/incidents → <span className="text-mint">201 Created</span>
              </div>
            </Step>

            <Step title="2 · Assign Responder">
              <p className="mb-4 text-sm leading-relaxed">
                Assign team members to take responsibility. A timeline update is instantly broadcasted.
                No confusion on who is investigating.
              </p>
              <div className="p-4 font-mono text-xs border border-gold/20 bg-gold/5 text-grid/70">
                <span className="text-gold">●</span> Assigned to Srijit (Backend Team)
              </div>
            </Step>

            <Step title="3 · Investigate">
              <p className="mb-4 text-sm leading-relaxed">
                Team posts live timeline updates while debugging. The system builds a real-time timeline
                so everyone stays on the same page.
              </p>
              <div className="p-4 font-mono text-xs border border-grid/20 bg-paper text-grid/70">
                <span className="text-forest">●</span> Investigating payment service logs...
              </div>
            </Step>

            <Step title="4 · AI Summary">
              <p className="mb-4 text-sm leading-relaxed">
                Click a button and AI analyzes the timeline to provide a quick summary and probable root cause.
                No need to read all logs manually.
              </p>
              <div className="p-4 font-mono text-xs border border-forest/15 bg-forest/4 text-grid/60">
                <span className="text-forest">✦</span> Root Cause: DB connection timeout due to traffic spike
              </div>
            </Step>

            <Step title="5 · Resolve Incident">
              <p className="mb-4 text-sm leading-relaxed">
                Once the fix is applied (e.g. optimized queries + scaling), change the status to Resolved.
                Timeline reflects the resolution.
              </p>
              <div className="p-4 font-mono text-xs border border-mint/20 bg-mint/5 text-grid/70">
                <span className="text-mint">✓</span> Incident resolved · System stable
              </div>
            </Step>

            <Step title="6 · Postmortem">
              <p className="mb-4 text-sm leading-relaxed">
                System provides a complete AI-generated postmortem with summary, root cause, and
                steps taken, ready to be reviewed to prevent future issues.
              </p>
              <div className="p-4 font-mono text-xs border border-forest/15 bg-forest/4 text-grid/60">
                <span className="text-forest">✦</span> Postmortem generated successfully
              </div>
            </Step>

            <Step title="7 · Status Page">
              <p className="mb-4 text-sm leading-relaxed">
                Stakeholders check the public status page to see transparent updates.
                Builds trust and keeps users informed of system health.
              </p>
              <div className="p-4 font-mono text-xs border border-mint/20 bg-mint/5 text-grid/70">
                <span className="text-mint">✓</span> All Systems Operational
              </div>
            </Step>
          </AnimatedStepper>
        </div>
      </section>

      {/* ══ FINAL CTA (GenerateButton) ════════════════════════════════════════ */}
      <section className="py-24 text-center border-t border-grid/10 lp-section" style={{ animationDelay: '0.24s' }}>
        <div className="max-w-lg px-6 mx-auto">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to respond faster?</h2>
          <p className="mb-10 text-sm leading-relaxed text-grid/55">
            Set up your incident command center in minutes.
          </p>

          {/* GenerateButton styled as "Open Dashboard" CTA */}
          <div className="flex flex-col items-center gap-4">
            <GenerateButton
              onClick={() => navigate('/dashboard')}
              isLoading={false}
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
        &copy; incidentIQ. All rights reserved.
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
