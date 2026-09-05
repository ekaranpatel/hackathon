const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  updateBookingStatus,
  getAllLabBookings
} = require('../controllers/adminbooking.controller');

// Middleware to verify JWT token and verify admin privileges
const { verifyAppToken, authorizeRoles } = require('../middleware/protect');

// GET /api/bookings/admin/all (Protected: Admin Only)
router.get(
  '/all',
  verifyAppToken,
  authorizeRoles('admin'),
  getAllBookings
);
router.get('/all-labs', verifyAppToken,authorizeRoles('admin'), getAllLabBookings);

// PUT /api/bookings/:id/status (Protected: Admin Only)
router.put(
  '/:id/status',
  verifyAppToken,
  authorizeRoles('admin'),
  updateBookingStatus
);

module.exports = router;