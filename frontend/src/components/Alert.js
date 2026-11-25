import React from 'react';

const Alert = ({ type = 'danger', message, onClose }) => {
  if (!message) return null;

  const icons = {
    danger: '⚠️',
    success: '✅',
    warning: '⚡',
  };

  return (
    <div className={`alert alert-${type}`} data-testid={`alert-${type}`}>
      <span style={{ fontSize: '16px' }}>{icons[type] || 'ℹ️'}</span>
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'inherit',
            opacity: 0.7,
          }}
          data-testid="alert-dismiss"
          type="button"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;
