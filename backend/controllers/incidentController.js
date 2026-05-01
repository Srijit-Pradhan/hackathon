const Incident = require('../models/Incident');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// -----------------------------------------------------------
// Simple in-memory cache for GET /incidents (30 second TTL)
// -----------------------------------------------------------
const cache = {
  data: null,
  expiresAt: 0,
};

const CACHE_TTL_MS = 30 * 1000; // 30 seconds

// -----------------------------------------------------------
// Fallback summary generator (when API quota is exceeded)
// -----------------------------------------------------------
function generateFallbackSummary(incident) {
  const startTime = incident.timeline[0]?.timestamp || incident.createdAt;
  const endTime = incident.timeline[incident.timeline.length - 1]?.timestamp || new Date();
  const durationMinutes = Math.round((new Date(endTime) - new Date(startTime)) / 60000);

  // Simple heuristic-based summary
  const severity = incident.severity || 'unknown';
  const status = incident.status || 'unresolved';
  
  const summary = `
Incident "${incident.title}" was reported and lasted approximately ${durationMinutes} minutes. The incident affected service availability with ${severity} severity. 
Root Cause: Based on the timeline, the issue appears to have been identified and resolved through standard incident response procedures. 
Status: Currently marked as ${status}.
  `.trim();

  const rootCause = 'Unable to generate detailed analysis. API quota exceeded. Please try again later or review timeline manually for root cause analysis.';

  return { summary, rootCause };
}

function clearIncidentsCache() {
  cache.data = null;
  cache.expiresAt = 0;
}

