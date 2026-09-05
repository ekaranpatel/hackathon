import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { BACKEND_URL } from '../../student/pages/Api';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  const [stats, setStats] = useState({
    pending: 3,
    approved: 12,
    totalBookings: 42,
    resources: 45,
  });

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('labToken');

  // 1. Fetch Pending Requests
  const fetchPendingBookings = async () => {
    try {
      setLoadingPending(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${BACKEND_URL}/faculty/pending`, { headers });
      const pendingData = response.data?.bookings || response.data || [];

      if (pendingData.length > 0) {
        const formattedPending = pendingData.map((item) => ({
          id: item._id || item.id,
          student: item.user?.name || item.studentName || 'Student Candidate',
          dept: item.user?.department || item.department || 'UG - Robotics',
          resource: item.resource?.name || item.resourceName || 'Quantum AI Lab - WS04',
          date: item.bookingDate || item.date || 'Oct 24, 2026',
          time: item.timeSlot || item.slot || '14:00 - 16:30',
        }));
        setPendingRequests(formattedPending);
        setStats((prev) => ({
          ...prev,
          pending: formattedPending.length,
          totalBookings: formattedPending.length + prev.approved,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch pending bookings:', err.message);
    } finally {
      setLoadingPending(false);
    }
  };

  // 2. Fetch Approved Requests
  const fetchApprovedBookings = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${BACKEND_URL}/faculty/approved`, { headers });
      const approvedData = response.data?.bookings || response.data || [];

      if (approvedData.length > 0) {
        const count = approvedData.length;
        setStats((prev) => ({
          ...prev,
          approved: count,
          totalBookings: prev.pending + count,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch approved bookings:', err.message);
    }
  };

  // 3. Fetch Resources Count
  const fetchResources = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${BACKEND_URL}/resources`, { headers });
      const resourcesData = response.data || [];

      if (resourcesData.length > 0) {
        setStats((prev) => ({ ...prev, resources: resourcesData.length }));
      }
    } catch (err) {
      console.warn('Failed to fetch resources:', err.message);
    }
  };

  // 4. Fetch Faculty's Personal Upcoming Bookings
  const fetchUpcomingBookings = async () => {
    setLoadingUpcoming(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${BACKEND_URL}/lab-booking/my-bookings`, { headers });
      const myBookings = response.data?.bookings || response.data || [];

      const formattedUpcoming = myBookings.map((item) => ({
        id: item._id || item.id,
        lab: item.labId?.name || item.labName || 'Laboratory Workstation',
        date: item.date || item.bookingDate || item.slotDate || 'N/A',
        time: item.startTime ? `${item.startTime} - ${item.endTime}` : (item.timeSlot || item.slot || 'N/A'),
        status: (item.status || 'PENDING').toUpperCase(),
      }));

      setUpcomingBookings(formattedUpcoming);
    } catch (err) {
      console.warn('Failed to fetch upcoming bookings:', err.message);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  useEffect(() => {
    fetchPendingBookings();
    fetchApprovedBookings();
    fetchResources();
    fetchUpcomingBookings();
  }, []);

  // Socket Listener for Realtime Requests
  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (payload) => {
      const newEntry = {
        id: payload.bookingId || payload._id || Date.now().toString(),
        student: payload.studentName || 'New Student',
        dept: payload.department || 'Computer Science & AI',
        resource: payload.resourceName || 'Assigned Workstation',
        date: payload.date || 'Today',
        time: payload.timeSlot || '10:00 - 12:00',
      };

      setPendingRequests((prev) => [newEntry, ...prev]);
      setStats((s) => ({
        ...s,
        pending: s.pending + 1,
        totalBookings: s.totalBookings + 1,
      }));
    };

    socket.on('newBookingRequest', handleNewBooking);
    return () => socket.off('newBookingRequest', handleNewBooking);
  }, [socket]);

  // Handle Approve / Reject Actions
  const handleAction = async (requestId, actionType) => {
    try {
      const token = getToken();
      const backendAction = actionType === 'approve' ? 'Approved' : 'Rejected';

      await axios.patch(
        `${BACKEND_URL}/faculty/respond/${requestId}`,
        {
          action: backendAction,
          rejectionReason: actionType === 'reject' ? 'Rejected by faculty supervisor.' : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn('API action call failed:', err.message);
    } finally {
      setPendingRequests((prev) => prev.filter((item) => item.id !== requestId));
      setStats((s) => {
        const newPending = Math.max(0, s.pending - 1);
        const newApproved = actionType === 'approve' ? s.approved + 1 : s.approved;
        return {
          ...s,
          pending: newPending,
          approved: newApproved,
          totalBookings: newPending + newApproved,
        };
      });
    }
  };

  const facultyDisplayName = user?.name ? user.name.toUpperCase() : 'SHIVAM';

  return (
    <div className="min-h-screen bg-[#060a17] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-[1340px] mx-auto space-y-6">

        {/* 1. Header & Academic Context Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>👋</span> Welcome,{' '}
              <span className="px-3.5 py-0.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white font-black tracking-wide shadow-[0_0_22px_rgba(168,85,247,0.45)]">
                {facultyDisplayName}
              </span>
              <span>!</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Here's your live laboratory activity and resource orchestration for today.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              Academic Session: <span className="font-bold text-white">Fall 2026</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs font-mono font-medium">
              Today: Thursday, Oct 24
            </div>
          </div>
        </div>

        {/* 2. Four Vibrant Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Requests (Amber Glow) */}
          <div className="relative rounded-2xl p-5 bg-[#171618]/90 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.12)] text-left hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                <span className="text-xs font-bold text-amber-200">Pending Requests</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                Needs Review
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight">
              {stats.pending}
            </div>
            <div className="flex items-center justify-between text-[11px] text-amber-400/80 mt-3 pt-2 border-t border-amber-500/15">
              <span>Requires approval</span>
            </div>
            <div className="absolute bottom-0 inset-x-6 h-[2px] bg-amber-400/70 shadow-[0_0_10px_#f59e0b]" />
          </div>

          {/* Approved Bookings (Emerald Glow) */}
          <div className="relative rounded-2xl p-5 bg-[#0f2420]/90 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.12)] text-left hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                <span className="text-xs font-bold text-emerald-200">Approved Bookings</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                Active
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight">
              {stats.approved}
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-400/80 mt-3 pt-2 border-t border-emerald-500/15">
              <span>This week</span>
            </div>
            <div className="absolute bottom-0 inset-x-6 h-[2px] bg-emerald-400/70 shadow-[0_0_10px_#10b981]" />
          </div>

          {/* Total Bookings (Purple Glow) */}
          <div className="relative rounded-2xl p-5 bg-[#171330]/90 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.12)] text-left hover:border-purple-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                <span className="text-xs font-bold text-purple-200">Total Bookings</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                Semester
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight">
              {stats.totalBookings}
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-400/80 mt-3 pt-2 border-t border-purple-500/15">
              <span>All Lab Units</span>
            </div>
            <div className="absolute bottom-0 inset-x-6 h-[2px] bg-purple-400/70 shadow-[0_0_10px_#c084fc]" />
          </div>

          {/* Resources Available (Cyan Glow) */}
          <div className="relative rounded-2xl p-5 bg-[#0b212c]/90 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.12)] text-left hover:border-cyan-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                <span className="text-xs font-bold text-cyan-200">Resources</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                Available
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight">
              {stats.resources}
            </div>
            <div className="flex items-center justify-between text-[11px] text-cyan-400/80 mt-3 pt-2 border-t border-cyan-500/15">
              <span>100% Operational</span>
            </div>
            <div className="absolute bottom-0 inset-x-6 h-[2px] bg-cyan-400/70 shadow-[0_0_10px_#22d3ee]" />
          </div>
        </div>

        {/* 3. Pending Student Requests Section */}
        <section className="rounded-2xl p-5 sm:p-6 bg-[#0c1224]/90 border border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-left space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-cyan-400 text-sm">📋</span>
              <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
                Pending Student Requests
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                {pendingRequests.length} WAITING
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchPendingBookings}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
              >
                Refresh
              </button>
              <button
                onClick={() => navigate('/faculty/requests')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
              >
                History
              </button>
            </div>
          </div>

          {/* Table Header & Rows */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loadingPending ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      Syncing student booking requests...
                    </td>
                  </tr>
                ) : pendingRequests.length > 0 ? (
                  pendingRequests.map((req, idx) => (
                    <tr key={req.id || idx} className="hover:bg-slate-900/50 transition-colors">
                      {/* Student Profile Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow-sm ${
                            idx % 2 === 0
                              ? 'bg-gradient-to-tr from-cyan-600 to-blue-600'
                              : 'bg-gradient-to-tr from-purple-600 to-pink-600'
                          }`}>
                            {req.student.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100">{req.student}</div>
                            <div className="text-[10px] text-slate-400">{req.dept}</div>
                          </div>
                        </div>
                      </td>

                      {/* Resource Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${idx % 2 === 0 ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'}`} />
                          <span className="font-semibold text-slate-200">{req.resource}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">{req.date}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{req.time}</td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            className="px-3.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] active:scale-95"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            className="px-3.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)] active:scale-95"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No pending student booking requests right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. My Upcoming Bookings Section */}
        <section className="rounded-2xl p-5 sm:p-6 bg-[#0c1224]/90 border border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-200 uppercase">
              <span>📅</span> MY UPCOMING BOOKINGS
            </div>
            <button
              onClick={() => navigate('/faculty/calendar')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <span>View Full Calendar</span>
              <span>›</span>
            </button>
          </div>

          {loadingUpcoming ? (
            <div className="py-12 text-center text-slate-400">Loading schedule data...</div>
          ) : upcomingBookings.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="py-3 px-2 flex items-center justify-between text-xs hover:bg-slate-900/40 transition-colors">
                  <span className="font-semibold text-slate-200">{b.lab}</span>
                  <div className="font-mono text-slate-400 flex gap-4">
                    <span>{b.date}</span>
                    <span>{b.time}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 rounded-xl bg-[#090e1c]/60 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xl shadow-inner">
                📅
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">No active bookings scheduled for today.</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All your scheduled lab workstations and student demo hours are open.
                </p>
              </div>
              <button
                onClick={() => navigate('/faculty/book-lab')}
                className="mt-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all active:scale-95"
              >
                + Schedule a Lab Session
              </button>
            </div>
          )}
        </section>

        {/* 5. Bottom System Diagnostics & Resource Orchestration Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a1022]/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">Lab Automation System Online</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  100% Operational
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All 45 hardware benches, robotic arms, and high-performance workstations are connected to the central gateway.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => navigate('/faculty/calendar')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              Hardware Diagnostics
            </button>
            <button
              onClick={() => navigate('/faculty/my-labs')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 shadow-[0_0_18px_rgba(168,85,247,0.35)] transition-all active:scale-95"
            >
              Manage All Resources
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>© 2026 LabDynamix Systems. Faculty Portal v2.4.0</span>
          <div className="flex items-center gap-4">
            <a href="#security" className="hover:text-slate-300 transition-colors">Security Policy</a>
            <a href="#protocol" className="hover:text-slate-300 transition-colors">Lab Protocol</a>
            <a href="#helpdesk" className="hover:text-slate-300 transition-colors">IT Helpdesk</a>
          </div>
        </div>

      </div>
    </div>
  );
}