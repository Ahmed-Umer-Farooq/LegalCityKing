const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { getAllMessages, createMessage, sendMessage, deleteMessage } = require('../controllers/messageController');

router.get('/', authenticate, getAllMessages);
router.post('/', authenticate, createMessage);
router.put('/:id/send', authenticate, sendMessage);
router.delete('/:id', authenticate, deleteMessage);

module.exports = router;
