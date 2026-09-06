const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    slotId: { type: String, required: true },
    label: { type: String, required: true },
    startHour: { type: Number, required: true, min: 0, max: 23 },
    dateISO: { type: String, required: true },
    bookedCount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    totalQuantity: { type: Number, default: 1, min: 0 },
    availableQuantity: { type: Number, default: 1 },
    // Optional field: Stores physical storage/spot location (e.g., when category is 'General')
    location: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Available', 'In Use', 'Maintenance'],
      default: 'Available'
    },
    assignedLabs: [
      {
        labId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lab',
          required: true
        },
        assignedQuantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],
    slotBookings: [timeSlotSchema]
  },
  { timestamps: true }
);

// Helper function: Total Quantity - Total Assigned Quantity across all labs
function computeAvailable(doc) {
  const total = Number(doc.totalQuantity) || 0;
  const totalAssigned = (doc.assignedLabs || []).reduce((sum, item) => {
    const qty = Number(
      item.assignedQuantity !== undefined
        ? item.assignedQuantity
        : item.quantity !== undefined
        ? item.quantity
        : 0
    );
    return sum + (isNaN(qty) ? 0 : qty);
  }, 0);
  return Math.max(0, total - totalAssigned);
}

resourceSchema.methods.recalculateAvailableQuantity = function () {
  this.availableQuantity = computeAvailable(this);
  return this.availableQuantity;
};

// Pre-save hook: Uses async/await
resourceSchema.pre('save', async function () {
  this.availableQuantity = computeAvailable(this);
});

// Pre-update hook for findOneAndUpdate queries: Uses async/await
resourceSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (!update) return;
  const rawData = update.$set || update;

  if (rawData.totalQuantity !== undefined || rawData.assignedLabs !== undefined) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      if (rawData.totalQuantity !== undefined) {
        docToUpdate.totalQuantity = Number(rawData.totalQuantity);
      }
      if (rawData.assignedLabs !== undefined) {
        docToUpdate.assignedLabs = rawData.assignedLabs;
      }

      const calculated = computeAvailable(docToUpdate);
      if (update.$set) {
        update.$set.availableQuantity = calculated;
      } else {
        update.availableQuantity = calculated;
      }
    }
  }
});

resourceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

resourceSchema.set('toJSON', { virtuals: true });
resourceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resource', resourceSchema);