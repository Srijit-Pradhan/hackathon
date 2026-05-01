import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { StaggeredMenu } from './components/StaggeredMenu';
import NotificationBell from './components/NotificationBell';
import useStore from './store/useStore';
import { SOCKET_URL } from './config/api';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import IncidentDetail from './pages/IncidentDetail';
import StatusPage from './pages/StatusPage';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';

function GlobalMenu() {
  const { user, setUser } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const menuItems = [
    { label: 'Home',      ariaLabel: 'Go to home page',     link: '/' },
    { label: 'Dashboard', ariaLabel: 'Open dashboard',      link: '/dashboard' },
    { label: 'Status',    ariaLabel: 'View status page',    link: '/status' },
    ...(user?.role === 'admin'
      ? [{ label: 'Admin', ariaLabel: 'Open admin panel',   link: '/admin' }]
      : []),
    ...(user
      ? [
          { label: `Profile`, ariaLabel: 'User Profile', link: '/profile' },
          { label: 'Logout', ariaLabel: 'Log out of your account', link: '#', onClick: handleLogout }
        ]
      : [
          { label: 'Login',   ariaLabel: 'Login to your account', link: '/login' },
          { label: 'Sign Up', ariaLabel: 'Create an account',     link: '/signup' },
        ]),
  ];

  const socialLinks = [
    { label: 'GitHub',   link: 'https://github.com' },
    { label: 'Twitter',  link: 'https://twitter.com' },
    { label: 'LinkedIn', link: 'https://linkedin.com' },
  ];

  return (
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
          className="flex items-center gap-2 text-forest font-display font-bold text-2xl"
        >
          <ShieldAlert className="w-6 h-6" />
          <span className="hidden sm:inline">incident<span style={{color:'#9EFFBF'}}>IQ</span></span>
          <span className="sm:hidden">iIQ</span>
        </Link>
      }
    />
  );
}

// Global socket — joins user's personal room and listens for notifications
function GlobalNotifications() {
  const { user, addNotification } = useStore();
  const socketRef = useRef(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Connect and join personal room
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinUserRoom', user._id);

    // Listen for assignment notifications
    socketRef.current.on('youAreAssigned', (data) => {
      addNotification(data);
      // Show toast
      setToast(data);
      setTimeout(() => setToast(null), 5000);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, addNotification]);

  if (!toast) return null;

  return (
    <div
      onClick={() => setToast(null)}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1A3C2B',
        color: '#F7F7F5',
        padding: '14px 24px',
        borderRadius: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'monospace',
        fontSize: '13px',
        cursor: 'pointer',
        animation: 'slideUp 0.3s ease',
        maxWidth: '400px',
        width: 'calc(100vw - 48px)',
        border: '1px solid rgba(158,255,191,0.3)',
      }}
    >
      <span style={{ fontSize: '20px' }}>🔔</span>
      <div>
        <div style={{ color: '#9EFFBF', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
          You were assigned an incident
        </div>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#F7F7F5' }}>
          {toast.incidentTitle}
        </div>
        <div style={{ color: 'rgba(247,247,245,0.55)', fontSize: '11px', marginTop: '2px' }}>
          by {toast.assignedBy} — click to open
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <Router>
      <GlobalMenu />
      <GlobalNotifications />
      <NotificationBell />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/app" element={<Layout />}>
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="incident/:id" element={<ProtectedRoute><IncidentDetail /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
        </Route>

        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Route>
        <Route path="/incident/:id" element={<Layout />}>
          <Route index element={<ProtectedRoute><IncidentDetail /></ProtectedRoute>} />
        </Route>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        </Route>
        <Route path="/profile" element={<Layout />}>
          <Route index element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Route>
        <Route path="/login" element={<Layout />}>
          <Route index element={<Login />} />
        </Route>
        <Route path="/signup" element={<Layout />}>
          <Route index element={<Signup />} />
        </Route>
        <Route path="/status" element={<Layout />}>
          <Route index element={<StatusPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
