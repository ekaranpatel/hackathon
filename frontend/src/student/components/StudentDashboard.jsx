import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../admin/context/Authcontext'; 
import { useSocket } from '../context/SocketContext'; 
import { BACKEND_URL } from '../pages/Api';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications } = useSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingRequests: 0,
    approvedBookings: 0,
    availableResources: 0,
  });

  const [todaysBooking, setTodaysBooking] = useState(null);
console.log("User object in StudentDashboard:", todaysBooking); // Debugging line
  // Fetch live dashboard statistics & today's bookings
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('labToken') || localStorage.getItem('token');
        if (!token) {
          setError('Authentication token missing. Please log in.');
          setLoading(false);
          return;
        }

        const cleanBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, '') : 'http://localhost:5000/api';
        const response = await fetch(`${cleanBase}/bookings/student-summary`, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          if (data.stats) {
            setStats({
              totalBookings: data.stats.totalBookings ?? 0,
              pendingRequests: data.stats.pendingRequests ?? 0,
              approvedBookings: data.stats.approvedBookings ?? 0,
              availableResources: data.stats.availableResources ?? 0,
            });
          }
          setTodaysBooking(data.todaysBooking || null);
        }
      } catch (err) {
        console.error('Failed to load live dashboard stats:', err);
        if (isMounted) {
          setError('Failed to sync dashboard metrics with server.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const studentName = user?.name || user?.fullName || 'Student';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-medium tracking-wide">Loading dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>👋</span> Welcome back, <span className="text-blue-400">{studentName}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Here's what's happening with your lab resources.
          </p>
        </div>

        {/* Error Alert (Non-blocking) */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button 
              onClick={() => window.location.reload()} 
              className="underline font-semibold hover:text-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total Bookings */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
              <span>📋</span> Total
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.totalBookings}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Bookings</span>
          </div>

          {/* Pending Requests */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" /> Pending
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.pendingRequests}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Requests</span>
          </div>

          {/* Approved Bookings */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Approved
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.approvedBookings}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Bookings</span>
          </div>

          {/* Available Resources */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
              <span>📦</span> Avail.
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.availableResources}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Resources</span>
          </div>
        </div>

        {/* Today's Booking Section */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>📅</span> UPCOMING BOOKING
          </h2>

          {todaysBooking ? (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md hover:border-slate-700 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🧪</span>
                  <h3 className="text-lg font-bold text-slate-100">
                    {/* Handles populated object vs raw string */}
                    {todaysBooking.resource?.name || todaysBooking.resourceName || 'Lab Resource'}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                  {todaysBooking.status || 'Approved'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>
                    {todaysBooking.lab?.name || todaysBooking.labName || todaysBooking.location || 'Electronics Lab'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⏰</span>
                  <span>
                    {todaysBooking.timeSlot || todaysBooking.slotLabel || todaysBooking.slot?.label || 'Scheduled Slot'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>Quantity: {todaysBooking.quantity || todaysBooking.bookedQuantity || 1}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => navigate(`/booking/${todaysBooking._id || todaysBooking.id}`)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  [ View Booking ]
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
              No active bookings scheduled for today.
            </div>
          )}
        </section>

        {/* Quick Actions Section */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>⚡</span> QUICK ACTIONS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button
              onClick={() => navigate('/resources')}
              className="flex items-center justify-center gap-2.5 p-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm active:scale-98"
            >
              <span>📦</span> Browse Resources
            </button>

            <button
              onClick={() => navigate('/my-bookings')}
              className="flex items-center justify-center gap-2.5 p-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm active:scale-98"
            >
              <span>📋</span> My Bookings
            </button>

            <button
              onClick={() => navigate('/schedule')}
              className="flex items-center justify-center gap-2.5 p-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm active:scale-98"
            >
              <span>🗓️</span> Schedule
            </button>
          </div>
        </section>

        {/* Recent Notifications Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>🔔</span> RECENT NOTIFICATIONS
            </h2>
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 3).map((item) => (
                <div
                  key={item._id || item.id || item.createdAt}
                  onClick={() => navigate('/notifications')}
                  className="p-4 flex items-start justify-between gap-3 hover:bg-slate-800/40 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5">
                      {item.type === 'BOOKING_CANCELED' ? '🚫' : '🔔'}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">
                        {item.title || 'System Notification'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                No recent notifications.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}