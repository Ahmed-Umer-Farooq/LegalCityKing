const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { getUserTransactions } = require('../controllers/userTransactionController');

router.get('/', authenticate, getUserTransactions);

module.exports = router;
