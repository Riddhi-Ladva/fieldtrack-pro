import { useState, useEffect } from 'react';
import { useAuthStore, api } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import useGeolocation from '../hooks/useGeolocation';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { LogOut, MapPin, Clock, Play, Square } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to center map on user
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 16);
  }, [center, map]);
  return null;
};

const MemberDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const connectSocket = useSocketStore((state) => state.connect);
  const disconnectSocket = useSocketStore((state) => state.disconnect);
  const sendLocation = useSocketStore((state) => state.sendLocation);
  
  const { location, error: geoError } = useGeolocation();
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState('Remote'); // 'Remote' or 'Geo-Fenced'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    connectSocket(user.organizationId);
    fetchActiveSession();
    return () => disconnectSocket();
  }, []);

  const fetchActiveSession = async () => {
    try {
      const { data } = await api.get('/attendance/active');
      setSession(data);
      if (data) setMode(data.mode);
    } catch (err) {
      console.error('Failed to fetch session', err);
    }
  };

  // Dynamic interval tracking
  useEffect(() => {
    let interval;
    if (session && session.status === 'Active' && location) {
      // Fetch dynamic interval from store or user object if available
      // Fallback to 5 minutes (300,000ms) if not specified
      const trackingIntervalMin = user.organizationId?.trackingInterval || 5;
      const intervalMs = session.mode === 'Remote' 
        ? trackingIntervalMin * 60000 
        : 10000; // Keep 10s for Geo-Fenced for high accuracy

      interval = setInterval(() => {
        // Send via socket for realtime
        sendLocation(user.organizationId, user._id, location);
        
        // Log to backend DB
        api.post('/attendance/location', { location }).catch(console.error);
      }, intervalMs);
    }
    return () => clearInterval(interval);
  }, [session, location, user.organizationId?.trackingInterval]);

  const handlePunchIn = async () => {
    if (!location) {
      setError('Waiting for GPS location...');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Generate a simple fingerprint for the device
      const deviceId = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}`;
      const punchInMode = user.assignedGeoFenceId ? 'Geo-Fenced' : mode;
      
      const { data } = await api.post('/attendance/punch-in', { 
        mode: punchInMode, 
        location,
        deviceId 
      });
      setSession(data);
      toast.success(`Successfully Punched In (${punchInMode})`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to punch in. Please ensure you are at your assigned location and have a stable internet connection.');
    }
    setLoading(false);
  };

  const handlePunchOut = async () => {
    setLoading(true);
    try {
      await api.post('/attendance/punch-out');
      setSession(null);
      toast.success('Shift completed. Safe travels!');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to punch out. Please check your network connection and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Clock className="w-6 h-6" /> FieldTrack Pro
          </h2>
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-6">
          <div>
            <h3 className="font-medium text-lg">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Attendance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${session ? 'bg-green-500' : 'bg-slate-300'}`} />
                <span className="font-medium">{session ? 'Active (Punched In)' : 'Inactive (Punched Out)'}</span>
              </div>
              
              {!session && (
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Mode</label>
                  {user.assignedGeoFenceId ? (
                    <div className="text-xs font-semibold bg-primary/10 text-primary p-3 rounded-md border border-primary/20">
                      Strict Geo-Fenced Mode (Assigned)
                    </div>
                  ) : (
                    <select 
                      className="w-full border rounded-md p-2 text-sm"
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <option value="Remote">Remote (Anywhere)</option>
                      <option value="Geo-Fenced">Geo-Fenced (HQ Only)</option>
                    </select>
                  )}
                </div>
              )}

              {error && <div className="text-sm text-destructive mb-2 bg-destructive/10 p-2 rounded">{error}</div>}
              {geoError && <div className="text-sm text-destructive mb-2">{geoError}</div>}

              {session ? (
                <Button variant="destructive" className="w-full" onClick={handlePunchOut} disabled={loading}>
                  <Square className="w-4 h-4 mr-2" /> Punch Out
                </Button>
              ) : (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handlePunchIn} disabled={loading || !location}>
                  <Play className="w-4 h-4 mr-2" /> Punch In
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="p-6 border-t mt-auto">
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        {!location ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <div className="animate-pulse text-muted-foreground flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8" />
              <p>Acquiring GPS Signal...</p>
            </div>
          </div>
        ) : (
          <MapContainer 
            center={[location.lat, location.lng]} 
            zoom={16} 
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]}>
              <Popup>You are here</Popup>
            </Marker>
            <MapUpdater center={location} />
          </MapContainer>
        )}

        {/* Status Overlay */}
        {session && (
          <div className="absolute top-6 left-6 z-[1000] bg-white px-4 py-2 rounded-full shadow-lg flex flex-col gap-1 border border-green-200">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Live Tracking Active</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Mode: {session.mode} | Interval: {session.mode === 'Remote' ? (user.organizationId?.trackingInterval || 5) : '10s'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
