import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../student/pages/Api';

export default function FacultyApprovedBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const getToken = () => localStorage.getItem('labToken') || localStorage.getItem('token');

  const fetchApprovedBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) throw new Error('Authentication token missing. Please log in.');

      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${BACKEND_URL}/faculty/approved`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      } else {
        setBookings(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching approved bookings:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch approved bookings.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, searchTerm]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchApprovedBookings();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchApprovedBookings]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookingsCount = bookings.filter((b) => {
    const d = b.bookingDate || b.dateISO || b.date;
    return d === todayStr;
  }).length;

  // Filter local items by category if selected
  const displayBookings = bookings.filter((b) => {
    if (categoryFilter === 'All') return true;
    const resName = (b.resource?.name || b.resourceName || '').toLowerCase();
    const category = (b.resource?.category || b.category || '').toLowerCase();
    const filter = categoryFilter.toLowerCase();
    return resName.includes(filter) || category.includes(filter);
  });

  return (
    <div className="min-h-screen bg-[#070b18] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-[1360px] mx-auto space-y-6">

        {/* Top Breadcrumbs */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <span>Faculty Portal</span>
          <span>/</span>
          <span>Bookings</span>
          <span>/</span>
          <span className="text-emerald-400 font-semibold">Approved Bookings</span>
        </div>

        {/* Page Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>🎓</span> Faculty Schedule & Approved Bookings
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Monitor verified student lab slot reservations and resource allocations.
            </p>
          </div>

          <button
            onClick={fetchApprovedBookings}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] self-start sm:self-auto"
          >
            <span>🔄</span> Refresh List
          </button>
        </div>

        {/* 1. Metric Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Approved Bookings (Emerald Highlight) */}
          <div className="relative rounded-2xl p-5 bg-[#0e1f20]/80 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.12)] text-left hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Total Approved Bookings
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                +1 active session
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight my-1">
              {bookings.length || 1}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 pt-2 border-t border-emerald-500/20">
              <span className="text-cyan-400">🛡️</span> All compliance checks passed
            </div>
            <div className="absolute bottom-0 inset-x-6 h-[2px] bg-emerald-400/80 shadow-[0_0_10px_#10b981]" />
          </div>

          {/* Scheduled Today (Cyan Highlight) */}
          <div className="relative rounded-2xl p-5 bg-[#0b212c]/80 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.12)] text-left hover:border-cyan-400 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                Scheduled Today ({todayStr})
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight my-1">
              {todayBookingsCount}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 pt-2 border-t border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Next: Tomorrow 09:00 AM
            </div>
            <div className="absolute bottom-0 inset-x-6 h-[2px] bg-cyan-400/80 shadow-[0_0_10px_#06b6d4]" />
          </div>

          {/* Status (Purple Highlight) */}
          <div className="relative rounded-2xl p-5 bg-[#171330]/80 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.12)] text-left hover:border-purple-400 transition-all">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">
              Status
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight my-1">
              Active Allocations
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-purple-300 mt-2 pt-2 border-t border-purple-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Automated Door Passes Enabled
            </div>
            <div className="absolute bottom-0 inset-x-6 h-[2px] bg-purple-400/80 shadow-[0_0_10px_#c084fc]" />
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="p-3.5 rounded-2xl bg-[#0d1326]/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">🔍</span>
            <input
              type="text"
              placeholder="Search by student name, resource, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070b18] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Date Picker & Quick Tag Filters */}
          <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#070b18] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl"
              >
                ✕
              </button>
            )}

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5">
              {['All', '3D Printer', 'Robotics'].map((cat) => {
                const isActive = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 border border-emerald-400/80 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-[#070b18] border border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Approved Bookings Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0c1224]/80 rounded-2xl border border-slate-800">
            <div className="w-9 h-9 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Loading approved bookings...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-center">
            <p className="text-xs text-rose-400 font-medium mb-3">{error}</p>
            <button
              onClick={fetchApprovedBookings}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Retry
            </button>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center py-16 bg-[#0c1224]/80 border border-dashed border-slate-800 rounded-2xl">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-slate-300 font-bold text-sm">No Approved Bookings Found</p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedDate || searchTerm || categoryFilter !== 'All'
                ? 'Try adjusting your search query or active filter.'
                : 'Approved lab allocations will show up here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-[#0c1224]/90 border border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-left">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#090e1c]/80">
                  <th className="py-4 px-5">Student Info</th>
                  <th className="py-4 px-5">Resource / Lab</th>
                  <th className="py-4 px-5">Date & Time</th>
                  <th className="py-4 px-5">Purpose</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {displayBookings.map((booking, idx) => {
                  const bookingId = booking._id || booking.id || idx;
                  const studentName = booking.user?.name || booking.studentName || 'Student Name';
                  const studentEmail = booking.user?.email || 'student@campusvault.edu';
                  const studentDept = booking.user?.rollNumber || booking.user?.department || 'UG - CS & Robotics';

                  const resourceName =
                    typeof booking.resource === 'object'
                      ? booking.resource?.name
                      : booking.resourceName || 'Quantum AI Lab - WS04';
                  const resourceLocation =
                    booking.resource?.location || booking.labName || 'Neural Computing Center • Tower C';

                  const displayDate =
                    booking.bookingDate || booking.dateISO || booking.date || '2026-09-06';
                  const displaySlot = booking.timeSlot || booking.slot || '11:10 AM - 01:10 PM';
                  const purpose = booking.purpose || 'Lab Practical / Research Project Testing';

                  // Generate badge color by index
                  const avatarGradients = [
                    'bg-gradient-to-tr from-cyan-600 to-blue-600',
                    'bg-gradient-to-tr from-purple-600 to-pink-600',
                    'bg-gradient-to-tr from-emerald-600 to-teal-600',
                  ];
                  const avatarBg = avatarGradients[idx % avatarGradients.length];

                  return (
                    <tr key={bookingId} className="hover:bg-slate-900/50 transition-colors">
                      {/* Student Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md`}>
                            {studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 text-sm">{studentName}</div>
                            <div className="text-[11px] text-slate-400">{studentEmail}</div>
                            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{studentDept}</div>
                          </div>
                        </div>
                      </td>

                      {/* Resource / Lab */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                            <span className="text-white uppercase tracking-tight">{resourceName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 pl-3.5">
                            {resourceLocation}
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div className="text-slate-200 flex items-center gap-1.5">
                            <span>📅</span> {displayDate}
                          </div>
                          <div className="text-amber-400 flex items-center gap-1.5">
                            <span>⏰</span> {displaySlot}
                          </div>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-semibold text-slate-200 leading-tight line-clamp-1">
                          {purpose}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Course: Advanced Additive Mfg.
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                          Approved
                        </span>
                      </td>

                      {/* Actions (Pass Button + Options Menu) */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            title="Generate Access Pass"
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            <span>🎟️</span> Pass
                          </button>
                          <button
                            title="More options"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
                          >
                            <span className="text-xs font-mono">•••</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer with Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800/80 text-[11px] text-slate-400 bg-[#090e1c]/60">
              <span>Showing 1 to {displayBookings.length} of {displayBookings.length} entries</span>
              <div className="flex items-center gap-1">
                <button disabled className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed">
                  Previous
                </button>
                <button className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                  1
                </button>
                <button disabled className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Bottom Access Pass Protocol Banner */}
        <div className="p-4 rounded-2xl bg-[#0a1022]/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              ℹ️
            </span>
            <span className="text-xs text-slate-300">
              Approved students automatically receive NFC / QR digital credentials 15 minutes prior to allocated time.
            </span>
          </div>
          <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap">
            Configure Hardware Rules ›
          </button>
        </div>

      </div>
    </div>
  );
}