import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../student/pages/Api'; // Adjust relative path to your Api file if needed

const getToken = () => localStorage.getItem('labToken') || localStorage.getItem('token');

export default function AdminBookingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch strictly PENDING lab booking requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = getToken();
      const res = await axios.get(`${BACKEND_URL}/lab-booking/requests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'PENDING' }, // Explicitly fetch only pending requests
      });

      if (res.data?.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('Error loading requests:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch booking requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Approve (removes request from list upon success)
  const handleApprove = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      const token = getToken();
      const res = await axios.put(
        `${BACKEND_URL}/lab-booking/requests/${bookingId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setRequests((prev) => prev.filter((item) => item._id !== bookingId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject (removes request from list upon success)
  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;

    setActionLoadingId(bookingId);
    try {
      const token = getToken();
      const res = await axios.put(
        `${BACKEND_URL}/lab-booking/requests/${bookingId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setRequests((prev) => prev.filter((item) => item._id !== bookingId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Search filter
  const filteredRequests = requests.filter((req) => {
    const userName = req.user?.name?.toLowerCase() || '';
    const userDept = req.user?.category?.toLowerCase() || '';
    const labName = req.labId?.name?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();

    return userName.includes(term) || userDept.includes(term) || labName.includes(term);
  });
  console.log('dhds',filteredRequests)

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Pending Lab Requests</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and take action on incoming pending lab access requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Pending Count:</span>
            <span className="font-bold text-amber-300">{requests.length}</span>
          </div>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all disabled:opacity-50"
            title="Refresh Requests"
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
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by faculty, lab name, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading pending requests...</div>
      ) : filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-xl border bg-slate-900/90 border-amber-500/30 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">
                    {item.user?.name || 'Unknown User'}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.user?.category || 'General'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/30">
                    PENDING
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-400">Lab:</strong> {item.labId?.name || 'N/A'}{' '}
                    {item.labId?.labNumber ? `(${item.labId.labNumber})` : ''}
                  </p>
                  <p>
                    <strong className="text-slate-400">Branch:</strong> {item.branch || 'N/A'}{' '}
                    {item.labId?.labNumber ? `(${item.labId.labNumber})` : ''}
                  </p>
                  <p>
                    <strong className="text-slate-400">Date/Time:</strong>{' '}
                    {item.date || item.slotDate || 'N/A'}{' '}
                    {item.startTime ? `| ${item.startTime} - ${item.endTime}` : ''}
                  </p>
                  {item.purpose && (
                    <p className="text-slate-400 italic">"{item.purpose}"</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(item._id)}
                  disabled={actionLoadingId === item._id}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all disabled:opacity-50"
                >
                  {actionLoadingId === item._id ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(item._id)}
                  disabled={actionLoadingId === item._id}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg transition-all disabled:opacity-50"
                >
                  {actionLoadingId === item._id ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <p className="text-xs text-slate-400">No pending requests found.</p>
        </div>
      )}
    </div>
  );
}