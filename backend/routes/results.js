const express = require('express');
const mongoose = require('mongoose');
const Result = require('../models/Result');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Save test result
router.post('/', auth, async (req, res) => {
  try {
    const { subject, score, correctCount, totalQuestions, answers, timeSpent } = req.body;

    console.log('=== SAVING RESULT ===');
    console.log('User ID:', req.user._id.toString());
    console.log('Subject:', subject);
    console.log('Score:', score);
    console.log('Correct Count:', correctCount);
    console.log('Total Questions:', totalQuestions);
    console.log('Answers count:', answers?.length || 0);
    console.log('Time Spent:', timeSpent);

    // Validate required fields - allow correctCount to be 0 (no correct answers)
    if (!subject || score === undefined || correctCount === undefined || correctCount === null || !totalQuestions) {
      console.error('Validation failed - Missing required fields:', {
        subject: !!subject,
        score: score !== undefined,
        correctCount: correctCount !== undefined && correctCount !== null,
        totalQuestions: !!totalQuestions
      });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate subject matches enum
    const validSubjects = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'];
    if (!validSubjects.includes(subject)) {
      return res.status(400).json({ 
        message: `Invalid subject: ${subject}. Must be one of: ${validSubjects.join(', ')}` 
      });
    }

    // Ensure questionId is a valid ObjectId for each answer
    const formattedAnswers = (answers || []).map(answer => {
      // Convert questionId to ObjectId if it's a valid string
      let questionId = answer.questionId;
      
      if (!questionId) {
        return null;
      }
      
      if (typeof questionId === 'string') {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
          return null;
        }
        questionId = new mongoose.Types.ObjectId(questionId);
      } else if (questionId._id) {
        questionId = questionId._id;
      } else if (typeof questionId === 'object' && questionId.toString) {
        // Already an ObjectId
        questionId = questionId;
      }
      
      return {
        questionId: questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect
      };
    }).filter(answer => answer !== null);

    const result = new Result({
      userId: req.user._id,
      subject,
      score,
      correctCount,
      totalQuestions,
      answers: formattedAnswers,
      timeSpent: timeSpent || 0
    });

    await result.save();
    
    console.log('Result saved successfully!');
    console.log('Saved result ID:', result._id.toString());
    console.log('Saved result subject:', result.subject);
    console.log('Saved result score:', result.score);
    console.log('Saved result correctCount:', result.correctCount);
    
    // Populate and return the saved result with question details
    const populatedResult = await Result.findById(result._id).populate({
      path: 'answers.questionId',
      model: 'Question',
      select: 'question options correctAnswer explanation'
    });
    
    console.log('Returning populated result');
    res.status(201).json(populatedResult);
  } catch (error) {
    console.error('=== ERROR SAVING RESULT ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('User ID:', req.user?._id?.toString());
    res.status(500).json({ message: error.message });
  }
});

// Get user's test results
router.get('/my-results', auth, async (req, res) => {
  try {
    const { subject } = req.query;
    const query = { userId: req.user._id };
    if (subject && subject !== 'all') {
      // Normalize subject to match enum values (case-insensitive matching)
      const subjectMap = {
        'html': 'HTML',
        'css': 'CSS',
        'javascript': 'JavaScript',
        'react': 'React',
        'node.js': 'Node.js',
        'nodejs': 'Node.js',
        'mongodb': 'MongoDB'
      };
      const normalizedSubject = subjectMap[subject.toLowerCase()] || subject;
      query.subject = normalizedSubject;
    }

    // Debug: Check all results for this user first
    const allUserResults = await Result.find({ userId: req.user._id }).select('subject createdAt score');
    console.log('=== DEBUG: All results for user ===');
    console.log('User ID:', req.user._id.toString());
    console.log('Total results in DB:', allUserResults.length);
    allUserResults.forEach((r, idx) => {
      console.log(`Result ${idx + 1}: Subject="${r.subject}", Score=${r.score}%, Date=${r.createdAt}`);
    });

    const results = await Result.find(query)
      .sort({ createdAt: -1 })
      .select('-answers'); // Exclude detailed answers for list view

    console.log('=== Query Details ===');
    console.log('Query filter:', JSON.stringify(query));
    console.log('Filtered results count:', results.length);
    results.forEach((r, idx) => {
      console.log(`Filtered ${idx + 1}: Subject="${r.subject}", Score=${r.score}%`);
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single result with details
router.get('/:id', auth, async (req, res) => {
  try {
    const Question = require('../models/Question');
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Check if result belongs to the user
    if (result.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch all questions for the answers
    const formattedAnswers = await Promise.all(
      result.answers.map(async (answer) => {
        let questionData = null;
        let questionId = answer.questionId;

        // Handle different questionId formats - Mongoose might return ObjectId or string
        if (!questionId) {
          return {
            questionId: null,
            selectedAnswer: answer.selectedAnswer,
            correctAnswer: answer.correctAnswer,
            isCorrect: answer.isCorrect,
            question: null
          };
        }

        // Extract ObjectId if it's nested
        if (questionId && typeof questionId === 'object') {
          if (questionId._id) {
            questionId = questionId._id;
          } else if (questionId.toString) {
            questionId = questionId.toString();
          }
        }

        // Convert to ObjectId for query
        let questionObjectId;
        try {
          if (typeof questionId === 'string') {
            if (mongoose.Types.ObjectId.isValid(questionId)) {
              questionObjectId = new mongoose.Types.ObjectId(questionId);
            } else {
              return {
                questionId: questionId,
                selectedAnswer: answer.selectedAnswer,
                correctAnswer: answer.correctAnswer,
                isCorrect: answer.isCorrect,
                question: null
              };
            }
          } else {
            questionObjectId = questionId;
          }
        } catch (idError) {
          return {
            questionId: questionId,
            selectedAnswer: answer.selectedAnswer,
            correctAnswer: answer.correctAnswer,
            isCorrect: answer.isCorrect,
            question: null
          };
        }

        // Fetch the question
        try {
          const question = await Question.findById(questionObjectId).select('question options correctAnswer explanation');
          if (question) {
            // Ensure options is always an array with valid strings
            let optionsArray = [];
            if (question.options) {
              if (Array.isArray(question.options)) {
                optionsArray = question.options.map((opt, idx) => {
                  const optStr = String(opt || '').trim();
                  if (!optStr) {
                    console.warn(`Question ${questionObjectId}, Option ${idx} is empty`);
                  }
                  return optStr;
                }).filter(opt => opt.length > 0);
              } else {
                console.warn(`Question ${questionObjectId} options is not an array:`, question.options);
              }
            } else {
              console.warn(`Question ${questionObjectId} has no options field:`, question);
            }
            
            questionData = {
              question: question.question || '',
              options: optionsArray,
              explanation: question.explanation || null
            };
            
            // Debug log
            console.log(`Question ${questionObjectId} fetched:`, {
              question: questionData.question.substring(0, 50),
              optionsCount: optionsArray.length,
              options: optionsArray
            });
            
            if (optionsArray.length === 0) {
              console.error(`Question ${questionObjectId} has no valid options!`, {
                questionId: questionObjectId,
                questionDoc: question,
                optionsField: question.options
              });
            }
          } else {
            console.warn(`Question not found for ID: ${questionObjectId}`);
          }
        } catch (fetchError) {
          console.error(`Error fetching question ${questionObjectId}:`, fetchError);
        }

        return {
          questionId: questionId,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: answer.correctAnswer,
          isCorrect: answer.isCorrect,
          question: questionData
        };
      })
    );

    const formattedResult = {
      ...result.toObject(),
      answers: formattedAnswers
    };

    res.json(formattedResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's best score for a subject
router.get('/best/:subject', auth, async (req, res) => {
  try {
    const { subject } = req.params;
    const bestResult = await Result.findOne({
      userId: req.user._id,
      subject
    }).sort({ score: -1, createdAt: -1 });

    if (!bestResult) {
      return res.json({ message: 'No results found for this subject' });
    }

    res.json(bestResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get statistics for user
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user._id });

    const stats = {
      totalTests: results.length,
      averageScore: results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0,
      subjects: {}
    };

    // Calculate stats per subject
    const subjects = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'];
    subjects.forEach(subject => {
      const subjectResults = results.filter(r => r.subject === subject);
      if (subjectResults.length > 0) {
        stats.subjects[subject] = {
          testsTaken: subjectResults.length,
          averageScore: Math.round(
            subjectResults.reduce((sum, r) => sum + r.score, 0) / subjectResults.length
          ),
          bestScore: Math.max(...subjectResults.map(r => r.score))
        };
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

