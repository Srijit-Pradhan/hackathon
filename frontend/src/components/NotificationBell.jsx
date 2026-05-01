import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import useStore from '../store/useStore';

export default function NotificationBell() {
  const { notifications, markAllRead, clearNotifications } = useStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close panel on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) {
      // Mark read when panel is opened
      setTimeout(() => markAllRead(), 300);
    }
  };

  const handleNotificationClick = (incidentId) => {
    setOpen(false);
    navigate(`/incident/${incidentId}`);
  };

  return (
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: '19px', right: '180px', zIndex: 9999 }}
    >
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: 'relative',
          background: 'rgba(247,247,245,0.95)',
          border: '1px solid rgba(58,58,56,0.15)',
          borderRadius: '4px',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#1A3C2B';
          e.currentTarget.style.borderColor = '#1A3C2B';
          e.currentTarget.querySelector('svg').style.color = '#9EFFBF';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(247,247,245,0.95)';
          e.currentTarget.style.borderColor = 'rgba(58,58,56,0.15)';
          e.currentTarget.querySelector('svg').style.color = '#3A3A38';
        }}
      >
        <Bell size={18} style={{ color: '#3A3A38', transition: 'color 0.2s' }} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#FF4444',
            color: '#fff',
            borderRadius: '999px',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 700,
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #F7F7F5',
            animation: 'bellPulse 1.5s ease-in-out infinite',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '54px',
          right: 0,
          width: '340px',
          background: '#F7F7F5',
          border: '1px solid rgba(58,58,56,0.15)',
          borderRadius: '4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          animation: 'slideDown 0.15s ease',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(58,58,56,0.1)',
            background: '#1A3C2B',
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#9EFFBF',
              fontWeight: 700,
            }}>
              🔔 Notifications {unreadCount > 0 && `(${unreadCount} new)`}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  title="Clear all"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(247,247,245,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FF8C69'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(247,247,245,0.5)'}
                >
                  <X size={12} /> Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(247,247,245,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s',
                  padding: '2px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#F7F7F5'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(247,247,245,0.5)'}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'rgba(58,58,56,0.4)',
              }}>
                <CheckCheck size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.incidentId)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(58,58,56,0.07)',
                    cursor: 'pointer',
                    background: n.read ? 'transparent' : 'rgba(158,255,191,0.06)',
                    transition: 'background 0.15s',
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,60,43,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(158,255,191,0.06)'}
                >
                  {/* Dot indicator */}
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: n.read ? 'rgba(58,58,56,0.2)' : '#9EFFBF',
                    marginTop: '4px',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: 'rgba(58,58,56,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '2px',
                    }}>
                      You were assigned
                    </div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#1A3C2B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '2px',
                    }}>
                      {n.incidentTitle}
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: 'rgba(58,58,56,0.5)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span>by {n.assignedBy}</span>
                      <span>{n.timestamp ? formatDistanceToNow(new Date(n.timestamp), { addSuffix: true }) : ''}</span>
                    </div>
                  </div>
                  <ExternalLink size={12} style={{ color: 'rgba(58,58,56,0.3)', marginTop: '4px', flexShrink: 0 }} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes bellPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
