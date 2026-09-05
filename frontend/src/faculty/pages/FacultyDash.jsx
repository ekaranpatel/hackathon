import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { BACKEND_URL } from '../../pages/Api';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Separate states for raw and UI data
  const [pendingRequests, setPendingRequests] = useState([]);
  const [, setRawPendingBookings] = useState([]);

  const [, setApprovedBookings] = useState([]);
  const [, setRawApprovedBookings] = useState([]);

  const [, setResourcesList] = useState([]);
  
  // Dynamic State for Faculty's Personal Upcoming Bookings
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    totalBookings: 0,
    resources: 45,
  });

  const [loadingPending, setLoadingPending] = useState(true);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('labToken');

  // 1. Fetch Pending Requests
  const fetchPendingBookings = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${BACKEND_URL}/faculty/pending`, { headers });
      const pendingData = response.data?.bookings || response.data || [];

      setRawPendingBookings(pendingData);

      if (pendingData.length > 0) {
        const formattedPending = pendingData.map((item) => ({
          id: item._id,
          student: item.user?.name || item.studentName || 'Unknown Student',
          resource: item.resource?.name || item.resourceName || 'Resource',
          date: item.bookingDate || item.date || 'Today',
          time: item.timeSlot || item.slot || 'N/A',
        }));
        setPendingRequests(formattedPending);
        setStats((prev) => {
          const newPending = formattedPending.length;
          return {
            ...prev,
            pending: newPending,
            totalBookings: newPending + prev.approved,
          };
        });
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

      setRawApprovedBookings(approvedData);

      if (approvedData.length > 0) {
        const formattedApproved = approvedData.map((item) => ({
          id: item._id,
          student: item.user?.name || item.studentName || 'Unknown Student',
          resource: item.resource?.name || item.resourceName || 'Resource',
          date: item.bookingDate || item.date || 'Today',
          time: item.timeSlot || item.slot || 'N/A',
        }));
        setApprovedBookings(formattedApproved);
        setStats((prev) => {
          const newApproved = formattedApproved.length;
          return {
            ...prev,
            approved: newApproved,
            totalBookings: prev.pending + newApproved,
          };
        });
      }
    } catch (err) {
      console.warn('Failed to fetch approved bookings:', err.message);
    }
  };

  // 3. Fetch Resources
  const fetchResources = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${BACKEND_URL}/resources`, { headers });
      const resourcesData = response.data || [];
      setResourcesList(resourcesData);

      if (resourcesData.length > 0) {
        setStats((prev) => ({ ...prev, resources: resourcesData.length }));
      }
    } catch (err) {
      console.warn('Failed to fetch resources:', err.message);
    }
  };

  // 4. Fetch Real Faculty Personal Upcoming Bookings
  const fetchUpcomingBookings = async () => {
    setLoadingUpcoming(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${BACKEND_URL}/lab-booking/my-bookings`, { headers });
      const myBookings = response.data?.bookings || response.data || [];

      const formattedUpcoming = myBookings.map((item) => ({
        id: item._id,
        lab: item.labId?.name || item.labName || 'Laboratory',
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

  // Initial Data Sync
  useEffect(() => {
    fetchPendingBookings();
    fetchApprovedBookings();
    fetchResources();
    fetchUpcomingBookings();
  }, []);

  // Socket Listener
  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (payload) => {
      setRawPendingBookings((prev) => [payload, ...prev]);
      setPendingRequests((prev) => {
        const updated = [
          {
            id: payload.bookingId || payload._id || Date.now().toString(),
            student: payload.studentName || 'Student',
            resource: payload.resourceName || 'Resource',
            date: payload.date || 'Today',
            time: payload.timeSlot || 'N/A',
          },
          ...prev,
        ];
        setStats((s) => ({
          ...s,
          pending: updated.length,
          totalBookings: updated.length + s.approved,
        }));
        return updated;
      });
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
          rejectionReason: actionType === 'reject' ? 'Rejected by faculty member.' : undefined 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn('API action call failed:', err.message);
    } finally {
      setPendingRequests((prev) => {
        const filtered = prev.filter((item) => item.id !== requestId);
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
        return filtered;
      });
      setRawPendingBookings((prev) => prev.filter((item) => (item._id || item.id) !== requestId));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          👋 Welcome, {user?.name || 'Faculty Member'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's your lab activity for today.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 font-medium">📋 Pending Requests</div>
          <p className="text-2xl font-extrabold text-white mt-2">{stats.pending}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 font-medium">🟢 Approved Bookings</div>
          <p className="text-2xl font-extrabold text-white mt-2">{stats.approved}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 font-medium">📊 Total Bookings</div>
          <p className="text-2xl font-extrabold text-white mt-2">{stats.totalBookings}</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-sm">
          <div className="text-xs text-slate-400 font-medium">📦 Resources</div>
          <p className="text-2xl font-extrabold text-white mt-2">{stats.resources}</p>
        </div>
      </div>

      {/* Section 1: Pending Student Requests */}
      <div className="mb-8">
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
          📋 Pending Student Requests {loadingPending && <span className="text-slate-500 font-normal">(Syncing...)</span>}
        </h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-900/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{req.student}</td>
                      <td className="py-3 px-4 text-slate-300">{req.resource}</td>
                      <td className="py-3 px-4 text-slate-400">{req.date}</td>
                      <td className="py-3 px-4 text-slate-400">{req.time}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            className="p-1 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold transition-all"
                            title="Approve Request"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            className="p-1 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-semibold transition-all"
                            title="Reject Request"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">
                      No pending student requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: Real Upcoming Bookings */}
      <div className="mb-6">
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
          📝 My Upcoming Bookings
        </h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60 text-xs">
          {loadingUpcoming ? (
            <div className="p-4 text-center text-slate-500">Loading your upcoming bookings...</div>
          ) : upcomingBookings.length > 0 ? (
            upcomingBookings.map((item) => {
              const isApproved = item.status === 'APPROVED' || item.status === 'CONFIRMED';
              const isRejected = item.status === 'REJECTED';

              return (
                <div key={item.id} className="flex items-center justify-between p-3.5 px-4 hover:bg-slate-900/80 transition-colors">
                  <span className="font-medium text-slate-200">{item.lab}</span>
                  <div className="flex items-center gap-4 text-slate-400 font-mono">
                    <span>{item.date}</span>
                    <span>{item.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    />
                    <span
                      className={
                        isApproved ? 'text-emerald-400' : isRejected ? 'text-rose-400' : 'text-amber-400'
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-slate-500">No upcoming bookings found.</div>
          )}
        </div>
      </div>
    </div>
  );
}