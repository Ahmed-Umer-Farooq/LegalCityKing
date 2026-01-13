const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { upload } = require('../utils/upload');
const { getAllExpenses, createExpense, updateExpense, deleteExpense, uploadReceipt } = require('../controllers/expenseController');

router.get('/', authenticate, getAllExpenses);
router.post('/', authenticate, createExpense);
router.put('/:id', authenticate, updateExpense);
router.put('/:id/receipt', authenticate, (req, res, next) => {
  req.uploadType = 'receipt';
  next();
}, upload.single('receipt'), uploadReceipt);
router.delete('/:id', authenticate, deleteExpense);

module.exports = router;
