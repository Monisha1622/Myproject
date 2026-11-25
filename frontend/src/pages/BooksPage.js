import React, { useState, useEffect, useCallback } from 'react';
import { bookService } from '../services/api';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'

  // Form Fields
  const [formData, setFormData] = useState({
    book_name: '',
    author: '',
    category: '',
    isbn: '',
    total_copies: 1,
    available_copies: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch books from backend API
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookService.getBooks({
        search: search.trim() || undefined,
        category: category || undefined,
        page,
        limit: 10,
      });
      if (res.success) {
        setBooks(res.books);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.totalRecords || 0);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load books from backend.' });
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({
      book_name: '',
      author: '',
      category: '',
      isbn: '',
      total_copies: 5,
      available_copies: 5,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (book) => {
    setFormMode('edit');
    setSelectedBook(book);
    setFormData({
      book_name: book.book_name,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      total_copies: book.total_copies,
      available_copies: book.available_copies,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDetail = async (book) => {
    try {
      const res = await bookService.getBookById(book.id);
      if (res.success) {
        setSelectedBook(res.book);
        setIsDetailOpen(true);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to retrieve book details.' });
    }
  };

  const handleOpenDelete = (book) => {
    setSelectedBook(book);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.book_name.trim()) errs.book_name = 'Book name is required.';
    if (!formData.author.trim()) errs.author = 'Author is required.';
    if (!formData.category.trim()) errs.category = 'Category is required.';
    if (!formData.isbn.trim()) errs.isbn = 'ISBN is required.';
    
    const total = parseInt(formData.total_copies, 10);
    if (isNaN(total) || total <= 0) {
      errs.total_copies = 'Total copies must be greater than zero.';
    }

    const available = parseInt(formData.available_copies, 10);
    if (isNaN(available) || available < 0) {
      errs.available_copies = 'Available copies cannot be negative.';
    } else if (available > total) {
      errs.available_copies = 'Available copies cannot exceed total copies.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (formMode === 'add') {
        const res = await bookService.createBook(formData);
        if (res.success) {
          setAlert({ type: 'success', message: 'Book successfully added to library catalog.' });
          setIsFormOpen(false);
          fetchBooks();
        }
      } else {
        const res = await bookService.updateBook(selectedBook.id, formData);
        if (res.success) {
          setAlert({ type: 'success', message: 'Book successfully updated.' });
          setIsFormOpen(false);
          fetchBooks();
        }
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Operation failed. Please check inputs.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBook) return;
    setSubmitting(true);
    try {
      const res = await bookService.deleteBook(selectedBook.id);
      if (res.success) {
        setAlert({ type: 'success', message: `Book '${selectedBook.book_name}' deleted successfully.` });
        setIsDeleteOpen(false);
        fetchBooks();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Cannot delete book due to constraint rules.' });
      setIsDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="books-page">
      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      <div className="card">
        <div className="card-header">
          <div className="card-title">Book Inventory ({totalRecords} Books)</div>
          <div className="card-actions">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by title, author, ISBN..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="book-search-input"
              />
            </div>

            <select
              className="select-input"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              data-testid="book-category-filter"
            >
              <option value="">All Categories</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Database Systems">Database Systems</option>
              <option value="Web Development">Web Development</option>
              <option value="DevOps">DevOps</option>
              <option value="Classic Literature">Classic Literature</option>
              <option value="Dystopian Fiction">Dystopian Fiction</option>
              <option value="Science">Science</option>
            </select>

            <button
              className="btn btn-primary"
              onClick={handleOpenAdd}
              data-testid="add-book-button"
            >
              + Add New Book
            </button>
          </div>
        </div>

        <div className="table-responsive">
          {loading ? (
            <LoadingSpinner text="Loading book catalog..." />
          ) : books.length === 0 ? (
            <div className="empty-state" data-testid="empty-books-state">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">No books found</div>
              <p>Try refining your search terms or add a new book to the library.</p>
            </div>
          ) : (
            <table className="data-table" data-testid="books-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>ISBN</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} data-testid={`book-row-${b.id}`}>
                    <td>#{b.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      <button
                        onClick={() => handleOpenDetail(b)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          textAlign: 'left',
                        }}
                        data-testid={`book-detail-link-${b.id}`}
                      >
                        {b.book_name}
                      </button>
                    </td>
                    <td>{b.author}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {b.category}
                      </span>
                    </td>
                    <td><code>{b.isbn}</code></td>
                    <td>{b.total_copies}</td>
                    <td>
                      <span className={`badge ${b.available_copies > 0 ? 'badge-stock-in' : 'badge-stock-out'}`}>
                        {b.available_copies} Left
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(b)}
                          data-testid={`edit-book-btn-${b.id}`}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleOpenDelete(b)}
                          data-testid={`delete-book-btn-${b.id}`}
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pagination" data-testid="books-pagination">
            <span>
              Page {page} of {totalPages} ({totalRecords} Total Items)
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                data-testid="books-prev-page"
              >
                &larr; Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                data-testid="books-next-page"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Book Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'add' ? 'Add New Book' : `Edit Book: ${selectedBook?.book_name}`}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
              data-testid="cancel-book-form-btn"
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmitForm}
              disabled={submitting}
              data-testid="save-book-form-btn"
            >
              {submitting ? 'Saving...' : formMode === 'add' ? 'Create Book' : 'Update Book'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmitForm} data-testid="book-form">
          <div className="form-group">
            <label className="form-label" htmlFor="book-name-input">Book Title *</label>
            <input
              id="book-name-input"
              type="text"
              className={`form-input ${formErrors.book_name ? 'error' : ''}`}
              placeholder="e.g. Clean Code"
              value={formData.book_name}
              onChange={(e) => setFormData({ ...formData, book_name: e.target.value })}
              data-testid="book-form-title"
            />
            {formErrors.book_name && <div className="form-error">{formErrors.book_name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="book-author-input">Author *</label>
            <input
              id="book-author-input"
              type="text"
              className={`form-input ${formErrors.author ? 'error' : ''}`}
              placeholder="e.g. Robert C. Martin"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              data-testid="book-form-author"
            />
            {formErrors.author && <div className="form-error">{formErrors.author}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="book-category-input">Category *</label>
              <input
                id="book-category-input"
                type="text"
                className={`form-input ${formErrors.category ? 'error' : ''}`}
                placeholder="e.g. Software Engineering"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                data-testid="book-form-category"
              />
              {formErrors.category && <div className="form-error">{formErrors.category}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="book-isbn-input">ISBN (Unique) *</label>
              <input
                id="book-isbn-input"
                type="text"
                className={`form-input ${formErrors.isbn ? 'error' : ''}`}
                placeholder="978-0132350884"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                data-testid="book-form-isbn"
              />
              {formErrors.isbn && <div className="form-error">{formErrors.isbn}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="book-total-input">Total Copies *</label>
              <input
                id="book-total-input"
                type="number"
                min="1"
                className={`form-input ${formErrors.total_copies ? 'error' : ''}`}
                value={formData.total_copies}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setFormData({
                    ...formData,
                    total_copies: val,
                    available_copies: formMode === 'add' ? val : formData.available_copies,
                  });
                }}
                data-testid="book-form-total-copies"
              />
              {formErrors.total_copies && <div className="form-error">{formErrors.total_copies}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="book-available-input">Available Copies *</label>
              <input
                id="book-available-input"
                type="number"
                min="0"
                className={`form-input ${formErrors.available_copies ? 'error' : ''}`}
                value={formData.available_copies}
                onChange={(e) =>
                  setFormData({ ...formData, available_copies: parseInt(e.target.value, 10) || 0 })
                }
                data-testid="book-form-available-copies"
              />
              {formErrors.available_copies && (
                <div className="form-error">{formErrors.available_copies}</div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Book Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Book Details & Status"
        footer={
          <button
            className="btn btn-secondary"
            onClick={() => setIsDetailOpen(false)}
            data-testid="close-book-details-btn"
          >
            Close
          </button>
        }
      >
        {selectedBook && (
          <div data-testid="book-details-content">
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{selectedBook.book_name}</h2>
              <p style={{ color: 'var(--text-muted)' }}>By {selectedBook.author}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div><strong>Category:</strong> {selectedBook.category}</div>
              <div><strong>ISBN:</strong> {selectedBook.isbn}</div>
              <div><strong>Total Physical Copies:</strong> {selectedBook.total_copies}</div>
              <div><strong>Available Copies:</strong> {selectedBook.available_copies}</div>
              <div><strong>Currently On Loan:</strong> {selectedBook.active_loans ?? (selectedBook.total_copies - selectedBook.available_copies)}</div>
              <div><strong>Added Date:</strong> {new Date(selectedBook.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Book"
        message={`Are you sure you want to delete '${selectedBook?.book_name}'? This action cannot be undone if no loan records exist.`}
        confirmText="Delete Book"
        isDanger={true}
        loading={submitting}
      />
    </div>
  );
};

export default BooksPage;
