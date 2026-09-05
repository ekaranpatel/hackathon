const express = require('express');
const router = express.Router();
const userController = require('../controllers/admin.user.controller');

// Get all users (with filters) & Add new user
router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

// Change role
router.patch('/:id/role', userController.updateUserRole);

// Block / Unblock user
router.patch('/:id/status', userController.updateUserStatus);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;