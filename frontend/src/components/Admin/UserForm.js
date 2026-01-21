import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './UserForm.css';

const UserForm = ({ user, onClose, onSubmit }) => {
  // Initialize form with EMPTY values - ALWAYS start completely empty
  // The useEffect will populate if editing, or keep empty if creating
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);

  // Reset form function - completely clear all fields
  const resetForm = useCallback(() => {
    const emptyForm = {
      username: '',
      email: '',
      password: '',
      newPassword: '',
      role: 'user',
    };
    setFormData(emptyForm);
    setError('');
    setSuccess('');
    setIsPasswordChanged(false);
    setLoading(false);
  }, []);

  // Track if form has been initialized to prevent clearing while user is typing
  const isInitializedRef = useRef(false);

  // Reset form immediately when component mounts - ALWAYS reset if no user
  useEffect(() => {
    // Only run on initial mount, not on every render
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (!user) {
        // Creating new user - clear state only on mount
        setFormData({
          username: '',
          email: '',
          password: '',
          newPassword: '',
          role: 'user',
        });
        setError('');
        setSuccess('');
        setIsPasswordChanged(false);
        setLoading(false);
      }
    }
  }, []); // Run only on mount

  // Update form when user prop changes (only when switching between edit/create)
  useEffect(() => {
    // Only update when user prop actually changes, not on every render
    if (user) {
      // Editing existing user - populate form with user data
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        newPassword: '', // Empty for password input
        role: user.role || 'user',
      });
      setError('');
      setSuccess('');
      setIsPasswordChanged(false);
    } else if (isInitializedRef.current) {
      // Only reset if we're switching from editing to creating
      // Don't reset if user is already typing
      setFormData({
        username: '',
        email: '',
        password: '',
        newPassword: '',
        role: 'user',
      });
      setError('');
      setSuccess('');
      setIsPasswordChanged(false);
    }
  }, [user]); // Only depend on user prop, not clearInputFields

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    // Password validation
    if (!user) {
      // Creating new user - password is required
      if (!formData.newPassword || !formData.newPassword.trim()) {
        setError('Password is required for new users');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    } else {
      // Updating existing user - password is optional
      // If password is provided, validate it
      if (formData.newPassword && formData.newPassword.trim() && formData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      // If password is empty, we'll keep the existing password (handled in backend)
    }

    setLoading(true);

    try {
      const url = user
        ? `http://localhost:5000/api/users/${user._id}`
        : 'http://localhost:5000/api/users';

      const method = user ? 'put' : 'post';
      
      // Prepare data for submission
      let data;
      if (user) {
        // Editing existing user - password is optional
        // If password is provided, update it; otherwise keep existing password
        data = { 
          username: formData.username, 
          email: formData.email, 
          role: formData.role 
        };
        // Only include password if it was changed (not empty)
        if (formData.newPassword && formData.newPassword.trim()) {
          data.password = formData.newPassword.trim();
        }
      } else {
        // Creating new user - always include password
        data = { 
          username: formData.username, 
          email: formData.email, 
          password: formData.newPassword, 
          role: formData.role 
        };
      }

      console.log('Sending request:', { method, url, data: { ...data, password: data.password ? '***' : undefined, newPassword: undefined } });
      const response = await axios[method](url, data);
      console.log('Response received:', response.status, response.data);
      
      // Show success message
      setSuccess(user ? 'User updated successfully!' : 'User created successfully!');
      setError('');
      
      // If creating a new user, clear the form fields immediately
      if (!user) {
        resetForm();
      }
      
      // Immediately refresh data (stats and user list) without closing modal
      onSubmit(false);
      
      // Close modal after 1.5 seconds to show success message
      setTimeout(() => {
        onSubmit(true); // This will close the modal
      }, 1500);
    } catch (error) {
      console.error('Error saving user:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save user';
      setError(errorMessage);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? 'Edit User' : 'Create New User'}</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form" autoComplete="off">
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username || ''}
              onChange={handleChange}
              required
              placeholder="Enter username"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
              placeholder="Enter email"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          <div className="form-group">
            <label>
              Password {user ? '(Leave empty to keep current password)' : '*'}
            </label>
            <input
              type="password"
              name="newPassword"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              value={formData.newPassword || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                setIsPasswordChanged(true);
                setFormData({ ...formData, newPassword: newValue });
              }}
              required={!user}
              placeholder={user ? 'Enter new password to change (leave empty to keep current)' : 'Enter password'}
              minLength={formData.newPassword && formData.newPassword.length > 0 ? "6" : undefined}
            />
            <p className="password-hint">
              {user 
                ? formData.newPassword 
                  ? 'Enter new password (min 6 characters). Leave empty to keep current password.'
                  : 'Leave empty to keep the current password, or enter a new password (min 6 characters).'
                : 'Enter password (min 6 characters).'}
            </p>
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              name="role"
              value={formData.role || 'user'}
              onChange={handleChange}
              required
              autoComplete="off"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading}
              style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '0.3px' }}
            >
              {loading ? (
                <span className="btn-spinner"></span>
              ) : (
                user ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;

