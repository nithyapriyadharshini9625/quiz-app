const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB']
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  correctCount: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedAnswer: Number,
    correctAnswer: Number,
    isCorrect: Boolean
  }],
  timeSpent: {
    type: Number, // in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
resultSchema.index({ userId: 1, subject: 1, createdAt: -1 });

module.exports = mongoose.model('Result', resultSchema);

