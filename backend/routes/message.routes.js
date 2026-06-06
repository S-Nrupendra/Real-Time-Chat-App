const express = require('express');
const router = express.Router();
const { getMessages, deleteMessage } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getMessages);
router.delete('/:id', protect, deleteMessage);

module.exports = router;