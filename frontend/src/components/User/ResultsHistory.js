import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import axios from 'axios';
import './ResultsHistory.css';
import './MistakesDialog.css';

const ResultsHistory = () => {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showMistakes, setShowMistakes] = useState(false);
  const [mistakesData, setMistakesData] = useState(null);
  const [loadingMistakes, setLoadingMistakes] = useState(false);
  const hasFetchedRef = useRef(false);

  const subjects = ['all', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'];

  const getSubjectIcon = (subject) => {
    const iconMap = {
      'HTML': 'fab fa-html5',
      'CSS': 'fab fa-css3-alt',
      'JavaScript': 'fab fa-js-square',
      'React': 'fab fa-react',
      'Node.js': 'fab fa-node-js',
      'MongoDB': 'fas fa-database'
    };
    return iconMap[subject] || 'fas fa-book-open';
  };

  const getSubjectColor = (subject) => {
    const colorMap = {
      'HTML': '#e34c26',
      'CSS': '#264de4',
      'JavaScript': '#f7df1e',
      'React': '#61dafb',
      'Node.js': '#339933',
      'MongoDB': '#47a248'
    };
    return colorMap[subject] || '#667eea';
  };

  // Fetch results when component mounts or selectedSubject changes
  useEffect(() => {
    fetchResults();
    fetchStats();
  }, [selectedSubject]);

  // Refresh results when navigating to this page (e.g., after taking a test)
  useEffect(() => {
    // Fetch results when component mounts or when location changes
    fetchResults();
    fetchStats();
  }, [location.pathname]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const url =
        selectedSubject === 'all'
          ? 'http://localhost:5000/api/results/my-results'
          : `http://localhost:5000/api/results/my-results?subject=${selectedSubject}`;
      
      console.log('Fetching results - URL:', url);
      console.log('Selected subject:', selectedSubject);
      
      const response = await axios.get(url);
      
      console.log('Results received:', response.data);
      console.log('Results count:', response.data.length);
      if (response.data.length > 0) {
        console.log('Result subjects:', response.data.map(r => r.subject));
      } else {
        console.log('No results found!');
      }
      
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
      console.error('Error response:', error.response?.data);
      setResults([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/results/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  const handleViewMistakes = async (resultId) => {
    setLoadingMistakes(true);
    setShowMistakes(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/results/${resultId}`);
      setMistakesData(response.data);
    } catch (error) {
      console.error('Error fetching mistakes:', error);
      console.error('Error response:', error.response?.data);
      await showAlert('Failed to load mistakes: ' + (error.response?.data?.message || error.message), 'error');
      setShowMistakes(false);
    } finally {
      setLoadingMistakes(false);
    }
  };

  const handleCloseMistakes = () => {
    setShowMistakes(false);
    setMistakesData(null);
  };

  const handleDownloadPDF = async () => {
    if (!mistakesData) return;
    
    // Debug: Log the mistakesData structure
    console.log('=== PDF Generation - Full mistakesData ===');
    console.log('mistakesData:', mistakesData);
    console.log('mistakesData.answers:', mistakesData.answers);
    mistakesData.answers?.forEach((answer, idx) => {
      console.log(`Answer ${idx + 1}:`, {
        hasQuestion: !!answer.question,
        questionText: answer.question?.question,
        questionOptions: answer.question?.options,
        optionsLength: answer.question?.options?.length,
        optionsType: Array.isArray(answer.question?.options) ? 'array' : typeof answer.question?.options,
        fullQuestion: answer.question
      });
    });
    
    try {
      // Dynamically import jsPDF
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Helper function to clean text and remove HTML entities
      // But preserve HTML tags (like <p>, <div>) as they're part of the content
      const cleanText = (text, preserveTags = false) => {
        if (!text) return '';
        if (typeof text !== 'string') {
          text = String(text);
        }
        
        if (preserveTags) {
          // For options, preserve HTML tags - just decode entities
          return text.replace(/&nbsp;/g, ' ')
                     .replace(/&amp;/g, '&')
                     .replace(/&quot;/g, '"')
                     .replace(/&#39;/g, "'")
                     .replace(/&#x27;/g, "'")
                     .replace(/&apos;/g, "'")
                     .trim();
        } else {
          // For regular text, decode HTML entities normally
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = text;
          let cleaned = tempDiv.textContent || tempDiv.innerText || '';
          cleaned = cleaned.replace(/&nbsp;/g, ' ')
                           .replace(/&amp;/g, '&')
                           .replace(/&quot;/g, '"')
                           .replace(/&#39;/g, "'")
                           .replace(/&#x27;/g, "'")
                           .replace(/&apos;/g, "'")
                           .trim();
          return cleaned || '';
        }
      };
      
      // Helper function to split long text into multiple lines
      const splitText = (text, maxWidth) => {
        if (!text) return [''];
        try {
          const textStr = String(text);
          const words = textStr.split(' ');
          const lines = [];
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            try {
              const testWidth = doc.getTextWidth(testLine);
              
              if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            } catch (err) {
              // If getTextWidth fails, just add the word
              currentLine = testLine;
            }
          });
          
          if (currentLine) {
            lines.push(currentLine);
          }
          
          return lines.length > 0 ? lines : [textStr];
        } catch (err) {
          console.error('Error in splitText:', err, 'text:', text);
          return [String(text || '')];
        }
      };
      
      const wrongAnswers = mistakesData.answers.filter(a => !a.isCorrect);
      
      // Set up PDF styling
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const lineHeight = 7;
      const fontSize = 11;
      const titleSize = 16;
      const maxTextWidth = pageWidth - (margin * 2) - 10;
      
      // Title
      doc.setFontSize(titleSize);
      doc.setFont(undefined, 'bold');
      doc.text('Quiz Mistakes Report', margin, yPos);
      yPos += lineHeight + 5;
      
      // Info section
      doc.setFontSize(fontSize);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Subject: ${cleanText(mistakesData.subject)}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Score: ${mistakesData.score}%`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Date: ${cleanText(formatDate(mistakesData.createdAt))}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Wrong Answers: ${wrongAnswers.length}`, margin, yPos);
      yPos += lineHeight + 8;
      
      // Wrong answers
      wrongAnswers.forEach((answer, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = margin;
        }
        
        // Get question data - use EXACTLY same approach as MistakesDialog (line 623-625)
        const questionText = answer.question?.question || 'Question not available';
        const questionOptions = answer.question?.options || []; // EXACT same as dialog line 624
        const questionExplanation = answer.question?.explanation || null;
        
        // Clean question text and explanation (but preserve HTML tags in options)
        const cleanedQuestionText = cleanText(questionText);
        const cleanedExplanation = questionExplanation ? cleanText(questionExplanation) : null;
        
        // Process options - preserve HTML tags like <p>, <div>, etc.
        const processedOptions = Array.isArray(questionOptions) && questionOptions.length > 0
          ? questionOptions.map(opt => {
              if (opt === null || opt === undefined) return '';
              // Only decode HTML entities, don't strip tags
              return String(opt)
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&#x27;/g, "'")
                .replace(/&apos;/g, "'")
                .trim();
            })
          : [];
        
        // Question number and text
        doc.setFontSize(fontSize + 1);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        const questionLines = splitText(`${index + 1}. ${cleanedQuestionText}`, maxTextWidth);
        questionLines.forEach(line => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });
        yPos += 5;
        
        // Options - Display ALL options (use processedOptions which preserves HTML tags)
        doc.setFontSize(fontSize);
        doc.setFont(undefined, 'normal');
        
        if (processedOptions.length > 0) {
          processedOptions.forEach((option, idx) => {
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = margin;
            }
            
            const optionLetter = String.fromCharCode(65 + idx);
            // Option is already processed and cleaned (preserves HTML tags)
            const optionValue = option && option.trim() ? option.trim() : '(empty)';
            let optionText = `${optionLetter}. ${optionValue}`;
            
            // Add markers for correct/selected answers
            if (idx === answer.correctAnswer) {
              optionText += ' [CORRECT]';
              doc.setTextColor(0, 128, 0); // Green
            } else if (idx === answer.selectedAnswer) {
              optionText += ' [YOUR ANSWER]';
              doc.setTextColor(255, 0, 0); // Red
            } else {
              doc.setTextColor(0, 0, 0); // Black
            }
            
            // Split option text if it's too long
            const optionMaxWidth = pageWidth - (margin + 10) - margin;
            const optionLines = splitText(optionText, optionMaxWidth);
            optionLines.forEach(line => {
              if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
              }
              const trimmedLine = line ? line.trim() : '';
              if (trimmedLine) {
                doc.text(trimmedLine, margin + 10, yPos);
                yPos += lineHeight;
              }
            });
            
            doc.setTextColor(0, 0, 0); // Reset to black after each option
          });
        } else {
          // If no options found, show a message
          doc.setTextColor(100, 100, 100);
          doc.text('Options not available', margin + 10, yPos);
          yPos += lineHeight;
          doc.setTextColor(0, 0, 0);
        }
        
        yPos += 5;
        
        // Explanation - properly aligned
        if (questionExplanation && questionExplanation.trim()) {
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = margin;
          }
          
          // Explanation label - aligned with question
          doc.setFontSize(fontSize);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('Explanation:', margin, yPos);
          yPos += lineHeight + 3;
          
          // Explanation text - aligned with options (margin + 10)
          doc.setFontSize(fontSize);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(0, 0, 0); // Use black for better readability
          
          // Use same width calculation as options
          const explanationMaxWidth = pageWidth - (margin + 10) - margin;
          const explanationLines = splitText(cleanedExplanation, explanationMaxWidth);
          
          explanationLines.forEach(line => {
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = margin;
            }
            // Align with options at margin + 10, ensure text is clear
            const cleanLine = line.trim();
            if (cleanLine) {
              doc.text(cleanLine, margin + 10, yPos);
              yPos += lineHeight;
            }
          });
          
          yPos += 10; // Space after explanation
          doc.setTextColor(0, 0, 0); // Reset to black
          doc.setFontSize(fontSize); // Ensure font size is consistent
        } else {
          yPos += 5;
        }
      });
      
      // Save PDF
      const fileName = `mistakes-${mistakesData.subject}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        mistakesData: mistakesData
      });
      await showAlert('Failed to generate PDF: ' + (error.message || 'Unknown error') + '. Check console for details.', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="results-history">
      <header className="results-header">
        <div className="results-header-content">
          <h1><i className="fas fa-bullseye"></i> Quizapp</h1>
          <div className="results-actions">
            <button 
              onClick={() => navigate('/user')} 
              className="dashboard-link-btn"
            >
              <i className="fas fa-home"></i> Dashboard
            </button>
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

      <div className="results-container">
        {stats && (
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon"><i className="fas fa-file-alt"></i></div>
              <div className="stat-info">
                <div className="stat-number">{stats.totalTests}</div>
                <div className="stat-label">Total Tests</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <div className="stat-number">{stats.averageScore}%</div>
                <div className="stat-label">Average Score</div>
              </div>
            </div>
          </div>
        )}

        <div className="results-filters">
          <h3>Filter by Subject</h3>
          <div className="subject-filters">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`filter-btn ${selectedSubject === subject ? 'active' : ''}`}
              >
                {subject === 'all' ? (
                  <><i className="fas fa-list"></i> All</>
                ) : (
                  <><i className={getSubjectIcon(subject)} style={{ color: getSubjectColor(subject) }}></i> {subject}</>
                )}
              </button>
            ))}
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <span>Loading results...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-results">
              <p>No test results found.</p>
              <button onClick={() => navigate('/user')} className="start-quiz-btn">
                Start a Quiz
              </button>
            </div>
          ) : (
            <div className="results-list">
              {results.map((result) => (
                <div key={result._id} className="result-card">
                  <div className="result-header">
                    <div className="result-subject">
                      <div className="subject-badge-wrapper">
                        <i className={`subject-icon ${getSubjectIcon(result.subject)}`} style={{ color: getSubjectColor(result.subject) }}></i>
                        <span className="subject-badge">{result.subject}</span>
                      </div>
                      <span className="result-date">{formatDate(result.createdAt)}</span>
                    </div>
                    <div
                      className="result-score"
                      style={{ color: getScoreColor(result.score) }}
                    >
                      {result.score}%
                    </div>
                  </div>
                  <div className="result-details">
                    <div className="detail-item">
                      <span className="detail-label">Correct:</span>
                      <span className="detail-value">{result.correctCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Incorrect:</span>
                      <span className="detail-value">
                        {result.totalQuestions - result.correctCount}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total:</span>
                      <span className="detail-value">{result.totalQuestions}</span>
                    </div>
                    {result.timeSpent > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Time:</span>
                        <span className="detail-value">{formatTime(result.timeSpent)}</span>
                      </div>
                    )}
                  </div>
                  <div className="result-actions">
                    <button 
                      onClick={() => handleViewMistakes(result._id)}
                      className="view-mistakes-btn"
                    >
                      <i className="fas fa-exclamation-circle"></i> View Mistakes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showMistakes && (
        <MistakesDialog
          data={mistakesData}
          loading={loadingMistakes}
          onClose={handleCloseMistakes}
          onDownloadPDF={handleDownloadPDF}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

const MistakesDialog = ({ data, loading, onClose, onDownloadPDF, formatDate }) => {
  const wrongAnswers = data?.answers?.filter(a => !a.isCorrect) || [];
  

  if (!data) return null;

  return (
    <div className="mistakes-dialog-overlay" onClick={onClose}>
      <div className="mistakes-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="mistakes-dialog-header">
          <h2>
            <i className="fas fa-exclamation-triangle"></i> Mistakes Review
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="mistakes-dialog-info">
          <div className="info-item">
            <span className="info-label">Subject:</span>
            <span className="info-value">{data.subject}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Score:</span>
            <span className="info-value">{data.score}%</span>
          </div>
          <div className="info-item">
            <span className="info-label">Date:</span>
            <span className="info-value">{formatDate(data.createdAt)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Wrong Answers:</span>
            <span className="info-value">{wrongAnswers.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="mistakes-loading">
            <div className="loading-spinner"></div>
            <span>Loading mistakes...</span>
          </div>
        ) : wrongAnswers.length === 0 ? (
          <div className="no-mistakes">
            <i className="fas fa-check-circle"></i>
            <p>No mistakes! Great job!</p>
          </div>
        ) : (
          <>
            <div className="mistakes-list">
              {wrongAnswers.map((answer, index) => {
                // Access question data from the question object
                const questionText = answer.question?.question || 'Question not available';
                const questionOptions = answer.question?.options || [];
                const questionExplanation = answer.question?.explanation || null;
                
                return (
                <div key={index} className="mistake-item">
                  <div className="mistake-question">
                    <span className="mistake-number">{index + 1}.</span>
                    <span className="mistake-text">{questionText}</span>
                  </div>
                  {questionOptions.length > 0 && (
                    <div className="all-options">
                      <div className="options-label">Options:</div>
                      <div className="options-list">
                        {questionOptions.map((option, idx) => (
                          <div 
                            key={idx} 
                            className={`option-item ${
                              idx === answer.correctAnswer ? 'correct-option' : 
                              idx === answer.selectedAnswer ? 'selected-option' : ''
                            }`}
                          >
                            <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                            <span className="option-text">{option}</span>
                            {idx === answer.correctAnswer && <i className="fas fa-check correct-mark"></i>}
                            {idx === answer.selectedAnswer && idx !== answer.correctAnswer && <i className="fas fa-times wrong-mark"></i>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionExplanation && (
                    <div className="mistake-explanation">
                      <i className="fas fa-lightbulb"></i>
                      <span className="explanation-text">{questionExplanation}</span>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
            <div className="mistakes-dialog-actions">
              <button onClick={onDownloadPDF} className="download-btn">
                <i className="fas fa-file-pdf"></i> Download as PDF
              </button>
              <button onClick={onClose} className="close-dialog-btn">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsHistory;

