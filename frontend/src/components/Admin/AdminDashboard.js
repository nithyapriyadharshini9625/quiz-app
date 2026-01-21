import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import axios from 'axios';
import QuestionList from './QuestionList';
import QuestionForm from './QuestionForm';
import UserList from './UserList';
import UserForm from './UserForm';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' or 'users'
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [questionStats, setQuestionStats] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const { user, logout } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const navigate = useNavigate();

  const subjects = [
    { name: 'all', icon: 'fas fa-list', label: 'All Questions', color: '#667eea' },
    { name: 'HTML', icon: 'fab fa-html5', label: 'HTML', color: '#e34c26' },
    { name: 'CSS', icon: 'fab fa-css3-alt', label: 'CSS', color: '#264de4' },
    { name: 'JavaScript', icon: 'fab fa-js', label: 'JavaScript', color: '#f7df1e' },
    { name: 'React', icon: 'fab fa-react', label: 'React', color: '#61dafb' },
    { name: 'Node.js', icon: 'fab fa-node', label: 'Node.js', color: '#339933' },
    { name: 'MongoDB', icon: 'fas fa-database', label: 'MongoDB', color: '#47a248' },
  ];

  useEffect(() => {
    // Fetch question statistics on mount
    fetchQuestionStats();
    
    // If manager tries to access users tab, redirect to questions
    if (user?.role === 'manager' && activeTab === 'users') {
      setActiveTab('questions');
      return;
    }
    
    if (activeTab === 'questions') {
      console.log('AdminDashboard: Fetching questions for user role:', user?.role);
      fetchQuestions();
    } else if (activeTab === 'users' && (user?.role === 'admin' || user?.role === 'superadmin')) {
      // Only fetch users/stats for admin and superadmin (managers cannot access)
      fetchUsers();
      fetchUserStats();
    }
  }, [selectedSubject, activeTab, user?.role]);

  // Refresh statistics whenever questions array changes (after add/edit/delete)
  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestionStats();
    }
  }, [questions.length, activeTab]);

  const fetchQuestionStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/questions/stats/by-subject');
      console.log('Question Stats Response:', response.data);
      console.log('Stats structure:', {
        total: response.data?.total,
        bySubject: response.data?.bySubject,
        HTML: response.data?.bySubject?.HTML,
        CSS: response.data?.bySubject?.CSS
      });
      setQuestionStats(response.data);
    } catch (error) {
      console.error('Error fetching question stats:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      // Set empty stats on error to prevent undefined errors
      setQuestionStats({ total: 0, bySubject: {} });
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const url =
        selectedSubject === 'all'
          ? 'http://localhost:5000/api/questions/admin'
          : `http://localhost:5000/api/questions/admin?subject=${selectedSubject}`;
      const response = await axios.get(url);
      console.log('Questions fetched successfully:', response.data.length, 'questions');
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      console.error('Error response:', error.response?.data);
      await showAlert('Failed to load questions: ' + (error.response?.data?.message || error.message), 'error');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleDeleteQuestion = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this question?', 'Delete Question', 'Delete', 'Cancel');
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/questions/${id}`);
        // Refresh both questions and stats simultaneously
        await Promise.all([fetchQuestions(), fetchQuestionStats()]);
        await showAlert('Question deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting question:', error);
        await showAlert('Failed to delete question', 'error');
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingQuestion(null);
  };

  const handleFormSubmit = async () => {
    // Refresh both questions and stats after creating/editing
    await Promise.all([fetchQuestions(), fetchQuestionStats()]);
    handleFormClose();
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await axios.get('http://localhost:5000/api/users');
      console.log('Users fetched:', response.data); // Debug log
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', error.response?.data); // More debug info
      await showAlert('Failed to load users: ' + (error.response?.data?.message || error.message), 'error');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/stats/overview');
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleCreateUser = () => {
    // IMPORTANT: Clear editing user FIRST
    setEditingUser(null);
    // Use timestamp to ensure unique key every time - forces complete remount
    setFormKey(Date.now());
    // Then show form - this ensures form receives null user
    setShowUserForm(true);
  };

  const handleViewUser = async (user) => {
    try {
      // Fetch full user details including decrypted password
      const response = await axios.get(`http://localhost:5000/api/users/${user._id}`);
      setViewingUser(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      await showAlert('Failed to load user details', 'error');
    }
  };

  const handleCloseViewModal = () => {
    setViewingUser(null);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleUserFormClose = () => {
    // Clear editing user FIRST
    setEditingUser(null);
    // Increment form key to force remount next time
    setFormKey(prev => prev + 1);
    // Then close the form
    setShowUserForm(false);
  };

  const handleUserFormSubmit = async (shouldClose = true) => {
    // Refresh users and stats immediately
    await Promise.all([fetchUsers(), fetchUserStats()]);
    if (shouldClose) {
      handleUserFormClose();
    }
  };


  const handleDeleteUser = async (userId) => {
    const confirmed = await showConfirm('Are you sure you want to delete this user? This action cannot be undone.', 'Delete User', 'Delete', 'Cancel');
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${userId}`);
        fetchUsers();
        fetchUserStats();
        await showAlert('User deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        await showAlert(error.response?.data?.message || 'Failed to delete user', 'error');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1><i className="fas fa-bullseye"></i> Quizapp</h1>
          <div className="admin-actions">
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

      <div className="admin-container">
        <div className="admin-sidebar">
          <div className="sidebar-tabs">
            <button
              onClick={() => setActiveTab('questions')}
              className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
            >
              <i className="fas fa-file-alt"></i> Questions
            </button>
            {/* Only show Users tab for admin and superadmin - managers cannot access */}
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <button
                onClick={() => {
                  if (user?.role === 'admin' || user?.role === 'superadmin') {
                    setActiveTab('users');
                  }
                }}
                className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              >
                <i className="fas fa-users"></i> Users
              </button>
            )}
          </div>

          {activeTab === 'questions' && (
            <>
              <h2>Subjects</h2>
              <div className="subject-filters">
                {subjects.map((subject) => {
                  const isActive = selectedSubject === subject.name;
                  return (
                    <button
                      key={subject.name}
                      onClick={() => setSelectedSubject(subject.name)}
                      className={`subject-btn ${isActive ? 'active' : ''}`}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color}dd 100%)`,
                        borderColor: subject.color,
                        color: 'white'
                      } : {}}
                    >
                      <i className={subject.icon} style={{ color: isActive ? 'white' : subject.color }}></i> 
                      <span style={{ color: isActive ? 'white' : '#666' }}>
                        {subject.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button onClick={handleAddQuestion} className="add-question-btn">
                <i className="fas fa-plus"></i> Add New Question
              </button>
            </>
          )}

          {activeTab === 'users' && (user?.role === 'admin' || user?.role === 'superadmin') && userStats && (
            <div className="user-stats-sidebar">
              <h2>Statistics</h2>
              <div className="user-stats-cards-sidebar">
                <div className="user-stat-card-sidebar">
                  <div className="user-stat-icon-sidebar" style={{ background: '#9c27b015', color: '#9c27b0' }}>
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="user-stat-content-sidebar">
                    <div className="user-stat-value-sidebar">{userStats.totalUsers || 0}</div>
                    <div className="user-stat-label-sidebar">Total Users</div>
                  </div>
                </div>
                
                <div className="user-stat-card-sidebar">
                  <div className="user-stat-icon-sidebar" style={{ background: '#3f51b515', color: '#3f51b5' }}>
                    <i className="fas fa-user-shield"></i>
                  </div>
                  <div className="user-stat-content-sidebar">
                    <div className="user-stat-value-sidebar">{userStats.totalAdmins || 0}</div>
                    <div className="user-stat-label-sidebar">Admins</div>
                  </div>
                </div>
                
                <div className="user-stat-card-sidebar">
                  <div className="user-stat-icon-sidebar" style={{ background: '#f57c0015', color: '#f57c00' }}>
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div className="user-stat-content-sidebar">
                    <div className="user-stat-value-sidebar">{userStats.totalManagers || 0}</div>
                    <div className="user-stat-label-sidebar">Managers</div>
                  </div>
                </div>
                
                <div className="user-stat-card-sidebar">
                  <div className="user-stat-icon-sidebar" style={{ background: '#4caf5015', color: '#4caf50' }}>
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="user-stat-content-sidebar">
                    <div className="user-stat-value-sidebar">{userStats.totalRegularUsers || 0}</div>
                    <div className="user-stat-label-sidebar">Regular Users</div>
                  </div>
                </div>
                
                <div className="user-stat-card-sidebar">
                  <div className="user-stat-icon-sidebar" style={{ background: '#00bcd415', color: '#00bcd4' }}>
                    <i className="fas fa-user-plus"></i>
                  </div>
                  <div className="user-stat-content-sidebar">
                    <div className="user-stat-value-sidebar">{userStats.recentUsers || 0}</div>
                    <div className="user-stat-label-sidebar">New (7 days)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="admin-main">
          {activeTab === 'questions' && (
            <>
              {/* Statistics Cards - Only show when "All Questions" is selected */}
              {selectedSubject === 'all' && (
                <div className="question-stats-cards">
                <div className="stats-header">
                  <h2><i className="fas fa-chart-bar"></i> Question Statistics</h2>
                  <div className="total-questions-badge">
                    <span className="total-label">Total Questions</span>
                    <span className="total-value">{questionStats?.total || 0}</span>
                  </div>
                </div>
                <div className="stats-grid">
                  {subjects.filter(s => s.name !== 'all').map((subject) => {
                    // Get count from bySubject object, defaulting to 0 if not found
                    const count = questionStats?.bySubject?.[subject.name] ?? 0;
                    // Debug logging
                    if (subject.name === 'HTML' || subject.name === 'CSS') {
                      console.log(`Subject: ${subject.name}, Count: ${count}, Full stats:`, questionStats);
                    }
                    return (
                      <div 
                        key={subject.name} 
                        className="stat-card"
                        onClick={() => setSelectedSubject(subject.name)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="stat-card-icon" style={{ background: `${subject.color}15`, color: subject.color }}>
                          <i className={subject.icon}></i>
                        </div>
                        <div className="stat-card-content">
                          <div className="stat-card-label">{subject.label}</div>
                          <div className="stat-card-value">{count}</div>
                          <div className="stat-card-subtitle">Questions</div>
                        </div>
                        <div className="stat-card-arrow">
                          <i className="fas fa-chevron-right"></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
              
              {/* Only show question list when a specific subject is selected (not 'all') */}
              {selectedSubject !== 'all' && (
                <>
                  {loading ? (
                    <div className="loading">
                      <div className="loading-spinner"></div>
                      <span>Loading questions...</span>
                    </div>
                  ) : (
                    <QuestionList
                      questions={questions}
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteQuestion}
                      selectedSubject={selectedSubject}
                      userRole={user?.role}
                    />
                  )}
                </>
              )}
              
              {/* Show message when "All Questions" is selected and stats are loading */}
              {selectedSubject === 'all' && !loading && !questionStats && (
                <div className="all-questions-message">
                  <div className="message-icon">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <h3>Loading Statistics...</h3>
                  <p>Please wait while we fetch the question statistics.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'users' && (user?.role === 'admin' || user?.role === 'superadmin') && (
            <>
              <div className="users-header">
                <h2>Users</h2>
                <button onClick={handleCreateUser} className="create-user-btn">
                  <i className="fas fa-user-plus" style={{ color: 'white' }}></i> Create
                </button>
              </div>
              {usersLoading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <span>Loading users...</span>
                </div>
              ) : (
                <UserList
                  users={users}
                  onView={handleViewUser}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  userRole={user?.role}
                />
              )}
            </>
          )}
          {activeTab === 'users' && user?.role === 'manager' && (
            <div className="access-denied">
              <i className="fas fa-lock" style={{ fontSize: '48px', color: '#f44336', marginBottom: '20px' }}></i>
              <h2>Access Denied</h2>
              <p>User management is only available for Admin and Super Admin roles.</p>
              <button onClick={() => setActiveTab('questions')} className="btn-primary">
                Go to Questions
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <QuestionForm
          question={editingQuestion}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}

      {showUserForm && (
        <UserForm
          key={editingUser ? `edit-${editingUser._id}` : `create-new-${formKey}`}
          user={editingUser}
          onClose={handleUserFormClose}
          onSubmit={handleUserFormSubmit}
        />
      )}

      {/* View User Modal */}
      {viewingUser && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="close-btn" onClick={handleCloseViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="user-details-content">
              <div className="detail-row">
                <span className="detail-label">Username:</span>
                <span className="detail-value">{viewingUser.username || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{viewingUser.email || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Password:</span>
                <span className="detail-value password-value">
                  {viewingUser.password ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.9em', wordBreak: 'break-all', color: '#666' }}>
                      {viewingUser.password}
                    </span>
                  ) : (
                    <span style={{ color: '#f44336' }}>N/A (Google OAuth user)</span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value role-badge">{viewingUser.role || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registered:</span>
                <span className="detail-value">
                  {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleCloseViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

