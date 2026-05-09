import { create } from 'zustand';
import { io } from 'socket.io-client';

export const useSocketStore = create((set, get) => ({
  socket: null,
  liveLocations: {}, // { userId: { location, timestamp } }
  attendanceUpdates: [],
  breachAlerts: [],

  connect: (organizationId) => {
    const orgIdStr = typeof organizationId === 'object' && organizationId !== null ? organizationId._id : organizationId;
    
    if (!get().socket) {
      const newSocket = io('http://localhost:5000');
      
      newSocket.on('connect', () => {
        newSocket.emit('join-org', orgIdStr);
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

      newSocket.on('geo-fence-breach', (data) => {
        set((state) => ({
          breachAlerts: [data, ...state.breachAlerts].slice(0, 10)
        }));
        // Show browser notification if supported
        if (Notification.permission === 'granted') {
          new Notification(`Geo-Fence Breach Alert`, {
            body: `${data.userName} has exited their assigned geo-fence zone.`,
            icon: '/favicon.ico'
          });
        }
      });

      set({ socket: newSocket });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, liveLocations: {}, breachAlerts: [] });
    }
  },

  sendLocation: (organizationId, userId, location) => {
    const orgIdStr = typeof organizationId === 'object' && organizationId !== null ? organizationId._id : organizationId;
    const userIdStr = typeof userId === 'object' && userId !== null ? userId._id : userId;
    
    const { socket } = get();
    if (socket) {
      socket.emit('send-location', { organizationId: orgIdStr, userId: userIdStr, location });
    }
  }
}));
