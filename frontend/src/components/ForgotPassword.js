import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: reset password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: email.trim()
      });

      setSuccess(response.data.message || 'OTP has been sent to your email address.');
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim()
      });

      if (response.data.verified) {
        setSuccess('OTP verified successfully! Please set your new password.');
        setStep(3);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword
      });

      setSuccess(response.data.message || 'Password has been reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>🔐 Forgot Password</h1>
          <p>
            {step === 1 && 'Enter your email to receive an OTP'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Set your new password'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="forgot-password-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner"></span>
              ) : (
                'Send OTP'
              )}
            </button>

            <Link to="/login" className="back-to-login">
              ← Back to Login
            </Link>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="forgot-password-form">
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                autoFocus
                className="otp-input"
              />
              <p className="otp-hint">Check your email for the 6-digit OTP code</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner"></span>
              ) : (
                'Verify OTP'
              )}
            </button>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="back-btn"
              >
                ← Change Email
              </button>
              <button
                type="button"
                onClick={handleSendOTP}
                className="resend-btn"
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-password-form">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                minLength="6"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                minLength="6"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner"></span>
              ) : (
                'Reset Password'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(2);
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setSuccess('');
              }}
              className="back-btn"
            >
              ← Back to OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;