async function respondWithFallback(res, req, incident, payload) {
  const { summary, rootCause } = generateFallbackSummary(incident);
  incident.aiSummary = summary;
  incident.aiRootCause = rootCause;
  await incident.save();

  req.io.to(req.params.id).emit('incidentUpdated', incident);

  return res.status(200).json({
    incident,
    ...payload,
    usingFallback: true,
  });
}

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private
const getIncidents = async (req, res) => {
  try {
    // Return cached data if it's still fresh
    if (cache.data && Date.now() < cache.expiresAt) {
      return res.json(cache.data);
    }

    const incidents = await Incident.find({}).populate('assignedTo createdBy', 'name email role');

    // Store in cache
    cache.data = incidents;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Private
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('assignedTo createdBy', 'name email role');
    if (incident) {
      res.json(incident);
    } else {
      res.status(404).json({ message: 'Incident not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an incident
// @route   POST /api/incidents
// @access  Private
const createIncident = async (req, res) => {
  try {
    const { title, description, severity } = req.body;

    // Basic validation
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const incident = new Incident({
      title,
      description,
      severity,
      createdBy: req.user._id,
      timeline: [{
        update: 'Incident created.',
        author: req.user._id,
        authorName: req.user.name
      }]
    });

    const createdIncident = await incident.save();

    clearIncidentsCache();

    const populatedIncident = await Incident.findById(createdIncident._id).populate('assignedTo createdBy', 'name email role');
    req.io.emit('incidentCreated', populatedIncident);

    res.status(201).json(populatedIncident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update incident (status and/or assignment)
// @route   PUT /api/incidents/:id
// @access  Private
const updateIncident = async (req, res) => {
  try {
    const { status, assignedTo, assignedToName } = req.body;
    const incident = await Incident.findById(req.params.id).lean();

    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    const isAdmin = req.user.role === 'admin';
    const isCreator = !incident.createdBy || incident.createdBy.toString() === req.user._id.toString();
    const isAssigned = incident.assignedTo && incident.assignedTo.toString() === req.user._id.toString();

    const setFields = {};
    const timelineEntries = [];

    // Handle assignedTo change — admin or creator only
    if (assignedTo) {
      if (!isAdmin && !isCreator) {
        return res.status(403).json({ message: 'Not authorized to assign responders' });
      }
      // Cast to ObjectId so Mongoose .populate() works correctly.
      // The native collection.updateOne() stores values as-is (no schema casting),
      // so a plain string would break populate.
      try {
        setFields.assignedTo = new mongoose.Types.ObjectId(assignedTo);
      } catch {
        return res.status(400).json({ message: 'Invalid user ID for assignedTo' });
      }
      timelineEntries.push({
        update: `Assigned to ${assignedToName || 'a responder'}`,
        author: req.user._id,
        authorName: req.user.name,
        timestamp: new Date()
      });
    }

    // Handle status change — admin, creator, or assigned
    if (status && status !== incident.status) {
      if (!isAdmin && !isCreator && !isAssigned) {
        return res.status(403).json({ message: 'Not authorized to change status' });
      }
      setFields.status = status;
      timelineEntries.push({
        update: `Status changed to ${status}`,
        author: req.user._id,
        authorName: req.user.name,
        timestamp: new Date()
      });
    }

    // Build the raw MongoDB update operation
    const updateOp = {};
    if (Object.keys(setFields).length > 0) updateOp.$set = setFields;
    if (timelineEntries.length > 0) updateOp.$push = { timeline: { $each: timelineEntries } };

    if (Object.keys(updateOp).length === 0) {
      // Nothing to update — return current state
      const current = await Incident.findById(req.params.id).populate('assignedTo', 'name email role');
      return res.json(current);
    }

    // Use native MongoDB driver to bypass ALL Mongoose processing on old documents
    await Incident.collection.updateOne(
      { _id: incident._id },
      updateOp
    );

    clearIncidentsCache();

    const populated = await Incident.findById(req.params.id).populate('assignedTo createdBy', 'name email role');
    req.io.to(req.params.id).emit('incidentUpdated', populated);
    req.io.emit('incidentListUpdated', populated);
    // Emit targeted notification to the assigned user's personal room
    req.io.to(`user:${assignedTo}`).emit('youAreAssigned', {
      incidentId: req.params.id,
      incidentTitle: incident.title,
      assignedBy: req.user.name,
      timestamp: new Date()
    });

    res.json(populated);
  } catch (error) {
    console.error('updateIncident error:', error);
    res.status(500).json({ message: error.message });
  }
};


// @desc    Assign a responder to an incident
// @route   PUT /api/incidents/:id/assign
// @access  Private
const assignUser = async (req, res) => {
  try {
    const { userId, userName } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (incident) {
      // Permission: admin | creator
      const isCreator = !incident.createdBy || incident.createdBy.toString() === req.user._id.toString();
      if (req.user.role !== 'admin' && !isCreator) {
        return res.status(403).json({ message: 'Not authorized to assign responders' });
      }

      const timelineEntry = {
        update: `Assigned to ${userName}`,
        author: req.user._id,
        authorName: req.user.name,
        timestamp: new Date()
      };

      // Cast to ObjectId so .populate() works correctly.
      // Saving a plain string breaks population on the subsequent GET.
      let assignedObjectId;
      try {
        assignedObjectId = new mongoose.Types.ObjectId(userId);
      } catch {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Use native driver to bypass strict schema validation on old documents
      await Incident.collection.updateOne(
        { _id: incident._id },
        {
          $set: { assignedTo: assignedObjectId },
          $push: { timeline: timelineEntry }
        }
      );

      clearIncidentsCache();

      const populated = await Incident.findById(req.params.id).populate('assignedTo createdBy', 'name email role');

      // Emit targeted notification to the newly assigned user
      req.io.to(`user:${assignedObjectId}`).emit('youAreAssigned', {
        incidentId: req.params.id,
        incidentTitle: incident.title,
        assignedBy: req.user.name,
        timestamp: new Date()
      });

      req.io.to(req.params.id).emit('incidentUpdated', populated);
      req.io.emit('incidentListUpdated', populated);
      res.json(populated);
    } else {
      res.status(404).json({ message: 'Incident not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add timeline update
// @route   POST /api/incidents/:id/timeline
// @access  Private
const addTimelineUpdate = async (req, res) => {
  try {
    const { update } = req.body;

    if (!update || !update.trim()) {
      return res.status(400).json({ message: 'Update text is required' });
    }

    const incident = await Incident.findById(req.params.id).lean();

    if (incident) {
      // Permission: admin | creator | assignedTo
      const isCreator = !incident.createdBy || incident.createdBy.toString() === req.user._id.toString();
      const isAssigned = incident.assignedTo && incident.assignedTo.toString() === req.user._id.toString();
      if (req.user.role !== 'admin' && !isCreator && !isAssigned) {
        return res.status(403).json({ message: 'Not authorized to post timeline updates' });
      }

      const newUpdate = {
        update,
        author: req.user._id,
        authorName: req.user.name,
        timestamp: new Date()
      };

      // Native MongoDB driver — bypasses ALL Mongoose processing on old documents
      await Incident.collection.updateOne(
        { _id: incident._id },
        { $push: { timeline: newUpdate } }
      );

      req.io.to(req.params.id).emit('timelineUpdate', newUpdate);
      res.status(201).json({ success: true, update: newUpdate });
    } else {
      res.status(404).json({ message: 'Incident not found' });
    }
  } catch (error) {
    console.error('addTimelineUpdate error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate Postmortem / AI Summary
// @route   POST /api/incidents/:id/summarize
// @access  Private
const generateSummary = async (req, res) => {
  let incident; // Declare outside try so it's accessible in catch
  
  try {
    incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Return cached summary if already generated
    if (incident.aiSummary) {
      return res.json({
        incident,
        message: 'Summary already generated',
        fromCache: true
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'Gemini API Key is missing in environment. Please check your .env file configuration.' 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Format timeline for AI
    const timelineStr = incident.timeline
      .map(t => `[${new Date(t.timestamp).toISOString()}] ${t.authorName}: ${t.update}`)
      .join('\n');

    const prompt = `
      You are an expert site reliability engineer. Review the following incident timeline and generate a brief Postmortem.
      Title: ${incident.title}
      Description: ${incident.description}
      Timeline:
      ${timelineStr}

      Please provide:
      1. A short, professional summary of the incident.
      2. A probable root cause based on the timeline updates.
      Format the response as plain text with clear headings "Summary:" and "Root Cause:". Do not use markdown styling.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    const summaryMatch = aiText.match(/Summary:([\s\S]*?)Root Cause:/i);
    const rootCauseMatch = aiText.match(/Root Cause:([\s\S]*)/i);

    incident.aiSummary = summaryMatch ? summaryMatch[1].trim() : aiText;
    incident.aiRootCause = rootCauseMatch ? rootCauseMatch[1].trim() : '';

    await incident.save();

    // Broadcast AI update
    req.io.to(req.params.id).emit('incidentUpdated', incident);

    res.json(incident);
  } catch (error) {
    console.error('AI Gen Error:', error.message);
    
    // Handle quota/rate limit errors - use fallback summary
    if (error.status === 429) {
      const retryAfter = error.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay || '24 hours';
      return respondWithFallback(res, req, incident, {
        message: 'AI service quota exceeded. Generated summary with available data.',
        error: 'QUOTA_EXCEEDED',
        retryAfter: retryAfter,
        details: 'The free tier limit for the Generative AI API has been reached. A basic summary was generated from available data. For a detailed analysis, please try again after the specified time or upgrade your plan.'
      });
    }

    // Handle other API errors - also use fallback
    if (error.status === 500 || error.status === 503) {
      return respondWithFallback(res, req, incident, {
        message: 'AI service temporarily unavailable. Generated summary with available data.',
        error: 'SERVICE_UNAVAILABLE',
      });
    }

    // For any other error, log it and use fallback
    try {
      return respondWithFallback(res, req, incident, {
        message: 'Failed to reach AI service. Generated summary with available data.',
        error: 'FALLBACK_GENERATED',
        details: error.message
      });
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
      res.status(500).json({
        message: error.message || 'Failed to generate AI summary',
        error: 'GENERATION_FAILED',
        details: 'Both AI generation and fallback summary failed'
      });
    }
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  assignUser,
  addTimelineUpdate,
  generateSummary
};
