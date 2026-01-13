const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/modernAuth');
const { getAllIntakes, createIntake, updateIntake, convertToCase } = require('../controllers/intakeController');

router.get('/', authenticate, getAllIntakes);
router.post('/', authenticate, createIntake);
router.put('/:id', authenticate, updateIntake);
router.put('/:id/convert', authenticate, convertToCase);

module.exports = router;
