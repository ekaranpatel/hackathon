// controllers/facultyBookingController.js
const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const Lab = require('../models/Lab');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

exports.getFacultyPendingBookings = async (req, res) => {
  try {
    const facultyCategory = req.user?.category || req.user?.department;
    const userRole = req.user?.role;

    let bookingQuery = {
      status: { $regex: /^pending$/i }
    };

    if (userRole !== 'Admin') {
      if (!facultyCategory) {
        return res.status(400).json({
          success: false,
          message: 'User account is missing a category assignment.'
        });
      }

      const cleanCategory = facultyCategory.trim().replace(/\s+/g, '\\s*');
      const categoryLabs = await Lab.find({
        category: { $regex: new RegExp(`^${cleanCategory}$`, 'i') }
      }).select('_id');

      const labIds = categoryLabs.map((lab) => lab._id);

      if (labIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          bookings: [],
          message: `No labs found for category: ${facultyCategory}`
        });
      }

      bookingQuery.lab = { $in: labIds };
    }

    const pendingBookings = await Booking.find(bookingQuery)
      .populate('user', 'name email rollNumber category')
      .populate('resource', 'name category availableQuantity status')
      .populate('lab', 'name category capacity location status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: pendingBookings.length,
      bookings: pendingBookings,
    });
  } catch (error) {
    console.error('Error fetching faculty bookings:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Accept or Reject a student booking request
 */
exports.respondToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'Approved' | 'Rejected'
    const facultyId = req.user._id || req.user.id;
    const facultyCategory = req.user?.category || req.user?.department;

    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action parameter.' });
    }

    const booking = await Booking.findById(bookingId).populate('resource').populate('lab');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.status}.` });
    }

    // Category Authorization Check (Admin bypasses this)
    if (req.user?.role !== 'Admin') {
      const labCategory = booking.lab?.category;
      if (!facultyCategory || !labCategory || labCategory.trim().toLowerCase() !== facultyCategory.trim().toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only respond to bookings in your assigned lab category.',
        });
      }
    }

    // Process Approval
    if (action === 'Approved') {
      const resource = await Resource.findById(booking.resource?._id || booking.resource);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Associated resource not found.' });
      }

      const bookingDate = booking.bookingDate || booking.date;
      const timeSlot = booking.timeSlot;
      const requestedQty = Number(booking.quantity) || 1;
      const totalStock = Number(resource.totalQuantity) || 0;

      // Find all already approved bookings for this resource on the exact same date & time slot
      const conflictingBookings = await Booking.find({
        resource: resource._id,
        status: 'Approved',
        _id: { $ne: booking._id },
        $or: [
          { bookingDate: bookingDate },
          { date: bookingDate }
        ],
        timeSlot: timeSlot
      });

      const alreadyBookedQty = conflictingBookings.reduce((sum, b) => sum + (Number(b.quantity) || 1), 0);

      // Time Slot Stock Validation
      if ((alreadyBookedQty + requestedQty) > totalStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient resource quantity available for this time slot. Total Stock: ${totalStock}, Already Booked: ${alreadyBookedQty}, Requested: ${requestedQty}.`,
        });
      }

      booking.status = 'Approved';
      booking.approvedBy = facultyId;
    } 
    // Process Rejection
    else if (action === 'Rejected') {
      booking.status = 'Rejected';
      booking.reviewedBy = facultyId;
      booking.rejectionReason = rejectionReason || 'Request rejected by lab faculty.';
    }

    await booking.save();

    // Re-populate for response payload and notifications
    const updatedBooking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('resource', 'name')
      .populate('lab', 'name category');

    const studentId = updatedBooking.user?._id || updatedBooking.user;
    const resourceName = updatedBooking.resource?.name || 'Resource';

    let createdNotification = null;

    // 1. Map action to your Notification schema's allowed enum values
    const notificationType = action === 'Approved' ? 'BOOKING_SUCCESS' : 'BOOKING_CANCELED';
    const notificationMessage = action === 'Approved'
      ? `Your booking request for "${resourceName}" has been approved.`
      : `Your booking request for "${resourceName}" was rejected. Reason: ${booking.rejectionReason}`;

    // 2. CREATE & SAVE NOTIFICATION (Safely guarded against missing user references)
    if (studentId) {
      try {
        createdNotification = await Notification.create({
          recipient: studentId,
          title: `Booking ${action}`,
          message: notificationMessage,
          type: notificationType,
          bookingId: booking._id,
          read: false
        });

        // 3. REAL-TIME SOCKET BROADCASTS
        const io = getIO();
        if (io) {
          const payload = {
            _id: createdNotification._id,
            bookingId: booking._id,
            title: createdNotification.title,
            message: createdNotification.message,
            type: createdNotification.type,
            status: booking.status,
            resourceName: resourceName,
            rejectionReason: booking.rejectionReason,
            read: false,
            createdAt: createdNotification.createdAt
          };

          const roomStr = String(studentId);
          io.to(roomStr).to(`user_${roomStr}`).emit('BOOKING_STATUS_UPDATED', payload);
          io.to(roomStr).to(`user_${roomStr}`).emit('notification_received', payload);
        }
      } catch (notifErr) {
        console.error('Non-fatal notification creation error:', notifErr.message);
      }
    } else {
      console.warn(`⚠️ Warning: Student ID missing for booking ${booking._id}. Skipping notification generation.`);
    }

    // Broadcast to faculty category room to sync UI
    const categoryName = updatedBooking.lab?.category || facultyCategory;
    const ioInstance = getIO();
    if (categoryName && ioInstance) {
      const categoryRoom = `category_${categoryName.trim().toUpperCase()}`;
      ioInstance.to(categoryRoom).emit('FACULTY_BOOKING_PROCESSED', {
        bookingId: booking._id,
        status: booking.status,
        actionBy: req.user?.name,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Booking successfully ${action.toLowerCase()}.`,
      booking: updatedBooking,
      notification: createdNotification,
    });
  } catch (error) {
    console.error('Error processing booking decision:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getApprovedBookings = async (req, res) => {
  try {
    const { date, search } = req.query;

    let query = {
      status: { $in: ['Approved', 'approved', 'Accepted', 'accepted'] },
    };

    if (date) {
      query.$or = [{ bookingDate: date }, { dateISO: date }, { date: date }];
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email department rollNumber studentId')
      .populate('resource', 'name location category code')
      .sort({ bookingDate: 1, createdAt: -1 });

    let filteredBookings = bookings;
    if (search) {
      const term = search.toLowerCase();
      filteredBookings = bookings.filter((b) => {
        const studentName = b.user?.name?.toLowerCase() || '';
        const resourceName = (b.resource?.name || b.resourceName || '').toLowerCase();
        const purpose = (b.purpose || '').toLowerCase();
        return studentName.includes(term) || resourceName.includes(term) || purpose.includes(term);
      });
    }

    return res.status(200).json({
      success: true,
      count: filteredBookings.length,
      bookings: filteredBookings,
    });
  } catch (error) {
    console.error('Error fetching approved bookings for faculty:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve approved bookings',
      error: error.message,
    });
  }
};