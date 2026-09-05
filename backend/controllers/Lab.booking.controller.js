const Booking = require('../models/Labbooking');
const Lab = require('../models/Lab');
const mongoose = require('mongoose');

// @desc    Check availability & create booking if slot is free
// @route   POST /api/bookings
// @access  Private (Faculty)
const createBooking = async (req, res) => {
  try {
    const { labId, date, branch, startTime, endTime, purpose, expectedStudents } = req.body;
    const userId = req.user._id;

    // 1. Validation
    if (!labId || !date || !branch || !startTime || !endTime || !purpose || !expectedStudents) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required.' 
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time must be strictly after start time.' 
      });
    }

    // 2. Check Slot Availability
    const existingBooking = await Booking.findOne({
      labId,
      date,
      status: { $nin: ['cancelled', 'CANCELLED', 'rejected', 'REJECTED'] },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        isAvailable: false,
        message: `Slot unavailable. Already booked from ${existingBooking.startTime} to ${existingBooking.endTime}.`,
        redirectUrl: `/faculty/schedule/${labId}`
      });
    }

    // 3. Create Booking
    const newBooking = await Booking.create({
      labId,
      user: userId,
      date,
      branch,
      startTime,
      endTime,
      purpose,
      expectedStudents: Number(expectedStudents)
    });

    // Populate user and lab details for live notifications
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('user', 'name email')
      .populate('labId', 'name location');

    // 4. Safe Real-Time Notification Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('lab_booked', {
        id: populatedBooking._id,
        labName: populatedBooking.labId?.name || 'Laboratory',
        location: populatedBooking.labId?.location || '',
        bookedBy: populatedBooking.user?.name || 'Faculty',
        branch: populatedBooking.branch,
        date: populatedBooking.date,
        startTime: populatedBooking.startTime,
        endTime: populatedBooking.endTime,
        purpose: populatedBooking.purpose,
        createdAt: populatedBooking.createdAt
      });
    }

   
    return res.status(201).json({
      success: true,
      isAvailable: true,
      message: 'Booking confirmed.',
      booking: populatedBooking
    });

  } catch (error) {
    console.error('Booking Creation Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error processing booking.' 
    });
  }
};

const checkAvailability = async (req, res) => {
  try {
    const { labId, date, startTime, endTime } = req.body;

    const existingBooking = await Booking.findOne({
      labId,
      date,
      status: { $nin: ['cancelled', 'CANCELLED', 'rejected', 'REJECTED'] },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });

    if (existingBooking) {
      return res.status(200).json({
        isAvailable: false,
        message: `Slot is occupied from ${existingBooking.startTime} to ${existingBooking.endTime}.`
      });
    }

    return res.status(200).json({
      isAvailable: true,
      message: 'Slot is available for booking.'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error checking slot availability.' });
  }
};

const getFacultyMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId })
      .populate('labId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error in getFacultyMyBookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your bookings.',
      error: error.message,
    });
  }
};

const getLabScheduleByDate = async (req, res) => {
  try {
    const { labId } = req.params;
    const { date } = req.query;

    if (!labId || labId === 'undefined' || !mongoose.Types.ObjectId.isValid(labId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing Lab ID provided.',
      });
    }

    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date parameter is required.' 
      });
    }

    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lab not found.' 
      });
    }

    const bookings = await Booking.find({
      labId,
      date,
      status: { $nin: ['cancelled', 'CANCELLED', 'rejected', 'REJECTED'] },
    }).populate('user', 'name email department');

    return res.status(200).json({
      success: true,
      lab,
      bookings,
    });
  } catch (error) {
    console.error('Error in getLabScheduleByDate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve lab schedule.',
      error: error.message,
    });
  }
};


const getFacultyRequests = async (req, res) => {
  try {
    const { status, department } = req.query;

    const filter = {};

    // 1. Only filter by status if provided and not 'ALL'
    // Uses case-insensitive regex so 'pending', 'PENDING', or 'Pending' all match
    if (status && status.toUpperCase() !== 'ALL') {
      filter.status = new RegExp(`^${status}$`, 'i');
    }

    // 2. Fetch bookings and populate references
    let requests = await Booking.find(filter)
      .populate('user', 'name email category role')
      .populate('labId', 'name labNumber department')
      .sort({ createdAt: -1 });

    // 3. Filter by user's department if department parameter exists and isn't on the Booking model directly
    if (department) {
      requests = requests.filter(
        (item) => item.user?.department?.toUpperCase() === department.toUpperCase()
      );
    }

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Error fetching faculty requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking requests.',
      error: error.message,
    });
  }
};

/**
 
 */
const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.user?._id || req.user?.id;

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('labId', 'name labNumber');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found.',
      });
    }

    if (booking.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Booking request is already approved.',
      });
    }

    // Update database status
    booking.status = 'approved';
    booking.approvedBy = adminId;
    booking.approvedAt = new Date();
    await booking.save();

    // Trigger real-time Socket.io notifications
    try {
      const io = getIO();
      const targetUserId = String(booking.user?._id || booking.user);
      const labIdStr = String(booking.labId?._id || booking.labId);

      const notificationPayload = {
        _id: booking._id,
        bookingId: booking._id,
        title: 'Booking Approved',
        message: `Your booking request for ${booking.labId?.name || 'the lab'} on ${booking.date || 'your requested slot'} has been approved.`,
        type: 'STATUS_CHANGE',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
      };

      // 1. Notify the user across all ID room aliases
      io.to(`user_${targetUserId}`)
        .to(targetUserId)
        .emit('BOOKING_STATUS_UPDATED', notificationPayload);

      io.to(`user_${targetUserId}`)
        .to(targetUserId)
        .emit('booking_status_changed', notificationPayload);

      // 2. Broadcast slot availability changes to active resource rooms
      if (labIdStr) {
        io.to(`resource_${labIdStr}`).emit('slotUpdated', {
          labId: labIdStr,
          slotId: booking.slotId,
          date: booking.date,
          status: 'APPROVED',
        });
      }
    } catch (socketError) {
      console.error('Socket emission failed:', socketError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking request approved successfully.',
      booking,
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve booking request.',
      error: error.message,
    });
  }
};
module.exports = { 
  createBooking, 
  checkAvailability, 
  getFacultyMyBookings, 
  getLabScheduleByDate ,
approveBooking ,
  getFacultyRequests
};