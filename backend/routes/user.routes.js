const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getOnlineUsers } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/online', protect, getOnlineUsers);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

module.exports = router;