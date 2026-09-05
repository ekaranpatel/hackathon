const Booking = require('../models/Booking'); // Adjust path to your Booking model
const LabBooking = require('../models/Labbooking')
// @desc    Get all student requests (Admin only)
// @route   GET /api/bookings/admin/all
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email department role') // Populates student details
      .populate('resource', 'name category location')        // Populates resource details
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch student requests.',
      error: error.message,
    });
  }
};
const getAllLabBookings = async (req, res) => {
  try {
    const bookings = await LabBooking.find()
      .populate('user', 'name email department role') 
      .populate('labId' )        
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch student requests.',
      error: error.message,
    });
  }
};

// @desc    Approve or Reject a student booking request
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const bookingId = req.params.id;

    // Validate status input
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be Approved, Rejected, or Pending.',
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found.',
      });
    }

    // Update status and optional rejection reason
    booking.status = status;
    if (status === 'Rejected') {
      booking.rejectionReason = rejectionReason || 'No specific reason provided.';
    } else {
      booking.rejectionReason = undefined; // Clear reason if re-approved
    }

    await booking.save();

    // Re-populate updated booking details for the socket emit / response
    const updatedBooking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('resource', 'name category');

    // Emit Socket.io event if socket instance is bound to req.app
    const io = req.app.get('io');
    if (io) {
      io.emit('bookingStatusUpdated', updatedBooking);
    }

    res.status(200).json({
      success: true,
      message: `Booking request marked as ${status}.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to update booking status.',
      error: error.message,
    });
  }
};

module.exports = {
  // ... your existing controller exports
  getAllBookings,
  updateBookingStatus,
  getAllLabBookings
};