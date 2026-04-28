import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useStore from '../store/useStore';
import { TiltedCard } from '../components/TiltedCard';
import { ShieldAlert } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name, email, password, role: 'responder'
      });
      setUser(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[70vh] gap-8 items-center justify-center">

      {/* ── Left: TiltedCard visual panel (hidden on mobile) ── */}
      <div className="hidden md:flex flex-col items-center justify-center flex-1 gap-6 py-8">
        <TiltedCard
          imageSrc="/card-visual.png"
          altText="Smart Incident Response Platform"
          captionText="Smart Incident Response"
          containerHeight="360px"
          containerWidth="320px"
          imageHeight="320px"
          imageWidth="280px"
          rotateAmplitude={12}
          scaleOnHover={1.08}
          showMobileWarning={false}
          showTooltip={true}
          displayOverlayContent={true}
          overlayContent={
            <div
              className="m-4 px-4 py-3 flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(26,60,43,0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: '4px',
                border: '1px solid rgba(158,255,191,0.2)',
              }}
            >
              <ShieldAlert className="w-4 h-4 text-mint shrink-0" />
              <span className="font-mono text-xs uppercase tracking-widest text-mint">
                Join the team
              </span>
            </div>
          }
        />
        <p className="font-mono text-xs uppercase tracking-widest text-grid/40 text-center">
          Real-time incident management
        </p>
      </div>

      {/* ── Divider (desktop only) ── */}
      <div className="hidden md:block w-px self-stretch bg-grid/10" />

      {/* ── Right: Signup form ── */}
      <div className="flex-1 max-w-sm w-full">
        <h2 className="text-3xl mb-2">Sign Up</h2>
        <p className="tech-label mb-8">Create a responder account</p>

        {error && (
          <div className="bg-coral/10 text-coral p-3 mb-4 font-mono text-sm border border-coral/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="tech-label mb-1 block">Full Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="tech-label mb-1 block">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="tech-label mb-1 block">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 6 characters"
            />
          </div>
          <button type="submit" className="btn-primary mt-2">Create Account</button>
        </form>

        <div className="mt-6 font-mono text-sm text-grid/60">
          Already have an account?{' '}
          <Link to="/login" className="text-forest font-bold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
