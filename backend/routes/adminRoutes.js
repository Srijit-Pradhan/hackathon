const express = require('express');
const router = express.Router();
const { getAllUsers, getAllIncidentsAdmin, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require login + admin role
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/incidents', protect, adminOnly, getAllIncidentsAdmin);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
