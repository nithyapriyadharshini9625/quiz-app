import React, { useState, useEffect } from 'react';
import './QuestionList.css';

const QuestionList = ({ questions, onEdit, onDelete, selectedSubject, userRole }) => {
  // Manager can delete questions (full access to questions module)
  const canDelete = ['admin', 'superadmin', 'manager'].includes(userRole);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;

  // Reset to page 1 when questions list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [questions.length, selectedSubject]);

  if (questions.length === 0) {
    return (
      <div className="empty-state">
        <p>No questions found for {selectedSubject === 'all' ? 'any subject' : selectedSubject}.</p>
        <p>Click "Add New Question" to get started!</p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Format options as a list
  const formatOptions = (options) => {
    return options.map((option, index) => {
      const label = String.fromCharCode(65 + index); // A, B, C, D
      return `${label}. ${option}`;
    }).join(' | ');
  };

  // Get the correct answer label
  const getCorrectAnswer = (correctAnswerIndex) => {
    return String.fromCharCode(65 + correctAnswerIndex); // A, B, C, or D
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  };

  return (
    <div className="question-list">
      <h2>
        {selectedSubject === 'all' ? 'All Questions' : `${selectedSubject} Questions`} ({questions.length})
      </h2>
      
      <div className="questions-table-container">
        <table className="questions-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Question</th>
              <th>Options</th>
              <th>Answer</th>
              <th>Explanation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentQuestions.map((question, index) => (
              <tr key={question._id}>
                <td className="sno-cell">
                  {indexOfFirstQuestion + index + 1}
                </td>
                <td className="question-cell">
                  <div className="question-content">
                    <span className="subject-badge">{question.subject}</span>
                    <span className="question-text">{question.question}</span>
                  </div>
                </td>
                <td className="options-cell">
                  <div className="options-list">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="option-item">
                        <span className="option-label">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="answer-cell">
                  <span className="correct-answer-badge">
                    {getCorrectAnswer(question.correctAnswer)}
                  </span>
                </td>
                <td className="explanation-cell">
                  {question.explanation ? (
                    <span className="explanation-text">{question.explanation}</span>
                  ) : (
                    <span className="no-explanation">-</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(question)}
                      className="edit-question-btn"
                      title="Edit Question"
                      onMouseEnter={(e) => {
                        const icon = e.currentTarget.querySelector('i');
                        if (icon) icon.style.color = '#1565c0';
                      }}
                      onMouseLeave={(e) => {
                        const icon = e.currentTarget.querySelector('i');
                        if (icon) icon.style.color = '#2196f3';
                      }}
                    >
                      <i className="fas fa-edit" style={{ color: '#2196f3' }}></i>
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => onDelete(question._id)}
                        className="delete-question-btn"
                        title="Delete Question"
                        onMouseEnter={(e) => {
                          const icon = e.currentTarget.querySelector('i');
                          if (icon) icon.style.color = '#c62828';
                        }}
                        onMouseLeave={(e) => {
                          const icon = e.currentTarget.querySelector('i');
                          if (icon) icon.style.color = '#f44336';
                        }}
                      >
                        <i className="fas fa-trash" style={{ color: '#f44336' }}></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {indexOfFirstQuestion + 1} to {Math.min(indexOfLastQuestion, questions.length)} of {questions.length} questions
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              ← Previous
            </button>
            
            <div className="page-numbers">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`page-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionList;
