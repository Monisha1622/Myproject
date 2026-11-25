const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bookRoutes = require('./bookRoutes');
const memberRoutes = require('./memberRoutes');
const issueRoutes = require('./issueRoutes');
const dashboardRoutes = require('./dashboardRoutes');

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/members', memberRoutes);
router.use('/issues', issueRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
