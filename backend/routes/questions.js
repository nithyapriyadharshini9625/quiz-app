const express = require('express');
const Question = require('../models/Question');
const { auth, adminAuth } = require('../middleware/auth');
const { canDelete, canCreate, canEdit } = require('../middleware/permissions');

const router = express.Router();

// Get question statistics by subject (Admin, Super Admin, Manager)
router.get('/stats/by-subject', adminAuth, async (req, res) => {
  try {
    const subjects = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'];
    const stats = {};
    
    // Get total count
    const totalQuestions = await Question.countDocuments();
    console.log('Total questions:', totalQuestions);
    
    // Get count for each subject
    for (const subject of subjects) {
      const count = await Question.countDocuments({ subject });
      stats[subject] = count;
      console.log(`Subject: ${subject}, Count: ${count}`);
    }
    
    const result = {
      total: totalQuestions,
      bySubject: stats
    };
    
    console.log('Stats result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error in stats endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all questions (Admin, Super Admin, Manager)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { subject } = req.query;
    const query = subject ? { subject } : {};
    const questions = await Question.find(query).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get questions by subject (User)
router.get('/subject/:subject', auth, async (req, res) => {
  try {
    const { subject } = req.params;
    const questions = await Question.find({ subject }).select('-correctAnswer -explanation');
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single question (Admin)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create question (Admin, Super Admin, Manager)
router.post('/', adminAuth, canCreate, async (req, res) => {
  try {
    const { question, subject, options, correctAnswer, explanation } = req.body;

    if (!question || !subject || !options || correctAnswer === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (options.length !== 4) {
      return res.status(400).json({ message: 'Question must have exactly 4 options' });
    }

    if (correctAnswer < 0 || correctAnswer > 3) {
      return res.status(400).json({ message: 'Correct answer must be between 0 and 3' });
    }

    const newQuestion = new Question({
      question,
      subject,
      options,
      correctAnswer,
      explanation
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update question (Admin, Super Admin, Manager)
router.put('/:id', adminAuth, canEdit, async (req, res) => {
  try {
    const { question, subject, options, correctAnswer, explanation } = req.body;

    const updateData = {};
    if (question) updateData.question = question;
    if (subject) updateData.subject = subject;
    if (options) {
      if (options.length !== 4) {
        return res.status(400).json({ message: 'Question must have exactly 4 options' });
      }
      updateData.options = options;
    }
    if (correctAnswer !== undefined) {
      if (correctAnswer < 0 || correctAnswer > 3) {
        return res.status(400).json({ message: 'Correct answer must be between 0 and 3' });
      }
      updateData.correctAnswer = correctAnswer;
    }
    if (explanation !== undefined) updateData.explanation = explanation;

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete question (Admin and Super Admin only - Manager cannot delete)
router.delete('/:id', adminAuth, canDelete, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit answers and get results (User)
router.post('/submit', auth, async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionId, selectedAnswer }, ...]

    const results = [];
    let correctCount = 0;

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (question) {
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) correctCount++;
        results.push({
          questionId: question._id,
          question: question.question,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation
        });
      }
    }

    // Calculate score - handle division by zero if no answers provided
    const score = answers.length > 0 ? (correctCount / answers.length) * 100 : 0;

    res.json({
      score: Math.round(score),
      correctCount,
      totalQuestions: answers.length,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

