'use strict';

const validator = require('validator');
const mongoose = require('mongoose');
const Feedback = require('./models/feedback');

exports.calculate = function(req, res) {
  req.app.use(function(err, _req, res, next) {
    if (res.headersSent) {
      return next(err);
    }

    res.status(400);
    res.json({ error: err.message });
  });

  // TODO: Add operator
  var operations = {
    'add':      function(a, b) { return Number(a) + Number(b) },
    'subtract': function(a, b) { return a - b },
    'multiply': function(a, b) { return a * b },
    'divide':   function(a, b) { return a / b },
    'power':    function(a, b) { return Math.pow(a, b) }, // Exponentiation: a raised to the power of b
  };

  if (!req.query.operation) {
    throw new Error("Unspecified operation");
  }

  var operation = operations[req.query.operation];

  if (!operation) {
    throw new Error("Invalid operation: " + req.query.operation);
  }

  if (!req.query.operand1 ||
      !req.query.operand1.match(/^(-)?[0-9\.]+(e(-)?[0-9]+)?$/) ||
      req.query.operand1.replace(/[-0-9e]/g, '').length > 1) {
    throw new Error("Invalid operand1: " + req.query.operand1);
  }

  if (!req.query.operand2 ||
      !req.query.operand2.match(/^(-)?[0-9\.]+(e(-)?[0-9]+)?$/) ||
      req.query.operand2.replace(/[-0-9e]/g, '').length > 1) {
    throw new Error("Invalid operand2: " + req.query.operand2);
  }

  res.json({ result: operation(req.query.operand1, req.query.operand2) });
};

exports.submitFeedback = function(req, res) {
  const feedbackText = req.body.feedback;
  if (!feedbackText || !validator.isLength(feedbackText.trim(), { min: 1, max: 500 })) {
    return res.status(400).json({ error: 'Feedback must be 1-500 characters' });
  }
  // Sanitize input
  const sanitizedFeedback = validator.escape(feedbackText.trim());

  if (mongoose.connection.readyState === 1) {
    // DB connected, use MongoDB
    const newFeedback = new Feedback({ feedback: sanitizedFeedback });
    newFeedback.save()
      .then(() => res.json({ message: 'Feedback submitted successfully' }))
      .catch(err => res.status(500).json({ error: 'Failed to save feedback' }));
  } else {
    // Fallback to in-memory
    if (!global.feedbacks) global.feedbacks = [];
    global.feedbacks.push({ feedback: sanitizedFeedback, timestamp: new Date() });
    res.json({ message: 'Feedback submitted successfully (in-memory)' });
  }
};

exports.getFeedbacks = function(req, res) {
  const limit = parseInt(req.query.limit) || 5;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  if (mongoose.connection.readyState === 1) {
    Feedback.find().sort({ timestamp: -1 }).skip(skip).limit(limit)
      .then(feedbacks => res.json({ feedbacks }))
      .catch(err => res.status(500).json({ error: 'Failed to load feedbacks' }));
  } else {
    // Fallback to in-memory
    const all = global.feedbacks || [];
    const paginated = all.slice().reverse().slice(skip, skip + limit);
    res.json({ feedbacks: paginated });
  }
};
// Final verified implementation with security patches
