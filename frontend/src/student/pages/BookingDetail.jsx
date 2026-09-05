import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BACKEND_URL } from './Api';

export default function BookingDetailsPage() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
      setError('Invalid or missing Booking ID in URL path.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    fetchBookingDetail(controller.signal);

    return () => controller.abort();
  }, [bookingId]);

  const fetchBookingDetail = async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('labToken');

      const response = await fetch(`${BACKEND_URL}/bookings/${bookingId}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server returned status ${response.status}`);
      }

      const bookingData = data.booking || data.data || (data.success ? data : null);

      if (bookingData && (bookingData._id || bookingData.id)) {
        setBooking(bookingData);
      } else {
        throw new Error('Booking data was empty or structured unexpectedly.');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
  try {
    const token = localStorage.getItem('labToken');
    const response = await fetch(`${BACKEND_URL}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel booking.');
    }

    
    // Refresh your list or state here
  } catch (err) {
     throw new Error(err.message || 'Failed to cancel booking.');
  }
};

  const getStatusBadge = (status) => {
    const statusMap = {
      APPROVED: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
      REJECTED: 'bg-red-950/80 text-red-400 border-red-800/60',
      PENDING: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
      CANCELLED: 'bg-gray-800/80 text-gray-400 border-gray-700/60'
    };

    const key = (status || 'PENDING').toUpperCase();
    const styleClass = statusMap[key] || statusMap.PENDING;

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styleClass}`}>
        {key}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">Fetching booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-red-900/20 border border-red-800 p-6 rounded-xl text-center text-red-300 space-y-4 max-w-lg mx-auto mt-10">
        <p className="text-sm font-semibold">Failed to Load Booking</p>
        <p className="text-xs text-red-400">{error || 'Booking record missing'}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => fetchBookingDetail()}
            className="px-4 py-2 bg-red-800/40 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  // In BookingDetailsPage.jsx inside fetchBookingDetail:
console.log('Fetched Booking Payload:', booking);

  const status = (booking.status || 'PENDING').toUpperCase();
  const isCancellable = status === 'PENDING' || status === 'APPROVED';
  const faculty = booking.approvedBy || booking.reviewedBy;

  // Gracefully resolve lab details whether lab is directly populated or nested inside resource
  const labInfo = booking.lab || booking.resource?.lab;
  const labName = typeof labInfo === 'object' ? labInfo?.name : (booking.labName || 'N/A');
  const labLocation = typeof labInfo === 'object' 
    ? (labInfo?.location || labInfo?.building || labInfo?.roomNumber) 
    : (booking.labLocation || 'N/A');

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 font-sans">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          ← Back to Bookings
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">ID:</span>
          <span className="text-xs font-mono text-gray-300">{booking._id}</span>
        </div>
      </div>

      <div className="bg-[#0e1322] border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <span className="text-xs font-medium text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-800/40">
              {booking.resource?.category || 'Resource Booking'}
            </span>
            <h1 className="text-2xl font-bold text-gray-100 mt-2">
              {booking.resource?.name || 'Lab / Resource Request'}
            </h1>
          </div>
          <div>{getStatusBadge(status)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking & Lab Details */}
          <div className="space-y-4 bg-[#161b2c] p-4 rounded-xl border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              Booking & Location Info
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500 block">Lab Name</span>
                <span className="font-semibold text-indigo-300 text-sm">
                  🏢 {labName}
                </span>
              </div>

              <div>
                <span className="text-gray-500 block">Lab Location / Room</span>
                <span className="font-semibold text-gray-200">
                  📍 {labLocation}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-800/60">
                <span className="text-gray-500 block">Date & Time Slot</span>
                <span className="font-semibold text-gray-200">
                  {booking.bookingDate || (booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A')}{' '}
                  {booking.timeSlot ? `(${booking.timeSlot})` : ''}
                </span>
              </div>

              <div>
                <span className="text-gray-500 block">Units Requested</span>
                <span className="font-semibold text-gray-200">{booking.quantity || 1} units</span>
              </div>

              <div>
                <span className="text-gray-500 block">Stated Purpose</span>
                <p className="text-gray-300 mt-0.5 bg-[#0e1322] p-2 rounded border border-gray-800">
                  {booking.purpose || 'Academic work'}
                </p>
              </div>
            </div>
          </div>

          {/* Faculty Review Details */}
          <div className="space-y-4 bg-[#161b2c] p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-3">
                Faculty Review Details
              </h3>

              {faculty ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <span>👨‍🏫</span>
                    <span>{faculty.name}</span>
                  </div>
                  {faculty.email && (
                    <p className="text-gray-400">
                      <span className="text-gray-500">Email:</span> {faculty.email}
                    </p>
                  )}
                  {faculty.department && (
                    <p className="text-gray-400">
                      <span className="text-gray-500">Department:</span> {faculty.department}
                    </p>
                  )}
                  <p className="text-emerald-400 text-[11px] pt-2">
                    ✓ Request reviewed and authorized by faculty.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-gray-400 space-y-2">
                  <p className="italic">
                    {status === 'PENDING'
                      ? '⏳ Awaiting review by assigned lab faculty.'
                      : 'No faculty review info available.'}
                  </p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-gray-500 pt-4 border-t border-gray-800/80">
              Requested on: {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-5 flex items-center justify-between">
          <Link
            to="/bookings"
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            Return to All Bookings
          </Link>

          {isCancellable ? (
            <button
              onClick={() => handleCancelBooking(booking._id)}
              disabled={isCancelling}
              className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Booking Request'}
            </button>
          ) : (
            <span className="text-xs text-gray-500 italic">This booking cannot be modified</span>
          )}
        </div>
      </div>
    </div>
  );
}