import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSocket } from '../../context/SocketContext';
import { BACKEND_URL } from '../../student/pages/Api';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState('');

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Reject Modal State
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { socket, fetchNotifications } = useSocket();

  // Token Getter Helper
  const getToken = () => localStorage.getItem('labToken') || localStorage.getItem('token');

  // Fetch All Student Bookings (Admin API Endpoint)
  const fetchAllBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error('Admin authentication token missing. Please log in.');
      }

       
      const response = await fetch(`${BACKEND_URL}/bookings/admin/all`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error ${response.status}`);
      }

      const data = await response.json();
      const fetchedBookings = Array.isArray(data)
        ? data
        : data.bookings || data.data || [];

      setBookings(fetchedBookings);
    } catch (err) {
      console.error('Error loading admin bookings:', err);
      setError(err.message || 'Failed to fetch student booking requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  // Real-Time Socket Listeners for Admin Dashboard
  useEffect(() => {
    if (!socket) return;

    // Join Admin Channel
    socket.emit('join_room', 'admin_room');

    const handleNewBooking = (data) => {
      const newBooking = data.booking || data;
      if (newBooking?._id || newBooking?.id) {
        setBookings((prev) => [newBooking, ...prev]);
        setNotification(`📩 New booking request submitted by ${newBooking?.user?.name || 'a student'}!`);
        setTimeout(() => setNotification(''), 5000);
      }
    };

    const handleBookingUpdate = (data) => {
      const targetId = data?.bookingId || data?._id || data?.id || data?.booking?._id;
      const updatedStatus = data?.status || data?.booking?.status;
      if (!targetId || !updatedStatus) return;

      setBookings((prev) =>
        prev.map((b) => ((b._id || b.id) === targetId ? { ...b, status: updatedStatus } : b))
      );
    };

    socket.on('newBookingCreated', handleNewBooking);
    socket.on('bookingStatusUpdated', handleBookingUpdate);
    socket.on('BOOKING_STATUS_UPDATED', handleBookingUpdate);

    return () => {
      socket.off('newBookingCreated', handleNewBooking);
      socket.off('bookingStatusUpdated', handleBookingUpdate);
      socket.off('BOOKING_STATUS_UPDATED', handleBookingUpdate);
    };
  }, [socket]);

  // Handle Approve Action
  const handleApprove = async (bookingId) => {
    try {
      setActionLoading(true);
      const token = getToken();
   

      const res = await fetch(`${BACKEND_URL}/bookings/admin/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Approved' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to approve booking');
      }

      setBookings((prev) =>
        prev.map((b) => ((b._id || b.id) === bookingId ? { ...b, status: 'Approved' } : b))
      );

      setNotification('✅ Booking request approved successfully!');
      if (fetchNotifications) fetchNotifications();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Action (Triggered inside modal)
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingBooking) return;

    if (!rejectionReason.trim()) {
      alert('Please enter a reason for rejecting the booking.');
      return;
    }

    try {
      setActionLoading(true);
      const token = getToken();
      const baseUrl = BACKEND_URL ? BACKEND_URL.replace(/\/$/, '') : 'http://localhost:5000/api';
      const bookingId = rejectingBooking._id || rejectingBooking.id;

      const res = await fetch(`${baseUrl}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Rejected',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reject booking');
      }

      setBookings((prev) =>
        prev.map((b) =>
          (b._id || b.id) === bookingId
            ? { ...b, status: 'Rejected', rejectionReason: rejectionReason.trim() }
            : b
        )
      );

      setNotification('❌ Booking request rejected.');
      setRejectingBooking(null);
      setRejectionReason('');
      if (fetchNotifications) fetchNotifications();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic Category Extraction from Bookings Data
  const categories = useMemo(() => {
    const extracted = new Set();
    bookings.forEach((b) => {
      const cat = typeof b.resource === 'object' ? b.resource?.category : b.category;
      if (cat) extracted.add(cat);
    });
    return ['All', ...Array.from(extracted)];
  }, [bookings]);

  // Filter & Search Logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const statusMatch =
        selectedStatus === 'All' ||
        String(b.status).toLowerCase() === selectedStatus.toLowerCase();

      const resourceCat =
        typeof b.resource === 'object' ? b.resource?.category : b.category || 'Uncategorized';
      const categoryMatch =
        selectedCategory === 'All' ||
        String(resourceCat).toLowerCase() === selectedCategory.toLowerCase();

      const studentName = b.user?.name || b.studentName || '';
      const studentEmail = b.user?.email || b.studentEmail || '';
      const resourceName =
        typeof b.resource === 'object' ? b.resource?.name : b.resourceName || '';

      const searchMatch =
        searchTerm === '' ||
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(b.purpose || '').toLowerCase().includes(searchTerm.toLowerCase());

      return statusMatch && categoryMatch && searchMatch;
    });
  }, [bookings, selectedCategory, selectedStatus, searchTerm]);

  // Status Badge Helper
  const getStatusBadge = (rawStatus) => {
    const normalized = String(rawStatus || 'unknown').toLowerCase().trim();

    const configMap = {
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      accepted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      completed: 'bg-green-500/15 text-green-400 border-green-500/30',
      rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      canceled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    };

    const style = configMap[normalized] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    const label = rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : 'Unknown';

    return (
      <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${style}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
        <p className="mt-3 text-slate-400 text-sm">Loading all student requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-red-500/30 rounded-xl text-center">
        <div className="text-3xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Requests</h3>
        <p className="text-slate-400 text-sm mb-4">{error}</p>
        <button
          onClick={fetchAllBookings}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 text-slate-50 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            Admin - Student Booking Requests
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, approve, or reject lab resource applications across all categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-900 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-800">
            Total: {bookings.length}
          </span>
          <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/20">
            Pending: {bookings.filter((b) => String(b.status).toLowerCase() === 'pending').length}
          </span>
        </div>
      </div>

      {/* Realtime Notification Banner */}
      {notification && (
        <div className="bg-indigo-950/80 text-indigo-200 border border-indigo-500/40 px-4 py-3 rounded-xl mb-5 text-xs font-medium flex items-center gap-2 shadow-lg">
           
          <span>{notification}</span>
        </div>
      )}

      {/* Filter & Search Bar Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
            Search
          </label>
          <input
            type="text"
            placeholder="Search student, email, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        
      </div>

      {/* Requests Table / Cards */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-slate-300 font-medium">No Matching Requests Found</h3>
          <p className="text-slate-500 text-xs mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingId = booking._id || booking.id;
            const studentName = booking.user?.name || booking.studentName || 'Student';
            const studentEmail = booking.user?.email || booking.studentEmail || 'N/A';
            const resourceName =
              typeof booking.resource === 'object'
                ? booking.resource?.name
                : booking.resourceName || 'Resource';
            const category =
              typeof booking.resource === 'object'
                ? booking.resource?.category
                : booking.category || 'General';

            const displayDate = booking.bookingDate || booking.dateISO || booking.date || 'N/A';
            const normalizedStatus = String(booking.status || 'pending').toLowerCase();
            const isPending = normalizedStatus === 'pending';

            return (
              <div
                key={bookingId}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Student & Resource Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium">
                        {category}
                      </span>
                      <h3 className="text-base font-semibold text-slate-100">{resourceName}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                      <p>
                        👤 <strong className="text-slate-200">{studentName}</strong> ({studentEmail})
                      </p>
                      <p>🗓️ {displayDate}</p>
                      <p>⏰ {booking.timeSlot || 'N/A'}</p>
                    </div>

                    {booking.purpose && (
                      <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 font-semibold">Purpose:</span>{' '}
                        {booking.purpose}
                      </p>
                    )}

                    {normalizedStatus === 'rejected' && booking.rejectionReason && (
                      <p className="text-xs text-rose-400 mt-2 bg-rose-950/20 px-3 py-2 rounded-lg border border-rose-900/30">
                        <span className="font-semibold">Rejection Reason:</span>{' '}
                        {booking.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
                    <div>{getStatusBadge(booking.status)}</div>

                    {/* Approve / Reject Controls */}
                    {isPending && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleApprove(bookingId)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => {
                            setRejectingBooking(booking);
                            setRejectionReason('');
                          }}
                          className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 disabled:opacity-50 rounded-lg text-xs font-semibold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1">Reject Booking Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Provide a clear reason so the student knows why their request was rejected.
            </p>

            <form onSubmit={handleConfirmReject}>
              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Lab slot unavailable, resource under maintenance..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 mb-4 resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingBooking(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;