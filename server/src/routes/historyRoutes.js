const express = require('express');
const router = express.Router();
const { getHistory, getVerificationById } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHistory);
router.get('/:id', protect, getVerificationById);

module.exports = router;
