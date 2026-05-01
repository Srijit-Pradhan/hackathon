import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useStore();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-4xl md:text-5xl font-bold mb-8">Your Profile</h1>
      
      <div className="card space-y-6">
        <div className="flex items-center gap-4 border-b border-grid/10 pb-6">
          <div className="w-16 h-16 bg-grid text-paper flex items-center justify-center font-display text-2xl uppercase shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <div className="font-mono text-xs text-grid/60 uppercase tracking-widest mt-1 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Role: {user.role || 'Responder'}
            </div>
          </div>
        </div>

        <div className="space-y-4 font-mono text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-grid/50 text-[10px] uppercase tracking-widest">Email Address</span>
            <div className="flex items-center gap-2 text-base font-sans bg-paper p-3 border border-grid/10">
              <Mail className="w-4 h-4 text-grid/50" />
              {user.email}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-grid/50 text-[10px] uppercase tracking-widest">Account ID</span>
            <div className="text-grid/80 bg-paper p-3 border border-grid/10 text-xs">
              {user._id}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-grid/10 flex justify-end">
          <button onClick={handleLogout} className="btn-primary bg-coral text-paper border-coral hover:bg-paper hover:text-coral transition-colors">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
