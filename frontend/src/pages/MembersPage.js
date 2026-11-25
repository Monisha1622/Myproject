import React, { useState, useEffect, useCallback } from 'react';
import { memberService } from '../services/api';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formMode, setFormMode] = useState('add');

  // Form Fields
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await memberService.getMembers({
        search: search.trim() || undefined,
        page,
        limit: 10,
      });
      if (res.success) {
        setMembers(res.members);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.totalRecords || 0);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to fetch members.' });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({
      full_name: '',
      email: '',
      phone_number: '',
      address: '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m) => {
    setFormMode('edit');
    setSelectedMember(m);
    setFormData({
      full_name: m.full_name,
      email: m.email,
      phone_number: m.phone_number,
      address: m.address || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDetail = async (m) => {
    try {
      const res = await memberService.getMemberById(m.id);
      if (res.success) {
        setSelectedMember(res.member);
        setIsDetailOpen(true);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to retrieve member details.' });
    }
  };

  const handleOpenDelete = (m) => {
    setSelectedMember(m);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Please provide a valid email format.';
      }
    }
    if (!formData.phone_number.trim()) errs.phone_number = 'Phone number is required.';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (formMode === 'add') {
        const res = await memberService.createMember(formData);
        if (res.success) {
          setAlert({ type: 'success', message: 'Member registered successfully.' });
          setIsFormOpen(false);
          fetchMembers();
        }
      } else {
        const res = await memberService.updateMember(selectedMember.id, formData);
        if (res.success) {
          setAlert({ type: 'success', message: 'Member information updated successfully.' });
          setIsFormOpen(false);
          fetchMembers();
        }
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Operation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const res = await memberService.deleteMember(selectedMember.id);
      if (res.success) {
        setAlert({ type: 'success', message: `Member '${selectedMember.full_name}' deleted successfully.` });
        setIsDeleteOpen(false);
        fetchMembers();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Cannot delete member due to loan constraints.' });
      setIsDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="members-page">
      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      <div className="card">
        <div className="card-header">
          <div className="card-title">Library Members ({totalRecords} Patrons)</div>
          <div className="card-actions">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="member-search-input"
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleOpenAdd}
              data-testid="add-member-button"
            >
              + Register Member
            </button>
          </div>
        </div>

        <div className="table-responsive">
          {loading ? (
            <LoadingSpinner text="Loading member directory..." />
          ) : members.length === 0 ? (
            <div className="empty-state" data-testid="empty-members-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No members found</div>
              <p>Register new library members to enable book borrowing.</p>
            </div>
          ) : (
            <table className="data-table" data-testid="members-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} data-testid={`member-row-${m.id}`}>
                    <td>#{m.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      <button
                        onClick={() => handleOpenDetail(m)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          textAlign: 'left',
                        }}
                        data-testid={`member-detail-link-${m.id}`}
                      >
                        {m.full_name}
                      </button>
                    </td>
                    <td>{m.email}</td>
                    <td>{m.phone_number}</td>
                    <td>{m.address || '—'}</td>
                    <td>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(m)}
                          data-testid={`edit-member-btn-${m.id}`}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleOpenDelete(m)}
                          data-testid={`delete-member-btn-${m.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination" data-testid="members-pagination">
            <span>
              Page {page} of {totalPages} ({totalRecords} Total Items)
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                data-testid="members-prev-page"
              >
                &larr; Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                data-testid="members-next-page"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'add' ? 'Register New Member' : `Edit Member: ${selectedMember?.full_name}`}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
              data-testid="cancel-member-form-btn"
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmitForm}
              disabled={submitting}
              data-testid="save-member-form-btn"
            >
              {submitting ? 'Saving...' : formMode === 'add' ? 'Register Member' : 'Update Member'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmitForm} data-testid="member-form">
          <div className="form-group">
            <label className="form-label" htmlFor="member-name-input">Full Name *</label>
            <input
              id="member-name-input"
              type="text"
              className={`form-input ${formErrors.full_name ? 'error' : ''}`}
              placeholder="e.g. Alice Johnson"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              data-testid="member-form-name"
            />
            {formErrors.full_name && <div className="form-error">{formErrors.full_name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="member-email-input">Email Address (Unique) *</label>
            <input
              id="member-email-input"
              type="email"
              className={`form-input ${formErrors.email ? 'error' : ''}`}
              placeholder="alice.johnson@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="member-form-email"
            />
            {formErrors.email && <div className="form-error">{formErrors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="member-phone-input">Phone Number *</label>
            <input
              id="member-phone-input"
              type="text"
              className={`form-input ${formErrors.phone_number ? 'error' : ''}`}
              placeholder="+1-555-0101"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              data-testid="member-form-phone"
            />
            {formErrors.phone_number && <div className="form-error">{formErrors.phone_number}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="member-address-input">Mailing Address</label>
            <textarea
              id="member-address-input"
              className="form-textarea"
              rows="3"
              placeholder="Street address, City, State..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              data-testid="member-form-address"
            />
          </div>
        </form>
      </Modal>

      {/* Member Details Modal with Active Loans */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Member Profile & Active Loans"
        footer={
          <button
            className="btn btn-secondary"
            onClick={() => setIsDetailOpen(false)}
            data-testid="close-member-details-btn"
          >
            Close
          </button>
        }
      >
        {selectedMember && (
          <div data-testid="member-details-content">
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{selectedMember.full_name}</h2>
              <p style={{ color: 'var(--text-muted)' }}>{selectedMember.email} &bull; {selectedMember.phone_number}</p>
              <p style={{ color: 'var(--text-light)', fontSize: '12px' }}>{selectedMember.address || 'No address on file'}</p>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '16px 0 8px 0' }}>
              Active Borrowed Books ({selectedMember.active_loans?.length || 0})
            </h4>

            {(!selectedMember.active_loans || selectedMember.active_loans.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>This member currently has no active borrowed books.</p>
            ) : (
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>ISBN</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMember.active_loans.map((loan) => (
                    <tr key={loan.issue_id}>
                      <td style={{ fontWeight: 500 }}>{loan.book_name}</td>
                      <td><code>{loan.isbn}</code></td>
                      <td>{loan.issue_date}</td>
                      <td style={{ color: new Date(loan.due_date) < new Date() ? 'var(--danger)' : 'inherit' }}>
                        {loan.due_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Member"
        message={`Are you sure you want to delete '${selectedMember?.full_name}'? The database will prevent deletion if this member has active or historical loan records.`}
        confirmText="Delete Member"
        isDanger={true}
        loading={submitting}
      />
    </div>
  );
};

export default MembersPage;
