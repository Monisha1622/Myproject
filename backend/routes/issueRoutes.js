const express = require('express');
const router = express.Router();
const {
  getIssues,
  getIssueById,
  createIssue,
  returnIssue,
} = require('../controllers/issueController');
const { validateIssue } = require('../validators/issueValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

// All issue endpoints require authentication
router.use(authenticateToken);

router.get('/', getIssues);
router.get('/:id', getIssueById);
router.post('/', validateIssue, createIssue);
router.put('/:id/return', returnIssue);

module.exports = router;
