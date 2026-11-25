const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Dashboard endpoints require authentication
router.use(authenticateToken);

router.get('/stats', getDashboardStats);

module.exports = router;
