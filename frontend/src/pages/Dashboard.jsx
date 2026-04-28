import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useStore from '../store/useStore';
import { format } from 'date-fns'
import { AlertTriangle, Activity, CheckCircle, Flame } from 'lucide-react';
import { AnimatedStepper, Step } from '../components/AnimatedStepper';
import { RollingCounter } from '../components/RollingCounter';
import { AnimatedList } from '../components/AnimatedList';
import { RadiantPromptInput } from '../components/RadiantPromptInput';
import { apiUrl } from '../config/api';

// Simple debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function Dashboard() {
  const { user, incidents, setIncidents } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create incident state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [createError, setCreateError] = useState('');

  // Search state — sync with ?q= URL param
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQueryState] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update both local state and URL when search changes
  const setSearchQuery = (val) => {
    setSearchQueryState(val);
    if (val) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl('/api/incidents'));
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setIncidents(sorted);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching incidents');
    } finally {
      setLoading(false);
    }
  }, [setIncidents]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Called when the stepper completes
  const handleCreate = async () => {
    setCreateError('');
    if (!title.trim() || !description.trim()) {
      setCreateError('Title and description are required.');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.post(apiUrl('/api/incidents'), {
        title, description, severity
      }, config);
      setIncidents([res.data, ...incidents]);
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setSeverity('Medium');
      setCreateError('');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error creating incident');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'border-coral text-coral';
      case 'Investigating': return 'border-gold text-gold';
      case 'Resolved': return 'border-mint text-mint';
      default: return 'border-grid text-grid';
    }
  };

  // Filter incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.description.toLowerCase().includes(q) ||
      inc.severity.toLowerCase().includes(q) ||
      inc.status.toLowerCase().includes(q)
    );
  });

  // ── Stats computed from incident data ────────────────────────────────────────
  const stats = {
    total:    incidents.length,
    active:   incidents.filter(i => i.status === 'Open').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
    critical: incidents.filter(i => i.severity === 'Critical').length,
  };

  if (loading) return <div className="p-12 font-mono">Loading dashboard...</div>;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-4xl md:text-6xl">Incidents</h1>
        <button
          onClick={() => { setShowCreate(!showCreate); setCreateError(''); }}
          className="btn-primary"
        >
          {showCreate ? 'Cancel' : '+ New Incident'}
        </button>
      </div>

      {error && (
        <div className="card border-coral/40 text-coral mb-6 font-mono text-sm">{error}</div>
      )}

      {/* ── Stats Row with RollingCounter ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',    value: stats.total,    icon: Activity,      color: '#1A3C2B' },
          { label: 'Active',   value: stats.active,   icon: AlertTriangle, color: '#FF8C69' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle,   color: '#9EFFBF' },
          { label: 'Critical', value: stats.critical, icon: Flame,         color: '#FF4444' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="tech-label">{label}</span>
              <Icon style={{ width: 14, height: 14, color }} />
            </div>
            {/* RollingCounter for smooth number animation */}
            <div className="flex items-end">
              <RollingCounter
                value={value}
                fontSize={32}
                fontWeight={700}
                textColor={color}
                gradientFrom="#F7F7F5"
                gradientHeight={10}
                gap={2}
                horizontalPadding={0}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── 3-Step Create Incident Wizard ──────────────────────────────────── */}
      {showCreate && (
        <div className="mb-10">
          <AnimatedStepper
            onFinalStepCompleted={handleCreate}
            nextButtonText="Next"
            disableStepIndicators={false}
            validateStep={(step) => {
              if (step === 1) return title.trim().length > 0 && description.trim().length > 0;
              return true;
            }}
          >
            {/* Step 1 — Basic Info */}
            <Step title="1 — Incident Details">
              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <label className="tech-label mb-1 block">Title *</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short, descriptive incident title"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="tech-label mb-1 block">Description *</label>
                  <textarea
                    className="input-field w-full min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What happened? What systems are affected?"
                  />
                </div>
              </div>
            </Step>

            {/* Step 2 — Severity */}
            <Step title="2 — Set Severity">
              <p className="mb-4 text-sm">
                Choose the severity level that best reflects the current impact of this incident.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {['Low', 'Medium', 'High', 'Critical'].map((level) => {
                  const colors = {
                    Low:      { border: '#9EFFBF', text: '#1A3C2B', bg: '#9effbf22' },
                    Medium:   { border: '#F4D35E', text: '#1A3C2B', bg: '#f4d35e22' },
                    High:     { border: '#FF8C69', text: '#1A3C2B', bg: '#ff8c6922' },
                    Critical: { border: '#FF4444', text: '#FF4444', bg: '#ff444422' },
                  }[level];
                  const isSelected = severity === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className="p-4 border font-mono text-sm uppercase tracking-widest transition-all text-left"
                      style={{
                        borderColor: isSelected ? colors.border : 'rgba(58,58,56,0.15)',
                        backgroundColor: isSelected ? colors.bg : 'transparent',
                        color: isSelected ? colors.text : 'rgba(58,58,56,0.6)',
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </Step>

            {/* Step 3 — Review */}
            <Step title="3 — Review & Confirm">
              {createError && (
                <div className="font-mono text-sm text-coral mb-4">{createError}</div>
              )}
              <div className="space-y-4">
                <div className="border border-grid/10 p-4">
                  <span className="tech-label block mb-1">Title</span>
                  <p className="font-display font-bold text-lg text-forest">
                    {title || <span className="text-coral font-mono text-sm font-normal">⚠ No title set — go back</span>}
                  </p>
                </div>
                <div className="border border-grid/10 p-4">
                  <span className="tech-label block mb-1">Description</span>
                  <p className="text-sm text-grid/80 leading-relaxed">
                    {description || <span className="text-coral font-mono text-sm">⚠ No description set — go back</span>}
                  </p>
                </div>
                <div className="border border-grid/10 p-4 flex items-center justify-between">
                  <span className="tech-label">Severity</span>
                  <span className="badge border-grid/40 font-mono text-xs">{severity}</span>
                </div>
              </div>
            </Step>
          </AnimatedStepper>
        </div>
      )}

      {/* ── Search using RadiantPromptInput ────────────────────────────────── */}
      <div className="mb-6">
        <RadiantPromptInput
          placeholder="Search incidents by title, status, severity..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={(val) => setSearchQuery(val)}
          className="max-w-full"
        />
      </div>

      {/* ── Incidents: AnimatedList (compact) + full cards ──────────────────── */}
      {filteredIncidents.length === 0 ? (
        <div className="card text-center py-12 text-grid/60 font-mono">
          {searchQuery ? 'No incidents match your search.' : 'No active incidents found.'}
        </div>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Left: AnimatedList quick-nav */}
          <div className="card hidden md:block">
            <p className="tech-label mb-3">Quick Nav</p>
            <AnimatedList
              items={filteredIncidents.map(inc => inc.title)}
              enableArrowNavigation={true}
              showGradients={true}
              gradientColor="#F7F7F5"
              displayScrollbar={true}
              onItemSelect={(_, idx) => {
                const inc = filteredIncidents[idx];
                if (inc) navigate(`/incident/${inc._id}`);
              }}
              className="w-full"
            />
          </div>

          {/* Right: Full incident cards */}
          <div className="grid gap-4">
            {filteredIncidents.map(inc => (
              <Link
                to={`/incident/${inc._id}`}
                key={inc._id}
                className="card block hover:border-forest transition-colors"
              >
                <div className="flex flex-wrap gap-2 justify-between items-start mb-2">
                  <h3 className="text-xl md:text-2xl">{inc.title}</h3>
                  <span className={`badge ${getStatusColor(inc.status)}`}>{inc.status}</span>
                </div>
                <p className="text-grid/80 mb-4 line-clamp-2 text-sm md:text-base">{inc.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-grid/60">
                  <span>Severity: <span className="text-grid/80">{inc.severity}</span></span>
                  <span>•</span>
                  <span>{format(new Date(inc.createdAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
