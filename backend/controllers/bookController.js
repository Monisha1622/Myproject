const { query } = require('../config/db');

/**
 * Get all books with optional search, category filter, and pagination
 * GET /api/books?search=clean&category=Software+Engineering&page=1&limit=10
 */
const getBooks = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 10, sort_by = 'id', order = 'ASC' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Allowed sort columns to avoid SQL injection
    const allowedSortColumns = ['id', 'book_name', 'author', 'category', 'isbn', 'total_copies', 'available_copies', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'id';
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const conditions = [];
    const values = [];

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(book_name ILIKE $${values.length} OR author ILIKE $${values.length} OR isbn ILIKE $${values.length})`);
    }

    if (category && category.trim()) {
      values.push(category.trim());
      conditions.push(`category = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination
    const countResult = await query(`SELECT COUNT(*) FROM books ${whereClause}`, values);
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limitNum);

    // Fetch paginated results
    const queryValues = [...values, limitNum, offset];
    const dataQuery = `
      SELECT id, book_name, author, category, isbn, total_copies, available_copies, created_at, updated_at
      FROM books
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeOrder}
      LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}
    `;

    const result = await query(dataQuery, queryValues);

    return res.status(200).json({
      success: true,
      totalRecords,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      books: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get individual book by ID
 * GET /api/books/:id
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bookResult = await query('SELECT * FROM books WHERE id = $1', [id]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} not found.`,
      });
    }

    // Also get active loan count
    const loanResult = await query(
      'SELECT COUNT(*) FROM book_issues WHERE book_id = $1 AND status = $2',
      [id, 'issued']
    );

    const book = bookResult.rows[0];
    book.active_loans = parseInt(loanResult.rows[0].count, 10);

    return res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new book
 * POST /api/books
 */
const createBook = async (req, res, next) => {
  try {
    const { book_name, author, category, isbn, total_copies, available_copies } = req.body;

    const total = parseInt(total_copies, 10);
    // If available_copies is not specified, default to total_copies
    const available = available_copies !== undefined && available_copies !== null 
      ? parseInt(available_copies, 10) 
      : total;

    // Check unique ISBN beforehand to provide explicit feedback
    const existingIsbn = await query('SELECT id FROM books WHERE isbn = $1', [isbn.trim()]);
    if (existingIsbn.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A book with ISBN '${isbn.trim()}' already exists.`,
      });
    }

    const insertQuery = `
      INSERT INTO books (book_name, author, category, isbn, total_copies, available_copies)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      book_name.trim(),
      author.trim(),
      category.trim(),
      isbn.trim(),
      total,
      available,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Book created successfully.',
      book: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing book
 * PUT /api/books/:id
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { book_name, author, category, isbn, total_copies, available_copies } = req.body;

    // Verify book exists
    const existing = await query('SELECT * FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} not found.`,
      });
    }

    const currentBook = existing.rows[0];

    // Check unique ISBN collision with other books
    if (isbn && isbn.trim() !== currentBook.isbn) {
      const isbnConflict = await query('SELECT id FROM books WHERE isbn = $1 AND id != $2', [isbn.trim(), id]);
      if (isbnConflict.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `A book with ISBN '${isbn.trim()}' already exists.`,
        });
      }
    }

    const newTotal = total_copies !== undefined ? parseInt(total_copies, 10) : currentBook.total_copies;
    
    // Check currently active issued copies to prevent reducing total copies below active loans
    const activeIssuesResult = await query(
      'SELECT COUNT(*) FROM book_issues WHERE book_id = $1 AND status = $2',
      [id, 'issued']
    );
    const activeLoans = parseInt(activeIssuesResult.rows[0].count, 10);

    if (newTotal < activeLoans) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total copies to ${newTotal}. There are currently ${activeLoans} active loans for this book.`,
      });
    }

    let newAvailable;
    if (available_copies !== undefined && available_copies !== null) {
      newAvailable = parseInt(available_copies, 10);
    } else {
      // Calculate available automatically based on new total minus active loans
      newAvailable = newTotal - activeLoans;
    }

    if (newAvailable < 0) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot be negative.',
      });
    }

    if (newAvailable > newTotal) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot exceed total copies.',
      });
    }

    const updateQuery = `
      UPDATE books
      SET book_name = $1,
          author = $2,
          category = $3,
          isbn = $4,
          total_copies = $5,
          available_copies = $6
      WHERE id = $7
      RETURNING *
    `;

    const result = await query(updateQuery, [
      book_name ? book_name.trim() : currentBook.book_name,
      author ? author.trim() : currentBook.author,
      category ? category.trim() : currentBook.category,
      isbn ? isbn.trim() : currentBook.isbn,
      newTotal,
      newAvailable,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully.',
      book: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a book
 * DELETE /api/books/:id
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bookResult = await query('SELECT * FROM books WHERE id = $1', [id]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} not found.`,
      });
    }

    // Check if there are active issues
    const activeIssues = await query(
      'SELECT id FROM book_issues WHERE book_id = $1 AND status = $2',
      [id, 'issued']
    );

    if (activeIssues.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book. There are ${activeIssues.rows.length} active issue records for this book.`,
      });
    }

    // Check if there are historical issues (due to ON DELETE RESTRICT foreign key)
    const allIssues = await query('SELECT id FROM book_issues WHERE book_id = $1', [id]);
    if (allIssues.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book because loan transaction history exists for this book in book_issues.',
      });
    }

    await query('DELETE FROM books WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: `Book with ID ${id} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
