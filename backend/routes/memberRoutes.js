const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/memberController');
const { validateMember } = require('../validators/memberValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

// All member endpoints require authentication
router.use(authenticateToken);

router.get('/', getMembers);
router.get('/:id', getMemberById);
router.post('/', validateMember, createMember);
router.put('/:id', validateMember, updateMember);
router.delete('/:id', deleteMember);

module.exports = router;
