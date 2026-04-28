import { create } from 'zustand';

const useStore = create((set) => ({
  // User state — persisted in localStorage
  user: JSON.parse(localStorage.getItem('user')) || null,

  // Incidents list
  incidents: [],

  // Users list (for admin panel)
  users: [],

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
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
