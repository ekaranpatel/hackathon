const mongoose = require('mongoose');

const labbookingSchema = new mongoose.Schema(
  {
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD
      required: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String, // HH:mm format (e.g., "09:00")
      required: true,
    },
    endTime: {
      type: String, // HH:mm format (e.g., "11:00")
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    expectedStudents: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['approved', 'cancelled', 'pending','Completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('labBooking', labbookingSchema);