 

const cron = require('node-cron');
const Booking = require('../models/Booking');
const FacultyLabBooking = require('../models/Labbooking');
const Resource = require('../models/Resource');
const { getIO } = require('../socket');

// Helper: Safely normalize any date input to local "YYYY-MM-DD"
function formatDateStr(dateInput) {
  if (!dateInput) return '';
  
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return dateInput.split('T')[0].trim();
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput).split('T')[0].trim();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Parse slot end time safely into a valid JavaScript Date object
function getSlotEndTime(bookingDate, timeSlot) {
  try {
    const dateStr = formatDateStr(bookingDate);
    if (!dateStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);

    if (!timeSlot || typeof timeSlot !== 'string') {
      targetDate.setHours(23, 59, 59, 999);
      return targetDate;
    }

    const parts = timeSlot.split('-');
    const endPart = (parts.length > 1 ? parts[1] : parts[0]).trim();

    const timeMatch = endPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!timeMatch) {
      targetDate.setHours(23, 59, 59, 999);
      return targetDate;
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const modifier = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate;
  } catch (err) {
    return null;
  }
}

function initCronJobs() {
  // Runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const todayStr = formatDateStr(now);

      // ==========================================
      // 1. PROCESS GENERAL RESOURCE BOOKINGS
      // ==========================================
      const activeBookings = await Booking.find({
        status: { $in: ['Pending', 'pending', 'Approved', 'approved', 'Accepted', 'accepted'] },
      });

      if (activeBookings && activeBookings.length > 0) {
        for (const booking of activeBookings) {
          try {
            const bookingDateStr = formatDateStr(booking.bookingDate);
            const slotEndTime = getSlotEndTime(booking.bookingDate, booking.timeSlot);

            const isExpired =
              (slotEndTime && slotEndTime < now) ||
              (bookingDateStr && bookingDateStr < todayStr);

            if (isExpired) {
              booking.status = 'Completed';
              await booking.save();

              // Release slot count on the Resource
              if (booking.resource) {
                const resource = await Resource.findById(booking.resource);
                if (resource && Array.isArray(resource.slotBookings)) {
                  const slotData = resource.slotBookings.find(
                    (s) =>
                      formatDateStr(s.date) === bookingDateStr &&
                      String(s.timeSlot).trim() === String(booking.timeSlot).trim()
                  );

                  if (slotData) {
                    const releaseQty = booking.quantity || 1;
                    slotData.bookedCount = Math.max(0, slotData.bookedCount - releaseQty);
                    await resource.save();

                    const updatedAvailable = resource.totalQuantity - slotData.bookedCount;

                    try {
                      const io = getIO();
                      if (io) {
                        io.emit('slot_availability_updated', {
                          resourceId: resource._id,
                          date: bookingDateStr,
                          timeSlot: booking.timeSlot,
                          availableCount: updatedAvailable,
                        });
                      }
                    } catch (socketErr) {
                      console.error('Socket emit error (slot_availability_updated):', socketErr.message);
                    }
                  }
                }
              }

              // Emit status update to user room
              try {
                const io = getIO();
                if (io) {
                  const userIdStr = String(booking.user._id || booking.user);
                  io.to(`user_${userIdStr}`).emit('booking_status_changed', {
                    _id: booking._id,
                    status: 'Completed',
                    bookingDate: booking.bookingDate,
                    timeSlot: booking.timeSlot,
                  });
                }
              } catch (socketErr) {
                console.error('Socket emit error (booking_status_changed):', socketErr.message);
              }

              console.log(`⏰ [CRON] General Booking ${booking._id} marked as Completed.`);
            }
          } catch (bookingErr) {
            console.error(`Error updating general booking ${booking._id}:`, bookingErr);
          }
        }
      }

      // ==========================================
      // 2. PROCESS FACULTY LAB BOOKINGS
      // ==========================================
      const activeLabBookings = await FacultyLabBooking.find({
        status: { $in: ['Pending', 'pending', 'Approved', 'approved', 'Accepted', 'accepted'] },
      });

      if (activeLabBookings && activeLabBookings.length > 0) {
        for (const labBooking of activeLabBookings) {
          try {
            // Support either 'bookingDate' or 'date' field naming
            const dateVal = labBooking.bookingDate || labBooking.date;
            const bookingDateStr = formatDateStr(dateVal);
            const slotEndTime = getSlotEndTime(dateVal, labBooking.timeSlot);

            const isExpired =
              (slotEndTime && slotEndTime < now) ||
              (bookingDateStr && bookingDateStr < todayStr);

            if (isExpired) {
              labBooking.status = 'Completed';
              await labBooking.save();

              try {
                const io = getIO();
                if (io) {
                  const userIdStr = String(labBooking.user?._id || labBooking.user || labBooking.faculty?._id || labBooking.faculty);
                  if (userIdStr) {
                    io.to(`user_${userIdStr}`).emit('lab_booking_status_changed', {
                      _id: labBooking._id,
                      status: 'Completed',
                      date: dateVal,
                      timeSlot: labBooking.timeSlot,
                    });
                  }
                }
              } catch (socketErr) {
                console.error('Socket emit error (lab_booking_status_changed):', socketErr.message);
              }

              console.log(`⏰ [CRON] Faculty Lab Booking ${labBooking._id} marked as Completed.`);
            }
          } catch (labBookingErr) {
            console.error(`Error updating lab booking ${labBooking._id}:`, labBookingErr);
          }
        }
      }

    } catch (error) {
      console.error('Cron job top-level error:', error);
    }
  });

  console.log('🚀 Booking auto-completion cron job initialized.');
}

module.exports = { initCronJobs };