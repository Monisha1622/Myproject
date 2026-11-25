import React from 'react';
import Modal from './Modal';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
            data-testid="cancel-confirmation-btn"
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-action-btn"
            type="button"
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <p style={{ fontSize: '14px', color: 'var(--text-main)' }} data-testid="confirmation-message">
        {message}
      </p>
    </Modal>
  );
};

export default ConfirmationModal;
