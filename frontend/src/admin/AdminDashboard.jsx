import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../src/student/pages/Api';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats State
  const [stats, setStats] = useState({
    usersCount: 0,
    resourcesCount: 0,
    labsCount: 0,
    todayBookingsCount: 0,
  });

  // Action Items / System Alerts
  const [actionRequired, setActionRequired] = useState([]);

  // Table Data
  const [recentBookings, setRecentBookings] = useState([]);
  const [labStatuses, setLabStatuses] = useState([]);
  const [resourceSummary, setResourceSummary] = useState({
    available: 0,
    limited: 0,
    booked: 0,
    maintenance: 0,
  });

  const getToken = () => localStorage.getItem('labToken') || localStorage.getItem('token');

  // Fetch Dashboard Summary Data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Concurrently fetch overview data
      const [statsRes, bookingsRes, labsRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/admin/stats`, { headers }),
        axios.get(`${BACKEND_URL}/bookings/admin/all`, { headers }),
        axios.get(`${BACKEND_URL}/labs`, { headers }),
      ]);

      // Populate Recent Bookings from API response
      if (bookingsRes.status === 'fulfilled') {
        const rawBookings = bookingsRes.value.data?.bookings || bookingsRes.value.data || [];
        const formatted = rawBookings.slice(0, 5).map((item) => ({
          id: item._id,
          user: item.user?.name || 'Unknown User',
          type: (item.user?.role || 'STUDENT').toUpperCase(),
          target: item.resource?.name || item.lab?.name || 'Resource/Lab',
          date: item.date ? new Date(item.date).toLocaleDateString() : 'Today',
          status: (item.status || 'PENDING').toUpperCase(),
        }));
        setRecentBookings(formatted);
      }

      // Populate Stats if available
      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value.data || {};
        setStats({
          usersCount: data.usersCount || 0,
          resourcesCount: data.resourcesCount || 0,
          labsCount: data.labsCount || 0,
          todayBookingsCount: data.todayBookingsCount || 0,
        });
      }

      // Populate Labs Status
      if (labsRes.status === 'fulfilled') {
        const labs = labsRes.value.data || [];
        setLabStatuses(labs);
      }
    } catch (err) {
      console.warn('Failed to load dashboard metrics:', err.message);
      setError('Failed to refresh live metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Status Badge Helper matching Faculty Dashboard
  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">APPROVED</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">REJECTED</span>;
      case 'PENDING':
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">PENDING</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            👋 Good Morning, Admin
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here's what's happening across LabSync.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold rounded-lg transition-all"
        >
          🔄 Sync Data
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 font-medium">👥 Users</div>
          <p className="text-2xl font-extrabold text-white mt-2">{stats.usersCount}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 font-medium">📦 Resources</div>
          <p className="text-2xl font-extrabold text-white mt-2">{stats.resourcesCount}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 font-medium">🏢 Labs</div>
          <p className="text-2xl font-extrabold text-white mt-2">{stats.labsCount}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 font-medium">📋 Today Bookings</div>
          <p className="text-2xl font-extrabold text-white mt-2">{stats.todayBookingsCount}</p>
        </div>
      </div>

      {/* Action Required Section */}
      <div className="mb-8 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <h2 className="text-xs font-bold tracking-wider text-amber-400 uppercase mb-3 flex items-center gap-2">
          ⚠️ Action Required
        </h2>
        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>12 Fahhculty lbfab booking requests pending</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>18 Student resource requests pending</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>5 Resources currently under maintenance</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>3 Labs have scheduling conflicts today</span>
          </div>
          <div className="text-right pt-2 border-t border-slate-800/80">
            <button className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              View All Requests →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Booking Requests Table */}
      <div className="mb-8">
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
          📋 Recent Booking Requests
        </h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Resource / Lab</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">
                      Syncing recent requests...
                    </td>
                  </tr>
                ) : recentBookings.length > 0 ? (
                  recentBookings.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-900/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{req.user}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.type === 'FACULTY'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {req.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{req.target}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{req.date}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(req.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">
                      No recent booking requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lab & Resource Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Lab Status Panel */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4">
            🏢 Lab Status
          </h2>
          <div className="space-y-3 text-xs divide-y divide-slate-800/60">
            <div className="flex items-center justify-between pb-2">
              <span className="text-slate-200 font-medium">Electronics Lab</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-200 font-medium">Computer Lab</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-200 font-medium">Robotics Lab</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-200 font-medium">Mechanical Lab</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
          </div>
        </div>

        {/* Resource Status Panel */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4">
            📦 Resource Status
          </h2>
          <div className="space-y-3 text-xs divide-y divide-slate-800/60">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Available</span>
              </div>
              <span className="font-bold text-white font-mono">42</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">Limited Stock</span>
              </div>
              <span className="font-bold text-white font-mono">18</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">Booked Out</span>
              </div>
              <span className="font-bold text-white font-mono">21</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-slate-300">Maintenance</span>
              </div>
              <span className="font-bold text-white font-mono">5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <h2 className="text-xs font-bold tracking-wider text-amber-400 uppercase mb-3">
          ⚡ Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <button className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition-all">
            + Add Resource
          </button>
          <button className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition-all">
            + Add Lab
          </button>
          <button className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition-all">
            👥 Manage Users
          </button>
          <button className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition-all">
            📋 Review Requests
          </button>
          <button className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition-all">
            📊 Analytics
          </button>
        </div>
      </div>
    </div>
  );
}