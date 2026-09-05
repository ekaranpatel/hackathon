import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../student/pages/Api'; // Adjust path to your Api file

const FacultyApprovedBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

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

  // Quick Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookingsCount = bookings.filter((b) => {
    const d = b.bookingDate || b.dateISO || b.date;
    return d === todayStr;
  }).length;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🎓</span> Faculty Schedule & Approved Bookings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor verified student lab slot reservations and resource allocations.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchApprovedBookings}
          className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md flex items-center gap-1.5 self-start md:self-auto"
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Approved Bookings
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{bookings.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Scheduled Today ({todayStr})
          </p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{todayBookingsCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">Active Allocations</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 mb-6">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Search by student name, resource, or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Date Filter */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-2.5 py-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20"
              title="Clear date filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          <p className="mt-3.5 text-slate-400 text-xs font-medium">Loading approved bookings...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-xl text-center">
          <p className="text-xs text-rose-400 font-medium mb-3">{error}</p>
          <button
            onClick={fetchApprovedBookings}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-slate-300 font-medium text-sm">No Approved Bookings Found</p>
          <p className="text-xs text-slate-500 mt-1">
            {selectedDate || searchTerm
              ? 'Try adjusting your search query or date filter.'
              : 'Approved allocations will show up here.'}
          </p>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Student Info</th>
                <th className="py-3.5 px-4">Resource / Lab</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {bookings.map((booking) => {
                const bookingId = booking._id || booking.id;
                const studentName = booking.user?.name || 'Unknown Student';
                const studentEmail = booking.user?.email || '';
                const studentDetails =
                  booking.user?.rollNumber || booking.user?.department || '';

                const resourceName =
                  typeof booking.resource === 'object'
                    ? booking.resource?.name
                    : booking.resourceName || 'Resource';
                const resourceLocation = booking.resource?.location || '';

                const displayDate =
                  booking.bookingDate || booking.dateISO || booking.date || 'N/A';
                const displaySlot = booking.timeSlot || 'N/A';

                return (
                  <tr
                    key={bookingId}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{studentName}</div>
                      {studentEmail && (
                        <div className="text-[11px] text-slate-400">{studentEmail}</div>
                      )}
                      {studentDetails && (
                        <span className="inline-block mt-1 text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                          {studentDetails}
                        </span>
                      )}
                    </td>

                    {/* Resource Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-indigo-300">{resourceName}</div>
                      {resourceLocation && (
                        <div className="text-[11px] text-slate-400">📍 {resourceLocation}</div>
                      )}
                    </td>

                    {/* Date & Time Slot */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">🗓️ {displayDate}</div>
                      <div className="text-[11px] text-slate-400">⏰ {displaySlot}</div>
                    </td>

                    {/* Purpose */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-300 line-clamp-2">
                        {booking.purpose || 'No purpose specified'}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                        Approved
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FacultyApprovedBookings;