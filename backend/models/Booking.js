const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      default: null,
    },
    bookingDate: { type: String, required: true }, // "YYYY-MM-DD"
    date: { type: String },                        // Backup date field matching controller
    timeSlot: { type: String, required: true },    // "09:00 AM - 10:00 AM"
    purpose: { type: String, default: '' },        // Booking purpose
    quantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Canceled'],
      default: 'Pending',
    },
    // Added faculty approval/review references to enable .populate()
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true,
    collection: 'bookings'
   }
);

// Speed up query lookups for specific resource dates
bookingSchema.index({ resource: 1, bookingDate: 1, timeSlot: 1 });

module.exports = mongoose.model('Booking', bookingSchema);