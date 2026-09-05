// routes/facultyRoutes.js
const express = require('express');
const router = express.Router();
const { getFacultyPendingBookings, respondToBooking ,getApprovedBookings} = require('../controllers/Facultybooking');
const { verifyAppToken, authorizeRoles } = require('../middlerware/protect'); // Express Auth Middlewares

// Added 'verifyAppToken' before 'authorizeRoles'
router.get('/pending', verifyAppToken, authorizeRoles('Faculty', 'Admin'), getFacultyPendingBookings);
router.patch('/respond/:bookingId', verifyAppToken, authorizeRoles('Faculty', 'Admin'), respondToBooking);
router.get('/approved', verifyAppToken, authorizeRoles('Faculty', 'Admin'), getApprovedBookings);
module.exports = router;