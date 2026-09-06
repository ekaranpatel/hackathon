import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BACKEND_URL } from './Api';
import { toast } from 'react-toastify';

const QUICK_PURPOSES = [
  'Academic Project',
  'Lab Practical / Experiment',
  'Personal Research',
  'Workshop / Competition',
];

const FIXED_TIME_SLOTS = [
  { id: 'slot-1', label: '09:00 AM - 10:00 AM', startHour: 9 },
  { id: 'slot-2', label: '10:00 AM - 11:00 AM', startHour: 10 },
  { id: 'slot-3', label: '11:00 AM - 12:00 PM', startHour: 11 },
  { id: 'slot-4', label: '12:00 PM - 01:00 PM', startHour: 12 },
  { id: 'slot-5', label: '01:00 PM - 02:00 PM', startHour: 13 },
  { id: 'slot-6', label: '02:00 PM - 03:00 PM', startHour: 14 },
  { id: 'slot-7', label: '03:00 PM - 04:00 PM', startHour: 15 },
  { id: 'slot-8', label: '04:00 PM - 05:00 PM', startHour: 16 },
];

const extractLabFromResource = (resObj) => {
  if (!resObj) return null;

  if (resObj.labId && typeof resObj.labId === 'object') return resObj.labId;
  if (resObj.lab && typeof resObj.lab === 'object') return resObj.lab;
  
  if (Array.isArray(resObj.assignedLabs) && resObj.assignedLabs.length > 0) {
    const labItem = resObj.assignedLabs[0];
    if (typeof labItem === 'object') {
      return labItem.labId && typeof labItem.labId === 'object' ? labItem.labId : labItem;
    }
  }

  if (resObj.labAddress || resObj.labName || resObj.address) {
    return {
      name: resObj.labName || resObj.labFacility || resObj.lab_name,
      address: resObj.labAddress || resObj.address,
      roomNumber: resObj.roomNumber || resObj.location?.roomNumber,
      floor: resObj.floor || resObj.location?.floor,
    };
  }

  return null;
};

