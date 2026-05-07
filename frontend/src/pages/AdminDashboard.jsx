import { useState, useEffect } from 'react';
import { useAuthStore, api } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Users, Map as MapIcon, ShieldAlert, LogOut, LayoutDashboard, Plus, Trash2, Clock, CheckCircle, XCircle, PlayCircle, LogIn, LogOut as LogOutIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';

const AdminDashboard = () => {
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
  const [editingFence, setEditingFence] = useState(null);
  const [org, setOrg] = useState(null);
  const [summary, setSummary] = useState(null);

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
      const [usersRes, fencesRes, logsRes, sessionsRes, orgRes, summaryRes] = await Promise.all([
        api.get('/users'),
        api.get('/geofences'),
        api.get('/audit'),
        api.get('/attendance/org-active'),
        api.get('/auth/org'),
        api.get('/reports/summary')
      ]);
      setTeam(usersRes.data);
      setGeofences(fencesRes.data);
      setLogs(logsRes.data);
      setActiveSessions(sessionsRes.data);
      setOrg(orgRes.data);
      if (summaryRes.data?.overview) setSummary(summaryRes.data.overview);
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
      alert(err.response?.data?.message || 'Error updating user profile. Please check the details and try again.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.post('/users', Object.fromEntries(formData));
      e.target.reset();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating member. Ensure the email is unique and all fields are valid.');
    }
  };

  const handleUpdateFence = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.put(`/geofences/${editingFence._id}`, {
        name: formData.get('name'),
        lat: Number(formData.get('lat')),
        lng: Number(formData.get('lng')),
        radius: Number(formData.get('radius'))
      });
      setEditingFence(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update Geo-Fence details. Please verify the coordinates and try again.');
    }
  };

  const handleCreateFence = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.post('/geofences', {
        name: formData.get('name'),
        lat: Number(formData.get('lat')),
        lng: Number(formData.get('lng')),
        radius: Number(formData.get('radius'))
      });
      e.target.reset();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating geofence. Ensure name is unique and coordinates are valid.');
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.put('/auth/org', {
        name: formData.get('name'),
        trackingInterval: Number(formData.get('trackingInterval'))
      });
      fetchData();
      alert('Organization settings updated successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save organization changes. Please try again.');
    }
  };

  const handleDeleteFence = async (id) => {
    try {
      await api.delete(`/geofences/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting geofence');
    }
  };

  // Setup bounds for map
  const defaultCenter = geofences.length > 0 
    ? [geofences[0].location.lat, geofences[0].location.lng]
    : [37.7749, -122.4194];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col z-10">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" /> Admin Panel
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'map', icon: MapIcon, label: 'Live Map' },
            { id: 'team', icon: Users, label: 'Team Management' },
            { id: 'geofences', icon: MapIcon, label: 'Geo-Fences' },
            { id: 'reports', icon: LayoutDashboard, label: 'Reports', isLink: true },
            { id: 'audit', icon: ShieldAlert, label: 'Audit Logs' },
            { id: 'settings', icon: LayoutDashboard, label: 'Org Settings' },
          ].map((item) => (
            item.isLink ? (
              <Link
                key={item.id}
                to="/admin/reports"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ) : (
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
            )
          ))}
        </nav>

        <div className="p-4 border-t mt-auto">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center px-8 shadow-sm z-10">
          <h1 className="text-xl font-semibold capitalize">{activeTab.replace('-', ' ')}</h1>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-auto bg-slate-50 relative z-0">
          {activeTab === 'map' && (
            <div className="h-full relative">
              <MapContainer center={defaultCenter} zoom={13} className="w-full h-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* Render Geofences */}
                {geofences.map(fence => (
                  <Circle 
                    key={fence._id}
                    center={[fence.location.lat, fence.location.lng]}
                    radius={fence.radius}
                    pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                  >
                    <Popup>{fence.name}</Popup>
                  </Circle>
                ))}

                {/* Render Live Users */}
                {activeSessions.map(session => {
                  // If we have live socket location, use it, else fallback to punch-in location
                  const liveLoc = liveLocations[session.userId._id]?.location;
                  const loc = liveLoc || session.punchInLocation;
                  const updated = liveLocations[session.userId._id]?.timestamp || session.updatedAt;

                  return (
                    <Marker key={session._id} position={[loc.lat, loc.lng]}>
                      <Popup>
                        <strong>{session.userId.name}</strong><br/>
                        Role: {session.userId.role}<br/>
                        Mode: {session.mode}<br/>
                        Last Update: {format(new Date(updated), 'HH:mm:ss')}
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
              
              {/* Stats Overlay */}
              <div className="absolute top-6 right-6 z-[1000] flex gap-4">
                <Card className="shadow-lg min-w-[200px]">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm text-muted-foreground">Active Employees</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="text-3xl font-bold text-primary">{activeSessions.length}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'map' && summary && (
            <div className="p-6 bg-white border-t shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Today's Attendance Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Team', value: summary.totalEmployees, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Present Today', value: summary.presentToday, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Absent Today', value: summary.absentToday, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Active Now', value: summary.activeSessions, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: 'Punch-Ins', value: summary.totalPunchIns, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Punch-Outs', value: summary.totalPunchOuts, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                  <div key={i} className={`rounded-xl p-4 ${stat.bg} flex flex-col gap-1`}>
                    <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <Card>
                <CardHeader><CardTitle>Add New Member</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    <div className="space-y-1"><label className="text-sm">Name</label><Input name="name" required /></div>
                    <div className="space-y-1"><label className="text-sm">Email</label><Input name="email" type="email" required /></div>
                    <div className="space-y-1"><label className="text-sm">Password</label><Input name="password" required /></div>
                    <div className="space-y-1">
                      <label className="text-sm">Role</label>
                      <select name="role" className="w-full border rounded-md h-10 px-3">
                        <option value="Member">Member</option>
                        {user.role === 'Admin' && <option value="Editor">Editor</option>}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Geo-Fence</label>
                      <select name="assignedGeoFenceId" className="w-full border rounded-md h-10 px-3">
                        <option value="">None</option>
                        {geofences.map(gf => (
                          <option key={gf._id} value={gf._id}>{gf.name}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Add</Button>
                  </form>
                </CardContent>
              </Card>

              {editingUser && (
                <Card className="mb-6 border-primary/20 bg-primary/5">
                  <CardHeader><CardTitle className="text-primary">Edit Member: {editingUser.name}</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateUser} className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                      <div className="space-y-1"><label className="text-sm">Name</label><Input name="name" defaultValue={editingUser.name} required /></div>
                      <div className="space-y-1"><label className="text-sm">Email</label><Input name="email" type="email" defaultValue={editingUser.email} required /></div>
                      <div className="space-y-1"><label className="text-sm">Password (optional)</label><Input name="password" placeholder="New password" /></div>
                      <div className="space-y-1">
                        <label className="text-sm">Role</label>
                        <select name="role" defaultValue={editingUser.role} className="w-full border rounded-md h-10 px-3">
                          <option value="Member">Member</option>
                          {user.role === 'Admin' && <option value="Editor">Editor</option>}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Geo-Fence</label>
                        <select name="assignedGeoFenceId" defaultValue={editingUser.assignedGeoFenceId?._id || ""} className="w-full border rounded-md h-10 px-3">
                          <option value="">None</option>
                          {geofences.map(gf => (
                            <option key={gf._id} value={gf._id}>{gf.name}</option>
                          ))}
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
                <CardHeader><CardTitle>Team Directory</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Geo-Fence</th><th className="p-3">Joined</th><th className="p-3">Actions</th></tr>
                    </thead>
                    <tbody>
                      {team.map(u => (
                        <tr key={u._id} className="border-b">
                          <td className="p-3 font-medium">{u.name}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3"><span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">{u.role}</span></td>
                          <td className="p-3 text-muted-foreground text-sm">{u.assignedGeoFenceId?.name || 'None'}</td>
                          <td className="p-3 text-sm">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm" onClick={() => setEditingUser(u)} className="text-primary hover:bg-primary/10">Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'geofences' && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <Card>
                <CardHeader><CardTitle>Create Geo-Fence</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateFence} className="grid grid-cols-5 gap-4 items-end">
                    <div className="col-span-2 space-y-1"><label className="text-sm">Zone Name</label><Input name="name" placeholder="e.g. HQ Building" required /></div>
                    <div className="space-y-1"><label className="text-sm">Lat</label><Input name="lat" type="number" step="any" placeholder="37.7749" required /></div>
                    <div className="space-y-1"><label className="text-sm">Lng</label><Input name="lng" type="number" step="any" placeholder="-122.4194" required /></div>
                    <div className="space-y-1"><label className="text-sm">Radius (m)</label><Input name="radius" type="number" defaultValue="500" required /></div>
                    <Button type="submit" className="col-span-5"><Plus className="w-4 h-4 mr-2" /> Create Zone</Button>
                  </form>
                </CardContent>
              </Card>

              {editingFence && (
                <Card className="mb-6 border-primary/20 bg-primary/5">
                  <CardHeader><CardTitle className="text-primary">Edit Geo-Fence: {editingFence.name}</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateFence} className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                      <div className="col-span-2 space-y-1"><label className="text-sm">Zone Name</label><Input name="name" defaultValue={editingFence.name} required /></div>
                      <div className="space-y-1"><label className="text-sm">Lat</label><Input name="lat" type="number" step="any" defaultValue={editingFence.location.lat} required /></div>
                      <div className="space-y-1"><label className="text-sm">Lng</label><Input name="lng" type="number" step="any" defaultValue={editingFence.location.lng} required /></div>
                      <div className="space-y-1"><label className="text-sm">Radius (m)</label><Input name="radius" type="number" defaultValue={editingFence.radius} required /></div>
                      <div className="flex gap-2 col-span-2 lg:col-span-5">
                        <Button type="submit" className="flex-1">Update Zone</Button>
                        <Button type="button" variant="outline" onClick={() => setEditingFence(null)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                {geofences.map(fence => (
                  <Card key={fence._id}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">{fence.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingFence(fence)} className="text-primary hover:bg-primary/10">Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFence(fence._id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>Lat: {fence.location.lat}</p>
                      <p>Lng: {fence.location.lng}</p>
                      <p>Radius: {fence.radius}m</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="p-8 max-w-6xl mx-auto">
              <Card>
                <CardHeader><CardTitle>System Audit Logs</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b">
                        <tr><th className="p-3">Time</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Details</th></tr>
                      </thead>
                      <tbody>
                        {logs.map(log => (
                          <tr key={log._id} className="border-b hover:bg-slate-50">
                            <td className="p-3 whitespace-nowrap text-muted-foreground">{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}</td>
                            <td className="p-3 font-medium">{log.actorId?.name || 'System'}</td>
                            <td className="p-3"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{log.action}</span></td>
                            <td className="p-3">{log.targetEntity}</td>
                            <td className="p-3 text-xs text-muted-foreground truncate max-w-xs">{log.details ? JSON.stringify(log.details) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'settings' && org && (
            <div className="p-8 max-w-2xl mx-auto">
              <Card>
                <CardHeader><CardTitle>Organization Settings</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateOrg} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Organization Name</label>
                      <Input name="name" defaultValue={org.name} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Remote Tracking Interval (Minutes)</label>
                      <select name="trackingInterval" defaultValue={org.trackingInterval} className="w-full border rounded-md h-10 px-3">
                        <option value="5">5 Minutes (Standard)</option>
                        <option value="10">10 Minutes</option>
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes (Maximum)</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">Defines how often GPS coordinates are recorded during Remote mode.</p>
                    </div>
                    <Button type="submit" className="w-full">Save Settings</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
