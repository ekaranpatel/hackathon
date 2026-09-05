const express = require('express');
const router = express.Router();
 
const {
  getLabs,
  getLabById,
  createLab,
  updateLab,
  deleteLab,
  assignResourceToLab,
  getLabsByCategory,
} = require('../controllers/Lab.controller');

// GET all labs
router.get('/', getLabs);

// GET labs by category (Must stay above /:id)
router.get('/category', getLabsByCategory);

// POST create new lab
router.post('/', createLab);
 
router.get('/:id', getLabById);
router.put('/:id', updateLab);
router.delete('/:id', deleteLab);
 
router.post('/:id/resources', assignResourceToLab);

module.exports = router;