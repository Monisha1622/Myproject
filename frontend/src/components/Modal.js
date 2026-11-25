import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-container"
      >
        <div className="modal-header">
          <h3 className="modal-title" data-testid="modal-title">
            {title}
          </h3>
          <button
            className="modal-close"
            onClick={onClose}
            data-testid="modal-close-button"
            type="button"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-body" data-testid="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer" data-testid="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
