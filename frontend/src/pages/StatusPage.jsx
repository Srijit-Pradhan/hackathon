import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';
import { MagicBento } from '../components/MagicBento';

export default function StatusPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/incidents');
        const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setIncidents(sorted);
      } catch (err) {
        console.error('Error fetching incidents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();

    const socket = io('http://localhost:5000');
    socket.on('incidentListUpdated', (updatedInc) => {
      setIncidents(prev => prev.map(inc => inc._id === updatedInc._id ? updatedInc : inc));
    });
    socket.on('incidentCreated', (newInc) => {
      setIncidents(prev => [newInc, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-coral text-paper';
      case 'Investigating': return 'bg-gold text-forest';
      case 'Resolved': return 'bg-mint text-forest';
      default: return 'bg-grid text-paper';
    }
  };

  if (loading) return <div className="p-12 font-mono text-center">Loading status...</div>;

  const activeCount = incidents.filter(i => i.status !== 'Resolved').length;

  return (
    <div>
      {/* ── Status header & incident list ── */}
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-16">
          <Activity className={`w-16 h-16 mx-auto mb-6 ${activeCount > 0 ? 'text-coral' : 'text-mint'}`} />
          <h1 className="text-5xl md:text-7xl mb-4">System Status</h1>
          <div className={`inline-block px-6 py-2 font-mono text-sm uppercase tracking-widest ${activeCount > 0 ? 'bg-coral/10 text-coral border border-coral/30' : 'bg-mint/10 text-mint border border-mint/30'}`}>
            {activeCount > 0 ? `${activeCount} Active Incident${activeCount > 1 ? 's' : ''}` : 'All Systems Operational'}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl border-b border-grid/20 pb-2 mb-6">Recent Updates</h2>
          {incidents.length === 0 ? (
            <div className="text-center font-mono text-grid/60">No recent incidents.</div>
          ) : (
            incidents.map(inc => (
              <div
                key={inc._id}
                className="card border-l-4"
                style={{ borderLeftColor: inc.status === 'Resolved' ? '#9EFFBF' : (inc.status === 'Open' ? '#FF8C69' : '#F4D35E') }}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl mb-1">{inc.title}</h3>
                    <div className="text-sm font-mono text-grid/60">
                      {format(new Date(inc.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  <div className={`px-3 py-1 font-mono text-xs uppercase tracking-widest ${getStatusColor(inc.status)}`}>
                    {inc.status}
                  </div>
                </div>
                <p className="text-grid/80">{inc.description}</p>
                {inc.aiSummary && (
                  <div className="mt-4 p-4 bg-paper border border-grid/10 text-sm">
                    <strong className="font-mono text-[10px] uppercase tracking-widest text-forest block mb-1">Postmortem Summary</strong>
                    <p className="text-grid/90">{inc.aiSummary}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Platform Capabilities — MagicBento ── */}
      <div className="mt-16">
        <h2 className="text-2xl border-b border-grid/20 pb-2 mb-4">Platform Capabilities</h2>
        <MagicBento
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={260}
          particleCount={10}
          glowColor="247, 247, 245"
          textAutoHide={false}
        />
      </div>
    </div>
  );
}
