const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { validateLogin } = require('../validators/authValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', validateLogin, login);
router.get('/me', authenticateToken, getMe);

module.exports = router;
