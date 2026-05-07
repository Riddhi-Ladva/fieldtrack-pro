import { create } from 'zustand';
import { io } from 'socket.io-client';

export const useSocketStore = create((set, get) => ({
  socket: null,
  liveLocations: {}, // { userId: { location, timestamp } }
  attendanceUpdates: [],

  connect: (organizationId) => {
    if (!get().socket) {
      const newSocket = io('http://localhost:5000');
      
      newSocket.on('connect', () => {
        newSocket.emit('join-org', organizationId);
      });

      newSocket.on('live-location-update', (data) => {
        set((state) => ({
          liveLocations: {
            ...state.liveLocations,
            [data.userId]: {
              location: data.location,
              timestamp: data.timestamp
            }
          }
        }));
      });

      newSocket.on('attendance-status-changed', (data) => {
        set((state) => ({
          attendanceUpdates: [data, ...state.attendanceUpdates].slice(0, 10)
        }));
        // Notify any listeners that they should refetch active sessions
        if (window._refetchAdminData) {
          window._refetchAdminData();
        }
      });

      set({ socket: newSocket });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, liveLocations: {} });
    }
  },

  sendLocation: (organizationId, userId, location) => {
    const { socket } = get();
    if (socket) {
      socket.emit('send-location', { organizationId, userId, location });
    }
  }
}));
