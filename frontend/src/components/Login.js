import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect if already authenticated
  // Redirect if already authenticated
  // Managers should go to admin dashboard (same as admin)
  useEffect(() => {
    if (isAuthenticated() && user) {
      const isAdminOrManager = user.role === 'admin' || user.role === 'manager';
      const redirectPath = isAdminOrManager ? '/admin' : '/user';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isAuthenticated, navigate]);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  const formRef = useRef(null);
  const hasClearedOnMountRef = useRef(false);
  const previousUserRef = useRef(user);
  const [formKey, setFormKey] = useState(0);

  // Aggressive form clearing function
  const clearAllInputs = () => {
    // Clear React state FIRST
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user',
    });
    setError('');
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Clear all DOM inputs directly with multiple methods
      if (usernameInputRef.current) {
        usernameInputRef.current.value = '';
        usernameInputRef.current.defaultValue = '';
        usernameInputRef.current.setAttribute('value', '');
        usernameInputRef.current.removeAttribute('value');
        usernameInputRef.current.blur();
        // Force React to update
        const event = new Event('input', { bubbles: true });
        usernameInputRef.current.dispatchEvent(event);
      }
      if (emailInputRef.current) {
        emailInputRef.current.value = '';
        emailInputRef.current.defaultValue = '';
        emailInputRef.current.setAttribute('value', '');
        emailInputRef.current.removeAttribute('value');
        emailInputRef.current.blur();
        const event = new Event('input', { bubbles: true });
        emailInputRef.current.dispatchEvent(event);
      }
      if (passwordInputRef.current) {
        passwordInputRef.current.value = '';
        passwordInputRef.current.defaultValue = '';
        passwordInputRef.current.setAttribute('value', '');
        passwordInputRef.current.removeAttribute('value');
        passwordInputRef.current.blur();
        const event = new Event('input', { bubbles: true });
        passwordInputRef.current.dispatchEvent(event);
      }
      
      // Clear all inputs and selects in the form
      if (formRef.current) {
        // Reset the entire form
        formRef.current.reset();
        
        const inputs = formRef.current.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          if (input.type !== 'hidden' && 
              input.name !== 'fake-username' && 
              input.name !== 'fake-password' &&
              !input.readOnly) {
            // Clear value with multiple methods
            input.value = '';
            input.defaultValue = '';
            input.setAttribute('value', '');
            input.removeAttribute('value');
            
            // For select elements, reset to first option
            if (input.tagName === 'SELECT') {
              input.selectedIndex = 0;
              if (input.options.length > 0) {
                input.value = input.options[0].value;
              }
            }
            
            input.blur();
            
            // Trigger multiple events to notify React
            const inputEvent = new Event('input', { bubbles: true });
            const changeEvent = new Event('change', { bubbles: true });
            input.dispatchEvent(inputEvent);
            input.dispatchEvent(changeEvent);
          }
        });
      }
      
      // Force re-render by changing form key
      setFormKey(prev => prev + 1);
    });
  };

  // Clear form on initial mount (app restart)
  useEffect(() => {
    setIsLogin(true);
    
    // Clear immediately
    clearAllInputs();
    
    // Clear multiple times to prevent browser autofill
    const timeouts = [
      10, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000
    ];
    
    timeouts.forEach(delay => {
      setTimeout(() => {
        clearAllInputs();
      }, delay);
    });
    
    // Also clear on window focus (in case user switches tabs)
    const handleFocus = () => {
      if (location.pathname === '/login') {
        clearAllInputs();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Run only on mount

  // Clear form when pathname changes
  useEffect(() => {
    if (location.pathname === '/login') {
      clearAllInputs();
      setTimeout(clearAllInputs, 50);
      setTimeout(clearAllInputs, 100);
      setTimeout(clearAllInputs, 200);
    }
  }, [location.pathname]);

  // Clear form when switching between login and register
  useEffect(() => {
    clearAllInputs();
    setTimeout(clearAllInputs, 50);
    setTimeout(clearAllInputs, 100);
    setTimeout(clearAllInputs, 200);
  }, [isLogin]);

  // Prevent browser password saving
  useEffect(() => {
    if (formRef.current && isLogin) {
      // Prevent browser from detecting this as a login form
      formRef.current.setAttribute('autocomplete', 'off');
      formRef.current.setAttribute('data-form-type', 'other');
      
      // Set attributes on inputs to prevent password saving
      const emailInput = emailInputRef.current;
      const passwordInput = passwordInputRef.current;
      
      if (emailInput) {
        emailInput.setAttribute('autocomplete', 'off');
        emailInput.setAttribute('data-lpignore', 'true');
        emailInput.setAttribute('data-1p-ignore', 'true');
        emailInput.setAttribute('data-form-type', 'other');
      }
      
      if (passwordInput) {
        passwordInput.setAttribute('autocomplete', 'off');
        passwordInput.setAttribute('data-lpignore', 'true');
        passwordInput.setAttribute('data-1p-ignore', 'true');
        passwordInput.setAttribute('data-form-type', 'other');
        passwordInput.setAttribute('data-browser-ignore', 'true');
      }
    }
  }, [isLogin]);

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts && process.env.REACT_APP_GOOGLE_CLIENT_ID) {
        console.log('Initializing Google Sign-In with Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
        console.log('Current origin:', window.location.origin);
        
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            use_fedcm_for_prompt: false, // Disable FedCM to avoid errors
            auto_select: false, // Don't auto-select account
            cancel_on_tap_outside: true, // Cancel if user clicks outside
          });
          console.log('Google Sign-In initialized successfully');
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
        }
      } else {
        console.error('Google Sign-In not available:', {
          google: !!window.google,
          accounts: !!(window.google && window.google.accounts),
          clientId: !!process.env.REACT_APP_GOOGLE_CLIENT_ID
        });
      }
    };

    // Wait for Google script to load
    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      // Retry after a short delay if script hasn't loaded
      const checkInterval = setInterval(() => {
        if (window.google && window.google.accounts) {
          initializeGoogleSignIn();
          clearInterval(checkInterval);
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }
  }, []);

  const handleGoogleSignIn = async (response) => {
    setError('');
    setLoading(true);
    try {
      console.log('Google Sign-In response received:', response);
      if (!response || !response.credential) {
        console.error('No credential in response:', response);
        setError('Unable to complete Google Sign-In. Please try again or use email login.');
        setLoading(false);
        return;
      }
      
      console.log('Sending credential to backend...');
      const result = await loginWithGoogle(response.credential);
      console.log('Backend response:', result);
      
      if (result.success) {
        console.log('Login successful, redirecting...');
        // Get redirect path from location state (if redirected from protected route) or default
        // Managers should go to admin dashboard (same as admin)
        const from = location.state?.from?.pathname;
        const isAdminOrManager = result.user.role === 'admin' || result.user.role === 'manager';
        const redirectPath = from || (isAdminOrManager ? '/admin' : '/user');
        console.log('Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      } else {
        console.error('Login failed:', result.message);
        setError(result.message || 'Google Sign-In failed. Please try again or use email login.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Unable to complete Google Sign-In. Please try again or use email login.');
      setLoading(false);
    }
  };

  const triggerGoogleSignIn = () => {
    console.log('=== Google Sign-In Debug Info ===');
    console.log('Client ID from env:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    console.log('Current origin:', window.location.origin);
    console.log('Full URL:', window.location.href);
    console.log('Google object available:', !!window.google);
    console.log('Google accounts available:', !!(window.google && window.google.accounts));
    
    if (window.google && window.google.accounts && process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      setError('');
      setLoading(true);
      
      // Cancel any existing prompt first
      try {
        window.google.accounts.id.cancel();
        console.log('Cancelled any existing Google prompts');
      } catch (e) {
        console.log('Cancel failed (this is OK):', e);
      }
      
      // Small delay to ensure cancel is processed
      setTimeout(() => {
        console.log('Triggering Google Sign-In prompt...');
        try {
          window.google.accounts.id.prompt((notification) => {
            console.log('Google prompt notification:', notification);
            if (notification.isNotDisplayed()) {
              const reason = notification.getNotDisplayedReason();
              console.error('Prompt not displayed. Reason:', reason);
              
              // Log detailed troubleshooting info for developers (console only)
              if (reason === 'unregistered_origin') {
                console.error('Troubleshooting: Verify http://localhost:3000 is in Authorized JavaScript origins in Google Cloud Console');
              }
              
              // Show user-friendly error message
              let errorMsg = 'Unable to sign in with Google at this time. Please try again later or use email login.';
              if (reason === 'unregistered_origin') {
                errorMsg = 'Google Sign-In is temporarily unavailable. Please use email login instead.';
              } else if (reason === 'browser_not_supported') {
                errorMsg = 'Your browser is not supported for Google Sign-In. Please use email login.';
              } else if (reason === 'invalid_client') {
                errorMsg = 'Google Sign-In configuration error. Please use email login.';
              }
              
              setError(errorMsg);
              setLoading(false);
            } else if (notification.isSkippedMoment()) {
              console.log('Prompt skipped');
              setError('Google Sign-In was skipped. Please try again or use email login.');
              setLoading(false);
            } else if (notification.isDismissedMoment()) {
              console.log('Prompt dismissed');
              setError('Google Sign-In was cancelled. Please try again or use email login.');
              setLoading(false);
            }
            // If notification is successful, handleGoogleSignIn callback will be called automatically
          });
        } catch (promptError) {
          console.error('Error calling prompt:', promptError);
          setError('Unable to connect to Google Sign-In. Please try again or use email login.');
          setLoading(false);
        }
      }, 100);
    } else {
      const missing = [];
      if (!window.google) missing.push('Google script not loaded');
      if (!window.google?.accounts) missing.push('Google accounts API not available');
      if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) missing.push('REACT_APP_GOOGLE_CLIENT_ID not set in .env');
      console.error('Google Sign-In not configured:', missing);
      setError('Google Sign-In is currently unavailable. Please use email login.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    // Update form data immediately without any delays
    setFormData(prevFormData => ({
      ...prevFormData,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const result = await login(formData.email, formData.password);
        if (result.success) {
          // Get redirect path from location state (if redirected from protected route) or default
          // Managers should go to admin dashboard (same as admin)
          const from = location.state?.from?.pathname;
          const isAdminOrManager = ['admin', 'superadmin', 'manager'].includes(result.user.role);
          const redirectPath = from || (isAdminOrManager ? '/admin' : '/user');
          navigate(redirectPath, { replace: true });
        } else {
          setError(result.message);
        }
      } else {
        // Registration flow - don't auto-login, just create account and redirect to login
        const result = await register(
          formData.username,
          formData.email,
          formData.password,
          'user', // Always 'user' for new registrations
          false // Don't auto-login after registration
        );

        if (result.success) {
          // Show success message
          setError('');
          setSuccess('Account created successfully! Please login with your credentials.');
          // Clear form
          setFormData({
            username: '',
            email: '',
            password: '',
            role: 'user',
          });
          // Switch to login mode after a short delay
          setTimeout(() => {
            setIsLogin(true);
            setSuccess(''); // Clear success message when switching to login
          }, 2000);
        } else {
          setError(result.message);
          setSuccess('');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1><i className="fas fa-bullseye"></i> Quizapp</h1>
          <p>{isLogin ? 'Welcome Back!' : 'Create Account'}</p>
        </div>

        <form 
          key={formKey}
          ref={formRef} 
          onSubmit={handleSubmit} 
          className="login-form" 
          autoComplete="off" 
          noValidate
          data-form-type="login"
          action="javascript:void(0)"
          method="post"
        >
          {!isLogin && (
            <div className="form-group">
              <label>Username</label>
              <input
                ref={usernameInputRef}
                type="text"
                name="username"
                key={`username-${formKey}`}
                value={formData.username || ''}
                onChange={handleChange}
                required
                placeholder="Enter username"
                autoComplete="new-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
              />
            </div>
          )}

          {/* Hidden fake fields to prevent browser password saving */}
          {isLogin && (
            <>
              <input
                type="text"
                name="fake-username"
                autoComplete="username"
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
                tabIndex={-1}
                readOnly
              />
              <input
                type="password"
                name="fake-password"
                autoComplete="current-password"
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
                tabIndex={-1}
                readOnly
              />
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              ref={emailInputRef}
              type="email"
              name="email"
              id="login-email-input"
              key={`email-${formKey}`}
              value={formData.email || ''}
              onChange={handleChange}
              required
              placeholder="Enter email"
              autoComplete="new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore="true"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <label>Password</label>
              {isLogin && (
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot Password?
                </Link>
              )}
            </div>
            <input
              ref={passwordInputRef}
              type="password"
              name="password"
              id="login-password-input"
              key={`password-${formKey}`}
              value={formData.password || ''}
              onChange={handleChange}
              required
              placeholder="Enter password"
              minLength="6"
              autoComplete="new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore="true"
              data-browser-ignore="true"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-spinner"></span>
            ) : (
              isLogin ? 'Login' : 'Register'
            )}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <div id="google-signin-button" style={{ display: 'none' }}></div>
        <button
          type="button"
          onClick={triggerGoogleSignIn}
          className="google-signin-btn"
          disabled={loading}
        >
          <svg className="google-icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000" fillRule="evenodd">
              <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335"/>
              <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.84 2.2c2.07-1.9 3.26-4.7 3.26-8.55z" fill="#4285F4"/>
              <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853"/>
            </g>
          </svg>
          {loading ? (
            <span className="btn-spinner"></span>
          ) : (
            'Continue with Google'
          )}
        </button>

        <div className="toggle-form">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                // Form will be cleared by useEffect when isLogin changes
              }}
              className="toggle-btn"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

