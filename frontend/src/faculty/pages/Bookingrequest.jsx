import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { useSocket } from '../../context/SocketContext';
import { BACKEND_URL } from '../../student/pages/Api';

export default function Bookingrequest() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectingBookingId, setRejectingBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Helper for consistent API URLs
  const getApiUrl = (endpoint) => {
    const cleanBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, '') : 'http://localhost:5000/api';
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return `${cleanBase}/${cleanEndpoint}`;
  };

   
  useEffect(() => {
    fetchPendingBookings();
  }, []);

  // Socket setup for real-time incoming student requests
 // Faculty Component (Bookingrequest.jsx)
useEffect(() => {
  const categoryName = user?.category || user?.department;
  if (!socket || !categoryName) return;

  // Match backend room format: "category_CS"
  const categoryRoom = `category_${categoryName.trim().toUpperCase()}`;
  socket.emit('join_room', categoryRoom);

  const handleBookingProcessed = ({ bookingId }) => {
    setBookings((prev) => prev.filter((b) => b._id !== bookingId));
  };

  socket.on('FACULTY_BOOKING_PROCESSED', handleBookingProcessed);

  return () => {
    socket.off('FACULTY_BOOKING_PROCESSED', handleBookingProcessed);
  };
}, [socket, user]);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('labToken') || localStorage.getItem('token');

      const response = await fetch(getApiUrl('/faculty/pending'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch faculty pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

 const handleDecision = async (bookingId, actionType, reason = '') => {
    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
      const token = localStorage.getItem('labToken') || localStorage.getItem('token');

      // Ensure action matches the exact case expected by your backend: 'Approved' or 'Rejected'
      const formattedAction = actionType.toLowerCase().includes('approve') ? 'Approved' : 'Rejected';

      const response = await fetch(getApiUrl(`/faculty/respond/${bookingId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          action: formattedAction, 
          rejectionReason: reason 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookings((prev) => prev.filter((item) => item._id !== bookingId));
        showNotification(`Booking ${formattedAction.toLowerCase()} successfully!`);
        setRejectingBookingId(null);
        setRejectionReason('');
      } else {
        alert(data.message || 'Failed to update booking status.');
      }
    } catch (err) {
      console.error('Error processing decision:', err);
      alert('Network error. Failed to send response.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-xs">Loading department requests...</p>
      </div>
    );
  }

  const currentCategory = user?.category || user?.department || 'General';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🛡️</span> Faculty Approvals Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Category / Department: <span className="text-blue-400 font-semibold">{currentCategory}</span> | Real-time booking requests
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium text-slate-300 self-start sm:self-auto">
            Pending Requests: <strong className="text-amber-400">{bookings.length}</strong>
          </span>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 bg-blue-500/15 border border-blue-500/40 rounded-xl text-xs text-blue-300 animate-bounce flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Booking Requests List */}
        {bookings.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500">
            No pending resource booking requests for your department.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((item) => (
              <div 
                key={item._id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all space-y-4"
              >
                {/* Student & Resource Overview */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      {item.resource?.name || 'Lab Resource'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Requested by: <span className="text-white font-medium">{item.user?.name}</span> ({item.user?.email})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Pending Review
                  </span>
                </div>

                {/* Booking Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Lab</span>
                    <span className="font-medium">{item.lab?.name || 'Central Lab'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Date</span>
                    <span className="font-medium">{item.bookingDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Slot</span>
                    <span className="font-medium">{item.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Quantity</span>
                    <span className="font-medium">{item.quantity || 1} unit(s)</span>
                  </div>
                </div>

                {/* Purpose Note */}
                {item.purpose && (
                  <div className="p-3 bg-slate-950/60 rounded-xl text-xs text-slate-400 border border-slate-800/60">
                    <strong className="text-slate-300">Purpose:</strong> {item.purpose}
                  </div>
                )}

                {/* Rejection Reason Form */}
                {rejectingBookingId === item._id ? (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl space-y-2">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setRejectingBookingId(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDecision(item._id, 'Rejected', rejectionReason)}
                        disabled={actionLoading[item._id]}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
                      >
                        {actionLoading[item._id] ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action Buttons */
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setRejectingBookingId(item._id)}
                      disabled={actionLoading[item._id]}
                      className="px-4 py-2 bg-slate-800 hover:bg-red-950/50 text-red-400 border border-slate-700 hover:border-red-500/40 rounded-xl text-xs font-semibold transition-all"
                    >
                      Reject Request
                    </button>

                    <button
                      onClick={() => handleDecision(item._id, 'Approved')}
                      disabled={actionLoading[item._id]}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                    >
                      {actionLoading[item._id] ? 'Approving...' : 'Approve Booking'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}