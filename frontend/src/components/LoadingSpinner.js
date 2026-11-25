import React from 'react';

const LoadingSpinner = ({ text = 'Loading data...' }) => {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }} data-testid="loading-spinner">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
