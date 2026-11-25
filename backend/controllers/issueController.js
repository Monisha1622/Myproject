const { query, getClient } = require('../config/db');

/**
 * Get all book issues with filtering, search, and pagination
 * GET /api/issues?status=issued&member_id=1&search=clean&page=1&limit=10
 */
const getIssues = async (req, res, next) => {
  try {
    const { status, member_id, book_id, search, page = 1, limit = 10, sort_by = 'id', order = 'DESC' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const allowedSortColumns = ['id', 'issue_date', 'due_date', 'return_date', 'status', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? `bi.${sort_by}` : 'bi.id';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const conditions = [];
    const values = [];

    if (status && status.trim()) {
      if (status === 'overdue') {
        conditions.push(`bi.status = 'issued' AND bi.due_date < CURRENT_DATE`);
      } else {
        values.push(status.trim());
        conditions.push(`bi.status = $${values.length}`);
      }
    }

    if (member_id) {
      values.push(parseInt(member_id, 10));
      conditions.push(`bi.member_id = $${values.length}`);
    }

    if (book_id) {
      values.push(parseInt(book_id, 10));
      conditions.push(`bi.book_id = $${values.length}`);
    }

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(m.full_name ILIKE $${values.length} OR b.book_name ILIKE $${values.length} OR b.isbn ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) 
      FROM book_issues bi
      INNER JOIN members m ON bi.member_id = m.id
      INNER JOIN books b ON bi.book_id = b.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, values);
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limitNum);

    const queryValues = [...values, limitNum, offset];
    const dataQuery = `
      SELECT 
        bi.id,
        bi.member_id,
        m.full_name AS member_name,
        m.email AS member_email,
        m.phone_number AS member_phone,
        bi.book_id,
        b.book_name,
        b.author AS book_author,
        b.isbn AS book_isbn,
        bi.issue_date,
        bi.due_date,
        bi.return_date,
        bi.status,
        CASE 
          WHEN bi.status = 'issued' AND bi.due_date < CURRENT_DATE THEN true 
          ELSE false 
        END AS is_overdue,
        bi.created_at,
        bi.updated_at
      FROM book_issues bi
      INNER JOIN members m ON bi.member_id = m.id
      INNER JOIN books b ON bi.book_id = b.id
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
      issues: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get individual issue record by ID
 * GET /api/issues/:id
 */
const getIssueById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dataQuery = `
      SELECT 
        bi.id,
        bi.member_id,
        m.full_name AS member_name,
        m.email AS member_email,
        m.phone_number AS member_phone,
        bi.book_id,
        b.book_name,
        b.author AS book_author,
        b.category AS book_category,
        b.isbn AS book_isbn,
        bi.issue_date,
        bi.due_date,
        bi.return_date,
        bi.status,
        CASE 
          WHEN bi.status = 'issued' AND bi.due_date < CURRENT_DATE THEN true 
          ELSE false 
        END AS is_overdue,
        bi.created_at,
        bi.updated_at
      FROM book_issues bi
      INNER JOIN members m ON bi.member_id = m.id
      INNER JOIN books b ON bi.book_id = b.id
      WHERE bi.id = $1
    `;

    const result = await query(dataQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Issue record with ID ${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      issue: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Issue a book to a member (Database Transaction)
 * POST /api/issues
 */
const createIssue = async (req, res, next) => {
  const client = await getClient();

  try {
    const { member_id, book_id, due_date, issue_date } = req.body;

    const memberId = parseInt(member_id, 10);
    const bookId = parseInt(book_id, 10);
    const effectiveIssueDate = issue_date ? issue_date : new Date().toISOString().split('T')[0];

    // Begin PostgreSQL Transaction
    await client.query('BEGIN');

    // 1. Verify Member exists
    const memberCheck = await client.query('SELECT id, full_name, email FROM members WHERE id = $1', [memberId]);
    if (memberCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: `Member with ID ${memberId} does not exist.`,
      });
    }

    // 2. Lock Book row for update and check availability
    const bookCheck = await client.query(
      'SELECT id, book_name, total_copies, available_copies FROM books WHERE id = $1 FOR UPDATE',
      [bookId]
    );

    if (bookCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: `Book with ID ${bookId} does not exist.`,
      });
    }

    const book = bookCheck.rows[0];

    // Business Rule: Only issue books when available copies are greater than zero
    if (book.available_copies <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot issue '${book.book_name}'. All copies are currently issued (0 available).`,
      });
    }

    // 3. Decrement available copies by 1
    const updateBookResult = await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1 RETURNING available_copies',
      [bookId]
    );

    // 4. Create Issue Record
    const insertIssueQuery = `
      INSERT INTO book_issues (member_id, book_id, issue_date, due_date, status)
      VALUES ($1, $2, $3, $4, 'issued')
      RETURNING *
    `;

    const issueResult = await client.query(insertIssueQuery, [
      memberId,
      bookId,
      effectiveIssueDate,
      due_date,
    ]);

    // Commit Transaction
    await client.query('COMMIT');

    const createdIssue = issueResult.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Book issued successfully.',
      issue: {
        ...createdIssue,
        member_name: memberCheck.rows[0].full_name,
        book_name: book.book_name,
        remaining_available_copies: updateBookResult.rows[0].available_copies,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Return an issued book (Database Transaction)
 * PUT /api/issues/:id/return
 */
const returnIssue = async (req, res, next) => {
  const client = await getClient();

  try {
    const { id } = req.params;
    const { return_date } = req.body;
    const effectiveReturnDate = return_date ? return_date : new Date().toISOString().split('T')[0];

    // Begin PostgreSQL Transaction
    await client.query('BEGIN');

    // 1. Lock and retrieve issue record
    const issueCheck = await client.query(
      'SELECT id, member_id, book_id, issue_date, due_date, return_date, status FROM book_issues WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (issueCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: `Issue record with ID ${id} not found.`,
      });
    }

    const currentIssue = issueCheck.rows[0];

    // Business Rule: Do not allow the same issue record to be returned twice
    if (currentIssue.status === 'returned') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `This book has already been returned on ${currentIssue.return_date}.`,
      });
    }

    // Business Rule: return_date must not be earlier than issue_date
    if (new Date(effectiveReturnDate) < new Date(currentIssue.issue_date)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Return date (${effectiveReturnDate}) cannot be earlier than issue date (${currentIssue.issue_date}).`,
      });
    }

    // 2. Update issue status to 'returned'
    const updateIssueQuery = `
      UPDATE book_issues
      SET status = 'returned',
          return_date = $1
      WHERE id = $2
      RETURNING *
    `;
    const updatedIssueResult = await client.query(updateIssueQuery, [effectiveReturnDate, id]);

    // 3. Increment book's available copies by 1
    const updateBookQuery = `
      UPDATE books
      SET available_copies = available_copies + 1
      WHERE id = $1
      RETURNING id, book_name, total_copies, available_copies
    `;
    const bookUpdateResult = await client.query(updateBookQuery, [currentIssue.book_id]);

    // Commit Transaction
    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Book returned successfully.',
      issue: updatedIssueResult.rows[0],
      book: bookUpdateResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  returnIssue,
};
