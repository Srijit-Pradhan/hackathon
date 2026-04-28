import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import { format } from 'date-fns';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { RadiantPromptInput } from '../components/RadiantPromptInput';
import { GenerateButton } from '../components/GenerateButton';
import { AnimatedList } from '../components/AnimatedList';
import { GlowingEdgeCard } from '../components/GlowingEdgeCard';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [allIncidents, setAllIncidents] = useState([]);
  const [updateText, setUpdateText] = useState('');  // controlled timeline input
  
  const socketRef = useRef();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchIncident = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/incidents/${id}`);
        setIncident(res.data);
        setStatus(res.data.status);
      } catch (err) {
        console.error('Error fetching incident:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();

    // Fetch all incidents for quick-nav
    axios.get('http://localhost:5000/api/incidents')
      .then(res => setAllIncidents(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => {});
    // Socket setup
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('joinIncident', id);

    socketRef.current.on('incidentUpdated', (updatedInc) => {
      setIncident(updatedInc);
      setStatus(updatedInc.status);
    });

    socketRef.current.on('timelineUpdate', (newUpdate) => {
      setIncident((prev) => prev ? { ...prev, timeline: [...prev.timeline, newUpdate] } : prev);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [id, user, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [incident?.timeline]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`http://localhost:5000/api/incidents/${id}`, { status: newStatus }, config);
      // Socket will handle the state update
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };


  const generateAISummary = async () => {
    try {
      setAiLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`http://localhost:5000/api/incidents/${id}/summarize`, {}, config);
      // Socket handles the update
    } catch (err) {
      console.error('Error generating AI summary:', err);
      const errorData = err.response?.data || {};
      const errorMsg =
        errorData.details ||
        errorData.message ||
        (err.response?.status === 429
          ? 'AI service quota exceeded. Please try again later.'
          : 'Failed to generate AI Summary. Please try again later.');
      alert(`AI Error: ${errorMsg}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-12 font-mono">Loading incident details...</div>;
  if (!incident) return <div className="p-12 font-mono">Incident not found.</div>;

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Main Details */}
      <div className="md:col-span-2 space-y-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl">{incident.title}</h1>
            <span className="badge border-grid text-grid uppercase">{incident.severity}</span>
          </div>
          <p className="text-xl text-grid/80">{incident.description}</p>
        </div>

        {/* AI Summary Section */}
        <div className="card border-forest/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl flex items-center gap-2 text-forest">
              <Sparkles className="w-5 h-5" /> AI Postmortem
            </h3>
            <GenerateButton
              onClick={generateAISummary}
              isLoading={aiLoading}
              disabled={aiLoading}
              idleText="Generate"
              loadingText="Generating"
            />
          </div>

          {incident.aiSummary ? (
            <div className="space-y-4 text-sm font-sans">
              <div>
                <strong className="block text-forest mb-1 font-mono uppercase tracking-widest text-xs">Summary</strong>
                <p className="text-grid leading-relaxed whitespace-pre-wrap">{incident.aiSummary}</p>
              </div>
              {incident.aiRootCause && (
                <div>
                  <strong className="block text-forest mb-1 font-mono uppercase tracking-widest text-xs mt-4">Probable Root Cause</strong>
                  <p className="text-coral leading-relaxed whitespace-pre-wrap">{incident.aiRootCause}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-grid/50 font-mono text-sm text-center py-6">
              No AI summary generated yet.
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="card flex flex-col h-[500px]">
          <h3 className="text-2xl mb-4 flex items-center gap-2 border-b border-grid/20 pb-4">
            Timeline
          </h3>
          <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {incident.timeline.map((item, idx) => (
              <div key={idx} className="bg-paper p-4 border border-grid/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-forest">{item.authorName}</span>
                  <span className="text-[10px] font-mono text-grid/60">
                    {item.timestamp ? format(new Date(item.timestamp), 'HH:mm:ss') : format(new Date(), 'HH:mm:ss')}
                  </span>
                </div>
                <p className="text-sm text-grid/90">{item.update}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {/* RadiantPromptInput — timeline update (controlled) */}
          <div className="mt-4 pt-4 border-t border-grid/20">
            <RadiantPromptInput
              placeholder="Post a live update..."
              value={updateText}
              onChange={setUpdateText}
              disabled={!updateText.trim()}
              onSubmit={async (text) => {
                if (!text.trim()) return;
                try {
                  const config = { headers: { Authorization: `Bearer ${user.token}` } };
                  await axios.post(
                    `http://localhost:5000/api/incidents/${id}/timeline`,
                    { update: text },
                    config
                  );
                  setUpdateText('');
                } catch (err) {
                  console.error('Error adding timeline update:', err);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="card">
          <h3 className="text-xl mb-4">Status</h3>
          <select 
            className="input-field bg-paper mb-2"
            value={status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
          >
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
          <div className="text-[10px] font-mono text-grid/60 text-center uppercase">
            Changes auto-save
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl mb-4">Details</h3>
          <div className="space-y-4 font-mono text-sm">
            <div>
              <span className="text-grid/60 block text-[10px] uppercase">Created At</span>
              <span>{format(new Date(incident.createdAt), 'MMM d, yyyy HH:mm')}</span>
            </div>
            <div>
              <span className="text-grid/60 block text-[10px] uppercase">Incident ID</span>
              <span className="break-all text-xs">{incident._id}</span>
            </div>
          </div>
        </div>
        {/* Quick-nav: Jump to Incident */}
        <div className="card">
          <h3 className="text-base mb-1">All Incidents</h3>
          <p className="tech-label mb-3">↑↓ keyboard to navigate · Enter to jump</p>
          <AnimatedList
            items={allIncidents.map(inc => inc.title)}
            initialSelectedIndex={allIncidents.findIndex(inc => inc._id === id)}
            onItemSelect={(_, index) => {
              const target = allIncidents[index];
              if (target && target._id !== id) navigate(`/incident/${target._id}`);
            }}
            showGradients={true}
            enableArrowNavigation={false}
            displayScrollbar={true}
            gradientColor="#F7F7F5"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
