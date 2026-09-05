const User = require('../models/User');


exports.getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = {};

    // Filter by Role
    if (role && role !== 'All') {
      query.role = role;
    }

    // Filter by Status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Search by Name or Email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// POST /api/users - Create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, role, status, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const user = new User({
      name,
      email,
      avatar,
      role: role || 'Student',
      status: status || 'Active'
    });

    await user.save();
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/users/:id/role - Change User Role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Student', 'Faculty', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/users/:id/status - Block/Unblock User
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/:id - Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ message: 'User deleted successfully.', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};