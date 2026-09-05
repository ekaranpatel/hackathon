import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { BACKEND_URL } from "../../pages/Api";

const DAY_SLOTS = [
  { id: '1', start: '09:00', end: '10:00', label: '09:00 AM - 10:00 AM' },
  { id: '2', start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
  { id: '3', start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
  { id: '4', start: '12:00', end: '13:00', label: '12:00 PM - 01:00 PM' },
  { id: '5', start: '13:00', end: '14:00', label: '01:00 PM - 02:00 PM' },
  { id: '6', start: '14:00', end: '15:00', label: '02:00 PM - 03:00 PM' },
  { id: '7', start: '15:00', end: '16:00', label: '03:00 PM - 04:00 PM' },
  { id: '8', start: '16:00', end: '17:00', label: '04:00 PM - 05:00 PM' },
];

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to get today's local date in YYYY-MM-DD format
const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LabScheduleDetailPage({ labId: propLabId, onBookSlot }) {
  const { id } = useParams(); 
  const labId = id || propLabId;

  const today = getTodayString();
  
  const [labDetails, setLabDetails] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (labId) {
      fetchDaySchedule(labId, selectedDate);
    }
  }, [labId, selectedDate]);

  const fetchDaySchedule = async (id, date) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BACKEND_URL}/lab-booking/${labId}/schedule?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setLabDetails(res.data.lab || null);
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load lab schedule:', err);
      setError(err.response?.data?.message || 'Failed to fetch schedule data.');
    } finally {
      setLoading(false);
    }
  };

  const findMatchingBooking = (slotStartStr, slotEndStr) => {
    const slotStart = timeToMinutes(slotStartStr);
    const slotEnd = timeToMinutes(slotEndStr);

    return bookings.find((b) => {
      if (b.status === 'cancelled') return false;
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return bStart < slotEnd && bEnd > slotStart;
    });
  };

  const bookedSlotsCount = DAY_SLOTS.filter((s) => findMatchingBooking(s.start, s.end)).length;
  const availableSlotsCount = DAY_SLOTS.length - bookedSlotsCount;

  const handleDateChange = (e) => {
    const value = e.target.value;
    // Prevent selection if date is earlier than today
    if (value < today) {
      setSelectedDate(today);
    } else {
      setSelectedDate(value);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {labDetails?.name?.trim() || 'Laboratory Schedule'}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {labDetails?.category || 'CSE Lab'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            📍 {labDetails?.location || 'Main Campus'} | Capacity: {labDetails?.capacity || 'N/A'} Students
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
            <span className="text-xs text-slate-400 pl-1 font-medium">Date:</span>
            <input
             type="date"
              min={today}
              value={selectedDate}
              onChange={handleDateChange}
              className="text-slate-100 border border-slate-800 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => fetchDaySchedule(labId, selectedDate)}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Daily Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 font-medium">Total Operating Hours</p>
          <p className="text-lg font-bold text-white mt-0.5">09:00 AM - 05:00 PM</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-center">
          <p className="text-[11px] text-emerald-400 font-medium">Available Slots</p>
          <p className="text-xl font-bold text-emerald-300 mt-0.5">{availableSlotsCount} / 8</p>
        </div>
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-center">
          <p className="text-[11px] text-rose-400 font-medium">Booked Slots</p>
          <p className="text-xl font-bold text-rose-300 mt-0.5">{bookedSlotsCount} / 8</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Hourly Schedule Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DAY_SLOTS.map((slot) => {
            const booking = findMatchingBooking(slot.start, slot.end);
            const isBooked = !!booking;

            return (
              <div
                key={slot.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isBooked
                    ? 'bg-rose-950/10 border-rose-900/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Time Slot Label */}
                <div className="flex items-center gap-4">
                  <div className="w-44 shrink-0">
                    <span className="text-sm font-semibold text-white font-mono">{slot.label}</span>
                  </div>

                  {/* Status Tag */}
                  {isBooked ? (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                      🔴 Booked
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      🟢 Available
                    </span>
                  )}
                </div>

                {/* Slot Details or Action */}
                {isBooked ? (
                  <div className="flex flex-col md:items-end text-xs space-y-0.5">
                    <p className="font-semibold text-slate-200">
                      Purpose: <span className="text-indigo-300">{booking.purpose}</span>
                    </p>
                    <p className="text-slate-400">
                      Booked by: {booking.user?.name || 'Faculty Member'} ({booking.branch || 'CSE'})
                    </p>
                    <span className="text-[10px] text-slate-500">
                      Actual Slot: {booking.startTime} - {booking.endTime} | 👥 {booking.expectedStudents || 0} Students
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 italic hidden md:inline">Slot is free for booking</span>
                    {onBookSlot && (
                      <button
                        onClick={() =>
                          onBookSlot({
                            labId,
                            date: selectedDate,
                            startTime: slot.start,
                            endTime: slot.end,
                          })
                        }
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
                      >
                        + Reserve Slot
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}