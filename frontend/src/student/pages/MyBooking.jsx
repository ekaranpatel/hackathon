import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { BACKEND_URL } from './Api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState('');
  const { socket, fetchNotifications } = useSocket();
  const navigate = useNavigate();

  // Helper getters for storage key fallbacks
  const getToken = () => localStorage.getItem('labToken') || localStorage.getItem('token');
  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem('labUser') || localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };

  const fetchMyBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }

      const baseUrl = BACKEND_URL ? BACKEND_URL.replace(/\/$/, '') : 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/bookings/my-bookings`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const fetchedBookings = Array.isArray(data)
        ? data
        : data.bookings || data.data || [];

      setBookings(fetchedBookings);
    } catch (err) {
      console.error('Error loading bookings:', err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Cannot connect to backend server. Verify server is running on port 5000.');
      } else {
        setError(err.message || 'Failed to fetch bookings.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  // Handle real-time status updates from Sockets & Custom Window Events
  useEffect(() => {
    const user = getStoredUser();
    const userId = user._id || user.id;

    if (socket && userId) {
      const userRoomStr = String(userId);
      socket.emit('join_room', userRoomStr);
      socket.emit('join_room', `user_${userRoomStr}`);
      socket.emit('joinUserRoom', userRoomStr);
      socket.emit('joinUserRoom', `user_${userRoomStr}`);
    }

    // Unified Status Update Handler
    const handleStatusUpdate = (data) => {
      console.log('⚡ Real-time booking update received:', data);

      const targetId = data?.bookingId || data?._id || data?.id || data?.booking?._id;
      const updatedStatus = data?.status || data?.booking?.status;
      const resourceName =
        data?.resourceName ||
        data?.booking?.resource?.name ||
        data?.booking?.resourceName ||
        'Resource';
      const rejectionReason = data?.rejectionReason || data?.booking?.rejectionReason;

      if (!targetId || !updatedStatus) return;

      // Update local state list dynamically
      setBookings((prev) =>
        prev.map((b) => {
          const currentId = b._id || b.id;
          if (String(currentId) === String(targetId)) {
            return {
              ...b,
              status: updatedStatus,
              ...(rejectionReason && { rejectionReason }),
            };
          }
          return b;
        })
      );

      // Trigger notification banner on screen
      const normalizedStatus = String(updatedStatus).toLowerCase();
      const statusEmoji =
        normalizedStatus === 'approved' || normalizedStatus === 'accepted' || normalizedStatus === 'completed' ? '🎉' : '❌';

      setNotification(
        `${statusEmoji} Booking for "${resourceName}" was ${normalizedStatus}!${
          rejectionReason ? ` Reason: ${rejectionReason}` : ''
        }`
      );

      // Refresh notification badge counter if Context helper exists
      if (fetchNotifications) fetchNotifications();

      setTimeout(() => setNotification(''), 6000);
    };

    // New Booking Created Handler
    const handleNewBooking = (data) => {
      setNotification(data.message || '✨ New booking created successfully!');
      const newBooking = data.booking || data;
      if (newBooking?._id || newBooking?.id) {
        setBookings((prev) => [newBooking, ...prev]);
      }
      setTimeout(() => setNotification(''), 5000);
    };

    // Cancellation Handler
    const handleCancellation = (data) => {
      const targetId = data?.bookingId || data?._id || data?.id;
      if (!targetId) return;

      setBookings((prev) =>
        prev.map((b) => {
          const currentId = b._id || b.id;
          if (String(currentId) === String(targetId)) {
            return { ...b, status: 'Canceled' };
          }
          return b;
        })
      );
    };

    // Attach Socket Listeners
    if (socket) {
      socket.on('BOOKING_STATUS_UPDATED', handleStatusUpdate);
      socket.on('bookingStatusUpdated', handleStatusUpdate);
      socket.on('booking_status_updated', handleStatusUpdate);
      socket.on('notification_received', handleStatusUpdate);
      socket.on('newBookingCreated', handleNewBooking);
      socket.on('booking_canceled', handleCancellation);
      socket.on('bookingCancelled', handleCancellation);
    }

    // Attach Custom Window Event Listener (Emitted from SocketContext)
    const handleCustomBookingEvent = (event) => {
      if (event.detail) handleStatusUpdate(event.detail);
    };
    window.addEventListener('bookingUpdated', handleCustomBookingEvent);

    return () => {
      if (socket) {
        socket.off('BOOKING_STATUS_UPDATED', handleStatusUpdate);
        socket.off('bookingStatusUpdated', handleStatusUpdate);
        socket.off('booking_status_updated', handleStatusUpdate);
        socket.off('notification_received', handleStatusUpdate);
        socket.off('newBookingCreated', handleNewBooking);
        socket.off('booking_canceled', handleCancellation);
        socket.off('bookingCancelled', handleCancellation);
      }
      window.removeEventListener('bookingUpdated', handleCustomBookingEvent);
    };
  }, [socket, fetchNotifications]);

  // Cancel Booking Handler
  const handleCancelBooking = async (e, bookingId) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;

    try {
      const token = getToken();
      const baseUrl = BACKEND_URL ? BACKEND_URL.replace(/\/$/, '') : 'http://localhost:5000/api';

      const res = await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to cancel booking');
      }

      setBookings((prev) =>
        prev.map((b) => ((b._id || b.id) === bookingId ? { ...b, status: 'Canceled' } : b))
      );
      setNotification('🚫 Booking canceled successfully.');
      setTimeout(() => setNotification(''), 5000);
    } catch (err) {
      console.error('Error canceling booking:', err);
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (rawStatus) => {
    const status = rawStatus || 'unknown';
    const normalized = String(status).toLowerCase().trim();

    const badgeConfigs = {
      pending: {
        wrapper: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]',
        label: 'Pending',
      },
      approved: {
        wrapper: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]',
        label: 'Approved',
      },
      accepted: {
        wrapper: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]',
        label: 'Accepted',
      },
      completed: {
        wrapper: 'bg-green-500/15 text-green-400 border-green-500/30',
        dot: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]',
        label: 'Completed',
      },
      rejected: {
        wrapper: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        dot: 'bg-orange-500 shadow-[0_0_8px_rgba(239,68,68,1)]',
        label: 'Rejected',
      },
      canceled: {
        wrapper: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]',
        label: 'Canceled',
      },
      cancelled: {
        wrapper: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]',
        label: 'Canceled',
      },
    };

    const config = badgeConfigs[normalized] || {
      wrapper: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      dot: 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,1)]',
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide whitespace-nowrap ${config.wrapper}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
        <p className="mt-3.5 text-slate-400 text-sm font-medium">Fetching your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-red-500/30 rounded-xl text-center shadow-xl">
        <div className="text-3xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">Unable to Load Bookings</h3>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <button
          onClick={fetchMyBookings}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md hover:shadow-indigo-500/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  //dfghj
  //WOW
  //dfghj
  //ASDFGHJK


  return (
    <div className="max-w-3xl mx-auto my-10 px-5 text-slate-50 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-50">My Resource Bookings</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time approval status and upcoming lab slot socks schedules.
          </p>
        </div>
        <div className="bg-slate-900 text-slate-300 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-slate-800 shadow-sm">
          {bookings.length} Total
        </div>
      </div>

      {/* Real-time Banner */}
      {notification && (
        <div className="flex items-center gap-2.5 bg-indigo-950/80 text-indigo-200 border border-indigo-500/40 px-4 py-3 rounded-xl mb-5 text-xs font-medium backdrop-blur-md shadow-lg transition-all">
          <span className="text-base">🔔</span>
          <span className="flex-1">{notification}</span>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-16 px-5 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-slate-200 font-semibold mb-1">No Bookings Yet</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            You haven't requested any resource or lab slot allocations.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => {
            const displayDate = booking.bookingDate || booking.dateISO || booking.date || 'N/A';
            const resourceName =
              typeof booking.resource === 'object'
                ? booking.resource?.name
                : booking.resourceName || 'Lab Resource';

            const bookingId = booking._id || booking.id;
            const normalizedStatus = String(booking.status || '').toLowerCase();
            const canCancel = normalizedStatus === 'pending' || normalizedStatus === 'approved';

            return (
              <div
                key={bookingId}
                onClick={() => navigate(`/booking/${bookingId}`)}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl p-5 shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors mb-2">
                      {resourceName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
                      <span className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50">
                        🗓️ {displayDate}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50">
                        ⏰ {booking.timeSlot || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto self-start">{getStatusBadge(booking.status)}</div>
                </div>

                {/* Purpose Section */}
                {booking.purpose && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-xs flex items-baseline gap-2">
                    <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                      Purpose:
                    </span>
                    <span className="text-slate-300 line-clamp-1">{booking.purpose}</span>
                  </div>
                )}

                {/* Rejection Reason Display */}
                {normalizedStatus === 'rejected' && booking.rejectionReason && (
                  <div className="mt-2.5 pt-2.5 border-t border-rose-900/30 text-xs flex items-baseline gap-2 text-rose-400 bg-rose-950/20 -mx-5 -mb-5 p-4 rounded-b-xl">
                    <span className="font-semibold text-[10px] uppercase tracking-wider shrink-0">
                      Reason:
                    </span>
                    <span>{booking.rejectionReason}</span>
                  </div>
                )}

                {/* Cancellation Action Button */}
               
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
