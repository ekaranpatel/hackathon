const express = require('express');
const router = express.Router();
const {
  getSlotAvailability,
  createBooking,
  updateBookingStatus,
  getMyBookings,
  getFacultyBookings,
  getBookingById,
  cancelBooking,
  getStudentSummary 
} = require('../controllers/Booking.controller');

// Import authentication & role middleware
const { verifyAppToken, authorizeRoles } = require('../middleware/protect');

// Apply authentication to all booking routes
router.use(verifyAppToken);

 

// GET /api/bookings/my-bookings
router.get('/my-bookings', getMyBookings);
router.get('/student-summary', getStudentSummary);
// GET /api/bookings/faculty/all
router.get('/faculty/all', authorizeRoles('faculty', 'admin'), getFacultyBookings);

// GET /api/bookings/availability/:resourceId?date=YYYY-MM-DD&timeSlot=HH:MM-HH:MM
router.get('/availability/:resourceId', getSlotAvailability);

// POST /api/bookings/create
router.post('/create', createBooking);

// PATCH /api/bookings/status/:bookingId
router.patch('/status/:bookingId', authorizeRoles('faculty', 'admin'), updateBookingStatus);


 
// GET /api/bookings/:bookingId
router.get('/:bookingId', getBookingById);
router.put('/:id/cancel', verifyAppToken, cancelBooking);

module.exports = router;