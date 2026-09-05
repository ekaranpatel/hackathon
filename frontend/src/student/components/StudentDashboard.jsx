import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext'; 
import { useSocket } from '../../context/SocketContext'; 
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

  const labUnits = [
    {
      title: 'Quantum AI Lab',
      badge: 'Available Now',
      specs: ['GPU: A100 (x8)', 'RAM: 256GB'],
      border: 'border-purple-500/60 hover:border-purple-400',
      bgGlow: 'bg-[#15122e]/70 shadow-[0_0_20px_rgba(168,85,247,0.12)]',
      badgeStyle: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
      btnGlow: 'bg-purple-950/40 border border-purple-500/50 text-purple-200 hover:bg-purple-900/50',
      icon: (
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
      ),
      action: 'Book Now',
      path: '/resources'
    },
    {
      title: 'Robotics & Mechatronics Cell',
      badge: 'Busy',
      specs: ['Arm: KUKA KR16', 'Sensor Suite'],
      border: 'border-emerald-500/60 hover:border-emerald-400',
      bgGlow: 'bg-[#0f2420]/70 shadow-[0_0_20px_rgba(16,185,129,0.12)]',
      badgeStyle: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
      btnGlow: 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/50',
      icon: (
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
      ),
      action: 'View Schedule',
      path: '/calendar'
    },
    {
      title: 'VR Pod',
      badge: 'Available Now',
      specs: ['Headset: Quest Pro', 'Haptic Suit'],
      border: 'border-cyan-500/60 hover:border-cyan-400',
      bgGlow: 'bg-[#0b202c]/70 shadow-[0_0_20px_rgba(6,182,212,0.12)]',
      badgeStyle: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
      btnGlow: 'bg-cyan-950/40 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-900/50',
      icon: (
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      ),
      action: 'Reserve',
      path: '/resources'
    },
    {
      title: 'Rapid Prototyping 3D Studio',
      badge: 'Busy',
      specs: ['Printer: Form 3L', 'Resin: Tough'],
      border: 'border-rose-500/60 hover:border-rose-400',
      bgGlow: 'bg-[#24131b]/70 shadow-[0_0_20px_rgba(244,63,94,0.12)]',
      badgeStyle: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
      btnGlow: 'bg-rose-950/40 border border-rose-500/50 text-rose-200 hover:bg-rose-900/50',
      icon: (
        <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      ),
      action: 'Check Availability',
      path: '/resources'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b18] flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="w-9 h-9 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
        <p className="text-xs font-semibold tracking-wider uppercase text-cyan-400">Loading Student Console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-slate-100 p-4 sm:p-6 lg:p-7 font-sans">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* Welcome Greeting Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span className="text-2xl select-none">👋</span> Welcome back,{' '}
            <span className="px-3.5 py-0.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              {studentName}
            </span>
            <span>!</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Here's what's happening with your lab resources.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-center justify-between shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <span className="flex items-center gap-2">⚠️ {error}</span>
            <button 
              onClick={() => window.location.reload()} 
              className="underline font-bold hover:text-rose-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Four High-Contrast Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Bookings */}
          <div className="relative rounded-2xl p-5 bg-[#171333]/80 border border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.15)] text-left hover:border-purple-400 transition-all">
            <span className="text-xs font-semibold text-purple-200/90 block mb-2">Total Bookings</span>
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
              {stats.totalBookings || 42}
            </span>
          </div>

          {/* Pending Approvals */}
          <div className="relative rounded-2xl p-5 bg-[#1a231a]/80 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-left hover:border-amber-400 transition-all">
            <span className="text-xs font-semibold text-amber-200/90 block mb-2">Pending Approvals</span>
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
              {stats.pendingRequests || 3}
            </span>
          </div>

          {/* Approved */}
          <div className="relative rounded-2xl p-5 bg-[#0f2c25]/80 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-left hover:border-emerald-400 transition-all">
            <span className="text-xs font-semibold text-emerald-200/90 block mb-2">Approved</span>
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
              {stats.approvedBookings || 12}
            </span>
          </div>

          {/* Resource Credits / Avail */}
          <div className="relative rounded-2xl p-5 bg-[#2d1519]/80 border border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)] text-left hover:border-rose-400 transition-all">
            <span className="text-xs font-semibold text-rose-200/90 block mb-2">Resource Credits / Avail.</span>
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
              {stats.availableResources || 250}
            </span>
          </div>

        </div>

        {/* 2. Middle Row: Upcoming Booking & Recent Notifications (Split 7 / 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left: Upcoming Booking Card */}
          <div className="lg:col-span-7 rounded-2xl p-5 sm:p-6 bg-[#0e1628]/85 border border-slate-700/80 shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                <span>📋</span> UPCOMING BOOKING
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Countdown:</span>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight my-1">
                    {todaysBooking?.timeSlot || todaysBooking?.slotLabel || '02:30:00'}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Until access to QR door pass
                  </span>
                </div>

                <div className="flex items-center gap-3.5 shrink-0">
                  {/* QR Matrix */}
                  <div className="w-16 h-16 bg-white rounded-xl p-1 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v4h-4v-4zm-4 0h2v2h-2v-2zm0 4h2v4h-2v-4zm4 2h2v2h-2v-2zm-6-6h2v2h-2v-2zm-4 4h2v2H8v-2zm2-2h2v2h-2v-2z" />
                    </svg>
                  </div>

                  {/* PIN Info */}
                  <div className="text-left leading-tight">
                    <span className="text-xs font-bold text-slate-200 block mb-1">
                      {todaysBooking?.resourceName || todaysBooking?.resource?.name || 'Quantum AI Lab - Workstation 4'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Quick PIN credentials:</span>
                    <span className="text-sm font-black font-mono text-slate-100">PIN: 1234</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Recent Notifications Card */}
          <div className="lg:col-span-5 rounded-2xl p-5 sm:p-6 bg-[#0e1628]/85 border border-slate-700/80 shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">
                  <span>🔔</span> RECENT NOTIFICATIONS
                </span>
                <button
                  onClick={() => navigate('/notifications')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View all
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 3).map((n, i) => (
                    <div key={i} className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] shrink-0" />
                      <span className="truncate">{n.message || n.title}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] shrink-0" />
                      <span className="truncate">Booking #1042 approved by Dr. Chen</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] shrink-0" />
                      <span className="truncate">3D Printer maintenance complete</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] shrink-0" />
                      <span className="truncate">Access token refreshed</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 3. Bottom Section: Browse Labs & Resources Grid */}
        <section className="space-y-3 text-left">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-rose-400">
            <span>⚡</span> BROWSE LABS & RESOURCES
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {labUnits.map((lab, index) => (
              <div 
                key={index}
                className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between gap-4 ${lab.border} ${lab.bgGlow}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {lab.icon}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${lab.badgeStyle}`}>
                      {lab.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 leading-tight mb-2">
                    {lab.title}
                  </h3>

                  <div className="space-y-0.5 text-[11px] text-slate-400">
                    {lab.specs.map((spec, i) => (
                      <p key={i}>{spec}</p>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate(lab.path)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 ${lab.btnGlow}`}
                >
                  {lab.action}
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}