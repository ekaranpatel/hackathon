import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useResources } from '../../admin/services/Resource';
import { BACKEND_URL } from '../pages/Api';

function getAvailableCount(res) {
  if (typeof res?.availableQuantity === 'number') return res.availableQuantity;
  const total = res?.totalQuantity || 0;
  const assigned = res?.assignedQuantity || res?.bookedQuantity || 0;
  return Math.max(0, total - assigned);
}

export default function StudentResourcePage() {
  const { resources = [], labsList = [], loading, error, refetchResources } = useResources();

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedLab, setSelectedLab] = useState('All');
  const [availability, setAvailability] = useState('All');

  const [userBookings, setUserBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState({});

  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('labToken');
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

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setSelectedLab('All');
    setAvailability('All');
  };

  const { filteredResources, totalAvailableUnits, totalResourcesCount } = useMemo(() => {
    const safeResources = Array.isArray(resources) ? resources : [];

    const availUnits = safeResources.reduce((acc, res) => {
      return acc + getAvailableCount(res);
    }, 0);

    const query = search.toLowerCase().trim();

    const filtered = safeResources.filter((res) => {
      const availableCount = getAvailableCount(res);

      const matchesSearch =
        !query ||
        res.name?.toLowerCase().includes(query) ||
        res.title?.toLowerCase().includes(query) ||
        res.category?.toLowerCase().includes(query) ||
        res.description?.toLowerCase().includes(query) ||
        res.desc?.toLowerCase().includes(query);

      const matchesCategory =
        category === 'All' ||
        String(res.category || '').toLowerCase().trim() === String(category).toLowerCase().trim();

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

  const dynamicCategories = useMemo(() => {
    const rawCategories = (resources || []).map((r) => r.category).filter(Boolean);
    const uniqueMap = new Map();
    rawCategories.forEach((cat) => {
      const key = String(cat).toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, String(cat).trim());
      }
    });
    return ['All', ...Array.from(uniqueMap.values())];
  }, [resources]);

  const handleSlotSelect = (resourceId, slotValue) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [resourceId]: slotValue,
    }));
  };

  const handleBookingSubmit = async (resource) => {
    const resourceId = resource._id || resource.id;
    const rawSlots = Array.isArray(resource.timeSlots) && resource.timeSlots.length > 0
      ? resource.timeSlots
      : Array.isArray(resource.slots) && resource.slots.length > 0
      ? resource.slots
      : ['09:00 AM - 11:00 AM'];

    const chosenSlot = selectedSlots[resourceId] || (typeof rawSlots[0] === 'object' ? rawSlots[0].label || rawSlots[0].time : rawSlots[0]);
    const slotIdOrLabel = typeof chosenSlot === 'object' ? chosenSlot.id || chosenSlot.time || chosenSlot.label : chosenSlot;

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
      alert(`You have already booked "${resource.name}" for slot (${slotIdOrLabel}).`);
      return;
    }

    try {
      setBookingLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('labToken');

      const response = await axios.post(
        `${BACKEND_URL}/bookings`,
        {
          resourceId,
          slot: slotIdOrLabel,
          date: new Date().toISOString().split('T')[0],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success || response.status === 201) {
        alert(`Success! Booking requested for "${resource.name}" (${slotIdOrLabel})`);
        const newBookingObj = response.data.booking || {
          resource: resourceId,
          slot: slotIdOrLabel,
          status: 'pending',
        };
        setUserBookings((prev) => [...prev, newBookingObj]);
        if (typeof refetchResources === 'function') refetchResources();
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'This slot has already been reserved or is unavailable.';
      alert(`Booking Failed: ${errorMessage}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const colorPalettes = [
    {
      border: 'border-blue-500/50 hover:border-blue-400',
      bgGlow: 'bg-[#0a142c]/75 shadow-[0_0_20px_rgba(59,130,246,0.12)]',
      accentText: 'text-cyan-400',
      tagBg: 'bg-blue-900/40 text-blue-300 border-blue-500/40',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]',
      progress: 'bg-blue-500',
    },
    {
      border: 'border-purple-500/50 hover:border-purple-400',
      bgGlow: 'bg-[#15112e]/75 shadow-[0_0_20px_rgba(168,85,247,0.12)]',
      accentText: 'text-purple-400',
      tagBg: 'bg-purple-900/40 text-purple-300 border-purple-500/40',
      btn: 'bg-[#9333ea] hover:bg-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]',
      progress: 'bg-purple-500',
    },
    {
      border: 'border-emerald-500/50 hover:border-emerald-400',
      bgGlow: 'bg-[#0d221c]/75 shadow-[0_0_20px_rgba(16,185,129,0.12)]',
      accentText: 'text-emerald-400',
      tagBg: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]',
      progress: 'bg-emerald-500',
    },
    {
      border: 'border-cyan-500/50 hover:border-cyan-400',
      bgGlow: 'bg-[#081e2b]/75 shadow-[0_0_20px_rgba(6,182,212,0.12)]',
      accentText: 'text-cyan-300',
      tagBg: 'bg-cyan-900/40 text-cyan-300 border-cyan-500/40',
      btn: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      progress: 'bg-cyan-400',
    },
    {
      border: 'border-amber-500/50 hover:border-amber-400',
      bgGlow: 'bg-[#22170c]/75 shadow-[0_0_20px_rgba(245,158,11,0.12)]',
      accentText: 'text-amber-400',
      tagBg: 'bg-amber-900/40 text-amber-300 border-amber-500/40',
      btn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      progress: 'bg-amber-500',
    },
    {
      border: 'border-rose-500/50 hover:border-rose-400',
      bgGlow: 'bg-[#261019]/75 shadow-[0_0_20px_rgba(244,63,94,0.12)]',
      accentText: 'text-rose-400',
      tagBg: 'bg-rose-900/40 text-rose-300 border-rose-500/40',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]',
      progress: 'bg-rose-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a17] flex flex-col items-center justify-center p-6 text-slate-400 font-sans">
        <div className="w-10 h-10 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
        <p className="text-xs font-semibold tracking-wider uppercase text-cyan-400">Loading Student Resources...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a17] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1340px] mx-auto space-y-6">

        {/* 1. Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0a1226]/90 via-[#0a142c]/80 to-[#070d1d]/90 border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CENTRAL RESOURCE REPOSITORY
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Student Resource Hub</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Reserve advanced equipment, GPU workstations, testing kits, and fabrication tools for your academic and project work.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              Total Available: {totalAvailableUnits} Units
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
              Types Listed: {totalResourcesCount}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              Active Bookings: {userBookings.length}
            </span>
          </div>
        </div>

        {/* 2. Top Metric Cards */}
         

        {/* 3. Middle Row: Countdown Door Pass & Notifications */}
        

        {/* 4. Filter Toolbar & Quick Tags */}
        <div className="p-4 rounded-2xl bg-[#090f20]/90 border border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.4)] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-1">
              <input
                type="text"
                placeholder="Search labs, equipment, GPU, 3D printers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-7 py-2 text-xs bg-[#050814] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Lab Select */}
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="bg-[#050814] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="All">All Labs</option>
              {(labsList || []).map((l) => (
                <option key={l._id || l.id || l.name} value={l._id || l.id || l.name}>
                  {l.name || 'Lab'}
                </option>
              ))}
            </select>

            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#050814] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Availability Select */}
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="bg-[#050814] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="All">All Availability</option>
              <option value="Available">Available Only</option>
              <option value="Unavailable">Unavailable / Booked</option>
            </select>
          </div>

          {/* Tag Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Filter:</span>
            {['All', 'Robotics & AI', '3D Fabrication', 'Optics & Sensing', 'Biotech Suite'].map((tag) => {
              const isActive = (tag === 'All' && category === 'All') || category.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => setCategory(tag === 'All' ? 'All' : tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-[#050814] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {(search || category !== 'All' || selectedLab !== 'All' || availability !== 'All') && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-medium ml-auto"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* 5. Browse Labs & Resources Grid */}
        <section className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <span>⚡</span> BROWSE LABS & RESOURCES
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredResources.length} of {totalResourcesCount} Items
            </span>
          </div>

          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResources.map((res, index) => {
                const palette = colorPalettes[index % colorPalettes.length];
                const availableCount = getAvailableCount(res);
                const isAvailable = availableCount > 0;
                const resourceId = res._id || res.id;

                const rawSlots = Array.isArray(res.timeSlots) && res.timeSlots.length > 0
                  ? res.timeSlots
                  : Array.isArray(res.slots) && res.slots.length > 0
                  ? res.slots
                  : ['09:00 AM - 11:00 AM', '11:30 AM - 01:30 PM', '02:00 PM - 04:00 PM'];

                const selectedSlot = selectedSlots[resourceId] || (typeof rawSlots[0] === 'object' ? rawSlots[0].label || rawSlots[0].time : rawSlots[0]);

                return (
                  <div
                    key={resourceId}
                    className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between gap-4 ${palette.border} ${palette.bgGlow}`}
                  >
                    {/* Top Row: Category Tag + Availability Chip */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${palette.tagBg}`}>
                          {res.category || 'Laboratory'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAvailable
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                              : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                          }`}
                        >
                          {isAvailable ? 'Available Now' : 'Busy / Booked'}
                        </span>
                      </div>

                      {/* Resource Name */}
                      <h3 className="font-extrabold text-base text-white leading-snug tracking-tight mb-1">
                        {res.name || res.title || 'Specialized Workstation'}
                      </h3>

                      {/* Lab Location */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                        <span className="text-cyan-400">📍</span>
                        <span>{res.lab?.name || res.labName || 'Main Lab Facility'}</span>
                      </div>

                      {/* Stock Bar */}
                      <div className="space-y-1.5 mb-3 bg-[#050814]/70 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Assigned Availability:</span>
                          <span className="font-mono font-bold text-white">
                            {availableCount} / {res.totalQuantity || availableCount || 1} Units
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${palette.progress} rounded-full`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((availableCount / (res.totalQuantity || availableCount || 1)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Slot Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          Select Booking Slot:
                        </label>
                        <select
                          value={selectedSlot}
                          onChange={(e) => handleSlotSelect(resourceId, e.target.value)}
                          className="w-full bg-[#050814] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                        >
                          {rawSlots.map((slot, i) => {
                            const val = typeof slot === 'object' ? slot.label || slot.time || slot.id : slot;
                            return (
                              <option key={i} value={val}>
                                🕒 {val}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Booking CTA */}
                    <button
                      onClick={() => handleBookingSubmit(res)}
                      disabled={bookingLoading || !isAvailable}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${palette.btn}`}
                    >
                      {bookingLoading ? 'Processing...' : isAvailable ? 'Book Slot Now' : 'Check Availability'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#090f20]/60 rounded-2xl border border-dashed border-slate-800">
              <p className="text-sm text-slate-400 mb-2">No lab resources matched your filter criteria.</p>
              <button
                onClick={handleResetFilters}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}