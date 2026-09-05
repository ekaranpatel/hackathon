const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead,markAllAsRead,clearAllNotifications } = require('../controllers/Notification.controller');
// Import your existing auth middleware here
const { verifyAppToken} = require('../middlerware/protect');

router.get('/', verifyAppToken, getUserNotifications);
router.put('/:id/read', verifyAppToken, markAsRead);
router.put('/mark-all-read', verifyAppToken, markAllAsRead);
router.delete('/clear-all', verifyAppToken,clearAllNotifications);

module.exports = router;