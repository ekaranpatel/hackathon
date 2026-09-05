import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../pages/Api';

export default function FacultyMyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'completed' | 'rejected'

  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/lab-booking/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setBookings(response.data.bookings || []);
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setError(err.response?.data?.message || 'Failed to load your lab bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  // FIXED: Standardized comparisons to uppercase
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.filter((item) => {
      const status = (item.status || 'PENDING').toUpperCase();
      if (filter === 'approved') return status === 'APPROVED';
      if (filter === 'pending') return status === 'PENDING';
      if (filter === 'completed') return status === 'COMPLETED';
      if (filter === 'rejected') return status === 'REJECTED' || status === 'CANCELLED';
      return true;
    });
  }, [bookings, filter]);

  // FIXED: Standardized badge comparisons to uppercase
  const getStatusBadge = (status = 'PENDING') => {
    const s = status.toUpperCase();
    if (s === 'APPROVED') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ✅ Approved
        </span>
      );
    }
    if (s === 'COMPLETED') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          🏁 Completed
        </span>
      );
    }
    if (s === 'REJECTED' || s === 'CANCELLED') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          🚫 {s === 'CANCELLED' ? 'Cancelled' : 'Rejected'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
        ⏳ Pending Approval
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Lab Bookings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track and manage your requested laboratory time slots and reservations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMyBookings}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all disabled:opacity-50"
            title="Refresh List"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Filter Segmented Control */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            {['all', 'approved', 'pending', 'completed', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                  filter === tab
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
              <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const labName = booking.labId?.name || 'Laboratory Room';
            const location = booking.labId?.location || 'Main Campus';

            return (
              <div
                key={booking._id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-base font-semibold text-white">{labName}</h2>
                    {getStatusBadge(booking.status)}
                    <span className="text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      {booking.branch || 'CSE'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <span className="text-slate-400">Purpose:</span> {booking.purpose || 'Lab Session / Workshop'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    <span>📍 {location}</span>
                    <span>👥 {booking.expectedStudents || 0} Students</span>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-1 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-200">
                    📅 {booking.date}
                  </div>
                  <div className="text-xs text-indigo-400 font-mono">
                    🕒 {booking.startTime} - {booking.endTime}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Booked on {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <p className="text-xs text-slate-400">No lab bookings found matching the selected filter.</p>
        </div>
      )}
    </div>
  );
}