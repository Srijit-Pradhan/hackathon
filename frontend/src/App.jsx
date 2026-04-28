import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { StaggeredMenu } from './components/StaggeredMenu';
import useStore from './store/useStore';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import IncidentDetail from './pages/IncidentDetail';
import StatusPage from './pages/StatusPage';
import AdminPanel from './pages/AdminPanel';

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
      ? [{ label: 'Logout', ariaLabel: 'Log out of your account', link: '#', onClick: handleLogout }]
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
          className="flex items-center gap-2 text-forest font-display font-bold text-lg"
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="hidden sm:inline">IncidentResponse</span>
          <span className="sm:hidden">IR</span>
        </Link>
      }
    />
  );
}

function App() {
  return (
    <Router>
      <GlobalMenu />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/app" element={<Layout />}>
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="incident/:id" element={<ProtectedRoute><IncidentDetail /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
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
