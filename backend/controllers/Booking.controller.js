const Booking = require('../models/Booking');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// 1. GET SLOT AVAILABILITY
exports.getSlotAvailability = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { date, timeSlot, userId } = req.query;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const totalCapacity = Number(
      resource.totalQuantity ?? resource.quantity ?? resource.capacity ?? 1
    );

    const existingBookings = await Booking.countDocuments({
      resource: resourceId,
      bookingDate: date,
      timeSlot: timeSlot,
      status: { $in: ['Pending', 'Approved'] }
    });

    let isBookedBySelf = false;
    if (userId) {
      const selfBooking = await Booking.findOne({
        user: userId,
        resource: resourceId,
        bookingDate: date,
        timeSlot: timeSlot,
        status: { $in: ['Pending', 'Approved'] }
      });
      if (selfBooking) {
        isBookedBySelf = true;
      }
    }

    const availableCount = Math.max(0, totalCapacity - existingBookings);

    return res.json({
      availableCount,
      totalCapacity,
      existingBookings,
      isBookedBySelf
    });
  } catch (error) {
    console.error("Error in getSlotAvailability:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 2. CREATE BOOKING (Status: Pending)
// 2. CREATE BOOKING (Status: Pending)
exports.createBooking = async (req, res) => {
  try {
    // 1. Extract body fields with safe fallbacks for variations in frontend keys
    const {
      resourceId,
      labId,
      dateISO: inputDateISO,
      date: inputDate,
      slotId,
      label: inputLabel,
      slot,
      startHour: inputStartHour,
      purpose,
    } = req.body;

    const userId = req.user?.id || req.user?._id || req.body.user;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required.' });
    }

    // Normalize date, slot label, and start hour values
    const dateISO = inputDateISO || inputDate || new Date().toISOString().split('T')[0];
    const rawLabel = inputLabel || slot || '';

    let numericStartHour = Number(inputStartHour);
    if (isNaN(numericStartHour) && rawLabel) {
      numericStartHour = parseInt(rawLabel, 10);
    }
    if (isNaN(numericStartHour)) {
      numericStartHour = 0;
    }

    const slotLabel = rawLabel || `${numericStartHour}:00`;

    // 2. Fetch target resource
    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const selectedLabId = labId || resource.assignedLabs?.[0]?.labId || resource.lab || null;

    if (!selectedLabId) {
      return res.status(400).json({ message: 'No lab associated with this resource.' });
    }

    // 🔒 3. USER DUPLICATE BOOKING CHECK
    const existingUserBooking = await Booking.findOne({
      user: userId,
      resource: resourceId,
      bookingDate: dateISO,
      timeSlot: slotLabel,
      status: { $nin: ['Cancelled', 'Rejected'] },
    });

    if (existingUserBooking) {
      return res.status(400).json({
        message: 'You have already submitted a booking for this time slot.',
      });
    }

    // 4. Resource slot bookability rule check
    if (typeof resource.isSlotBookable === 'function') {
      const validation = resource.isSlotBookable(dateISO, numericStartHour, selectedLabId);
      if (!validation.bookable) {
        return res.status(400).json({ message: validation.reason || 'Slot not bookable.' });
      }
    }

    // 5. Overall resource slot capacity check across all users
    const existingSlot = (resource.slotBookings || []).find(
      (s) => s.dateISO === dateISO && Number(s.startHour) === numericStartHour
    );

    if (existingSlot) {
      if (existingSlot.bookedCount >= resource.totalQuantity) {
        return res.status(400).json({ message: 'This slot is already fully booked.' });
      }

      await Resource.updateOne(
        {
          _id: resourceId,
          'slotBookings.dateISO': dateISO,
          'slotBookings.startHour': numericStartHour,
        },
        { $inc: { 'slotBookings.$.bookedCount': 1 } }
      );
    } else {
      await Resource.updateOne(
        { _id: resourceId },
        {
          $push: {
            slotBookings: {
              slotId: slotId || `slot-${numericStartHour}`,
              label: slotLabel,
              timeSlot: slotLabel,
              startHour: numericStartHour,
              dateISO,
              date: dateISO,
              bookedCount: 1,
            },
          },
        }
      );
    }

    // Fetch updated resource with latest slotBookings count
    const freshResource = await Resource.findById(resourceId);

    // 6. Create active booking record
    const booking = await Booking.create({
      user: userId,
      resource: resourceId,
      lab: selectedLabId,
      bookingDate: dateISO,
      timeSlot: slotLabel,
      purpose: purpose || '',
      quantity: 1,
      status: 'Pending',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('resource', 'name category imageUrl department')
      .populate('lab', 'name location department floor roomNumber category')
      .populate('user', 'name email rollNumber department');

    const studentName = populatedBooking.user?.name || 'A student';
    const resourceName = populatedBooking.resource?.name || 'Resource';

    // 7. Create Student Notification Document
    const studentNotif = await Notification.create({
      recipient: userId,
      title: 'Booking Placed',
      message: `Your booking for "${resourceName}" on ${dateISO} (${populatedBooking.timeSlot}) has been placed and is pending approval.`,
      type: 'BOOKING_PLACED',
      bookingId: booking._id,
    });

    // 8. Find Assigned Faculty & Save Faculty Notifications to MongoDB
    const targetDept =
      populatedBooking.lab?.department ||
      populatedBooking.lab?.category ||
      populatedBooking.resource?.department ||
      populatedBooking.resource?.category ||
      populatedBooking.user?.department ||
      'GENERAL';

    const cleanDept = String(targetDept).trim();
    const deptRegex = new RegExp(`^${cleanDept}$`, 'i');

    const assignedFaculty = await User.find({
      role: { $in: ['Faculty', 'LabIncharge', 'Admin'] },
      $or: [{ department: deptRegex }, { category: deptRegex }],
    });

    const facultyNotifDocs = assignedFaculty.map((faculty) => ({
      recipient: faculty._id,
      title: 'New Booking Request',
      message: `${studentName} requested "${resourceName}" on ${dateISO} (${slotLabel}).`,
      type: 'BOOKING_PLACED',
      bookingId: booking._id,
      read: false,
    }));

    let savedFacultyNotifs = [];
    if (facultyNotifDocs.length > 0) {
      savedFacultyNotifs = await Notification.insertMany(facultyNotifDocs);
    }

    // ⚡ 9. Real-Time Socket Broadcasts
    try {
      const io = req.app.get('io') || (typeof getIO === 'function' ? getIO() : null);

      if (io) {
        const deptUpper = cleanDept.toUpperCase();
        const deptRoom = `dept_${deptUpper}`;
        const categoryRoom = `category_${deptUpper}`;

        const socketPayload = {
          bookingId: booking._id,
          booking: populatedBooking,
          title: 'New Booking Request',
          message: `${studentName} requested "${resourceName}" on ${dateISO} (${slotLabel}).`,
          type: 'BOOKING_PLACED',
          createdAt: booking.createdAt,
        };

        // A. Broadcast booking request to department & category rooms
        io.to(deptRoom).to(categoryRoom).emit('NEW_BOOKING_REQUEST', socketPayload);

        // B. Send live notification directly to each faculty's socket room
        savedFacultyNotifs.forEach((facNotif) => {
          const facultyIdStr = String(facNotif.recipient);
          io.to(`user_${facultyIdStr}`).to(facultyIdStr).emit('notification_received', facNotif);
          io.to(`user_${facultyIdStr}`).to(facultyIdStr).emit('NEW_BOOKING_REQUEST', socketPayload);
        });

        // C. Send live notification to student's personal socket room
        io.to(`user_${String(userId)}`).to(String(userId)).emit('notification_received', studentNotif);

        // D. Broadcast slot update globally to active viewers
        io.emit('slot_updated', {
          resourceId: resourceId.toString(),
          updatedResource: freshResource,
          booking: populatedBooking,
        });
      }
    } catch (socketErr) {
      console.warn('Socket broadcast warning (booking saved successfully):', socketErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed!',
      booking: populatedBooking,
      notification: studentNotif,
    });
  } catch (error) {
    console.error('Booking Error:', error);
    return res.status(500).json({ message: error.message });
  }
};
// 3. FACULTY APPROVE / REJECT BOOKING
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rejectionReason } = req.body;

    const booking = await Booking.findById(bookingId).populate('resource user');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    if (rejectionReason) booking.rejectionReason = rejectionReason;
    await booking.save();

    if (status === 'Rejected' && booking.resource) {
      const resource = await Resource.findById(booking.resource._id);
      if (resource) {
        const slotData = (resource.slotBookings || []).find(
          (s) =>
            (s.dateISO === booking.bookingDate || s.date === booking.bookingDate) &&
            (s.label === booking.timeSlot || s.timeSlot === booking.timeSlot)
        );

        if (slotData) {
          slotData.bookedCount = Math.max(0, slotData.bookedCount - (booking.quantity || 1));
          await resource.save();

          try {
            const io = req.app.get('io') || (typeof getIO === 'function' ? getIO() : null);
            if (io) {
              io.emit('slot_availability_updated', {
                resourceId: resource._id,
                date: booking.bookingDate,
                timeSlot: booking.timeSlot,
                availableCount: Math.max(0, resource.totalQuantity - slotData.bookedCount),
              });
            }
          } catch (e) {
            console.warn('Socket broadcast error:', e.message);
          }
        }
      }
    }

    const notif = await Notification.create({
      recipient: booking.user._id,
      title: status === 'Approved' ? 'Booking Approved! ✅' : 'Booking Rejected ❌',
      message:
        status === 'Approved'
          ? `Your booking for ${booking.resource?.name || 'Resource'} on ${booking.bookingDate} (${booking.timeSlot}) is approved!`
          : `Your booking was rejected: ${rejectionReason || 'No reason provided'}`,
      type: 'STATUS_CHANGE',
      bookingId: booking._id,
    });

    try {
      const io = req.app.get('io') || (typeof getIO === 'function' ? getIO() : null);
      if (io) {
        io.to(`user_${booking.user._id}`).emit('notification_received', notif);
        io.to(`user_${booking.user._id}`).emit('booking_status_changed', booking);
      }
    } catch (e) {
      console.warn('Socket emit error:', e.message);
    }

    return res.status(200).json({ message: `Booking ${status}`, booking });
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// 4. GET STUDENT BOOKINGS
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required.' });
    }

    const bookings = await Booking.find({ user: userId })
      .populate('resource', 'name category imageUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getFacultyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email department')
      .populate('resource', 'name category')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('Faculty Bookings Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params; 
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required.' });
    }

    const booking = await Booking.findById(bookingId)
      .populate('resource', 'name category description imageUrl')
      .populate('lab', 'name location department floor roomNumber') 
      .populate('approvedBy', 'name email department')
      .populate('reviewedBy', 'name email department');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error('Fetch Single Booking Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. CANCEL BOOKING
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user?.id || req.user?._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const isOwner = booking.user.toString() === userId.toString();
    const isAdmin = req.user?.role === 'Admin' || req.user?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to cancel this booking.' });
    }

    if (booking.status === 'Canceled') {
      return res.status(400).json({ message: 'Booking is already canceled.' });
    }

    booking.status = 'Canceled';
    await booking.save();

    if (booking.resource && booking.bookingDate && booking.timeSlot) {
      await Resource.updateOne(
        {
          _id: booking.resource,
          'slotBookings.dateISO': booking.bookingDate,
        },
        {
          $inc: { 'slotBookings.$[elem].bookedCount': -1 }
        },
        {
          arrayFilters: [
            { 
              'elem.dateISO': booking.bookingDate,
              $or: [
                { 'elem.label': booking.timeSlot },
                { 'elem.slotId': booking.slotId }
              ]
            }
          ]
        }
      );
    }

    const updatedBooking = await Booking.findById(bookingId)
      .populate('resource', 'name category imageUrl')
      .populate('lab', 'name location department');

    // 🚀 1. PERSIST CANCELLATION NOTIFICATION TO DATABASE
    const cancelNotif = await Notification.create({
      recipient: booking.user,
      title: 'Booking Canceled 🚫',
      message: `Your booking for "${updatedBooking.resource?.name || 'Resource'}" on ${booking.bookingDate} (${booking.timeSlot}) was successfully canceled.`,
      type: 'BOOKING_CANCELED',
      bookingId: booking._id,
    });

    // 🚀 2. REAL-TIME SOCKET EMIT
    try {
      const io = req.app.get('io') || (typeof getIO === 'function' ? getIO() : null);
      if (io) {
        // Emit notification document to user room
        io.to(`user_${booking.user}`).emit('notification_received', cancelNotif);

        io.to(`user_${booking.user}`).emit('booking_canceled', {
          message: 'Your booking was successfully canceled.',
          bookingId: booking._id,
        });

        io.emit('adminBookingCanceled', {
          message: `Booking ${booking._id} has been canceled.`,
          booking: updatedBooking,
        });
      }
    } catch (socketErr) {
      console.warn('Socket notification error on cancellation:', socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking canceled successfully.',
      booking: updatedBooking,
      notification: cancelNotif
    });
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    return res.status(500).json({ message: error.message || 'Server error while canceling booking.' });
  }
};

