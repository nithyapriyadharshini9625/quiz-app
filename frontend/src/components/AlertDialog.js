import React from 'react';
import './AlertDialog.css';

const AlertDialog = ({ show, type, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel' }) => {
  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && (type === 'alert' || type === 'cancel')) {
      if (onCancel) {
        onCancel();
      } else {
        onConfirm();
      }
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle"></i>;
      case 'error':
        return <i className="fas fa-exclamation-circle"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-triangle"></i>;
      case 'info':
        return <i className="fas fa-info-circle"></i>;
      case 'cancel':
        return <i className="fas fa-times-circle"></i>;
      default:
        return <i className="fas fa-bell"></i>;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      case 'cancel':
        return 'alert-cancel';
      default:
        return 'alert-default';
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else {
      onConfirm();
    }
  };

  return (
    <div className="alert-dialog-overlay" onClick={handleOverlayClick}>
      <div className={`alert-dialog ${getTypeClass()}`} onClick={(e) => e.stopPropagation()}>
        <button className="alert-dialog-close" onClick={handleClose} title="Close">
          <i className="fas fa-times"></i>
        </button>
        <div className="alert-dialog-icon">
          {getIcon()}
        </div>
        <div className="alert-dialog-content">
          {title && <h3 className="alert-dialog-title">{title}</h3>}
          <p className="alert-dialog-message">{message}</p>
        </div>
        <div className="alert-dialog-actions">
          {type === 'confirm' ? (
            <>
              <button className="alert-btn alert-btn-cancel" onClick={onCancel}>
                {cancelText}
              </button>
              <button 
                className="alert-btn alert-btn-confirm" 
                onClick={onConfirm}
                data-action={confirmText.toLowerCase() === 'delete' ? 'delete' : 'confirm'}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button 
              className="alert-btn alert-btn-confirm" 
              onClick={onConfirm}
              data-action={confirmText.toLowerCase() === 'delete' ? 'delete' : 'confirm'}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;

