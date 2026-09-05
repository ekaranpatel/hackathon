const express = require('express');
const router = express.Router();
const { createBooking ,checkAvailability,getFacultyMyBookings,getLabScheduleByDate,getFacultyRequests,
  approveBooking,} = require('../controllers/Lab.booking.controller');
const { verifyAppToken,authorizeRoles } = require('../middleware/protect'); // Auth check middleware


router.post('/check-availability', verifyAppToken, checkAvailability);
router.post('/create', verifyAppToken, createBooking);
router.get('/my-bookings', verifyAppToken , authorizeRoles('faculty', 'admin') ,getFacultyMyBookings);
router.get('/requests',  verifyAppToken , getFacultyRequests);
router.get('/:labId/schedule',  verifyAppToken, getLabScheduleByDate);
router.put('/requests/:bookingId/approve', verifyAppToken  , approveBooking);
module.exports = router;