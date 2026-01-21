import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const subjects = [
    { name: 'HTML', icon: 'fab fa-html5', color: '#e34c26', gradient: 'linear-gradient(135deg, #e34c26 0%, #f06529 100%)' },
    { name: 'CSS', icon: 'fab fa-css3-alt', color: '#264de4', gradient: 'linear-gradient(135deg, #264de4 0%, #2965f1 100%)' },
    { name: 'JavaScript', icon: 'fab fa-js-square', color: '#f7df1e', gradient: 'linear-gradient(135deg, #f7df1e 0%, #f0db4f 100%)' },
    { name: 'React', icon: 'fab fa-react', color: '#61dafb', gradient: 'linear-gradient(135deg, #61dafb 0%, #00d8ff 100%)' },
    { name: 'Node.js', icon: 'fab fa-node-js', color: '#339933', gradient: 'linear-gradient(135deg, #339933 0%, #68a063 100%)' },
    { name: 'MongoDB', icon: 'fas fa-database', color: '#47a248', gradient: 'linear-gradient(135deg, #47a248 0%, #589636 100%)' },
  ];

  const handleSubjectClick = (subject) => {
    navigate(`/quiz/${subject}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Show loading state if auth is still loading
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show error if user is not available
  if (!user) {
    console.error('UserDashboard: User object is null or undefined');
    return (
      <div className="error-container">
        <p>User data not available. Please login again.</p>
        <button 
          onClick={() => navigate('/login', { replace: true })}
          className="error-login-btn"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="user-dashboard" style={{ minHeight: '100vh', position: 'relative', zIndex: 100 }}>
      <header className="user-header">
        <div className="user-header-content">
          <h1><i className="fas fa-bullseye"></i> Quizapp</h1>
          <div className="user-actions">
            <div className="user-info-header">
              <i className="fas fa-user user-icon"></i>
              <span className="welcome-text">{user?.username || 'No username'}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="user-container">
        <div className="welcome-section">
          <h2>Choose a Subject to Start Your Quiz</h2>
          <p>Test your knowledge and improve your skills!</p>
          <button
            onClick={() => navigate('/user/results')}
            className="view-results-header-btn"
          >
            <i className="fas fa-chart-bar"></i> View My Results
          </button>
        </div>

        <div className="subjects-grid">
          {subjects.length > 0 ? (
            subjects.map((subject, index) => (
              <div
                key={subject.name}
                className="subject-card"
                onClick={() => handleSubjectClick(subject.name)}
                style={{ 
                  '--subject-color': subject.color,
                  '--subject-gradient': subject.gradient,
                  '--animation-delay': `${index * 0.1}s`
                }}
              >
                <div className="subject-icon-wrapper">
                  <div className="subject-icon-bg"></div>
                  <div className="subject-icon">
                    <i className={subject.icon}></i>
                  </div>
                </div>
                <h3>{subject.name}</h3>
                <p>Click to start quiz</p>
                <div className="subject-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
                <div className="card-shine"></div>
              </div>
            ))
          ) : (
            <div className="no-subjects-message">
              No subjects available. Please contact administrator.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

