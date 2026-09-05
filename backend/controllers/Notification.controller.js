// controllers/notification.controller.js
const Notification = require('../models/Notification');
const { getIO } = require('../socket'); // 👈 Import getIO helper from your socket.js
 
const sendNotification = async ({ recipientId, title, message, type }) => {
  try {
    // 1. Save to Database (Note: matches your schema field 'user')
    const notification = await Notification.create({
      user: recipientId,
      title,
      message,
      type
    });
 
    const targetRoom = `user_${String(recipientId)}`;

    // 3. Emit real-time socket event
    getIO().to(targetRoom).emit('new_notification', notification);

    console.log(`📡 Real-time notification emitted to room: ${targetRoom}`);
    return notification;
  } catch (error) {
    console.error('Error creating/emitting notification:', error);
  }
};

// GET /api/notifications
exports.getUserNotifications = async (req, res) => {
  try {
 
    const userId = req.user._id || req.user.id;
    const notifications = await Notification.find({ 
recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);
 
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// PUT /api/notifications/mark-all-read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Update all unread notifications for this user
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @access  Private
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Delete records matching user, userId, or recipient
    const result = await Notification.deleteMany({
      $or: [
        { user: userId },
        { userId: userId },
        { recipient: userId }
      ]
    });

    console.log(`Deleted ${result.deletedCount} notifications for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message,
    });
  }
};

// Export helper so other controllers can trigger notifications
module.exports = {
  getUserNotifications: exports.getUserNotifications,
  markAsRead: exports.markAsRead,
  markAllAsRead: exports.markAllAsRead, // 👈 Export new function
  clearAllNotifications: exports.clearAllNotifications,
  sendNotification
};