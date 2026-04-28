import { useEffect, useState } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import { format } from 'date-fns';
import { Trash2, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RollingCounter } from '../components/RollingCounter';

export default function AdminPanel() {
  const { user } = useStore();
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'incidents'
  const [error, setError] = useState('');

  const authConfig = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, incidentsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/users', authConfig),
          axios.get('http://localhost:5000/api/admin/incidents', authConfig),
        ]);
        setUsers(usersRes.data);
        setIncidents(incidentsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, authConfig);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-coral';
      case 'Investigating': return 'text-gold';
      case 'Resolved': return 'text-mint';
      default: return 'text-grid';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'border-coral text-coral';
      case 'responder': return 'border-gold text-gold';
      default: return 'border-grid/40 text-grid/60';
    }
  };

  if (loading) return <div className="p-12 font-mono">Loading admin panel...</div>;
  if (error) return <div className="p-12 font-mono text-coral">Error: {error}</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-8 h-8 text-forest" />
        <h1 className="text-4xl md:text-5xl">Admin Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Users */}
        <div className="card text-center flex flex-col items-center gap-2">
          <RollingCounter
            value={users.length}
            fontSize={36}
            textColor="#1A3C2B"
            gradientFrom="#ffffff"
            gradientHeight={10}
            fontWeight={700}
          />
          <div className="tech-label">Total Users</div>
        </div>

        {/* Open */}
        <div className="card text-center flex flex-col items-center gap-2">
          <RollingCounter
            value={incidents.filter(i => i.status === 'Open').length}
            fontSize={36}
            textColor="#FF8C69"
            gradientFrom="#ffffff"
            gradientHeight={10}
            fontWeight={700}
          />
          <div className="tech-label">Open Incidents</div>
        </div>

        {/* Investigating */}
        <div className="card text-center flex flex-col items-center gap-2">
          <RollingCounter
            value={incidents.filter(i => i.status === 'Investigating').length}
            fontSize={36}
            textColor="#F4D35E"
            gradientFrom="#ffffff"
            gradientHeight={10}
            fontWeight={700}
          />
          <div className="tech-label">Investigating</div>
        </div>

        {/* Resolved */}
        <div className="card text-center flex flex-col items-center gap-2">
          <RollingCounter
            value={incidents.filter(i => i.status === 'Resolved').length}
            fontSize={36}
            textColor="#9EFFBF"
            gradientFrom="#ffffff"
            gradientHeight={10}
            fontWeight={700}
          />
          <div className="tech-label">Resolved</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors ${
            activeTab === 'users'
              ? 'border-forest text-forest bg-forest/10'
              : 'border-grid/20 text-grid/60 hover:border-grid/40'
          }`}
        >
          <Users className="w-4 h-4" /> Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors ${
            activeTab === 'incidents'
              ? 'border-forest text-forest bg-forest/10'
              : 'border-grid/20 text-grid/60 hover:border-grid/40'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Incidents ({incidents.length})
        </button>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-grid/20 text-grid/60 text-xs uppercase tracking-widest">
                <th className="text-left py-3 pr-4">Name</th>
                <th className="text-left py-3 pr-4">Email</th>
                <th className="text-left py-3 pr-4">Role</th>
                <th className="text-left py-3 pr-4">Joined</th>
                <th className="text-right py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-grid/10 hover:bg-paper/50 transition-colors">
                  <td className="py-3 pr-4">{u.name}</td>
                  <td className="py-3 pr-4 text-grid/70">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge text-[10px] ${getRoleBadge(u.role)}`}>{u.role}</span>
                  </td>
                  <td className="py-3 pr-4 text-grid/60">
                    {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="py-3 text-right">
                    {u._id !== user._id && (
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="text-grid/40 hover:text-coral transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center py-8 text-grid/40 font-mono text-sm">No users found.</p>
          )}
        </div>
      )}

      {/* Incidents Table */}
      {activeTab === 'incidents' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-grid/20 text-grid/60 text-xs uppercase tracking-widest">
                <th className="text-left py-3 pr-4">Title</th>
                <th className="text-left py-3 pr-4">Status</th>
                <th className="text-left py-3 pr-4">Severity</th>
                <th className="text-left py-3 pr-4">Timeline</th>
                <th className="text-left py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc._id} className="border-b border-grid/10 hover:bg-paper/50 transition-colors">
                  <td className="py-3 pr-4 max-w-[200px] truncate">{inc.title}</td>
                  <td className={`py-3 pr-4 ${getStatusColor(inc.status)}`}>{inc.status}</td>
                  <td className="py-3 pr-4 text-grid/70">{inc.severity}</td>
                  <td className="py-3 pr-4 text-grid/60">{inc.timeline?.length || 0} updates</td>
                  <td className="py-3 text-grid/60">
                    {format(new Date(inc.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {incidents.length === 0 && (
            <p className="text-center py-8 text-grid/40 font-mono text-sm">No incidents found.</p>
          )}
        </div>
      )}
    </div>
  );
}
