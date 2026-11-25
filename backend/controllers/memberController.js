const { query } = require('../config/db');

/**
 * Get all members with optional search and pagination
 * GET /api/members?search=alice&page=1&limit=10
 */
const getMembers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, sort_by = 'id', order = 'ASC' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const allowedSortColumns = ['id', 'full_name', 'email', 'phone_number', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'id';
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const conditions = [];
    const values = [];

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(full_name ILIKE $${values.length} OR email ILIKE $${values.length} OR phone_number ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM members ${whereClause}`, values);
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limitNum);

    const queryValues = [...values, limitNum, offset];
    const dataQuery = `
      SELECT id, full_name, email, phone_number, address, created_at, updated_at
      FROM members
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
      members: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get individual member by ID
 * GET /api/members/:id
 */
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const memberResult = await query('SELECT * FROM members WHERE id = $1', [id]);
    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Member with ID ${id} not found.`,
      });
    }

    // Also get active loans for this member
    const activeLoans = await query(`
      SELECT bi.id AS issue_id, bi.book_id, b.book_name, b.isbn, bi.issue_date, bi.due_date, bi.status
      FROM book_issues bi
      INNER JOIN books b ON bi.book_id = b.id
      WHERE bi.member_id = $1 AND bi.status = 'issued'
      ORDER BY bi.due_date ASC
    `, [id]);

    const member = memberResult.rows[0];
    member.active_loans = activeLoans.rows;

    return res.status(200).json({
      success: true,
      member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new member
 * POST /api/members
 */
const createMember = async (req, res, next) => {
  try {
    const { full_name, email, phone_number, address } = req.body;

    // Check duplicate email
    const existing = await query('SELECT id FROM members WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A member with email '${email.trim()}' already exists.`,
      });
    }

    const insertQuery = `
      INSERT INTO members (full_name, email, phone_number, address)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      full_name.trim(),
      email.trim(),
      phone_number.trim(),
      address ? address.trim() : null,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Member created successfully.',
      member: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing member
 * PUT /api/members/:id
 */
const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone_number, address } = req.body;

    const existing = await query('SELECT * FROM members WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Member with ID ${id} not found.`,
      });
    }

    const currentMember = existing.rows[0];

    // Check email uniqueness collision
    if (email && email.trim().toLowerCase() !== currentMember.email.toLowerCase()) {
      const emailConflict = await query('SELECT id FROM members WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim(), id]);
      if (emailConflict.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `A member with email '${email.trim()}' already exists.`,
        });
      }
    }

    const updateQuery = `
      UPDATE members
      SET full_name = $1,
          email = $2,
          phone_number = $3,
          address = $4
      WHERE id = $5
      RETURNING *
    `;

    const result = await query(updateQuery, [
      full_name ? full_name.trim() : currentMember.full_name,
      email ? email.trim() : currentMember.email,
      phone_number ? phone_number.trim() : currentMember.phone_number,
      address !== undefined ? (address ? address.trim() : null) : currentMember.address,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully.',
      member: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a member
 * DELETE /api/members/:id
 */
const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const memberResult = await query('SELECT * FROM members WHERE id = $1', [id]);
    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Member with ID ${id} not found.`,
      });
    }

    // Check active issues
    const activeIssues = await query(
      'SELECT id FROM book_issues WHERE member_id = $1 AND status = $2',
      [id, 'issued']
    );

    if (activeIssues.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete member. Member currently has ${activeIssues.rows.length} active issued book(s).`,
      });
    }

    // Check historical issues (foreign key constraint check)
    const allIssues = await query('SELECT id FROM book_issues WHERE member_id = $1', [id]);
    if (allIssues.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete member because borrowing history exists in book_issues.',
      });
    }

    await query('DELETE FROM members WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: `Member with ID ${id} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};
