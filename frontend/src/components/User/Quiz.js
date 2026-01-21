import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import axios from 'axios';
import './Quiz.css';

/**
 * Common Quiz Component for ALL Subjects
 * This component handles quiz functionality for: HTML, CSS, JavaScript, React, Node.js, MongoDB
 * Cancel and Submit button behaviors are consistent across all subjects
 */
const Quiz = () => {
  const { subject } = useParams();
  const { user, logout } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const cancelClickedRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Reset ALL flags and state when subject changes or component loads
    // This ensures cancel button works consistently every time
    cancelClickedRef.current = false;
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setShowResults(false);
    setResults(null);
    setSubmitting(false);
    setCurrentIndex(0);
    setAnswers({});
    fetchQuestions();
    setStartTime(Date.now());
    setElapsedTime(0);
  }, [subject]);

  // Timer effect
  useEffect(() => {
    if (startTime && !showResults) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, showResults]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/questions/subject/${subject}`
      );
      setQuestions(response.data);
      // Initialize answers object
      const initialAnswers = {};
      response.data.forEach((q) => {
        initialAnswers[q._id] = null;
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching questions:', error);
      await showAlert('Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex,
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async (e) => {
    // Prevent any form submission or default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Direct submission without any dialog boxes - works for all subjects
    // Submits with or without filling answers - result will be saved regardless
    // Don't submit if cancel was clicked
    if (cancelClickedRef.current) {
      return;
    }
    
    // Create new AbortController for this submission
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setSubmitting(true);
    try {
      // Check again before making API call
      if (cancelClickedRef.current || abortController.signal.aborted) {
        setSubmitting(false);
        return;
      }
      
      // Ensure we have questions to submit
      if (!questions || questions.length === 0) {
        console.error('No questions available to submit');
        setSubmitting(false);
        return;
      }
      
      // Map all questions to answers array, using -1 for unanswered questions
      // This ensures ALL questions are submitted even if user selected nothing
      // Result will be saved even if all answers are -1 (no selections)
      const answerArray = questions.map(question => ({
        questionId: question._id,
        selectedAnswer: answers[question._id] !== null && answers[question._id] !== undefined 
          ? answers[question._id] 
          : -1
      }));

      // Submit answers and get results - use AbortController to cancel if needed
      // This will work even if answerArray is empty or all answers are -1
      const response = await axios.post(
        'http://localhost:5000/api/questions/submit',
        { answers: answerArray },
        { signal: abortController.signal }
      );

      // Check again after API call - CRITICAL CHECK
      if (cancelClickedRef.current || abortController.signal.aborted) {
        setSubmitting(false);
        return;
      }

      // Calculate time spent
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      // Save result to database - no error dialogs, result saved regardless
      // Map subject to match enum exactly (case-sensitive) - ensures consistency across all subjects
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
      
      // Format answers to ensure questionId is properly structured
      const formattedAnswers = response.data.results.map(result => ({
        questionId: result.questionId,
        selectedAnswer: result.selectedAnswer !== undefined ? result.selectedAnswer : -1,
        correctAnswer: result.correctAnswer,
        isCorrect: result.isCorrect || false
      }));
      
      // Ensure all required fields are present with default values
      // Use nullish coalescing to preserve 0 values (0 is valid for score and correctCount)
      const resultData = {
        subject: normalizedSubject,
        score: response.data.score ?? 0,
        correctCount: response.data.correctCount ?? 0,
        totalQuestions: response.data.totalQuestions ?? questions.length ?? 0,
        answers: formattedAnswers,
        timeSpent: timeSpent ?? 0
      };
      
      // CRITICAL CHECK: Don't save if cancel was clicked
      if (cancelClickedRef.current || abortController.signal.aborted) {
        setSubmitting(false);
        return;
      }

      // Save result - ONLY if cancel was not clicked
      // Use AbortController to cancel request if needed
      let resultSaved = false;
      try {
        console.log('Saving result with data:', {
          subject: resultData.subject,
          score: resultData.score,
          correctCount: resultData.correctCount,
          totalQuestions: resultData.totalQuestions,
          answersCount: resultData.answers.length,
          timeSpent: resultData.timeSpent
        });
        
        const saveResponse = await axios.post(
          'http://localhost:5000/api/results',
          resultData,
          { signal: abortController.signal }
        );
        
        // Verify the result was actually saved
        if (saveResponse.data && saveResponse.data._id) {
          resultSaved = true;
          console.log('Result saved successfully:', saveResponse.data);
          console.log('Saved result ID:', saveResponse.data._id);
          console.log('Saved result subject:', saveResponse.data.subject);
        } else {
          console.error('Result save response missing ID:', saveResponse.data);
          await showAlert('Result may not have been saved. Please check your results page.', 'error');
        }
      } catch (saveError) {
        // If request was aborted, don't log as error
        if (saveError.name === 'CanceledError' || saveError.code === 'ERR_CANCELED' || abortController.signal.aborted) {
          console.log('Result save was cancelled');
          return;
        }
        // Log other errors with full details
        console.error('Error saving result:', saveError);
        console.error('Error response:', saveError.response?.data);
        console.error('Error status:', saveError.response?.status);
        console.error('Result data that failed to save:', resultData);
        
        // Show error to user
        const errorMessage = saveError.response?.data?.message || saveError.message || 'Failed to save result';
        await showAlert(`Error saving result: ${errorMessage}. Please try again.`, 'error');
        setSubmitting(false);
        return; // Don't show results if save failed
      }
      
      // Only proceed if result was successfully saved
      if (!resultSaved) {
        console.error('Result was not saved successfully');
        setSubmitting(false);
        return;
      }

      // Final check before showing results
      if (!cancelClickedRef.current && !abortController.signal.aborted) {
        setResults(response.data);
        setShowResults(true);
      }
    } catch (error) {
      // If request was aborted, don't treat as error
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
        console.log('Quiz submission was cancelled');
        return;
      }
      // Log other errors
      console.error('Error submitting quiz:', error);
      // Only show results if cancel was not clicked
      if (!cancelClickedRef.current && !abortController.signal.aborted && questions.length > 0) {
        const defaultResults = {
          score: 0,
          correctCount: 0,
          totalQuestions: questions.length,
          results: []
        };
        setResults(defaultResults);
        setShowResults(true);
      }
    } finally {
      setSubmitting(false);
      // Clear abort controller reference
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleBackToDashboard = () => {
    navigate('/user');
  };

  // Cancel button handler - COMMON for ALL quiz subjects (HTML, CSS, JavaScript, React, Node.js, MongoDB)
  // Cancel behavior: Shows alert dialog, if user confirms → redirects to subject selection page, NO results saved
  // Submit behavior: Submits directly and saves results (works independently)
  // Cancel button handler - SIMPLE and RELIABLE for ALL quiz subjects
  // When Cancel button is clicked:
  // 1. Shows alert dialog with message: "Are you sure want to quit the test"
  // 2. Button text: "Yes" (red button)
  // 3. If user clicks "Yes" → redirects to /user (quiz subject selection page), NO results saved
  // 4. If user closes dialog (X button) → stays on quiz page, test continues
  const handleCancelTest = async (e) => {
    // Prevent any form submission or default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Don't proceed if cancel was already clicked and we're navigating
    if (cancelClickedRef.current) {
      return;
    }
    
    // Always show alert - ensure it appears every time
    // Use a fresh promise each time
    const confirmed = await showAlert(
      'Are you sure want to quit the test',
      'cancel',
      'Quit Test',
      'Yes'
    );
    
    // If user clicks "Yes" button, redirect to quiz subject selection page
    if (confirmed) {
      // Set cancel flag IMMEDIATELY to prevent any results from being saved
      // This must happen BEFORE any other operations
      cancelClickedRef.current = true;
      
      // Abort any ongoing API requests immediately
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Stop any ongoing submission immediately
      setSubmitting(false);
      
      // Reset quiz state to prevent results from showing
      setShowResults(false);
      setResults(null);
      
      // Redirect to quiz subject selection page immediately
      // Use replace: true to prevent back navigation to quiz
      navigate('/user', { replace: true });
    }
    // If user closes dialog (X button), do nothing - stay on quiz page
    // The cancelClickedRef remains false, so button will work next time
  };

  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = questions.length > 0 
    ? ((currentIndex + 1) / questions.length) * 100 
    : 0;

  const answeredCount = Object.values(answers).filter((a) => a !== null).length;
  const completionPercentage = questions.length > 0 
    ? (answeredCount / questions.length) * 100 
    : 0;

  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="loading-spinner"></div>
        <p>Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-empty">
        <p>No questions available for {subject}.</p>
        <button onClick={handleBackToDashboard} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Don't show results if cancel was clicked
  if (showResults && results && !cancelClickedRef.current) {
    return (
      <div className="quiz-results">
        <div className="results-card">
          <h1>🎉 Quiz Completed!</h1>
          <div className="score-circle">
            <div className="score-value">{results.score}%</div>
            <div className="score-label">Score</div>
          </div>
          <div className="results-stats">
            <div className="stat-item">
              <span className="stat-value">{results.correctCount}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{results.totalQuestions - results.correctCount}</span>
              <span className="stat-label">Incorrect</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{results.totalQuestions}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          <div className="results-actions">
            <button onClick={handleBackToDashboard} className="back-btn">
              Back to Dashboard
            </button>
            <button onClick={() => navigate('/user/results')} className="view-results-btn">
              View All Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentQuestion._id];

  return (
    <div className="quiz-container">
      <header className="quiz-header">
        <div className="quiz-header-content">
          <h1><i className="fas fa-bullseye"></i> Quizapp</h1>
          <div className="quiz-actions">
            <div className="user-info-header">
              <i className="fas fa-user user-icon"></i>
              <span className="welcome-text">{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="quiz-progress-bar">
        <div className="quiz-progress-left">
          <div className="quiz-progress-text">
            {answeredCount} / {questions.length} answered ({Math.round(completionPercentage)}%)
          </div>
          <div className="question-counter">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>
        <div className="quiz-timer">
          <i className="fas fa-clock"></i>
          <span className="timer-text">{formatTimer(elapsedTime)}</span>
        </div>
        <div
          className="quiz-progress-fill"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>

      <div className="quiz-content">

        <div className="question-card">
          <h3 className="question-text">{currentQuestion.question}</h3>
          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${selectedAnswer === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(currentQuestion._id, index)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-navigation">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="nav-btn prev-btn"
            title="Previous"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="question-indicators">
            {questions.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''} ${
                  answers[questions[index]._id] !== null ? 'answered' : ''
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          {currentIndex === questions.length - 1 ? (
            <div className="quiz-action-buttons">
              {/* Common Submit button for ALL quiz subjects - submits directly without confirmation */}
              <button
                onClick={handleSubmit}
                disabled={submitting || cancelClickedRef.current}
                className="nav-btn submit-btn"
                type="button"
              >
                {submitting ? (
                  <span className="btn-spinner"></span>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="nav-btn next-btn"
              title="Next"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;

