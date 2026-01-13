const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { getAllNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');

router.get('/', authenticate, getAllNotes);
router.post('/', authenticate, createNote);
router.put('/:id', authenticate, updateNote);
router.delete('/:id', authenticate, deleteNote);

module.exports = router;
