import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import AnimatedBackground from './components/AnimatedBackground';
import Login from './components/Login';
import AdminDashboard from './components/Admin/AdminDashboard';
import UserDashboard from './components/User/UserDashboard';
import Quiz from './components/User/Quiz';
import ResultsHistory from './components/User/ResultsHistory';
import ForgotPassword from './components/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <AnimatedBackground />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/admin/*"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/user"
            element={
              <PrivateRoute role="user">
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/results"
            element={
              <PrivateRoute role="user">
                <ResultsHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/quiz/:subject"
            element={
              <PrivateRoute role="user">
                <Quiz />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;

