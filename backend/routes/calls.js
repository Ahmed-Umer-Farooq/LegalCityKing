const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { getAllCalls, createCall, updateCall, deleteCall } = require('../controllers/callController');

router.get('/', authenticate, getAllCalls);
router.post('/', authenticate, createCall);
router.put('/:id', authenticate, updateCall);
router.delete('/:id', authenticate, deleteCall);

module.exports = router;
