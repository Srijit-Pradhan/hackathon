const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  addTimelineUpdate,
  generateSummary
} = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');

// GET routes are public (needed for the public status page)
// Write routes require authentication
router.route('/')
  .get(getIncidents)
  .post(protect, createIncident);

router.route('/:id')
  .get(getIncidentById)
  .put(protect, updateIncident);

router.route('/:id/timeline')
  .post(protect, addTimelineUpdate);

router.route('/:id/summarize')
  .post(protect, generateSummary);

module.exports = router;
