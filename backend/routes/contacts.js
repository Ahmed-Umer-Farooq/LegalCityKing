const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { getAllContacts, createContact, updateContact, deleteContact } = require('../controllers/contactController');

router.get('/', authenticate, getAllContacts);
router.post('/', authenticate, createContact);
router.put('/:id', authenticate, updateContact);
router.delete('/:id', authenticate, deleteContact);

module.exports = router;
