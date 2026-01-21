import React, { createContext, useContext, useState, useCallback } from 'react';
import AlertDialog from '../components/AlertDialog';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    show: false,
    type: 'info',
    title: null,
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
  });

  const showAlert = useCallback((message, type = 'info', title = null, confirmText = 'OK') => {
    return new Promise((resolve) => {
      // First, close any existing alert immediately
      setAlert((prev) => {
        if (prev.show && prev.onCancel) {
          // If there's a previous alert, cancel it first
          prev.onCancel();
        }
        return { ...prev, show: false };
      });
      
      // Use a small timeout to ensure previous alert is closed
      setTimeout(() => {
        let resolved = false;
        
        const handleConfirm = () => {
          if (resolved) return;
          resolved = true;
          // Reset alert state completely
          setAlert({
            show: false,
            type: 'info',
            title: null,
            message: '',
            onConfirm: null,
            onCancel: null,
            confirmText: 'OK',
            cancelText: 'Cancel',
          });
          // Resolve after state update
          setTimeout(() => resolve(true), 0);
        };
        
        const handleCancel = () => {
          if (resolved) return;
          resolved = true;
          // Reset alert state completely
          setAlert({
            show: false,
            type: 'info',
            title: null,
            message: '',
            onConfirm: null,
            onCancel: null,
            confirmText: 'OK',
            cancelText: 'Cancel',
          });
          // Resolve after state update
          setTimeout(() => resolve(false), 0);
        };
        
        // Set alert state - always show
        setAlert({
          show: true,
          type,
          title,
          message,
          onConfirm: handleConfirm,
          onCancel: handleCancel,
          confirmText,
          cancelText: 'Cancel',
        });
      }, 50);
    });
  }, []);

  const showConfirm = useCallback((message, title = null, confirmText = 'OK', cancelText = 'Cancel') => {
    return new Promise((resolve) => {
      setAlert({
        show: true,
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          setAlert((prev) => ({ ...prev, show: false }));
          resolve(true);
        },
        onCancel: () => {
          setAlert((prev) => ({ ...prev, show: false }));
          resolve(false);
        },
        confirmText,
        cancelText,
      });
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, show: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, hideAlert }}>
      {children}
      <AlertDialog
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
      />
    </AlertContext.Provider>
  );
};