export default function ResourceDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const stateData = location.state || {};
  const passedResource = stateData.resource || stateData.item || null;
  const initialDate = stateData.selectedDate || '';
  const initialSlot = stateData.selectedSlot || '';

  const targetResourceId = id || passedResource?._id || passedResource?.id;

  const [resource, setResource] = useState(passedResource);
  const [labDetails, setLabDetails] = useState(() => extractLabFromResource(passedResource));
  const [isLoading, setIsLoading] = useState(!passedResource);
  const [fetchError, setFetchError] = useState('');
  const [availableCount, setAvailableCount] = useState(null);
  const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [purpose, setPurpose] = useState('');

  const [currentDate, setCurrentDate] = useState(
    initialDate && initialDate !== 'Not Selected' ? initialDate : ''
  );

  const resolveSlot = (slotValue) => {
    if (!slotValue || slotValue === 'Not Selected') return '';
    if (typeof slotValue === 'object') return slotValue;
    
    const foundSlot = FIXED_TIME_SLOTS.find(
      (s) => s.label === slotValue || s.id === slotValue
    );
    return foundSlot || { id: 'slot-1', label: slotValue, startHour: 9 };
  };

  const [currentSlot, setCurrentSlot] = useState(() => resolveSlot(initialSlot));
  const [isEditingSlot, setIsEditingSlot] = useState(!currentDate || !currentSlot);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({ type: null, message: '' });

  // Sync state when location state changes dynamically
  useEffect(() => {
    if (passedResource) {
      setResource(passedResource);
      setLabDetails(extractLabFromResource(passedResource));
    }
    if (stateData.selectedDate && stateData.selectedDate !== 'Not Selected') {
      setCurrentDate(stateData.selectedDate);
    }
    if (stateData.selectedSlot && stateData.selectedSlot !== 'Not Selected') {
      const resolved = resolveSlot(stateData.selectedSlot);
      setCurrentSlot(resolved);
      setIsEditingSlot(false);
    }
  }, [location.state]);

  // Fetch full resource details from Backend
  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      if (!targetResourceId) return;
      try {
        if (!resource) setIsLoading(true);
        setFetchError('');

        const token = localStorage.getItem('labToken') || localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/resources/${targetResourceId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch resource details (${response.status})`);
        }

        const data = await response.json();
        const resData = data.data || data.resource || data;

        if (isMounted && resData) {
          setResource(resData);
          setLabDetails(extractLabFromResource(resData));
        }
      } catch (error) {
        if (isMounted) setFetchError(error.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [targetResourceId]);

  const {
    name = resource?.title || resource?.name || 'Resource Name',
    category = resource?.category || 'Equipment',
    imageUrl = resource?.image || resource?.imageUrl || resource?.imgUrl || '',
    status = resource?.status || 'Available',
    specifications = resource?.specifications || resource?.specs || resource?.hardwareSpecs || [],
    safetyInstructions = resource?.safetyInstructions || resource?.rules || resource?.instructions || '',
    description = resource?.description || resource?.details || '',
    totalQuantity = resource?.quantity || resource?.totalQuantity || 0,
  } = resource || {};

  const primaryAssignedLab = resource?.assignedLabs?.[0];
  const labAssignedQuantity =
    primaryAssignedLab?.assignedQuantity ??
    primaryAssignedLab?.quantity ??
    resource?.assignedQuantity ??
    totalQuantity ??
    0;

  const slotObj =
    typeof currentSlot === 'object'
      ? currentSlot
      : FIXED_TIME_SLOTS.find((s) => s.label === currentSlot) || {
          id: 'slot-1',
          label: currentSlot,
          startHour: 9,
        };

  const activeSlotId = slotObj.id || '';
  const activeSlotLabel = slotObj.label || (typeof currentSlot === 'string' ? currentSlot : '');

  // Slot availability check
  useEffect(() => {
    let isMounted = true;

    const checkAvailability = async () => {
      if (!targetResourceId || !currentDate || !activeSlotLabel) return;

      try {
        setIsCheckingAvailability(true);
        const token = localStorage.getItem('labToken') || localStorage.getItem('token');
        const storedUser = JSON.parse(
          localStorage.getItem('labUser') || localStorage.getItem('user') || '{}'
        );
        const userId = storedUser._id || storedUser.id || '';

        const queryParams = new URLSearchParams({
          date: currentDate,
          timeSlot: activeSlotLabel,
          slotId: activeSlotId || '',
          userId: userId,
        }).toString();

        const response = await fetch(
          `${BACKEND_URL}/bookings/availability/${targetResourceId}?${queryParams}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
          }
        );

        if (response.ok && isMounted) {
          const data = await response.json();
          const backendAvailable = data.availableCount ?? data.remaining ?? null;
          const finalCount =
            backendAvailable !== null
              ? Math.min(backendAvailable, labAssignedQuantity)
              : Math.max(0, labAssignedQuantity - (data.bookedCount || 0));

          setAvailableCount(finalCount);
          setIsAlreadyBooked(!!data.isBookedBySelf);
        }
      } catch (error) {
        console.error('Error fetching slot availability:', error);
      } finally {
        if (isMounted) setIsCheckingAvailability(false);
      }
    };

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, [currentDate, activeSlotId, activeSlotLabel, targetResourceId, labAssignedQuantity]);

  const handleConfirmBooking = async () => {
    if (!currentDate || !currentSlot) {
      const msg = 'Please select both a date and a time slot.';
      setBookingStatus({ type: 'error', message: msg });
      toast.error(msg);
      return;
    }

    if (!purpose.trim()) {
      const msg = 'Please enter the purpose of your booking.';
      setBookingStatus({ type: 'error', message: msg });
      toast.error(msg);
      return;
    }

    if (availableCount === 0) {
      const msg = 'This slot is fully booked for this lab. Please select another slot.';
      setBookingStatus({ type: 'error', message: msg });
      toast.error(msg);
      return;
    }

    try {
      setIsSubmitting(true);
      setBookingStatus({ type: null, message: '' });

      const token = localStorage.getItem('labToken') || localStorage.getItem('token');
      const storedUser = JSON.parse(
        localStorage.getItem('labUser') || localStorage.getItem('user') || '{}'
      );
      const userId = storedUser._id || storedUser.id || null;

      const response = await fetch(`${BACKEND_URL}/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          user: userId,
          resourceId: targetResourceId,
          labId: labDetails?._id || primaryAssignedLab?.labId?._id || primaryAssignedLab?.labId,
          dateISO: currentDate,
          slotId: slotObj.id,
          label: slotObj.label || slotObj,
          startHour: slotObj.startHour || 9,
          purpose: purpose.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || 'Booking failed. Please try again.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      toast.success('Booking confirmed successfully!');
      setBookingStatus({
        type: 'success',
        message: 'Booking successful! Redirecting to your bookings...',
      });

      setTimeout(() => {
        navigate('/my-bookings');
      }, 1200);
    } catch (err) {
      setBookingStatus({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawLab = labDetails || resource?.labId || resource?.lab || {};

  const labName =
    rawLab?.name ||
    rawLab?.labName ||
    rawLab?.labId?.name ||
    resource?.labName ||
    resource?.labFacility ||
    resource?.lab_name ||
    'Laboratory Facility';

  const labRoomNumber =
    rawLab?.roomNumber ||
    rawLab?.room_number ||
    rawLab?.room ||
    rawLab?.location?.roomNumber ||
    resource?.roomNumber ||
    'Room N/A';

  const labLocation =
    rawLab?.location ||
    rawLab?.address ||
    resource?.labAddress ||
    'Location Details N/A';

  const labContact =
    rawLab?.contactEmail ||
    rawLab?.phone ||
    rawLab?.inchargePhone ||
    rawLab?.contact ||
    resource?.labContact ||
    '';

  const getUpcomingDays = () => {
    const days = [];
    const today = new Date();

    const formatISO = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (let i = 0; i <= 1; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);

      const formattedISO = formatISO(nextDate);
      const dayLabel =
        i === 0
          ? 'Today'
          : nextDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

      days.push({ dateISO: formattedISO, label: dayLabel });
    }
    return days;
  };

  const availableDays = getUpcomingDays();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-3 rounded-lg text-xs font-medium text-slate-300">
          <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Loading resource details...
        </div>
      </div>
    );
  }

  const isButtonDisabled =
    isSubmitting ||
    isCheckingAvailability ||
    !currentDate ||
    !currentSlot ||
    availableCount === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
        >
          ← Back to Resources
        </button>

        {fetchError && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-700 text-rose-300 text-xs font-medium">
            ⚠️ {fetchError}
          </div>
        )}

        {bookingStatus.message && (
          <div
            className={`p-4 rounded-lg border text-sm font-medium transition-all ${
              bookingStatus.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-lg shadow-emerald-950/50'
                : 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-lg shadow-rose-950/50'
            }`}
          >
            {bookingStatus.type === 'success' ? '✅ ' : '⚠️ '}
            {bookingStatus.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              {imageUrl && (
                <div className="h-56 w-full overflow-hidden relative">
                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold tracking-wider text-indigo-300 uppercase bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded">
                    {category}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      status?.toLowerCase() === 'available'
                        ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
                        : 'bg-amber-950/80 border-amber-700 text-amber-400'
                    }`}
                  >
                    ● {status}
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-slate-100">{name}</h1>

                {description && (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {description}
                  </p>
                )}

                {Array.isArray(specifications) && specifications.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      ⚙️ Hardware / Technical Specifications
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                      {specifications.map((spec, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800/60"
                        >
                          <span className="text-indigo-400">•</span> {spec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    📍 Exact Lab & Campus Address
                  </h3>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-400 text-sm">🏛️ {labName}</span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Lab Assigned Stock: <strong className="text-emerald-400">{labAssignedQuantity} units</strong>
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 text-slate-300">
                      <p>
                        <span className="text-slate-500 font-medium">Full Lab Address:</span>{' '}
                        {typeof labLocation === 'object' ? `${labLocation.building || ''} ${labLocation.street || ''}` : labLocation}
                      </p>
                      {labContact && (
                        <p>
                          <span className="text-slate-500 font-medium">Lab Contact / Help:</span>{' '}
                          {labContact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {safetyInstructions && (
                  <div className="mt-4 p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-300/90 leading-relaxed">
                    ⚠️ <strong className="font-semibold">Lab Protocol:</strong>{' '}
                    {safetyInstructions}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  🗓️ Booking Schedule
                </h2>
                {currentDate && currentSlot && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSlot(!isEditingSlot)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                  >
                    {isEditingSlot ? 'Done Editing' : '✏️ Change Date or Slot'}
                  </button>
                )}
              </div>

              {!isEditingSlot ? (
                <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-lg p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400">Selected Schedule</p>
                    <p className="text-sm font-bold text-indigo-300 mt-0.5">
                      {currentDate} &nbsp;•&nbsp; {activeSlotLabel}
                    </p>
                    {isCheckingAvailability ? (
                      <p className="text-xs text-indigo-400 mt-1 animate-pulse">Checking availability...</p>
                    ) : availableCount !== null ? (
                      <p className={`text-xs font-semibold mt-1 ${availableCount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {availableCount > 0
                          ? `Lab Available Units: ${availableCount} / ${labAssignedQuantity}`
                          : 'Fully Booked for this Slot'}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => setIsEditingSlot(true)}
                    className="text-xs bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 px-3 py-1 rounded border border-indigo-700/60 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      1. Select Date
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {availableDays.map((day) => {
                        const isSelected = currentDate === day.dateISO;
                        return (
                          <button
                            key={day.dateISO}
                            type="button"
                            onClick={() => {
                              setCurrentDate(day.dateISO);
                              setAvailableCount(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap font-medium transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      2. Select 1-Hour Time Slot
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FIXED_TIME_SLOTS.map((slot) => {
                        const isSelected =
                          activeSlotLabel === slot.label ||
                          (typeof currentSlot === 'object' && currentSlot?.id === slot.id);

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              setCurrentSlot(slot);
                              setIsEditingSlot(false);
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'bg-indigo-950/90 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <p className="text-xs font-medium">{slot.label}</p>
                            <p className="text-[10px] mt-0.5 font-semibold text-emerald-400">
                              {isSelected
                                ? isCheckingAvailability
                                  ? 'Checking...'
                                  : availableCount !== null
                                  ? `${availableCount}/${labAssignedQuantity} Available`
                                  : 'Selected'
                                : 'Select'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {currentDate && currentSlot && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSlot(false)}
                      className="w-full py-2 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold rounded-lg transition-colors mt-2"
                    >
                      Save Schedule Selection
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-2">
                📝 Purpose of Booking <span className="text-rose-400">*</span>
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Specify why you are requesting this equipment.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_PURPOSES.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setPurpose(tag)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                      purpose === tag
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-medium'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Practicals or Major Project work..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl sticky top-6">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
                🗓️ Selected Slot Summary
              </h2>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-1">Booking Date</span>
                  <div className="text-sm font-bold text-indigo-300">
                    {currentDate || 'Not Selected'}
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-1">Time Slot</span>
                  <div className="text-sm font-bold text-indigo-300">
                    {activeSlotLabel || 'Not Selected'}
                  </div>
                  {isCheckingAvailability ? (
                    <div className="text-xs text-indigo-400 mt-1 animate-pulse">
                      Updating availability...
                    </div>
                  ) : availableCount !== null ? (
                    <div className={`text-xs font-semibold mt-1 ${availableCount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Available: {availableCount} / {labAssignedQuantity} units
                    </div>
                  ) : null}
                </div>

                {purpose.trim() && (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 block text-[11px] mb-1">Purpose</span>
                    <div className="text-xs text-slate-200 truncate">{purpose}</div>
                  </div>
                )}

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 leading-relaxed text-[11px]">
                  📌 Arrive on time at{' '}
                  <strong className="text-slate-200">
                    {labName} ({labRoomNumber})
                  </strong>{' '}
                  with your Student ID card.
                </div>

                <button
                  onClick={handleConfirmBooking}
                  disabled={isButtonDisabled}
                  className={`w-full py-3 px-4 text-xs font-bold rounded-lg transition-all shadow-md ${
                    isButtonDisabled
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50'
                  }`}
                >
                  {isSubmitting
                    ? 'Confirming Booking...'
                    : isCheckingAvailability
                    ? 'Checking Availability...'
                    : availableCount === 0
                    ? 'Slot Fully Booked'
                    : 'Confirm & Book Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}