const Resource = require('../models/Resource');
const Lab = require('../models/Lab');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');

// @desc    Get all resources with filters
// @route   GET /api/resources
exports.getResources = async (req, res) => {
  try {
    const { search, category, labId } = req.query;
    const filter = {};

    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    if (labId && labId !== 'All') {
      filter['assignedLabs.labId'] = labId;
    }

    const resources = await Resource.find(filter)
      .populate('assignedLabs.labId', 'name roomNumber location');

    return res.status(200).json(resources);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get single resource by ID
// @route   GET /api/resources/:id
exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('assignedLabs.labId', 'name roomNumber location');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    return res.json(resource);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get active bookings for a resource
// @route   GET /api/resources/:id/bookings
exports.getBookingsByResource = async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.params.id;
    const { date } = req.query;

    if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or missing Resource ID' 
      });
    }

    const filter = {
      resource: new mongoose.Types.ObjectId(resourceId),
      status: { $nin: ['Rejected', 'Canceled', 'Cancelled'] }
    };

    if (date) {
      const cleanDate = date.trim();
      filter.$or = [
        { bookingDate: cleanDate },
        { date: cleanDate }
      ];
    }

    const bookings = await Booking.find(filter)
      .select('bookingDate date timeSlot status quantity resource user')
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error in getBookingsByResource:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new resource
// @route   POST /api/resources
exports.createResource = async (req, res) => {
  try {
    const { name, category, totalQuantity, status, imageUrl } = req.body;

    const resource = new Resource({
      name,
      category,
      imageUrl: imageUrl || '',
      totalQuantity: Number(totalQuantity) || 1,
      status: status || 'Available',
      assignedLabs: []
    });

    // Explicitly recalculate before save
    if (typeof resource.recalculateAvailableQuantity === 'function') {
      resource.recalculateAvailableQuantity();
    } else {
      resource.availableQuantity = resource.totalQuantity;
    }

    const savedResource = await resource.save();
    return res.status(201).json(savedResource);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// @desc    Assign resource quantity to a Lab
// @route   POST /api/resources/:id/assign
exports.assignResourceToLab = async (req, res) => {
  try {
    const { id } = req.params;
    const { labId, quantity, assignedQuantity } = req.body;

    const qtyToAssign = Number(assignedQuantity || quantity);

    if (!labId || !qtyToAssign || qtyToAssign <= 0) {
      return res.status(400).json({ 
        message: "Both labId and valid assignedQuantity (> 0) are required." 
      });
    }

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // Calculate current total assigned across all labs
    const currentTotalAssigned = (resource.assignedLabs || []).reduce(
      (sum, item) => sum + Number(item.assignedQuantity || 0),
      0
    );

    const remainingUnassigned = resource.totalQuantity - currentTotalAssigned;

    if (qtyToAssign > remainingUnassigned) {
      return res.status(400).json({
        message: `Cannot assign ${qtyToAssign} items. Only ${remainingUnassigned} unassigned items left.`
      });
    }

    const existingIndex = resource.assignedLabs.findIndex(
      (item) => String(item.labId) === String(labId)
    );

    if (existingIndex > -1) {
      resource.assignedLabs[existingIndex].assignedQuantity += qtyToAssign;
    } else {
      resource.assignedLabs.push({
        labId: labId,
        assignedQuantity: qtyToAssign
      });
    }

    resource.markModified('assignedLabs');

    // Force recalculation of availableQuantity
    if (typeof resource.recalculateAvailableQuantity === 'function') {
      resource.recalculateAvailableQuantity();
    } else {
      const totalAssigned = resource.assignedLabs.reduce((sum, item) => sum + Number(item.assignedQuantity || 0), 0);
      resource.availableQuantity = Math.max(0, resource.totalQuantity - totalAssigned);
    }

    await resource.save();

    const updated = await Resource.findById(id).populate('assignedLabs.labId', 'name roomNumber location');
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// @desc    Unassign resource from Lab
// @route   DELETE /api/resources/:id/unassign/:labId
exports.unassignResourceFromLab = async (req, res) => {
  try {
    const { id, labId } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    const index = (resource.assignedLabs || []).findIndex((item) => {
      const targetId = item.labId || item.lab;
      return targetId && targetId.toString() === labId.toString();
    });

    if (index === -1) {
      return res.status(404).json({ message: 'Lab assignment not found for this resource.' });
    }

    resource.assignedLabs.splice(index, 1);
    resource.markModified('assignedLabs');

    // Force recalculation of availableQuantity
    if (typeof resource.recalculateAvailableQuantity === 'function') {
      resource.recalculateAvailableQuantity();
    } else {
      const totalAssigned = resource.assignedLabs.reduce((sum, item) => sum + Number(item.assignedQuantity || 0), 0);
      resource.availableQuantity = Math.max(0, resource.totalQuantity - totalAssigned);
    }

    await resource.save();

    // Remove reference from Lab model if applicable
    const lab = await Lab.findById(labId);
    if (lab && lab.assignedResources) {
      lab.assignedResources = lab.assignedResources.filter((item) => {
        const targetId = item.resourceId || item.resource || item._id;
        return targetId ? targetId.toString() !== resource._id.toString() : item.name !== resource.name;
      });
      await lab.save();
    }

    const updatedResource = await Resource.findById(id)
      .populate('assignedLabs.labId', 'name roomNumber location');

    return res.status(200).json(updatedResource);
  } catch (error) {
    console.error('Error unassigning lab:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update a resource
// @route   PUT /api/resources/:id
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // FIX 1: Strip incoming availableQuantity to prevent client payloads from overwriting calculated DB values
    if (req.body.availableQuantity !== undefined) {
      delete req.body.availableQuantity;
    }

    // Apply updates directly to the Mongoose document instance
    Object.assign(resource, req.body);

    if (req.body.assignedLabs) {
      resource.markModified('assignedLabs');
    }

    // FIX 2: Explicitly recalculate before saving
    if (typeof resource.recalculateAvailableQuantity === 'function') {
      resource.recalculateAvailableQuantity();
    } else {
      const totalAssigned = (resource.assignedLabs || []).reduce((sum, item) => sum + Number(item.assignedQuantity || 0), 0);
      resource.availableQuantity = Math.max(0, (Number(resource.totalQuantity) || 0) - totalAssigned);
    }

    await resource.save();

    const updatedResource = await Resource.findById(id)
      .populate('assignedLabs.labId', 'name roomNumber location');

    // Socket Notification
    try {
      const getIO = req.app.get('getIO') || req.app.get('io');
      const io = typeof getIO === 'function' ? getIO() : getIO;

      if (io) {
        io.to(`resource_${String(id)}`).emit('slot_updated', {
          resourceId: String(id),
          updatedResource,
        });

        io.to(`resource_${String(id)}`).emit('resource_updated', updatedResource);
      }
    } catch (socketErr) {
      console.warn('Socket notification error in updateResource:', socketErr.message);
    }

    return res.status(200).json(updatedResource);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update resource' });
  }
};

// @desc    Delete resource entirely from inventory
// @route   DELETE /api/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    await Lab.updateMany(
      {},
      { $pull: { assignedResources: { resourceId: req.params.id } } }
    );

    return res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};