import { create } from 'zustand';

// Load persisted notifications from localStorage
const loadNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem('notifications')) || [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications) => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50)));
  } catch {}
};

const useStore = create((set) => ({
  // User state — persisted in localStorage
  user: JSON.parse(localStorage.getItem('user')) || null,

  // Incidents list
  incidents: [],

  // Users list (for admin panel)
  users: [],

  // Notifications — persisted in localStorage
  notifications: loadNotifications(),

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      // Clear notifications on logout
      localStorage.removeItem('notifications');
    }
    set({ user, notifications: user ? loadNotifications() : [] });
  },

  addNotification: (notification) => set((state) => {
    const newNotification = {
      id: Date.now(),
      read: false,
      ...notification,
    };
    const updated = [newNotification, ...state.notifications].slice(0, 50);
    saveNotifications(updated);
    return { notifications: updated };
  }),

  markAllRead: () => set((state) => {
    const updated = state.notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    return { notifications: updated };
  }),

  clearNotifications: () => {
    localStorage.removeItem('notifications');
    set({ notifications: [] });
  },

  setIncidents: (incidents) => set({ incidents }),

  addIncident: (incident) => set((state) => ({
    incidents: [incident, ...state.incidents]
  })),

  updateIncident: (updatedIncident) => set((state) => ({
    incidents: state.incidents.map(inc =>
      inc._id === updatedIncident._id ? updatedIncident : inc
    )
  })),

  setUsers: (users) => set({ users }),
}));

export default useStore;
