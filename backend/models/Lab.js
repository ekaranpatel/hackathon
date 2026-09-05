const mongoose = require('mongoose');

const assignedResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  count: { type: Number, required: true, default: 1 }
});

const labSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    capacity: { type: Number, required: true },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Inactive'],
      default: 'Active'
    },
    assignedResources: [assignedResourceSchema]
  },
  { timestamps: true }
);
 
labSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

labSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Lab', labSchema);