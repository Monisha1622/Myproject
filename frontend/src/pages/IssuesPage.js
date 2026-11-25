import React, { useState, useEffect, useCallback } from 'react';
import { issueService, memberService, bookService } from '../services/api';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const IssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filtering & Search
  const [statusFilter, setStatusFilter] = useState(''); // '', 'issued', 'returned', 'overdue'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Issue Book Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [booksList, setBooksList] = useState([]);
  const [issueForm, setIssueForm] = useState({
    member_id: '',
    book_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [issueFormErrors, setIssueFormErrors] = useState({});
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Return Book Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Issue Details Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await issueService.getIssues({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page,
        limit: 10,
      });
      if (res.success) {
        setIssues(res.issues);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.totalRecords || 0);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load loan transactions.' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Load members and available books when opening Issue Modal
  const handleOpenIssueModal = async () => {
    setIssueFormErrors({});
    setIsIssueModalOpen(true);
    try {
      const [membersRes, booksRes] = await Promise.all([
        memberService.getMembers({ limit: 100 }),
        bookService.getBooks({ limit: 100 }),
      ]);
      if (membersRes.success) setMembersList(membersRes.members);
      if (booksRes.success) setBooksList(booksRes.books);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load members or books catalog for borrowing.' });
    }
  };

  const validateIssueForm = () => {
    const errs = {};
    if (!issueForm.member_id) errs.member_id = 'Please select a library member.';
    if (!issueForm.book_id) {
      errs.book_id = 'Please select a book to issue.';
    } else {
      const selected = booksList.find((b) => b.id === parseInt(issueForm.book_id, 10));
      if (selected && selected.available_copies <= 0) {
        errs.book_id = 'This book has 0 available copies remaining and cannot be issued.';
      }
    }
    if (!issueForm.due_date) {
      errs.due_date = 'Due date is required.';
    } else if (new Date(issueForm.due_date) < new Date(issueForm.issue_date)) {
      errs.due_date = 'Due date cannot be earlier than the issue date.';
    }

    setIssueFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmIssue = async (e) => {
    e.preventDefault();
    if (!validateIssueForm()) return;

    setSubmittingIssue(true);
    try {
      const res = await issueService.createIssue({
        member_id: parseInt(issueForm.member_id, 10),
        book_id: parseInt(issueForm.book_id, 10),
        issue_date: issueForm.issue_date,
        due_date: issueForm.due_date,
      });

      if (res.success) {
        setAlert({
          type: 'success',
          message: `Successfully issued '${res.issue.book_name}' to ${res.issue.member_name}. Available copies left: ${res.issue.remaining_available_copies}.`,
        });
        setIsIssueModalOpen(false);
        fetchIssues();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Transaction failed. Could not issue book.' });
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleOpenReturnModal = (issue) => {
    setSelectedIssue(issue);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedIssue) return;
    setSubmittingReturn(true);
    try {
      const res = await issueService.returnIssue(selectedIssue.id, { return_date: returnDate });
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Book '${selectedIssue.book_name}' returned successfully! Available copies updated to ${res.book.available_copies}.`,
        });
        setIsReturnModalOpen(false);
        fetchIssues();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Transaction failed. Could not return book.' });
      setIsReturnModalOpen(false);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleOpenDetailModal = (issue) => {
    setSelectedIssue(issue);
    setIsDetailModalOpen(true);
  };

  return (
    <div data-testid="issues-page">
      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      <div className="card">
        <div className="card-header">
          <div className="card-title">Book Issues & Returns ({totalRecords} Records)</div>
          <div className="card-actions">
            {/* Status Filter Tabs */}
            <select
              className="select-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              data-testid="issue-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="issued">Currently Issued (Active)</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue Loans</option>
            </select>

            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search member, book title, ISBN..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="issue-search-input"
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleOpenIssueModal}
              data-testid="open-issue-modal-button"
            >
              + Issue Book
            </button>
          </div>
        </div>

        <div className="table-responsive">
          {loading ? (
            <LoadingSpinner text="Loading issue transactions..." />
          ) : issues.length === 0 ? (
            <div className="empty-state" data-testid="empty-issues-state">
              <div className="empty-state-icon">🔄</div>
              <div className="empty-state-title">No issue records found</div>
              <p>Issue books to registered members to start tracking transactions.</p>
            </div>
          ) : (
            <table className="data-table" data-testid="issues-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Member Name</th>
                  <th>Book Title</th>
                  <th>ISBN</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((item) => (
                  <tr key={item.id} data-testid={`issue-row-${item.id}`}>
                    <td>#{item.id}</td>
                    <td style={{ fontWeight: 600 }}>{item.member_name}</td>
                    <td>
                      <button
                        onClick={() => handleOpenDetailModal(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          textAlign: 'left',
                        }}
                        data-testid={`issue-detail-btn-${item.id}`}
                      >
                        {item.book_name}
                      </button>
                    </td>
                    <td><code>{item.book_isbn}</code></td>
                    <td>{item.issue_date}</td>
                    <td>{item.due_date}</td>
                    <td>{item.return_date || '—'}</td>
                    <td>
                      {item.status === 'issued' ? (
                        item.is_overdue ? (
                          <span className="badge badge-overdue" data-testid={`badge-overdue-${item.id}`}>
                            Overdue
                          </span>
                        ) : (
                          <span className="badge badge-issued" data-testid={`badge-issued-${item.id}`}>
                            Issued
                          </span>
                        )
                      ) : (
                        <span className="badge badge-returned" data-testid={`badge-returned-${item.id}`}>
                          Returned
                        </span>
                      )}
                    </td>
                    <td>
                      {item.status === 'issued' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenReturnModal(item)}
                          data-testid={`return-book-btn-${item.id}`}
                        >
                          Return Book
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination" data-testid="issues-pagination">
            <span>
              Page {page} of {totalPages} ({totalRecords} Total Loans)
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                data-testid="issues-prev-page"
              >
                &larr; Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                data-testid="issues-next-page"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Issue Book Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue a Book (New Loan Transaction)"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsIssueModalOpen(false)}
              disabled={submittingIssue}
              data-testid="cancel-issue-btn"
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmIssue}
              disabled={submittingIssue}
              data-testid="confirm-issue-btn"
            >
              {submittingIssue ? 'Processing Transaction...' : 'Confirm Book Issue'}
            </button>
          </>
        }
      >
        <form onSubmit={handleConfirmIssue} data-testid="issue-form">
          <div className="form-group">
            <label className="form-label" htmlFor="issue-member-select">Select Member *</label>
            <select
              id="issue-member-select"
              className={`form-select ${issueFormErrors.member_id ? 'error' : ''}`}
              value={issueForm.member_id}
              onChange={(e) => setIssueForm({ ...issueForm, member_id: e.target.value })}
              data-testid="issue-member-select"
            >
              <option value="">-- Choose Member --</option>
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
            {issueFormErrors.member_id && (
              <div className="form-error" data-testid="issue-member-error">{issueFormErrors.member_id}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="issue-book-select">Select Book *</label>
            <select
              id="issue-book-select"
              className={`form-select ${issueFormErrors.book_id ? 'error' : ''}`}
              value={issueForm.book_id}
              onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}
              data-testid="issue-book-select"
            >
              <option value="">-- Choose Book --</option>
              {booksList.map((b) => (
                <option key={b.id} value={b.id} disabled={b.available_copies <= 0}>
                  {b.book_name} — [{b.available_copies} of {b.total_copies} available]
                </option>
              ))}
            </select>
            {issueFormErrors.book_id && (
              <div className="form-error" data-testid="issue-book-error">{issueFormErrors.book_id}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="issue-date-input">Issue Date *</label>
              <input
                id="issue-date-input"
                type="date"
                className="form-input"
                value={issueForm.issue_date}
                onChange={(e) => setIssueForm({ ...issueForm, issue_date: e.target.value })}
                data-testid="issue-date-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="issue-due-date-input">Due Date *</label>
              <input
                id="issue-due-date-input"
                type="date"
                className={`form-input ${issueFormErrors.due_date ? 'error' : ''}`}
                value={issueForm.due_date}
                onChange={(e) => setIssueForm({ ...issueForm, due_date: e.target.value })}
                data-testid="issue-due-date-input"
              />
              {issueFormErrors.due_date && (
                <div className="form-error" data-testid="issue-due-error">{issueFormErrors.due_date}</div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Return Confirmation Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Confirm Book Return"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsReturnModalOpen(false)}
              disabled={submittingReturn}
              data-testid="cancel-return-btn"
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmReturn}
              disabled={submittingReturn}
              data-testid="confirm-return-btn"
            >
              {submittingReturn ? 'Processing Return...' : 'Confirm Return'}
            </button>
          </>
        }
      >
        {selectedIssue && (
          <div data-testid="return-confirmation-content">
            <p style={{ marginBottom: '14px', fontSize: '14px' }}>
              Are you sure you want to return this book? This will mark the loan record as <strong>Returned</strong> and increment the book's available stock count by 1.
            </p>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
              <div><strong>Book:</strong> {selectedIssue.book_name}</div>
              <div><strong>Borrower:</strong> {selectedIssue.member_name}</div>
              <div><strong>Issue Date:</strong> {selectedIssue.issue_date}</div>
              <div><strong>Due Date:</strong> {selectedIssue.due_date}</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="return-date-input">Return Date</label>
              <input
                id="return-date-input"
                type="date"
                className="form-input"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                data-testid="return-date-input"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Issue Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Loan Record Details"
        footer={
          <button
            className="btn btn-secondary"
            onClick={() => setIsDetailModalOpen(false)}
            data-testid="close-issue-detail-btn"
          >
            Close
          </button>
        }
      >
        {selectedIssue && (
          <div data-testid="issue-record-details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div><strong>Transaction ID:</strong> #{selectedIssue.id}</div>
              <div><strong>Status:</strong> <span className={`badge badge-${selectedIssue.status}`}>{selectedIssue.status}</span></div>
              <div><strong>Member Name:</strong> {selectedIssue.member_name}</div>
              <div><strong>Member Email:</strong> {selectedIssue.member_email}</div>
              <div><strong>Member Phone:</strong> {selectedIssue.member_phone}</div>
              <div><strong>Book Title:</strong> {selectedIssue.book_name}</div>
              <div><strong>ISBN:</strong> {selectedIssue.book_isbn}</div>
              <div><strong>Issue Date:</strong> {selectedIssue.issue_date}</div>
              <div><strong>Due Date:</strong> {selectedIssue.due_date}</div>
              <div><strong>Return Date:</strong> {selectedIssue.return_date || 'Not yet returned'}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IssuesPage;
