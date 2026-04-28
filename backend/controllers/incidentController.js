const Incident = require('../models/Incident');
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
  // Extract key information from timeline
  const timelineUpdates = incident.timeline.map(t => t.update);
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

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private
const getIncidents = async (req, res) => {
  try {
    // Return cached data if it's still fresh
    if (cache.data && Date.now() < cache.expiresAt) {
      return res.json(cache.data);
    }

    const incidents = await Incident.find({}).populate('assignedUsers', 'name email');

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
    const incident = await Incident.findById(req.params.id).populate('assignedUsers', 'name email');
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
      timeline: [{
        update: 'Incident created.',
        author: req.user._id,
        authorName: req.user.name
      }]
    });

    const createdIncident = await incident.save();

    // Invalidate cache so next GET fetches fresh data
    clearIncidentsCache();

    // Broadcast new incident
    req.io.emit('incidentCreated', createdIncident);

    res.status(201).json(createdIncident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update incident (status, assignments)
// @route   PUT /api/incidents/:id
// @access  Private
const updateIncident = async (req, res) => {
  try {
    const { status, assignedUsers } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (incident) {
      if (status) incident.status = status;
      if (assignedUsers) incident.assignedUsers = assignedUsers;

      const updatedIncident = await incident.save();

      // Invalidate cache
      clearIncidentsCache();

      // Broadcast update
      req.io.to(req.params.id).emit('incidentUpdated', updatedIncident);
      req.io.emit('incidentListUpdated', updatedIncident);

      res.json(updatedIncident);
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

    const incident = await Incident.findById(req.params.id);

    if (incident) {
      const newUpdate = {
        update,
        author: req.user._id,
        authorName: req.user.name
      };

      incident.timeline.push(newUpdate);
      await incident.save();

      const savedUpdate = incident.timeline[incident.timeline.length - 1];
      req.io.to(req.params.id).emit('timelineUpdate', savedUpdate);

      res.status(201).json(incident);
    } else {
      res.status(404).json({ message: 'Incident not found' });
    }
  } catch (error) {
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
    console.log('GEMINI_API_KEY present:', !!apiKey);
    console.log('GEMINI_API_KEY length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set or is empty');
      return res.status(500).json({ 
        message: 'Gemini API Key is missing in environment. Please check your .env file configuration.' 
      });
    }

    console.log('Initializing GoogleGenerativeAI with API key...');
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

    console.log('Making API call to Gemini...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();
    console.log('API call successful, received response');

    const summaryMatch = aiText.match(/Summary:([\s\S]*?)Root Cause:/i);
    const rootCauseMatch = aiText.match(/Root Cause:([\s\S]*)/i);

    incident.aiSummary = summaryMatch ? summaryMatch[1].trim() : aiText;
    incident.aiRootCause = rootCauseMatch ? rootCauseMatch[1].trim() : '';

    await incident.save();

    // Broadcast AI update
    req.io.to(req.params.id).emit('incidentUpdated', incident);

    res.json(incident);
  } catch (error) {
    console.error('AI Gen Error - Full Error:', error);
    console.error('Error Status:', error.status);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    // Handle quota/rate limit errors - use fallback summary
    if (error.status === 429) {
      console.log('Handling 429 quota error with fallback summary');
      const retryAfter = error.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay || '24 hours';
      
      // Generate fallback summary
      const { summary, rootCause } = generateFallbackSummary(incident);
      incident.aiSummary = summary;
      incident.aiRootCause = rootCause;
      await incident.save();

      // Broadcast update
      req.io.to(req.params.id).emit('incidentUpdated', incident);

      return res.status(200).json({
        incident,
        message: 'AI service quota exceeded. Generated summary with available data.',
        error: 'QUOTA_EXCEEDED',
        retryAfter: retryAfter,
        usingFallback: true,
        details: 'The free tier limit for the Generative AI API has been reached. A basic summary was generated from available data. For a detailed analysis, please try again after the specified time or upgrade your plan.'
      });
    }

    // Handle other API errors - also use fallback
    if (error.status === 500 || error.status === 503) {
      console.log('Handling API service error with fallback summary');
      const { summary, rootCause } = generateFallbackSummary(incident);
      incident.aiSummary = summary;
      incident.aiRootCause = rootCause;
      await incident.save();

      req.io.to(req.params.id).emit('incidentUpdated', incident);

      return res.status(200).json({
        incident,
        message: 'AI service temporarily unavailable. Generated summary with available data.',
        error: 'SERVICE_UNAVAILABLE',
        usingFallback: true
      });
    }

    // For any other error, log it and use fallback
    console.log('Handling generic error with fallback summary');
    try {
      const { summary, rootCause } = generateFallbackSummary(incident);
      incident.aiSummary = summary;
      incident.aiRootCause = rootCause;
      await incident.save();

      req.io.to(req.params.id).emit('incidentUpdated', incident);

      return res.status(200).json({
        incident,
        message: 'Failed to reach AI service. Generated summary with available data.',
        error: 'FALLBACK_GENERATED',
        usingFallback: true,
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
  addTimelineUpdate,
  generateSummary
};
