import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../student/pages/Api'; // Adjust relative path to your Api file if needed

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [bookingTypeFilter, setBookingTypeFilter] = useState('ALL'); // ALL, LAB, RESOURCE
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const getToken = () => localStorage.getItem('labToken');

  // Fetch Both Resource & Lab Bookings
  const fetchAllBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Concurrently fetch both resource and lab bookings
      const [resourceRes, labRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/bookings/admin/all`, { headers }),
        axios.get(`${BACKEND_URL}/bookings/admin/all-labs`, { headers }) // Adjust endpoint path if needed
      ]);

      let normalizedResources = [];
      let normalizedLabs = [];
 
      if (resourceRes.status === 'fulfilled') {
        const rawResources = resourceRes.value.data?.bookings || [];
        normalizedResources = rawResources.map((item) => ({
          id: item._id,
          category: 'RESOURCE',
          type: item.resource?.category?.toUpperCase() || 'EQUIPMENT',
          title: item.resource?.name || 'Resource Item',
          user: item.user?.name || 'Unknown User',
          email: item.user?.email || 'N/A',
          role: (item.user?.role || 'STUDENT').toUpperCase(),
          date: item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
          timeSlot: item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : (item.timeSlot || 'N/A'),
          status: (item.status || 'Pending').toUpperCase(),
          createdAt: item.createdAt,
          endpoint: 'bookings' // For PUT status updates
        }));
      }

      // Normalize Lab Bookings
      if (labRes.status === 'fulfilled') {
        const rawLabs = labRes.value.data?.labBookings || labRes.value.data?.bookings || [];
        normalizedLabs = rawLabs.map((item) => ({
          id: item._id,
          category: 'LAB',
          type: item.lab?.department?.toUpperCase() || 'LAB',
          title: item.labId.name|| item.labName || 'Lab Room',
          user: item.user?.name || 'Unknown User',
          email: item.user?.email || 'N/A',
          role: (item.user?.role || 'STUDENT').toUpperCase(),
          date: item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
          timeSlot: item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : (item.timeSlot || 'N/A'),
          status: (item.status || 'Pending').toUpperCase(),
          createdAt: item.createdAt,
          endpoint: 'lab-bookings' // Adjust if lab status endpoint differs
        }));
      }
      

      // Merge and sort by newest first
      const combined = [...normalizedResources, ...normalizedLabs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setBookings(combined);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
      setError('Failed to load bookings data.');
    } finally {
      setLoading(false);
    }
  };
 

  useEffect(() => {
    fetchAllBookings();
  }, []);

  // Update Booking Status Action
  const handleStatusUpdate = async (id, newStatus, endpointCategory) => {
    
  };

  // Filter Logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      if (bookingTypeFilter !== 'ALL' && item.category !== bookingTypeFilter) return false;
      if (roleFilter !== 'ALL' && item.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesUser = item.user.toLowerCase().includes(query);
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesEmail = item.email.toLowerCase().includes(query);
        return matchesUser || matchesTitle || matchesEmail;
      }

      return true;
    });
  }, [bookings, bookingTypeFilter, roleFilter, statusFilter, searchTerm]);

  // Status Badges Component
  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">APPROVED</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">REJECTED</span>;
      case 'CANCELED':
      case 'CANCELLED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-500/10 text-slate-400 border border-slate-500/30">CANCELED</span>;
      case 'PENDING':
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">PENDING</span>;
    }
  };
  console.log('dhdjuf',filteredBookings);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🗂️ All Booking Requests
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage all lab and resource bookings across the institution.</p>
        </div>
        <button
          onClick={fetchAllBookings}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search student, lab, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Booking Type</label>
          <select
            value={bookingTypeFilter}
            onChange={(e) => setBookingTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Types</option>
            <option value="LAB">Lab Booking</option>
            <option value="RESOURCE">Resource Booking</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">User Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELED">Canceled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="flex items-end justify-start sm:justify-end">
          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredBookings.length}</strong> of {bookings.length}
          </span>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Booking Target</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Status</th>
               
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Loading all booking records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-rose-400">
                    {error}
                  </td>
                </tr>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((item) => (
                  <tr key={`${item.category}-${item.id}`} className="hover:bg-slate-900/80 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.category === 'LAB'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{item.user}</div>
                      <div className="text-[11px] text-slate-500">{item.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.role === 'FACULTY'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {item.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.type}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      <div>{item.date}</div>
                      <div className="text-[11px] text-slate-500">{item.timeSlot}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No bookings found matching selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}