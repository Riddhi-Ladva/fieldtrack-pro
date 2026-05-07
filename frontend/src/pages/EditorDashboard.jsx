import { useState, useEffect } from 'react';
import { useAuthStore, api } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Users, Map as MapIcon, ShieldAlert, LogOut, LayoutDashboard, Plus, Download, History, Edit3 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';

const EditorDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const connectSocket = useSocketStore((state) => state.connect);
  const disconnectSocket = useSocketStore((state) => state.disconnect);
  const liveLocations = useSocketStore((state) => state.liveLocations);

  const [activeTab, setActiveTab] = useState('map');
  const [team, setTeam] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    connectSocket(user.organizationId);
    fetchData();
    window._refetchAdminData = fetchData;
    return () => {
      disconnectSocket();
      delete window._refetchAdminData;
    };
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, fencesRes, logsRes, sessionsRes, reportRes] = await Promise.all([
        api.get('/users'),
        api.get('/geofences'),
        api.get('/audit'),
        api.get('/attendance/org-active'),
        api.get('/reports/summary?range=weekly')
      ]);
      setTeam(usersRes.data);
      setGeofences(fencesRes.data);
      setLogs(logsRes.data);
      setActiveSessions(sessionsRes.data);
      setReportData(reportRes.data?.trend || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };


  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      await api.put(`/users/${editingUser._id}`, data);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed');
    }
  };

  const defaultCenter = geofences.length > 0 
    ? [geofences[0].location.lat, geofences[0].location.lng]
    : [37.7749, -122.4194];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col z-10">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Edit3 className="w-5 h-5" /> Supervisor
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'map', icon: MapIcon, label: 'Live Tracking' },
            { id: 'team', icon: Users, label: 'Team Members' },
            { id: 'attendance', icon: History, label: 'Attendance' },
            { id: 'logs', icon: ShieldAlert, label: 'My Activity' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          <a
            href="/editor/reports"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Reports
          </a>
        </nav>

        <div className="p-4 border-t mt-auto">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">Team Supervisor</p>
          </div>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 shadow-sm z-10">
          <h1 className="text-xl font-semibold capitalize">{activeTab.replace('-', ' ')}</h1>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 relative z-0">
          {activeTab === 'map' && (
            <div className="h-full relative">
              <MapContainer center={defaultCenter} zoom={13} className="w-full h-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {geofences.map(fence => (
                  <Circle key={fence._id} center={[fence.location.lat, fence.location.lng]} radius={fence.radius} pathOptions={{ color: 'blue', fillOpacity: 0.1 }} />
                ))}
                {activeSessions.map(session => {
                  const loc = liveLocations[session.userId._id]?.location || session.punchInLocation;
                  return (
                    <Marker key={session._id} position={[loc.lat, loc.lng]}>
                      <Popup><strong>{session.userId.name}</strong><br/>Status: Active<br/>Mode: {session.mode}</Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              <div className="absolute top-6 right-6 z-[1000]">
                <Card className="shadow-lg p-4 bg-white/90 backdrop-blur">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Live Sessions</div>
                  <div className="text-3xl font-black text-primary">{activeSessions.length}</div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              {editingUser && (
                <Card className="mb-6 border-primary/20 bg-primary/5">
                  <CardHeader><CardTitle className="text-primary text-base">Edit Member: {editingUser.name}</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateUser} className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1"><label className="text-sm">Name</label><Input name="name" defaultValue={editingUser.name} required /></div>
                      <div className="space-y-1"><label className="text-sm">Email</label><Input name="email" defaultValue={editingUser.email} required /></div>
                      <div className="space-y-1">
                        <label className="text-sm">Geo-Fence</label>
                        <select name="assignedGeoFenceId" defaultValue={editingUser.assignedGeoFenceId?._id || ""} className="w-full border rounded-md h-10 px-3 text-sm">
                          <option value="">None</option>
                          {geofences.map(gf => <option key={gf._id} value={gf._id}>{gf.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Update</Button>
                        <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader><CardTitle className="text-lg">Team Directory</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr><th className="p-3">Member</th><th className="p-3">Email</th><th className="p-3">Geo-Fence</th><th className="p-3">Action</th></tr>
                    </thead>
                    <tbody>
                      {team.filter(u => u.role === 'Member').map(u => (
                        <tr key={u._id} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-medium">{u.name}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3 text-xs">{u.assignedGeoFenceId?.name || 'Manual'}</td>
                          <td className="p-3"><Button variant="ghost" size="sm" onClick={() => setEditingUser(u)} className="text-primary">Edit</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="p-8 max-w-6xl mx-auto">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Attendance History</CardTitle>
                  <Button onClick={handleExportCSV} variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground mb-4">Displaying all team activity. Use the export tool for full historical records.</p>
                   {/* Table of sessions could go here */}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="p-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {reportData.map(day => (
                <Card key={day._id}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{format(new Date(day._id), 'EEEE, MMM d')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{day.count} Punches</div>
                    <div className="text-xs text-primary mt-1">{day.totalDistance.toFixed(1)} km total travel</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader><CardTitle>My Activity History</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {logs.map(log => (
                      <div key={log._id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div>
                          <span className="text-xs font-bold uppercase text-primary bg-primary/5 px-2 py-0.5 rounded">{log.action}</span>
                          <p className="text-sm mt-1">{log.targetEntity} Update</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EditorDashboard;
