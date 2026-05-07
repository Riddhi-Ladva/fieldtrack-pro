import { useState, useEffect, useCallback } from 'react';
import { useAuthStore, api } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  LogOut, Download, Users, CheckCircle, XCircle,
  PlayCircle, LogIn, LogOut as LogOutIcon, Search,
  ChevronLeft, ChevronRight, FileText, BarChart2
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const ROWS_PER_PAGE = 10;

const Reports = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Summary state
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);

  // Filter state
  const [range, setRange] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Table state
  const [sessions, setSessions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dashboardLink = user?.role === 'Admin' ? '/admin/dashboard' : '/editor/dashboard';

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      } else {
        params.set('range', range);
      }
      const { data } = await api.get(`/reports/summary?${params}`);
      setOverview(data.overview);
      setTrend(data.trend);
    } catch (err) {
      console.error('Failed to fetch summary', err);
    }
    setLoading(false);
  }, [range, startDate, endDate]);

  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }
      // Fetch raw attendance data for the table
      const { data } = await api.get(`/reports/records?${params}`);
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSummary();
    fetchSessions();
  }, [fetchSummary, fetchSessions]);

  // Client-side search filtering
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      sessions.filter(s =>
        !q ||
        s.userId?.name?.toLowerCase().includes(q) ||
        s.userId?.email?.toLowerCase().includes(q)
      )
    );
    setPage(1);
  }, [sessions, search]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginatedSessions = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }
      if (search) params.set('search', search);

      const response = await api.get(`/reports/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('CSV export failed. Please try again.');
    }
    setExporting(false);
  };

  const summaryCards = overview ? [
    { label: 'Total Team', value: overview.totalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Present Today', value: overview.presentToday, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { label: 'Absent Today', value: overview.absentToday, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'Active Now', value: overview.activeSessions, icon: PlayCircle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Punch-Ins Today', value: overview.totalPunchIns, icon: LogIn, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Punch-Outs Today', value: overview.totalPunchOuts, icon: LogOutIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ] : [];

  const modeColor = (mode) => mode === 'Remote'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-green-100 text-green-700';

  const statusColor = (status) => status === 'Active'
    ? 'bg-orange-100 text-orange-700'
    : 'bg-slate-100 text-slate-600';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col z-10 shrink-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <BarChart2 className="w-5 h-5" /> Reports
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to={dashboardLink}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium bg-primary/10 text-primary">
            <FileText className="w-4 h-4" /> Attendance Reports
          </div>
        </nav>
        <div className="p-4 border-t mt-auto">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-xl font-semibold">Attendance Reports</h1>
          <Button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-8 space-y-8">
          {/* Summary Cards */}
          {overview && (
            <div>
              <h2 className="text-base font-semibold mb-4 text-slate-700">Today's Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {summaryCards.map((stat, i) => (
                  <Card key={i} className={`border ${stat.border} shadow-sm`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                          <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Filter Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                {/* Preset Ranges */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Quick Range</label>
                  <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly'].map(r => (
                      <button
                        key={r}
                        onClick={() => { setRange(r); setStartDate(''); setEndDate(''); }}
                        className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors capitalize ${
                          range === r && !startDate ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Range */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Custom From</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-40 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Custom To</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-40 h-9 text-sm"
                  />
                </div>

                <Button onClick={() => { fetchSummary(); fetchSessions(); }} className="h-9">
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setStartDate(''); setEndDate(''); setRange('monthly'); setSearch(''); }}
                  className="h-9"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trend Section */}
          {trend.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Daily Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  {trend.map(day => (
                    <div key={day._id} className="flex flex-col items-center bg-slate-50 rounded-lg px-4 py-3 min-w-[90px] border">
                      <span className="text-xs text-muted-foreground mb-1">{format(new Date(day._id + 'T00:00:00'), 'MMM d')}</span>
                      <span className="text-2xl font-bold text-primary">{day.count}</span>
                      <span className="text-xs text-muted-foreground">punches</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance Table */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base">Attendance Records ({filtered.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading records...</div>
              ) : paginatedSessions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No records found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or date range</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-4 font-medium text-muted-foreground">Employee</th>
                        <th className="p-4 font-medium text-muted-foreground">Date</th>
                        <th className="p-4 font-medium text-muted-foreground">Mode</th>
                        <th className="p-4 font-medium text-muted-foreground">Punch In</th>
                        <th className="p-4 font-medium text-muted-foreground">Punch Out</th>
                        <th className="p-4 font-medium text-muted-foreground">Duration</th>
                        <th className="p-4 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSessions.map(s => (
                        <tr key={s._id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{s.userId?.name}</div>
                            <div className="text-xs text-muted-foreground">{s.userId?.email}</div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {format(new Date(s.punchInTime), 'MMM d, yyyy')}
                          </td>
                          <td className="p-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${modeColor(s.mode)}`}>
                              {s.mode}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {format(new Date(s.punchInTime), 'hh:mm a')}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {s.punchOutTime ? format(new Date(s.punchOutTime), 'hh:mm a') : '—'}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {s.duration ? `${s.duration} min` : '—'}
                          </td>
                          <td className="p-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(s.status)}`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({filtered.length} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Reports;
