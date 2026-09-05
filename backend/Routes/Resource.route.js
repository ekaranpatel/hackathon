const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  assignResourceToLab,
  unassignResourceFromLab,
  deleteResource
  ,getBookingsByResource
} = require('../controllers/Resource.controller');

 

// Collection Operations
router.get('/', getResources);
router.post('/', createResource);

// Single Item Operations
router.get('/:id', getResourceById);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

// Lab Allocation Operations
router.get('/time-slot/:resourceId', getBookingsByResource); // New route to fetch bookings for a specific resource
router.post('/:id/assign', assignResourceToLab);
router.delete('/:id/unassign/:labId', unassignResourceFromLab);

module.exports = router;