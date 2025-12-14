const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const { getUserTransactions } = require('../controllers/userTransactionController');

router.get('/', authenticateToken, getUserTransactions);

module.exports = router;