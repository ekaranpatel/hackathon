const express = require('express');
const router = express.Router();

 
const { googleAuth, getMe, createUser,loginUser } = require('../controllers/auth.controller');
 
const { verifyAppToken } = require('../middleware/protect'); 

router.post('/google', googleAuth);
router.post('/create', createUser);  
router.post('/login', loginUser);
router.get('/me', verifyAppToken, getMe); 

module.exports = router;