// GET /api/bookings/student-summary
exports.getStudentSummary = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // 1. Calculate stats
    const [totalBookings, pendingRequests, approvedBookings, availableResources] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, status: 'Pending' }),
      Booking.countDocuments({ user: userId, status: 'Approved' }),
      Resource.countDocuments({ status: 'Available', availableQuantity: { $gt: 0 } }),
    ]);

    // 2. Format today's date variations
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Matches "2026-08-08", "2026-8-8", or "2026-08-08T..."
    const paddedDateStr = `${year}-${month}-${day}`;
    const unpaddedDateStr = `${year}-${now.getMonth() + 1}-${now.getDate()}`;
    const dateRegex = new RegExp(`^(${paddedDateStr}|${unpaddedDateStr})`);

    // 3. Query today's booking (checks both Approved and Pending status if Approved is not found)
    let todaysBooking = await Booking.findOne({
      user: userId,
      status: { $in: ['Approved', 'Accepted'] },
      $or: [
        { bookingDate: { $regex: dateRegex } },
        { date: { $regex: dateRegex } }
      ]
    })
      .populate('resource')
      .populate('lab');

    // Fallback: If no approved booking exists for today, fetch a pending booking for today
    if (!todaysBooking) {
      todaysBooking = await Booking.findOne({
        user: userId,
        status: 'Pending',
        $or: [
          { bookingDate: { $regex: dateRegex } },
          { date: { $regex: dateRegex } }
        ]
      })
        .populate('resource')
        .populate('lab');
    }

    // --- TEMPORARY DEBUGGING LOG ---
    if (!todaysBooking) {
      const userBookings = await Booking.find({ user: userId }).select('bookingDate date status timeSlot').lean();
      console.log('⚠️ [DEBUG] No today booking matched. Current user bookings in DB:', userBookings);
      console.log('⚠️ [DEBUG] Query tried searching for date string pattern:', paddedDateStr);
    } else {
      console.log('✅ [DEBUG] Found todays booking:', todaysBooking._id);
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        pendingRequests,
        approvedBookings,
        availableResources,
      },
      todaysBooking: todaysBooking || null,
    });
  } catch (error) {
    console.error('Error fetching student summary:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};