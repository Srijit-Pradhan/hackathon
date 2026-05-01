const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  assignUser,
  addTimelineUpdate,
  generateSummary
} = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');

// GET is public (for the public status page)
router.route('/')
  .get(getIncidents)
  .post(protect, createIncident);

// IMPORTANT: Specific routes MUST come before generic /:id route
// Otherwise /:id will match /assign, /timeline, /summarize as part of the ID
router.route('/:id/assign')
  .put(protect, assignUser);

router.route('/:id/timeline')
  .post(protect, addTimelineUpdate);

router.route('/:id/summarize')
  .post(protect, generateSummary);

// Generic ID route - MUST come last
router.route('/:id')
  .get(getIncidentById)
  .put(protect, updateIncident);

module.exports = router;
