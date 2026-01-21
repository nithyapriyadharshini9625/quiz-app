import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QuestionForm.css';

const QuestionForm = ({ question, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    question: '',
    subject: 'HTML',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const subjects = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'];

  useEffect(() => {
    if (question) {
      setFormData({
        question: question.question,
        subject: question.subject,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
      });
    }
  }, [question]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'radio' ? parseInt(value, 10) : value,
    });
    setError('');
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.question.trim()) {
      setError('Question is required');
      return;
    }

    if (formData.options.some((opt) => !opt.trim())) {
      setError('All options are required');
      return;
    }

    setLoading(true);

    try {
      const url = question
        ? `http://localhost:5000/api/questions/${question._id}`
        : 'http://localhost:5000/api/questions';

      const method = question ? 'put' : 'post';

      await axios[method](url, formData);
      onSubmit();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{question ? 'Edit Question' : 'Add New Question'}</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="question-form">
          <div className="form-group">
            <label>Subject *</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Question *</label>
            <textarea
              name="question"
              value={formData.question}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Enter your question here..."
            />
          </div>

          <div className="form-group">
            <label>Options *</label>
            {formData.options.map((option, index) => (
              <div key={index} className="option-input-group">
                <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
                <label className="radio-label">
                  <input
                    type="radio"
                    name="correctAnswer"
                    value={index}
                    checked={formData.correctAnswer === index}
                    onChange={handleChange}
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Explanation (Optional)</label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleChange}
              rows="2"
              placeholder="Add explanation for the correct answer..."
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner"></span>
              ) : (
                question ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;

