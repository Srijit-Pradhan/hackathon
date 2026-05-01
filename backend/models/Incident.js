const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  update: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'Investigating', 'Resolved'],
    default: 'Open'
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timeline: [updateSchema],
  aiSummary: {
    type: String,
    default: ''
  },
  aiRootCause: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Incident = mongoose.model('Incident', incidentSchema);
module.exports = Incident;
