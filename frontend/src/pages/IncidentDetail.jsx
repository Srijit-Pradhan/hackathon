import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { RadiantPromptInput } from '../components/RadiantPromptInput';
import { GenerateButton } from '../components/GenerateButton';
import { AnimatedList } from '../components/AnimatedList';
import { apiUrl, SOCKET_URL } from '../config/api';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [allIncidents, setAllIncidents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [updateText, setUpdateText] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [usersError, setUsersError] = useState(false);

  const socketRef = useRef();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    const fetchIncident = async () => {
      try {
        const res = await axios.get(apiUrl(`/api/incidents/${id}`));
        setIncident(res.data);
        setStatus(res.data.status);
      } catch (err) {
        console.error('Error fetching incident:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();

    // Quick-nav list
    axios.get(apiUrl('/api/incidents'))
      .then(res => setAllIncidents(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => {});

    // All users for assign dropdown
    axios.get(apiUrl('/api/auth/users'), { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => { setAllUsers(res.data); setUsersError(false); })
      .catch((err) => {
        console.error('Failed to fetch users:', err.response?.status, err.response?.data);
        setUsersError(true);
      });

    // Real-time socket
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinIncident', id);
    // Re-fetch from API on socket update to guarantee populated assignedTo/createdBy fields.
    // (Socket.io serialises Mongoose docs with raw ObjectIds, not sub-documents.)
    socketRef.current.on('incidentUpdated', async () => {
      try {
        const res = await axios.get(apiUrl(`/api/incidents/${id}`));
        setIncident(res.data);
        setStatus(res.data.status);
      } catch (e) {
        console.error('Socket refresh failed:', e);
      }
    });
    socketRef.current.on('timelineUpdate', (newUpdate) => {
      setIncident(prev => prev ? { ...prev, timeline: [...prev.timeline, newUpdate] } : prev);
    });

    return () => socketRef.current.disconnect();
  }, [id, user, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [incident?.timeline]);

  // ---------- Permissions ----------
  const getPermissions = (inc) => {
    if (!inc || !user) return { canAssign: false, canUpdateStatus: false, canPostTimeline: false };

    const createdById = inc.createdBy?._id || inc.createdBy;
    const assignedToId = inc.assignedTo?._id || inc.assignedTo;

    const isAdmin = user.role === 'admin';
    // Old incidents have no createdBy — treat any logged-in user as allowed
    const isCreator = !createdById || createdById.toString() === user._id.toString();
    const isAssigned = assignedToId && assignedToId.toString() === user._id.toString();

    return {
      canAssign: isAdmin || isCreator,
      canUpdateStatus: isAdmin || isCreator || isAssigned,
      canPostTimeline: isAdmin || isCreator || isAssigned,
    };
  };

  // ---------- Handlers ----------
  const handleUpdateStatus = async (newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put(apiUrl(`/api/incidents/${id}`), { status: newStatus }, config);
      setIncident(res.data);
      setStatus(res.data.status);
    } catch (err) {
      alert(err.response?.data?.message || 'Not authorized to change status');
      setStatus(incident.status); // revert UI
    }
  };

  const handleAssign = async (userId, userName) => {
    setAssignLoading(true);
    setAssignError('');
    setAssignSuccess(false);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(apiUrl(`/api/incidents/${id}`), {
        assignedTo: userId,
        assignedToName: userName
      }, config);
      // Re-fetch from GET endpoint to guarantee fully-populated assignedTo.name
      const fresh = await axios.get(apiUrl(`/api/incidents/${id}`));
      setIncident(fresh.data);
      setStatus(fresh.data.status);
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Error assigning responder');
      setTimeout(() => setAssignError(''), 4000);
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePostTimeline = async (text) => {
    if (!text.trim()) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(apiUrl(`/api/incidents/${id}/timeline`), { update: text }, config);
      setUpdateText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Not authorized to post updates');
    }
  };

  const generateAISummary = async () => {
    try {
      setAiLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(apiUrl(`/api/incidents/${id}/summarize`), {}, config);
    } catch (err) {
      const errorData = err.response?.data || {};
      alert(`AI Error: ${errorData.details || errorData.message || 'Failed to generate AI Summary'}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-12 font-mono">Loading incident details...</div>;
  if (!incident) return <div className="p-12 font-mono">Incident not found.</div>;

  const { canAssign, canUpdateStatus, canPostTimeline } = getPermissions(incident);

  return (
    <div className="grid md:grid-cols-3 gap-8">

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="md:col-span-2 space-y-8">

        {/* Title */}
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl">{incident.title}</h1>
            <span className="badge border-grid text-grid uppercase">{incident.severity}</span>
          </div>
          <p className="text-xl text-grid/80">{incident.description}</p>
        </div>

        {/* AI Postmortem */}
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
            <div className="text-grid/50 font-mono text-sm text-center py-6">No AI summary generated yet.</div>
          )}
        </div>

        {/* Timeline */}
        <div className="card flex flex-col h-[500px]">
          <h3 className="text-2xl mb-4 border-b border-grid/20 pb-4">Timeline</h3>
          <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {incident.timeline.map((item, idx) => (
              <div key={idx} className="bg-paper p-4 border border-grid/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-forest">{item.authorName}</span>
                  <span className="text-[10px] font-mono text-grid/60">
                    {item.timestamp ? format(new Date(item.timestamp), 'HH:mm:ss') : ''}
                  </span>
                </div>
                <p className="text-sm text-grid/90">{item.update}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Timeline Input */}
          <div className="mt-4 pt-4 border-t border-grid/20">
            {canPostTimeline ? (
              <RadiantPromptInput
                placeholder="Post a live update..."
                value={updateText}
                onChange={setUpdateText}
                disabled={!updateText.trim()}
                onSubmit={handlePostTimeline}
              />
            ) : (
              <div className="p-3 bg-grid/5 font-mono text-xs text-center text-grid/50 border border-grid/10">
                Only the assigned responder or incident creator can post updates.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sidebar ──────────────────────────────────────── */}
      <div className="space-y-6">

        {/* Status */}
        <div className="card">
          <h3 className="text-xl mb-4">Status</h3>
          <select
            className="input-field bg-paper mb-2"
            value={status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            disabled={!canUpdateStatus}
          >
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
          <div className={`text-[10px] font-mono text-center uppercase ${canUpdateStatus ? 'text-grid/60' : 'text-coral'}`}>
            {canUpdateStatus ? 'Changes auto-save' : 'Only creator, assigned, or admin can change status'}
          </div>
        </div>

        {/* Responder */}
        <div className="card">
          <h3 className="text-xl mb-4">Assigned Responder</h3>
          <div className="mb-4">
          {/* Assigned responder display */}
          {incident.assignedTo ? (
            incident.assignedTo.name ? (
              // Fully populated — show name + role
              <div className="flex items-center justify-between bg-mint/10 text-forest p-3 border border-mint/30 text-sm font-bold">
                <span>{incident.assignedTo.name}</span>
                <span className="font-mono text-[10px] uppercase font-normal tracking-widest opacity-70">{incident.assignedTo.role}</span>
              </div>
            ) : (
              // ObjectId string — look up from allUsers list
              (() => {
                const matched = allUsers.find(u => u._id?.toString() === incident.assignedTo?.toString());
                return matched ? (
                  <div className="flex items-center justify-between bg-mint/10 text-forest p-3 border border-mint/30 text-sm font-bold">
                    <span>{matched.name}</span>
                    <span className="font-mono text-[10px] uppercase font-normal tracking-widest opacity-70">{matched.role}</span>
                  </div>
                ) : (
                  <div className="text-grid/60 text-sm font-mono p-2 border border-mint/20 bg-mint/5">
                    Responder assigned (loading details...)
                  </div>
                );
              })()
            )
          ) : (
            <div className="text-grid/50 text-sm font-mono italic p-2 border border-dashed border-grid/20 bg-paper">
              No responder assigned yet
            </div>
          )}
          </div>

          {/* Feedback messages */}
          {assignSuccess && (
            <div className="mb-2 px-3 py-2 bg-mint/10 border border-mint/30 text-forest font-mono text-xs">
              ✓ Responder assigned successfully
            </div>
          )}
          {assignError && (
            <div className="mb-2 px-3 py-2 bg-coral/10 border border-coral/30 text-coral font-mono text-xs">
              ✗ {assignError}
            </div>
          )}

          {canAssign && allUsers.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-mono text-grid/60 uppercase mb-1">Select to Assign</p>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(26,60,43,0.2) transparent',
                  border: '1px solid rgba(58,58,56,0.1)',
                }}
              >
                {allUsers.map((u) => {
                  const isCurrent = u._id?.toString() === (incident.assignedTo?._id?.toString() || incident.assignedTo?.toString());
                  return (
                    <button
                      key={u._id}
                      disabled={assignLoading}
                      onClick={() => handleAssign(u._id, u.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 12px',
                        background: isCurrent ? 'rgba(158,255,191,0.08)' : 'transparent',
                        borderLeft: isCurrent ? '2px solid #1A3C2B' : '2px solid transparent',
                        borderBottom: '1px solid rgba(58,58,56,0.06)',
                        cursor: assignLoading ? 'not-allowed' : 'pointer',
                        opacity: assignLoading ? 0.5 : 1,
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!assignLoading) e.currentTarget.style.background = 'rgba(26,60,43,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? 'rgba(158,255,191,0.08)' : 'transparent'; }}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1A3C2B' }}>
                        {u.name}
                        {isCurrent && <span style={{ color: '#9EFFBF', marginLeft: '6px' }}>● current</span>}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(58,58,56,0.45)', textTransform: 'uppercase' }}>
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {canAssign && allUsers.length === 0 && !usersError && (
            <div className="text-grid/40 font-mono text-xs mt-2">Loading users...</div>
          )}
          {canAssign && usersError && (
            <div className="text-coral font-mono text-xs mt-2 p-2 border border-coral/20 bg-coral/5">
              ✗ Could not load user list. Check if you are logged in.
            </div>
          )}
          {!canAssign && (
            <div className="text-grid/40 font-mono text-xs mt-2">Only the creator or admin can assign responders.</div>
          )}
        </div>

        {/* Details */}
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

        {/* Quick Nav */}
        <div className="card">
          <h3 className="text-base mb-1">All Incidents</h3>
          <p className="tech-label mb-3">Jump to another incident</p>
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
