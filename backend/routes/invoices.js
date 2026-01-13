const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/modernAuth');
const { getAllInvoices, createInvoice, updateInvoice, deleteInvoice, sendInvoice, markPaid, generatePDF, getInvoiceStats } = require('../controllers/invoiceController');

router.use(authenticate);

router.get('/', authorize('read', 'invoices'), getAllInvoices);
router.get('/stats', authorize('read', 'invoices'), getInvoiceStats);
router.get('/:id/pdf', authorize('read', 'invoices'), generatePDF);
router.post('/', authorize('write', 'invoices'), createInvoice);
router.put('/:id', authorize('write', 'invoices'), updateInvoice);
router.put('/:id/send', authorize('write', 'invoices'), sendInvoice);
router.put('/:id/mark-paid', authorize('write', 'invoices'), markPaid);
router.delete('/:id', authorize('write', 'invoices'), deleteInvoice);

module.exports = router;
