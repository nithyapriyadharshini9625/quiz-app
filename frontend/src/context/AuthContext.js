import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API Base URL - can be moved to environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
      return null;
    }
  });

  // Set up axios interceptor for automatic token attachment
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Set up axios interceptor for handling 401 errors (unauthorized)
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token is invalid or expired - clear auth state
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  // Validate token and fetch user data
  const validateToken = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);

      // Fetch user data
      const response = await axios.get('/api/auth/me');
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        // Invalid response - clear auth
        handleLogout();
      }
    } catch (error) {
      // Token is invalid or expired
      console.error('Token validation failed:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // Centralized logout handler
  const handleLogout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('token');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      // Remove axios authorization header
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear state even if localStorage fails
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const login = async (email, password) => {
    try {
      // Validate input
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      const response = await axios.post('/api/auth/login', {
        email: email.trim(),
        password,
      });

      const { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        return {
          success: false,
          message: 'Invalid response from server',
        };
      }

      // Store token
      try {
        localStorage.setItem('token', newToken);
      } catch (error) {
        console.error('Error storing token:', error);
        return {
          success: false,
          message: 'Failed to save authentication token. Please check your browser settings.',
        };
      }

      // Update state
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true, user: userData };
    } catch (error) {
      // Handle different error types
      if (error.response) {
        // Server responded with error
        return {
          success: false,
          message: error.response.data?.message || 'Login failed. Please check your credentials.',
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          success: false,
          message: 'Unable to connect to server. Please check your internet connection.',
        };
      } else {
        // Something else happened
        return {
          success: false,
          message: error.message || 'An unexpected error occurred. Please try again.',
        };
      }
    }
  };

  const register = async (username, email, password, role = 'user', autoLogin = false) => {
    try {
      // Validate input
      if (!username || !email || !password) {
        return {
          success: false,
          message: 'Username, email, and password are required',
        };
      }

      const response = await axios.post('/api/auth/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        role, // Defaults to 'user' - superadmin can change via edit page
      });

      const { token: newToken, user: userData } = response.data;

      // Only auto-login if explicitly requested (for admin-created users)
      if (autoLogin && newToken && userData) {
        try {
          localStorage.setItem('token', newToken);
          setToken(newToken);
          setUser(userData);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } catch (error) {
          console.error('Error storing token:', error);
          return {
            success: true,
            user: userData,
            message: 'Account created but failed to save session. Please login manually.',
          };
        }
      }

      return { success: true, user: userData };
    } catch (error) {
      // Handle different error types
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Registration failed',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Unable to connect to server. Please check your internet connection.',
        };
      } else {
        return {
          success: false,
          message: error.message || 'An unexpected error occurred. Please try again.',
        };
      }
    }
  };

  const loginWithGoogle = async (tokenId) => {
    try {
      if (!tokenId) {
        return {
          success: false,
          message: 'Google authentication token is missing',
        };
      }

      const response = await axios.post('/api/auth/google', {
        tokenId,
      });

      const { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        return {
          success: false,
          message: 'Invalid response from server',
        };
      }

      // Store token
      try {
        localStorage.setItem('token', newToken);
      } catch (error) {
        console.error('Error storing token:', error);
        return {
          success: false,
          message: 'Failed to save authentication token. Please check your browser settings.',
        };
      }

      // Update state
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true, user: userData };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Google sign-in failed',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Unable to connect to server. Please check your internet connection.',
        };
      } else {
        return {
          success: false,
          message: error.message || 'Google sign-in failed. Please try again.',
        };
      }
    }
  };

  const logout = () => {
    handleLogout();
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated,
    hasRole,
    validateToken, // Expose for manual token validation if needed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
