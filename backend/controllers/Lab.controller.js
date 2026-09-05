const Lab = require('../models/Lab');
 
 exports.getLabsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      const labs = await Lab.find({});
      return res.status(200).json(labs);
    }
 
    const safeCategory = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const labs = await Lab.find({
      category: new RegExp(`^${safeCategory}$`, 'i')
    });

    return res.status(200).json(labs);
  } catch (error) {
    console.error('Error in getLabsByCategory:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch labs by category', 
      error: error.message 
    });
  }
};
exports.getLabs = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

     if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category if not 'All'
    if (category && category !== 'All') {
      filter.category = category;
    }

    const labs = await Lab.find(filter);
    return res.status(200).json(labs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lab by ID
// @route   GET /api/labs/:id
exports.getLabById = async (req, res) => {
  try {
    console.log('lab id is',req.params.id);
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });
    res.status(200).json(lab);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new lab
// @route   POST /api/labs
exports.createLab = async (req, res) => {
  try {
    const lab = new Lab({
      name: req.body.name,
      category: req.body.category,
      capacity: req.body.capacity,
      location: req.body.location,
      status: req.body.status || 'Active',
      assignedResources: req.body.assignedResources || []
    });

    const newLab = await lab.save();
    res.status(201).json(newLab);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update an existing lab
// @route   PUT /api/labs/:id
exports.updateLab = async (req, res) => {
  try {
    const updatedLab = await Lab.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        category: req.body.category,
        capacity: req.body.capacity,
        location: req.body.location,
        status: req.body.status
      },
      { new: true, runValidators: true }
    );

    if (!updatedLab) return res.status(404).json({ message: 'Lab not found' });
    res.status(200).json(updatedLab);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a lab
// @route   DELETE /api/labs/:id
exports.deleteLab = async (req, res) => {
  try {
    const lab = await Lab.findByIdAndDelete(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });
    res.status(200).json({ message: 'Lab deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

 
exports.assignResourceToLab = async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    lab.assignedResources.push({
      name: req.body.resourceName,
      count: Number(req.body.count)
    });

    await lab.save();
    res.status(200).json(lab);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};