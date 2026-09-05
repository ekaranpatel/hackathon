import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useResources } from '../../admin/services/Resource';
import StudentResourceCard from '../components/StudentResourceCard';
import { BACKEND_URL } from '../pages/Api';
// Helper function to resolve resource quantity safely across different schema styles
function getAvailableCount(res) {
  if (typeof res?.availableQuantity === 'number') return res.availableQuantity;
  const total = res?.totalQuantity || 0;
  const assigned = res?.assignedQuantity || res?.bookedQuantity || 0;
  return Math.max(0, total - assigned);
}

export default function StudentResourcePage() {
  const { resources = [], labsList = [], loading, error, refetchResources } = useResources();

  // Local Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedLab, setSelectedLab] = useState('All');
  const [availability, setAvailability] = useState('All');

  // Track User's Active Bookings & Processing State
  const [userBookings, setUserBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch current user's existing bookings on mount
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get(`${BACKEND_URL}/bookings/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success || Array.isArray(res.data)) {
          setUserBookings(res.data.bookings || res.data || []);
        }
      } catch (err) {
        console.warn('Could not load user bookings:', err.message);
      }
    };

    fetchUserBookings();
  }, []);

  // Reset Filters Helper
  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setSelectedLab('All');
    setAvailability('All');
  };

  // Dynamic Metrics & Filtering Logic
  const { filteredResources, totalAvailableUnits, totalResourcesCount } = useMemo(() => {
    const safeResources = Array.isArray(resources) ? resources : [];

    // Calculate real available units across all loaded resources
    const availUnits = safeResources.reduce((acc, res) => {
      return acc + getAvailableCount(res);
    }, 0);

    const query = search.toLowerCase().trim();

    const filtered = safeResources.filter((res) => {
      const availableCount = getAvailableCount(res);

      // 1. Search Query Match
      const matchesSearch =
        !query ||
        res.name?.toLowerCase().includes(query) ||
        res.title?.toLowerCase().includes(query) ||
        res.category?.toLowerCase().includes(query) ||
        res.description?.toLowerCase().includes(query) ||
        res.desc?.toLowerCase().includes(query);

      // 2. Category Match
      const matchesCategory =
        category === 'All' ||
        String(res.category || '').toLowerCase().trim() === String(category).toLowerCase().trim();

      // 3. Match Resource via Lab
      let matchesLab = selectedLab === 'All';

      if (!matchesLab) {
        const activeLabObj = (labsList || []).find((l) => {
          const lId = String(l._id || l.id || '').toLowerCase().trim();
          const lName = String(l.name || l.labName || '').toLowerCase().trim();
          const target = String(selectedLab).toLowerCase().trim();
          return lId === target || lName === target;
        });

        if (activeLabObj && Array.isArray(activeLabObj.assignedResources)) {
          matchesLab = activeLabObj.assignedResources.some(
            (assignedItem) =>
              String(assignedItem.name || '').toLowerCase().trim() ===
              String(res.name || '').toLowerCase().trim()
          );
        } else {
          const resLabId = typeof res.lab === 'object' ? res.lab?._id : res.lab || res.labId;
          const resLabName = typeof res.lab === 'object' ? res.lab?.name : res.labName;
          const targetLab = String(selectedLab).toLowerCase().trim();

          matchesLab =
            (resLabId && String(resLabId).toLowerCase().trim() === targetLab) ||
            (resLabName && String(resLabName).toLowerCase().trim() === targetLab);
        }
      }

      // 4. Availability Status Match
      const matchesAvailability =
        availability === 'All' ||
        (availability === 'Available' && availableCount > 0) ||
        (availability === 'Unavailable' && availableCount === 0);

      return matchesSearch && matchesCategory && matchesLab && matchesAvailability;
    });

    return {
      filteredResources: filtered,
      totalAvailableUnits: availUnits,
      totalResourcesCount: safeResources.length,
    };
  }, [resources, labsList, search, category, selectedLab, availability]);

  // Extract Case-Deduplicated Categories dynamically
  const dynamicCategories = useMemo(() => {
    const rawCategories = (resources || [])
      .map((r) => r.category)
      .filter(Boolean);

    const uniqueMap = new Map();
    rawCategories.forEach((cat) => {
      const key = String(cat).toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, String(cat).trim());
      }
    });

    return ['All', ...Array.from(uniqueMap.values())];
  }, [resources]);

  const hasActiveFilters =
    search !== '' || category !== 'All' || selectedLab !== 'All' || availability !== 'All';

  // 🔒 BOOKING SUBMISSION HANDLER WITH DUPLICATE CHECK
  const handleBookingSubmit = async (resource, slot) => {
    const slotIdOrLabel = typeof slot === 'object' ? slot.id || slot.time || slot.label : slot;
    const resourceId = resource._id || resource.id;

    // 1. Client-Side Check: Verify if user already booked this exact resource & slot
    const isAlreadyBookedByUser = userBookings.some((b) => {
      const bResId = typeof b.resource === 'object' ? b.resource?._id || b.resource?.id : b.resource || b.resourceId;
      const bSlot = typeof b.slot === 'object' ? b.slot?.id || b.slot?.time || b.slot?.label : b.slot || b.timeSlot;
      const bStatus = String(b.status || '').toLowerCase();

      return (
        String(bResId) === String(resourceId) &&
        String(bSlot).trim() === String(slotIdOrLabel).trim() &&
        bStatus !== 'cancelled' &&
        bStatus !== 'rejected'
      );
    });

    if (isAlreadyBookedByUser) {
      alert(`You have already booked "${resource.name}" for slot (${slotIdOrLabel}). Multiple bookings for the same slot are not allowed.`);
      return;
    }

    // 2. Client-Side Check: Ensure slot isn't marked as booked by someone else
    if (typeof slot === 'object' && (slot.isBooked || slot.status === 'Booked' || slot.available === false)) {
      alert(`This time slot (${slotIdOrLabel}) is already booked by another user. Please choose a different slot.`);
      return;
    }

    // 3. Submit Booking Request to Server
    try {
      setBookingLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${BACKEND_URL}/bookings`,
        {
          resourceId,
          slot: slotIdOrLabel,
          date: new Date().toISOString().split('T')[0], // current date or selected date
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success || response.status === 201) {
        alert(`Success! Booking confirmed for "${resource.name}" at slot: ${slotIdOrLabel}`);

        // Append new booking locally to prevent instant re-click
        const newBookingObj = response.data.booking || {
          resource: resourceId,
          slot: slotIdOrLabel,
          status: 'pending',
        };
        setUserBookings((prev) => [...prev, newBookingObj]);

        // Trigger refetch if helper exists
        if (typeof refetchResources === 'function') {
          refetchResources();
        }
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'This slot has already been reserved or is unavailable.';

      alert(`Booking Failed: ${errorMessage}`);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 font-medium text-sm">
        Loading student resources...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-rose-400 font-medium text-sm">
        Error loading resources: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Top Banner */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Student Resource Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Reserve lab equipment, devices, and workstations for your lab sessions.
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-950/80 border border-indigo-800/60 px-3.5 py-1.5 rounded-lg flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-xs">
              <span className="text-slate-400">Total Available: </span>
              <span className="font-bold text-emerald-400 text-sm ml-1">
                {totalAvailableUnits} Units
              </span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs text-slate-300">
            Types Listed: <span className="font-bold text-slate-100">{totalResourcesCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by resource name, description, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs pointer-events-none">🔍</span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Select Filters Group */}
          <div className="w-full md:w-auto flex flex-wrap gap-2.5 items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg">
              <span className="text-[11px] text-slate-500 font-medium">Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {dynamicCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Lab Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg">
              <span className="text-[11px] text-slate-500 font-medium">Lab:</span>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-slate-200">All Labs</option>
                {(labsList || []).map((lab) => {
                  const labValue = lab._id || lab.id || lab.name;
                  const labLabel = lab.name || 'Unnamed Lab';
                  return (
                    <option
                      key={String(labValue)}
                      value={String(labValue)}
                      className="bg-slate-900 text-slate-200"
                    >
                      {labLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg">
              <span className="text-[11px] text-slate-500 font-medium">Status:</span>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-slate-200">All Statuses</option>
                <option value="Available" className="bg-slate-900 text-slate-200">Available</option>
                <option value="Unavailable" className="bg-slate-900 text-slate-200">Out of Stock</option>
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-indigo-400 border border-slate-800 hover:border-indigo-900/50 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>↺</span> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resource Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredResources.map((resource) => {
            const availableCount = getAvailableCount(resource);
            const rawSlots =
              Array.isArray(resource.timeSlots) && resource.timeSlots.length > 0
                ? resource.timeSlots
                : Array.isArray(resource.slots) && resource.slots.length > 0
                ? resource.slots
                : [];

            // Decorate slots with booking statuses for StudentResourceCard rendering
            const decoratedSlots = rawSlots.map((slot) => {
              const slotVal = typeof slot === 'object' ? slot.id || slot.time || slot.label : slot;

              const isUserBooked = userBookings.some((b) => {
                const bResId = typeof b.resource === 'object' ? b.resource?._id || b.resource?.id : b.resource || b.resourceId;
                const bSlot = typeof b.slot === 'object' ? b.slot?.id || b.slot?.time || b.slot?.label : b.slot || b.timeSlot;
                const bStatus = String(b.status || '').toLowerCase();

                return (
                  String(bResId) === String(resource._id || resource.id) &&
                  String(bSlot).trim() === String(slotVal).trim() &&
                  bStatus !== 'cancelled' &&
                  bStatus !== 'rejected'
                );
              });

              if (typeof slot === 'object') {
                return {
                  ...slot,
                  isBooked: slot.isBooked || isUserBooked,
                  isUserBooked,
                };
              }

              return {
                id: slotVal,
                label: slotVal,
                isBooked: isUserBooked,
                isUserBooked,
              };
            });

            return (
              <StudentResourceCard
                key={resource._id || resource.id}
                resource={{
                  ...resource,
                  availableQuantity: availableCount,
                  totalQuantity: resource.totalQuantity || 0,
                  timeSlots: decoratedSlots,
                }}
                onBook={handleBookingSubmit}
                disabled={bookingLoading}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900 rounded-xl border border-dashed border-slate-800">
          <p className="text-xs text-slate-400">No resources found matching your active filters.</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 text-xs text-indigo-400 hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}