import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  User, 
  FlaskConical, 
  AlertCircle,
  Loader2,
  Check,
  GraduationCap
} from 'lucide-react';
import { BACKEND_URL } from '../../student/pages/Api';

// Available time options strictly between 09:00 AM and 05:00 PM
const TIME_OPTIONS = [
  { label: '09:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '11:00 AM', value: '11:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '01:00 PM', value: '13:00' },
  { label: '02:00 PM', value: '14:00' },
  { label: '03:00 PM', value: '15:00' },
  { label: '04:00 PM', value: '16:00' },
  { label: '05:00 PM', value: '17:00' },
];

export default function LabBookingDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const labId = params.labId || params.id;

  // Lab Data State
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(today);
  const [branch, setBranch] = useState(''); // Manual text input
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [purpose, setPurpose] = useState('');
  const [expectedStudents, setExpectedStudents] = useState(30);

  // Dynamic calculation for initial times on page load
  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour < 16) {
      const pad = (num) => String(num).padStart(2, '0');
      const start = `${pad(currentHour)}:00`;
      const end = `${pad(Math.min(currentHour + 2, 17))}:00`;
      setStartTime(start);
      setEndTime(end);
    } else {
      setStartTime('09:00');
      setEndTime('11:00');
    }
  }, []);

  // Fetch Lab Details from Backend
  useEffect(() => {
    const fetchLabDetails = async () => {
      if (!labId) {
        setError('No valid Lab ID found in URL parameters.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/labs/${labId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const retrievedLab = 
          response.data?.lab || 
          response.data?.data || 
          (typeof response.data === 'object' && !Array.isArray(response.data) ? response.data : null);

        if (!retrievedLab) {
          setError('Laboratory not found or returned empty data.');
        } else {
          setLab(retrievedLab);
        }
      } catch (err) {
        console.error('Failed to load lab detail:', err);
        setError(err.response?.data?.message || 'Failed to fetch laboratory details.');
      } finally {
        setLoading(false);
      }
    };

    fetchLabDetails();
  }, [labId]);

  // Calculate Duration string
  const getDuration = () => {
    if (!startTime || !endTime) return '';
    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);

    const diffMinutes = (endH - startH) * 60;
    if (diffMinutes <= 0) return 'End time must be after start time';

    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  };

  // Filter start/end options dynamically
  const startOptions = TIME_OPTIONS.filter((t) => t.value !== '17:00');
  const endOptions = TIME_OPTIONS.filter((t) => {
    const [startH] = startTime.split(':').map(Number);
    const [optionH] = t.value.split(':').map(Number);
    return optionH > startH;
  });

  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart);
    const [startH] = newStart.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);

    if (endH <= startH) {
      const pad = (num) => String(num).padStart(2, '0');
      setEndTime(`${pad(Math.min(startH + 1, 17))}:00`);
    }
  };

  // Submit Booking Request
  const handleSubmitBooking = async (e) => {
  e.preventDefault();
  
  const [startH] = startTime.split(':').map(Number);
  const [endH] = endTime.split(':').map(Number);

  if (endH <= startH) {
    setError('End time must be after start time.');
    return;
  }

  try {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    const token = localStorage.getItem('token');

    // API Call: Check Availability & Book atomically
    const response = await axios.post(
      `${BACKEND_URL}/lab-booking/create`,
      {
        labId,
        date: bookingDate,
        branch,
        startTime,
        endTime,
        purpose,
        expectedStudents: Number(expectedStudents)
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Slot Available & Confirmed
    if (response.data.success && response.data.isAvailable) {
      setSuccessMsg('Slot is available! Booking successfully confirmed.');
      setTimeout(() => navigate('/faculty/my-booking'), 1500);
    }

  } catch (err) {
    console.error('Booking Error:', err);

    // Handle Slot Unavailable Case (HTTP 409 Conflict)
    if (err.response?.status === 409 || err.response?.data?.isAvailable === false) {
      const redirectPath = err.response.data.redirectUrl || `/faculty/schedule/${labId}`;
      
      setError(`${err.response.data.message} Redirecting to Lab Schedule...`);
      
      // Redirect after 2 seconds so faculty can read the error message
      setTimeout(() => {
        navigate('/faculty/calendar');
      }, 2000);
    } else {
      setError(err.response?.data?.message || 'Failed to submit booking request.');
    }
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-indigo-400 gap-2.5">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm text-gray-400">Loading lab details...</span>
      </div>
    );
  }

  const facilitiesList = lab?.facilities || [
    '40 Workstations',
    'Projector',
    'Air Conditioning',
    'High Speed Internet',
    'Power Backup',
    'Electronics Equipment'
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-4 md:p-7 font-sans">
      <div className="max-w-3xl mx-auto space-y-5">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white bg-[#121827] px-3 py-2 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            Back to Labs
          </button>

          <div className="flex items-center gap-2 bg-[#121827] border border-gray-800 px-3 py-1.5 rounded-lg text-xs text-gray-300">
            <User className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">Faculty Workspace</span>
          </div>
        </div>

        {/* Lab Info Card */}
        <div className="bg-[#121827] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <FlaskConical className="w-5 h-5" />
              <h1 className="text-xl font-bold text-white">{lab?.name || 'Lab Details'}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-3.5 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {lab?.location || 'Block A • Room 204'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Capacity: <strong className="text-gray-200">{lab?.capacity || 40} Students</strong>
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed border-t border-gray-800 pt-3">
            {lab?.description || 'Well-equipped laboratory suitable for technical practicals, embedded systems testing, software execution, and student workshops.'}
          </p>

          {/* Facilities Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {facilitiesList.map((facility, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-300 bg-[#182035]/60 px-2.5 py-1.5 rounded-lg border border-gray-800/80">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{facility}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-rose-900/20 border border-rose-500/40 text-rose-300 p-3.5 rounded-xl flex items-center gap-2.5 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-900/20 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Booking Form Card */}
        <form onSubmit={handleSubmitBooking} className="bg-[#121827] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">Book This Lab</h2>
          </div>

          {/* Row 1: Date, Manual Branch Text Input & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Select Date</label>
              <input
                type="date"
                value={bookingDate}
                min={today}
                onChange={(e) => setBookingDate(e.target.value)}
                required
                className="w-full bg-[#182035] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Branch</label>
              <input
                type="text"
                placeholder="e.g. CSE-A, IT, ECE"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className="w-full bg-[#182035] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Expected Students</label>
              <input
                type="number"
                min="1"
                max={lab?.capacity || 100}
                value={expectedStudents}
                onChange={(e) => setExpectedStudents(e.target.value)}
                required
                className="w-full bg-[#182035] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Select Time Dropdowns */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-gray-300">Select Time (09:00 AM – 05:00 PM)</label>
              {getDuration() && (
                <span className={`text-xs flex items-center gap-1 font-medium ${getDuration().includes('hr') ? 'text-indigo-400' : 'text-rose-400'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  Duration: {getDuration()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-gray-400 mb-1 block">Start Time</span>
                <select
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full bg-[#182035] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {startOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 mb-1 block">End Time</span>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#182035] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {endOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Purpose */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Purpose</label>
            <input
              type="text"
              placeholder="e.g. Lab Session / Project Examination / Workshop"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full bg-[#182035] border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              'Check Availability & Book'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}